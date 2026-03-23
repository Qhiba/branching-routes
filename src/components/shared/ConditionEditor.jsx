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
     <div className="space-y-3 pb-2">
        {conditions.length === 0 && (
           <div className="text-sm font-mono text-zinc-600 italic">No conditions explicitly required. Flow path is unblocked.</div>
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
               <div key={cond._id} className="flex flex-wrap items-center gap-3 bg-primary/5 p-3 border border-primary/20 rounded-xl relative shadow-inner">
                 <SearchableDropdown
                   value={cond.flag || ''}
                   onChange={val => updateCondition(idx, { ...cond, flag: val })}
                   options={availableFlags}
                   placeholder="Select Flag..."
                   showFilters={true}
                   className="flex-1 min-w-[200px]"
                   buttonClass="border-primary/20 bg-black/40 text-primary-fixed focus:ring-primary/50"
                 />
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Must Be</span>
                 <select value={cond.state ? 'true' : 'false'} onChange={e => updateCondition(idx, { ...cond, state: e.target.value === 'true' })} className="w-28 bg-black/40 border border-primary/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary text-on-surface cursor-pointer">
                   <option value="true">TRUE</option>
                   <option value="false">FALSE</option>
                 </select>
                 <button onClick={() => removeCondition(idx)} className="text-zinc-500 hover:text-error hover:bg-error/10 p-2 rounded border border-transparent hover:border-error/20 transition-all"><Trash2 className="w-4 h-4" /></button>
               </div>
             )
           } else {
             // Status Condition
             return (
               <div key={cond._id} className="flex flex-wrap items-center gap-3 bg-secondary-container/5 p-3 border border-secondary-container/20 rounded-xl relative shadow-inner">
                 <SearchableDropdown
                   value={cond.status || ''}
                   onChange={val => updateCondition(idx, { ...cond, status: val })}
                   options={availableStatus}
                   placeholder="Select Status..."
                   showFilters={false}
                   className="flex-1 min-w-[200px]"
                   buttonClass="border-secondary-container/20 bg-black/40 text-secondary-container focus:ring-secondary-container/50"
                 />
                 
                 <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 transition-colors focus-within:border-secondary-container focus-within:ring-1 focus-within:ring-secondary-container group">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">Min</span>
                    <input type="number" placeholder="n/a" value={cond.min !== undefined ? cond.min : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { min, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, min: Number(e.target.value) });
                       }
                    }} className="w-16 bg-transparent text-sm focus:outline-none text-right font-mono font-bold text-on-surface placeholder:font-normal placeholder:text-zinc-600" />
                 </div>
                 <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 transition-colors focus-within:border-secondary-container focus-within:ring-1 focus-within:ring-secondary-container group">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">Max</span>
                    <input type="number" placeholder="n/a" value={cond.max !== undefined ? cond.max : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { max, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, max: Number(e.target.value) });
                       }
                    }} className="w-16 bg-transparent text-sm focus:outline-none text-right font-mono font-bold text-on-surface placeholder:font-normal placeholder:text-zinc-600" />
                 </div>
                 
                 <button onClick={() => removeCondition(idx)} className="text-zinc-500 hover:text-error hover:bg-error/10 p-2 rounded border border-transparent hover:border-error/20 transition-all"><Trash2 className="w-4 h-4" /></button>
               </div>
             )
           }
        })}

        <div className="flex gap-3 pt-4 border-t border-white/10 w-full mt-2">
           <button onClick={addFlagCondition} disabled={availableFlags.length === 0} className="flex-1 justify-center text-[10px] text-primary hover:text-primary-fixed bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Logical Target
           </button>
           <button onClick={addStatusCondition} disabled={availableStatus.length === 0} className="flex-1 justify-center text-[10px] text-secondary-container hover:text-secondary-fixed bg-secondary-container/10 border border-secondary-container/20 hover:border-secondary-container/50 hover:bg-secondary-container/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Threshold Target
           </button>
        </div>
     </div>
  );
}
