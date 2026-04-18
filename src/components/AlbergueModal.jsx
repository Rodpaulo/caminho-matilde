export default function AlbergueModal({ info, onClose }) {
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FAF9F5',
          borderRadius: 24,
          padding: '24px 20px',
          maxWidth: 380,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <p style={{
            fontSize: 11,
            color: '#888780',
            letterSpacing: 1.5,
            margin: '0 0 4px',
            textTransform: 'uppercase',
          }}>
            DORMIR
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#2C2C2A', lineHeight: 1.3 }}>
            {info.name}
          </h2>
        </div>

        {info.address && <InfoRow label="Morada" value={info.address} />}

        {info.phone && (
          <InfoRow
            label="Telefone"
            value={<a href={`tel:${info.phone.replace(/\s/g, '')}`} style={{ color: '#0F6E56', textDecoration: 'none', fontWeight: 500 }}>{info.phone}</a>}
          />
        )}

        {info.email && (
          <InfoRow
            label="Email"
            value={<a href={`mailto:${info.email}`} style={{ color: '#0F6E56', textDecoration: 'none', wordBreak: 'break-all' }}>{info.email}</a>}
          />
        )}

        {info.web && (
          <InfoRow
            label="Web"
            value={<a href={`https://${info.web}`} target="_blank" rel="noopener" style={{ color: '#0F6E56', textDecoration: 'none' }}>{info.web}</a>}
          />
        )}

        {info.price && <InfoRow label="Preço" value={info.price} />}
        {info.beds && <InfoRow label="Camas" value={info.beds} />}

        {(info.checkIn || info.checkOut) && (
          <InfoRow
            label="Horário"
            value={
              (info.checkIn ? `entrada ${info.checkIn}` : '') +
              (info.checkIn && info.checkOut ? ' · ' : '') +
              (info.checkOut ? `fecha ${info.checkOut}` : '')
            }
          />
        )}

        {info.type && <InfoRow label="Tipo" value={info.type} />}

        {info.amenities && info.amenities.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            margin: '12px 0 16px',
            paddingBottom: 14,
            borderBottom: '0.5px solid #D3D1C7',
          }}>
            {info.amenities.map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: '#04342C',
                  background: '#E1F5EE',
                  border: '0.5px solid #0F6E56',
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {info.note && (
          <p style={{
            fontSize: 12,
            color: '#5F5E5A',
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: '0 0 18px',
            padding: '12px 14px',
            background: '#F1EFE8',
            borderRadius: 12,
          }}>
            {info.note}
          </p>
        )}

        {info.reservation === false && (
          <p style={{
            fontSize: 11,
            color: '#791F1F',
            textAlign: 'center',
            margin: '0 0 16px',
          }}>
            Não aceita reservas — chegada por ordem de chegada
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'transparent',
            border: '0.5px solid #D3D1C7',
            borderRadius: 999,
            padding: 12,
            fontSize: 13,
            color: '#5F5E5A',
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      padding: '8px 0',
      borderBottom: '0.5px solid #D3D1C7',
    }}>
      <span style={{
        fontSize: 10,
        color: '#888780',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        flexShrink: 0,
        paddingTop: 2,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        color: '#2C2C2A',
        textAlign: 'right',
        maxWidth: '70%',
        lineHeight: 1.4,
      }}>
        {value}
      </span>
    </div>
  );
}