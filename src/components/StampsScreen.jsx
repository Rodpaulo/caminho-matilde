import { useState } from 'react';
import { useCaminho } from '../hooks/useCaminho';
import { STAMPS } from '../assets/stamps';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function StampsScreen() {
  const { data, loading, update } = useCaminho();
  const [selectedStageId, setSelectedStageId] = useState(null);

  if (loading || !data) {
    return <div style={{ padding: 24, color: '#888780' }}>A carregar...</div>;
  }

  const unlockedCount = data.stages.filter(s => s.arrivedAt).length;
  const totalCount = data.stages.length;
  const bingoDoneCount = data.bingo.filter(b => b.done).length;
  const bingoTotal = data.bingo.length;

  function toggleBingo(squareId) {
    update(current => ({
      ...current,
      bingo: current.bingo.map(b =>
        b.id === squareId
          ? {
              ...b,
              done: !b.done,
              doneAt: !b.done ? new Date().toISOString() : null,
            }
          : b
      ),
    }));
  }

  async function handlePhotoUpload(stageId, file) {
    const url = await uploadToCloudinary(file, 'image');
    await update(current => ({
      ...current,
      stages: current.stages.map(s =>
        s.id === stageId ? { ...s, stampPhotoUrl: url } : s
      ),
    }));
  }

  async function handlePhotoRemove(stageId) {
    await update(current => ({
      ...current,
      stages: current.stages.map(s =>
        s.id === stageId ? { ...s, stampPhotoUrl: null } : s
      ),
    }));
  }

  const selectedStage = selectedStageId
    ? data.stages.find(s => s.id === selectedStageId)
    : null;

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

      {/* Credencial */}
      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 24,
        padding: '20px 16px',
        marginBottom: 20,
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
            <StampCard
              key={stage.id}
              stage={stage}
              onClick={() => {
                // Only arrived stamps are tappable
                if (stage.arrivedAt) setSelectedStageId(stage.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Bingo */}
      <div style={{
        background: 'white',
        border: '0.5px solid #D3D1C7',
        borderRadius: 24,
        padding: '20px 16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
            Bingo do Caminho
          </h3>
          <span style={{ fontSize: 13, color: '#5F5E5A' }}>
            {bingoDoneCount} / {bingoTotal}
          </span>
        </div>
        <p style={{
          fontSize: 11,
          color: '#888780',
          fontStyle: 'italic',
          margin: '0 0 14px',
        }}>
          Toca quando acontecer
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 6,
        }}>
          {data.bingo.map(square => (
            <BingoSquare
              key={square.id}
              square={square}
              onToggle={() => toggleBingo(square.id)}
            />
          ))}
        </div>
      </div>

      <p style={{
        fontSize: 12,
        color: '#888780',
        fontStyle: 'italic',
        textAlign: 'center',
        margin: '14px 16px',
        lineHeight: 1.5,
      }}>
        Os carimbos acendem quando chegares. O bingo toca-se quando algo acontece.
      </p>

      {selectedStage && (
        <StampModal
          stage={selectedStage}
          onClose={() => setSelectedStageId(null)}
          onPhotoUpload={(file) => handlePhotoUpload(selectedStage.id, file)}
          onPhotoRemove={() => handlePhotoRemove(selectedStage.id)}
        />
      )}
    </div>
  );
}

function StampCard({ stage, onClick }) {
  const StampComponent = STAMPS[stage.stampSlug];
  const isUnlocked = !!stage.arrivedAt;
  const hasPhoto = !!stage.stampPhotoUrl;

  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      style={{
        aspectRatio: '1 / 1',
        background: isUnlocked ? '#E1F5EE' : '#F1EFE8',
        border: isUnlocked ? '1px solid #0F6E56' : '0.5px solid #D3D1C7',
        borderRadius: 10,
        padding: 6,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        opacity: isUnlocked ? 1 : 0.45,
        cursor: isUnlocked ? 'pointer' : 'default',
        transition: 'opacity 0.2s, background 0.2s, transform 0.1s',
        fontFamily: 'inherit',
      }}
    >
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
    </button>
  );
}

function BingoSquare({ square, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        aspectRatio: '1 / 1',
        background: square.done ? '#E1F5EE' : '#F1EFE8',
        border: square.done ? '1px solid #0F6E56' : '0.5px solid #D3D1C7',
        borderRadius: 10,
        padding: 6,
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'background 0.15s, border 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <span style={{
        fontSize: 11,
        lineHeight: 1.25,
        color: square.done ? '#04342C' : '#5F5E5A',
        fontWeight: square.done ? 500 : 400,
      }}>
        {square.label}
      </span>
    </button>
  );
}

function StampModal({ stage, onClose, onPhotoUpload, onPhotoRemove }) {
  const StampComponent = STAMPS[stage.stampSlug];
  const hasPhoto = !!stage.stampPhotoUrl;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onPhotoUpload(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    setError(null);
    try {
      await onPhotoRemove();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44, 44, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FAF9F5',
          borderRadius: 24,
          padding: '24px 20px',
          maxWidth: 360,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#888780', letterSpacing: 1.5, margin: '0 0 4px', textTransform: 'uppercase' }}>
            DIA {stage.day}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0, color: '#2C2C2A' }}>
            {stage.from}
          </h2>
        </div>

        <div style={{
          aspectRatio: '1 / 1',
          background: '#E1F5EE',
          border: '1px solid #0F6E56',
          borderRadius: 16,
          padding: 20,
          boxSizing: 'border-box',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {hasPhoto ? (
            <img
              src={stage.stampPhotoUrl}
              alt={`Carimbo real de ${stage.from}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 10,
              }}
            />
          ) : StampComponent ? (
            <StampComponent style={{ width: '80%', height: '80%' }} />
          ) : null}
        </div>

        {error && (
          <p style={{
            fontSize: 12,
            color: '#791F1F',
            background: '#FCEBEB',
            padding: '8px 12px',
            borderRadius: 8,
            textAlign: 'center',
            margin: '0 0 12px',
          }}>
            {error}
          </p>
        )}

        <p style={{
          fontSize: 13,
          color: '#5F5E5A',
          textAlign: 'center',
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}>
          {hasPhoto
            ? 'Este carimbo tem uma foto do verdadeiro.'
            : 'Encontraste o carimbo verdadeiro? Tira uma foto e substitui.'}
        </p>

        {hasPhoto ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label
              style={{
                width: '100%',
                background: 'transparent',
                border: '0.5px solid #0F6E56',
                color: '#0F6E56',
                borderRadius: 999,
                padding: 12,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              {uploading ? 'A enviar...' : 'Substituir por outra foto'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={handleRemove}
              disabled={uploading}
              style={{
                width: '100%',
                background: 'transparent',
                border: '0.5px solid #D3D1C7',
                color: '#5F5E5A',
                borderRadius: 999,
                padding: 12,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Voltar ao carimbo desenhado
            </button>
          </div>
        ) : (
          <label
            style={{
              width: '100%',
              background: '#0F6E56',
              color: 'white',
              borderRadius: 999,
              padding: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              display: 'block',
              boxSizing: 'border-box',
            }}
          >
            {uploading ? 'A enviar...' : 'Adicionar foto do carimbo real'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        )}

        <button
          onClick={onClose}
          disabled={uploading}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#888780',
            padding: 12,
            fontSize: 12,
            cursor: 'pointer',
            marginTop: 10,
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}