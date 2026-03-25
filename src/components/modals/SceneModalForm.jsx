import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Trash2 } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import SearchableDropdown from '../shared/SearchableDropdown';

export default function SceneModalForm({ entityId, initialPosition, onClose }) {
  const { paths, chapters, scenes, choices, endings, entryNode, setEntryNode, addScene, updateScene } = useEditor();
  const isNew = !entityId;
  const existingScene = isNew ? null : scenes[entityId];

  const [draft, setDraft] = useState({ name: '', description: '', variants: [], path: null, chapter: null, requires: [], next: [] });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (existingScene) {
      setDraft({
        name: existingScene.name || '',
        description: existingScene.description || '',
        variants: existingScene.variants || [],
        path: existingScene.path || null,
        chapter: existingScene.chapter || null,
        requires: existingScene.requires || [],
        next: existingScene.next || []
      });
    } else {
      setDraft({ name: '', description: '', variants: [], path: null, chapter: null, requires: [], next: [] });
    }
    setIsDirty(false);
  }, [existingScene, entityId]);

  const updateDraft = (updates) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const routeOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const handleSave = () => {
    if (isNew) {
      const newId = addScene(draft.name, draft.description, initialPosition);
      updateScene(newId, draft);
    } else {
      updateScene(entityId, draft);
    }
    onClose();
  };

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    onClose();
  };

  const addRoute = () => {
    updateDraft({
      next: [...draft.next, { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, target: '', requires: [] }]
    });
  };

  const updateRoute = (idx, newRoute) => {
    const newNext = [...draft.next];
    newNext[idx] = newRoute;
    updateDraft({ next: newNext });
  };

  const removeRoute = (idx) => {
    updateDraft({ next: draft.next.filter((_, i) => i !== idx) });
  };

  const addVariant = () => {
    const newVariant = { _id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, requires: [], text: '' };
    updateDraft({ variants: [...(draft.variants || []), newVariant] });
  };

  const updateVariant = (idx, updates) => {
    const newVariants = [...(draft.variants || [])];
    newVariants[idx] = { ...newVariants[idx], ...updates };
    updateDraft({ variants: newVariants });
  };

  const removeVariant = (idx) => {
    updateDraft({ variants: (draft.variants || []).filter((_, i) => i !== idx) });
  };

  const labelStyle = { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 };

  return (
    <>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            placeholder="scene_name"
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors resize-y min-h-[80px]"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
            placeholder="Scene description..."
            rows={4}
          />
        </div>

        {/* Text Variants */}
        <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Text Variants</label>
            <button
              onClick={addVariant}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
            >
              + Add variant
            </button>
          </div>
          {(draft.variants || []).length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              No text variants — base description displays as-is.
            </div>
          ) : (
            <div className="space-y-3">
              {(draft.variants || []).map((variant, idx) => (
                <div key={variant._id || idx} className="p-3 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>Variant {idx + 1}</span>
                    <button onClick={() => removeVariant(idx)} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <ConditionEditor
                      conditions={variant.requires || []}
                      onChange={(newReqs) => updateVariant(idx, { requires: newReqs })}
                    />
                  </div>
                  <label style={{ ...labelStyle }}>Variant text</label>
                  <textarea
                    value={variant.text || ''}
                    onChange={(e) => updateVariant(idx, { text: e.target.value })}
                    className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors resize-y min-h-[70px]"
                    style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
                    placeholder="Variant text..."
                  />
                </div>
              ))}
            </div>
          )}
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

        {/* Requires */}
        <div>
          <label style={labelStyle}>Requires</label>
          <ConditionEditor
            conditions={draft.requires}
            onChange={(newReqs) => updateDraft({ requires: newReqs })}
          />
        </div>

        {/* Next Targets */}
        <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Next Targets</label>
            <button onClick={addRoute} style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}>
              + Add target
            </button>
          </div>

          {(!draft.next || draft.next.length === 0) ? (
            <div className="py-2 px-3 text-center rounded-md" style={{ fontSize: 11, color: 'var(--color-accent-error)', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
              ⚠ No targets — scene may get stuck
            </div>
          ) : (
            <div className="space-y-2">
              {draft.next.map((route, idx) => {
                const routeKey = route._id || `draft-route-${idx}`;
                const isFallback = idx === draft.next.length - 1 && (!route.requires || route.requires.length === 0);
                return (
                  <div key={routeKey} className="p-3 rounded-md relative group" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                    <div className="flex items-start gap-3">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{idx + 1}.</span>
                      <div className="flex-1 space-y-2 min-w-0">
                        {isFallback ? (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Fallback · always matches</span>
                        ) : (
                          <ConditionEditor
                            conditions={route.requires || []}
                            onChange={(newReqs) => updateRoute(idx, { ...route, requires: newReqs })}
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>→</span>
                          <SearchableDropdown
                            value={route.target || null}
                            onChange={(val) => updateRoute(idx, { ...route, target: val || '' })}
                            options={routeOptions.filter(o => o.id !== entityId)}
                            placeholder="Select target..."
                            showFilters={true}
                            className="flex-1 min-w-0"
                          />
                        </div>
                      </div>
                      <button onClick={() => removeRoute(idx)} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {draft.next.length > 0 && draft.next[draft.next.length - 1].requires && draft.next[draft.next.length - 1].requires.length > 0 && (
                <div className="py-2 px-3 mt-2 rounded-md" style={{ fontSize: 11, color: 'var(--color-accent-error)', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
                  ⚠ No fallback — scene may get stuck
                </div>
              )}
            </div>
          )}
        </div>

        {/* Set Entry Node button (edit mode only) */}
        {!isNew && (
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <button
              onClick={() => setEntryNode(entityId)}
              className="w-full px-2 py-1.5 rounded-md transition-colors"
              style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                background: entryNode === entityId ? 'rgba(0,209,255,0.08)' : 'transparent',
                border: entryNode === entityId ? '1px solid rgba(0,209,255,0.2)' : '1px solid var(--color-border-ghost)',
                color: entryNode === entityId ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer'
              }}
            >
              {entryNode === entityId ? '✓ Entry Node' : 'Set Entry Node'}
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-2 p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
        <button
          onClick={handleCancel}
          className="w-1/4 py-2 rounded-md transition-colors"
          style={{ background: 'transparent', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-surface-card)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!draft.name.trim()}
          className="w-3/4 py-2 rounded-md signature-gradient transition-opacity"
          style={{
            border: 'none', color: '#0a1a1f', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            opacity: !draft.name.trim() ? 0.3 : 1,
            cursor: !draft.name.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {isNew ? 'Create Scene' : 'Save changes'}
        </button>
      </div>
    </>
  );
}
