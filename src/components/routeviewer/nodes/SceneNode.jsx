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

function SceneNode({ data, sourcePosition, targetPosition }) {
  const s = STATE_STYLES[data.state] || STATE_STYLES.reachable;
  const nextEntries = data.nextEntries || [];

  return (
    <div className={`w-[280px] rounded-[10px] relative ${data.isGhosted ? 'opacity-15' : ''}`} style={{ background: s.bg, border: `1px solid ${s.border}`, borderTop: `4px solid var(--color-accent-scene)` }}>
      {data.state === 'current' && <div className="absolute -top-[12px] right-2 px-1.5 rounded-full" style={{ background: '#00d1ff', color: '#001e2e', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>CURRENT</div>}
      {data.state === 'visited' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#1d9e75', color: '#0a1e1a', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>VISITED</div>}
      {data.state === 'unreachable' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#252525', color: '#888', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>LOCKED</div>}

      <Handle type="target" position={targetPosition || Position.Top} style={{ background: 'var(--color-surface-card-low)', width: 8, height: 8, border: '1px solid var(--color-border-subtle)' }} />
      
      <div style={{ padding: '10px 12px 0' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{data.id}</span>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-scene)', background: 'rgba(167,139,250,0.1)', padding: '2px 5px', borderRadius: 4 }}>Scene</span>
        </div>
      </div>
      
      <div style={{ padding: '4px 12px 9px' }}>
        <h3 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, color: s.text, lineHeight: 1.3, textDecoration: s.lineThrough ? 'line-through' : 'none' }}>{data.label}</h3>

        {data.requires && data.requires.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Req</span>
            {data.requires.slice(0, 3).map((req, idx) => {
              const text = req.flag
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
        
        {data.description && (
          <p className="line-clamp-2 mt-1" style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>
            {data.description}
          </p>
        )}

        {(data.variantsCount > 0 || data.nextCount > 0) && (
          <div className="flex gap-1.5 mt-2" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {data.variantsCount > 0 && <span style={{ background: 'var(--color-surface-workspace)', padding: '1px 5px', borderRadius: 4 }}>◈ {data.variantsCount} variants</span>}
            {data.nextCount > 0 && <span style={{ background: 'var(--color-surface-workspace)', padding: '1px 5px', borderRadius: 4 }}>→ {data.nextCount} out</span>}
          </div>
        )}
      </div>
      
      {/* One output handle per next entry (canvas edge wiring) */}
      {nextEntries.map((entry, idx) => {
        const handleId = entry?._id;
        if (!handleId) return null;
        const total = Math.max(1, nextEntries.length);
        const leftPct = ((idx + 1) / (total + 1)) * 100;
        return (
          <Handle
            key={handleId}
            type="source"
            position={sourcePosition || Position.Bottom}
            id={String(handleId)}
            style={{
              background: 'var(--color-surface-card-low)',
              width: 6,
              height: 6,
              border: '1px solid var(--color-border-subtle)',
              cursor: 'crosshair',
              ...(sourcePosition === Position.Right || sourcePosition === 'right' ? { top: '50%' } : { left: `${leftPct}%`, bottom: 6 }),
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(SceneNode);
