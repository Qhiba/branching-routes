import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../../context/EditorContext';
import { Trash2, Lock } from 'lucide-react';
import FormFooter from './FormFooter';

export default function StatusForm({ entityId, onSave, onCancel }) {
  const { statusPoints, addStatusPoint, updateStatusPoint, deleteStatusPoint } = useEditor();
  const { getStatusReferenceMap } = useEditorActions();
  const isNew = !entityId;
  const existingStatus = isNew ? null : statusPoints[entityId];

  const [draft, setDraft] = useState({ name: '', value: 0, minValue: -999999 });

  useEffect(() => {
    if (existingStatus) {
      setDraft({ 
        name: existingStatus.name || '', 
        value: existingStatus.value || 0,
        minValue: existingStatus.minValue !== undefined ? existingStatus.minValue : -999999
      });
    } else {
      setDraft({ name: '', value: 0, minValue: -999999 });
    }
  }, [existingStatus, entityId]);

  const handleSave = () => {
    if (isNew) {
      addStatusPoint(draft.name, draft.value, draft.minValue);
    } else {
      updateStatusPoint(entityId, { name: draft.name, value: draft.value, minValue: draft.minValue });
    }
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    const freshMap = getStatusReferenceMap();
    const refs = freshMap[entityId] || { choices: [], scenes: [] };
    const inUse = refs.choices.length > 0 || refs.scenes.length > 0;
    
    if (inUse) {
      if (!window.confirm(`Warning: This status is used in ${refs.choices.length} choices and ${refs.scenes.length} scenes. Deleting it will cascade. Are you sure?`)) return;
    } else {
       if (!window.confirm("Delete this status point?")) return;
    }
    
    deleteStatusPoint(entityId);
    onCancel();
  };

  const isLocked = () => {
    if (isNew) return false;
    const freshMap = getStatusReferenceMap();
    const refs = freshMap[entityId] || { choices: [], scenes: [] };
    return refs.choices.length > 0 || refs.scenes.length > 0;
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Status Name' : 'Status Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="e.g. strength"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
               Starting Value
             </label>
             <input
               type="number"
               value={draft.value}
               onChange={(e) => setDraft({ ...draft, value: parseInt(e.target.value, 10) || 0 })}
               className="w-16 text-center px-3 py-2 rounded-md focus:outline-none transition-colors"
               style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
               onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
               onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
             />
          </div>
          <div>
             <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
               Minimum Value
             </label>
             <input
               type="number"
               value={draft.minValue}
               onChange={(e) => setDraft({ ...draft, minValue: parseInt(e.target.value, 10) || -999999 })}
               className="w-16 text-center px-3 py-2 rounded-md focus:outline-none transition-colors"
               style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
               onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
               onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
             />
          </div>
        </div>
        
        {!isNew && (
          <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <div className="flex justify-between items-center">
               <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
               {isLocked() ? (
                 <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-opacity-10 cursor-not-allowed text-gray-400" title="In use">
                    <Lock className="w-3.5 h-3.5" />
                 </span>
               ) : (
                 <button onClick={handleDelete} className="p-1.5 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'} title="Delete Status">
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
            </div>
          </div>
        )}
      </div>
      
      <FormFooter onSave={handleSave} onCancel={onCancel} saveDisabled={!draft.name.trim()} />
    </div>
  );
}
