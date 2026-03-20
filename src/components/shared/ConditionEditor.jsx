import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2 } from 'lucide-react';

export default function ConditionEditor({ conditions = [], onChange }) {
  const { flags, statusPoints } = useEditor();
  const availableFlags = Object.values(flags || {});
  const availableStatus = Object.values(statusPoints || {});

  const addFlagCondition = () => {
    onChange([...conditions, { flag: '', state: true }]);
  };
  
  const addStatusCondition = () => {
    onChange([...conditions, { status: '', min: 0 }]); // max gets removed until inputted
  };

  const removeCondition = (idx) => {
    onChange(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, updates) => {
    const next = [...conditions];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
  };

  return (
     <div className="space-y-3">
        {conditions.length === 0 && (
           <div className="text-sm text-gray-400 italic">No conditions explicitly required. Component is inherently accessible here.</div>
        )}
        {conditions.map((cond, idx) => {
           const isFlag = cond.flag !== undefined;
           
           if (isFlag) {
             return (
               <div key={idx} className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-2 border border-indigo-100 rounded-lg">
                 <select value={cond.flag || ''} onChange={e => updateCondition(idx, { flag: e.target.value })} className="flex-1 min-w-[130px] bg-white border border-indigo-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                   <option value="" disabled>Select Flag...</option>
                   {availableFlags.map(f => <option key={f.id} value={f.id}>{f.id} - {f.name}</option>)}
                 </select>
                 <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Must Be</span>
                 <select value={cond.state ? 'true' : 'false'} onChange={e => updateCondition(idx, { state: e.target.value === 'true' })} className="w-24 bg-white border border-indigo-200 rounded px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 text-indigo-900">
                   <option value="true">True</option>
                   <option value="false">False</option>
                 </select>
                 <button onClick={() => removeCondition(idx)} className="text-indigo-300 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
               </div>
             )
           } else {
             // Status Condition
             return (
               <div key={idx} className="flex flex-wrap items-center gap-2 bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg">
                 <select value={cond.status || ''} onChange={e => updateCondition(idx, { status: e.target.value })} className="flex-1 min-w-[130px] bg-white border border-emerald-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
                   <option value="" disabled>Select Status...</option>
                   {availableStatus.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                 </select>
                 
                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Min</span>
                    <input type="number" placeholder="none" value={cond.min !== undefined ? cond.min : ''} onChange={e => {
                       if (e.target.value === '') {
                          const n = {...cond}; delete n.min; updateCondition(idx, n);
                       } else {
                          updateCondition(idx, { min: Number(e.target.value) });
                       }
                    }} className="w-14 bg-transparent text-sm focus:outline-none text-center font-mono font-bold text-gray-700" />
                 </div>
                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Max</span>
                    <input type="number" placeholder="none" value={cond.max !== undefined ? cond.max : ''} onChange={e => {
                       if (e.target.value === '') {
                          const n = {...cond}; delete n.max; updateCondition(idx, n);
                       } else {
                          updateCondition(idx, { max: Number(e.target.value) });
                       }
                    }} className="w-14 bg-transparent text-sm focus:outline-none text-center font-mono font-bold text-gray-700" />
                 </div>
                 
                 <button onClick={() => removeCondition(idx)} className="text-emerald-300 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
               </div>
             )
           }
        })}

        <div className="flex gap-2 pt-2 border-t border-gray-100 w-full mt-3">
           <button onClick={addFlagCondition} disabled={availableFlags.length === 0} className="flex-1 justify-center text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold tracking-wide transition-colors disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> ADD FLAG RULE
           </button>
           <button onClick={addStatusCondition} disabled={availableStatus.length === 0} className="flex-1 justify-center text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg flex items-center gap-1.5 font-bold tracking-wide transition-colors disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> ADD STATUS RULE
           </button>
        </div>
     </div>
  );
}
