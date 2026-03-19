import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, RefreshCw, Sparkles } from 'lucide-react';
import { motionSessionService } from '@/services/motionSessionService';
import { getAvatar } from './LevelUpModal';

export default function AIInsightScreen() {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const level = parseInt(localStorage.getItem('arquest-level') || '1');
  const xp = parseInt(localStorage.getItem('arquest-xp') || '0');
  const streak = parseInt(localStorage.getItem('motioncore-streak') || '0');
  const avatar = getAvatar(level);

  const generateInsight = async () => {
    setLoading(true);
    setInsight('');
    try {
      const totals = await motionSessionService.getTotalStats();
      const prompt = `You are ARQuest AI, a gamified fitness coach.
User stats:
- Level: ${level} (${avatar.label})
- Total XP: ${xp}
- Streak: ${streak} days
- Total Sessions: ${totals.totalSessions}
- Total Reps: ${totals.totalReps}
- Perfect Reps: ${totals.totalPerfectReps}
- Time Trained: ${Math.floor(totals.totalDuration / 60)} minutes

Give ONE powerful, personalized insight in exactly 2 sentences. Be specific to their stats. Use motivating gamified tone. No emojis. No preamble. Just the insight.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.find(c => c.type === 'text')?.text || 'Your consistency is your greatest weapon. Every rep is XP in the real world.';
      setInsight(text);
    } catch {
      setInsight('Your consistency is your greatest weapon. Every rep earned is XP that compounds over time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateInsight(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
          AI Insight
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
          Powered by Claude
        </p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Stats Row */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: 'Level', value: level },
            { label: 'Streak', value: `${streak}d` },
            { label: 'XP', value: xp },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              borderRadius: '16px', padding: '14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.5px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Avatar context */}
        <motion.div
          style={{
            background: 'var(--color-panel)', border: '1px solid var(--color-border)',
            borderRadius: '18px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          <span style={{ fontSize: '28px' }}>{avatar.emoji}</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>{avatar.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Your current rank</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Next rank at</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>Level {level + 1}</div>
          </div>
        </motion.div>

        {/* AI Insight Card */}
        <motion.div
          style={{
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-border-accent)',
            borderRadius: '20px', padding: '20px',
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Brain size={16} color="#000" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ARQuest AI
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Personalized to your stats
              </div>
            </div>
            <Sparkles size={14} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap size={16} color="var(--color-accent)" />
              </motion.div>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Analyzing your quest data...
              </span>
            </div>
          ) : (
            <motion.p
              style={{
                fontSize: '15px', fontWeight: 500, color: 'var(--color-text)',
                lineHeight: 1.6, margin: 0
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            >
              {insight}
            </motion.p>
          )}
        </motion.div>

        {/* Refresh Button */}
        <motion.button
          onClick={generateInsight}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: '16px',
            background: loading ? 'var(--color-panel)' : 'var(--color-accent)',
            border: `1px solid ${loading ? 'var(--color-border)' : 'transparent'}`,
            color: loading ? 'var(--color-text-muted)' : '#000',
            fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
        >
          <RefreshCw size={16} />
          {loading ? 'Generating...' : 'New Insight'}
        </motion.button>

        {/* Info tip */}
        <motion.div
          style={{
            background: 'var(--color-panel)', border: '1px solid var(--color-border)',
            borderRadius: '16px', padding: '14px 16px'
          }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
            AI Insight analyzes your level, streak, reps and sessions to give you one personalized recommendation. Complete more quests for deeper insights.
          </p>
        </motion.div>

      </div>
    </div>
  );
}