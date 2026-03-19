import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Shield, Plus, X, ChevronRight } from 'lucide-react';
import QuestCard from './QuestCard';
import LevelUpModal, { getAvatar } from './LevelUpModal';
import ThemePicker from './ThemePicker';

const XP_PER_LEVEL = 100;

const DEFAULT_QUESTS = [
  { id: '1', title: 'Complete 10 Squats', xp: 20, requiresMotion: true, completed: false, streak: 0, motionVerified: false },
  { id: '2', title: 'Do 10 Push-ups', xp: 20, requiresMotion: true, completed: false, streak: 2, motionVerified: false },
  { id: '3', title: 'Drink 2L of Water', xp: 10, requiresMotion: false, completed: false, streak: 3, motionVerified: false },
  { id: '4', title: 'Read for 20 Minutes', xp: 15, requiresMotion: false, completed: false, streak: 1, motionVerified: false },
  { id: '5', title: 'Complete 10 Lunges', xp: 20, requiresMotion: true, completed: false, streak: 0, motionVerified: false },
  { id: '6', title: 'Meditate for 5 Minutes', xp: 15, requiresMotion: false, completed: false, streak: 4, motionVerified: false },
];

export default function HomeScreen({ onNavigate, onMotionVerify }) {
  const [quests, setQuests] = useState(() => {
    const saved = localStorage.getItem('arquest-quests');
    return saved ? JSON.parse(saved) : DEFAULT_QUESTS;
  });
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('arquest-xp') || '0'));
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('arquest-level') || '1'));
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestXp, setNewQuestXp] = useState(10);
  const [newQuestMotion, setNewQuestMotion] = useState(false);

  useEffect(() => { localStorage.setItem('arquest-quests', JSON.stringify(quests)); }, [quests]);
  useEffect(() => {
    localStorage.setItem('arquest-xp', String(xp));
    localStorage.setItem('arquest-level', String(level));
  }, [xp, level]);

  const xpInLevel = xp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  const avatar = getAvatar(level);
  const completedCount = quests.filter(q => q.completed).length;
  const streak = parseInt(localStorage.getItem('motioncore-streak') || '0');

  const handleComplete = (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true, streak: q.streak + 1 } : q));
    const newXp = xp + quest.xp;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    if (newLevel > level) { setLevel(newLevel); setShowLevelUp(true); }
    setXp(newXp);
  };

  const handleMotionVerify = (quest) => { onMotionVerify(quest); onNavigate('motion'); };

  const handleAddQuest = () => {
    if (!newQuestTitle.trim()) return;
    setQuests(prev => [...prev, {
      id: crypto.randomUUID(),
      title: newQuestTitle.trim(),
      xp: newQuestXp,
      requiresMotion: newQuestMotion,
      completed: false,
      streak: 0,
      motionVerified: false,
    }]);
    setNewQuestTitle('');
    setNewQuestXp(10);
    setNewQuestMotion(false);
    setShowAddQuest(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{
              fontSize: '26px', fontWeight: 800, color: 'var(--color-text)',
              margin: 0, letterSpacing: '-0.5px'
            }}>
              AR<span style={{ color: 'var(--color-accent)' }}>Quest</span>
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {completedCount}/{quests.length} quests today
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemePicker />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--color-panel)', border: '1px solid var(--color-border)',
              borderRadius: '16px', padding: '8px 12px'
            }}>
              <span style={{ fontSize: '20px' }}>{avatar.emoji}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>Lv.{level}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{avatar.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* XP Card */}
        <motion.div
          style={{
            background: 'var(--color-panel)', border: '1px solid var(--color-border)',
            borderRadius: '20px', padding: '16px', marginBottom: '12px'
          }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--color-accent)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                {xpInLevel} / {XP_PER_LEVEL} XP
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={13} color="var(--color-warning)" />
              <span style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: 600 }}>
                {streak} day streak
              </span>
            </div>
          </div>
          <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Level {level}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Level {level + 1}</span>
          </div>
        </motion.div>

        {/* Boss Banner */}
        <AnimatePresence>
          {completedCount >= 5 && (
            <motion.div
              style={{
                background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)',
                borderRadius: '20px', padding: '14px 16px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <Shield size={22} color="var(--color-accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>Boss Battle Unlocked!</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>5 quests completed — take the challenge</div>
              </div>
              <button
                onClick={() => onNavigate('motion')}
                style={{
                  background: 'var(--color-accent)', color: '#000', border: 'none',
                  borderRadius: '12px', padding: '7px 14px', fontSize: '12px',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                Fight <ChevronRight size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quests */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Today's Quests
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setQuests(quests.map(q => ({ ...q, completed: false, motionVerified: false })))}
              style={{
                background: 'transparent', border: '1px solid var(--color-border)',
                borderRadius: '10px', padding: '5px 10px', fontSize: '11px',
                color: 'var(--color-text-muted)', cursor: 'pointer'
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setShowAddQuest(true)}
              style={{
                background: 'var(--color-accent)', border: 'none', borderRadius: '10px',
                padding: '5px 12px', fontSize: '11px', fontWeight: 700,
                color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {quests.map((quest, i) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <QuestCard quest={quest} onComplete={handleComplete} onMotionVerify={handleMotionVerify} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Quest Modal */}
      <AnimatePresence>
        {showAddQuest && (
          <>
            <motion.div
              onClick={() => setShowAddQuest(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              style={{
                position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 51,
                background: 'var(--color-panel)', border: '1px solid var(--color-border)',
                borderRadius: '24px', padding: '20px', maxWidth: '480px', margin: '0 auto'
              }}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>New Quest</span>
                <button onClick={() => setShowAddQuest(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <input
                type="text" placeholder="Quest title..." value={newQuestTitle}
                onChange={e => setNewQuestTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '14px', marginBottom: '12px',
                  background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '14px', outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>XP Reward</div>
                  <select value={newQuestXp} onChange={e => setNewQuestXp(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '13px' }}>
                    <option value={5}>+5 XP</option>
                    <option value={10}>+10 XP</option>
                    <option value={15}>+15 XP</option>
                    <option value={20}>+20 XP</option>
                    <option value={30}>+30 XP</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Type</div>
                  <select value={newQuestMotion ? 'motion' : 'manual'} onChange={e => setNewQuestMotion(e.target.value === 'motion')}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '13px' }}>
                    <option value="manual">Manual</option>
                    <option value="motion">Motion Verify</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddQuest} style={{
                width: '100%', padding: '13px', borderRadius: '14px', background: 'var(--color-accent)',
                color: '#000', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }}>
                Add Quest
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LevelUpModal show={showLevelUp} level={level} onClose={() => setShowLevelUp(false)} />
    </div>
  );
}