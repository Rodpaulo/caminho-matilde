import { useState } from 'react';
import { useCaminho } from '../hooks/useCaminho';
import DayPillNav from './DayPillNav';
import AlbergueModal from './AlbergueModal';

const WEATHER_OPTIONS = [
  { id: 'great', icon: '☀', label: 'dia bom' },
  { id: 'tired-good', icon: '⛅', label: 'cansada mas bem' },
  { id: 'hard', icon: '🌧', label: 'dia duro' },
  { id: 'surprise', icon: '🌈', label: 'surpresa boa' },
  { id: 'sleeping', icon: '🌙', label: 'a dormir' },
];

function findTodayStage(stages) {
  const inProgress = stages.find(s => s.startedAt && !s.arrivedAt);
  if (inProgress) return inProgress;

  const today = new Date().toISOString().slice(0, 10);
  const arrivedToday = stages.find(s =>
    s.arrivedAt && s.arrivedAt.slice(0, 10) === today
  );
  if (arrivedToday) return arrivedToday;

  const notStarted = stages.find(s => !s.startedAt);
  if (notStarted) return notStarted;

  return stages[stages.length - 1];
}

function getStageState(stage) {
  if (stage.arrivedAt) return 'arrived';
  if (stage.startedAt) return 'walking';
  return 'not-started';
}

export default function TodayScreen() {
  const { data, loading, update } = useCaminho();
  const [viewedStageId, setViewedStageId] = useState(null);
  const [showAlbergueInfo, setShowAlbergueInfo] = useState(false);

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const todayStage = findTodayStage(data.stages);
  const stage = data.stages.find(s => s.id === viewedStageId) ?? todayStage;
  const state = getStageState(stage);
  const totalStages = data.stages.length;
  const isViewingToday = stage.id === todayStage.id;

  function handleMainAction() {
    const now = new Date().toISOString();

    if (state === 'not-started') {
      update(current => ({
        ...current,
        stages: current.stages.map(s =>
          s.id === stage.id ? { ...s, startedAt: now } : s
        ),
      }));
    } else if (state === 'walking') {
      update(current => ({
        ...current,
        stages: current.stages.map(s =>
          s.id === stage.id ? { ...s, arrivedAt: now } : s
        ),
      }));
    }
  }

  function handleWeatherChange(weatherId) {
    update(current => ({
      ...current,
      stages: current.stages.map(s =>
        s.id === stage.id ? { ...s, weatherStatus: weatherId } : s
      ),
    }));
  }

  const buttonLabel = state === 'not-started'
    ? 'Comecei a caminhar'
    : 'Cheguei';

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
        {isViewingToday ? 'HOJE' : 'O CAMINHO'}
      </p>

      <DayPillNav
        stages={data.stages}
        currentStageId={stage.id}
        todayStageId={todayStage.id}
        onSelect={setViewedStageId}
      />

      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 28,
        padding: '22px 20px',
      }}>
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

        <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 2px', color: '#2C2C2A' }}>
          {stage.from}
        </h2>
        <p style={{ fontSize: 14, color: '#5F5E5A', margin: '0 0 18px' }}>
          → {stage.to}
        </p>

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

        <p style={{ fontSize: 11, color: '#888780', letterSpacing: 0.5, margin: '0 0 6px' }}>
          NOTA DO DIA
        </p>
        <p style={{ fontSize: 13, color: '#5F5E5A', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.5 }}>
          {stage.note}
        </p>

        <p style={{ fontSize: 11, color: '#888780', letterSpacing: 0.5, margin: '0 0 6px' }}>
          DORMIR
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }}></div>
          <p style={{
            fontSize: 14,
            margin: 0,
            color: '#2C2C2A',
            flex: 1,
          }}>
            {stage.albergue}
          </p>
          {stage.albergueInfo && (
            <button
              onClick={() => setShowAlbergueInfo(true)}
              aria-label="Informações sobre o albergue"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '0.5px solid #D3D1C7',
                background: 'white',
                color: '#5F5E5A',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 0,
                lineHeight: 1,
                fontFamily: 'Georgia, serif',
              }}
            >
              i
            </button>
          )}
        </div>

        {state === 'arrived' ? (
          <div style={{
            background: '#E1F5EE',
            border: '1px solid #0F6E56',
            borderRadius: 16,
            padding: '14px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#04342C', fontWeight: 500, margin: '0 0 4px' }}>
              Chegaste a {stage.to}
            </p>
            <p style={{ fontSize: 11, color: '#0F6E56', margin: 0 }}>
              {new Date(stage.arrivedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} · descansa bem
            </p>
          </div>
        ) : (
          <button
            onClick={handleMainAction}
            style={{
              width: '100%',
              background: '#0F6E56',
              color: 'white',
              border: 'none',
              borderRadius: 999,
              padding: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {buttonLabel}
          </button>
        )}

        {state === 'walking' && stage.startedAt && (
          <p style={{ fontSize: 11, color: '#888780', margin: '8px 0 0', textAlign: 'center' }}>
            Começou às {new Date(stage.startedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        {(state === 'walking' || state === 'arrived') && (
          <div style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop: '0.5px solid #D3D1C7',
          }}>
            <p style={{
              fontSize: 11,
              color: '#888780',
              letterSpacing: 0.5,
              margin: '0 0 10px',
              textAlign: 'center',
            }}>
              COMO ESTÁS?
            </p>
            <div style={{
              display: 'flex',
              gap: 6,
              justifyContent: 'space-between',
            }}>
              {WEATHER_OPTIONS.map(option => {
                const isSelected = stage.weatherStatus === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleWeatherChange(option.id)}
                    title={option.label}
                    style={{
                      flex: 1,
                      background: isSelected ? '#E1F5EE' : 'transparent',
                      border: isSelected ? '1px solid #0F6E56' : '0.5px solid #D3D1C7',
                      borderRadius: 10,
                      padding: '10px 4px',
                      fontSize: 20,
                      cursor: 'pointer',
                      transition: 'background 0.15s, border 0.15s',
                    }}
                  >
                    {option.icon}
                  </button>
                );
              })}
            </div>
            {stage.weatherStatus && (
              <p style={{
                fontSize: 11,
                color: '#5F5E5A',
                fontStyle: 'italic',
                textAlign: 'center',
                margin: '10px 0 0',
              }}>
                {WEATHER_OPTIONS.find(o => o.id === stage.weatherStatus)?.label}
              </p>
            )}
          </div>
        )}

        {!isViewingToday && (
          <button
            onClick={() => setViewedStageId(null)}
            style={{
              width: '100%',
              background: 'transparent',
              border: '0.5px solid #D3D1C7',
              borderRadius: 999,
              padding: 10,
              fontSize: 12,
              color: '#5F5E5A',
              cursor: 'pointer',
              marginTop: 14,
            }}
          >
            ← voltar a hoje
          </button>
        )}
      </div>

      {showAlbergueInfo && stage.albergueInfo && (
        <AlbergueModal
          info={stage.albergueInfo}
          onClose={() => setShowAlbergueInfo(false)}
        />
      )}
    </div>
  );
}