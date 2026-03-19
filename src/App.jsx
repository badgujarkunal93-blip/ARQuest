import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import TopNav from '@/components/arquest/TopNav';
import HomeScreen from '@/components/arquest/HomeScreen';
import ProgressScreen from '@/components/arquest/ProgressScreen';
import AIInsightScreen from '@/components/arquest/AIInsightScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <ThemeProvider>
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <TopNav activeTab={activeTab} onChange={setActiveTab} />
        <div style={{ paddingTop: '58px' }}>
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'progress' && <ProgressScreen />}
          {activeTab === 'ai' && <AIInsightScreen />}
        </div>
      </div>
    </ThemeProvider>
  );
}
