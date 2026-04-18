import { useState } from 'react';
import { useCaminho } from '../hooks/useCaminho';
import { PROMPTS } from '../data/stages';
import DayPillNav from './DayPillNav';

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

export default function JournalScreen() {
  const { data, loading, update } = useCaminho();
  const [viewedStageId, setViewedStageId] = useState(null);
  const [text, setText] = useState('');
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const todayStage = findTodayStage(data.stages);
  const stage = data.stages.find(s => s.id === viewedStageId) ?? todayStage;
  const isViewingToday = stage.id === todayStage.id;

  const prompt = PROMPTS[(stage.day - 1) % PROMPTS.length];
  const entriesForStage = data.journal
    .filter(e => e.stageId === stage.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);

    const newEntry = {
      id: `entry-${Date.now()}`,
      stageId: stage.id,
      date: new Date().toISOString(),
      prompt,
      text: text.trim(),
      voiceUrl: null,
      photoUrl: null,
      shared,
    };

    await update(current => ({
      ...current,
      journal: [...current.journal, newEntry],
    }));

    setText('');
    setShared(false);
    setSaving(false);
  }

  const canSave = text.trim().length > 0 && !saving;

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
        {isViewingToday ? 'DIÁRIO' : 'DIÁRIO · DIA ' + stage.day}
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
        <p style={{
          fontSize: 11,
          color: '#888780',
          letterSpacing: 0.5,
          margin: '0 0 6px',
        }}>
          {isViewingToday ? 'PERGUNTA DE HOJE' : `PERGUNTA DO DIA ${stage.day}`}
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

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isViewingToday ? 'Escreve aqui...' : 'Adicionar uma entrada a este dia...'}
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

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%',
            background: canSave ? '#0F6E56' : '#D3D1C7',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: 14,
            fontSize: 15,
            fontWeight: 500,
            cursor: canSave ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'A guardar...' : 'Guardar no diário'}
        </button>

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

      {entriesForStage.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{
            fontSize: 11,
            color: '#888780',
            letterSpacing: 1.5,
            textAlign: 'center',
            margin: '0 0 14px',
            textTransform: 'uppercase',
          }}>
            {isViewingToday ? 'NESTE DIA' : `DIA ${stage.day}`} · {entriesForStage.length} {entriesForStage.length === 1 ? 'ENTRADA' : 'ENTRADAS'}
          </p>
          {entriesForStage.map(entry => (
            <JournalEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalEntry({ entry }) {
  const time = new Date(entry.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

  return (
    <div style={{
      background: 'white',
      border: '0.5px solid #D3D1C7',
      borderRadius: 16,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 10, color: '#888780', letterSpacing: 0.5 }}>
          {date} · {time}
        </span>
        <span style={{
          fontSize: 10,
          color: entry.shared ? '#0F6E56' : '#888780',
          background: entry.shared ? '#E1F5EE' : 'transparent',
          padding: '2px 8px',
          borderRadius: 999,
          border: entry.shared ? '0.5px solid #0F6E56' : '0.5px solid #D3D1C7',
        }}>
          {entry.shared ? 'partilhado' : 'privado'}
        </span>
      </div>
      <p style={{
        fontSize: 12,
        color: '#888780',
        fontStyle: 'italic',
        margin: '0 0 6px',
      }}>
        {entry.prompt}
      </p>
      <p style={{
        fontSize: 13,
        color: '#2C2C2A',
        margin: 0,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}>
        {entry.text}
      </p>
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