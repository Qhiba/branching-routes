import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, X } from 'lucide-react';
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

  const ensureId = (cond) => cond._id ? cond : { ...cond, _id: nextConditionId() };

  return (
     <div className="space-y-2">
        {conditions.length === 0 && (
           <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
             No conditions — flow path is unblocked.
           </div>
        )}
        {conditions.map((rawCond, idx) => {
           const cond = ensureId(rawCond);
           if (!rawCond._id && cond._id) {
             conditions[idx] = cond;
           }
           const isFlag = cond.flag !== undefined;
           
           if (isFlag) {
             return (
               <div key={cond._id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                 <SearchableDropdown
                   value={cond.flag || ''}
                   onChange={val => updateCondition(idx, { ...cond, flag: val })}
                   options={availableFlags}
                   placeholder="Select Flag..."
                   showFilters={true}
                   className="flex-1 min-w-[120px]"
                 />
                 <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>=</span>
                 <select
                   value={cond.state ? 'true' : 'false'}
                   onChange={e => updateCondition(idx, { ...cond, state: e.target.value === 'true' })}
                   className="rounded-md px-2 py-1.5 cursor-pointer focus:outline-none"
                   style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: cond.state ? 'var(--color-accent-success)' : 'var(--color-accent-error)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500 }}
                 >
                   <option value="true">true</option>
                   <option value="false">false</option>
                 </select>
                 <button onClick={() => removeCondition(idx)} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                 >
                   <X className="w-3.5 h-3.5" />
                 </button>
               </div>
             )
           } else {
             return (
               <div key={cond._id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                 <SearchableDropdown
                   value={cond.status || ''}
                   onChange={val => updateCondition(idx, { ...cond, status: val })}
                   options={availableStatus}
                   placeholder="Select Status..."
                   showFilters={false}
                   className="flex-1 min-w-[120px]"
                 />
                 
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>min</span>
                    <input type="number" placeholder="—" value={cond.min !== undefined ? cond.min : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { min, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, min: Number(e.target.value) });
                       }
                    }} className="w-12 bg-transparent focus:outline-none text-right"
                       style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
                    />
                 </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>max</span>
                    <input type="number" placeholder="—" value={cond.max !== undefined ? cond.max : ''} onChange={e => {
                       if (e.target.value === '') {
                          const { max, _id, ...rest } = cond;
                          updateCondition(idx, { _id, ...rest });
                       } else {
                          updateCondition(idx, { ...cond, max: Number(e.target.value) });
                       }
                    }} className="w-12 bg-transparent focus:outline-none text-right"
                       style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
                    />
                 </div>
                 
                 <button onClick={() => removeCondition(idx)} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                 >
                   <X className="w-3.5 h-3.5" />
                 </button>
               </div>
             )
           }
        })}

        <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
           <button onClick={addFlagCondition} disabled={availableFlags.length === 0}
             className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
             style={{ background: 'none', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }}
           >
              <Plus className="w-3 h-3" /> Flag condition
           </button>
           <button onClick={addStatusCondition} disabled={availableStatus.length === 0}
             className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
             style={{ background: 'none', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }}
           >
              <Plus className="w-3 h-3" /> Status condition
           </button>
        </div>
     </div>
  );
}
