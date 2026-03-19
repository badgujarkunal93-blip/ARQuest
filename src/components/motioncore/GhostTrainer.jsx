import { motion } from 'framer-motion';
import { Activity, Layers3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import { LANDMARK_INDEX, getDistance, getMidpoint } from '@/components/motioncore/FormScoreEngine';

export const GHOST_CONNECTIONS = [
  [LANDMARK_INDEX.leftShoulder, LANDMARK_INDEX.rightShoulder],
  [LANDMARK_INDEX.leftShoulder, LANDMARK_INDEX.leftElbow],
  [LANDMARK_INDEX.leftElbow, LANDMARK_INDEX.leftWrist],
  [LANDMARK_INDEX.rightShoulder, LANDMARK_INDEX.rightElbow],
  [LANDMARK_INDEX.rightElbow, LANDMARK_INDEX.rightWrist],
  [LANDMARK_INDEX.leftShoulder, LANDMARK_INDEX.leftHip],
  [LANDMARK_INDEX.rightShoulder, LANDMARK_INDEX.rightHip],
  [LANDMARK_INDEX.leftHip, LANDMARK_INDEX.rightHip],
  [LANDMARK_INDEX.leftHip, LANDMARK_INDEX.leftKnee],
  [LANDMARK_INDEX.leftKnee, LANDMARK_INDEX.leftAnkle],
  [LANDMARK_INDEX.rightHip, LANDMARK_INDEX.rightKnee],
  [LANDMARK_INDEX.rightKnee, LANDMARK_INDEX.rightAnkle],
  [LANDMARK_INDEX.leftAnkle, LANDMARK_INDEX.leftFoot],
  [LANDMARK_INDEX.rightAnkle, LANDMARK_INDEX.rightFoot],
];

const BASE_TEMPLATE = {
  [LANDMARK_INDEX.leftShoulder]: { x: -0.18, y: -0.48 },
  [LANDMARK_INDEX.rightShoulder]: { x: 0.18, y: -0.48 },
  [LANDMARK_INDEX.leftElbow]: { x: -0.24, y: -0.16 },
  [LANDMARK_INDEX.rightElbow]: { x: 0.24, y: -0.16 },
  [LANDMARK_INDEX.leftWrist]: { x: -0.24, y: 0.12 },
  [LANDMARK_INDEX.rightWrist]: { x: 0.24, y: 0.12 },
  [LANDMARK_INDEX.leftHip]: { x: -0.13, y: 0 },
  [LANDMARK_INDEX.rightHip]: { x: 0.13, y: 0 },
  [LANDMARK_INDEX.leftKnee]: { x: -0.14, y: 0.42 },
  [LANDMARK_INDEX.rightKnee]: { x: 0.14, y: 0.42 },
  [LANDMARK_INDEX.leftAnkle]: { x: -0.15, y: 0.84 },
  [LANDMARK_INDEX.rightAnkle]: { x: 0.15, y: 0.84 },
  [LANDMARK_INDEX.leftFoot]: { x: -0.2, y: 0.92 },
  [LANDMARK_INDEX.rightFoot]: { x: 0.2, y: 0.92 },
};

const GHOST_TEMPLATES = {
  squat: {
    start: BASE_TEMPLATE,
    target: {
      [LANDMARK_INDEX.leftShoulder]: { x: -0.2, y: -0.34 },
      [LANDMARK_INDEX.rightShoulder]: { x: 0.2, y: -0.34 },
      [LANDMARK_INDEX.leftElbow]: { x: -0.3, y: -0.08 },
      [LANDMARK_INDEX.rightElbow]: { x: 0.3, y: -0.08 },
      [LANDMARK_INDEX.leftWrist]: { x: -0.3, y: 0.15 },
      [LANDMARK_INDEX.rightWrist]: { x: 0.3, y: 0.15 },
      [LANDMARK_INDEX.leftHip]: { x: -0.16, y: 0.1 },
      [LANDMARK_INDEX.rightHip]: { x: 0.16, y: 0.1 },
      [LANDMARK_INDEX.leftKnee]: { x: -0.22, y: 0.44 },
      [LANDMARK_INDEX.rightKnee]: { x: 0.22, y: 0.44 },
      [LANDMARK_INDEX.leftAnkle]: { x: -0.24, y: 0.84 },
      [LANDMARK_INDEX.rightAnkle]: { x: 0.24, y: 0.84 },
      [LANDMARK_INDEX.leftFoot]: { x: -0.26, y: 0.94 },
      [LANDMARK_INDEX.rightFoot]: { x: 0.26, y: 0.94 },
    },
  },
  pushup: {
    start: {
      [LANDMARK_INDEX.leftShoulder]: { x: -0.36, y: -0.12 },
      [LANDMARK_INDEX.rightShoulder]: { x: 0.36, y: -0.08 },
      [LANDMARK_INDEX.leftElbow]: { x: -0.15, y: -0.02 },
      [LANDMARK_INDEX.rightElbow]: { x: 0.18, y: 0.02 },
      [LANDMARK_INDEX.leftWrist]: { x: -0.02, y: 0.14 },
      [LANDMARK_INDEX.rightWrist]: { x: 0.12, y: 0.16 },
      [LANDMARK_INDEX.leftHip]: { x: -0.06, y: 0.02 },
      [LANDMARK_INDEX.rightHip]: { x: 0.08, y: 0.04 },
      [LANDMARK_INDEX.leftKnee]: { x: 0.24, y: 0.04 },
      [LANDMARK_INDEX.rightKnee]: { x: 0.28, y: 0.08 },
      [LANDMARK_INDEX.leftAnkle]: { x: 0.44, y: 0.06 },
      [LANDMARK_INDEX.rightAnkle]: { x: 0.48, y: 0.1 },
      [LANDMARK_INDEX.leftFoot]: { x: 0.5, y: 0.1 },
      [LANDMARK_INDEX.rightFoot]: { x: 0.54, y: 0.14 },
    },
    target: {
      [LANDMARK_INDEX.leftShoulder]: { x: -0.3, y: -0.02 },
      [LANDMARK_INDEX.rightShoulder]: { x: 0.28, y: -0.02 },
      [LANDMARK_INDEX.leftElbow]: { x: -0.14, y: 0.14 },
      [LANDMARK_INDEX.rightElbow]: { x: 0.16, y: 0.14 },
      [LANDMARK_INDEX.leftWrist]: { x: -0.04, y: 0.2 },
      [LANDMARK_INDEX.rightWrist]: { x: 0.08, y: 0.2 },
      [LANDMARK_INDEX.leftHip]: { x: -0.05, y: 0.08 },
      [LANDMARK_INDEX.rightHip]: { x: 0.08, y: 0.08 },
      [LANDMARK_INDEX.leftKnee]: { x: 0.24, y: 0.08 },
      [LANDMARK_INDEX.rightKnee]: { x: 0.28, y: 0.12 },
      [LANDMARK_INDEX.leftAnkle]: { x: 0.44, y: 0.08 },
      [LANDMARK_INDEX.rightAnkle]: { x: 0.48, y: 0.12 },
      [LANDMARK_INDEX.leftFoot]: { x: 0.5, y: 0.12 },
      [LANDMARK_INDEX.rightFoot]: { x: 0.54, y: 0.16 },
    },
  },
  lunge: {
    start: BASE_TEMPLATE,
    target: {
      [LANDMARK_INDEX.leftShoulder]: { x: -0.18, y: -0.44 },
      [LANDMARK_INDEX.rightShoulder]: { x: 0.18, y: -0.44 },
      [LANDMARK_INDEX.leftElbow]: { x: -0.28, y: -0.16 },
      [LANDMARK_INDEX.rightElbow]: { x: 0.28, y: -0.16 },
      [LANDMARK_INDEX.leftWrist]: { x: -0.28, y: 0.12 },
      [LANDMARK_INDEX.rightWrist]: { x: 0.28, y: 0.12 },
      [LANDMARK_INDEX.leftHip]: { x: -0.14, y: 0.02 },
      [LANDMARK_INDEX.rightHip]: { x: 0.14, y: 0.02 },
      [LANDMARK_INDEX.leftKnee]: { x: -0.3, y: 0.46 },
      [LANDMARK_INDEX.rightKnee]: { x: 0.24, y: 0.38 },
      [LANDMARK_INDEX.leftAnkle]: { x: -0.34, y: 0.84 },
      [LANDMARK_INDEX.rightAnkle]: { x: 0.12, y: 0.84 },
      [LANDMARK_INDEX.leftFoot]: { x: -0.38, y: 0.94 },
      [LANDMARK_INDEX.rightFoot]: { x: 0.18, y: 0.94 },
    },
  },
  jumpingJack: {
    start: BASE_TEMPLATE,
    target: {
      [LANDMARK_INDEX.leftShoulder]: { x: -0.18, y: -0.48 },
      [LANDMARK_INDEX.rightShoulder]: { x: 0.18, y: -0.48 },
      [LANDMARK_INDEX.leftElbow]: { x: -0.4, y: -0.7 },
      [LANDMARK_INDEX.rightElbow]: { x: 0.4, y: -0.7 },
      [LANDMARK_INDEX.leftWrist]: { x: -0.16, y: -0.96 },
      [LANDMARK_INDEX.rightWrist]: { x: 0.16, y: -0.96 },
      [LANDMARK_INDEX.leftHip]: { x: -0.14, y: 0.02 },
      [LANDMARK_INDEX.rightHip]: { x: 0.14, y: 0.02 },
      [LANDMARK_INDEX.leftKnee]: { x: -0.34, y: 0.42 },
      [LANDMARK_INDEX.rightKnee]: { x: 0.34, y: 0.42 },
      [LANDMARK_INDEX.leftAnkle]: { x: -0.46, y: 0.86 },
      [LANDMARK_INDEX.rightAnkle]: { x: 0.46, y: 0.86 },
      [LANDMARK_INDEX.leftFoot]: { x: -0.5, y: 0.96 },
      [LANDMARK_INDEX.rightFoot]: { x: 0.5, y: 0.96 },
    },
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function createGhostArray() {
  return Array.from({ length: 33 }, () => null);
}

function mirrorTemplate(template) {
  const mirrored = {};
  Object.entries(template).forEach(([key, point]) => {
    mirrored[key] = { x: -point.x, y: point.y };
  });
  return mirrored;
}

function interpolateTemplate(startTemplate, endTemplate, amount) {
  const merged = {};
  const indexes = new Set([...Object.keys(startTemplate), ...Object.keys(endTemplate)]);
  indexes.forEach((index) => {
    const start = startTemplate[index] || endTemplate[index];
    const end = endTemplate[index] || startTemplate[index];
    merged[index] = {
      x: lerp(start.x, end.x, amount),
      y: lerp(start.y, end.y, amount),
    };
  });
  return merged;
}

export function buildGhostSkeleton({ exercise, progress = 0, referenceLandmarks, activeSide = 'left' }) {
  const templates = GHOST_TEMPLATES[exercise] || GHOST_TEMPLATES.squat;
  const amount = clamp(progress, 0, 1);
  const startTemplate = templates.start;
  let targetTemplate = templates.target;

  if (exercise === 'lunge' && activeSide === 'right') {
    targetTemplate = mirrorTemplate(targetTemplate);
  }

  const template = interpolateTemplate(startTemplate, targetTemplate, amount);
  const ghost = createGhostArray();

  const leftShoulder = referenceLandmarks?.[LANDMARK_INDEX.leftShoulder];
  const rightShoulder = referenceLandmarks?.[LANDMARK_INDEX.rightShoulder];
  const leftHip = referenceLandmarks?.[LANDMARK_INDEX.leftHip];
  const rightHip = referenceLandmarks?.[LANDMARK_INDEX.rightHip];
  const leftAnkle = referenceLandmarks?.[LANDMARK_INDEX.leftAnkle];
  const rightAnkle = referenceLandmarks?.[LANDMARK_INDEX.rightAnkle];

  const shoulderCenter = getMidpoint(leftShoulder, rightShoulder);
  const hipCenter = getMidpoint(leftHip, rightHip);
  const center = {
    x: (shoulderCenter.x + hipCenter.x) / 2 || 0.5,
    y: hipCenter.y || 0.52,
  };
  const shoulderWidth = getDistance(leftShoulder, rightShoulder) || 0.18;
  const bodyHeight = Math.max(
    average([
      Math.abs((leftAnkle?.y ?? 0.92) - (leftShoulder?.y ?? 0.22)),
      Math.abs((rightAnkle?.y ?? 0.92) - (rightShoulder?.y ?? 0.22)),
    ]),
    0.55
  );
  const scaleX = shoulderWidth * (exercise === 'pushup' ? 1.8 : 2.4);
  const scaleY = bodyHeight * (exercise === 'pushup' ? 0.7 : 1.04);

  Object.entries(template).forEach(([index, point]) => {
    ghost[index] = {
      x: clamp(center.x + point.x * scaleX, 0.04, 0.96),
      y: clamp(center.y + point.y * scaleY, 0.04, 0.96),
      z: 0,
      visibility: 0.99,
    };
  });

  return ghost;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return 0;
  }
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

function averagePoint(points) {
  return {
    x: average(points.map((point) => point?.dx ?? 0)),
    y: average(points.map((point) => point?.dy ?? 0)),
  };
}

function getExerciseIndices(exercise) {
  if (exercise === 'pushup') {
    return [
      LANDMARK_INDEX.leftShoulder,
      LANDMARK_INDEX.rightShoulder,
      LANDMARK_INDEX.leftElbow,
      LANDMARK_INDEX.rightElbow,
      LANDMARK_INDEX.leftWrist,
      LANDMARK_INDEX.rightWrist,
      LANDMARK_INDEX.leftHip,
      LANDMARK_INDEX.rightHip,
      LANDMARK_INDEX.leftAnkle,
      LANDMARK_INDEX.rightAnkle,
    ];
  }

  return [
    LANDMARK_INDEX.leftShoulder,
    LANDMARK_INDEX.rightShoulder,
    LANDMARK_INDEX.leftWrist,
    LANDMARK_INDEX.rightWrist,
    LANDMARK_INDEX.leftHip,
    LANDMARK_INDEX.rightHip,
    LANDMARK_INDEX.leftKnee,
    LANDMARK_INDEX.rightKnee,
    LANDMARK_INDEX.leftAnkle,
    LANDMARK_INDEX.rightAnkle,
  ];
}

export function calculateGhostMatch({ exercise, userLandmarks, ghostLandmarks }) {
  if (!userLandmarks?.length || !ghostLandmarks?.length) {
    return {
      score: 0,
      feedback: 'Ghost trainer waiting for a full-body lock.',
      alignmentStatus: 'Searching',
    };
  }

  const trackedIndices = getExerciseIndices(exercise);
  const bodyScale = Math.max(
    getDistance(userLandmarks[LANDMARK_INDEX.leftShoulder], userLandmarks[LANDMARK_INDEX.rightShoulder]) * 2.4,
    getDistance(userLandmarks[LANDMARK_INDEX.leftHip], userLandmarks[LANDMARK_INDEX.leftAnkle]) * 0.8,
    0.18
  );

  const deviations = trackedIndices
    .map((index) => {
      const user = userLandmarks[index];
      const ghost = ghostLandmarks[index];
      if (!user || !ghost) {
        return null;
      }
      return {
        index,
        dx: user.x - ghost.x,
        dy: user.y - ghost.y,
        distance: Math.hypot(user.x - ghost.x, user.y - ghost.y),
      };
    })
    .filter(Boolean);

  const meanDeviation = average(deviations.map((item) => item.distance));
  const score = Math.round(clamp(100 - (meanDeviation / bodyScale) * 110, 0, 100));

  const leftArm = averagePoint([
    deviations.find((item) => item.index === LANDMARK_INDEX.leftWrist),
    deviations.find((item) => item.index === LANDMARK_INDEX.leftElbow),
  ]);
  const rightArm = averagePoint([
    deviations.find((item) => item.index === LANDMARK_INDEX.rightWrist),
    deviations.find((item) => item.index === LANDMARK_INDEX.rightElbow),
  ]);
  const torso = averagePoint([
    deviations.find((item) => item.index === LANDMARK_INDEX.leftShoulder),
    deviations.find((item) => item.index === LANDMARK_INDEX.rightShoulder),
    deviations.find((item) => item.index === LANDMARK_INDEX.leftHip),
    deviations.find((item) => item.index === LANDMARK_INDEX.rightHip),
  ]);

  let feedback = 'Alignment Good';
  if (score < 76 && average([leftArm.y, rightArm.y]) > 0.035) {
    feedback = 'Arms Too Low';
  } else if (score < 76 && Math.abs(torso.x) + Math.abs(torso.y) > 0.07) {
    feedback = 'Back Misaligned';
  } else if (score < 70) {
    feedback = 'Shift into the ghost';
  }

  return {
    score,
    feedback,
    alignmentStatus: score >= 84 ? 'Locked' : score >= 68 ? 'Close' : 'Correcting',
  };
}

function formatPhaseLabel(phase) {
  if (!phase) {
    return 'Guide Sync';
  }

  if (phase === 'open') {
    return 'Open Phase';
  }
  if (phase === 'closed') {
    return 'Closed Phase';
  }
  if (phase === 'bottom') {
    return 'Power Phase';
  }
  if (phase === 'top') {
    return 'Reset Phase';
  }
  return 'Transition Phase';
}

export default function GhostTrainer({ matchScore = 0, feedback = 'Awaiting alignment...', phase = 'transition' }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers3 size={16} style={{ color: 'var(--color-accent)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
          Ghost Skeleton Matching
        </h3>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-4">
        <motion.div
          className="motioncore-ring-score"
          animate={{ boxShadow: [`0 0 0 rgba(61,242,193,0)`, `0 0 24px rgba(61,242,193,0.18)`, `0 0 0 rgba(61,242,193,0)`] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>{matchScore}%</span>
        </motion.div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--color-accent)' }}>
            {formatPhaseLabel(phase)}
          </p>
          <p className="text-sm font-semibold leading-6" style={{ color: 'var(--color-text)' }}>
            {feedback}
          </p>
          <p className="text-xs leading-5" style={{ color: 'var(--color-text-muted)' }}>
            Transparent guide bones show the target line. Keep your live skeleton stacked on the ghost to raise match quality.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(5, 15, 23, 0.76)' }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--color-text-muted)' }}>
          <Activity size={12} />
          Live alignment feedback
        </div>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-text)' }}>
          {matchScore >= 84 ? 'Alignment Good' : feedback}
        </p>
      </div>
    </Card>
  );
}
