import { motion } from 'framer-motion';
import { Home, Zap, TrendingUp, Brain } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'motion', label: 'Motion', icon: Zap },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'ai', label: 'AI', icon: Brain },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(13,13,13,0.95)', borderTop: '1px solid var(--color-border)',
      backdropFilter: 'blur(20px)', display: 'flex',
      padding: '10px 0 24px',
    }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 0', position: 'relative'
            }}
          >
            <motion.div
              animate={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)', scale: isActive ? 1.1 : 1 }}
              transition={{ duration: 0.15 }}
              style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            >
              <Icon size={22} />
            </motion.div>
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              transition: 'color 0.15s'
            }}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-dot"
                style={{
                  position: 'absolute', bottom: '-10px', width: '4px', height: '4px',
                  borderRadius: '50%', background: 'var(--color-accent)'
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}