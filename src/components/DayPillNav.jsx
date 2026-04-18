import { useEffect, useRef } from 'react';

export default function DayPillNav({ stages, currentStageId, onSelect, todayStageId }) {
  const scrollRef = useRef(null);
  const currentPillRef = useRef(null);

  // Scroll the current pill into view when it changes
  useEffect(() => {
    if (currentPillRef.current && scrollRef.current) {
      currentPillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentStageId]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        padding: '4px 4px 8px',
        margin: '0 -16px 14px',
        paddingLeft: 16,
        paddingRight: 16,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {stages.map(stage => {
        const isCurrent = stage.id === currentStageId;
        const isToday = stage.id === todayStageId;
        const isArrived = !!stage.arrivedAt;
        const isWalking = stage.startedAt && !stage.arrivedAt;
        const hasBeenVisited = isArrived || isWalking;

        return (
          <button
            key={stage.id}
            ref={isCurrent ? currentPillRef : null}
            onClick={() => onSelect(stage.id)}
            style={{
              flexShrink: 0,
              minWidth: 42,
              padding: '6px 10px',
              borderRadius: 999,
              border: isCurrent ? '1px solid #0F6E56' : '0.5px solid #D3D1C7',
              background: isCurrent
                ? '#E1F5EE'
                : hasBeenVisited
                ? 'white'
                : '#F1EFE8',
              color: isCurrent
                ? '#04342C'
                : hasBeenVisited
                ? '#2C2C2A'
                : '#888780',
              fontSize: 12,
              fontWeight: isCurrent ? 500 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              position: 'relative',
              transition: 'all 0.15s',
            }}
          >
            dia {stage.day}
            {isToday && !isCurrent && (
              <span style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#0F6E56',
                border: '1.5px solid white',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}