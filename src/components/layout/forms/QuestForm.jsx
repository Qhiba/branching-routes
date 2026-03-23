import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { Trash2 } from 'lucide-react';
import FormFooter from './FormFooter';

export default function QuestForm({ entityId, onSave, onCancel }) {
  const { quests, scenes, chapters, addQuest, updateQuestName, deleteQuest } = useEditor();
  const isNew = !entityId;
  const existingQuest = isNew ? null : quests[entityId];

  const [draft, setDraft] = useState({ name: '' });

  useEffect(() => {
    if (existingQuest) setDraft({ name: existingQuest.name || '' });
    else setDraft({ name: '' });
  }, [existingQuest, entityId]);

  const handleSave = () => {
    if (isNew) addQuest(draft.name);
    else updateQuestName(entityId, draft.name);
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    if (window.confirm("Delete this quest?")) {
      deleteQuest(entityId);
      onCancel();
    }
  };

  const links = useMemo(() => {
    if (isNew) return { scenes: [], chapter: null };
    const res = { scenes: [], chapter: null };
    Object.values(scenes).forEach(scene => {
      if (scene.quest && scene.quest === entityId) {
        res.scenes.push(scene.id);
        if (scene.chapter && !res.chapter) res.chapter = scene.chapter;
      }
    });
    return res;
  }, [scenes, entityId, isNew]);

  const chapterName = links.chapter && chapters[links.chapter] ? chapters[links.chapter].name : null;

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Quest Name' : 'Quest Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="e.g. rescue_merchant"
            autoFocus
          />
        </div>
        
        {!isNew && (
          <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <div className="flex justify-between items-center mb-3">
               <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
               <button onClick={handleDelete} className="p-1.5 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'} title="Delete Quest">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            {(links.scenes.length > 0 || chapterName) && (
              <div className="p-2.5 rounded bg-opacity-50" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                {links.scenes.length > 0 && <div className="mb-1">Scenes: {links.scenes.join(', ')}</div>}
                {chapterName && <div>Chapter: {links.chapter} ({chapterName})</div>}
              </div>
            )}
          </div>
        )}
      </div>
      <FormFooter onSave={handleSave} onCancel={onCancel} saveDisabled={!draft.name.trim()} />
    </div>
  );
}
