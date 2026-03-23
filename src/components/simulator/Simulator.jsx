import React, { useMemo } from 'react';
import { Play, RotateCcw, Undo2, ArrowRight, Flag, LayoutGrid, CheckCircle2, XCircle, Dumbbell, Award } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';
import useSimulator from '../../hooks/useSimulator';

export default function Simulator() {
  const sim = useSimulator();
  const {
    flags, choices, scenes, endings, statusPoints, entryNode,
    currentNodeId, historyStack, activeState, isRunning,
    passesRequires, handleStart, handleOptionSelect,
    handleSceneContinue, handleUndo, handleStop, handleRevive,
  } = sim;

  const handleStopConfirm = () => {
    if (window.confirm("Stop simulation and return to Start Screen?")) handleStop();
  };

  const handleReviveConfirm = () => {
    if (window.confirm(`Restart simulation from ${sim.startingNodeId}?`)) handleRevive();
  };

  const renderStartScreen = () => {
    const hasData = Object.keys(scenes).length > 0 || Object.keys(choices).length > 0;
    
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full w-full">
        <div className="bg-surface-container p-12 rounded-3xl shadow-2xl border border-white/5 max-w-lg w-full text-center">
          <Play className="w-20 h-20 text-secondary-container/50 mx-auto mb-8" />
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-3">Simulation Sandbox</h2>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            Test your logic tree cleanly. Flags are completely isolated from your editor and derived naturally through your choices.
          </p>
          
          <div className="flex flex-col gap-4 w-full mt-4">
            <button
               onClick={() => handleStart(entryNode)}
               disabled={!entryNode || (!scenes[entryNode] && !choices[entryNode])}
               className="w-full bg-secondary-container text-on-secondary-container font-bold tracking-wide rounded-xl px-5 py-4 shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-secondary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
               <Play className="w-5 h-5" /> Start from Entry Node
            </button>
            <div className="relative">
               <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-2">Or custom start</span>
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
                  buttonClass="py-3 px-4 border-white/5 bg-black/40 text-on-surface"
               />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveNode = () => {
    if (!currentNodeId) return null;

    // Check if the current node is an ending
    const endingObj = endings[currentNodeId];
    if (endingObj) {
      return (
        <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-tertiary-container/10 border border-tertiary-container/20 shadow-sm text-tertiary-container font-bold text-[10px] tracking-widest rounded-md uppercase">
                 Ending
               </span>
               <span className="font-mono text-zinc-500 font-medium">{currentNodeId}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 shadow-sm bg-surface-container" title="Undo Last Push">
                <Undo2 className="w-4 h-4" /> Undo
              </button>
              <button onClick={handleReviveConfirm} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 shadow-sm bg-surface-container" title="Restart from starting node">
                <RotateCcw className="w-4 h-4" /> Revive
              </button>
              <button onClick={handleStopConfirm} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-error hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20 shadow-sm bg-surface-container" title="Stop Simulation">
                <XCircle className="w-4 h-4" /> Stop
              </button>
            </div>
          </div>

          {/* Ending Card */}
          <div className="bg-surface-container rounded-3xl shadow-2xl border border-tertiary-container/30 p-10 overflow-hidden relative text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-tertiary-container to-tertiary-container"></div>
            <Award className="w-16 h-16 text-tertiary-container mx-auto mb-6" />
            <h1 className="text-3xl font-headline font-black text-on-surface mb-3">Ending Reached</h1>
            <p className="text-lg text-zinc-400 mb-2">You've arrived at:</p>
            <p className="text-2xl font-bold text-tertiary-container capitalize">{endingObj.name.replace(/_/g, ' ')}</p>
            <div className="mt-10 flex justify-center gap-4">
              <button 
                onClick={handleReviveConfirm}
                className="bg-primary text-on-primary shadow-lg shadow-primary/20 px-8 py-3.5 rounded-xl font-semibold tracking-wide flex items-center gap-3 transition-all hover:brightness-110"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button 
                onClick={handleStopConfirm}
                className="bg-surface-container-high hover:bg-surface-container-highest shadow-sm border border-white/5 text-on-surface px-8 py-3.5 rounded-xl font-semibold tracking-wide flex items-center gap-3 transition-all"
              >
                <XCircle className="w-5 h-5" /> Stop
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    const nodeObj = scenes[currentNodeId] || choices[currentNodeId];
    if (!nodeObj) return <div className="p-10 text-red-500">Node missing! ({currentNodeId})</div>;

    const isScene = !!scenes[currentNodeId];

    return (
      <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
        
        {/* Controls */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
             <span className={`px-3 py-1 border shadow-sm font-bold text-[10px] tracking-widest rounded-md uppercase ${isScene ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-container border-white/10 text-on-surface'}`}>
               {isScene ? 'Scene' : 'Choice'}
             </span>
             <span className="font-mono text-zinc-500 font-medium">{currentNodeId}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 shadow-sm bg-surface-container" title="Undo Last Push">
              <Undo2 className="w-4 h-4" /> Undo
            </button>
            <button onClick={handleReviveConfirm} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 shadow-sm bg-surface-container" title="Restart from starting node">
              <RotateCcw className="w-4 h-4" /> Revive
            </button>
            <button onClick={handleStopConfirm} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-error hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20 shadow-sm bg-surface-container" title="Stop Simulation">
              <XCircle className="w-4 h-4" /> Stop
            </button>
          </div>
        </div>

        {/* Payload */}
        {isScene ? (
          <div className="bg-surface-container rounded-3xl shadow-2xl border border-white/5 p-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary"></div>
            <h1 className="text-3xl font-headline font-black text-on-surface mb-6">{nodeObj.name}</h1>
            <p className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap">{nodeObj.description}</p>
            
            <div className="mt-12 flex justify-end">
              <button 
                onClick={() => handleSceneContinue(nodeObj)}
                className="bg-primary hover:brightness-110 shadow-lg shadow-primary/20 text-on-primary px-8 py-3.5 rounded-xl font-semibold tracking-wide flex items-center gap-3 transition-all hover:pr-6"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
            <div className="bg-surface-container-high border-b border-white/5 p-8">
              <h1 className="text-2xl font-headline font-bold text-on-surface leading-snug">
                 {nodeObj.text}
              </h1>
            </div>
            
            <div className="p-4 space-y-3 bg-surface-container-low">
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
                  const passesReq = passesRequires(opt.requires);
                  const isLooped = loopedOptions.has(idx);
                  const isValid = passesReq && !isLooped;
                  
                  return isValid ? (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(nodeObj, idx)}
                      className="w-full text-left p-5 rounded-2xl bg-surface-container-high border border-white/5 shadow-sm hover:border-sidebar-accent hover:ring-1 hover:ring-sidebar-accent hover:shadow-lg text-on-surface font-medium transition-all group flex justify-between items-center"
                    >
                      <span className="text-lg text-on-surface font-headline">{opt.label}</span>
                      <ArrowRight className="w-5 h-5 text-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <div key={idx} className="w-full text-left p-5 rounded-2xl border border-white/5 bg-black/20 text-zinc-500 font-medium flex justify-between items-center cursor-not-allowed">
                       <span className="text-lg font-headline">{opt.label}</span>
                       <span className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 opacity-70">
                         <XCircle className="w-4 h-4" /> 
                         {isLooped ? "Already Picked" : "Locked"}
                       </span>
                    </div>
                  )
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSidebar = () => {
    const sceneList = Object.values(scenes).sort((a,b) => parseInt(a.id.replace('S','')) - parseInt(b.id.replace('S','')));
    const flagList = Object.keys(flags).sort();
    const statusList = Object.values(statusPoints || {}).sort((a,b) => a.id.localeCompare(b.id));

    return (
      <div className="bg-surface-container-high h-full border-l border-white/5 flex flex-col w-80 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.5)] z-10">
        
        {/* Active Flags Summary */}
        <div className="p-6 border-b border-white/5">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Flag className="w-4 h-4 text-primary" /> Live Flags
          </h3>
          <div className="flex flex-wrap gap-2">
            {flagList.length === 0 ? <span className="text-sm text-zinc-500 italic">No flags tracking.</span> : null}
            {flagList.map(fId => {
               const isActive = activeState.flags[fId];
               return (
                 <span key={fId} className={`text-xs px-2.5 py-1 rounded border font-semibold flex items-center gap-1.5 transition-colors duration-300 ${isActive ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' : 'bg-surface-container text-zinc-500 border-white/5'}`} title={flags[fId].name}>
                    {fId} {isActive ? <CheckCircle2 className="w-3 h-3 text-primary" /> : null}
                 </span>
               )
            })}
          </div>

          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 mt-6">
             <Dumbbell className="w-4 h-4 text-sidebar-accent" /> Live Status Points
          </h3>
          <div className="flex flex-col gap-2">
            {statusList.length === 0 ? <span className="text-sm text-zinc-500 italic">No status tracking.</span> : null}
            {statusList.map(sp => {
               const currentVal = activeState.status[sp.id];
               return (
                 <div key={sp.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0" title={sp.name}>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{sp.id}: <span className="font-bold text-on-surface capitalize">{sp.name}</span></span>
                    <span className="font-mono text-xs font-bold text-sidebar-accent bg-sidebar-accent/10 px-3 py-1 rounded shadow-inner border border-sidebar-accent/20">{currentVal}</span>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Global Scene View */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <LayoutGrid className="w-4 h-4 text-emerald-500" /> Global Scenes Map
          </h3>
          <div className="space-y-3">
            {sceneList.length === 0 ? <span className="text-sm text-zinc-500 italic">No scenes created.</span> : null}
            {sceneList.map(scene => {
              const passes = passesRequires(scene.requires);
              return (
                <div key={scene.id} className={`p-4 rounded-xl border transition-all duration-500 ${passes ? 'border-sidebar-accent/30 bg-sidebar-accent/10 shadow-sm ring-1 ring-sidebar-accent/10' : 'border-white/5 bg-surface-container opacity-60'}`}>
                   <div className="flex items-center justify-between mb-1">
                      <div className={`font-mono text-[10px] uppercase font-bold tracking-widest ${passes ? 'text-sidebar-accent' : 'text-zinc-500'}`}>{scene.id}</div>
                      {passes && <div className="w-2 h-2 rounded-full bg-sidebar-accent animate-pulse"></div>}
                   </div>
                   <div className={`truncate text-sm font-headline font-medium ${passes ? 'text-on-surface' : 'text-zinc-500'}`}>{scene.name}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full bg-background rounded-l-2xl overflow-hidden shadow-2xl border-l border-white/5 border-t">
      <div className="flex-1 overflow-y-auto relative bg-background">
         {!currentNodeId ? renderStartScreen() : renderActiveNode()}
      </div>
      {renderSidebar()}
    </div>
  );
}
