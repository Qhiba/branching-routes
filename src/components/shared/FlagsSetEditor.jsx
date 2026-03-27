import React from 'react';
import { Trash2 } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

export default function FlagsSetEditor({ flagsSet, onChange, availableFlags }) {
  const addFlagMod = (flagId) => {
    if (!flagsSet.includes(flagId)) onChange([...flagsSet, flagId]);
  };
  const updateFlagMod = (idx, flagId) => {
    const next = [...flagsSet];
    next[idx] = flagId;
    onChange(next);
  };
  const removeFlagMod = (idx) => onChange(flagsSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {availableFlags.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No flags available.</div>
      ) : (
        <>
          {flagsSet.map((flagId, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
               <SearchableDropdown
                 value={flagId}
                 onChange={(val) => updateFlagMod(idx, val)}
                 options={availableFlags}
                 placeholder="Select Flag..."
                 showFilters={true}
                 className="flex-1 min-w-[140px]"
               />
               <button onClick={() => removeFlagMod(idx)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          ))}
          <button onClick={() => addFlagMod(availableFlags[0]?.id || '')} disabled={availableFlags.length===0}
            style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
          >
            + Set flag
          </button>
        </>
      )}
    </div>
  );
}
