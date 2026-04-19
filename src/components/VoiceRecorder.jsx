import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

const VoiceRecorder = forwardRef(function VoiceRecorder(
  { voiceBlob, onVoiceReady, onVoiceRemove },
  ref
) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // When the parent clears voiceBlob (e.g. after save), reset our internal state
  useEffect(() => {
    if (!voiceBlob && (status === 'ready' || status === 'error')) {
      setStatus('idle');
      setElapsed(0);
      setError(null);
    }
  }, [voiceBlob, status]);

  // Expose startRecording to the parent via ref.
  // Allow start whenever we're not already recording or in permission-request.
  useImperativeHandle(ref, () => ({
    start: () => {
      if (status !== 'recording' && status !== 'permission-requested') {
        startRecording();
      }
    },
  }), [status]);

  useEffect(() => {
    if (voiceBlob) {
      const url = URL.createObjectURL(voiceBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [voiceBlob]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    setStatus('permission-requested');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('O teu navegador não suporta gravação de áudio.');
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        onVoiceReady(blob, mimeType);
        setStatus('ready');
      };

      recorder.start();
      setStatus('recording');
      setElapsed(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Precisamos de permissão para usar o microfone. Vai às definições do navegador e permite o acesso.');
      } else {
        setError(err.message || 'Não consegui começar a gravação.');
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function discardRecording() {
    onVoiceRemove();
    setStatus('idle');
    setElapsed(0);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (status === 'error') {
    return (
      <div style={{
        background: '#FCEBEB',
        border: '0.5px solid #E5BCBC',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 12, color: '#791F1F', margin: '0 0 8px' }}>
          {error}
        </p>
        <button
          onClick={() => { setStatus('idle'); setError(null); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#791F1F',
            fontSize: 11,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (status === 'recording') {
    return (
      <div style={{
        background: '#FCEBEB',
        border: '1px solid #A32D2D',
        borderRadius: 12,
        padding: '14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#A32D2D',
          animation: 'pulse 1.2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: '#791F1F', margin: 0, fontWeight: 500 }}>
            A gravar...
          </p>
          <p style={{ fontSize: 11, color: '#A32D2D', margin: 0, fontFamily: 'monospace' }}>
            {formatTime(elapsed)}
          </p>
        </div>
        <button
          onClick={stopRecording}
          style={{
            background: '#A32D2D',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Parar
        </button>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'permission-requested') {
    return (
      <div style={{
        background: '#F1EFE8',
        border: '0.5px solid #D3D1C7',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 12, color: '#5F5E5A', margin: 0 }}>
          A pedir acesso ao microfone...
        </p>
      </div>
    );
  }

  if (status === 'ready' && previewUrl) {
    return (
      <div style={{
        background: '#E1F5EE',
        border: '1px solid #0F6E56',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 14,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 11, color: '#04342C', fontWeight: 500, flex: 1 }}>
            Gravação pronta · {formatTime(elapsed)}
          </span>
          <button
            onClick={discardRecording}
            aria-label="Descartar gravação"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(44, 44, 42, 0.6)',
              color: 'white',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <audio
          controls
          src={previewUrl}
          style={{ width: '100%', height: 36 }}
        />
      </div>
    );
  }

  return null;
});

export default VoiceRecorder;