import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../context/EditorContext';
import { Plus, Trash2, Lock } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function StatusManager() {
  const { statusPoints, addStatusPoint, updateStatusPoint, deleteStatusPoint } = useEditor();
  const { getStatusReferenceMap } = useEditorActions();
  const [statusRefMap, setStatusRefMap] = useState({});
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setStatusRefMap(getStatusReferenceMap());
  }, [getStatusReferenceMap]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addStatusPoint(newName, 0);
    setNewName('');
  };

  return (
    <div className="flex items-start relative h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="flex-1 w-full min-w-0 p-6 pb-24">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Status Point Manager
        </h2>

        {/* Toolbar */}
        <div className="flex gap-2 mb-6 items-center">
          <form onSubmit={handleCreate} className="flex gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New status name (e.g. strength)"
              className="flex-1 max-w-xs px-2.5 py-1.5 rounded-md focus:outline-none"
              style={{ background: 'var(--color-surface-card-low)', color: 'var(--color-text-primary)', fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5 }}
            >
              New Status
            </button>
          </form>
        </div>

        {/* Status list */}
        <div className="space-y-2">
          {Object.keys(statusPoints).length === 0 && (
            <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              No status points exist yet.
            </div>
          )}
          {Object.values(statusPoints).map(sp => {
            const refs = statusRefMap[sp.id] || { choices: [], scenes: [] };
            const inUseCount = refs.choices.length + refs.scenes.length;
            const isLocked = inUseCount > 0;
            
            return (
            <div
              key={sp.id}
              id={sp.id}
              className="scroll-mt-8 flex items-center gap-3 p-2.5 rounded-lg group"
              style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderRadius: 8 }}
            >
              {/* ID */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', minWidth: 44 }}>
                {sp.id}
              </span>

              {/* Name */}
              <DebouncedInput
                type="text"
                value={sp.name}
                onChange={(val) => updateStatusPoint(sp.id, { name: val })}
                className="flex-1 bg-transparent focus:outline-none py-0.5"
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}
              />

              {/* Starting value */}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>starting value:</span>
                <input 
                  type="number"
                  value={sp.value}
                  onChange={(e) => updateStatusPoint(sp.id, { value: parseInt(e.target.value, 10) || 0 })}
                  className="w-14 px-2 py-1 rounded-md text-center focus:outline-none"
                  style={{ background: 'var(--color-surface-card-low)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)' }}
                />
              </div>

              {/* "global" label */}
              <span style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>
                global
              </span>

              {/* Reference chips */}
              {isLocked && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', background: 'var(--color-surface-card-low)' }}>
                  used in: {[...refs.choices, ...refs.scenes].slice(0, 3).join(', ')}{inUseCount > 3 ? '…' : ''}
                </span>
              )}

              {/* Lock or Delete */}
              {isLocked ? (
                <Lock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete status ${sp.id}?`)) {
                      deleteStatusPoint(sp.id);
                      setStatusRefMap(getStatusReferenceMap());
                    }
                  }}
                  className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  title="Delete Status"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );})}
        </div>
      </div>
      <QuickNav items={Object.values(statusPoints)} title="Status Points" renderLabel={s => s.name || 'Unnamed Status'} />
    </div>
  );
}
