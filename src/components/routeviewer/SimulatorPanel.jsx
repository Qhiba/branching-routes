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
      <div className="p-6 space-y-6 flex flex-col h-full bg-surface-container-low text-on-surface">
        <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
          <h2 className="font-headline font-bold text-xs text-secondary-container tracking-widest uppercase flex items-center gap-2">
            Offline
          </h2>
          <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleStart(entryNode)}
            disabled={!entryNode || (!scenes[entryNode] && !choices[entryNode])}
            className="w-full signature-gradient text-on-primary font-bold tracking-wider uppercase text-sm rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(0,209,255,0.2)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Start Entry Node
          </button>
          
          <div className="pt-4 border-t border-white/5">
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Or manually target</span>
            <SearchableDropdown
              value={null}
              onChange={handleStart}
              options={[
                ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
                ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
              ]}
              placeholder="Select a specific node..."
              showFilters={true}
              className="w-full text-left bg-surface-container-lowest"
              buttonClass="py-3 px-4 text-sm border-white/5 bg-surface-container-lowest text-zinc-300"
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

  const flagList = Object.keys(flags).sort();
  const statusList = Object.values(statusPoints || {}).sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="flex flex-col h-full bg-surface-container-low text-on-surface">
      {/* Simulation Header */}
      <div className="p-6 border-b border-white/5 bg-surface/50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-headline font-bold text-xs text-secondary-container tracking-widest uppercase flex items-center gap-2">
            Live Simulator
          </h2>
          <div className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shadow-[0_0_8px_rgba(171,249,0,0.8)]"></div>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-body text-[10px] text-zinc-500 tracking-wider font-mono">NODE: {currentNodeId}</p>
          <div className="flex gap-1.5">
            <button onClick={handleUndo} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded border border-transparent hover:border-primary/20 transition-all" title="Undo Step">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (window.confirm('Restart simulation?')) handleRevive(); }} className="p-1.5 text-zinc-400 hover:text-secondary-container hover:bg-secondary-container/10 rounded border border-transparent hover:border-secondary-container/20 transition-all" title="Restart">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (window.confirm('Stop simulation?')) handleStop(); }} className="p-1.5 text-zinc-400 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-all" title="Stop">
              <StopCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Dynamic Tracker Grid */}
        <section>
          <h3 className="font-label text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Dynamic Tracker</h3>
          {statusList.length === 0 ? (
            <div className="text-[10px] text-zinc-600 italic bg-surface-container-lowest p-3 rounded-lg border border-white/5">No status points tracking</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {statusList.map(sp => (
                <div key={sp.id} className="bg-surface-container-lowest p-3 rounded-lg border border-white/5 relative overflow-hidden group">
                  <div className="text-[10px] text-zinc-500 uppercase mb-1 truncate">{sp.name}</div>
                  <div className="text-xl font-headline font-bold text-primary">{activeState.status[sp.id]}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Current Node Content Action */}
        <section>
          <h3 className="font-label text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Current Event</h3>
          <div className="bg-surface-container-highest p-4 rounded-xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${isEnding ? 'bg-error' : isScene ? 'signature-gradient' : 'bg-tertiary-container'}`}></div>
            {isEnding ? (
              <div className="text-center py-4 space-y-3">
                <Award className="w-10 h-10 text-error mx-auto drop-shadow-lg" />
                <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-widest">Termination</h3>
                <p className="text-sm text-error/80 capitalize">{endingObj.name.replace(/_/g, ' ')}</p>
              </div>
            ) : isScene && nodeObj ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface font-headline">{nodeObj.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{nodeObj.description}</p>
                <button
                  onClick={() => handleSceneContinue(nodeObj)}
                  className="w-full mt-2 bg-surface-container-lowest hover:bg-white/5 border border-white/10 text-primary px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : nodeObj ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface font-headline leading-relaxed">{nodeObj.text}</h3>
                <div className="space-y-2">
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
                          className="w-full text-left p-3 rounded-lg bg-surface-container-lowest border border-white/5 hover:border-tertiary-container hover:bg-tertiary/5 text-zinc-300 text-xs transition-all group flex justify-between items-center"
                        >
                          <span className="flex-1 mr-2 leading-relaxed">{opt.label}</span>
                          <ArrowRight className="w-4 h-4 text-tertiary-container opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ) : (
                        <div key={idx} className="w-full text-left p-3 rounded-lg border border-white/5 bg-black/20 text-zinc-600 text-xs flex justify-between items-center cursor-not-allowed">
                          <span className="flex-1 mr-2 truncate">{opt.label}</span>
                          <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 text-zinc-500 shrink-0">
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
              <div className="text-error text-xs">Node missing! ({currentNodeId})</div>
            )}
          </div>
        </section>

        {/* Active Flags List */}
        <section>
          <h3 className="font-label text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Active Flags</h3>
          <div className="space-y-2">
            {flagList.length === 0 && <div className="text-[10px] text-zinc-600 italic bg-surface-container-lowest p-3 rounded-lg border border-white/5">No flags defined</div>}
            {flagList.map(fId => {
              const isActive = activeState.flags[fId];
              if (!isActive) return null; // Only show active in this new design for brevity
              return (
                <div key={fId} className="flex items-center gap-3 bg-white/5 p-2 px-3 rounded text-xs border-l-2 border-secondary-container">
                  <span className="material-symbols-outlined text-sm text-secondary-container" style={{fontFamily: 'Material Symbols Outlined'}}>terminal</span>
                  <span className="text-zinc-300 font-mono truncate" title={flags[fId]?.name}>{flags[fId]?.name || fId}</span>
                  <span className="ml-auto text-secondary-container font-bold text-[10px]">TRUE</span>
                </div>
              );
            })}
            {flagList.filter(f => activeState.flags[f]).length === 0 && flagList.length > 0 && (
               <div className="text-[10px] text-zinc-600 italic px-2">No active flags at current state.</div>
            )}
          </div>
        </section>

        {/* History Stack */}
        <section>
          <h3 className="font-label text-[10px] text-zinc-500 uppercase tracking-widest mb-4">History Stack</h3>
          <div className="space-y-0">
            {[...historyStack].reverse().map((step, revIdx) => {
              const actualIdx = historyStack.length - 1 - revIdx;
              const isFirst = actualIdx === 0;
              const entity = scenes[step.nodeId] || choices[step.nodeId] || endings[step.nodeId];
              
              return (
                <div key={actualIdx} className={`relative pl-6 pb-6 border-l ${isFirst ? 'border-transparent' : 'border-zinc-800'}`}>
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-background"></div>
                  <div className="flex flex-col gap-1 -mt-0.5">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">Step {String(actualIdx).padStart(2, '0')}</span>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-zinc-300 flex-1 truncate">{entity ? entity.name || entity.text : step.nodeId}</span>
                      {actualIdx === historyStack.length - 1 && actualIdx !== 0 && (
                        <button onClick={handleUndo} className="text-[9px] font-bold text-primary uppercase hover:underline tracking-widest shrink-0">Undo</button>
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
