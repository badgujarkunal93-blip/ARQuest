import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Shield, Plus, X, ChevronRight, CheckCircle, RotateCcw, Volume2, VolumeX, ChevronDown, Dumbbell, Info } from 'lucide-react';
import { EXERCISE_LIBRARY } from '@/components/motioncore/FormScoreEngine';
import PoseTracker from '@/components/motioncore/PoseTracker';
import GhostTrainer from '@/components/motioncore/GhostTrainer';
import MotionCoach from '@/components/motioncore/MotionCoach';
import LevelUpModal, { getAvatar } from './LevelUpModal';
import { motionSessionService } from '@/services/motionSessionService';

const XP_PER_LEVEL = 100;
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

const DEFAULT_QUESTS = [
  { id: '1', title: 'Complete 10 Squats', xp: 20, requiresMotion: true, completed: false, streak: 0, motionVerified: false },
  { id: '2', title: 'Do 10 Push-ups', xp: 20, requiresMotion: true, completed: false, streak: 2, motionVerified: false },
  { id: '3', title: 'Drink 2L of Water', xp: 10, requiresMotion: false, completed: false, streak: 3, motionVerified: false },
  { id: '4', title: 'Read for 20 Minutes', xp: 15, requiresMotion: false, completed: false, streak: 1, motionVerified: false },
  { id: '5', title: 'Complete 10 Lunges', xp: 20, requiresMotion: true, completed: false, streak: 0, motionVerified: false },
  { id: '6', title: 'Meditate for 5 Minutes', xp: 15, requiresMotion: false, completed: false, streak: 4, motionVerified: false },
];

export default function HomeScreen() {
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

  // Motion state
  const [activeQuest, setActiveQuest] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [questVerified, setQuestVerified] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);

  const prevRepCountRef = useRef(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const voiceSupportedRef = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const lastSpokenRef = useRef('');
  const lastSpeakAtRef = useRef(0);

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
      if (activeQuest && !questVerified && frame.repState.repCount >= 10) {
        setQuestVerified(true);
      }
    }
    if (frame.repState.latestEvent) speak(frame.repState.latestEvent.message);
  }, [analysis, speak, activeQuest, questVerified]);

  const handleStartMotion = (quest) => {
    setActiveQuest(quest);
    setSelectedExercise(EXERCISES.find(e => quest.title.toLowerCase().includes(e.id)) || EXERCISES[0]);
    setSessionActive(true);
    setQuestVerified(false);
    prevRepCountRef.current = 0;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  const handleEndSave = useCallback(async () => {
    clearInterval(timerRef.current);
    setSessionActive(false);
    const repState = analysis?.repState;
    if (repState?.repCount > 0) {
      await motionSessionService.createSession({
        exercise_type: selectedExercise.id,
        total_reps: repState.repCount,
        perfect_reps: repState.perfectReps || 0,
        duration_seconds: elapsed,
        accuracy_percentage: Math.round(((repState.perfectReps || 0) / repState.repCount) * 100),
        xp_earned: xpGained,
      });
      if (questVerified && activeQuest) {
        const quest = quests.find(q => q.id === activeQuest.id);
        if (quest && !quest.completed) {
          setQuests(prev => prev.map(q => q.id === activeQuest.id ? { ...q, completed: true, streak: q.streak + 1, motionVerified: true } : q));
          const newXp = xp + quest.xp + xpGained;
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
          if (newLevel > level) { setLevel(newLevel); setShowLevelUp(true); }
          setXp(newXp);
        }
      }
    }
    setActiveQuest(null);
    setAnalysis(null);
    setXpGained(0);
    setElapsed(0);
    prevRepCountRef.current = 0;
    setQuestVerified(false);
  }, [analysis, elapsed, selectedExercise.id, xpGained, questVerified, activeQuest, quests, xp, level]);

  const handleCompleteQuest = (id) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true, streak: q.streak + 1 } : q));
    const newXp = xp + quest.xp;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    if (newLevel > level) { setLevel(newLevel); setShowLevelUp(true); }
    setXp(newXp);
  };

  const handleAddQuest = () => {
    if (!newQuestTitle.trim()) return;
    setQuests(prev => [...prev, {
      id: crypto.randomUUID(), title: newQuestTitle.trim(),
      xp: newQuestXp, requiresMotion: newQuestMotion,
      completed: false, streak: 0, motionVerified: false,
    }]);
    setNewQuestTitle(''); setNewQuestXp(10); setNewQuestMotion(false); setShowAddQuest(false);
  };

  const formAnalysis = analysis?.formAnalysis || null;
  const repState = analysis?.repState || null;
  const ghostMatch = analysis?.ghostMatch || null;

  return (
    <div style={{ height: 'calc(100vh - 58px)', background: 'var(--color-bg)', display: 'grid', gridTemplateColumns: '300px 1fr 280px', overflow: 'hidden' }}>

      {/* ── LEFT — Quests ── */}
      <div style={{ borderRight: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

        {/* XP Card */}
        <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡ XP Progress</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>{xpInLevel} / {XP_PER_LEVEL}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
            <motion.div style={{ height: '100%', background: 'var(--color-accent)', borderRadius: '99px' }}
              animate={{ width: `${xpProgress}%` }} transition={{ duration: 0.6 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <span>Level {level}</span>
            <span style={{ color: 'var(--color-warning)' }}>🔥 {streak} day streak</span>
            <span>Level {level + 1}</span>
          </div>
        </div>

        {/* Boss Battle */}
        <AnimatePresence>
          {completedCount >= 5 && (
            <motion.div style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Shield size={18} color="var(--color-accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)' }}>Boss Battle Unlocked!</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>5 quests completed</div>
              </div>
              <ChevronRight size={14} color="var(--color-accent)" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quests Header */}
        <div id="motion-quests" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today's Quests</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setQuests(quests.map(q => ({ ...q, completed: false, motionVerified: false })))}
              style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              Reset
            </button>
            <button onClick={() => setShowAddQuest(true)}
              style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Plus size={11} /> Add
            </button>
          </div>
        </div>

        {/* Quest List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {quests.map((quest, i) => (
            <motion.div key={quest.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '13px',
                background: activeQuest?.id === quest.id ? 'var(--color-accent-dim)' : quest.completed ? 'rgba(255,255,255,0.02)' : 'var(--color-panel)',
                border: `1px solid ${activeQuest?.id === quest.id ? 'var(--color-border-accent)' : quest.completed ? 'rgba(255,255,255,0.04)' : 'var(--color-border)'}`,
              }}>
              <button onClick={() => !quest.completed && !quest.requiresMotion && handleCompleteQuest(quest.id)}
                style={{ background: 'none', border: 'none', cursor: quest.completed ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}>
                {quest.completed
                  ? <CheckCircle size={20} color="var(--color-accent)" />
                  : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${activeQuest?.id === quest.id ? 'var(--color-accent)' : 'var(--color-text-muted)'}` }} />
                }
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: quest.completed ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: quest.completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                  {quest.title}
                </div>
                <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--color-warning)' }}>⚡ +{quest.xp} XP</span>
                  {quest.streak > 0 && <span style={{ color: 'var(--color-text-muted)' }}>🔥 {quest.streak} days</span>}
                  {activeQuest?.id === quest.id && <span style={{ color: 'var(--color-accent)' }}>Verifying...</span>}
                  {quest.motionVerified && <span style={{ color: 'var(--color-accent)' }}>Motion ✓</span>}
                </div>
              </div>
              {quest.requiresMotion && !quest.completed && (
                activeQuest?.id === quest.id ? (
                  <button onClick={handleEndSave}
                    style={{ background: '#ef4444', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
                    ◼ Stop
                  </button>
                ) : (
                  <button onClick={() => handleStartMotion(quest)}
                    style={{ background: 'var(--color-accent)', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: '#000', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} /> Verify
                  </button>
                )
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CENTER — Camera ── */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px', overflowY: 'auto' }}>
        {activeQuest ? (
          <>
            {/* Camera Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>Motion Core</h2>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>Verifying: {activeQuest.title}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!showInstructions && (
                  <button onClick={() => setShowInstructions(true)}
                    style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '7px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
                    <Info size={15} />
                  </button>
                )}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowSelector(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                    <Dumbbell size={14} color="var(--color-accent)" />
                    {selectedExercise.label}
                    <ChevronDown size={13} color="var(--color-text-muted)" />
                  </button>
                  <AnimatePresence>
                    {showSelector && (
                      <motion.div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden', minWidth: '160px' }}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        {EXERCISES.map(ex => (
                          <button key={ex.id} onClick={() => { setSelectedExercise(ex); setShowSelector(false); }}
                            style={{ width: '100%', padding: '10px 14px', border: 'none', textAlign: 'left', background: selectedExercise.id === ex.id ? 'var(--color-accent-dim)' : 'transparent', color: selectedExercise.id === ex.id ? 'var(--color-accent)' : 'var(--color-text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                            {ex.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '8px 14px', fontSize: '14px', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {formatDuration(elapsed)}
                </div>
                <button onClick={() => setVoiceEnabled(v => !v)}
                  style={{ background: voiceEnabled ? 'var(--color-accent-dim)' : 'var(--color-panel)', border: `1px solid ${voiceEnabled ? 'var(--color-border-accent)' : 'var(--color-border)'}`, borderRadius: '10px', padding: '8px', cursor: 'pointer', color: voiceEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)', display: 'flex' }}>
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button onClick={handleEndSave}
                  style={{ background: '#ef4444', border: 'none', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} /> End & Save
                </button>
              </div>
            </div>

            {/* Instructions */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div style={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '16px', padding: '14px 16px' }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7' }}>💡 How to use Motion Core</span>
                    <button onClick={() => setShowInstructions(false)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}><X size={15} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {['Select exercise', 'Stand back — full body visible', 'Perform reps — auto tracked', 'End & Save to store progress'].map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#a855f7', flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: '12px', color: '#d4d4d4' }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quest Verified */}
            <AnimatePresence>
              {questVerified && (
                <motion.div style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)', borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <CheckCircle size={16} color="var(--color-accent)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>Quest Verified by Motion Core! 🎉</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera */}
            <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--color-border)', flex: 1, minHeight: '300px' }}>
              <PoseTracker
                exercise={selectedExercise.id}
                active={sessionActive}
                countingEnabled={sessionActive}
                onAnalysisChange={handleAnalysisChange}
              />
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Reps', value: repState?.repCount ?? 0, emoji: '💪' },
                { label: 'Perfect', value: repState?.perfectReps ?? 0, emoji: '⭐' },
                { label: 'XP', value: `+${xpGained}`, emoji: '⚡' },
                { label: 'Fatigue', value: `${Math.round((repState?.fatigueIndex ?? 0) * 100)}%`, emoji: '🔥' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', marginBottom: '4px' }}>{stat.emoji}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.5px' }}>{stat.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Idle State */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', maxWidth: '380px' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏆</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Ready to Quest?</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Click <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Verify</span> on any motion quest to start tracking reps with Motion Core.
              </p>
              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)' }}>How to use Motion Core</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { step: '1', text: 'Click Verify on any motion quest on the left' },
                    { step: '2', text: 'Allow camera access when prompted' },
                    { step: '3', text: 'Stand back so your full body is visible' },
                    { step: '4', text: 'Perform your reps — skeleton tracks automatically' },
                    { step: '5', text: 'Click End & Save to store your session' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)',
                      }}>
                        {item.step}
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '14px', padding: '10px 12px', borderRadius: '12px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: 600 }}>
                    Always click End & Save to store reps in Progress!
                  </span>
                </div>
              </div>
              {/*
                  { emoji: '🎯', label: 'Track Reps', desc: 'Auto-counted by AI' },
                  { emoji: '👤', label: 'Ghost Trainer', desc: 'Match the skeleton' },
                  { emoji: '📊', label: 'Form Score', desc: 'Real-time feedback' },
                ].map(f => (
                  <div
                    key={f.label}
                    onClick={() => {
                      if (f.label === 'Track Reps') {
                        const el = document.getElementById('motion-quests');
                        el?.scrollIntoView({ behavior: 'smooth' });
                        return;
                      }
                      if (f.label === 'Ghost Trainer') {
                        alert('Ghost Trainer overlays a transparent skeleton guide - match your body to it for perfect form!');
                        return;
                      }
                      alert('Form Score analyzes your posture, depth and balance in real-time giving you a live % score!');
                    }}
                    style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{f.emoji}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
              */}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT — Form Score + AI + Badges ── */}
      <div style={{ borderLeft: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

        {/* Form Score */}
        <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Form Score</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-1px', marginBottom: '12px' }}>
            {formAnalysis?.score ?? 0}%
          </div>
          {[
            { label: 'Posture', value: formAnalysis?.posture ?? 0 },
            { label: 'Depth', value: formAnalysis?.depth ?? 0 },
            { label: 'Balance', value: formAnalysis?.balance ?? 0 },
          ].map(sub => (
            <div key={sub.label} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                <span>{sub.label}</span><span>{sub.value}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: '99px', background: sub.value >= 80 ? 'var(--color-success)' : sub.value >= 60 ? 'var(--color-warning)' : 'var(--color-danger)' }}
                  animate={{ width: `${sub.value}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>
          ))}
          {formAnalysis && (
            <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '9px', fontSize: '11px', fontWeight: 700, background: formAnalysis.primaryFeedback === 'Correct Form' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: formAnalysis.primaryFeedback === 'Correct Form' ? 'var(--color-success)' : 'var(--color-danger)', border: `1px solid ${formAnalysis.primaryFeedback === 'Correct Form' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {formAnalysis.primaryFeedback}
            </div>
          )}
        </div>

        {/* Ghost Match */}
        {ghostMatch && (
          <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Ghost Match</div>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-1px', marginBottom: '6px' }}>{ghostMatch.score}%</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{ghostMatch.feedback}</div>
          </div>
        )}

        {/* AI Insight */}
        <div style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-border-accent)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '26px', height: '26px', background: 'var(--color-accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 800 }}>AI</div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ARQuest AI</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.7, margin: 0 }}>
            {activeQuest ? `Tracking ${activeQuest.title}. Focus on form — perfect reps earn bonus XP!` : 'Complete quests to earn XP and level up your avatar. Motion-verified quests give bonus rewards!'}
          </p>
        </div>

        {/* Badges */}
        <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Badges</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { emoji: '🎯', label: 'First Quest', unlocked: true },
              { emoji: '💪', label: 'Rep Master', unlocked: false },
              { emoji: '⭐', label: 'Perfect Form', unlocked: false },
              { emoji: '⚡', label: 'XP Hunter', unlocked: true },
              { emoji: '⚔️', label: 'Warrior', unlocked: false },
              { emoji: '👑', label: 'Legend', unlocked: false },
            ].map(badge => (
              <div key={badge.label} style={{ background: badge.unlocked ? 'var(--color-accent-dim)' : 'var(--color-bg)', border: `1px solid ${badge.unlocked ? 'var(--color-border-accent)' : 'var(--color-border)'}`, borderRadius: '12px', padding: '10px 4px', textAlign: 'center', opacity: badge.unlocked ? 1 : 0.4 }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{badge.emoji}</div>
                <div style={{ fontSize: '9px', color: badge.unlocked ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: 600 }}>{badge.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Quest Modal */}
      <AnimatePresence>
        {showAddQuest && (
          <>
            <motion.div onClick={() => setShowAddQuest(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 51, background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '24px', width: '400px' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>New Quest</span>
                <button onClick={() => setShowAddQuest(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input type="text" placeholder="Quest title..." value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', marginBottom: '12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '14px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>XP Reward</div>
                  <select value={newQuestXp} onChange={e => setNewQuestXp(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '13px' }}>
                    {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>+{v} XP</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Type</div>
                  <select value={newQuestMotion ? 'motion' : 'manual'} onChange={e => setNewQuestMotion(e.target.value === 'motion')} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '13px' }}>
                    <option value="manual">Manual</option>
                    <option value="motion">Motion Verify</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddQuest} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'var(--color-accent)', color: '#000', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
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
