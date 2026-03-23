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

function ChoiceNode({ data, sourcePosition, targetPosition }) {
  const s = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className="w-[240px] rounded-[10px] transition-all duration-300 relative" style={{ background: s.bg, border: `1px solid ${s.border}`, borderTop: '4px solid var(--color-accent-primary-dim)' }}>
      {data.state === 'current' && <div className="absolute -top-[12px] right-2 px-1.5 rounded-full" style={{ background: '#00d1ff', color: '#001e2e', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>CURRENT</div>}
      {data.state === 'visited' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#1d9e75', color: '#0a1e1a', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>VISITED</div>}
      {data.state === 'unreachable' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#252525', color: '#888', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>LOCKED</div>}

      <Handle type="target" position={targetPosition || Position.Top} style={{ background: 'var(--color-surface-card-low)', width: 8, height: 8, border: '1px solid var(--color-border-subtle)' }} />
      
      <div style={{ padding: '10px 12px 0' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{data.id}</span>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-primary-dim)', background: 'rgba(0,209,255,0.1)', padding: '2px 5px', borderRadius: 4 }}>Choice</span>
        </div>
      </div>
      
      <div style={{ padding: '4px 12px 9px' }}>
        <h3 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, color: s.text, lineHeight: 1.3, marginBottom: 6, textDecoration: s.lineThrough ? 'line-through' : 'none' }}>{data.label}</h3>
        
        {data.options && data.options.length > 0 && (
          <div className="space-y-1 mt-2">
            {data.options.map((label, i) => (
              <div key={i} className="relative truncate px-2 py-1 rounded" style={{ fontSize: 10, color: 'var(--color-text-secondary)', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                {label || `Option ${i + 1}`}
                <Handle
                  type="source"
                  position={sourcePosition || Position.Bottom}
                  id={`opt-${i}`}
                  style={{
                    background: 'var(--color-surface-card-low)',
                    width: 6, height: 6,
                    border: '1px solid var(--color-border-subtle)',
                    ...(sourcePosition === Position.Right || sourcePosition === 'right'
                      ? { top: '50%' }
                      : { left: `${((i + 1) / (data.options.length + 1)) * 100}%` })
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {(!data.options || data.options.length === 0) && (
          <Handle type="source" position={sourcePosition || Position.Bottom} style={{ background: 'var(--color-surface-card-low)', width: 8, height: 8, border: '1px solid var(--color-border-subtle)', cursor: 'crosshair' }} />
        )}
      </div>
    </div>
  );
}

export default memo(ChoiceNode);
