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
      <div className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Play className="w-4 h-4 text-indigo-400" /> Simulator
        </h3>
        <button
          onClick={() => handleStart(entryNode)}
          disabled={!entryNode || (!scenes[entryNode] && !choices[entryNode])}
          className="w-full bg-indigo-600 text-white font-bold text-sm rounded-xl px-4 py-3 shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> Start from Entry Node
        </button>
        <div>
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1">Or custom start</span>
          <SearchableDropdown
            value={null}
            onChange={handleStart}
            options={[
              ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
              ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
            ]}
            placeholder="Select a node..."
            showFilters={true}
            className="w-full text-left"
            buttonClass="py-2 px-3 text-sm border-gray-200"
          />
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
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px] tracking-widest rounded uppercase">
            {isEnding ? 'Ending' : isScene ? 'Scene' : 'Choice'}
          </span>
          <span className="font-mono text-xs text-gray-400">{currentNodeId}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handleUndo} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Restart simulation?')) handleRevive(); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Revive">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Stop simulation?')) handleStop(); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Stop">
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Node Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isEnding ? (
            <div className="text-center py-6 space-y-3">
              <Award className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-lg font-extrabold text-gray-900">Ending Reached</h3>
              <p className="text-lg font-bold text-amber-700 capitalize">{endingObj.name.replace(/_/g, ' ')}</p>
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={handleRevive} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Again
                </button>
                <button onClick={handleStop} className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
          ) : isScene && nodeObj ? (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900">{nodeObj.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{nodeObj.description}</p>
              <button
                onClick={() => handleSceneContinue(nodeObj)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : nodeObj ? (
            <div className="space-y-2">
              <h3 className="text-base font-bold text-gray-900">{nodeObj.text}</h3>
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
                        className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-100 text-gray-800 text-sm font-medium transition-all group flex justify-between items-center"
                      >
                        <span>{opt.label}</span>
                        <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <div key={idx} className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm font-medium flex justify-between items-center cursor-not-allowed">
                        <span>{opt.label}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {isLooped ? 'Picked' : 'Locked'}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="text-red-500 text-sm">Node missing! ({currentNodeId})</div>
          )}
        </div>

        {/* Live Flags */}
        <div className="px-4 py-3 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-indigo-400" /> Flags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {flagList.length === 0 && <span className="text-[10px] text-gray-400 italic">None</span>}
            {flagList.map(fId => {
              const isActive = activeState.flags[fId];
              return (
                <span key={fId} className={`text-[10px] px-2 py-0.5 rounded border font-semibold transition-colors duration-300 ${isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`} title={flags[fId]?.name}>
                  {fId} {isActive && <CheckCircle2 className="w-3 h-3 inline text-indigo-500" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Live Status */}
        <div className="px-4 py-3 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Dumbbell className="w-3 h-3 text-emerald-400" /> Status
          </h4>
          <div className="space-y-1">
            {statusList.length === 0 && <span className="text-[10px] text-gray-400 italic">None</span>}
            {statusList.map(sp => (
              <div key={sp.id} className="flex items-center justify-between text-[11px]" title={sp.name}>
                <span className="text-gray-500 font-medium capitalize">{sp.name}</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{activeState.status[sp.id]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
