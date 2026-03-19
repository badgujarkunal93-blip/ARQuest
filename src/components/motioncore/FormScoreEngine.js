const LANDMARK_INDEX = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFoot: 31,
  rightFoot: 32,
};

export const EXERCISE_LIBRARY = {
  squat: {
    id: 'squat',
    label: 'Squats',
    shortLabel: 'Squat',
    cue: 'Sit back, keep your chest tall, and drive through the floor.',
  },
  pushup: {
    id: 'pushup',
    label: 'Push-ups',
    shortLabel: 'Push-up',
    cue: 'Lock the plank, lower with control, and press evenly.',
  },
  lunge: {
    id: 'lunge',
    label: 'Lunges',
    shortLabel: 'Lunge',
    cue: 'Step long, drop straight down, and stay stacked through the hips.',
  },
  jumpingJack: {
    id: 'jumpingJack',
    label: 'Jumping Jacks',
    shortLabel: 'Jumping Jack',
    cue: 'Stay springy, open wide, and keep the rhythm smooth.',
  },
};

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

function getLandmark(landmarks, key) {
  return landmarks?.[LANDMARK_INDEX[key]] || null;
}

function hasVisibility(landmark, minimum = 0.35) {
  return Boolean(landmark) && (landmark.visibility ?? 1) >= minimum;
}

function getDistance(first, second) {
  if (!first || !second) {
    return 0;
  }

  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getMidpoint(first, second) {
  if (!first || !second) {
    return { x: 0.5, y: 0.5, visibility: 0 };
  }

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    visibility: average([first.visibility ?? 1, second.visibility ?? 1]),
  };
}

function calculateAngle(first, middle, third) {
  if (!first || !middle || !third) {
    return 0;
  }

  const vectorA = {
    x: first.x - middle.x,
    y: first.y - middle.y,
  };
  const vectorB = {
    x: third.x - middle.x,
    y: third.y - middle.y,
  };

  const magnitude = Math.hypot(vectorA.x, vectorA.y) * Math.hypot(vectorB.x, vectorB.y);
  if (!magnitude) {
    return 0;
  }

  const cosine = clamp(((vectorA.x * vectorB.x) + (vectorA.y * vectorB.y)) / magnitude, -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

function scoreFromAngle(angle, target, tolerance) {
  const delta = Math.abs(angle - target);
  return clamp(100 - (delta / tolerance) * 100, 0, 100);
}

function scoreFromDifference(value, tolerance) {
  return clamp(100 - (Math.abs(value) / tolerance) * 100, 0, 100);
}

function scoreFromRatio(value, ideal, tolerance) {
  if (!ideal) {
    return 0;
  }

  return scoreFromDifference((value - ideal) / ideal, tolerance);
}

function getKeyLandmarks(landmarks) {
  const leftShoulder = getLandmark(landmarks, 'leftShoulder');
  const rightShoulder = getLandmark(landmarks, 'rightShoulder');
  const leftElbow = getLandmark(landmarks, 'leftElbow');
  const rightElbow = getLandmark(landmarks, 'rightElbow');
  const leftWrist = getLandmark(landmarks, 'leftWrist');
  const rightWrist = getLandmark(landmarks, 'rightWrist');
  const leftHip = getLandmark(landmarks, 'leftHip');
  const rightHip = getLandmark(landmarks, 'rightHip');
  const leftKnee = getLandmark(landmarks, 'leftKnee');
  const rightKnee = getLandmark(landmarks, 'rightKnee');
  const leftAnkle = getLandmark(landmarks, 'leftAnkle');
  const rightAnkle = getLandmark(landmarks, 'rightAnkle');
  const leftFoot = getLandmark(landmarks, 'leftFoot');
  const rightFoot = getLandmark(landmarks, 'rightFoot');

  const midShoulder = getMidpoint(leftShoulder, rightShoulder);
  const midHip = getMidpoint(leftHip, rightHip);

  return {
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    leftFoot,
    rightFoot,
    midShoulder,
    midHip,
  };
}

function buildBaseSignals(landmarks) {
  const points = getKeyLandmarks(landmarks);
  const shoulderWidth = getDistance(points.leftShoulder, points.rightShoulder) || 0.18;
  const hipWidth = getDistance(points.leftHip, points.rightHip) || shoulderWidth * 0.84;
  const torsoLength = getDistance(points.midShoulder, points.midHip) || 0.26;
  const legSpan = average([
    getDistance(points.leftHip, points.leftAnkle),
    getDistance(points.rightHip, points.rightAnkle),
  ]) || 0.46;

  const leftKneeAngle = calculateAngle(points.leftHip, points.leftKnee, points.leftAnkle);
  const rightKneeAngle = calculateAngle(points.rightHip, points.rightKnee, points.rightAnkle);
  const leftHipAngle = calculateAngle(points.leftShoulder, points.leftHip, points.leftKnee);
  const rightHipAngle = calculateAngle(points.rightShoulder, points.rightHip, points.rightKnee);
  const leftElbowAngle = calculateAngle(points.leftShoulder, points.leftElbow, points.leftWrist);
  const rightElbowAngle = calculateAngle(points.rightShoulder, points.rightElbow, points.rightWrist);
  const leftShoulderAngle = calculateAngle(points.leftHip, points.leftShoulder, points.leftElbow);
  const rightShoulderAngle = calculateAngle(points.rightHip, points.rightShoulder, points.rightElbow);
  const leftPlankAngle = calculateAngle(points.leftShoulder, points.leftHip, points.leftAnkle);
  const rightPlankAngle = calculateAngle(points.rightShoulder, points.rightHip, points.rightAnkle);

  const torsoLean = torsoLength
    ? Math.abs(points.midShoulder.x - points.midHip.x) / torsoLength
    : 0;
  const shoulderTilt = Math.abs((points.leftShoulder?.y ?? 0) - (points.rightShoulder?.y ?? 0));
  const hipTilt = Math.abs((points.leftHip?.y ?? 0) - (points.rightHip?.y ?? 0));
  const ankleWidth = getDistance(points.leftAnkle, points.rightAnkle);
  const wristWidth = getDistance(points.leftWrist, points.rightWrist);
  const footWidth = getDistance(points.leftFoot, points.rightFoot) || ankleWidth;
  const armRaise = average([
    clamp(((points.leftShoulder?.y ?? 0.5) - (points.leftWrist?.y ?? 0.5) + 0.08) / 0.34, 0, 1),
    clamp(((points.rightShoulder?.y ?? 0.5) - (points.rightWrist?.y ?? 0.5) + 0.08) / 0.34, 0, 1),
  ]);
  const legSpread = shoulderWidth
    ? clamp((ankleWidth / shoulderWidth - 0.8) / 1.6, 0, 1)
    : 0;

  return {
    points,
    shoulderWidth,
    hipWidth,
    torsoLength,
    legSpan,
    leftKneeAngle,
    rightKneeAngle,
    avgKneeAngle: average([leftKneeAngle, rightKneeAngle]),
    leftHipAngle,
    rightHipAngle,
    avgHipAngle: average([leftHipAngle, rightHipAngle]),
    leftElbowAngle,
    rightElbowAngle,
    avgElbowAngle: average([leftElbowAngle, rightElbowAngle]),
    leftShoulderAngle,
    rightShoulderAngle,
    avgShoulderAngle: average([leftShoulderAngle, rightShoulderAngle]),
    leftPlankAngle,
    rightPlankAngle,
    avgPlankAngle: average([leftPlankAngle, rightPlankAngle]),
    torsoLean,
    shoulderTilt,
    hipTilt,
    ankleWidth,
    footWidth,
    wristWidth,
    armRaise,
    legSpread,
  };
}

function buildUnreadableResult(exercise) {
  return {
    exercise,
    isReady: false,
    phase: 'searching',
    phaseProgress: 0,
    score: 0,
    posture: 0,
    depth: 0,
    balance: 0,
    primaryFeedback: 'Move fully into frame',
    feedback: ['Move fully into frame'],
    angles: {},
  };
}

function analyzeSquat(signals) {
  const phaseProgress = clamp((165 - signals.avgKneeAngle) / 78, 0, 1);
  const phase = phaseProgress > 0.72 ? 'bottom' : phaseProgress > 0.16 ? 'transition' : 'top';

  const posture = clamp(
    average([
      scoreFromDifference(signals.torsoLean, 0.22),
      scoreFromAngle(signals.avgHipAngle, 88, 45),
      scoreFromDifference(signals.shoulderTilt + signals.hipTilt, 0.09),
    ]),
    0,
    100
  );
  const depth = phase === 'top' ? 100 : scoreFromAngle(signals.avgKneeAngle, 92, 34);
  const balance = clamp(
    average([
      scoreFromDifference(signals.leftKneeAngle - signals.rightKneeAngle, 34),
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(signals.hipTilt, 0.08),
    ]),
    0,
    100
  );

  const kneeDrift = signals.hipWidth
    ? average([
        Math.abs((signals.points.leftKnee?.x ?? 0.5) - (signals.points.leftFoot?.x ?? 0.5)),
        Math.abs((signals.points.rightKnee?.x ?? 0.5) - (signals.points.rightFoot?.x ?? 0.5)),
      ]) / signals.hipWidth
    : 0;

  const feedback = [];
  if (phase !== 'top' && signals.avgKneeAngle > 118) {
    feedback.push('Lower More');
  }
  if (posture < 76 || signals.torsoLean > 0.17) {
    feedback.push('Straighten Back');
  }
  if (kneeDrift > 0.62) {
    feedback.push('Knees Too Forward');
  }
  if (balance < 74) {
    feedback.push('Re-center your stance');
  }

  return {
    phase,
    phaseProgress,
    posture,
    depth,
    balance,
    score: Math.round(posture * 0.42 + depth * 0.34 + balance * 0.24),
    primaryFeedback: feedback[0] || 'Correct Form',
    feedback: feedback.length ? feedback : ['Correct Form'],
  };
}

function analyzePushup(signals) {
  const phaseProgress = clamp((165 - signals.avgElbowAngle) / 82, 0, 1);
  const phase = phaseProgress > 0.74 ? 'bottom' : phaseProgress > 0.16 ? 'transition' : 'top';

  const posture = clamp(
    average([
      scoreFromAngle(signals.avgPlankAngle, 176, 28),
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(signals.hipTilt, 0.08),
    ]),
    0,
    100
  );
  const depth = phase === 'top' ? 100 : scoreFromAngle(signals.avgElbowAngle, 88, 32);
  const balance = clamp(
    average([
      scoreFromDifference(signals.leftElbowAngle - signals.rightElbowAngle, 30),
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(
        (signals.points.leftWrist?.y ?? 0.5) - (signals.points.rightWrist?.y ?? 0.5),
        0.08
      ),
    ]),
    0,
    100
  );

  const feedback = [];
  if (phase !== 'top' && signals.avgElbowAngle > 108) {
    feedback.push('Lower More');
  }
  if (posture < 78 || signals.avgPlankAngle < 156) {
    feedback.push('Correct Posture');
  }
  if (balance < 74) {
    feedback.push('Press evenly');
  }

  return {
    phase,
    phaseProgress,
    posture,
    depth,
    balance,
    score: Math.round(posture * 0.45 + depth * 0.3 + balance * 0.25),
    primaryFeedback: feedback[0] || 'Correct Form',
    feedback: feedback.length ? feedback : ['Correct Form'],
  };
}

function analyzeLunge(signals) {
  const activeSide = signals.leftKneeAngle < signals.rightKneeAngle ? 'left' : 'right';
  const activeKneeAngle = activeSide === 'left' ? signals.leftKneeAngle : signals.rightKneeAngle;
  const phaseProgress = clamp((160 - activeKneeAngle) / 78, 0, 1);
  const phase = phaseProgress > 0.72 ? 'bottom' : phaseProgress > 0.14 ? 'transition' : 'top';

  const posture = clamp(
    average([
      scoreFromDifference(signals.torsoLean, 0.2),
      scoreFromAngle(signals.avgHipAngle, 104, 48),
      scoreFromDifference(signals.shoulderTilt + signals.hipTilt, 0.1),
    ]),
    0,
    100
  );
  const depth = phase === 'top' ? 100 : scoreFromAngle(activeKneeAngle, 92, 30);
  const balance = clamp(
    average([
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(signals.hipTilt, 0.08),
      scoreFromDifference(signals.leftKneeAngle - signals.rightKneeAngle, 75),
    ]),
    0,
    100
  );

  const feedback = [];
  if (phase !== 'top' && activeKneeAngle > 112) {
    feedback.push('Lower More');
  }
  if (posture < 78 || signals.torsoLean > 0.17) {
    feedback.push('Stay Tall');
  }
  if (balance < 74) {
    feedback.push('Stabilize your hips');
  }

  return {
    phase,
    phaseProgress,
    posture,
    depth,
    balance,
    activeSide,
    score: Math.round(posture * 0.38 + depth * 0.34 + balance * 0.28),
    primaryFeedback: feedback[0] || 'Correct Form',
    feedback: feedback.length ? feedback : ['Correct Form'],
  };
}

function analyzeJumpingJack(signals) {
  const phaseProgress = clamp((signals.armRaise + signals.legSpread) / 2, 0, 1);
  const phase = phaseProgress > 0.72 ? 'open' : phaseProgress > 0.2 ? 'transition' : 'closed';

  const posture = clamp(
    average([
      scoreFromDifference(signals.torsoLean, 0.18),
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(signals.hipTilt, 0.08),
    ]),
    0,
    100
  );
  const depth = phase === 'open'
    ? average([
        scoreFromRatio(signals.armRaise, 1, 0.42),
        scoreFromRatio(signals.legSpread, 1, 0.42),
      ])
    : average([
        scoreFromDifference(signals.armRaise, 0.3),
        scoreFromDifference(signals.legSpread, 0.3),
      ]);
  const balance = clamp(
    average([
      scoreFromDifference(signals.shoulderTilt, 0.08),
      scoreFromDifference(
        (signals.points.leftWrist?.y ?? 0.5) - (signals.points.rightWrist?.y ?? 0.5),
        0.1
      ),
      scoreFromDifference(
        (signals.points.leftAnkle?.y ?? 0.5) - (signals.points.rightAnkle?.y ?? 0.5),
        0.1
      ),
    ]),
    0,
    100
  );

  const feedback = [];
  if (phase === 'open' && signals.armRaise < 0.72) {
    feedback.push('Arms Too Low');
  }
  if (phase === 'open' && signals.legSpread < 0.6) {
    feedback.push('Jump Wider');
  }
  if (posture < 76) {
    feedback.push('Stay Centered');
  }

  return {
    phase,
    phaseProgress,
    posture,
    depth,
    balance,
    score: Math.round(posture * 0.32 + depth * 0.42 + balance * 0.26),
    primaryFeedback: feedback[0] || 'Correct Form',
    feedback: feedback.length ? feedback : ['Correct Form'],
  };
}

function hasEnoughBodyVisibility(signals) {
  const required = [
    signals.points.leftShoulder,
    signals.points.rightShoulder,
    signals.points.leftHip,
    signals.points.rightHip,
    signals.points.leftKnee,
    signals.points.rightKnee,
    signals.points.leftAnkle,
    signals.points.rightAnkle,
  ];

  return required.every((landmark) => hasVisibility(landmark, 0.28));
}

export function evaluateExerciseForm(landmarks, exercise) {
  if (!landmarks?.length) {
    return buildUnreadableResult(exercise);
  }

  const signals = buildBaseSignals(landmarks);
  if (!hasEnoughBodyVisibility(signals)) {
    return buildUnreadableResult(exercise);
  }

  let analysis = null;
  if (exercise === 'squat') {
    analysis = analyzeSquat(signals);
  } else if (exercise === 'pushup') {
    analysis = analyzePushup(signals);
  } else if (exercise === 'lunge') {
    analysis = analyzeLunge(signals);
  } else if (exercise === 'jumpingJack') {
    analysis = analyzeJumpingJack(signals);
  } else {
    return buildUnreadableResult(exercise);
  }

  return {
    exercise,
    isReady: true,
    ...analysis,
    posture: Math.round(analysis.posture),
    depth: Math.round(analysis.depth),
    balance: Math.round(analysis.balance),
    score: Math.round(analysis.score),
    angles: {
      knee: Math.round(signals.avgKneeAngle),
      hip: Math.round(signals.avgHipAngle),
      elbow: Math.round(signals.avgElbowAngle),
      shoulder: Math.round(signals.avgShoulderAngle),
      plank: Math.round(signals.avgPlankAngle),
    },
    signals: {
      shoulderWidth: signals.shoulderWidth,
      hipWidth: signals.hipWidth,
      torsoLength: signals.torsoLength,
      legSpan: signals.legSpan,
      armRaise: signals.armRaise,
      legSpread: signals.legSpread,
      avgKneeAngle: signals.avgKneeAngle,
      avgHipAngle: signals.avgHipAngle,
      avgElbowAngle: signals.avgElbowAngle,
      avgPlankAngle: signals.avgPlankAngle,
      points: signals.points,
    },
  };
}

export { LANDMARK_INDEX, calculateAngle, getDistance, getMidpoint };
