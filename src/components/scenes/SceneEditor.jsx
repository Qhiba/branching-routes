import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical, Lock } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';
import SearchableDropdown from '../shared/SearchableDropdown';
import DebouncedInput from '../shared/DebouncedInput';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function SceneEditor() {
  const { flags, statusPoints, paths, chapters, scenes, choices, endings, entryNode, setEntryNode, addScene, updateScene, deleteScene } = useEditor();
  const [expandedScenes, setExpandedScenes] = useState(new Set());

  const toggleScene = (id) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedScenes(new Set(Object.keys(scenes)));
  const collapseAll = () => setExpandedScenes(new Set());

  const routeOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  return (
    <div className="flex items-start relative h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="flex-1 w-full min-w-0 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Scene Editor
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={collapseAll} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} title="Collapse All">
               <FoldVertical className="w-4 h-4" />
            </button>
            <button onClick={expandAll} className="p-1 rounded transition-colors" style={{ color: 'var(--color-text-muted)' }} title="Expand All">
               <UnfoldVertical className="w-4 h-4" />
            </button>
            <button
              onClick={() => addScene("", "")}
              className="signature-gradient"
              style={{ color: '#0a1a1f', border: 'none', borderRadius: 24, padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Add Scene
            </button>
          </div>
        </div>

        {Object.values(scenes).length === 0 ? (
          <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            No scenes created yet.
          </div>
        ) : (
          <div className="space-y-2">
            {Object.values(scenes)
              .sort((a, b) => parseInt(b.id.replace('S', '')) - parseInt(a.id.replace('S', '')))
              .map(scene => {
              const isExpanded = expandedScenes.has(scene.id);
              const condCount = (scene.requires || []).length;
              const nextCount = (scene.next || []).length;

              return (
              <div key={scene.id} id={scene.id} className="scroll-mt-4 rounded-lg overflow-hidden" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderLeft: '3px solid var(--color-accent-scene)' }}>
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ background: isExpanded ? 'var(--color-surface-card-low)' : 'transparent' }}
                  onClick={() => toggleScene(scene.id)}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{scene.id}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: scene.name ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {scene.name || 'unnamed_scene'}
                  </span>

                  {!isExpanded && (
                    <div className="flex items-center gap-2 ml-auto" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {scene.path && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-card-low)' }}>{paths[scene.path]?.name || scene.path}</span>}
                      {scene.chapter && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-card-low)' }}>{chapters[scene.chapter]?.name || scene.chapter}</span>}
                    </div>
                  )}

                  {!isExpanded && (
                    <span className="ml-2" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {condCount} conditions · {nextCount} targets
                    </span>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                <div className="px-4 py-4 space-y-5" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                  {/* Name & description */}
                  <DebouncedInput
                    type="text"
                    value={scene.name}
                    onChange={(val) => updateScene(scene.id, { name: val })}
                    className="w-full bg-transparent focus:outline-none"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-row)', padding: '4px 0' }}
                    onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-border-active)'}
                    onBlur={(e) => e.target.style.borderBottomColor = 'var(--color-border-row)'}
                    placeholder="scene_name"
                  />
                  <DebouncedTextarea
                    value={scene.description}
                    onChange={(val) => updateScene(scene.id, { description: val })}
                    className="w-full focus:outline-none rounded-md resize-y min-h-[60px]"
                    style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.6, padding: '7px 10px' }}
                    placeholder="Scene description..."
                  />

                  {/* Path/Chapter dropdowns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Path</label>
                      <select value={scene.path || ''} onChange={(e) => updateScene(scene.id, { path: e.target.value || null })}
                        className="w-full rounded-md px-2.5 py-1.5 focus:outline-none"
                        style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                      >
                        <option value="">No Path</option>
                        {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Chapter</label>
                      <select value={scene.chapter || ''} onChange={(e) => updateScene(scene.id, { chapter: e.target.value || null })}
                        className="w-full rounded-md px-2.5 py-1.5 focus:outline-none"
                        style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                      >
                        <option value="">No Chapter</option>
                        {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Requires */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Requires</label>
                    <ConditionEditor
                      conditions={scene.requires || []}
                      onChange={(newReqs) => updateScene(scene.id, { requires: newReqs })}
                    />
                  </div>

                  {/* Next targets */}
                  <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next targets · first match wins</label>
                      </div>
                      <button
                        onClick={() => updateScene(scene.id, { next: [...(scene.next || []), { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, target: '', requires: [] }] })}
                        style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                      >
                        + Add target
                      </button>
                    </div>

                    {(!scene.next || scene.next.length === 0) ? (
                      <div className="py-4 text-center rounded-md" style={{ fontSize: 11, color: 'var(--color-accent-error)', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
                        ⚠ No targets — scene may get stuck
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {scene.next.map((route, idx) => {
                          const routeKey = route._id || `route-fallback-${idx}`;
                          const isFallback = idx === scene.next.length - 1 && (!route.requires || route.requires.length === 0);
                          return (
                          <div key={routeKey} className="p-3 rounded-md relative group" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                            <div className="flex items-start gap-3">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{idx + 1}.</span>
                              <div className="flex-1 space-y-2">
                                {isFallback ? (
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Fallback · always matches</span>
                                ) : (
                                  <ConditionEditor
                                    conditions={route.requires || []}
                                    onChange={(newReqs) => {
                                      const newNext = [...scene.next];
                                      newNext[idx] = { ...route, requires: newReqs };
                                      updateScene(scene.id, { next: newNext });
                                    }}
                                  />
                                )}
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>→</span>
                                  <SearchableDropdown
                                    value={route.target || null}
                                    onChange={(val) => {
                                      const newNext = [...scene.next];
                                      newNext[idx] = { ...route, target: val || '' };
                                      updateScene(scene.id, { next: newNext });
                                    }}
                                    options={routeOptions.filter(o => o.id !== scene.id)}
                                    placeholder="Select target..."
                                    showFilters={true}
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const newNext = scene.next.filter((_, i) => i !== idx);
                                  updateScene(scene.id, { next: newNext });
                                }}
                                className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                        {scene.next.length > 0 && scene.next[scene.next.length - 1].requires && scene.next[scene.next.length - 1].requires.length > 0 && (
                          <div className="py-2 px-3 rounded-md" style={{ fontSize: 11, color: 'var(--color-accent-error)', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
                            ⚠ No fallback — scene may get stuck
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryNode(scene.id);
                      }}
                      className="px-2 py-1 rounded-md transition-colors"
                      style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: entryNode === scene.id ? 'rgba(0,209,255,0.08)' : 'transparent',
                        border: entryNode === scene.id ? '1px solid rgba(0,209,255,0.2)' : '1px solid var(--color-border-ghost)',
                        color: entryNode === scene.id ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {entryNode === scene.id ? '✓ Entry Node' : 'Set Entry'}
                    </button>
                    <button
                      onClick={() => { if (window.confirm("Delete this scene?")) deleteScene(scene.id); }}
                      style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      Delete scene
                    </button>
                  </div>
                </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
      <QuickNav items={Object.values(scenes).sort((a,b) => parseInt(b.id.replace('S','')) - parseInt(a.id.replace('S','')))} title="Scenes" renderLabel={s => s.name || 'unnamed'} />
    </div>
  );
}
