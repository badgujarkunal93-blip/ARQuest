import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Zap, Star, TrendingUp, Clock } from 'lucide-react';
import { motionSessionService } from '@/services/motionSessionService';
import { getAvatar } from './LevelUpModal';
import { EXERCISE_LIBRARY } from '@/components/motioncore/FormScoreEngine';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const BADGES = [
  { id: 'first_quest', label: 'First Quest', emoji: '🎯', condition: (s) => s.totalSessions >= 1 },
  { id: 'rep_master', label: 'Rep Master', emoji: '💪', condition: (s) => s.totalReps >= 50 },
  { id: 'perfect_form', label: 'Perfect Form', emoji: '⭐', condition: (s) => s.totalPerfectReps >= 10 },
  { id: 'xp_hunter', label: 'XP Hunter', emoji: '⚡', condition: (s) => s.totalXp >= 100 },
  { id: 'warrior', label: 'Warrior', emoji: '⚔️', condition: (s) => s.totalSessions >= 5 },
  { id: 'legend', label: 'Legend', emoji: '👑', condition: (s) => s.totalReps >= 200 },
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--color-panel)', border: '1px solid var(--color-border)',
      borderRadius: '18px', padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: '24px', fontWeight: 800, color, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
    </div>
  );
}

export default function ProgressScreen() {
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState({ totalSessions: 0, totalReps: 0, totalPerfectReps: 0, totalDuration: 0, totalXp: 0 });

  const level = parseInt(localStorage.getItem('arquest-level') || '1');
  const xp = parseInt(localStorage.getItem('arquest-xp') || '0');
  const avatar = getAvatar(level);
  const streak = parseInt(localStorage.getItem('motioncore-streak') || '0');

  useEffect(() => {
    motionSessionService.getSessions(10).then(setSessions);
    motionSessionService.getTotalStats().then(setTotals);
  }, []);

  const unlockedBadges = BADGES.filter(b => b.condition(totals));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
          Progress
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>Your quest journey</p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Avatar Card */}
        <motion.div
          style={{
            background: 'var(--color-panel)', border: '1px solid var(--color-border)',
            borderRadius: '20px', padding: '18px',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px',
            background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0
          }}>
            {avatar.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
              {avatar.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              Level {level}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {xp} total XP earned
            </div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: '14px', padding: '10px 14px'
          }}>
            <Flame size={18} color="var(--color-warning)" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-warning)', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>streak</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          <StatCard icon={TrendingUp} label="Sessions" value={totals.totalSessions} color="var(--color-accent)" />
          <StatCard icon={Trophy} label="Total Reps" value={totals.totalReps} color="var(--color-warning)" />
          <StatCard icon={Star} label="Perfect Reps" value={totals.totalPerfectReps} color="var(--color-success)" />
          <StatCard icon={Clock} label="Time Trained" value={formatDuration(totals.totalDuration)} color="var(--color-accent)" />
        </motion.div>

        {/* XP Bar */}
        <motion.div
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '16px' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} color="var(--color-accent)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>XP to next level</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{xp % 100} / 100</span>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }}
              animate={{ width: `${xp % 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            Badges — {unlockedBadges.length}/{BADGES.length} Unlocked
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {BADGES.map(badge => {
              const unlocked = badge.condition(totals);
              return (
                <div key={badge.id} style={{
                  background: unlocked ? 'var(--color-accent-dim)' : 'var(--color-panel)',
                  border: `1px solid ${unlocked ? 'var(--color-border-accent)' : 'var(--color-border)'}`,
                  borderRadius: '16px', padding: '12px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  opacity: unlocked ? 1 : 0.4
                }}>
                  <span style={{ fontSize: '22px' }}>{badge.emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: unlocked ? 'var(--color-accent)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            Recent Sessions
          </div>
          {sessions.length === 0 ? (
            <div style={{
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              borderRadius: '18px', padding: '24px', textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                No sessions yet. Start a Motion quest!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map(session => (
                <div key={session.id} style={{
                  background: 'var(--color-panel)', border: '1px solid var(--color-border)',
                  borderRadius: '16px', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 3px' }}>
                      {EXERCISE_LIBRARY[session.exercise_type]?.label || session.exercise_type}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
                      {new Date(session.created_at).toLocaleDateString()} · {formatDuration(session.duration_seconds || 0)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-accent)', margin: '0 0 2px' }}>
                      {session.total_reps} reps
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
                      {session.accuracy_percentage}% accuracy
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}