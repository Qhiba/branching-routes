import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2 } from 'lucide-react';
import DebouncedInput from '../shared/DebouncedInput';

export default function ChapterManager() {
  const { chapters, addChapter, updateChapterName, deleteChapter } = useEditor();
  const [newName, setNewName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addChapter(newName);
    setNewName('');
  };

  return (
    <div className="h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="p-6 pb-24 max-w-2xl">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Chapter Manager
        </h2>

        {/* Toolbar */}
        <div className="flex gap-2 mb-6 items-center">
          <form onSubmit={handleCreate} className="flex gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New chapter name (e.g. prologue)"
              className="flex-1 px-2.5 py-1.5 rounded-md focus:outline-none"
              style={{ background: 'var(--color-surface-card-low)', color: 'var(--color-text-primary)', fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5 }}
            >
              New Chapter
            </button>
          </form>
        </div>

        {/* Chapter list */}
        <div className="space-y-2">
          {Object.keys(chapters).length === 0 && (
            <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              No chapters exist yet.
            </div>
          )}
          {Object.values(chapters).map(chap => (
            <div
              key={chap.id}
              id={chap.id}
              className="flex items-center gap-3 p-2.5 rounded-lg group"
              style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderRadius: 8 }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', minWidth: 36 }}>
                {chap.id}
              </span>
              <DebouncedInput
                type="text"
                value={chap.name}
                onChange={(val) => updateChapterName(chap.id, val)}
                className="flex-1 bg-transparent focus:outline-none py-0.5"
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}
              />
              <button 
                onClick={() => {
                  if(window.confirm(`Delete chapter ${chap.id}?`)) deleteChapter(chap.id);
                }}
                className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                title="Delete Chapter"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
