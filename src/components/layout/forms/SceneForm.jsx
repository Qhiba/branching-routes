import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { Trash2 } from 'lucide-react';
import FormFooter from './FormFooter';
import ConditionEditor from '../../shared/ConditionEditor';
import SearchableDropdown from '../../shared/SearchableDropdown';
import FlagsSetEditor from '../../shared/FlagsSetEditor';
import StatusSetEditor from '../../shared/StatusSetEditor';

export default function SceneForm({ entityId, onSave, onCancel }) {
  const { flags, statusPoints, paths, chapters, scenes, choices, endings, entryNode, sceneTypes, setEntryNode, addScene, updateScene, deleteScene } = useEditor();
  const isNew = !entityId;
  const existingScene = isNew ? null : scenes[entityId];

  const [draft, setDraft] = useState({ name: '', description: '', variants: [], path: null, chapter: null, requires: [], next: [], type: null, flags_set: [], status_set: [] });

  useEffect(() => {
    if (existingScene) {
      setDraft({
        name: existingScene.name || '',
        description: existingScene.description || '',
        variants: existingScene.variants || [],
        path: existingScene.path || null,
        chapter: existingScene.chapter || null,
        requires: existingScene.requires || [],
        next: existingScene.next || [],
        type: existingScene.type || null,
        flags_set: existingScene.flags_set || [],
        status_set: existingScene.status_set || []
      });
    } else {
      setDraft({ name: '', description: '', variants: [], path: null, chapter: null, requires: [], next: [], type: null, flags_set: [], status_set: [] });
    }
  }, [existingScene, entityId]);

  const routeOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const handleSave = () => {
    if (isNew) {
      const newId = addScene(draft.name, draft.description);
      updateScene(newId, draft);
    } else {
      updateScene(entityId, draft);
    }
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    const referencingScenes = Object.values(scenes).filter(s => s.next && s.next.some(r => r.target === entityId)).map(s => s.id);
    const referencingChoices = Object.values(choices).filter(c => c.options && c.options.some(opt => opt.next === entityId)).map(c => c.id);
    
    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      alert(`${entityId} is referenced as a next target in: ${[...referencingScenes, ...referencingChoices].join(', ')}. Remove those references first.`);
      return;
    }

    if (window.confirm("Delete this scene?")) {
      deleteScene(entityId);
      onCancel();
    }
  };

  const addRoute = () => {
    setDraft({
      ...draft,
      next: [...draft.next, { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, target: '', requires: [] }]
    });
  };

  const updateRoute = (idx, newRoute) => {
    const newNext = [...draft.next];
    newNext[idx] = newRoute;
    setDraft({ ...draft, next: newNext });
  };

  const removeRoute = (idx) => {
    const newNext = draft.next.filter((_, i) => i !== idx);
    setDraft({ ...draft, next: newNext });
  };

  const addVariant = () => {
    const newVariant = { _id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, requires: [], text: '' };
    setDraft({ ...draft, variants: [...(draft.variants || []), newVariant] });
  };

  const updateVariant = (idx, updates) => {
    const newVariants = [...(draft.variants || [])];
    newVariants[idx] = { ...newVariants[idx], ...updates };
    setDraft({ ...draft, variants: newVariants });
  };

  const removeVariant = (idx) => {
    const newVariants = (draft.variants || []).filter((_, i) => i !== idx);
    setDraft({ ...draft, variants: newVariants });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Scene Name' : 'Scene Name'}
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="scene_name"
            autoFocus
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Description
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors resize-y min-h-[80px]"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="Scene description..."
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Type
          </label>
          <SearchableDropdown
            options={sceneTypes.reduce((acc, t) => { acc[t] = { id: t, name: t }; return acc; }, {})}
            value={draft.type}
            onChange={(val) => setDraft({ ...draft, type: val })}
            placeholder="Select type..."
            nullable
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Flags Set
          </label>
          <FlagsSetEditor
            flagsSet={draft.flags_set || []}
            onChange={(newFlagsSet) => setDraft({ ...draft, flags_set: newFlagsSet })}
            availableFlags={Object.values(flags)}
          />
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Status Set
          </label>
          <StatusSetEditor
            statusSet={draft.status_set || []}
            onChange={(newStatusSet) => setDraft({ ...draft, status_set: newStatusSet })}
            availableStatus={Object.values(statusPoints)}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Text Variants
            </label>
            <button
              onClick={addVariant}
              style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
              title="Add a conditional text variant"
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
                    <button
                      onClick={() => removeVariant(idx)}
                      className="p-1 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]"
                      title="Remove variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <ConditionEditor
                      conditions={variant.requires || []}
                      onChange={(newReqs) => updateVariant(idx, { requires: newReqs })}
                    />
                  </div>

                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                    Variant text
                  </label>
                  <textarea
                    value={variant.text || ''}
                    onChange={(e) => updateVariant(idx, { text: e.target.value })}
                    className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors resize-y min-h-[70px]"
                    style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
                    placeholder="Additional text appended when conditions match..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* We no longer hide these complex fields when isNew */}
        <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Path</label>
                <select value={draft.path || ''} onChange={(e) => setDraft({ ...draft, path: e.target.value || null })}
                  className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                >
                  <option value="">No Path</option>
                  {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Chapter</label>
                <select value={draft.chapter || ''} onChange={(e) => setDraft({ ...draft, chapter: e.target.value || null })}
                  className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                >
                  <option value="">No Chapter</option>
                  {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Requires</label>
              <ConditionEditor
                conditions={draft.requires}
                onChange={(newReqs) => setDraft({ ...draft, requires: newReqs })}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
              <div className="flex items-center justify-between mb-3">
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next targets</label>
                <button
                  onClick={addRoute}
                  style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                >
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
                        <button
                          onClick={() => removeRoute(idx)}
                          className="p-1 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]"
                        >
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

            {!isNew && (
              <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
                 <button
                   onClick={() => setEntryNode(entityId)}
                   className="w-full px-2 py-1.5 rounded-md transition-colors"
                   style={{
                     fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                     background: entryNode === entityId ? 'rgba(0,209,255,0.08)' : 'transparent',
                     border: entryNode === entityId ? '1px solid rgba(0,209,255,0.2)' : '1px solid var(--color-border-ghost)',
                     color: entryNode === entityId ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                   }}
                 >
                   {entryNode === entityId ? '✓ Entry Node' : 'Set Entry Node'}
                 </button>
              </div>
            )}

            {!isNew && (
              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
                <div className="flex justify-between items-center">
                   <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
                   <button onClick={handleDelete} className="p-1.5 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]" title="Delete Scene">
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
