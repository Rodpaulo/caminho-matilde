import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { readBinReadOnly } from '../lib/jsonbin';

const WEATHER_ICONS = {
  great: '☀',
  'tired-good': '⛅',
  hard: '🌧',
  surprise: '🌈',
  sleeping: '🌙',
};

const WEATHER_TEXT = {
  great: 'dia bom',
  'tired-good': 'cansada mas bem',
  hard: 'dia duro',
  surprise: 'surpresa boa',
  sleeping: 'a dormir',
};

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

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

export default function FollowPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [lastRefresh, setLastRefresh] = useState(null);

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
        setLastRefresh(new Date());
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
      }
    }

    load();
    const id = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(id); };
  }, [token]);

  if (status === 'loading') {
    return (
      <FollowLayout>
        <p style={{ color: '#B4B2A9', textAlign: 'center', margin: '40px 0' }}>
          A carregar...
        </p>
      </FollowLayout>
    );
  }

  if (status === 'forbidden' || status === 'error') {
    return (
      <FollowLayout>
        <h1 style={{ fontSize: 20, margin: '20px 0 10px', color: '#F1EFE8', textAlign: 'center' }}>
          Página não encontrada
        </h1>
        <p style={{ color: '#B4B2A9', textAlign: 'center', fontSize: 14 }}>
          O link que usaste não é válido.
        </p>
      </FollowLayout>
    );
  }

  const current = findCurrentStage(data.stages);
  const arrivedStages = data.stages.filter(s => s.arrivedAt);
  const totalKm = data.stages.reduce((sum, s) => sum + s.distanceKm, 0);
  const walkedKm = arrivedStages.reduce((sum, s) => sum + s.distanceKm, 0);
  const remainingKm = totalKm - walkedKm;
  const lastStamped = [...data.stages].reverse().find(s => s.arrivedAt);

  const weather = current.weatherStatus;
  const lastUpdate = current.arrivedAt || current.startedAt;

  const stageLabel = current.startedAt && !current.arrivedAt
    ? `${current.from} → ${current.to}`
    : current.arrivedAt
    ? `chegou a ${current.to}`
    : `a caminho de ${current.from}`;

  return (
    <FollowLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#0F6E56',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 500,
          color: 'white',
        }}>
          {data.pilgrim.name.charAt(0)}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {data.pilgrim.name}
          </p>
          <p style={{ fontSize: 11, color: '#888780', margin: 0 }}>
            dia {current.day} · {stageLabel}
          </p>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '24px 0',
        borderTop: '0.5px solid #444441',
        borderBottom: '0.5px solid #444441',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 56, lineHeight: 1, margin: 0 }}>
          {weather ? WEATHER_ICONS[weather] : '—'}
        </p>
        <p style={{
          fontSize: 14,
          color: '#D3D1C7',
          margin: '10px 0 0',
          fontStyle: 'italic',
        }}>
          {weather ? WEATHER_TEXT[weather] : 'sem notícias ainda'}
        </p>
        {lastUpdate && (
          <p style={{ fontSize: 11, color: '#888780', margin: '6px 0 0' }}>
            {timeAgo(lastUpdate)}
          </p>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
        marginBottom: 20,
      }}>
        <div>
          <p style={{ fontSize: 11, color: '#888780', margin: '0 0 3px' }}>hoje</p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {current.distanceKm} km
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#888780', margin: '0 0 3px' }}>total</p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {walkedKm} km
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#888780', margin: '0 0 3px' }}>faltam</p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {remainingKm} km
          </p>
        </div>
      </div>

      {lastStamped && (
        <div style={{
          background: '#3a3a38',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 10, color: '#B4B2A9', letterSpacing: 0.5, margin: '0 0 4px', textTransform: 'uppercase' }}>
            ÚLTIMA CHEGADA
          </p>
          <p style={{ fontSize: 13, margin: 0, color: '#F1EFE8' }}>
            {lastStamped.albergue}
          </p>
          <p style={{ fontSize: 11, color: '#888780', margin: '2px 0 0' }}>
            {timeAgo(lastStamped.arrivedAt)}
          </p>
        </div>
      )}

      <SharedJournal data={data} />

      <p style={{
        fontSize: 10,
        color: '#5F5E5A',
        textAlign: 'center',
        margin: '24px 0 0',
        fontStyle: 'italic',
      }}>
        sem notificações · atualiza sozinho a cada minuto
        {lastRefresh && (
          <><br />última atualização: {lastRefresh.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</>
        )}
      </p>
    </FollowLayout>
  );
}

function SharedJournal({ data }) {
  const shared = data.journal
    .filter(e => e.shared)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (shared.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{
        fontSize: 10,
        color: '#B4B2A9',
        letterSpacing: 0.5,
        margin: '0 0 10px',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        PARTILHAS — {shared.length}
      </p>
      {shared.map(entry => {
        const stage = data.stages.find(s => s.id === entry.stageId);
        const date = new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

        return (
          <div key={entry.id} style={{
            background: '#3a3a38',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#B4B2A9', letterSpacing: 0.5 }}>
                {date} · dia {stage?.day ?? '?'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#888780', fontStyle: 'italic', margin: '0 0 4px' }}>
              {entry.prompt}
            </p>
            {entry.text && (
              <p style={{ fontSize: 13, color: '#F1EFE8', margin: '0 0 8px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {entry.text}
              </p>
            )}
            {entry.photoUrl && (
              <img
                src={entry.photoUrl}
                alt="foto partilhada"
                style={{
                  width: '100%',
                  maxHeight: 320,
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginTop: entry.text ? 4 : 0,
                  display: 'block',
                }}
              />
            )}
            {entry.voiceUrl && (
              <audio
                controls
                src={entry.voiceUrl}
                style={{
                  width: '100%',
                  height: 36,
                  marginTop: (entry.text || entry.photoUrl) ? 8 : 0,
                  // Safari dark mode workaround — the audio controls look pale on dark; this is acceptable
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FollowLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#2C2C2A',
      color: '#F1EFE8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 20,
    }}>
      <div style={{
        maxWidth: 420,
        margin: '30px auto',
      }}>
        {children}
      </div>
    </div>
  );
}