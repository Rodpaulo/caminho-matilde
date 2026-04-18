import { useState } from 'react';
import TodayScreen from '../components/TodayScreen';
import MapScreen from '../components/MapScreen';
import StampsScreen from '../components/StampsScreen';
import JournalScreen from '../components/JournalScreen';

const TABS = [
  { id: 'today', label: 'Hoje', icon: '☀' },
  { id: 'map', label: 'Mapa', icon: '⤴' },
  { id: 'stamps', label: 'Carimbos', icon: '◎' },
  { id: 'journal', label: 'Diário', icon: '✎' },
];

export default function PilgrimApp() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#FAF9F5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Main content area */}
      <main style={{ flex: 1, overflow: 'auto', paddingBottom: 80 }}>
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'stamps' && <StampsScreen />}
        {activeTab === 'journal' && <JournalScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '0.5px solid #D3D1C7',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 16px',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              color: activeTab === tab.id ? '#0F6E56' : '#888780',
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 500 : 400,
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}