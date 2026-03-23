import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Undo2, ArrowRight, Flag, CheckCircle2, XCircle, Dumbbell, Diamond, X } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';
import useSimulator from '../../hooks/useSimulator';

/**
 * Simulator — Phase 2 Simulation Sandbox
 * Spec: §2.2 Layout (320px panel), §2.3 Simulator Panel, §2.4 Dynamic Tracker, §2.5 Ending Detection
 */
export default function Simulator() {
  const sim = useSimulator();
  const {
    flags, choices, scenes, endings, statusPoints, entryNode,
    currentNodeId, historyStack, activeState, isRunning,
    passesRequires, handleStart, handleOptionSelect,
    handleSceneContinue, handleUndo, handleStop, handleRevive,
  } = sim;

  // Track previous flag/status values for flash animations
  const prevFlagsRef = useRef({});
  const prevStatusRef = useRef({});
  const [flashedFlags, setFlashedFlags] = useState(new Set());
  const [flashedStatus, setFlashedStatus] = useState(new Set());

  useEffect(() => {
    if (!isRunning) return;
    const newFlashedFlags = new Set();
    const newFlashedStatus = new Set();

    Object.keys(activeState.flags).forEach(fId => {
      if (prevFlagsRef.current[fId] !== undefined && prevFlagsRef.current[fId] !== activeState.flags[fId]) {
        newFlashedFlags.add(fId);
      }
    });
    Object.keys(activeState.status).forEach(sId => {
      if (prevStatusRef.current[sId] !== undefined && prevStatusRef.current[sId] !== activeState.status[sId]) {
        newFlashedStatus.add(sId);
      }
    });

    if (newFlashedFlags.size > 0) setFlashedFlags(newFlashedFlags);
    if (newFlashedStatus.size > 0) setFlashedStatus(newFlashedStatus);

    prevFlagsRef.current = { ...activeState.flags };
    prevStatusRef.current = { ...activeState.status };

    // Clear flash after animation
    if (newFlashedFlags.size > 0 || newFlashedStatus.size > 0) {
      const timer = setTimeout(() => {
        setFlashedFlags(new Set());
        setFlashedStatus(new Set());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeState, isRunning]);

  const stepCount = useMemo(() => historyStack.filter(s => s.type !== 'loop').length, [historyStack]);

  /* ─── Ghost button ─── */
  const GhostBtn = ({ onClick, children, disabled = false, danger = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 transition-colors"
      style={{
        background: 'none',
        border: '1px solid var(--color-border-ghost)',
        borderRadius: 6,
        color: danger ? 'var(--color-accent-error)' : 'var(--color-text-secondary)',
        fontSize: 11,
        fontFamily: 'var(--font-ui)',
        fontWeight: 500,
        padding: '4px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );

  /* ─── §2.4 Dynamic Tracker ─── */
  const renderDynamicTracker = () => {
    const flagList = Object.keys(flags).sort();
    const statusList = Object.values(statusPoints || {}).sort((a, b) => a.id.localeCompare(b.id));

    return (
      <div className="space-y-5">
        {/* FLAGS §2.4 */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Flags
          </h3>
          {flagList.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No flags defined.</p>
          ) : (
            <div className="space-y-1">
              {flagList.map(fId => {
                const isTrue = activeState.flags[fId];
                const flashing = flashedFlags.has(fId);
                return (
                  <div
                    key={fId}
                    className={flashing ? 'flash-flag' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--color-surface-card-low)',
                      border: '1px solid var(--color-border-ghost)',
                      borderRadius: 4, padding: '4px 8px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent-variable)', flexShrink: 0 }}>{fId}</span>
                    <span className="truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)', flex: 1 }}>{flags[fId].name}</span>
                    <span className="flex items-center gap-1 shrink-0" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isTrue ? 'var(--color-accent-success)' : 'var(--color-text-muted)' }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: isTrue ? 'var(--color-accent-success)' : 'var(--color-text-muted)' }} />
                      {isTrue ? 'true' : 'false'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STATUS §2.4 */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Status
          </h3>
          {statusList.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No status points defined.</p>
          ) : (
            <div className="space-y-1">
              {statusList.map(sp => {
                const currentVal = activeState.status[sp.id];
                const startedVal = Number(sp.value);
                const flashing = flashedStatus.has(sp.id);
                return (
                  <div
                    key={sp.id}
                    className={flashing ? 'flash-status' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--color-surface-card-low)',
                      border: '1px solid var(--color-border-ghost)',
                      borderRadius: 4, padding: '4px 8px',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent-primary-dim)', flexShrink: 0 }}>{sp.id}</span>
                      <span className="truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{sp.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--color-accent-primary)' }}>{currentVal}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(started: {startedVal})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  /* ─── §2.5 Ending Detection ─── */
  const renderEndingPanel = (endingObj) => {
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--color-surface-card-low)' }}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <Diamond className="w-10 h-10" style={{ color: 'var(--color-accent-terminal)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ending Reached
          </h2>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{currentNodeId}</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-accent-terminal)', marginTop: 4 }} className="capitalize">
              {endingObj.name.replace(/_/g, ' ')}
            </h3>
          </div>

          {/* Condition list */}
          {endingObj.requires && endingObj.requires.length > 0 && (
            <div className="w-full text-left space-y-1.5" style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                All conditions met:
              </h4>
              {endingObj.requires.map((req, i) => {
                const met = req.flag
                  ? activeState.flags[req.flag] === req.state
                  : (() => {
                      const val = activeState.status[req.status];
                      return (req.min === undefined || val >= req.min) && (req.max === undefined || val <= req.max);
                    })();
                return (
                  <div key={i} className="flex items-center gap-2" style={{ fontSize: 12, padding: '3px 0' }}>
                    <span style={{ color: met ? 'var(--color-accent-success)' : 'var(--color-accent-error)' }}>
                      {met ? '✓' : '✗'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {req.flag
                        ? `${req.flag} = ${String(req.state)}`
                        : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? ` ≤${req.max}` : ''}`
                      }
                    </span>
                    {!req.flag && req.status && (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        (current: {activeState.status[req.status]})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
          <button
            onClick={() => sim.handleRevive()}
            className="flex-1 signature-gradient flex items-center justify-center gap-1.5"
            style={{ color: '#0a1a1f', border: 'none', borderRadius: 24, padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start new simulation
          </button>
          <GhostBtn onClick={() => sim.handleStop()}>
            <X className="w-3.5 h-3.5" /> Close
          </GhostBtn>
        </div>
      </div>
    );
  };

  /* ─── §2.3 Start Screen ─── */
  const renderStartScreen = () => (
    <div className="h-full flex flex-col p-5">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
        Simulator
      </h2>
      <div className="space-y-4">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Starting from
          </label>
          <SearchableDropdown
            value={entryNode}
            onChange={handleStart}
            options={[
              ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
              ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
            ]}
            placeholder="Select a node..."
            showFilters={true}
            className="w-full text-left"
          />
        </div>

        <button
          onClick={() => handleStart(entryNode)}
          disabled={!entryNode || (!scenes[entryNode] && !choices[entryNode])}
          className="w-full signature-gradient flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: '#0a1a1f', border: 'none', borderRadius: 24, padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: entryNode ? 'pointer' : 'not-allowed' }}
        >
          <Play className="w-3.5 h-3.5" /> Start simulation
        </button>

        <GhostBtn onClick={() => {}} disabled>
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </GhostBtn>
      </div>
    </div>
  );

  /* ─── §2.3 Active Simulation: Choice Display ─── */
  const renderChoiceDisplay = (choiceObj) => {
    const loopedOptions = new Set();
    for (let i = historyStack.length - 1; i >= 0; i--) {
      const step = historyStack[i];
      if (step.nodeId !== currentNodeId) break;
      if (step.type === 'loop' && step.optionIndex !== undefined) {
        loopedOptions.add(step.optionIndex);
      }
    }

    return (
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{currentNodeId}</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>·</span>
            <span className="truncate" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{choiceObj.text}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Step {stepCount} of session</span>
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          {(choiceObj.options || []).map((opt, idx) => {
            const passesReq = passesRequires(opt.requires);
            const isLooped = loopedOptions.has(idx);

            if (isLooped) {
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-disabled)', fontSize: 12, cursor: 'not-allowed' }}>
                  <span>{opt.label}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>↺ already chosen</span>
                </div>
              );
            }

            if (!passesReq) {
              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-disabled)', fontSize: 12, cursor: 'not-allowed' }}>
                  <span>{opt.label}</span>
                  <span style={{ fontSize: 12 }}>🔒</span>
                </div>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(choiceObj, idx)}
                className="w-full text-left p-2.5 rounded-lg flex justify-between items-center group transition-colors"
                style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-ghost)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-accent-primary)' }} />
              </button>
            );
          })}
        </div>

        {/* Undo */}
        <GhostBtn onClick={handleUndo} disabled={historyStack.length <= 1}>
          <Undo2 className="w-3.5 h-3.5" /> Undo last choice
        </GhostBtn>
      </div>
    );
  };

  /* ─── §2.3 Active Simulation: Scene Display ─── */
  const renderSceneDisplay = (sceneObj) => {
    // Find the next resolution
    const nextArr = sceneObj.next || [];
    const validRoute = nextArr.find(route => passesRequires(route.requires));
    const nextLabel = validRoute
      ? `Next: ${validRoute.target} (condition met)`
      : nextArr.length > 0
        ? 'Next: (no conditions met — dead end)'
        : 'Next: (no routes defined)';

    return (
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{currentNodeId}</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>·</span>
            <span className="truncate" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{sceneObj.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Scene — displaying narrative moment</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {sceneObj.description}
        </p>

        {/* Next resolution */}
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{nextLabel}</p>

        {/* Continue (ghost button) */}
        <GhostBtn onClick={() => handleSceneContinue(sceneObj)}>
          <ArrowRight className="w-3.5 h-3.5" /> Continue
        </GhostBtn>

        {/* Undo */}
        <GhostBtn onClick={handleUndo} disabled={historyStack.length <= 1}>
          <Undo2 className="w-3.5 h-3.5" /> Undo last choice
        </GhostBtn>
      </div>
    );
  };

  /* ─── §2.3 Active Simulation Content ─── */
  const renderActiveContent = () => {
    if (!currentNodeId) return null;

    // Check ending first (§2.5)
    const endingObj = endings[currentNodeId];
    if (endingObj) return renderEndingPanel(endingObj);

    const nodeObj = scenes[currentNodeId] || choices[currentNodeId];
    if (!nodeObj) return <div className="p-5" style={{ color: 'var(--color-accent-error)', fontSize: 12 }}>Node missing! ({currentNodeId})</div>;

    const isScene = !!scenes[currentNodeId];

    return (
      <div className="flex flex-col h-full">
        {/* Sim header with controls */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-ghost)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Simulator
          </h2>
          <div className="flex gap-1.5">
            <GhostBtn onClick={() => { if (window.confirm('Restart?')) handleRevive(); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </GhostBtn>
            <GhostBtn onClick={() => { if (window.confirm('Stop?')) handleStop(); }} danger>
              <X className="w-3.5 h-3.5" /> Stop
            </GhostBtn>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Choice or Scene display */}
          {isScene ? renderSceneDisplay(nodeObj) : renderChoiceDisplay(nodeObj)}

          {/* §2.4 Dynamic Tracker */}
          <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
            {renderDynamicTracker()}
          </div>
        </div>
      </div>
    );
  };

  /* ─── §2.2 Layout Shell ─── */
  return (
    <div className="flex flex-1 h-full overflow-hidden" style={{ background: 'var(--color-surface-workspace)' }}>
      {/* Main editor content area (existing editor remains visible) */}
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
        {!isRunning && (
          <div className="text-center space-y-2 p-10">
            <Play className="w-10 h-10 mx-auto" style={{ color: 'var(--color-text-disabled)' }} />
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Start a simulation to test your narrative tree.</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-disabled)' }}>Use the panel on the right to begin.</p>
          </div>
        )}
        {isRunning && !endings[currentNodeId] && (
          <div className="max-w-lg text-center space-y-2 p-10">
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Simulation running — interact via the Simulator panel →
            </p>
          </div>
        )}
      </div>

      {/* §2.2 Simulator Panel — 320px fixed right sidebar */}
      <aside className="w-80 shrink-0 flex flex-col overflow-hidden" style={{ background: 'var(--color-surface-panel)', borderLeft: '1px solid var(--color-border-ghost)' }}>
        {!isRunning ? renderStartScreen() : renderActiveContent()}
      </aside>
    </div>
  );
}
