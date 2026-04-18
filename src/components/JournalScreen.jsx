import { useState } from 'react';
import { useCaminho } from '../hooks/useCaminho';
import { PROMPTS } from '../data/stages';

function findCurrentStage(stages) {
  const inProgress = stages.find(s => s.startedAt && !s.arrivedAt);
  if (inProgress) return inProgress;
  const notStarted = stages.find(s => !s.startedAt);
  if (notStarted) return notStarted;
  return stages[stages.length - 1];
}

export default function JournalScreen() {
  const { data, loading } = useCaminho();
  const [text, setText] = useState('');
  const [shared, setShared] = useState(false);

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const stage = findCurrentStage(data.stages);
  // Prompt rotates per day — day 1 uses prompt 0, day 2 uses prompt 1, etc.
  const prompt = PROMPTS[(stage.day - 1) % PROMPTS.length];

  // Filter this stage's existing journal entries so we can show a simple count
  const entriesForStage = data.journal.filter(e => e.stageId === stage.id);

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
        DIÁRIO
      </p>

      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 28,
        padding: '22px 20px',
      }}>
        {/* Today's prompt */}
        <p style={{
          fontSize: 11,
          color: '#888780',
          letterSpacing: 0.5,
          margin: '0 0 6px',
        }}>
          PERGUNTA DE HOJE
        </p>
        <p style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 18,
          color: '#2C2C2A',
          margin: '0 0 18px',
          lineHeight: 1.4,
        }}>
          {prompt}
        </p>

        {/* Text input area */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreve aqui..."
          rows={5}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: '#F1EFE8',
            border: 'none',
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: '#2C2C2A',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: 14,
          }}
        />

        {/* Three input method buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            disabled
            style={{
              flex: 1,
              background: 'transparent',
              border: '0.5px solid #B4B2A9',
              borderRadius: 999,
              padding: '8px 10px',
              fontSize: 12,
              color: '#2C2C2A',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
          >
            ● gravar voz
          </button>
          <button
            disabled
            style={{
              flex: 1,
              background: 'transparent',
              border: '0.5px solid #B4B2A9',
              borderRadius: 999,
              padding: '8px 10px',
              fontSize: 12,
              color: '#2C2C2A',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
          >
            ◉ foto
          </button>
        </div>

        {/* Share toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: '0.5px solid #D3D1C7',
          marginBottom: 16,
        }}>
          <div>
            <p style={{
              fontSize: 11,
              color: '#888780',
              letterSpacing: 0.5,
              margin: '0 0 2px',
            }}>
              PARTILHAR COM O PAI?
            </p>
            <p style={{ fontSize: 12, color: '#5F5E5A', margin: 0 }}>
              {shared ? 'o pai vai ver isto' : 'só tu vês isto'}
            </p>
          </div>
          <ShareToggle value={shared} onChange={setShared} />
        </div>

        {/* Save button */}
        <button
          disabled
          style={{
            width: '100%',
            background: '#D3D1C7',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: 14,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'not-allowed',
          }}
        >
          Guardar no diário
        </button>
      </div>

      {/* Entry count for today's stage */}
      {entriesForStage.length > 0 && (
        <p style={{
          fontSize: 12,
          color: '#888780',
          textAlign: 'center',
          margin: '14px 0',
          fontStyle: 'italic',
        }}>
          {entriesForStage.length} {entriesForStage.length === 1 ? 'entrada' : 'entradas'} neste dia
        </p>
      )}
    </div>
  );
}

function ShareToggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: value ? '#0F6E56' : '#D3D1C7',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-label={value ? 'Partilhado com o pai' : 'Privado'}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: value ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}