import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Play, RotateCcw, Undo2, ArrowRight, Flag, LayoutGrid, CheckCircle2, XCircle, Dumbbell } from 'lucide-react';

export default function Simulator() {
  const { flags, choices, scenes, statusPoints } = useEditor();

  const [historyStack, setHistoryStack] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);

  // Dynamically evaluate flags and status mathematically based purely on chronological choice history
  const activeState = useMemo(() => {
    const dFlags = {};
    const dStatus = {};
    Object.keys(flags).forEach(f => dFlags[f] = false);
    Object.values(statusPoints || {}).forEach(sp => dStatus[sp.id] = Number(sp.value));
    
    historyStack.forEach(step => {
      (step.flagsPushed || []).forEach(fId => {
        dFlags[fId] = true;
      });
      (step.statusPushed || []).forEach(sm => {
        dStatus[sm.status] = (dStatus[sm.status] || 0) + sm.amount;
      });
    });
    return { flags: dFlags, status: dStatus };
  }, [flags, statusPoints, historyStack]);

  const passesRequires = (requiresArray = []) => {
    if (!requiresArray || requiresArray.length === 0) return true;
    return requiresArray.every(req => {
      if (req.flag) return activeState.flags[req.flag] === req.state;
      if (req.status) {
        const val = activeState.status[req.status];
        if (req.min !== undefined && val < req.min) return false;
        if (req.max !== undefined && val > req.max) return false;
        return true;
      }
      return true;
    });
  };

  const traverseNext = (targetId, flagsToPush = [], statusToPush = []) => {
    if (!targetId) {
      alert("Staying on current node (Loop).");
      setHistoryStack(prev => [...prev, { nodeId: currentNodeId, type: 'loop', flagsPushed: flagsToPush, statusPushed: statusToPush }]);
      return;
    }

    const type = scenes[targetId] ? 'scene' : choices[targetId] ? 'choice' : 'unknown';
    if (type === 'unknown') {
      alert(`Target ID not found: ${targetId}`);
      return;
    }
    
    setCurrentNodeId(targetId);
    setHistoryStack(prev => [...prev, { nodeId: targetId, type, flagsPushed: flagsToPush, statusPushed: statusToPush }]);
  };

  const handleStart = (nodeId) => {
    if (!nodeId) return;
    const type = scenes[nodeId] ? 'scene' : 'choice';
    setCurrentNodeId(nodeId);
    setHistoryStack([{ nodeId, type, flagsPushed: [] }]);
  };

  const handleOptionSelect = (choiceObj, optIndex) => {
    const opt = choiceObj.options[optIndex];
    if (!passesRequires(opt.requires)) return; // double check UI lock

    if (opt.next) {
      traverseNext(opt.next, opt.flags_set || [], opt.status_set || []);
    } else {
       // Loop back into self, but push flags
       const fakeNullTarget = null;
       traverseNext(fakeNullTarget, opt.flags_set || [], opt.status_set || []);
    }
  };

  const handleSceneContinue = (sceneObj) => {
    const nextArr = sceneObj.next || [];
    if (nextArr.length === 0) {
      alert("End of the line. No routes defined for this Scene.");
      return; 
    }

    const validRoute = nextArr.find(route => passesRequires(route.requires));

    if (validRoute) {
      traverseNext(validRoute.target, []);
    } else {
      alert("Dead End: No available routes pass the current flag conditions.");
    }
  };

  const handleUndo = () => {
    if (historyStack.length <= 1) {
      handleReset();
      return;
    }
    const newStack = historyStack.slice(0, -1);
    const lastNode = [...newStack].reverse().find(step => step.type !== 'loop');
    setHistoryStack(newStack);
    setCurrentNodeId(lastNode ? lastNode.nodeId : null);
  };

  const handleReset = () => {
    if (window.confirm("Reset entire simulation?")) {
      setHistoryStack([]);
      setCurrentNodeId(null);
    }
  };

  const renderStartScreen = () => {
    const hasData = Object.keys(scenes).length > 0 || Object.keys(choices).length > 0;
    
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full w-full">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-200 max-w-lg w-full text-center">
          <Play className="w-20 h-20 text-indigo-100 mx-auto mb-8" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Simulation Sandbox</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Test your logic tree cleanly. Flags are completely isolated from your editor and derived naturally through your choices.
          </p>
          
          <select 
            onChange={(e) => handleStart(e.target.value)}
            defaultValue=""
            disabled={!hasData}
            className="w-full bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all hover:bg-indigo-100 disabled:opacity-50"
          >
            <option value="" disabled>{hasData ? "Select Starting Node..." : "No data available"}</option>
            <optgroup label="Scenes">
              {Object.values(scenes).map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
            </optgroup>
            <optgroup label="Choices">
              {Object.values(choices).map(c => <option key={c.id} value={c.id}>{c.id} - {c.text.substring(0,30)}</option>)}
            </optgroup>
          </select>
        </div>
      </div>
    );
  };

  const renderActiveNode = () => {
    if (!currentNodeId) return null;
    
    const nodeObj = scenes[currentNodeId] || choices[currentNodeId];
    if (!nodeObj) return <div className="p-10 text-red-500">Node missing! ({currentNodeId})</div>;

    const isScene = !!scenes[currentNodeId];

    return (
      <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
        
        {/* Controls */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-white border border-indigo-100 shadow-sm text-indigo-700 font-bold text-xs tracking-widest rounded-md uppercase">
               {isScene ? 'Scene' : 'Choice'}
             </span>
             <span className="font-mono text-gray-400 font-medium">{currentNodeId}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 shadow-sm bg-white" title="Undo Last Push">
              <Undo2 className="w-4 h-4" /> Undo
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm bg-white" title="Reset Simulation">
              <RotateCcw className="w-4 h-4" /> Revive
            </button>
          </div>
        </div>

        {/* Payload */}
        {isScene ? (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{nodeObj.name}</h1>
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{nodeObj.description}</p>
            
            <div className="mt-12 flex justify-end">
              <button 
                onClick={() => handleSceneContinue(nodeObj)}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 text-white px-8 py-3.5 rounded-xl font-semibold tracking-wide flex items-center gap-3 transition-all hover:pr-6"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 p-8">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                 {nodeObj.text}
              </h1>
            </div>
            
            <div className="p-4 space-y-3 bg-gray-50/50">
              {(nodeObj.options || []).map((opt, idx) => {
                const isValid = passesRequires(opt.requires);
                
                return isValid ? (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(nodeObj, idx)}
                    className="w-full text-left p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 hover:shadow-md text-gray-800 font-medium transition-all group flex justify-between items-center"
                  >
                    <span className="text-lg text-indigo-950">{opt.label}</span>
                    <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <div key={idx} className="w-full text-left p-5 rounded-2xl border border-gray-200 bg-gray-100/50 text-gray-400 font-medium flex justify-between items-center cursor-not-allowed">
                     <span className="text-lg">{opt.label}</span>
                     <span className="text-xs uppercase tracking-widest font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Locked</span>
                  </div>
                )
              })}
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
      <div className="bg-white h-full border-l border-gray-200 flex flex-col w-80 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
        
        {/* Active Flags Summary */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Flag className="w-4 h-4 text-indigo-400" /> Live Flags
          </h3>
          <div className="flex flex-wrap gap-2">
            {flagList.length === 0 ? <span className="text-sm text-gray-400 italic">No flags tracking.</span> : null}
            {flagList.map(fId => {
               const isActive = activeState.flags[fId];
               return (
                 <span key={fId} className={`text-xs px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 transition-colors duration-300 ${isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200'}`} title={flags[fId].name}>
                    {fId} {isActive ? <CheckCircle2 className="w-3 h-3 text-indigo-500" /> : null}
                 </span>
               )
            })}
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-6">
             <Dumbbell className="w-4 h-4 text-emerald-400" /> Live Status Points
          </h3>
          <div className="flex flex-col gap-2">
            {statusList.length === 0 ? <span className="text-sm text-gray-400 italic">No status tracking.</span> : null}
            {statusList.map(sp => {
               const currentVal = activeState.status[sp.id];
               return (
                 <div key={sp.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0" title={sp.name}>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{sp.id}: <span className="font-bold text-gray-700 capitalize">{sp.name}</span></span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-emerald-200 text-sm">{currentVal}</span>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Global Scene View */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <LayoutGrid className="w-4 h-4 text-emerald-500" /> Global Scenes Map
          </h3>
          <div className="space-y-3">
            {sceneList.length === 0 ? <span className="text-sm text-gray-400 italic">No scenes created.</span> : null}
            {sceneList.map(scene => {
              const passes = passesRequires(scene.requires);
              return (
                <div key={scene.id} className={`p-4 rounded-xl border transition-all duration-500 ${passes ? 'border-emerald-200 bg-emerald-50 shadow-sm' : 'border-gray-100 bg-white opacity-60'}`}>
                   <div className="flex items-center justify-between mb-1">
                      <div className={`font-mono text-xs font-bold ${passes ? 'text-emerald-700' : 'text-gray-400'}`}>{scene.id}</div>
                      {passes && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                   </div>
                   <div className={`truncate text-sm font-medium ${passes ? 'text-emerald-950' : 'text-gray-500'}`}>{scene.name}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full bg-gray-50/50 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <div className="flex-1 overflow-y-auto relative">
         {!currentNodeId ? renderStartScreen() : renderActiveNode()}
      </div>
      {renderSidebar()}
    </div>
  );
}
