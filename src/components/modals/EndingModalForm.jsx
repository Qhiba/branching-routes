import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Diamond } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';

export default function EndingModalForm({ entityId, initialPosition, onClose }) {
  const { endings, paths, chapters, addEnding, updateEnding } = useEditor();
  const isNew = !entityId;
  const existingEnding = isNew ? null : endings[entityId];

  const [draft, setDraft] = useState({ name: '', requires: [], path: null, chapter: null });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (existingEnding) {
      setDraft({ name: existingEnding.name || '', requires: existingEnding.requires || [], path: existingEnding.path || null, chapter: existingEnding.chapter || null });
    } else {
      setDraft({ name: '', requires: [], path: null, chapter: null });
    }
    setIsDirty(false);
  }, [existingEnding, entityId]);

  const updateDraft = (updates) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (isNew) {
      const newId = addEnding(draft.name, initialPosition);
      updateEnding(newId, draft);
    } else {
      updateEnding(entityId, draft);
    }
    onClose();
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    onClose();
  };

  const labelStyle = { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text" value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            placeholder="e.g. Good Ending" autoFocus
          />
        </div>

        {/* Path & Chapter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Path</label>
            <select value={draft.path || ''} onChange={(e) => updateDraft({ path: e.target.value || null })}
              className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
              style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
            >
              <option value="">No Path</option>
              {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Chapter</label>
            <select value={draft.chapter || ''} onChange={(e) => updateDraft({ chapter: e.target.value || null })}
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
            onChange={(newReqs) => updateDraft({ requires: newReqs })}
          />
        </div>

        <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--color-border-ghost)', marginTop: 8 }}>
          <Diamond className="w-3 h-3" style={{ color: 'var(--color-accent-terminal)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Terminal — no Next field</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
        <button onClick={handleCancel} className="w-1/4 py-2 rounded-md transition-colors"
          style={{ background: 'transparent', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-surface-card)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          Cancel
        </button>
        <button onClick={handleSave} disabled={!draft.name.trim()}
          className="w-3/4 py-2 rounded-md signature-gradient transition-opacity"
          style={{ border: 'none', color: '#0a1a1f', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: !draft.name.trim() ? 0.3 : 1, cursor: !draft.name.trim() ? 'not-allowed' : 'pointer' }}
        >
          {isNew ? 'Create Ending' : 'Save changes'}
        </button>
      </div>
    </>
  );
}
