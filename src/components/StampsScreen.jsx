import { useCaminho } from '../hooks/useCaminho';
import { STAMPS } from '../assets/stamps';

export default function StampsScreen() {
  const { data, loading } = useCaminho();

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const unlockedCount = data.stages.filter(s => s.arrivedAt).length;
  const totalCount = data.stages.length;

  return (
    <div style={{ padding: '24px 16px', maxWidth: 420, margin: '0 auto' }}>
      <p style={{
        fontSize: 11,
        color: '#888780',
        letterSpacing: 1.5,
        textAlign: 'center',
        margin: '0 0 14px',
        textTransform: 'uppercase',
      }}>
        CARIMBOS
      </p>

      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 24,
        padding: '20px 16px',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 18,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
            Credencial
          </h3>
          <span style={{ fontSize: 13, color: '#5F5E5A' }}>
            {unlockedCount} / {totalCount}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
        }}>
          {data.stages.map(stage => (
            <StampCard key={stage.id} stage={stage} />
          ))}
        </div>
      </div>

      <p style={{
        fontSize: 12,
        color: '#888780',
        fontStyle: 'italic',
        textAlign: 'center',
        margin: '8px 16px',
        lineHeight: 1.5,
      }}>
        Quando chegares, o carimbo acende. Se encontrares o verdadeiro no Caminho, substitui-o por uma foto.
      </p>
    </div>
  );
}

function StampCard({ stage }) {
  const StampComponent = STAMPS[stage.stampSlug];
  const isUnlocked = !!stage.arrivedAt;
  const hasPhoto = !!stage.stampPhotoUrl;

  return (
    <div style={{
      aspectRatio: '1 / 1',
      background: isUnlocked ? '#E1F5EE' : '#F1EFE8',
      border: isUnlocked ? '1px solid #0F6E56' : '0.5px solid #D3D1C7',
      borderRadius: 10,
      padding: 6,
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      opacity: isUnlocked ? 1 : 0.45,
      transition: 'opacity 0.2s, background 0.2s',
    }}>
      {/* Stamp visual area — absolutely positioned to fill most of the card */}
      <div style={{
        position: 'absolute',
        top: 6,
        left: 6,
        right: 6,
        bottom: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {hasPhoto ? (
          <img
            src={stage.stampPhotoUrl}
            alt={`Carimbo de ${stage.from}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 6,
            }}
          />
        ) : StampComponent ? (
          <StampComponent style={{ width: '100%', height: '100%' }} />
        ) : (
          <span style={{ fontSize: 10, color: '#888780' }}>no stamp</span>
        )}
      </div>

      {/* Label at the bottom */}
      <p style={{
        position: 'absolute',
        bottom: 4,
        left: 0,
        right: 0,
        fontSize: 9,
        color: isUnlocked ? '#04342C' : '#888780',
        margin: 0,
        fontWeight: isUnlocked ? 500 : 400,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '0 4px',
      }}>
        {stage.from}
      </p>
    </div>
  );
}