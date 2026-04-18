import { useCaminho } from '../hooks/useCaminho';

// Weather status options for the pilgrim to set
const WEATHER_OPTIONS = [
  { id: 'great', icon: '☀', label: 'dia bom' },
  { id: 'tired-good', icon: '⛅', label: 'cansada mas bem' },
  { id: 'hard', icon: '🌧', label: 'dia duro' },
  { id: 'surprise', icon: '🌈', label: 'surpresa boa' },
  { id: 'sleeping', icon: '🌙', label: 'a dormir' },
];

function findCurrentStage(stages) {
  // First priority: a stage in progress (started, not arrived)
  const inProgress = stages.find(s => s.startedAt && !s.arrivedAt);
  if (inProgress) return inProgress;

  // Second priority: the first stage not yet started
  const notStarted = stages.find(s => !s.startedAt);
  if (notStarted) return notStarted;

  // Fallback: all done — show the last stage
  return stages[stages.length - 1];
}

function getStageState(stage) {
  if (stage.arrivedAt) return 'arrived';
  if (stage.startedAt) return 'walking';
  return 'not-started';
}

export default function TodayScreen() {
  const { data, loading } = useCaminho();

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const stage = findCurrentStage(data.stages);
  const state = getStageState(stage);
  const totalStages = data.stages.length;

  const buttonLabel = state === 'not-started'
    ? 'Comecei a caminhar'
    : state === 'walking'
    ? 'Cheguei'
    : 'A descansar';

  const buttonDisabled = state === 'arrived';

  return (
    <div style={{ padding: '24px 20px', maxWidth: 420, margin: '0 auto' }}>
      <p style={{
        fontSize: 11,
        color: '#888780',
        letterSpacing: 1.5,
        textAlign: 'center',
        margin: '0 0 14px',
        textTransform: 'uppercase',
      }}>
        HOJE
      </p>

      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 28,
        padding: '22px 20px',
      }}>
        {/* Day counter + weather */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          fontSize: 13,
          color: '#5F5E5A',
        }}>
          <span>Dia {stage.day} de {totalStages}</span>
          <span style={{ fontSize: 18 }}>
            {stage.weatherStatus
              ? WEATHER_OPTIONS.find(o => o.id === stage.weatherStatus)?.icon
              : '—'}
          </span>
        </div>

        {/* From → To */}
        <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 2px', color: '#2C2C2A' }}>
          {stage.from}
        </h2>
        <p style={{ fontSize: 14, color: '#5F5E5A', margin: '0 0 18px' }}>
          → {stage.to}
        </p>

        {/* Distance & time stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <div style={{ flex: 1, background: '#F1EFE8', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#5F5E5A', margin: '0 0 2px' }}>distância</p>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{stage.distanceKm} km</p>
          </div>
          <div style={{ flex: 1, background: '#F1EFE8', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#5F5E5A', margin: '0 0 2px' }}>tempo</p>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{stage.durationText}</p>
          </div>
        </div>

        {/* Note */}
        <p style={{ fontSize: 11, color: '#888780', letterSpacing: 0.5, margin: '0 0 6px' }}>
          NOTA DO DIA
        </p>
        <p style={{ fontSize: 13, color: '#5F5E5A', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.5 }}>
          {stage.note}
        </p>

        {/* Albergue */}
        <p style={{ fontSize: 11, color: '#888780', letterSpacing: 0.5, margin: '0 0 6px' }}>
          DORMIR
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }}></div>
          <p style={{ fontSize: 14, margin: 0, color: '#2C2C2A' }}>{stage.albergue}</p>
        </div>

        {/* Main action button */}
        <button
          disabled={buttonDisabled}
          style={{
            width: '100%',
            background: buttonDisabled ? '#D3D1C7' : '#0F6E56',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: 14,
            fontSize: 15,
            fontWeight: 500,
            cursor: buttonDisabled ? 'default' : 'pointer',
          }}
        >
          {buttonLabel}
        </button>

        {/* Timestamp */}
        {stage.startedAt && (
          <p style={{ fontSize: 11, color: '#888780', margin: '8px 0 0', textAlign: 'center' }}>
            Começou às {new Date(stage.startedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}