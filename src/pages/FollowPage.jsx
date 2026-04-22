import { useState, useEffect, useRef, useLayoutEffect } from 'react';
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

function formatTimestamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay(d, today)) return `hoje às ${time}`;
  if (isSameDay(d, yesterday)) return `ontem às ${time}`;

  const date = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  return `${date} às ${time}`;
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

function findMostRecentActivity(data) {
  const timestamps = [];

  for (const stage of data.stages) {
    if (stage.startedAt) timestamps.push(stage.startedAt);
    if (stage.arrivedAt) timestamps.push(stage.arrivedAt);
  }
  for (const entry of data.journal) {
    if (entry.shared && entry.date) timestamps.push(entry.date);
  }

  if (timestamps.length === 0) return null;
  timestamps.sort();
  return timestamps[timestamps.length - 1];
}

/**
 * Timeline of the full Caminho drawn as a three-row S-curve.
 * Stages are placed along the path proportionally to their distances.
 * Completed portion is green; remaining portion is grey.
 * A marker shows her last confirmed position.
 */
function CaminhoTimeline({ stages }) {
  const pathRef = useRef(null);
  const [positions, setPositions] = useState(null);

  // Compute cumulative distances for each stage endpoint
  const cumulativeDistances = [0];
  for (const stage of stages) {
    cumulativeDistances.push(cumulativeDistances[cumulativeDistances.length - 1] + stage.distanceKm);
  }
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  // Last confirmed position is the end of the last arrived stage (in cumulative km).
  // If no stage has been arrived at, position is 0 (she's at Porto start).
  const arrivedStages = stages.filter(s => s.arrivedAt);
  const lastArrivedIndex = stages.findIndex(s => s === arrivedStages[arrivedStages.length - 1]);
  const walkedDistance = lastArrivedIndex >= 0 ? cumulativeDistances[lastArrivedIndex + 1] : 0;

  // SVG viewBox: width 420, height 200
  // Three rows of path at vertical positions y1, y2, y3.
  // Curves at right edge (top-middle) and left edge (middle-bottom).
  const svgWidth = 420;
  const svgHeight = 200;
  const padX = 30;
  const rowY = [40, 100, 160];

  // Build the path string.
  // Row 1: horizontal line left to right at rowY[0].
  // Curve down to row 2 on the right side.
  // Row 2: horizontal line right to left at rowY[1].
  // Curve down to row 3 on the left side.
  // Row 3: horizontal line left to right at rowY[2].
  const pathD = [
    `M ${padX} ${rowY[0]}`,
    `L ${svgWidth - padX} ${rowY[0]}`,
    `C ${svgWidth - padX + 20} ${rowY[0]}, ${svgWidth - padX + 20} ${rowY[1]}, ${svgWidth - padX} ${rowY[1]}`,
    `L ${padX} ${rowY[1]}`,
    `C ${padX - 20} ${rowY[1]}, ${padX - 20} ${rowY[2]}, ${padX} ${rowY[2]}`,
    `L ${svgWidth - padX} ${rowY[2]}`,
  ].join(' ');

  useLayoutEffect(() => {
    if (!pathRef.current) return;
    const totalLength = pathRef.current.getTotalLength();

    // Compute (x, y) for each stage endpoint based on its cumulative distance fraction
    const points = cumulativeDistances.map(dist => {
      const fraction = dist / totalDistance;
      const lengthOnPath = totalLength * fraction;
      const p = pathRef.current.getPointAtLength(lengthOnPath);
      return { x: p.x, y: p.y, distance: dist };
    });

    // Compute position of the walker marker
    const walkerFraction = walkedDistance / totalDistance;
    const walkerPoint = pathRef.current.getPointAtLength(totalLength * walkerFraction);

    setPositions({
      stagePoints: points,
      walkerPoint: { x: walkerPoint.x, y: walkerPoint.y },
      walkerLength: totalLength * walkerFraction,
      totalLength,
    });
  }, [walkedDistance, totalDistance]);

  // Names for labeling each segment endpoint (the "to" of each stage)
  const segmentEnds = ['Porto', ...stages.map(s => s.to)];

  // Which row each stage endpoint falls on determines label placement
  function getRowForPoint(y) {
    if (Math.abs(y - rowY[0]) < 20) return 0;
    if (Math.abs(y - rowY[1]) < 20) return 1;
    return 2;
  }

  return (
    <div style={{ margin: '0 0 20px' }}>
      <p style={{
        fontSize: 10,
        color: '#B4B2A9',
        letterSpacing: 0.5,
        margin: '0 0 8px',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        O Caminho
      </p>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Full path in grey (background) */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="#5F5E5A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Walked portion in green, drawn as a partial stroke-dash over the same path */}
        {positions && (
          <path
            d={pathD}
            fill="none"
            stroke="#0F6E56"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${positions.walkerLength} ${positions.totalLength}`}
          />
        )}

        {/* Stage endpoint markers and labels */}
        {positions?.stagePoints.map((point, i) => {
          const isStart = i === 0;
          const isEnd = i === positions.stagePoints.length - 1;
          const name = segmentEnds[i];
          const km = point.distance;
          const row = getRowForPoint(point.y);

          // Label offset depends on row:
          // Row 0: km above, city below
          // Row 1: km below, city above (because the line runs right-to-left visually it doesn't really matter, but we pick one)
          // Row 2: km above, city below
          const kmYOffset = row === 1 ? 14 : -8;
          const cityYOffset = row === 1 ? -6 : 16;

          // Marker styling: filled for Porto and Santiago, small tick for intermediate stages
          const isEndpoint = isStart || isEnd;

          return (
            <g key={i}>
              {isEndpoint ? (
                <circle cx={point.x} cy={point.y} r="3.5" fill="#F1EFE8" stroke="#0F6E56" strokeWidth="1.5" />
              ) : (
                <circle cx={point.x} cy={point.y} r="2" fill="#888780" />
              )}

              {/* km label */}
              <text
                x={point.x}
                y={point.y + kmYOffset}
                textAnchor="middle"
                fontSize="8"
                fill="#888780"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {km} km
              </text>

              {/* city label, only for endpoints to keep it readable */}
              {(isEndpoint || i === 5) && (
                <text
                  x={point.x}
                  y={point.y + cityYOffset}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#D3D1C7"
                  fontWeight="500"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {name}
                </text>
              )}
            </g>
          );
        })}

        {/* Walker position marker */}
        {positions && (
          <g>
            <circle
              cx={positions.walkerPoint.x}
              cy={positions.walkerPoint.y}
              r="6"
              fill="#0F6E56"
              stroke="#F1EFE8"
              strokeWidth="2"
            >
              <animate
                attributeName="r"
                values="6;8;6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>
      <p style={{
        fontSize: 11,
        color: '#888780',
        margin: '4px 0 0',
        textAlign: 'center',
      }}>
        {walkedDistance} km de {totalDistance} km
      </p>
    </div>
  );
}

/**
 * Current stage details card - shows when the stage started, its length, last known position.
 */
function CurrentStageDetails({ stage, stages }) {
  const arrivedStages = stages.filter(s => s.arrivedAt);
  const lastArrived = arrivedStages[arrivedStages.length - 1];
  const lastKnownPlace = lastArrived ? lastArrived.to : 'Porto';

  const isWalking = stage.startedAt && !stage.arrivedAt;
  const isArrived = !!stage.arrivedAt;

  return (
    <div style={{
      background: '#3a3a38',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 20,
    }}>
      <p style={{ fontSize: 10, color: '#B4B2A9', letterSpacing: 0.5, margin: '0 0 6px', textTransform: 'uppercase' }}>
        Etapa atual
      </p>
      <p style={{ fontSize: 13, margin: '0 0 4px', color: '#F1EFE8' }}>
        {stage.from} → {stage.to} · {stage.distanceKm} km
      </p>
      {isWalking && stage.startedAt && (
        <p style={{ fontSize: 11, color: '#888780', margin: 0 }}>
          em caminho desde {formatTimestamp(stage.startedAt)}
        </p>
      )}
      {isArrived && stage.arrivedAt && (
        <p style={{ fontSize: 11, color: '#888780', margin: 0 }}>
          chegou {formatTimestamp(stage.arrivedAt)}
        </p>
      )}
      {!isWalking && !isArrived && (
        <p style={{ fontSize: 11, color: '#888780', margin: 0 }}>
          ainda não começou
        </p>
      )}
      <p style={{ fontSize: 11, color: '#888780', margin: '2px 0 0' }}>
        última posição confirmada: {lastKnownPlace}
      </p>
    </div>
  );
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
  const totalStages = data.stages.length;
  const mostRecentActivity = findMostRecentActivity(data);

  const sharedEntries = data.journal
    .filter(e => e.shared)
    .sort((a, b) => b.date.localeCompare(a.date));

  const latestShared = sharedEntries[0] ?? null;

  const weather = current.weatherStatus;
  const dominantSignal = weather
    ? 'weather'
    : latestShared
      ? 'entry'
      : 'silent';

  const dominantTimestamp =
    dominantSignal === 'weather'
      ? (current.arrivedAt || current.startedAt)
      : dominantSignal === 'entry'
        ? latestShared.date
        : null;

  const otherSharedEntries = dominantSignal === 'entry'
    ? sharedEntries.slice(1)
    : sharedEntries;

  const placeLine = current.startedAt && !current.arrivedAt
    ? `${current.from} → ${current.to}`
    : current.arrivedAt
    ? `chegou a ${current.to}`
    : `a caminho de ${current.from}`;

  const progressParts = [`etapa ${current.day} de ${totalStages}`];
  if (mostRecentActivity) {
    progressParts.push(`atualizada ${timeAgo(mostRecentActivity)}`);
  }
  const progressLine = progressParts.join(' · ');

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
          flexShrink: 0,
        }}>
          {data.pilgrim.name.charAt(0)}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {data.pilgrim.name}
          </p>
          <p style={{ fontSize: 12, color: '#D3D1C7', margin: '2px 0 0' }}>
            {placeLine}
          </p>
          <p style={{ fontSize: 10, color: '#888780', margin: '2px 0 0' }}>
            {progressLine}
          </p>
        </div>
      </div>

      <CaminhoTimeline stages={data.stages} />
      <CurrentStageDetails stage={current} stages={data.stages} />

      {dominantSignal === 'weather' && (
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '0.5px solid #444441',
          borderBottom: '0.5px solid #444441',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 56, lineHeight: 1, margin: 0 }}>
            {WEATHER_ICONS[weather]}
          </p>
          <p style={{
            fontSize: 14,
            color: '#D3D1C7',
            margin: '10px 0 0',
            fontStyle: 'italic',
          }}>
            {WEATHER_TEXT[weather]}
          </p>
          {dominantTimestamp && (
            <p style={{ fontSize: 11, color: '#888780', margin: '6px 0 0' }}>
              {timeAgo(dominantTimestamp)}
            </p>
          )}
        </div>
      )}

      {dominantSignal === 'entry' && (
        <div style={{
          padding: '16px 16px 18px',
          borderTop: '0.5px solid #444441',
          borderBottom: '0.5px solid #444441',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 10,
            color: '#B4B2A9',
            letterSpacing: 0.5,
            margin: '0 0 10px',
            textTransform: 'uppercase',
          }}>
            Último momento partilhado
          </p>
          {latestShared.photoUrl && (
            <img
              src={latestShared.photoUrl}
              alt="último momento partilhado"
              style={{
                width: '100%',
                maxHeight: 280,
                objectFit: 'cover',
                borderRadius: 10,
                display: 'block',
                marginBottom: latestShared.text ? 10 : 0,
              }}
            />
          )}
          {latestShared.text && (
            <p style={{
              fontSize: 14,
              color: '#F1EFE8',
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
            }}>
              {latestShared.text}
            </p>
          )}
          {latestShared.voiceUrl && (
            <audio
              controls
              src={latestShared.voiceUrl}
              style={{
                width: '100%',
                height: 36,
                marginTop: (latestShared.text || latestShared.photoUrl) ? 10 : 0,
              }}
            />
          )}
          <p style={{ fontSize: 11, color: '#888780', margin: '10px 0 0' }}>
            {timeAgo(latestShared.date)}
          </p>
        </div>
      )}

      {dominantSignal === 'silent' && (
        <div style={{
          textAlign: 'center',
          padding: '24px 0',
          borderTop: '0.5px solid #444441',
          borderBottom: '0.5px solid #444441',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 56, lineHeight: 1, margin: 0 }}>—</p>
          <p style={{
            fontSize: 14,
            color: '#D3D1C7',
            margin: '10px 0 0',
            fontStyle: 'italic',
          }}>
            sem notícias ainda
          </p>
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
        marginBottom: 20,
      }}>
        <div>
          <p style={{ fontSize: 11, color: '#888780', margin: '0 0 3px' }}>esta etapa</p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#F1EFE8' }}>
            {current.distanceKm} km
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#888780', margin: '0 0 3px' }}>caminhado</p>
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

      <OtherSharedJournal entries={otherSharedEntries} stages={data.stages} />

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

function OtherSharedJournal({ entries, stages }) {
  if (entries.length === 0) return null;

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
        PARTILHAS — {entries.length}
      </p>
      {entries.map(entry => {
        const stage = stages.find(s => s.id === entry.stageId);
        const date = new Date(entry.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        const stageLabel = stage ? `etapa ${stage.day}` : null;

        return (
          <div key={entry.id} style={{
            background: '#3a3a38',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 8,
          }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#D3D1C7', letterSpacing: 0.3 }}>
                {date}
              </span>
              {stageLabel && (
                <span style={{ fontSize: 10, color: '#5F5E5A', marginLeft: 8 }}>
                  {stageLabel}
                </span>
              )}
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