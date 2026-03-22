import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2 } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

let conditionIdCounter = 0;
const nextConditionId = () => `cond_${++conditionIdCounter}_${Math.random().toString(36).substr(2, 4)}`;

export default function ConditionEditor({ conditions = [], onChange }) {
  const { flags, statusPoints } = useEditor();
  const availableFlags = Object.values(flags || {});
  const availableStatus = Object.values(statusPoints || {});

  const addFlagCondition = () => {
    onChange([...conditions, { _id: nextConditionId(), flag: '', state: true }]);
  };
  
  const addStatusCondition = () => {
    onChange([...conditions, { _id: nextConditionId(), status: '', min: 0 }]);
  };

  const removeCondition = (idx) => {
    onChange(conditions.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx, newCondition) => {
    const next = [...conditions];
    next[idx] = newCondition;
    onChange(next);
  };

  // Ensure every condition has a stable _id for React keys
  const ensureId = (cond) => cond._id ? cond : { ...cond, _id: nextConditionId() };

  return (
     <div className="space-y-3">
        {conditions.length === 0 && (
           <div className="text-sm text-gray-400 italic">No conditions explicitly required. Component is inherently accessible here.</div>
        )}
        {conditions.map((rawCond, idx) => {
           const cond = ensureId(rawCond);
           // Persist _id if it was just assigned
           if (!rawCond._id && cond._id) {
             conditions[idx] = cond;
           }
           const isFlag = cond.flag !== undefined;
           
           if (isFlag) {
             return (
               <div key={cond._id} className="flex flex-wrap items-center gap-2 bg-indigo-50/50 p-2 border border-indigo-100 rounded-lg">
                 <SearchableDropdown
                   value={cond.flag || ''}
                   onChange={val => updateCondition(idx, { ...cond, flag: val })}
                   options={availableFlags}
                   placeholder="Select Flag..."
                   showFilters={true}
                   className="flex-1 min-w-[150px]"
                   buttonClass="border-indigo-200 focus:ring-indigo-400"
                 />
                 <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Must Be</span>
                 <select value={cond.state ? 'true' : 'false'} onChange={e => updateCondition(idx, { ...cond, state: e.target.value === 'true' })} className="w-24 bg-white border border-indigo-200 rounded px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 text-indigo-900">
                   <option value="true">True</option>
                   <option value="false">False</option>
                 </select>
                 <button onClick={() => removeCondition(idx)} className="text-indigo-300 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
               </div>
             )
           } else {
             // Status Condition
             return (
               <div key={cond._id} className="flex flex-wrap items-center gap-2 bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg">
                 <SearchableDropdown
                   value={cond.status || ''}
                   onChange={val => updateCondition(idx, { ...cond, status: val })}
                   options={availableStatus}
                   placeholder="Select Status..."
                   showFilters={false}
                   className="flex-1 min-w-[150px]"
                   buttonClass="border-emerald-200 focus:ring-emerald-400"
                 />
                 
                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Min</span>
                    <input type="number" placeholder="none" value={cond.min !== undefined ? cond.min : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { min, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, min: Number(e.target.value) });
                       }
                    }} className="w-14 bg-transparent text-sm focus:outline-none text-center font-mono font-bold text-gray-700" />
                 </div>
                 <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Max</span>
                    <input type="number" placeholder="none" value={cond.max !== undefined ? cond.max : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { max, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, max: Number(e.target.value) });
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
