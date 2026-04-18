import { useCaminho } from './hooks/useCaminho';

export default function App() {
  const { data, loading, error, update } = useCaminho();

  function toggleName() {
    update(current => ({
      ...current,
      pilgrim: {
        ...current.pilgrim,
        name: current.pilgrim.name === 'Matilde' ? 'Matilde ✓' : 'Matilde',
      },
    }));
  }

  if (loading) return <div style={{ padding: 40 }}>loading...</div>;

  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>useCaminho hook test</h1>
      <p><strong>Status:</strong> {error === 'offline' ? '🔴 offline (queued)' : '🟢 online'}</p>
      <p><strong>Pilgrim name:</strong> {data?.pilgrim?.name}</p>
      <button onClick={toggleName} style={{ padding: '10px 20px', fontSize: 16 }}>
        Toggle name
      </button>
      <p style={{ fontSize: 12, color: '#666', marginTop: 20 }}>
        Tap the button — the name changes instantly (optimistic update)
        and writes to JSONBin in the background.
      </p>
    </div>
  );
}