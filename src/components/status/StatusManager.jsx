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
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
        <div className="flex items-center gap-3 mb-8">
        <Dumbbell className="w-8 h-8 text-emerald-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Status Point Manager</h2>
          <p className="text-sm text-gray-500">Global numeric variables that evaluate quantities instead of booleans.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New status name (e.g. strength)"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="submit" disabled={!newName.trim()} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium tracking-wide flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <Plus className="w-4 h-4" /> Create Status
        </button>
      </form>

      <div className="space-y-3">
        {Object.values(statusPoints).map(sp => {
          const refs = statusRefMap[sp.id] || { choices: [], scenes: [] };
          const inUseCount = refs.choices.length + refs.scenes.length;
          
          return (
          <div key={sp.id} id={sp.id} className="scroll-mt-8 bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-4 flex-1">
              <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">{sp.id}</span>
              <DebouncedInput
                type="text"
                value={sp.name}
                onChange={(val) => updateStatusPoint(sp.id, { name: val })}
                className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5"
              />
              {inUseCount > 0 && (
                <span className="text-xs flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200" title={`Used in ${refs.choices.length} choices and ${refs.scenes.length} scenes`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                   in use ({inUseCount})
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Value</label>
                 <input 
                   type="number"
                   value={sp.minValue ?? 0}
                   onChange={(e) => updateStatusPoint(sp.id, { minValue: parseInt(e.target.value, 10) || 0 })}
                   className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono font-bold text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                 />
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Value</label>
                 <input 
                   type="number"
                   value={sp.value}
                   onChange={(e) => updateStatusPoint(sp.id, { value: parseInt(e.target.value, 10) || 0 })}
                   className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-mono font-bold text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )})}
        {Object.keys(statusPoints).length === 0 && (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 border-dashed rounded-2xl flex flex-col items-center">
             <AlertCircle className="w-8 h-8 text-gray-400 mb-3" />
             <p className="text-gray-500 font-medium tracking-wide">No status points exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(statusPoints)} title="Status Points" renderLabel={s => s.name || 'Unnamed Status'} />
    </div>
  );
}
