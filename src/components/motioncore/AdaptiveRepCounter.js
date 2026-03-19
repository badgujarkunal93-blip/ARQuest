function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return 0;
  }
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

const EXERCISE_THRESHOLDS = {
  squat: {
    startPhase: 'top',
    targetPhase: 'bottom',
    activationProgress: 0.18,
    completeProgress: 0.72,
    resetProgress: 0.14,
  },
  pushup: {
    startPhase: 'top',
    targetPhase: 'bottom',
    activationProgress: 0.16,
    completeProgress: 0.74,
    resetProgress: 0.12,
  },
  lunge: {
    startPhase: 'top',
    targetPhase: 'bottom',
    activationProgress: 0.14,
    completeProgress: 0.72,
    resetProgress: 0.12,
  },
  jumpingJack: {
    startPhase: 'closed',
    targetPhase: 'open',
    activationProgress: 0.18,
    completeProgress: 0.7,
    resetProgress: 0.16,
  },
};

export function createAdaptiveRepState(exercise) {
  return {
    exercise,
    repCount: 0,
    perfectReps: 0,
    incompleteReps: 0,
    lastRepAt: 0,
    cycleStartedAt: 0,
    peakProgress: 0,
    bottomReached: false,
    recentScores: [],
    repDurations: [],
    baselineDurationMs: 0,
    fatigueIndex: 0,
    fatigueLabel: 'Maintain pace',
    speedDelta: 0,
    currentTempo: 'steady',
    stableReps: 0,
    unstableReps: 0,
    latestEvent: null,
    eventCounter: 0,
    coachMessage: 'Move with control to start tracking reps.',
  };
}

function pushLimited(list, value, limit = 8) {
  return [...list, value].slice(-limit);
}

function buildFatigueState({ repDurations, recentScores, incompleteReps, unstableReps }) {
  const baselineDurationMs = average(repDurations.slice(0, 3));
  const recentDurationMs = average(repDurations.slice(-2));
  const recentScore = average(recentScores.slice(-3));
  const slowdown = baselineDurationMs
    ? clamp((recentDurationMs - baselineDurationMs) / baselineDurationMs, 0, 1.2)
    : 0;
  const qualityDrop = clamp((82 - recentScore) / 34, 0, 1);
  const instability = clamp((incompleteReps + unstableReps * 0.6) / 6, 0, 1);
  const fatigueIndex = clamp((slowdown * 0.46) + (qualityDrop * 0.34) + (instability * 0.2), 0, 1);

  let fatigueLabel = 'Maintain pace';
  if (fatigueIndex >= 0.84) {
    fatigueLabel = 'Stop and recover';
  } else if (fatigueIndex >= 0.62) {
    const repsLeft = Math.max(1, Math.round((1 - fatigueIndex) * 5));
    fatigueLabel = `${repsLeft} reps left before fatigue`;
  } else if (slowdown >= 0.18) {
    fatigueLabel = 'Speed dropping';
  }

  return {
    fatigueIndex,
    fatigueLabel,
    baselineDurationMs,
    speedDelta: slowdown,
    currentTempo: slowdown >= 0.22 ? 'slowing' : slowdown >= 0.1 ? 'watch' : 'steady',
  };
}

function buildCoachMessage({ fatigueLabel, formAnalysis, unstableRep, perfectRep, repCompleted }) {
  if (fatigueLabel === 'Stop and recover') {
    return 'Stop and recover';
  }
  if (fatigueLabel.includes('reps left before fatigue')) {
    return fatigueLabel;
  }
  if (fatigueLabel === 'Speed dropping') {
    return 'Speed dropping';
  }
  if (unstableRep) {
    return formAnalysis.primaryFeedback || 'Unstable form detected';
  }
  if (perfectRep) {
    return 'Good rep';
  }
  if (repCompleted) {
    return 'Rep counted';
  }
  if (formAnalysis.score < 74) {
    return formAnalysis.primaryFeedback || 'Tighten your form';
  }
  return 'Maintain pace';
}

function buildEvent(state, message, type) {
  return {
    id: state.eventCounter + 1,
    type,
    message,
  };
}

export function updateAdaptiveRepCounter(state, { exercise, formAnalysis, matchScore = 0, timestamp = performance.now() }) {
  const thresholds = EXERCISE_THRESHOLDS[exercise];
  if (!thresholds) {
    return createAdaptiveRepState(exercise);
  }

  const previous = state?.exercise === exercise ? state : createAdaptiveRepState(exercise);
  if (!formAnalysis?.isReady) {
    return {
      ...previous,
      coachMessage: 'Move fully into frame to start rep intelligence.',
    };
  }

  const progress = clamp(formAnalysis.phaseProgress ?? 0, 0, 1);
  let nextState = {
    ...previous,
    cycleStartedAt:
      previous.cycleStartedAt || progress > thresholds.activationProgress ? previous.cycleStartedAt || timestamp : 0,
    peakProgress: Math.max(previous.peakProgress, progress),
  };

  if (formAnalysis.phase === thresholds.targetPhase && progress >= thresholds.completeProgress) {
    nextState.bottomReached = true;
    nextState.peakProgress = Math.max(nextState.peakProgress, progress);
  }

  const backAtStart = progress <= thresholds.resetProgress && formAnalysis.phase === thresholds.startPhase;
  if (!nextState.bottomReached || !backAtStart || !nextState.cycleStartedAt) {
    return {
      ...nextState,
      coachMessage: buildCoachMessage({
        fatigueLabel: previous.fatigueLabel,
        formAnalysis,
        unstableRep: false,
        perfectRep: false,
        repCompleted: false,
      }),
    };
  }

  const repDurationMs = Math.max(timestamp - nextState.cycleStartedAt, 250);
  const fullRange = nextState.peakProgress >= thresholds.completeProgress;
  const stableForm = formAnalysis.score >= 78 && matchScore >= 72 && formAnalysis.balance >= 72;
  const perfectRep = fullRange && stableForm && formAnalysis.score >= 84;
  const unstableRep = !stableForm || formAnalysis.score < 72 || matchScore < 68;
  const repCompleted = fullRange;

  nextState = {
    ...nextState,
    repCount: nextState.repCount + (repCompleted ? 1 : 0),
    perfectReps: nextState.perfectReps + (perfectRep ? 1 : 0),
    incompleteReps: nextState.incompleteReps + (!repCompleted ? 1 : 0),
    unstableReps: (nextState.unstableReps || 0) + (unstableRep && repCompleted ? 1 : 0),
    stableReps: (nextState.stableReps || 0) + (perfectRep ? 1 : 0),
    lastRepAt: repCompleted ? timestamp : nextState.lastRepAt,
    recentScores: pushLimited(nextState.recentScores, formAnalysis.score, 8),
    repDurations: repCompleted ? pushLimited(nextState.repDurations, repDurationMs, 8) : nextState.repDurations,
    cycleStartedAt: 0,
    peakProgress: 0,
    bottomReached: false,
  };

  const fatigueState = buildFatigueState({
    repDurations: nextState.repDurations,
    recentScores: nextState.recentScores,
    incompleteReps: nextState.incompleteReps,
    unstableReps: nextState.unstableReps || 0,
  });

  const coachMessage = buildCoachMessage({
    fatigueLabel: fatigueState.fatigueLabel,
    formAnalysis,
    unstableRep,
    perfectRep,
    repCompleted,
  });

  let eventMessage = coachMessage;
  let eventType = 'coach';

  if (!repCompleted) {
    eventMessage = 'Incomplete rep';
    eventType = 'incomplete';
  } else if (fatigueState.fatigueLabel === 'Stop and recover') {
    eventMessage = 'Fatigue detected';
    eventType = 'fatigue';
  } else if (fatigueState.fatigueLabel === 'Speed dropping') {
    eventMessage = 'Speed dropping';
    eventType = 'fatigue';
  } else if (perfectRep) {
    eventMessage = 'Good rep';
    eventType = 'rep';
  } else {
    eventMessage = 'Rep counted';
    eventType = 'rep';
  }

  return {
    ...nextState,
    ...fatigueState,
    coachMessage,
    latestEvent: buildEvent(nextState, eventMessage, eventType),
    eventCounter: nextState.eventCounter + 1,
  };
}
