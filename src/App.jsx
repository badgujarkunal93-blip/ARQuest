import { useState, useRef } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import BottomNav from '@/components/arquest/BottomNav';
import HomeScreen from '@/components/arquest/HomeScreen';
import MotionScreen from '@/components/arquest/MotionScreen';
import ProgressScreen from '@/components/arquest/ProgressScreen';
import AIInsightScreen from '@/components/arquest/AIInsightScreen';
import { Smartphone, X } from 'lucide-react';

function MobileBanner() {
  const [dismissed, setDismissed] = useState(false);

  // Only show on desktop (screen width > 480px)
  if (dismissed || window.innerWidth <= 480) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#1a1a1a',
      borderBottom: '1px solid rgba(168,85,247,0.3)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    }}>
      <Smartphone size={15} color="#a855f7" style={{ flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: '13px', color: '#f5f5f5' }}>
        ARQuest is best experienced on mobile.{' '}
        <span style={{ color: '#a855f7', fontWeight: 600 }}>
          Open on your phone for the full experience!
        </span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#737373', padding: '2px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const verifyQuestRef = useRef(null);

  const handleMotionVerify = (quest) => {
    verifyQuestRef.current = quest;
    setActiveTab('motion');
  };

  const handleQuestVerified = () => {
    verifyQuestRef.current = null;
  };

  return (
    <ThemeProvider>
      <MobileBanner />

      {/* Full page dark background */}
      <div style={{ minHeight: '100vh', background: '#080808' }}>

        {/* Centered app container */}
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          minHeight: '100vh',
          position: 'relative',
          background: 'var(--color-bg)',
          boxShadow: '0 0 80px rgba(0,0,0,0.8)',
        }}>

          {activeTab === 'home' && (
            <HomeScreen
              onNavigate={setActiveTab}
              onMotionVerify={handleMotionVerify}
            />
          )}
          {activeTab === 'motion' && (
            <MotionScreen
              verifyQuest={verifyQuestRef.current}
              onQuestVerified={handleQuestVerified}
            />
          )}
          {activeTab === 'progress' && <ProgressScreen />}
          {activeTab === 'ai' && <AIInsightScreen />}

          <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>

      </div>
    </ThemeProvider>
  );
}