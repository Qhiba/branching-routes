import React, { useState, useEffect } from 'react';
import { GitBranch, Play, AlertTriangle, X, Route } from 'lucide-react';
import SimulatorPanel from '../routeviewer/SimulatorPanel';
import SearchableDropdown from '../shared/SearchableDropdown';

export default function RightSidebar({
  sim,
  activeEditId,
  isSimulating,
  onBacktrack,
  backtrackTargetId,
  onClearBacktrack,
  routeTraceResult,
  onHighlightPath,
  tracedPath,
  entryNode,
  handleStart,
}) {
  const canTrace = !isSimulating && activeEditId;
  const tooltipText = !activeEditId ? "Select a node to trace its route" : "";

  // State for selected path index (if multiple paths)
  const [selectedPathIdx, setSelectedPathIdx] = useState(0);

  // Reset selectedPathIdx when a new trace result arrives
  useEffect(() => {
    setSelectedPathIdx(0);
  }, [routeTraceResult]);

  // Auto-highlight: whenever routeTraceResult or selectedPathIdx changes,
  // immediately apply the gold highlight to the active path on the canvas.
  useEffect(() => {
    if (routeTraceResult && routeTraceResult.paths && routeTraceResult.paths.length > 0) {
      const idx = Math.min(selectedPathIdx, routeTraceResult.paths.length - 1);
      onHighlightPath(routeTraceResult.paths[idx].raw);
    }
  }, [routeTraceResult, selectedPathIdx, onHighlightPath]);

  const handleTraceClick = () => {
    if (canTrace) {
      onBacktrack(activeEditId);
    }
  };

  // Helper to get entity info
  const getEntityInfo = (entityId) => {
    const { scenes, choices, endings } = sim || {};
    if (scenes && scenes[entityId]) {
      return { type: 'Scene', name: scenes[entityId].name, color: 'var(--color-accent-scene)' };
    }
    if (choices && choices[entityId]) {
      return { type: 'Choice', name: choices[entityId].text, color: 'var(--color-accent-primary-dim)' };
    }
    if (endings && endings[entityId]) {
      return { type: 'Ending', name: endings[entityId].name, color: 'var(--color-accent-terminal)' };
    }
    return { type: 'Unknown', name: 'Unknown', color: 'var(--color-text-muted)' };
  };

  // Determine which view to show
  const showSimulatorFull = sim && sim.isRunning;
  const showTraceFull = backtrackTargetId && routeTraceResult;

  // Default view: two stacked sections
  const renderDefaultView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* SIMULATOR SECTION */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border-ghost)' }}>
        <h2 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Simulator
        </h2>
        <div className="flex justify-between items-center p-3 rounded-md mb-3" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Offline
          </span>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-text-disabled)' }} />
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => handleStart(entryNode)}
            disabled={!entryNode || (!sim?.scenes?.[entryNode] && !sim?.choices?.[entryNode])}
            className="w-full signature-gradient flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ color: '#0a1a1f', borderRadius: 24, padding: '8px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', border: 'none', cursor: entryNode ? 'pointer' : 'not-allowed' }}
          >
            <Play className="w-4 h-4" /> Start Entry Node
          </button>
          
          <div style={{ borderTop: '1px solid var(--color-border-divider)', paddingTop: 12 }}>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Or manually target</span>
            <SearchableDropdown
              value={null}
              onChange={handleStart}
              options={[
                ...Object.values(sim?.scenes || {}).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
                ...Object.values(sim?.choices || {}).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
              ]}
              placeholder="Select a specific node..."
              showFilters={true}
              className="w-full text-left"
            />
          </div>
        </div>
      </div>

      {/* TRACE ROUTE SECTION */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <GitBranch className="w-3.5 h-3.5" /> Trace Route
          </h2>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Select a node on the canvas to trace its path.
          </p>
        </div>

        <button
          onClick={handleTraceClick}
          disabled={!canTrace}
          title={tooltipText}
          className="w-full flex items-center justify-center gap-2 px-[13px] py-[10px] transition-colors mt-auto"
          style={{
            background: 'transparent',
            border: `1px solid var(--color-border-ghost)`,
            borderRadius: 6,
            color: canTrace ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'var(--font-ui)',
            cursor: canTrace ? 'pointer' : 'not-allowed',
            opacity: canTrace ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (canTrace) {
              e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (canTrace) {
              e.currentTarget.style.borderColor = 'var(--color-border-ghost)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          <GitBranch className="w-[14px] h-[14px] flex-shrink-0" />
          <span>⌥ Trace Route</span>
        </button>
      </div>
    </div>
  );

  // Full takeover for trace route
  const renderTraceRouteFull = () => {
    const targetInfo = getEntityInfo(backtrackTargetId);
    const hasResult = routeTraceResult && routeTraceResult.paths && routeTraceResult.paths.length > 0;
    const currentPath = hasResult ? routeTraceResult.paths[selectedPathIdx] : null;

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-ghost)' }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5" style={{ color: '#d4a017' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#d4a017', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                TRACE ROUTE
              </span>
            </div>
            <button
              onClick={onClearBacktrack}
              className="p-1 rounded transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mb-2 flex items-center gap-1.5">
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>ROUTE TO</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: targetInfo.color, padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
              {backtrackTargetId.slice(0, 6)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {targetInfo.name || 'Unnamed'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {targetInfo.type}
              </div>
            </div>
          </div>
        </div>

        {/* Path selector (if multiple paths) */}
        {hasResult && routeTraceResult.paths.length > 1 && (
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Path:</span>
            <div className="flex gap-1 flex-wrap">
              {routeTraceResult.paths.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPathIdx(idx)}
                  className="px-2 py-0.5 rounded transition-colors"
                  style={{
                    fontSize: 10,
                    fontWeight: selectedPathIdx === idx ? 600 : 400,
                    background: selectedPathIdx === idx ? 'rgba(212,160,23,0.15)' : 'var(--color-surface-card-low)',
                    color: selectedPathIdx === idx ? '#d4a017' : 'var(--color-text-muted)',
                    border: `1px solid ${selectedPathIdx === idx ? 'rgba(212,160,23,0.3)' : 'var(--color-border-ghost)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              {routeTraceResult.paths.length} paths found
            </span>
          </div>
        )}

        {/* Annotated steps */}
        <div className="flex-1 overflow-y-auto p-3">
          {!hasResult ? (
            <div className="text-center py-8">
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                No route found
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                No path exists from the entry node to this node.
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {currentPath.annotated.map((step, idx) => {
                const stepInfo = getEntityInfo(step.nodeId);
                const isLast = idx === currentPath.annotated.length - 1;
                const typeColor = step.nodeType === 'choice' ? 'var(--color-accent-primary-dim)' : step.nodeType === 'scene' ? 'var(--color-accent-scene)' : step.nodeType === 'ending' ? 'var(--color-accent-terminal)' : 'var(--color-text-muted)';

                return (
                  <div key={step.nodeId} className="relative">
                    {/* Step number + node info */}
                    <div
                      className="p-2.5 rounded-md transition-colors cursor-pointer"
                      style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}
                      onClick={() => {/* TODO: maybe set active edit? */}}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-ghost)'}
                    >
                      <div className="flex items-start gap-2">
                        {/* Step number */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', fontSize: 10, fontWeight: 700 }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {/* Node type badge + ID */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: typeColor, background: `color-mix(in srgb, ${typeColor} 10%, transparent)`, padding: '1px 4px', borderRadius: 3 }}>
                              {step.nodeType}
                            </span>
                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                              {step.nodeId}
                            </span>
                          </div>
                          {/* Node name */}
                          <div className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                            {step.nodeName}
                          </div>

                          {/* Pick info (which option/route to take) */}
                          {step.pick && (
                            <div className="mt-1.5 pl-2" style={{ borderLeft: '2px solid rgba(212,160,23,0.3)' }}>
                              <div className="flex items-center gap-1">
                                <span style={{ fontSize: 10, color: '#d4a017' }}>→</span>
                                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                  "{step.pick.label}"
                                </span>
                              </div>

                              {/* Flags set */}
                              {step.flagsSet && step.flagsSet.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.flagsSet.map((flagName, fi) => (
                                    <span key={fi} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-variable)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                      sets {flagName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Status changes */}
                              {step.statusChanges && step.statusChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.statusChanges.map((sc, si) => (
                                    <span key={si} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: sc.amount >= 0 ? 'var(--color-accent-primary-dim)' : 'var(--color-accent-error)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                      {sc.amount >= 0 ? '+' : ''}{sc.amount} {sc.statusName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Satisfaction warning */}
                              {!step.satisfiesNext && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3 h-3" style={{ color: 'var(--color-accent-error)' }} />
                                  <span style={{ fontSize: 9, color: 'var(--color-accent-error)' }}>
                                    Next node's requirements may not be met
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Requires on this node */}
                          {step.requires && step.requires.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>requires:</span>
                              {step.requires.map((req, ri) => (
                                <span key={ri} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: req.flag ? 'var(--color-accent-variable)' : 'var(--color-accent-primary-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                  {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Connector line between steps */}
                    {!isLast && (
                      <div className="flex justify-center py-0.5">
                        <div style={{ width: 1, height: 12, background: 'rgba(212,160,23,0.3)' }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary */}
              <div className="mt-3 px-2.5 py-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Minimum choices: <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentPath.annotated.filter(s => s.nodeType === 'choice' && s.pick).length}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Total steps: <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentPath.raw.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — Close Trace Route button */}
        {hasResult && (
          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
            <button
              onClick={onClearBacktrack}
              className="flex items-center justify-center gap-2 rounded-md transition-colors w-full"
              style={{
                background: 'rgba(212,160,23,0.1)',
                color: '#d4a017',
                border: '1px solid rgba(212,160,23,0.2)',
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,160,23,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,160,23,0.1)'}
            >
              <X className="w-3.5 h-3.5" />
              Close Trace Route
            </button>
          </div>
        )}

      </div>
    );
  };

  return (
    <aside className="w-[320px] max-w-[320px] flex-shrink-0 flex flex-col h-full z-10 overflow-hidden" style={{ background: 'var(--color-surface-panel)', borderLeft: '1px solid var(--color-border-panel)' }}>
      {showSimulatorFull ? (
        <SimulatorPanel sim={sim} />
      ) : showTraceFull ? (
        renderTraceRouteFull()
      ) : (
        renderDefaultView()
      )}
    </aside>
  );
}
