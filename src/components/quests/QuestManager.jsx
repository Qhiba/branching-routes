import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2 } from 'lucide-react';
import DebouncedInput from '../shared/DebouncedInput';

export default function QuestManager() {
  const { quests, scenes, chapters, addQuest, updateQuestName, deleteQuest } = useEditor();
  const [newName, setNewName] = useState('');

  // §3.3 — Derive scene and chapter links for each quest
  const questLinks = useMemo(() => {
    const links = {};
    Object.keys(quests).forEach(qId => { links[qId] = { scenes: [], chapter: null }; });
    Object.values(scenes).forEach(scene => {
      if (scene.quest && links[scene.quest]) {
        links[scene.quest].scenes.push(scene.id);
        if (scene.chapter && !links[scene.quest].chapter) {
          links[scene.quest].chapter = scene.chapter;
        }
      }
    });
    return links;
  }, [quests, scenes]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addQuest(newName);
    setNewName('');
  };

  return (
    <div className="h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="p-6 pb-24 max-w-2xl">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Quest Manager
        </h2>

        {/* Toolbar */}
        <div className="flex gap-2 mb-6 items-center">
          <form onSubmit={handleCreate} className="flex gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New quest name (e.g. rescue_the_merchant)"
              className="flex-1 px-2.5 py-1.5 rounded-md"
              style={{ fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5 }}
            >
              New Quest
            </button>
          </form>
        </div>

        {/* Quest list */}
        <div className="space-y-2">
          {Object.keys(quests).length === 0 && (
            <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              No quests exist yet.
            </div>
          )}
          {Object.values(quests).map(quest => {
            const links = questLinks[quest.id] || { scenes: [], chapter: null };
            const chapterName = links.chapter && chapters[links.chapter] ? chapters[links.chapter].name : null;

            return (
              <div
                key={quest.id}
                id={quest.id}
                className="rounded-lg overflow-hidden group"
                style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderRadius: 8 }}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 p-2.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', minWidth: 36 }}>
                    {quest.id}
                  </span>
                  <DebouncedInput
                    type="text"
                    value={quest.name}
                    onChange={(val) => updateQuestName(quest.id, val)}
                    className="flex-1 bg-transparent focus:outline-none py-0.5"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}
                  />
                  <button 
                    onClick={() => {
                      if(window.confirm(`Delete quest ${quest.id}?`)) deleteQuest(quest.id);
                    }}
                    className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    title="Delete Quest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* §3.3 Info row */}
                {(links.scenes.length > 0 || chapterName) && (
                  <div className="px-2.5 pb-2" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                    {links.scenes.length > 0 && (
                      <span>Scenes: {links.scenes.join(', ')}</span>
                    )}
                    {links.scenes.length > 0 && chapterName && <span> · </span>}
                    {chapterName && (
                      <span>Chapter: {links.chapter}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
