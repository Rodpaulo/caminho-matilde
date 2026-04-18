import { useCaminho } from '../hooks/useCaminho';

// Position each stage point on the SVG canvas
// Coordinates hand-tuned to make a pleasing Porto → Santiago curve
const STAGE_POSITIONS = {
  porto: { x: 50, y: 30, label: 'Porto' },
  vilarinho: { x: 67, y: 55, label: 'Vilarinho' },
  barcelos: { x: 58, y: 82, label: 'Barcelos' },
  'ponte-de-lima': { x: 78, y: 118, label: 'Ponte de Lima' },
  rubiaes: { x: 90, y: 150, label: 'Rubiães' },
  tui: { x: 82, y: 185, label: 'Tui' },
  porrino: { x: 98, y: 215, label: 'O Porriño' },
  redondela: { x: 92, y: 240, label: 'Redondela' },
  pontevedra: { x: 110, y: 260, label: 'Pontevedra' },
  'caldas-de-reis': { x: 118, y: 280, label: 'Caldas' },
  padron: { x: 128, y: 295, label: 'Padrón' },
};

// Santiago is the final destination — rendered specially as a scallop shell
const SANTIAGO_POSITION = { x: 145, y: 310 };

export default function MapScreen() {
  const { data, loading } = useCaminho();

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const arrivedStages = data.stages.filter(s => s.arrivedAt);
  const walkingStage = data.stages.find(s => s.startedAt && !s.arrivedAt);
  const walkedKm = arrivedStages.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalKm = data.stages.reduce((sum, s) => sum + s.distanceKm, 0);

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
        MAPA
      </p>

      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 28,
        padding: '22px 20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
            Progresso
          </h3>
          <span style={{ fontSize: 13, color: '#5F5E5A' }}>
            {walkedKm} / {totalKm} km
          </span>
        </div>

        <svg viewBox="0 0 220 360" style={{ width: '100%', height: 360 }}>
          {/* Full route as dashed grey line */}
          <path
            d="M 50 30 Q 80 60 60 90 T 90 150 Q 120 180 100 220 T 140 300"
            stroke="#D3D1C7"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="3 3"
          />

          {/* Completed portion as solid green line */}
          {arrivedStages.length > 0 && (
            <path
              d={buildCompletedPath(arrivedStages, walkingStage)}
              stroke="#1D9E75"
              strokeWidth="2.5"
              fill="none"
            />
          )}

          {/* Stage dots */}
          {data.stages.map(stage => {
            const pos = STAGE_POSITIONS[stage.id];
            if (!pos) return null;

            const isArrived = !!stage.arrivedAt;
            const isWalking = stage.startedAt && !stage.arrivedAt;

            return (
              <g key={stage.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isWalking ? 7 : isArrived ? 5 : 4}
                  fill={isArrived ? '#1D9E75' : isWalking ? '#0F6E56' : 'none'}
                  stroke={isWalking ? '#1D9E75' : isArrived ? '#1D9E75' : '#B4B2A9'}
                  strokeWidth={isWalking ? 3 : 1.5}
                />
                <text
                  x={pos.x + 12}
                  y={pos.y + 4}
                  fontSize={isWalking ? 11 : 10}
                  fontWeight={isWalking ? 500 : 400}
                  fill={isArrived || isWalking ? '#2C2C2A' : '#888780'}
                >
                  {pos.label}
                </text>
                {isWalking && (
                  <text
                    x={pos.x + 12}
                    y={pos.y + 17}
                    fontSize="9"
                    fill="#888780"
                  >
                    a caminhar...
                  </text>
                )}
              </g>
            );
          })}

          {/* Santiago scallop at the end */}
          <path
            d={`M ${STAGE_POSITIONS.padron.x} ${STAGE_POSITIONS.padron.y + 3} L ${SANTIAGO_POSITION.x} ${SANTIAGO_POSITION.y}`}
            stroke="#B4B2A9"
            strokeWidth="1.5"
          />
          <circle
            cx={SANTIAGO_POSITION.x}
            cy={SANTIAGO_POSITION.y}
            r="7"
            fill="none"
            stroke="#B4B2A9"
            strokeWidth="2"
          />
          <path
            d={`M ${SANTIAGO_POSITION.x - 3} ${SANTIAGO_POSITION.y - 3} L ${SANTIAGO_POSITION.x} ${SANTIAGO_POSITION.y + 3} L ${SANTIAGO_POSITION.x + 3} ${SANTIAGO_POSITION.y - 3}`}
            stroke="#B4B2A9"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x={SANTIAGO_POSITION.x + 15}
            y={SANTIAGO_POSITION.y + 4}
            fontSize="11"
            fontWeight="500"
            fill="#888780"
          >
            Santiago
          </text>
        </svg>

        {/* Summary below map */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: '#888780', margin: '0 0 2px' }}>completas</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
              {arrivedStages.length}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#888780', margin: '0 0 2px' }}>caminhadas</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
              {walkedKm} km
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#888780', margin: '0 0 2px' }}>faltam</p>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
              {totalKm - walkedKm} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Build the SVG path string for the completed portion of the route
function buildCompletedPath(arrivedStages, walkingStage) {
  const points = arrivedStages.map(s => STAGE_POSITIONS[s.id]).filter(Boolean);
  if (walkingStage) {
    const walkingPos = STAGE_POSITIONS[walkingStage.id];
    if (walkingPos) points.push(walkingPos);
  }
  if (points.length === 0) return '';

  // Start from Porto, draw straight lines through completed dots
  // Matches the general shape of the dashed route
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  return parts.join(' ');
}