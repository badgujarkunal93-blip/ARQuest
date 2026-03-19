import { motion } from 'framer-motion';
import { CheckCircle, Circle, Zap, Sword } from 'lucide-react';

export default function QuestCard({ quest, onComplete, onMotionVerify }) {
  const isCompleted = quest.completed;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      style={{
        background: isCompleted ? 'var(--color-accent-dim)' : 'var(--color-panel)',
        border: `1px solid ${isCompleted ? 'var(--color-border-accent)' : 'var(--color-border)'}`,
        borderRadius: '18px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Check button */}
      <button
        onClick={() => !isCompleted && onComplete(quest.id)}
        style={{ background: 'none', border: 'none', cursor: isCompleted ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}
      >
        {isCompleted
          ? <CheckCircle size={24} color="var(--color-accent)" />
          : <Circle size={24} color="var(--color-text-muted)" />
        }
      </button>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Sword size={10} color="var(--color-accent)" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Quest
          </span>
          {quest.motionVerified && (
            <span style={{
              fontSize: '9px', fontWeight: 700, color: 'var(--color-accent)',
              background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)',
              borderRadius: '6px', padding: '1px 6px'
            }}>
              Motion ✓
            </span>
          )}
        </div>
        <p style={{
          fontSize: '14px', fontWeight: 600, color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: isCompleted ? 'line-through' : 'none',
          margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {quest.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Zap size={11} /> +{quest.xp} XP
          </span>
          {quest.streak > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              🔥 {quest.streak} day streak
            </span>
          )}
        </div>
      </div>

      {/* Verify button */}
      {quest.requiresMotion && !isCompleted && (
        <button
          onClick={() => onMotionVerify(quest)}
          style={{
            background: 'var(--color-accent)', color: '#000', border: 'none',
            borderRadius: '12px', padding: '8px 14px', fontSize: '12px',
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <Zap size={12} /> Verify
        </button>
      )}
    </motion.div>
  );
}