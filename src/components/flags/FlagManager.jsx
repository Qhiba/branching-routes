import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../context/EditorContext';
import { Trash2, Plus, Lock } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function FlagManager() {
  const { flags, addFlag, updateFlagName, deleteFlag } = useEditor();
  const { getFlagReferenceMap } = useEditorActions();
  const [flagRefMap, setFlagRefMap] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    setFlagRefMap(getFlagReferenceMap());
  }, [getFlagReferenceMap]);

  const [newFlagName, setNewFlagName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newFlagName.trim()) return;
    addFlag(newFlagName);
    setNewFlagName('');
  };

  const handleDelete = (id) => {
    const freshMap = getFlagReferenceMap();
    const refs = freshMap[id] || { choices: [], scenes: [] };
    const inUse = refs.choices.length > 0 || refs.scenes.length > 0;
    
    if (inUse) {
      if (!window.confirm(`Warning: This flag is currently used in ${refs.choices.length} choices and ${refs.scenes.length} scenes. Deleting it will irrevocably cascade and remove it from them. Are you absolutely sure?`)) {
        return;
      }
    } else {
       if (!window.confirm("Delete this flag?")) return;
    }
    
    deleteFlag(id);
    setFlagRefMap(getFlagReferenceMap());
  };

  const flagList = Object.values(flags)
    .sort((a, b) => parseInt(b.id.replace('F', ''), 10) - parseInt(a.id.replace('F', ''), 10))
    .filter(f => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return f.id.toLowerCase().includes(s) || f.name.toLowerCase().includes(s);
    });

  return (
    <div className="flex items-start relative h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="flex-1 w-full min-w-0 p-6 pb-24">
        {/* Module title */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Flag Manager
        </h2>

        {/* Toolbar */}
        <div className="flex gap-2 mb-6 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="flex-1 max-w-xs px-2.5 py-1.5 rounded-md focus:outline-none"
            style={{ background: 'var(--color-surface-card-low)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
          />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{flagList.length} flags</span>
          <form onSubmit={handleAdd} className="flex gap-2 ml-auto">
            <input
              type="text"
              value={newFlagName}
              onChange={(e) => setNewFlagName(e.target.value)}
              placeholder="new_flag_name"
              className="px-2.5 py-1.5 rounded-md focus:outline-none"
              style={{ background: 'var(--color-surface-card-low)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)', width: 200 }}
            />
            <button
              type="submit"
              disabled={!newFlagName.trim()}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: newFlagName.trim() ? 'pointer' : 'not-allowed', opacity: newFlagName.trim() ? 1 : 0.5 }}
            >
              New Flag
            </button>
          </form>
        </div>

        {/* Flag list */}
        <div className="space-y-2">
          {flagList.length === 0 && (
            <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {Object.keys(flags).length === 0 ? 'No flags created yet.' : 'No flags match your search.'}
            </div>
          )}
          {flagList.map(flag => {
            const refs = flagRefMap[flag.id] || { choices: [], scenes: [] };
            const inUseCount = refs.choices.length + refs.scenes.length;
            const isLocked = inUseCount > 0;
            
            return (
              <div
                key={flag.id}
                id={flag.id}
                className="scroll-mt-8 flex items-center gap-3 p-2.5 rounded-lg group"
                style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderRadius: 8 }}
              >
                {/* ID */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', minWidth: 36 }}>
                  {flag.id}
                </span>

                {/* Name */}
                <DebouncedInput 
                  type="text"
                  value={flag.name}
                  onChange={(val) => updateFlagName(flag.id, val)}
                  className="flex-1 bg-transparent focus:outline-none py-0.5"
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}
                  placeholder="flag_name"
                />

                {/* State badge */}
                <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(255,107,107,0.1)', color: 'var(--color-accent-error)' }}>
                  false
                </span>

                {/* Reference chips */}
                {isLocked && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', background: 'var(--color-surface-card-low)' }}>
                    used in: {[...refs.choices.map(c => c), ...refs.scenes.map(s => s)].slice(0, 3).join(', ')}{inUseCount > 3 ? '…' : ''}
                  </span>
                )}

                {/* Lock or Delete */}
                {isLocked ? (
                  <Lock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                ) : (
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    title="Delete flag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <QuickNav items={flagList} title="Flags" renderLabel={f => f.name || 'Unnamed'} />
    </div>
  );
}
