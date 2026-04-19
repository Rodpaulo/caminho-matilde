import { useState } from 'react';
import TodayScreen from '../components/TodayScreen';
import MapScreen from '../components/MapScreen';
import StampsScreen from '../components/StampsScreen';
import JournalScreen from '../components/JournalScreen';
import SantiagoScreen from '../components/SantiagoScreen';

const TABS = [
  { id: 'today', label: 'Hoje', icon: '☀' },
  { id: 'map', label: 'Mapa', icon: '⤴' },
  { id: 'stamps', label: 'Carimbos', icon: '◎' },
  { id: 'journal', label: 'Diário', icon: '✎' },
  { id: 'santiago', label: 'Santiago', icon: '✦' },
];

export default function PilgrimApp() {
  const [activeTab, setActiveTab] = useState('today');

  const isSantiago = activeTab === 'santiago';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isSantiago ? '#2C2C2A' : '#FAF9F5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'background 0.2s',
    }}>
      {/* Main content area */}
      <main style={{ flex: 1, overflow: 'auto', paddingBottom: 80 }}>
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'stamps' && <StampsScreen />}
        {activeTab === 'journal' && <JournalScreen />}
        {activeTab === 'santiago' && <SantiagoScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: isSantiago ? '#2C2C2A' : 'white',
        borderTop: isSantiago ? '0.5px solid #444441' : '0.5px solid #D3D1C7',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 16px',
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const activeColor = '#0F6E56';
          const inactiveColor = isSantiago ? '#5F5E5A' : '#888780';
          return (
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
                padding: '6px 8px',
                color: isActive ? activeColor : inactiveColor,
                fontSize: 10,
                fontWeight: isActive ? 500 : 400,
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 17 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}