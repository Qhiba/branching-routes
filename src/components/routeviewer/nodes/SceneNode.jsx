import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { hasConditions, flattenConditions } from '../../../utils/conditionUtils';

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

  const typeBadgeColor = (type) => {
    if (!type) return null;
    let hash = 0;
    for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];
    return colors[Math.abs(hash) % colors.length];
  };

  const typeColor = typeBadgeColor(data.type);

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
    <div className="w-[288px] rounded-[10px] relative" style={{ background: s.bg, borderLeft: borderStyle, borderRight: borderStyle, borderBottom: borderStyle, borderTop: `4px solid var(--color-accent-scene)`, opacity }}>
      {data.state === 'current' && <div className="absolute -top-[12px] right-2 px-1.5 rounded-full" style={{ background: '#00d1ff', color: '#001e2e', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>CURRENT</div>}
      {data.state === 'visited' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#1d9e75', color: '#0a1e1a', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>VISITED</div>}
      {data.state === 'unreachable' && <div className="absolute -top-[11px] right-2 px-1.5 rounded-full" style={{ background: '#252525', color: '#888', fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>LOCKED</div>}

      <Handle type="target" position={targetPosition || Position.Top} style={{ background: 'var(--color-surface-card-low)', width: 8, height: 8, border: '1px solid var(--color-border-subtle)' }} />
      
      <div style={{ padding: '10px 12px 0' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{data.id}</span>
          {data.type ? (
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: typeColor, background: `${typeColor}20`, padding: '2px 5px', borderRadius: 4 }}>{data.type}</span>
          ) : (
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-scene)', background: 'rgba(167,139,250,0.1)', padding: '2px 5px', borderRadius: 4 }}>Scene</span>
          )}
        </div>
      </div>
      
      <div style={{ padding: '4px 12px 9px' }}>
        <h3 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, color: s.text, lineHeight: 1.3, textDecoration: s.lineThrough ? 'line-through' : 'none' }}>{data.label}</h3>

        {hasConditions(data.requires) && (
          <div className="flex flex-wrap gap-1.5 mt-2" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Req</span>
            {flattenConditions(data.requires).slice(0, 3).map((req, idx) => {
              const text = req.flag
                ? `${req.flag}=${String(req.state)}`
                : `${req.status}${req.min !== undefined ? `>=${req.min}` : ''}${req.max !== undefined ? `<=${req.max}` : ''}`;
              return (
                <span key={idx} style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `>=${req.min}` : ''}${req.max !== undefined ? `<=${req.max}` : ''}`.trim()}
                </span>
              );
            })}
            {flattenConditions(data.requires).length > 3 && (
              <span style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-muted)', padding: '1px 5px', borderRadius: 4 }}>
                +{flattenConditions(data.requires).length - 3} more
              </span>
            )}
          </div>
        )}
        
        {data.description && (
          <p className="line-clamp-2 mt-1" style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>
            {data.description}
          </p>
        )}

        {data.variants && data.variants.length > 0 && (
          <div className="space-y-1 mt-2">
            {data.variants.map((variant, vIdx) => (
              <div key={variant._id || vIdx} className="px-2 py-1 rounded" style={{ fontSize: 10, color: 'var(--color-text-secondary)', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                <div className="flex items-center gap-1.5" style={{ lineHeight: 1.2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>V{vIdx + 1}</span>
                  {hasConditions(variant.requires) && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      if{' '}
                      {flattenConditions(variant.requires).map((req, j) => (
                        <span key={j} style={{ paddingRight: 4 }}>
                          {req.flag
                            ? `${req.flag}=${String(req.state)}`
                            : `${req.status}${req.min !== undefined ? `>=${req.min}` : ''}${req.max !== undefined ? `<=${req.max}` : ''}`}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {variant.text && (
                  <div className="truncate mt-0.5" style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {variant.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(data.flags_set && data.flags_set.length > 0) || (data.status_set && data.status_set.length > 0) ? (
          <div className="flex flex-wrap gap-1.5 mt-2" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {data.flags_set && data.flags_set.length > 0 && data.flags_set.map(flagId => (
              <span key={flagId} style={{ background: 'rgba(251,191,36,0.15)', padding: '1px 5px', borderRadius: 4, color: '#fbbf24' }}>
                ✦ {data.flagsMap?.[flagId]?.name ?? flagId}
              </span>
            ))}
            {data.status_set && data.status_set.length > 0 && data.status_set.map((s, i) => {
              const name = data.statusMap?.[s.status]?.name ?? s.status;
              return (
                <span key={i} style={{ background: 'rgba(34,197,94,0.15)', padding: '1px 5px', borderRadius: 4, color: '#22c55e' }}>
                  ⬡ {name}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {data.nextCount > 0 && (
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-ghost)', padding: '4px 12px', textAlign: 'center' }}>
          → {data.nextCount} out
        </div>
      )}
      
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
