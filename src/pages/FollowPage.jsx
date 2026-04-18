import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { readBinReadOnly } from '../lib/jsonbin';

export default function FollowPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const fresh = await readBinReadOnly();
        if (!mounted) return;
        if (fresh.pilgrim.followToken !== token) {
          setStatus('forbidden');
          return;
        }
        setData(fresh);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        setStatus('error: ' + err.message);
      }
    }

    load();
    return () => { mounted = false; };
  }, [token]);

  if (status === 'loading') {
    return <div style={{ padding: 40, fontFamily: 'system-ui' }}>A carregar...</div>;
  }

  if (status === 'forbidden') {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui' }}>
        <h1>Página não encontrada</h1>
        <p>O link que usaste não é válido.</p>
      </div>
    );
  }

  if (status.startsWith('error')) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', color: 'red' }}>
        <h1>Erro</h1>
        <p>{status}</p>
      </div>
    );
  }

  // status === 'ready' — we have data and the token matched
  const walkedStages = data.stages.filter(s => s.arrivedAt);
  const walkedKm = walkedStages.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalKm = data.stages.reduce((sum, s) => sum + s.distanceKm, 0);

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Follow Page — {data.pilgrim.name}</h1>
      <p><strong>Token matched:</strong> ✓</p>
      <p><strong>Start date:</strong> {data.pilgrim.startDate}</p>
      <p><strong>Stages completed:</strong> {walkedStages.length} / {data.stages.length}</p>
      <p><strong>Distance walked:</strong> {walkedKm} / {totalKm} km</p>
      <hr />
      <p style={{ color: '#666', fontSize: 14 }}>
        This is just the raw data view. Visual design comes in Layer 5.
      </p>
    </div>
  );
}