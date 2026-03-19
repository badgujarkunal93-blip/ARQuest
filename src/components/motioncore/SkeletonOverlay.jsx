import { useEffect, useRef } from 'react';
import { GHOST_CONNECTIONS } from '@/components/motioncore/GhostTrainer';

// Standard pose connections (same as MediaPipe)
const POSE_CONNECTIONS = [
  [0, 1], [0, 4], [0, 5], [0, 6],
  [1, 2], [1, 3], [2, 4], [3, 5],
  [4, 5], [5, 6], [5, 7], [5, 11],
  [6, 8], [6, 12], [7, 9], [8, 10],
  [9, 11], [9, 10], [11, 12], [11, 13],
  [12, 14], [13, 15], [14, 16],
];

function drawGhostSkeleton(context, landmarks, width, height) {
  if (!landmarks?.length) {
    return;
  }

  context.save();
  context.setLineDash([9, 7]);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  GHOST_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];
    if (!start || !end) {
      return;
    }

    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.strokeStyle = 'rgba(173, 255, 240, 0.55)';
    context.lineWidth = 3;
    context.stroke();
  });

  landmarks.forEach((landmark) => {
    if (!landmark) {
      return;
    }

    context.beginPath();
    context.arc(
      landmark.x * width,
      landmark.y * height,
      4.5,
      0,
      Math.PI * 2
    );
    context.fillStyle = 'rgba(173, 255, 240, 0.8)';
    context.shadowColor = 'rgba(173, 255, 240, 0.7)';
    context.shadowBlur = 12;
    context.fill();
  });

  context.restore();
}

function drawConnectors(context, landmarks, connections, options = {}) {
  const { color = 'rgba(61, 242, 193, 0.45)', lineWidth = 4, visibilityMin = 0.3 } = options;
  
  connections.forEach(([startIndex, endIndex]) => {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];
    
    if (!start || !end) return;
    
    const startVis = start.visibility ?? start.score ?? 0;
    const endVis = end.visibility ?? end.score ?? 0;
    
    if (startVis < visibilityMin || endVis < visibilityMin) return;
    
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    
    if (typeof color === 'function') {
      context.strokeStyle = color({ index: startIndex });
    } else {
      context.strokeStyle = color;
    }
    
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  });
}

function drawLandmarks(context, landmarks, options = {}) {
  const { 
    color = 'rgba(255, 255, 255, 0.9)', 
    fillColor = 'rgba(61, 242, 193, 0.85)',
    radius = 4.5,
    visibilityMin = 0.32
  } = options;
  
  landmarks.forEach((landmark) => {
    if (!landmark) return;
    
    const vis = landmark.visibility ?? landmark.score ?? 0;
    if (vis < visibilityMin) return;
    
    context.beginPath();
    context.arc(landmark.x, landmark.y, radius, 0, Math.PI * 2);
    context.fillStyle = fillColor;
    context.fill();
    
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.stroke();
  });
}

export default function SkeletonOverlay({
  width,
  height,
  landmarks,
  ghostLandmarks,
  poseDetected,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) {
      return;
    }

    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    drawGhostSkeleton(context, ghostLandmarks, width, height);

    if (!poseDetected || !landmarks?.length) {
      return;
    }

    // Normalize landmarks for canvas rendering
    const normalizedLandmarks = landmarks.map((landmark) => ({
      ...landmark,
      x: landmark.x * width,
      y: landmark.y * height,
    }));

    drawConnectors(context, normalizedLandmarks, POSE_CONNECTIONS, {
      color: (data) => {
        const intensity = data?.index !== undefined ? 0.35 + ((data.index % 4) * 0.1) : 0.45;
        return `rgba(61, 242, 193, ${intensity})`;
      },
      lineWidth: 4,
      visibilityMin: 0.3,
    });

    drawLandmarks(context, normalizedLandmarks, {
      color: 'rgba(255,255,255,0.9)',
      fillColor: 'rgba(61, 242, 193, 0.85)',
      lineWidth: 1,
      radius: 4.5,
      visibilityMin: 0.32,
    });
  }, [ghostLandmarks, height, landmarks, poseDetected, width]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full scale-x-[-1]"
      aria-hidden="true"
    />
  );
}
