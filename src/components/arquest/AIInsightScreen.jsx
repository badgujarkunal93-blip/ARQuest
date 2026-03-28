import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Send, Zap } from 'lucide-react';
import { motionSessionService } from '@/services/motionSessionService';
import { getAvatar } from './LevelUpModal';

const QUICK_PROMPTS = [
  { emoji: '💪', text: 'How can I improve my squat form?' },
  { emoji: '📈', text: 'What is the best workout plan for me?' },
  { emoji: '🏆', text: 'How do I unlock the next badge?' },
  { emoji: '⚡', text: 'How can I earn more XP faster?' },
];

export default function AIInsightScreen() {
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalSessions: 0, totalReps: 0,
    totalPerfectReps: 0, totalDuration: 0, totalXp: 0,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const level = parseInt(localStorage.getItem('arquest-level') || '1');
  const xp = parseInt(localStorage.getItem('arquest-xp') || '0');
  const streak = parseInt(localStorage.getItem('motioncore-streak') || '0');
  const avatar = getAvatar(level);

  useEffect(() => {
    motionSessionService.getTotalStats().then(stats => {
      setTotals(stats);
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm your ARQuest Coach powered by Groq AI. I can see your stats — Level ${level}, ${streak}-day streak, ${stats.totalReps} total reps. Ask me anything about your training, form tips, or how to level up faster! 💪`,
      }]);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemPrompt = () => `You are ARQuest Coach, a gamified fitness coach built into ARQuest app.
The user's current stats:
- Level: ${level} (${avatar.label})
- Total XP: ${xp}
- Streak: ${streak} days
- Total Sessions: ${totals.totalSessions}
- Total Reps: ${totals.totalReps}
- Perfect Reps: ${totals.totalPerfectReps}
- Time Trained: ${Math.floor(totals.totalDuration / 60)} minutes

ARQuest features: habit quests, motion-verified exercises (squats, push-ups, lunges, jumping jacks), XP system, levels, badges (First Quest at 1 session, Rep Master at 50 reps, Perfect Form at 10 perfect reps, XP Hunter at 100 XP, Warrior at 5 sessions, Legend at 200 reps).

Be motivating, concise, and gamified in tone. Keep responses under 3 sentences. Use emojis sparingly.`;

  const callGroq = async (messages) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || data.error.type || 'API error');
    return data.choices?.[0]?.message?.content || '';
  };

  const generateInsight = async () => {
    setInsightLoading(true);
    setInsight('');
    try {
      const reply = await callGroq([
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: 'Give me one powerful personalized insight about my progress in exactly 2 sentences. Be specific to my stats. No preamble.' },
      ]);
      setInsight(reply || 'Keep pushing — every rep brings you closer to your next level!');
    } catch (e) {
      console.error('Insight error:', e);
      setInsight(e.message?.includes('rate_limit') ? 'API rate limit reached. Please wait a minute and try again.' : 'Your consistency is your greatest weapon. Every rep earned is XP that compounds over time.');
    } finally {
      setInsightLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || chatLoading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      // Build conversation for Groq (OpenAI format)
      const groqMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      const reply = await callGroq(groqMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply || 'Keep going! Every rep counts. 💪' }]);
    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = e.message?.includes('rate_limit') 
        ? 'API rate limit reached. Please wait a minute and try again! ⏳' 
        : e.message?.includes('invalid_api_key') || e.message?.includes('401')
          ? 'Invalid API key. Please check your Groq API key in .env 🔑' 
          : `Connection issue: ${e.message}. Please try again!`;
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Generate insight on mount
  useEffect(() => {
    if (totals.totalSessions >= 0) generateInsight();
  }, [totals]);

  return (
    <div style={{ height: 'calc(100vh - 58px)', background: 'var(--color-bg)', display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ borderRight: '1px solid var(--color-border)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>

        {/* AI Hero Insight */}
        <motion.div
          style={{ background: 'linear-gradient(135deg, var(--color-accent-dim), rgba(0,0,0,0))', border: '1px solid var(--color-border-accent)', borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--color-accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#000' }}>AI</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ARQuest AI</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Powered by Groq AI</div>
            </div>
          </div>

          {insightLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Zap size={16} color="var(--color-accent)" />
              </motion.div>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Analyzing your quest data...</span>
            </div>
          ) : (
            <motion.p
              style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.7, margin: '0 0 14px', fontWeight: 500 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              {insight || 'Generating your personalized insight...'}
            </motion.p>
          )}

          <button
            onClick={generateInsight}
            disabled={insightLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: insightLoading ? 'var(--color-panel)' : 'var(--color-accent)', border: 'none', borderRadius: '10px', color: insightLoading ? 'var(--color-text-muted)' : '#000', fontSize: '12px', fontWeight: 700, cursor: insightLoading ? 'not-allowed' : 'pointer' }}
          >
            <RefreshCw size={13} /> New Insight
          </button>
        </motion.div>

        {/* Stats Snapshot */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          {[
            { label: 'Level', value: level },
            { label: 'Streak', value: `${streak}d` },
            { label: 'XP', value: xp },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)', letterSpacing: '-0.5px' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
            Quick Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <motion.button
                key={i}
                onClick={() => sendMessage(prompt.text)}
                disabled={chatLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '12px', cursor: chatLoading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%', transition: 'border 0.15s' }}
                whileHover={{ borderColor: 'var(--color-accent)' }}
              >
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{prompt.emoji}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{prompt.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── RIGHT PANEL — Chatbot ── */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Chat Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>ARQuest Coach</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>Ask anything about your fitness</span>
          <button
            onClick={() => setMessages([{
              role: 'assistant',
              content: `Hey! I'm your ARQuest Coach. Level ${level}, ${streak}-day streak, ${totals.totalReps} total reps. What can I help you with? 💪`,
            }])}
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '10px', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
              >
                {/* Avatar */}
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: msg.role === 'assistant' ? 'var(--color-accent)' : 'var(--color-panel)', border: msg.role === 'user' ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: msg.role === 'assistant' ? '11px' : '14px', fontWeight: 800, color: msg.role === 'assistant' ? '#000' : 'var(--color-text)', flexShrink: 0 }}>
                  {msg.role === 'assistant' ? 'AI' : '👤'}
                </div>
                {/* Bubble */}
                <div style={{ padding: '11px 15px', borderRadius: msg.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: msg.role === 'assistant' ? 'var(--color-panel)' : 'var(--color-accent-dim)', border: `1px solid ${msg.role === 'assistant' ? 'var(--color-border)' : 'var(--color-border-accent)'}`, fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text)', maxWidth: '100%', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {chatLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#000', flexShrink: 0 }}>AI</div>
              <div style={{ padding: '11px 15px', borderRadius: '4px 16px 16px 16px', background: 'var(--color-panel)', border: '1px solid var(--color-border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)' }}
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask your coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={chatLoading}
            style={{ flex: 1, background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '11px 16px', fontSize: '13px', color: 'var(--color-text)', outline: 'none' }}
          />
          <motion.button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatLoading}
            style={{ width: '42px', height: '42px', background: input.trim() && !chatLoading ? 'var(--color-accent)' : 'var(--color-panel)', border: `1px solid ${input.trim() && !chatLoading ? 'transparent' : 'var(--color-border)'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !chatLoading ? 'pointer' : 'not-allowed', flexShrink: 0 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={16} color={input.trim() && !chatLoading ? '#000' : 'var(--color-text-muted)'} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}