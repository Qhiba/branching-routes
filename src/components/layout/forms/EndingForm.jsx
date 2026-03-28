import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { Trash2, Diamond } from 'lucide-react';
import FormFooter from './FormFooter';
import ConditionEditor from '../../shared/ConditionEditor';

export default function EndingForm({ entityId, onSave, onCancel }) {
  const { endings, paths, chapters, addEnding, updateEnding, deleteEnding, scenes, choices } = useEditor();
  const isNew = !entityId;
  const existingEnding = isNew ? null : endings[entityId];

  const [draft, setDraft] = useState({ name: '', requires: { operator: 'and', conditions: [] }, path: null, chapter: null });

  useEffect(() => {
    if (existingEnding) {
      setDraft({ name: existingEnding.name || '', requires: existingEnding.requires || [], path: existingEnding.path || null, chapter: existingEnding.chapter || null });
    } else {
      setDraft({ name: '', requires: { operator: 'and', conditions: [] }, path: null, chapter: null });
    }
  }, [existingEnding, entityId]);

  const handleSave = () => {
    if (isNew) {
      const newId = addEnding(draft.name);
      updateEnding(newId, draft);
    } else {
      updateEnding(entityId, draft);
    }
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    const referencingScenes = Object.values(scenes).filter(s => s.next && s.next.some(r => r.target === entityId)).map(s => s.id);
    const referencingChoices = Object.values(choices).filter(c => c.options && c.options.some(opt => opt.next === entityId)).map(c => c.id);

    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      alert(`${entityId} is referenced as a next target in: ${[...referencingScenes, ...referencingChoices].join(', ')}. Remove those first.`);
      return;
    }

    if(window.confirm(`Delete ending ${entityId}?`)) {
      deleteEnding(entityId);
      onCancel();
    }
  };

  const labelStyle = { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={labelStyle}>
            {isNew ? 'New Ending Name' : 'Ending Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="e.g. Good Ending"
            autoFocus
          />
        </div>

        {/* Path & Chapter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Path</label>
            <select value={draft.path || ''} onChange={(e) => setDraft({ ...draft, path: e.target.value || null })}
              className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
              style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
            >
              <option value="">No Path</option>
              {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Chapter</label>
            <select value={draft.chapter || ''} onChange={(e) => setDraft({ ...draft, chapter: e.target.value || null })}
              className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
              style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
            >
              <option value="">No Chapter</option>
              {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
          <label style={labelStyle}>
            Requires <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>· first passing ending wins</span>
          </label>
          <ConditionEditor 
            conditions={draft.requires} 
            onChange={(newReqs) => setDraft({ ...draft, requires: newReqs })} 
          />
        </div>
        
        <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--color-border-ghost)', marginTop: 8 }}>
          <Diamond className="w-3 h-3" style={{ color: 'var(--color-accent-terminal)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Terminal — no Next field</span>
        </div>

        {!isNew && (
            <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
              <div className="flex justify-between items-center">
                 <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
                 <button onClick={handleDelete} className="p-1.5 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'} title="Delete Ending">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
        )}
      </div>
      <FormFooter onSave={handleSave} onCancel={onCancel} saveDisabled={!draft.name.trim()} />
    </div>
  );
}
