import React from 'react';
import { Trash2 } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

export default function StatusSetEditor({ statusSet, onChange, availableStatus }) {
  const addStatusMod = (statusId) => onChange([...statusSet, { status: statusId, amount: 0 }]);
  const updateStatusMod = (idx, updates) => {
    const next = [...statusSet];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
  };
  const removeStatusMod = (idx) => onChange(statusSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {availableStatus.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No statuses available.</div>
      ) : (
        <>
          {statusSet.map((mod, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
               <SearchableDropdown
                 value={mod.status}
                 onChange={val => updateStatusMod(idx, { status: val })}
                 options={availableStatus}
                 placeholder="Select Status..."
                 showFilters={false}
                 className="flex-1 min-w-0"
               />
               <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                 <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>±</span>
                 <input type="number" value={mod.amount} onChange={e => updateStatusMod(idx, { amount: parseInt(e.target.value,10)||0 })}
                   className="w-16 bg-transparent focus:outline-none text-center"
                   style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
                 />
               </div>
               <button onClick={() => removeStatusMod(idx)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          ))}
          <button onClick={() => addStatusMod(availableStatus[0]?.id || '')} disabled={availableStatus.length===0}
            style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
          >
            + Modify status
          </button>
        </>
      )}
    </div>
  );
}
