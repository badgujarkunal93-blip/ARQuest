import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-accent)',
          cursor: 'pointer',
        }}
      >
        <Palette size={16} />
        <span className="text-xs font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Theme
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl p-5"
              style={{
                background: 'var(--color-panel)',
                border: '1px solid var(--color-border)',
                maxWidth: '480px',
                margin: '0 auto',
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm uppercase tracking-widest"
                  style={{ color: 'var(--color-accent)', fontFamily: 'Orbitron, sans-serif' }}
                >
                  Choose Theme
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{
                      background: theme === t.id ? 'var(--color-accent-dim)' : 'transparent',
                      border: `1px solid ${theme === t.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }}
                    />
                    <span
                      className="text-xs font-semibold text-center leading-tight"
                      style={{
                        color: theme === t.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        fontFamily: 'Rajdhani, sans-serif',
                      }}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}