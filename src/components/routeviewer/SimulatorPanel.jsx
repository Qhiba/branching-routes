import React from 'react';
import { Play, RotateCcw, Undo2, ArrowRight, Flag, XCircle, Dumbbell, CheckCircle2, Award, StopCircle } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';

/**
 * SimulatorPanel — right sidebar inside RouteViewer.
 * Receives all state and actions from useSimulator() via props.
 */
export default function SimulatorPanel({ sim }) {
  const {
    currentNodeId, isRunning, activeState, historyStack,
    flags, choices, scenes, endings, statusPoints, entryNode,
    passesRequires, handleStart, handleOptionSelect,
    handleSceneContinue, handleUndo, handleStop, handleRevive,
  } = sim;

  // --- Pre-simulation start screen ---
  if (!isRunning) {
    return (
      <div className="p-5 space-y-5 flex flex-col h-full" style={{ background: 'var(--color-surface-panel)', color: 'var(--color-text-primary)' }}>
        <div className="flex justify-between items-center p-3 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
          <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Offline
          </h2>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-text-disabled)' }} />
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => handleStart(entryNode)}
            disabled={!entryNode || (!scenes[entryNode] && !choices[entryNode])}
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
                ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
                ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
              ]}
              placeholder="Select a specific node..."
              showFilters={true}
              className="w-full text-left"
            />
          </div>
        </div>
      </div>
    );
  }

  // --- Active simulation ---
  const endingObj = endings[currentNodeId];
  const nodeObj = scenes[currentNodeId] || choices[currentNodeId];
  const isScene = !!scenes[currentNodeId];
  const isEnding = !!endingObj;

  const resolveSceneDescription = (sceneObj) => {
    const baseDescription = sceneObj.description || '';
    const variants = sceneObj.variants || [];
    const matchingVariant = variants.find((v) => passesRequires(v?.requires || []));
    return matchingVariant?.text
      ? `${baseDescription}${baseDescription ? '\n' : ''}${matchingVariant.text}`
      : baseDescription;
  };

  const flagList = Object.keys(flags).sort();
  const statusList = Object.values(statusPoints || {}).sort((a, b) => a.id.localeCompare(b.id));

  const GhostBtn = ({ onClick, icon: Icon, title }) => (
    <button onClick={onClick} className="p-1.5 rounded transition-colors" style={{ color: 'var(--color-text-muted)', border: '1px solid transparent' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border-row)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}
      title={title}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-surface-panel)', color: 'var(--color-text-primary)' }}>
      {/* Simulation Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-divider)' }}>
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--color-accent-success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Live
          </h2>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-accent-success)' }} />
        </div>
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>NODE: {currentNodeId}</p>
          <div className="flex gap-1">
            <GhostBtn onClick={handleUndo} icon={Undo2} title="Undo Step" />
            <GhostBtn onClick={() => { if (window.confirm('Restart simulation?')) handleRevive(); }} icon={RotateCcw} title="Restart" />
            <GhostBtn onClick={() => { if (window.confirm('Stop simulation?')) handleStop(); }} icon={StopCircle} title="Stop" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* Current Event */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current Event</h3>
          <div className="rounded-md overflow-hidden" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-card)' }}>
            <div style={{ height: 3, background: isEnding ? 'var(--color-accent-terminal)' : isScene ? 'var(--color-accent-scene)' : 'var(--color-accent-primary-dim)' }} />
            {isEnding ? (
              <div className="text-center py-4 px-3 space-y-2">
                <Award className="w-8 h-8 mx-auto" style={{ color: 'var(--color-accent-terminal)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>Termination</h3>
                <p style={{ fontSize: 12, color: 'var(--color-accent-terminal)' }} className="capitalize">{endingObj.name.replace(/_/g, ' ')}</p>
              </div>
            ) : isScene && nodeObj ? (
              <div className="p-3 space-y-2">
                <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{nodeObj.name}</h3>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{resolveSceneDescription(nodeObj)}</p>
                <button
                  onClick={() => handleSceneContinue(nodeObj)}
                  className="w-full mt-1 flex items-center justify-center gap-2 rounded-md transition-colors"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-accent-primary)', padding: '6px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : nodeObj ? (
              <div className="p-3 space-y-2">
                <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>{nodeObj.text}</h3>
                <div className="space-y-1.5">
                  {(() => {
                    const loopedOptions = new Set();
                    for (let i = historyStack.length - 1; i >= 0; i--) {
                      const step = historyStack[i];
                      if (step.nodeId !== currentNodeId) break;
                      if (step.type === 'loop' && step.optionIndex !== undefined) {
                        loopedOptions.add(step.optionIndex);
                      }
                    }

                    return (nodeObj.options || []).map((opt, idx) => {
                      const passes = passesRequires(opt.requires);
                      const isLooped = loopedOptions.has(idx);
                      const isValid = passes && !isLooped;

                      return isValid ? (
                        <button
                          key={idx}
                          onClick={() => handleOptionSelect(nodeObj, idx)}
                          className="w-full text-left p-2.5 rounded-md flex justify-between items-center group transition-colors"
                          style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-active)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-row)'}
                        >
                          <span className="flex-1 mr-2">{opt.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--color-accent-primary)' }} />
                        </button>
                      ) : (
                        <div key={idx} className="w-full text-left p-2.5 rounded-md flex justify-between items-center"
                          style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-disabled)', fontSize: 11, cursor: 'not-allowed' }}
                        >
                          <span className="flex-1 mr-2 truncate">{opt.label}</span>
                          <span className="flex items-center gap-1 shrink-0" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                            <XCircle className="w-3 h-3" />
                            {isLooped ? 'Loop' : 'Lock'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-3" style={{ color: 'var(--color-accent-error)', fontSize: 11 }}>Node missing! ({currentNodeId})</div>
            )}
          </div>
        </section>

        {/* History Stack */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>History Stack</h3>
          <div className="space-y-0">
            {[...historyStack].reverse().map((step, revIdx) => {
              const actualIdx = historyStack.length - 1 - revIdx;
              const isFirst = actualIdx === 0;
              const entity = scenes[step.nodeId] || choices[step.nodeId] || endings[step.nodeId];
              
              return (
                <div key={actualIdx} className="relative pl-5 pb-5" style={{ borderLeft: isFirst ? 'none' : '1px solid var(--color-border-divider)' }}>
                  <div className="absolute -left-[4px] top-1 w-2 h-2 rounded-full" style={{ background: 'var(--color-border-ghost)', border: '2px solid var(--color-surface-panel)' }} />
                  <div className="flex flex-col gap-0.5 -mt-0.5">
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {String(actualIdx).padStart(2, '0')}</span>
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex-1 truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{entity ? entity.name || entity.text : step.nodeId}</span>
                      {actualIdx === historyStack.length - 1 && actualIdx !== 0 && (
                        <button onClick={handleUndo} style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Undo</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
