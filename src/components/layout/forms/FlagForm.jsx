import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../../context/EditorContext';
import { Trash2, Lock, ToggleLeft, ToggleRight } from 'lucide-react';
import FormFooter from './FormFooter';
import SearchableDropdown from '../../shared/SearchableDropdown';

export default function FlagForm({ entityId, onSave, onCancel }) {
  const { flags, paths, chapters, addFlag, updateFlagName, deleteFlag, toggleFlagState } = useEditor();
  const { updateFlag, getFlagReferenceMap } = useEditorActions();
  const isNew = !entityId;
  const existingFlag = isNew ? null : flags[entityId];

  const [draft, setDraft] = useState({ name: '', path: null, chapter: null });

  useEffect(() => {
    if (existingFlag) {
      setDraft({ name: existingFlag.name || '', path: existingFlag.path || null, chapter: existingFlag.chapter || null });
    } else {
      setDraft({ name: '', path: null, chapter: null });
    }
  }, [existingFlag, entityId]);

  const handleSave = () => {
    if (isNew) {
      const newId = addFlag(draft.name);
      if (draft.path || draft.chapter) {
        updateFlag(newId, { path: draft.path, chapter: draft.chapter });
      }
    } else {
      updateFlagName(entityId, draft.name);
      updateFlag(entityId, { path: draft.path, chapter: draft.chapter });
    }
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    const freshMap = getFlagReferenceMap();
    const refs = freshMap[entityId] || { choices: [], scenes: [] };
    const inUse = refs.choices.length > 0 || refs.scenes.length > 0;
    
    if (inUse) {
      if (!window.confirm(`Warning: This flag is currently used in ${refs.choices.length} choices and ${refs.scenes.length} scenes. Deleting it will cascade. Are you sure?`)) return;
    } else {
       if (!window.confirm("Delete this flag?")) return;
    }
    
    deleteFlag(entityId);
    onCancel(); // Exit form after deletion
  };

  const isLocked = () => {
    if (isNew) return false;
    const freshMap = getFlagReferenceMap();
    const refs = freshMap[entityId] || { choices: [], scenes: [] };
    return refs.choices.length > 0 || refs.scenes.length > 0;
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Flag Name' : 'Flag Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="e.g. has_sword"
            autoFocus
          />
        </div>

         <div className="grid grid-cols-2 gap-3">
           <div>
             <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Path</label>
             <SearchableDropdown
               value={draft.path}
               onChange={(val) => setDraft({ ...draft, path: val })}
               placeholder="Select path..."
               options={Object.values(paths).map(p => ({ id: p.id, name: p.name }))}
             />
           </div>
           <div>
             <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Chapter</label>
             <SearchableDropdown
               value={draft.chapter}
               onChange={(val) => setDraft({ ...draft, chapter: val })}
               placeholder="Select chapter..."
               options={Object.values(chapters).map(c => ({ id: c.id, name: c.name }))}
             />
           </div>
         </div>
        
        {!isNew && (
          <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
            
            <div className="flex justify-between items-center mb-4">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Global State Testing</span>
              <button 
                type="button"
                onClick={() => toggleFlagState(entityId)}
                className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
                style={{ background: existingFlag?.state ? 'rgba(171,249,0,0.1)' : 'rgba(255,107,107,0.1)', color: existingFlag?.state ? 'var(--color-accent-success)' : 'var(--color-accent-error)' }}
                title="Toggle this true/false globally for testing in the Simulator"
              >
                 {existingFlag?.state ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                 <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{existingFlag?.state ? 'TRUE' : 'FALSE'}</span>
              </button>
            </div>

            <div className="flex justify-between items-center">
               <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
               {isLocked() ? (
                 <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-opacity-10 cursor-not-allowed text-gray-400" title="In use">
                    <Lock className="w-3.5 h-3.5" />
                 </span>
               ) : (
                 <button 
                   onClick={handleDelete} 
                   className="p-1.5 rounded transition-colors"
                   style={{ color: 'var(--color-text-muted)' }}
                   onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                   title="Delete Flag"
                 >
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
