import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../context/EditorContext';
import { Plus, Trash2, Dumbbell, AlertCircle } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function StatusManager() {
  const { statusPoints, addStatusPoint, updateStatusPoint, deleteStatusPoint } = useEditor();
  const { getStatusReferenceMap } = useEditorActions();
  const [statusRefMap, setStatusRefMap] = useState({});

  useEffect(() => {
    setStatusRefMap(getStatusReferenceMap());
  }, [getStatusReferenceMap]);

  const [newName, setNewName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addStatusPoint(newName, 0); // default value 0
    setNewName('');
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
        <Dumbbell className="w-8 h-8 text-secondary-container" />
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Status Point Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Global numeric variables that evaluate quantities instead of booleans.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface-container-low p-5 rounded-2xl border border-white/5 shadow-inner flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New status name (e.g. strength)"
          className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-container text-on-surface placeholder-zinc-600 shadow-inner"
        />
        <button type="submit" disabled={!newName.trim()} className="text-[10px] font-bold tracking-widest uppercase text-secondary-container bg-secondary-container/10 border border-secondary-container/20 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-secondary-container/20 hover:border-secondary-container/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Create Status
        </button>
      </form>

      <div className="space-y-4">
        {Object.values(statusPoints).map(sp => {
          const refs = statusRefMap[sp.id] || { choices: [], scenes: [] };
          const inUseCount = refs.choices.length + refs.scenes.length;
          
          return (
          <div key={sp.id} id={sp.id} className="scroll-mt-8 bg-surface-container-high border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg group hover:border-secondary-container/30 hover:shadow-2xl hover:ring-1 hover:ring-secondary-container/20 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <span className="font-mono text-[10px] font-bold text-secondary-container bg-secondary-container/10 border border-secondary-container/20 px-3 py-1.5 rounded uppercase tracking-widest">{sp.id}</span>
              <DebouncedInput
                type="text"
                value={sp.name}
                onChange={(val) => updateStatusPoint(sp.id, { name: val })}
                className="font-headline font-bold text-lg text-on-surface bg-transparent border-b-2 border-transparent hover:border-white/10 focus:border-secondary-container focus:outline-none py-1 transition-colors"
              />
              {inUseCount > 0 && (
                <span className="text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-widest text-error bg-error/10 px-2.5 py-1 rounded border border-error/20" title={`Used in ${refs.choices.length} choices and ${refs.scenes.length} scenes`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                   in use ({inUseCount})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Min</label>
                 <input 
                   type="number"
                   value={sp.minValue ?? 0}
                   onChange={(e) => updateStatusPoint(sp.id, { minValue: parseInt(e.target.value, 10) || 0 })}
                   className="w-20 px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-center font-mono font-bold text-on-surface focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container shadow-inner"
                 />
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Start</label>
                 <input 
                   type="number"
                   value={sp.value}
                   onChange={(e) => updateStatusPoint(sp.id, { value: parseInt(e.target.value, 10) || 0 })}
                   className="w-20 px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-center font-mono font-bold text-on-surface focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container shadow-inner"
                 />
               </div>
               
              <button 
                onClick={() => {
                  const freshMap = getStatusReferenceMap();
                  const currentRefs = freshMap[sp.id] || { choices: [], scenes: [] };
                  const inUse = currentRefs.choices.length > 0 || currentRefs.scenes.length > 0;
                  
                  if (inUse) {
                    if (!window.confirm(`Warning: This status point is used in ${currentRefs.choices.length} choices and ${currentRefs.scenes.length} scenes. Deleting it will irrevocably cascade and remove it from them. Are you absolutely sure?`)) {
                      return;
                    }
                  } else {
                    if (!window.confirm(`Delete status ${sp.id}?`)) return;
                  }
                  
                  deleteStatusPoint(sp.id);
                  setStatusRefMap(getStatusReferenceMap());
                }}
                className="p-2 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Status"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )})}
        {Object.keys(statusPoints).length === 0 && (
          <div className="text-center py-12 bg-surface-container-low border border-white/10 border-dashed rounded-2xl flex flex-col items-center shadow-inner">
             <AlertCircle className="w-8 h-8 text-zinc-500 mb-3" />
             <p className="text-sm text-zinc-400 mt-1">No status points exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(statusPoints)} title="Status Points" renderLabel={s => s.name || 'Unnamed Status'} />
    </div>
  );
}
