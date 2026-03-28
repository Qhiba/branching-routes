import React, { useState } from 'react';
import { X, Award } from 'lucide-react';
import { hasConditions, flattenConditions } from '../../utils/conditionUtils';

export default function InspectorPanel({ node, onClose, onTraceRoute }) {
  if (!node) return null;

  const typeLabel = node.nodeType === 'ending' ? 'Terminal' : node.nodeType === 'choice' ? 'Choice' : 'Scene';
  const accentColor = node.nodeType === 'ending' ? 'var(--color-accent-terminal)' : node.nodeType === 'choice' ? 'var(--color-accent-primary-dim)' : 'var(--color-accent-scene)';

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface-panel)] text-[var(--color-text-primary)]">
      {/* Header */}
      <div className="p-4" style={{ background: 'var(--color-surface-card)', borderBottom: '1px solid var(--color-border-divider)' }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: accentColor, background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, padding: '2px 5px', borderRadius: 4 }}>
              {typeLabel}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>{node.id}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-surface-card-low)]" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-text-primary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <h2 className="line-clamp-2" style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 8 }}>
          {node.name || node.text || node.id}
        </h2>
        {node.description && (
          <p className="line-clamp-3 mb-2" style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {node.description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sections */}
        {hasConditions(node.requires) && (
          <div className="py-2.5">
            <h3 style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 13px 5px' }}>Requires</h3>
            <div className="flex flex-wrap gap-1.5" style={{ padding: '0 13px 10px' }}>
              {flattenConditions(node.requires).map((req, i) => (
                <span key={i} className="px-2 py-0.5 rounded" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                  {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                </span>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--color-border-divider)' }} />
          </div>
        )}

        {node.nodeType === 'choice' && node.options && node.options.length > 0 && (
          <div className="py-2.5">
            <h3 style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 13px 5px' }}>Next Targets</h3>
            <div className="space-y-1.5" style={{ padding: '0 13px 10px' }}>
              {node.options.map((opt, i) => (
                <div key={i} className="rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                  <div className="px-2 py-1.5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border-divider)' }}>
                     <span className="truncate" style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{opt.label || `Option ${i + 1}`}</span>
                     <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary-dim)' }}>→ {opt.next || 'loop'}</span>
                  </div>
                  {hasConditions(opt.requires) && (
                    <div className="px-2 py-1 flex flex-wrap gap-1">
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>if</span>
                      {flattenConditions(opt.requires).map((req, j) => (
                         <span key={j} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: req.flag ? 'var(--color-accent-variable)' : 'var(--color-accent-primary-dim)' }}>
                           {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                         </span>
                      ))}
                    </div>
                  )}
                  {opt.flags_set && opt.flags_set.length > 0 && (
                     <div className="px-2 py-1 flex items-center gap-1">
                       <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>sets:</span>
                       {opt.flags_set.map((f, j) => (
                          <span key={j} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-variable)' }}>{f}</span>
                       ))}
                     </div>
                  )}
                  {opt.status_set && opt.status_set.length > 0 && (
                     <div className="px-2 py-1 flex flex-wrap gap-1">
                       {opt.status_set.map((s, j) => (
                          <span key={j} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: s.amount >= 0 ? 'var(--color-accent-primary-dim)' : 'var(--color-accent-error)' }}>
                            {s.amount >= 0 ? '+' : ''}{s.amount} {s.status}
                          </span>
                       ))}
                     </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--color-border-ghost)' }} />
          </div>
        )}

        {node.nodeType === 'scene' && node.next && node.next.length > 0 && (
          <div className="py-2.5">
            <h3 style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 13px 5px' }}>Next Targets</h3>
            <div className="space-y-1.5" style={{ padding: '0 13px 10px' }}>
              {node.next.map((route, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded-md flex justify-between items-center" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                  <div className="flex gap-2 items-center truncate">
                    {hasConditions(route.requires) ? (
                      <div className="flex items-center gap-1 truncate">
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>if</span>
                        <div className="truncate text-xs flex gap-1">
                           {flattenConditions(route.requires).map((req, j) => (
                             <span key={j} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: req.flag ? 'var(--color-accent-variable)' : 'var(--color-accent-primary-dim)' }}>
                               {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                             </span>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>fallback · requires: []</span>
                    )}
                  </div>
                  <span className="shrink-0 ml-2" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary-dim)' }}>→ {route.target}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--color-border-divider)' }} />
          </div>
        )}

        {node.nodeType === 'ending' && (
          <div className="py-6 flex flex-col items-center text-center px-4">
             <Award className="w-8 h-8 mb-2" style={{ color: 'var(--color-accent-terminal)' }} />
             <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Terminal Ending</span>
             <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>This node ends the simulation. No next targets can be reached.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-[13px] py-3 text-xs" style={{ background: 'var(--color-surface-card-low)', borderTop: '1px solid var(--color-border-divider)' }}>
        <button onClick={onTraceRoute} className="flex items-center justify-center rounded-md transition-colors w-full" style={{ background: 'rgba(212,160,23,0.1)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.2)', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,160,23,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,160,23,0.1)'}>
          Trace Route
        </button>
      </div>
    </div>
  );
}
