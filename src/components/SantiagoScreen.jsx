import { useState, useEffect, useRef } from 'react';
import { useCaminho } from '../hooks/useCaminho';
import { askSantiago } from '../lib/santiago';

function findCurrentStage(stages) {
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

const WEATHER_TEXT = {
  great: 'dia bom',
  'tired-good': 'cansada mas bem',
  hard: 'dia duro',
  surprise: 'surpresa boa',
  sleeping: 'a dormir',
};

export default function SantiagoScreen() {
  const { data, loading, update } = useCaminho();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.santiagoHistory]);

  // Auto-resize the textarea as content grows, capped at a max height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const newHeight = Math.min(ta.scrollHeight, 96); // max ~4 lines
    ta.style.height = newHeight + 'px';
  }, [input]);

  if (loading || !data) {
    return (
      <div style={{ padding: 24, color: '#888780', textAlign: 'center' }}>
        A carregar...
      </div>
    );
  }

  const history = data.santiagoHistory || [];
  const currentStage = findCurrentStage(data.stages);
  const stageState = getStageState(currentStage);

  function buildContext() {
    return {
      day: currentStage.day,
      from: currentStage.from,
      to: currentStage.to,
      distanceKm: currentStage.distanceKm,
      albergue: currentStage.albergue,
      stageState,
      weatherStatus: currentStage.weatherStatus
        ? WEATHER_TEXT[currentStage.weatherStatus]
        : null,
    };
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setError(null);
    setSending(true);

    const userMessage = { role: 'user', content: text };
    const newHistory = [...history, userMessage];

    await update(current => ({
      ...current,
      santiagoHistory: newHistory,
    }));

    try {
      const { reply } = await askSantiago(newHistory, buildContext());

      await update(current => ({
        ...current,
        santiagoHistory: [...newHistory, { role: 'assistant', content: reply }],
      }));
    } catch (err) {
      setError(err.message || 'Não consegui falar com o Santiago.');
    } finally {
      setSending(false);
    }
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleClearConversation() {
    const confirmed = window.confirm('Começar uma conversa nova? As mensagens anteriores serão apagadas.');
    if (!confirmed) return;

    await update(current => ({
      ...current,
      santiagoHistory: [],
    }));
  }

  const hasHistory = history.length > 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      background: '#2C2C2A',
      color: '#F1EFE8',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '0.5px solid #444441',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#0F6E56',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: 'white',
          flexShrink: 0,
        }}>
          ✦
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            Santiago
          </p>
          <p style={{ fontSize: 10, color: '#888780', margin: 0 }}>
            companheiro do Caminho
          </p>
        </div>
        {hasHistory && (
          <button
            onClick={handleClearConversation}
            aria-label="Nova conversa"
            style={{
              background: 'transparent',
              border: '0.5px solid #444441',
              color: '#B4B2A9',
              fontSize: 11,
              padding: '5px 10px',
              borderRadius: 999,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            nova conversa
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 20px',
          minHeight: 0,
        }}
      >
        {!hasHistory && !sending && <WelcomeMessage />}

        {history.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}

        {sending && <TypingIndicator />}

        {error && (
          <div style={{
            background: '#3a1414',
            border: '0.5px solid #791F1F',
            borderRadius: 10,
            padding: '10px 14px',
            margin: '12px 0',
            fontSize: 12,
            color: '#E5BCBC',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 12px 14px',
        borderTop: '0.5px solid #444441',
        background: '#2C2C2A',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: '#3a3a38',
          borderRadius: 20,
          padding: '6px 6px 6px 14px',
          width: '100%',
          boxSizing: 'border-box',
          maxWidth: '100%',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Fala com o Santiago..."
            rows={1}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              width: 0,
              background: 'transparent',
              border: 'none',
              color: '#F1EFE8',
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'none',
              padding: '6px 0',
              outline: 'none',
              lineHeight: 1.4,
              overflow: 'auto',
              boxSizing: 'border-box',
            }}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            aria-label="Enviar mensagem"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: input.trim() && !sending ? '#0F6E56' : '#5F5E5A',
              color: 'white',
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
    }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? '#0F6E56' : '#3a3a38',
        color: '#F1EFE8',
        padding: '10px 14px',
        borderRadius: 16,
        borderTopRightRadius: isUser ? 4 : 16,
        borderTopLeftRadius: isUser ? 16 : 4,
        fontSize: 13.5,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
      <div style={{
        background: '#3a3a38',
        padding: '12px 16px',
        borderRadius: 16,
        borderTopLeftRadius: 4,
        display: 'flex',
        gap: 4,
      }}>
        <span style={dotStyle(0)} />
        <span style={dotStyle(0.15)} />
        <span style={dotStyle(0.3)} />
        <style>{`
          @keyframes typingBounce {
            0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
      </div>
    </div>
  );
}

function dotStyle(delay) {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#B4B2A9',
    animation: `typingBounce 1.2s ease-in-out ${delay}s infinite`,
  };
}

function WelcomeMessage() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: '#888780',
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#0F6E56',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        color: 'white',
      }}>
        ✦
      </div>
      <p style={{
        fontSize: 14,
        color: '#D3D1C7',
        margin: '0 0 8px',
      }}>
        Olá. Sou o Santiago.
      </p>
      <p style={{
        fontSize: 12,
        lineHeight: 1.5,
        color: '#888780',
        margin: '0 auto',
        maxWidth: 260,
      }}>
        Conhecedor do Caminho, companheiro das etapas.
        Pergunta o que quiseres — práticas, dúvidas, pensamentos.
      </p>
    </div>
  );
}