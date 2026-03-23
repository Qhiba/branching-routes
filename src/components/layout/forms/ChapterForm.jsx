import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { Trash2 } from 'lucide-react';
import FormFooter from './FormFooter';

export default function ChapterForm({ entityId, onSave, onCancel }) {
  const { chapters, addChapter, updateChapterName, deleteChapter } = useEditor();
  const isNew = !entityId;
  const existingChapter = isNew ? null : chapters[entityId];

  const [draft, setDraft] = useState({ name: '' });

  useEffect(() => {
    if (existingChapter) setDraft({ name: existingChapter.name || '' });
    else setDraft({ name: '' });
  }, [existingChapter, entityId]);

  const handleSave = () => {
    if (isNew) addChapter(draft.name);
    else updateChapterName(entityId, draft.name);
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    if (window.confirm("Delete this chapter?")) {
      deleteChapter(entityId);
      onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Chapter Name' : 'Chapter Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="e.g. prologue"
            autoFocus
          />
        </div>
        
        {!isNew && (
          <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <div className="flex justify-between items-center">
               <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
               <button onClick={handleDelete} className="p-1.5 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'} title="Delete Chapter">
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
