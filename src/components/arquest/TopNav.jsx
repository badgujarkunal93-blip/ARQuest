import { useTheme } from '@/context/ThemeContext';
import ThemePicker from './ThemePicker';
import { getAvatar } from './LevelUpModal';

export default function TopNav({ activeTab, onChange }) {
  const level = parseInt(localStorage.getItem('arquest-level') || '1');
  const avatar = getAvatar(level);

  const TABS = [
    { id: 'home', label: 'Home' },
    { id: 'progress', label: 'Progress' },
    { id: 'ai', label: 'AI Insight' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: '58px', background: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
        AR<span style={{ color: 'var(--color-accent)' }}>Quest</span>
      </div>

      <div style={{
        display: 'flex', gap: '2px',
        background: 'var(--color-panel)',
        borderRadius: '12px', padding: '4px',
        border: '1px solid var(--color-border)',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            padding: '7px 20px', borderRadius: '9px',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: activeTab === tab.id ? 'var(--color-bg)' : 'transparent',
            color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-muted)',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ThemePicker />
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--color-panel)', border: '1px solid var(--color-border)',
          borderRadius: '12px', padding: '7px 14px',
        }}>
          <span style={{ fontSize: '20px' }}>{avatar.emoji}</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>Lv.{level}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{avatar.label}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
