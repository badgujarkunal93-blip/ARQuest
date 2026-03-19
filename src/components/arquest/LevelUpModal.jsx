import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star } from 'lucide-react';

const AVATARS = [
  { minLevel: 1, label: 'Novice', emoji: '🧑' },
  { minLevel: 3, label: 'Apprentice', emoji: '🥋' },
  { minLevel: 5, label: 'Warrior', emoji: '⚔️' },
  { minLevel: 8, label: 'Elite', emoji: '🛡️' },
  { minLevel: 10, label: 'Legend', emoji: '👑' },
];

export function getAvatar(level) {
  return [...AVATARS].reverse().find((a) => level >= a.minLevel) || AVATARS[0];
}

export default function LevelUpModal({ show, level, onClose }) {
  const avatar = getAvatar(level);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-3xl p-8 text-center w-full max-w-sm"
              style={{
                background: 'var(--color-panel)',
                border: '2px solid var(--color-accent)',
                boxShadow: '0 0 60px var(--color-accent-dim)',
              }}
              initial={{ scale: 0.5, y: 60 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Glow rings */}
              <div className="relative flex items-center justify-center mb-6">
                <motion.div
                  className="absolute w-32 h-32 rounded-full"
                  style={{ border: '2px solid var(--color-accent)', opacity: 0.3 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute w-24 h-24 rounded-full"
                  style={{ border: '2px solid var(--color-accent)', opacity: 0.5 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="text-6xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {avatar.emoji}
                </motion.div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
                  >
                    <Star size={20} fill="var(--color-warning)" color="var(--color-warning)" />
                  </motion.div>
                ))}
              </div>

              <motion.p
                className="text-xs uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-accent)', fontFamily: 'Orbitron, sans-serif' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Level Up!
              </motion.p>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--color-text)', fontFamily: 'Orbitron, sans-serif' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Level {level}
              </motion.h2>

              <motion.p
                className="text-lg font-semibold mb-6"
                style={{ color: 'var(--color-accent)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {avatar.label}
              </motion.p>

              <motion.button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                style={{
                  background: 'var(--color-accent)',
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Orbitron, sans-serif',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.97 }}
              >
                <Zap size={16} />
                Continue Quest
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}