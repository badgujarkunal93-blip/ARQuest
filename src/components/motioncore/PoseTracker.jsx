import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CameraOff, ShieldAlert } from 'lucide-react';
import SkeletonOverlay from '@/components/motioncore/SkeletonOverlay';
import { createAdaptiveRepState, updateAdaptiveRepCounter } from '@/components/motioncore/AdaptiveRepCounter';
import { evaluateExerciseForm } from '@/components/motioncore/FormScoreEngine';
import { buildGhostSkeleton, calculateGhostMatch } from '@/components/motioncore/GhostTrainer';

// Load MediaPipe from CDN
const loadMediaPipe = () => {
  return Promise.all([
    import('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.min.js').catch(() => {
      // CDN failed, try alternative
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.min.js';
      return new Promise((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }),
    import('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js').catch(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.min.js';
      return new Promise((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }),
  ]);
};

const INITIAL_FRAME = {
  status: 'booting',
  error: '',
  fps: 0,
  poseDetected: false,
  landmarks: [],
  ghostLandmarks: [],
  formAnalysis: null,
  repState: createAdaptiveRepState('squat'),
  ghostMatch: {
    score: 0,
    feedback: 'Ghost trainer waiting for a body lock.',
    alignmentStatus: 'Searching',
  },
};

function smoothLandmarks(previous, next, blend = 0.62) {
  if (!next?.length) {
    return [];
  }

  if (!previous?.length) {
    return next;
  }

  return next.map((landmark, index) => {
    const last = previous[index];
    if (!last) {
      return landmark;
    }

    return {
      x: (last.x * blend) + (landmark.x * (1 - blend)),
      y: (last.y * blend) + (landmark.y * (1 - blend)),
      z: ((last.z ?? 0) * blend) + ((landmark.z ?? 0) * (1 - blend)),
      visibility: Math.max(landmark.visibility ?? 0, last.visibility ?? 0),
    };
  });
}

export default function PoseTracker({
  exercise,
  active = true,
  countingEnabled = true,
  onAnalysisChange,
}) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const poseRef = useRef(null);
  const poseBusyRef = useRef(false);
  const smoothedLandmarksRef = useRef([]);
  const repStateRef = useRef(createAdaptiveRepState(exercise));
  const onAnalysisChangeRef = useRef(onAnalysisChange);
  const lastFpsFrameAtRef = useRef(0);
  const lastUiEmitAtRef = useRef(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [frame, setFrame] = useState({
    ...INITIAL_FRAME,
    repState: createAdaptiveRepState(exercise),
  });

  useEffect(() => {
    onAnalysisChangeRef.current = onAnalysisChange;
  }, [onAnalysisChange]);

  useEffect(() => {
    repStateRef.current = createAdaptiveRepState(exercise);
    setFrame((current) => ({
      ...current,
      repState: createAdaptiveRepState(exercise),
    }));
  }, [exercise]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setFrame((current) => ({
        ...current,
        status: 'standby',
        poseDetected: false,
      }));
      return undefined;
    }

    const video = videoRef.current;
    if (!video || typeof window === 'undefined') {
      return undefined;
    }

    let cancelled = false;

    const emitAnalysis = (nextFrame) => {
      const now = performance.now();
      if (now - lastUiEmitAtRef.current < 90) {
        return;
      }

      lastUiEmitAtRef.current = now;
      setFrame(nextFrame);
      onAnalysisChangeRef.current?.(nextFrame);
    };

    const bootTracker = async () => {
      try {
        // Load MediaPipe from CDN
        await loadMediaPipe();

        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });

        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(resolve);
          };
        });

        if (cancelled) return;

        // Access MediaPipe from window global
        const PoseModule = window.Pose || (await import('@mediapipe/pose')).Pose;
        
        const pose = new PoseModule({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          enableSegmentation: false,
          selfieMode: true,
        });

        pose.onResults((results) => {
          if (cancelled) {
            return;
          }

          const now = performance.now();
          const lastFrameAt = lastFpsFrameAtRef.current || now;
          const fps = lastFrameAt === now ? 0 : Math.round(1000 / Math.max(now - lastFrameAt, 1));
          lastFpsFrameAtRef.current = now;

          if (!results.poseLandmarks?.length) {
            const nextFrame = {
              status: 'live',
              error: '',
              fps,
              poseDetected: false,
              landmarks: [],
              ghostLandmarks: [],
              formAnalysis: {
                isReady: false,
                primaryFeedback: 'Body Not Detected',
                score: 0,
                posture: 0,
                depth: 0,
                balance: 0,
                phase: 'searching',
              },
              repState: repStateRef.current,
              ghostMatch: {
                score: 0,
                feedback: 'Ghost trainer waiting for a body lock.',
                alignmentStatus: 'Searching',
              },
            };
            emitAnalysis(nextFrame);
            return;
          }

          const avgConfidence = results.poseLandmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / results.poseLandmarks.length;

          if (avgConfidence < 0.5) {
            const nextFrame = {
              status: 'live',
              error: '',
              fps,
              poseDetected: false,
              landmarks: [],
              ghostLandmarks: [],
              formAnalysis: {
                isReady: false,
                primaryFeedback: 'Adjust Position',
                score: 0,
                posture: 0,
                depth: 0,
                balance: 0,
                phase: 'searching',
              },
              repState: repStateRef.current,
              ghostMatch: {
                score: 0,
                feedback: 'Confidence too low. Adjust your position.',
                alignmentStatus: 'Searching',
              },
            };
            emitAnalysis(nextFrame);
            return;
          }

          const smoothedLandmarks = smoothLandmarks(smoothedLandmarksRef.current, results.poseLandmarks);
          smoothedLandmarksRef.current = smoothedLandmarks;

          const formAnalysis = evaluateExerciseForm(smoothedLandmarks, exercise);
          const ghostLandmarks = buildGhostSkeleton({
            exercise,
            progress: formAnalysis.phaseProgress ?? 0,
            referenceLandmarks: smoothedLandmarks,
            activeSide: formAnalysis.activeSide || 'left',
          });
          const ghostMatch = calculateGhostMatch({
            exercise,
            userLandmarks: smoothedLandmarks,
            ghostLandmarks,
          });

          const repState = countingEnabled
            ? updateAdaptiveRepCounter(repStateRef.current, {
                exercise,
                formAnalysis,
                matchScore: ghostMatch.score,
                timestamp: now,
              })
            : {
                ...repStateRef.current,
                coachMessage: formAnalysis.primaryFeedback || 'Session paused. Resume when ready.',
              };
          repStateRef.current = repState;

          emitAnalysis({
            status: 'live',
            error: '',
            fps,
            poseDetected: Boolean(formAnalysis.isReady),
            landmarks: smoothedLandmarks,
            ghostLandmarks,
            formAnalysis,
            repState,
            ghostMatch,
          });
        });

        await pose.initialize();
        poseRef.current = pose;

        const frameInterval = setInterval(async () => {
          if (poseBusyRef.current || cancelled || !video.videoWidth) {
            return;
          }

          poseBusyRef.current = true;
          try {
            await pose.send({ image: video });
          } catch (frameError) {
            console.warn('Frame error:', frameError.message);
          } finally {
            poseBusyRef.current = false;
          }
        }, 100);

        if (!cancelled) {
          setFrame((current) => ({
            ...current,
            status: 'live',
            error: '',
          }));
        }

        return () => {
          clearInterval(frameInterval);
        };
      } catch (error) {
        if (cancelled) {
          return;
        }

        let errorMessage = 'Unable to start pose tracking.';

        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a webcam.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is in use by another application.';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        const nextFrame = {
          ...INITIAL_FRAME,
          status: 'error',
          error: errorMessage,
          repState: repStateRef.current,
        };
        setFrame(nextFrame);
        onAnalysisChangeRef.current?.(nextFrame);
      }
    };

    void bootTracker();

    return () => {
      cancelled = true;
      poseBusyRef.current = false;
      smoothedLandmarksRef.current = [];
      const pose = poseRef.current;
      const stream = videoRef.current?.srcObject;

      poseRef.current = null;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      void pose?.close().catch(() => {});
    };
  }, [active, countingEnabled, exercise]);

  const stageStatus = useMemo(() => {
    if (frame.status === 'error') {
      return frame.error;
    }
    if (!active) {
      return 'Camera paused';
    }
    if (!frame.poseDetected) {
      return 'Searching for full body';
    }
    return 'Body lock active';
  }, [active, frame.error, frame.poseDetected, frame.status]);

  return (
    <div ref={stageRef} className="motioncore-stage">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 z-[1] h-full w-full object-cover scale-x-[-1]"
      />

      <SkeletonOverlay
        width={viewport.width}
        height={viewport.height}
        landmarks={frame.landmarks}
        ghostLandmarks={frame.ghostLandmarks}
        poseDetected={frame.poseDetected}
      />

      <div className="motioncore-stage__grid" aria-hidden="true" />

      <div className="motioncore-stage__chips">
        <span className="motioncore-stage__chip">
          <Activity size={12} />
          {frame.fps ? `${frame.fps} FPS` : 'Syncing'}
        </span>
        <span className="motioncore-stage__chip">
          {exercise === 'jumpingJack' ? 'Jumping Jack' : exercise.charAt(0).toUpperCase() + exercise.slice(1)}
        </span>
      </div>

      <div className="motioncore-stage__status">
        <span className={`motioncore-stage__status-pill ${frame.poseDetected ? 'motioncore-stage__status-pill-live' : ''}`}>
          {frame.poseDetected ? <Activity size={12} /> : frame.status === 'error' ? <ShieldAlert size={12} /> : <CameraOff size={12} />}
          {stageStatus}
        </span>
      </div>

      {!frame.poseDetected ? (
        <div className="motioncore-stage__empty">
          <p className="motioncore-stage__empty-title">Motion scan calibrating</p>
          <p className="motioncore-stage__empty-copy">
            Stand back until your full body is visible. The live skeleton and ghost guide will appear once the pose lock is stable.
          </p>
        </div>
      ) : null}
    </div>
  );
}

