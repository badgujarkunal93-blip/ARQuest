import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, Play, Pause, Volume2, VolumeX, ChevronDown, Dumbbell, CheckCircle, X, Info } from 'lucide-react';
import PoseTracker from '@/components/motioncore/PoseTracker';
import GhostTrainer from '@/components/motioncore/GhostTrainer';
import MotionCoach from '@/components/motioncore/MotionCoach';
import { EXERCISE_LIBRARY } from '@/components/motioncore/FormScoreEngine';
import { motionSessionService } from '@/services/motionSessionService';

const EXERCISES = Object.values(EXERCISE_LIBRARY);

const VOICE_MESSAGES = {
  'Good rep': 'Good rep!',
  'Rep counted': 'Rep counted.',
  'Lower More': 'Lower more.',
  'Correct Form': 'Correct posture.',
  'Straighten Back': 'Straighten your back.',
  'Knees Too Forward': 'Knees too forward.',
  'Speed dropping': 'Speed is dropping.',
  'Stop and recover': 'Fatigue detected. Stop and recover.',
  'Arms Too Low': 'Raise your arms higher.',
  'Incomplete rep': 'Incomplete rep detected.',
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MotionScreen({ verifyQuest, onQuestVerified }) {
  const [selectedExercise, setSelectedExercise] = useState(
    verifyQuest
      ? EXERCISES.find(e => verifyQuest.title.toLowerCase().includes(e.id)) || EXERCISES[0]
      : EXERCISES[0]
  );
  const [sessionActive, setSessionActive] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [questVerified, setQuestVerified] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const prevRepCountRef = useRef(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const voiceSupportedRef = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const lastSpokenRef = useRef('');
  const lastSpeakAtRef = useRef(0);

  const handleDismissInstructions = () => {
  setShowInstructions(false);
  };

  const speak = useCallback((message) => {
    if (!voiceSupportedRef.current || !voiceEnabled) return;
    const now = performance.now();
    if (now - lastSpeakAtRef.current < 2200) return;
    if (lastSpokenRef.current === message) return;
    const text = VOICE_MESSAGES[message] || message;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; utterance.pitch = 0.92; utterance.volume = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = message;
    lastSpeakAtRef.current = now;
  }, [voiceEnabled]);

  const handleAnalysisChange = useCallback((frame) => {
    setAnalysis(frame);
    if (!frame?.repState) return;
    if (frame.repState.repCount > prevRepCountRef.current) {
      const isPerfect = frame.repState.perfectReps > (analysis?.repState?.perfectReps ?? 0);
      setXpGained(v => v + (isPerfect ? 8 : 5));
      prevRepCountRef.current = frame.repState.repCount;
      if (verifyQuest && !questVerified && frame.repState.repCount >= 10) {
        setQuestVerified(true);
        onQuestVerified?.(verifyQuest.id);
      }
    }
    if (frame.repState.latestEvent) speak(frame.repState.latestEvent.message);
  }, [analysis, speak, verifyQuest, questVerified, onQuestVerified]);

  const handleToggle = useCallback(() => {
    setSessionActive(active => {
      if (!active) {
        startTimeRef.current = Date.now() - elapsed * 1000;
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 500);
      } else {
        clearInterval(timerRef.current);
      }
      return !active;
    });
  }, [elapsed]);

  const handleReset = useCallback(async () => {
    clearInterval(timerRef.current);
    setSessionActive(false);
    const repState = analysis?.repState;
    if (repState?.repCount > 0) {
      await motionSessionService.createSession({
        exercise_type: selectedExercise.id,
        total_reps: repState.repCount,
        perfect_reps: repState.perfectReps || 0,
        duration_seconds: elapsed,
        accuracy_percentage: repState.repCount > 0
          ? Math.round(((repState.perfectReps || 0) / repState.repCount) * 100) : 0,
        xp_earned: xpGained,
      });
    }
    setAnalysis(null);
    setXpGained(0);
    setElapsed(0);
    prevRepCountRef.current = 0;
    setQuestVerified(false);
  }, [analysis, elapsed, selectedExercise.id, xpGained]);

  const formAnalysis = analysis?.formAnalysis || null;
  const repState = analysis?.repState || null;
  const ghostMatch = analysis?.ghostMatch || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
            Motion Core
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            {verifyQuest ? `Verifying: ${verifyQuest.title}` : 'Physical Quest Verification'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Info button to re-show instructions */}
          {!showInstructions && (
            <button
              onClick={() => setShowInstructions(true)}
              style={{
                background: 'var(--color-panel)', border: '1px solid var(--color-border)',
                borderRadius: '12px', padding: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)'
              }}
            >
              <Info size={16} />
            </button>
          )}
          <div style={{
            background: 'var(--color-panel)', border: '1px solid var(--color-border)',
            borderRadius: '14px', padding: '8px 14px',
            fontSize: '15px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.3px'
          }}>
            {formatDuration(elapsed)}
          </div>
        </div>
      </div>

      {/* Instructions Banner */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            style={{
              margin: '0 16px 12px',
              background: '#1a1a2e',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '18px',
              padding: '14px 16px',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Banner header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>
                  How to use Motion Core
                </span>
              </div>
              <button
                onClick={handleDismissInstructions}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '2px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { step: '1', text: 'Select your exercise from the dropdown' },
                { step: '2', text: 'Press Start and allow camera access' },
                { step: '3', text: 'Stand back so your full body is visible' },
                { step: '4', text: 'Perform your reps — skeleton tracks automatically' },
                { step: '5', text: 'Press Reset to save your session to Progress' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: '#a855f7',
                  }}>
                    {item.step}
                  </div>
                  <span style={{ fontSize: '12px', color: '#d4d4d4', lineHeight: 1.4 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Warning */}
            <div style={{
              marginTop: '12px', padding: '9px 12px', borderRadius: '12px',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, lineHeight: 1.4 }}>
                Always press Reset after your session to save reps to Progress!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest Verified Banner */}
      <AnimatePresence>
        {questVerified && (
          <motion.div
            style={{
              margin: '0 16px 12px',
              background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)',
              borderRadius: '16px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <CheckCircle size={18} color="var(--color-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>
              Quest Verified by Motion Core! 🎉
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Exercise Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSelector(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '13px 16px', borderRadius: '16px',
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
            }}
          >
            <Dumbbell size={16} color="var(--color-accent)" />
            <span style={{ flex: 1, textAlign: 'left' }}>{selectedExercise.label}</span>
            <ChevronDown size={14} color="var(--color-text-muted)" />
          </button>
          <AnimatePresence>
            {showSelector && (
              <motion.div
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
                  background: 'var(--color-panel)', border: '1px solid var(--color-border)',
                  borderRadius: '16px', overflow: 'hidden'
                }}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              >
                {EXERCISES.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => { setSelectedExercise(ex); setShowSelector(false); }}
                    style={{
                      width: '100%', padding: '13px 16px', border: 'none', textAlign: 'left',
                      background: selectedExercise.id === ex.id ? 'var(--color-accent-dim)' : 'transparent',
                      color: selectedExercise.id === ex.id ? 'var(--color-accent)' : 'var(--color-text)',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Camera */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <PoseTracker
            exercise={selectedExercise.id}
            active={sessionActive}
            countingEnabled={sessionActive}
            onAnalysisChange={handleAnalysisChange}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleToggle}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px', borderRadius: '16px', border: 'none',
              background: sessionActive ? 'var(--color-danger)' : 'var(--color-accent)',
              color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            {sessionActive ? <Pause size={18} /> : <Play size={18} />}
            {sessionActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '14px 18px', borderRadius: '16px',
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '14px', fontWeight: 600
            }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              padding: '14px 18px', borderRadius: '16px',
              background: voiceEnabled ? 'var(--color-accent-dim)' : 'var(--color-panel)',
              border: `1px solid ${voiceEnabled ? 'var(--color-border-accent)' : 'var(--color-border)'}`,
              color: voiceEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Reps', value: repState?.repCount ?? 0, emoji: '💪' },
            { label: 'Perfect', value: repState?.perfectReps ?? 0, emoji: '⭐' },
            { label: 'XP', value: `+${xpGained}`, emoji: '⚡' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              borderRadius: '16px', padding: '14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>{stat.emoji}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.5px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Form Score */}
        {formAnalysis && (
          <motion.div
            style={{
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              borderRadius: '18px', padding: '16px'
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Form Score</span>
              <span style={{
                fontSize: '20px', fontWeight: 800,
                color: formAnalysis.score >= 80 ? 'var(--color-success)' : formAnalysis.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
              }}>
                {formAnalysis.score}%
              </span>
            </div>
            {[
              { label: 'Posture', value: formAnalysis.posture ?? 0 },
              { label: 'Depth', value: formAnalysis.depth ?? 0 },
              { label: 'Balance', value: formAnalysis.balance ?? 0 },
            ].map(sub => (
              <div key={sub.label} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sub.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sub.value}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                  <motion.div
                    style={{
                      height: '100%', borderRadius: '99px',
                      background: sub.value >= 80 ? 'var(--color-success)' : sub.value >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'
                    }}
                    animate={{ width: `${sub.value}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            ))}
            <div style={{
              marginTop: '10px', padding: '8px 12px', borderRadius: '10px',
              background: formAnalysis.primaryFeedback === 'Correct Form' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${formAnalysis.primaryFeedback === 'Correct Form' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              fontSize: '12px', fontWeight: 600,
              color: formAnalysis.primaryFeedback === 'Correct Form' ? 'var(--color-success)' : 'var(--color-danger)'
            }}>
              {formAnalysis.primaryFeedback || 'Awaiting movement...'}
            </div>
          </motion.div>
        )}

        {/* Ghost Trainer */}
        <GhostTrainer
          matchScore={ghostMatch?.score ?? 0}
          feedback={ghostMatch?.feedback || 'Awaiting alignment...'}
          phase={formAnalysis?.phase}
        />

        {/* Motion Coach */}
        <MotionCoach
          exerciseLabel={selectedExercise.label}
          formAnalysis={formAnalysis}
          repState={repState}
          ghostMatch={ghostMatch}
          voiceEnabled={voiceEnabled}
          voiceSupported={voiceSupportedRef.current}
        />

      </div>
    </div>
  );
}