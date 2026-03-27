import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// §4.4 STATE_STYLES table
const STATE_STYLES = {
  idle:        { border: 'var(--color-border-card)',   bg: 'var(--color-surface-card)',     text: 'var(--color-text-primary)' },
  current:     { border: 'var(--color-accent-primary)',bg: 'var(--color-surface-card)',     text: 'var(--color-text-primary)' },
  visited:     { border: 'var(--color-accent-visited)',bg: 'var(--color-surface-card)',     text: 'var(--color-text-primary)' },
  reachable:   { border: 'var(--color-border-card)',   bg: 'var(--color-surface-card)',     text: 'var(--color-text-secondary)' },
  unreachable: { border: '#252525',                    bg: 'var(--color-surface-card-low)', text: 'var(--color-text-disabled)', lineThrough: true },
  terminal:    { border: 'var(--color-accent-terminal)',bg: 'var(--color-surface-card)',    text: 'var(--color-text-primary)' },
};

function EndingNode({ data, targetPosition }) {
  const s = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  // Trace highlighting
  let borderStyle = `1px solid ${s.border}`;
  let opacity = data.isGhosted ? 0.15 : 1;
  if (data.traceHighlight) {
    if (data.traceHighlight.isOnPath) {
      borderStyle = '2px solid #d4a017';
    } else {
      opacity = 0.35;
    }
  }

  return (
    <div className="w-[288px] rounded-[10px] relative" style={{ background: s.bg, borderLeft: borderStyle, borderRight: borderStyle, borderBottom: borderStyle, borderTop: '4px solid var(--color-accent-terminal)', opacity }}>
      {data.state === 'terminal' && <div className="absolute -top-[12px] right-2 px-1.5 rounded-full" style={{ background: '#c8770a', color: '#1e1400', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>TERMINAL</div>}
      {data.state === 'unreachable' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#252525', color: '#888', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>LOCKED</div>}

      <Handle type="target" position={targetPosition || Position.Top} style={{ background: 'var(--color-surface-card-low)', width: 8, height: 8, border: '1px solid var(--color-border-subtle)' }} />
      
      <div style={{ padding: '10px 12px 0' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{data.id}</span>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-terminal)', background: 'rgba(200,119,10,0.1)', padding: '2px 5px', borderRadius: 4 }}>Terminal</span>
        </div>
      </div>
      
      <div style={{ padding: '4px 12px 9px' }}>
        <h3 className="truncate capitalize" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, color: s.text, lineHeight: 1.3, textDecoration: s.lineThrough ? 'line-through' : 'none' }}>{(data.label || '').replace(/_/g, ' ')}</h3>

        {data.requires && data.requires.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Req</span>
            {data.requires.slice(0, 3).map((req, idx) => {
              const t = req.flag
                ? `${req.flag}=${String(req.state)}`
                : `${req.status}${req.min !== undefined ? `>=${req.min}` : ''}${req.max !== undefined ? `<=${req.max}` : ''}`;
              return (
                <span key={idx} style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `>=${req.min}` : ''}${req.max !== undefined ? `<=${req.max}` : ''}`.trim()}
                </span>
              );
            })}
            {data.requires.length > 3 && (
              <span style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-muted)', padding: '1px 5px', borderRadius: 4 }}>
                +{data.requires.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(EndingNode);
