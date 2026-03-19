import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Trophy, Star, Clock } from 'lucide-react';
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

const EXERCISE_ICONS = {
  squat: '🏋️',
  pushup: '💪',
  lunge: '🦵',
  jumpingJack: '⭐',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressScreen() {
  const [sessions, setSessions] = useState([]);
  const [totals, setTotals] = useState({
    totalSessions: 0, totalReps: 0,
    totalPerfectReps: 0, totalDuration: 0, totalXp: 0,
  });

  const level = parseInt(localStorage.getItem('arquest-level') || '1');
  const xp = parseInt(localStorage.getItem('arquest-xp') || '0');
  const avatar = getAvatar(level);
  const streak = parseInt(localStorage.getItem('motioncore-streak') || '0');
  const xpInLevel = xp % 100;

  useEffect(() => {
    motionSessionService.getSessions(10).then(setSessions);
    motionSessionService.getTotalStats().then(setTotals);
  }, []);

  const unlockedBadges = BADGES.filter(b => b.condition(totals));

  // Build weekly activity from sessions
  const weeklyActivity = DAYS.map((day, i) => {
    const dayReps = sessions
      .filter(s => {
        const d = new Date(s.created_at);
        return d.getDay() === (i + 1) % 7;
      })
      .reduce((sum, s) => sum + (s.total_reps || 0), 0);
    return { day, reps: dayReps };
  });
  const maxReps = Math.max(...weeklyActivity.map(d => d.reps), 1);
  const today = new Date().getDay();

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', background: 'var(--color-bg)', padding: '28px', overflowY: 'auto' }}>

      {/* ── Hero Card ── */}
      <motion.div
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, var(--color-bg) 60%)',
          border: '1px solid var(--color-border-accent)',
          borderRadius: '24px', padding: '28px',
          display: 'flex', alignItems: 'center', gap: '24px',
          marginBottom: '20px', position: 'relative', overflow: 'hidden',
        }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      >
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: 'var(--color-accent-dim)', border: '2px solid var(--color-border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            {avatar.emoji}
          </div>
          <div style={{ position: 'absolute', inset: '-6px', borderRadius: '28px', border: '1px solid var(--color-border-accent)', pointerEvents: 'none' }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
            {avatar.label}
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
            Level {level}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            {xp} total XP earned
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden', width: '280px', marginBottom: '5px' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }}
              animate={{ width: `${xpInLevel}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <span>Level {level}</span>
            <span>{xpInLevel} / 100 XP</span>
            <span>Level {level + 1}</span>
          </div>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '16px 22px' }}>
          <span style={{ fontSize: '22px' }}>🔥</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-warning)', letterSpacing: '-1px', lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Day Streak</span>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        {[
          { icon: TrendingUp, label: 'Sessions', value: totals.totalSessions, sub: 'Total completed', color: 'var(--color-accent)' },
          { icon: Trophy, label: 'Total Reps', value: totals.totalReps, sub: 'All time', color: 'var(--color-warning)' },
          { icon: Star, label: 'Perfect Reps', value: totals.totalPerfectReps, sub: totals.totalPerfectReps === 0 ? 'Keep pushing!' : 'Excellent form!', color: 'var(--color-success)' },
          { icon: Clock, label: 'Time Trained', value: formatDuration(totals.totalDuration), sub: 'Total duration', color: '#06b6d4' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '18px 16px', position: 'relative', overflow: 'hidden' }}>
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color, borderRadius: '18px 18px 0 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                <Icon size={12} color={stat.color} /> {stat.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color, letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{stat.sub}</div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Two Column ── */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        {/* Left — Sessions + Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Recent Sessions */}
          <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
              Recent Sessions
            </div>
            {sessions.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No sessions yet. Start a Motion quest!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessions.slice(0, 4).map(session => (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {EXERCISE_ICONS[session.exercise_type] || '🏃'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
                        {EXERCISE_LIBRARY[session.exercise_type]?.label || session.exercise_type}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {new Date(session.created_at).toLocaleDateString()} · {formatDuration(session.duration_seconds || 0)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-accent)' }}>{session.total_reps}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>reps</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Chart */}
          <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
              Weekly Activity
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
              {weeklyActivity.map((d, i) => {
                const heightPct = maxReps > 0 ? Math.max((d.reps / maxReps) * 100, d.reps > 0 ? 15 : 0) : 0;
                const isToday = (i + 1) % 7 === today;
                return (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <motion.div
                      style={{ width: '100%', borderRadius: '6px 6px 0 0', background: isToday || d.reps > 0 ? 'var(--color-accent)' : 'var(--color-border)', opacity: isToday ? 1 : d.reps > 0 ? 0.7 : 0.2 }}
                      animate={{ height: `${Math.max(heightPct, 4)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                    />
                    <span style={{ fontSize: '9px', color: isToday ? 'var(--color-accent)' : 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: isToday ? 700 : 400 }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Badges */}
        <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '18px', padding: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
            Badges — {unlockedBadges.length}/{BADGES.length} Unlocked
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {BADGES.map(badge => {
              const unlocked = badge.condition(totals);
              return (
                <motion.div
                  key={badge.id}
                  whileHover={unlocked ? { y: -2 } : {}}
                  style={{ borderRadius: '14px', padding: '14px 8px', textAlign: 'center', border: `1px solid ${unlocked ? 'var(--color-border-accent)' : 'var(--color-border)'}`, background: unlocked ? 'var(--color-accent-dim)' : 'var(--color-bg)', opacity: unlocked ? 1 : 0.35, position: 'relative', overflow: 'hidden' }}
                >
                  {unlocked && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }} />
                  )}
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>{badge.emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: unlocked ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {badge.label}
                  </span>
                  {!unlocked && (
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '3px' }}>Locked</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* XP Progress to next badge */}
          <div style={{ marginTop: '16px', padding: '14px', background: 'var(--color-bg)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              Next Badge Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>💪</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Rep Master</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{totals.totalReps} / 50</span>
                </div>
                <div style={{ height: '5px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }}
                    animate={{ width: `${Math.min((totals.totalReps / 50) * 100, 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {Math.max(50 - totals.totalReps, 0)} more reps to unlock!
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}