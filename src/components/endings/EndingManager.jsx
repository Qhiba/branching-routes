import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical, Diamond } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import ConditionEditor from '../shared/ConditionEditor';
import DebouncedInput from '../shared/DebouncedInput';

export default function EndingManager() {
  const { endings, addEnding, updateEnding, deleteEnding } = useEditor();
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const handleExpandAll = () => setExpanded(new Set(Object.keys(endings)));
  const handleCollapseAll = () => setExpanded(new Set());
  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addEnding(newName);
    setNewName('');
  };

  return (
    <div className="flex items-start relative h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="flex-1 w-full min-w-0 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Ending Manager
          </h2>
          <div className="flex items-center gap-2">
            {Object.keys(endings).length > 0 && (
              <>
                <button onClick={handleCollapseAll} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Collapse All"><FoldVertical className="w-4 h-4" /></button>
                <button onClick={handleExpandAll} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Expand All"><UnfoldVertical className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>

        {/* Create form */}
        <div className="flex gap-2 mb-6 items-center">
          <form onSubmit={handleCreate} className="flex gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New ending name (e.g. good_ending)"
              className="flex-1 max-w-xs px-2.5 py-1.5 rounded-md focus:outline-none"
              style={{ background: 'var(--color-surface-card-low)', color: 'var(--color-text-primary)', fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5 }}
            >
              New Ending
            </button>
          </form>
        </div>

        {/* Ending list */}
        <div className="space-y-2">
          {Object.keys(endings).length === 0 && (
            <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No endings exist yet.</div>
          )}
          {Object.values(endings).map(ending => {
            const isExpanded = expanded.has(ending.id);
            const condCount = (ending.requires || []).length;

            return (
            <div key={ending.id} id={ending.id} className="scroll-mt-4 rounded-lg overflow-hidden" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderLeft: '3px solid var(--color-accent-terminal)' }}>
              {/* Header */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                style={{ background: isExpanded ? 'rgba(200,119,10,0.04)' : 'transparent' }}
                onClick={() => toggleExpand(ending.id)}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{ending.id}</span>
                <DebouncedInput
                  type="text"
                  value={ending.name}
                  onChange={(val) => updateEnding(ending.id, { name: val })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent focus:outline-none py-0.5"
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}
                  placeholder="ending_name"
                />
                <Diamond className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-accent-terminal)' }} />
                {!isExpanded && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {condCount} conditions
                  </span>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm(`Delete ending ${ending.id}?`)) deleteEnding(ending.id);
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expanded */}
              {isExpanded && (
              <div className="px-4 py-4 space-y-4" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Requires <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>· first ending whose conditions pass wins</span></label>
                  <ConditionEditor 
                    conditions={ending.requires || []} 
                    onChange={(newReqs) => updateEnding(ending.id, { requires: newReqs })} 
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--color-border-ghost)', marginTop: 8 }}>
                  <Diamond className="w-3 h-3" style={{ color: 'var(--color-accent-terminal)' }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Terminal — no Next field</span>
                </div>
              </div>
              )}
            </div>
          );})}
        </div>
      </div>
      <QuickNav items={Object.values(endings)} title="Endings" renderLabel={e => e.name || 'unnamed'} />
    </div>
  );
}
