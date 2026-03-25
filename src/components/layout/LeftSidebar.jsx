import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Flag, Layers, GitFork, Book, Dumbbell, Award, ListTree, ChevronDown, ChevronUp, CircleDashed, CircleCheck, ArrowLeft, Route, Sparkles } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';
import { useEditor } from '../../context/EditorContext';
import useLongPress from '../../hooks/useLongPress';

import FlagForm from './forms/FlagForm';
import StatusForm from './forms/StatusForm';
import PathForm from './forms/PathForm';
import ChapterForm from './forms/ChapterForm';
import QuestForm from './forms/QuestForm';
import DynamicTracker from './DynamicTracker';

import { SceneInspector, ChoiceInspector, EndingInspector } from './NodeInspector';

// Entity types that get the read-only inspector + modal flow
const INSPECTOR_TYPES = new Set(['scenes', 'choices', 'endings']);

function EntityListItem({ entity, activeColor, onSelect, onFocus }) {
  const longPressProps = useLongPress(
    () => onFocus(entity.id),
    () => onSelect(entity.id),
    { delay: 600 }
  );

  return (
    <div 
      {...longPressProps}
      className="p-2 rounded cursor-pointer transition-colors flex items-start gap-2 group"
      style={{ background: 'transparent', border: '1px solid transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-card)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: activeColor, padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
          {entity.id.slice(0, 6)}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {entity.name || entity.text || 'Unnamed'}
          </div>
          {entity.text && (
            <div className="truncate text-[10px]" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
              {entity.text}
            </div>
          )}
        </div>
    </div>
  );
}

/**
 * FlagDashRow — interactive flag row for dashboard
 */
function FlagDashRow({ flag, onToggle }) {
  const [flash, setFlash] = useState(null);

  const handleToggle = () => {
    const newState = !flag.state;
    onToggle(flag.id);
    setFlash(newState ? 'on' : 'off');
    setTimeout(() => setFlash(null), 350);
  };

  const flashClass = flash === 'on' ? 'flash-flag-on' : flash === 'off' ? 'flash-flag-off' : '';

  return (
    <div 
      className={`flex items-center gap-2 h-7 px-2 rounded transition-colors ${flashClass}`}
      style={{ background: 'var(--color-surface-card-low)' }}
    >
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-variable)', width: 36, flexShrink: 0 }}>
        {flag.id}
      </div>
      <div className="flex-1 truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
        {flag.name}
      </div>
      <button 
        onClick={handleToggle}
        className="w-5 h-5 flex items-center justify-center p-0 hover:bg-white/5 rounded-full transition-colors border-none bg-transparent cursor-pointer"
        style={{ color: flag.state ? 'var(--color-accent-success)' : 'var(--color-text-muted)' }}
      >
        {flag.state ? <CircleCheck className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function LeftSidebar({ activeNavItem, onNavChange, activeEditId, onSetEditId, onClearEdit, sim, onOpenModal, backtrackTargetId, onClearBacktrack, routeTraceResult, onHighlightPath, tracedPath }) {
  const { flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode, setEntryNode, focusNode, deleteScene, deleteChoice, deleteEnding, toggleFlagState } = useEditor();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFlagsExpanded, setIsFlagsExpanded] = useState(false);
  const [flagSearchTerm, setFlagSearchTerm] = useState("");

  const editingEntityId = activeEditId;
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    setIsCreatingNew(false);
  }, [activeNavItem]);

  const closeForm = () => {
    setIsCreatingNew(false);
    if (onClearEdit) onClearEdit();
  };

  const entryPointOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
  ], [scenes, choices]);

  const entryNodeType = useMemo(() => {
    if (!entryNode) return null;
    if (scenes[entryNode]) return 'Scene';
    if (choices[entryNode]) return 'Choice';
    return null;
  }, [entryNode, scenes, choices]);

  const dashboardItems = [
    { id: 'flags', label: 'Flags', count: Object.keys(flags || {}).length, icon: Flag, color: 'var(--color-accent-variable)' },
    { id: 'status', label: 'Status Points', count: Object.keys(statusPoints || {}).length, icon: Dumbbell, color: 'var(--color-accent-primary)' },
    { id: 'choices', label: 'Choices', count: Object.keys(choices || {}).length, icon: GitFork, color: 'var(--color-accent-primary-dim)' },
    { id: 'scenes', label: 'Scenes', count: Object.keys(scenes || {}).length, icon: Layers, color: 'var(--color-accent-scene)' },
    { id: 'paths', label: 'Paths', count: Object.keys(paths || {}).length, icon: ListTree, color: 'var(--color-text-muted)' },
    { id: 'chapters', label: 'Chapters', count: Object.keys(chapters || {}).length, icon: Book, color: 'var(--color-text-muted)' },
    { id: 'quests', label: 'Quests', count: Object.keys(quests || {}).length, icon: ListTree, color: 'var(--color-text-muted)' },
    { id: 'endings', label: 'Endings', count: Object.keys(endings || {}).length, icon: Award, color: 'var(--color-accent-terminal)' },
  ];

  const flagList = useMemo(() => Object.values(flags || {}).sort((a, b) => a.id.localeCompare(b.id)), [flags]);
  const activeFlagsCount = useMemo(() => flagList.filter(f => f.state).length, [flagList]);
  const totalFlagsCount = flagList.length;

  const filteredFlags = useMemo(() => {
    if (!flagSearchTerm) return flagList;
    return flagList.filter(f => f.name.toLowerCase().includes(flagSearchTerm.toLowerCase()));
  }, [flagList, flagSearchTerm]);

  /* ── Delete handler for inspector types ── */
  const handleInspectorDelete = (type, id) => {
    const referencingScenes = Object.values(scenes).filter(s => s.next && s.next.some(r => r.target === id)).map(s => s.id);
    const referencingChoices = Object.values(choices).filter(c => c.options && c.options.some(opt => opt.next === id)).map(c => c.id);
    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      alert(`${id} is referenced as a next target in: ${[...referencingScenes, ...referencingChoices].join(', ')}. Remove those references first.`);
      return;
    }
    const label = type === 'scenes' ? 'scene' : type === 'choices' ? 'choice' : 'ending';
    if (window.confirm(`Delete this ${label}?`)) {
      if (type === 'scenes') deleteScene(id);
      else if (type === 'choices') deleteChoice(id);
      else if (type === 'endings') deleteEnding(id);
      closeForm();
    }
  };

  /* ── "+ New" handler — handles both modal and inline creation ── */
  const handleAddNew = () => {
    const isInspectorType = INSPECTOR_TYPES.has(activeNavItem);
    if (isInspectorType) {
      if (onOpenModal) {
        const typeMap = { scenes: 'scene', choices: 'choice', endings: 'ending' };
        onOpenModal(typeMap[activeNavItem], null);
      }
    } else {
      setIsCreatingNew(true);
    }
  };

  /* ── Determine what to render for the selected entity ── */
  const renderEditorOrInspector = () => {
    const isInspectorType = INSPECTOR_TYPES.has(activeNavItem);

    if (isCreatingNew && isInspectorType) {
      handleAddNew();
      setIsCreatingNew(false);
      return null;
    }

    if (isCreatingNew && !isInspectorType) {
      switch (activeNavItem) {
        case 'flags': return <FlagForm entityId={null} onSave={closeForm} onCancel={closeForm} />;
        case 'status': return <StatusForm entityId={null} onSave={closeForm} onCancel={closeForm} />;
        case 'paths': return <PathForm entityId={null} onSave={closeForm} onCancel={closeForm} />;
        case 'chapters': return <ChapterForm entityId={null} onSave={closeForm} onCancel={closeForm} />;
        case 'quests': return <QuestForm entityId={null} onSave={closeForm} onCancel={closeForm} />;
        default: return null;
      }
    }

    if (editingEntityId && isInspectorType) {
      const handleEdit = () => {
        if (onOpenModal) {
          const typeMap = { scenes: 'scene', choices: 'choice', endings: 'ending' };
          onOpenModal(typeMap[activeNavItem], editingEntityId);
        }
      };
      const handleDelete = () => handleInspectorDelete(activeNavItem, editingEntityId);

      switch (activeNavItem) {
        case 'scenes': return <SceneInspector entityId={editingEntityId} onEdit={handleEdit} onDelete={handleDelete} />;
        case 'choices': return <ChoiceInspector entityId={editingEntityId} onEdit={handleEdit} onDelete={handleDelete} />;
        case 'endings': return <EndingInspector entityId={editingEntityId} onEdit={handleEdit} onDelete={handleDelete} />;
        default: return null;
      }
    }

    if (editingEntityId && !isInspectorType) {
      switch (activeNavItem) {
        case 'flags': return <FlagForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
        case 'status': return <StatusForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
        case 'paths': return <PathForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
        case 'chapters': return <ChapterForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
        case 'quests': return <QuestForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
        default: return null;
      }
    }

    return null;
  };

  /* ── Get entity info helper ── */
  const getEntityInfo = (entityId) => {
    if (scenes[entityId]) {
      return { type: 'Scene', name: scenes[entityId].name, color: 'var(--color-accent-scene)' };
    }
    if (choices[entityId]) {
      return { type: 'Choice', name: choices[entityId].text, color: 'var(--color-accent-primary-dim)' };
    }
    if (endings[entityId]) {
      return { type: 'Ending', name: endings[entityId].name, color: 'var(--color-accent-terminal)' };
    }
    return { type: 'Unknown', name: 'Unknown', color: 'var(--color-text-muted)' };
  };

  /* ── Selected path index for multi-path results ── */
  const [selectedPathIdx, setSelectedPathIdx] = useState(0);

  // Reset selected path when target changes
  useEffect(() => {
    setSelectedPathIdx(0);
  }, [backtrackTargetId]);

  /* ── Render backtrack results view (annotated route) ── */
  const renderBacktrackView = () => {
    const targetInfo = getEntityInfo(backtrackTargetId);
    const hasResult = routeTraceResult && routeTraceResult.paths && routeTraceResult.paths.length > 0;
    const currentPath = hasResult ? routeTraceResult.paths[selectedPathIdx] : null;
    const isHighlighted = tracedPath && currentPath && JSON.stringify(tracedPath) === JSON.stringify(currentPath.raw);

    return (
      <>
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-ghost)' }}>
          <button
            onClick={onClearBacktrack}
            className="flex items-center gap-2 mb-3 text-sm transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to inspector
          </button>

          <div className="mb-2 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" style={{ color: '#d4a017' }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#d4a017', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Route to
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: targetInfo.color, padding: '2px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
              {backtrackTargetId.slice(0, 6)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {targetInfo.name || 'Unnamed'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {targetInfo.type}
              </div>
            </div>
          </div>
        </div>

        {/* Path selector (if multiple paths) */}
        {hasResult && routeTraceResult.paths.length > 1 && (
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Path:</span>
            <div className="flex gap-1 flex-wrap">
              {routeTraceResult.paths.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPathIdx(idx)}
                  className="px-2 py-0.5 rounded transition-colors"
                  style={{
                    fontSize: 10,
                    fontWeight: selectedPathIdx === idx ? 600 : 400,
                    background: selectedPathIdx === idx ? 'rgba(212,160,23,0.15)' : 'var(--color-surface-card-low)',
                    color: selectedPathIdx === idx ? '#d4a017' : 'var(--color-text-muted)',
                    border: `1px solid ${selectedPathIdx === idx ? 'rgba(212,160,23,0.3)' : 'var(--color-border-ghost)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              {routeTraceResult.paths.length} paths found
            </span>
          </div>
        )}

        {/* Annotated steps */}
        <div className="flex-1 overflow-y-auto p-3">
          {!hasResult ? (
            <div className="text-center py-8">
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                No route found
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                No path exists from the entry node to this node.
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {currentPath.annotated.map((step, idx) => {
                const stepInfo = getEntityInfo(step.nodeId);
                const isLast = idx === currentPath.annotated.length - 1;
                const typeColor = step.nodeType === 'choice' ? 'var(--color-accent-primary-dim)' : step.nodeType === 'scene' ? 'var(--color-accent-scene)' : step.nodeType === 'ending' ? 'var(--color-accent-terminal)' : 'var(--color-text-muted)';

                return (
                  <div key={step.nodeId} className="relative">
                    {/* Step number + node info */}
                    <div
                      className="p-2.5 rounded-md transition-colors cursor-pointer"
                      style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}
                      onClick={() => onSetEditId(step.nodeId)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-ghost)'}
                    >
                      <div className="flex items-start gap-2">
                        {/* Step number */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', fontSize: 10, fontWeight: 700 }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {/* Node type badge + ID */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: typeColor, background: `color-mix(in srgb, ${typeColor} 10%, transparent)`, padding: '1px 4px', borderRadius: 3 }}>
                              {step.nodeType}
                            </span>
                            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                              {step.nodeId}
                            </span>
                          </div>
                          {/* Node name */}
                          <div className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                            {step.nodeName}
                          </div>

                          {/* Pick info (which option/route to take) */}
                          {step.pick && (
                            <div className="mt-1.5 pl-2" style={{ borderLeft: '2px solid rgba(212,160,23,0.3)' }}>
                              <div className="flex items-center gap-1">
                                <span style={{ fontSize: 10, color: '#d4a017' }}>→</span>
                                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                  "{step.pick.label}"
                                </span>
                              </div>

                              {/* Flags set */}
                              {step.flagsSet && step.flagsSet.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.flagsSet.map((flagName, fi) => (
                                    <span key={fi} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-variable)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                      sets {flagName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Status changes */}
                              {step.statusChanges && step.statusChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.statusChanges.map((sc, si) => (
                                    <span key={si} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: sc.amount >= 0 ? 'var(--color-accent-primary-dim)' : 'var(--color-accent-error)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                      {sc.amount >= 0 ? '+' : ''}{sc.amount} {sc.statusName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Satisfaction warning */}
                              {!step.satisfiesNext && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3 h-3" style={{ color: 'var(--color-accent-error)' }} />
                                  <span style={{ fontSize: 9, color: 'var(--color-accent-error)' }}>
                                    Next node's requirements may not be met
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Requires on this node */}
                          {step.requires && step.requires.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>requires:</span>
                              {step.requires.map((req, ri) => (
                                <span key={ri} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: req.flag ? 'var(--color-accent-variable)' : 'var(--color-accent-primary-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>
                                  {req.flag ? `${req.flag}=${String(req.state)}` : `${req.status} ${req.min !== undefined ? `≥${req.min}` : ''}${req.max !== undefined ? `≤${req.max}` : ''}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Connector line between steps */}
                    {!isLast && (
                      <div className="flex justify-center py-0.5">
                        <div style={{ width: 1, height: 12, background: 'rgba(212,160,23,0.3)' }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary */}
              <div className="mt-3 px-2.5 py-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  Minimum choices: <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentPath.annotated.filter(s => s.nodeType === 'choice' && s.pick).length}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Total steps: <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {currentPath.raw.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — Highlight path button */}
        {hasResult && (
          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
            <button
              onClick={() => {
                if (isHighlighted) {
                  onHighlightPath(null);
                } else {
                  onHighlightPath(currentPath.raw);
                }
              }}
              className="flex items-center justify-center gap-2 rounded-md transition-colors w-full"
              style={{
                background: isHighlighted ? 'rgba(212,160,23,0.2)' : 'rgba(212,160,23,0.1)',
                color: '#d4a017',
                border: `1px solid ${isHighlighted ? 'rgba(212,160,23,0.4)' : 'rgba(212,160,23,0.2)'}`,
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,160,23,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = isHighlighted ? 'rgba(212,160,23,0.2)' : 'rgba(212,160,23,0.1)'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isHighlighted ? 'Clear highlight' : 'Highlight path on graph'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <aside className="w-[320px] max-w-[320px] overflow-hidden flex-shrink-0 flex flex-col h-full z-10" style={{ background: 'var(--color-surface-panel)', borderRight: '1px solid var(--color-border-panel)' }}>
      {sim && sim.isRunning ? (
        <DynamicTracker sim={sim} />
      ) : backtrackTargetId ? (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {renderBacktrackView()}
        </div>
      ) : activeEditId || isCreatingNew ? (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {renderEditorOrInspector()}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-ghost)' }}>
            <div className="mb-1.5 flex items-center gap-1.5" style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Entry Node
              {entryNodeType && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,209,255,0.08)', color: 'var(--color-accent-primary-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {entryNodeType}
                </span>
              )}
            </div>
            <SearchableDropdown
              value={entryNode || null}
              onChange={setEntryNode}
              options={entryPointOptions}
              placeholder="Set entry node..."
              showFilters={true}
            />
            {!entryNode && (
              <div className="flex items-center gap-1 mt-1.5 px-1.5 py-1 rounded" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)' }}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-accent-error)' }} />
                <span style={{ fontSize: 10, color: 'var(--color-accent-error)' }}>No entry node — export disabled</span>
              </div>
            )}
          </div>

          {activeNavItem ? (() => {
            const getActiveEntities = () => {
              switch (activeNavItem) {
                case 'flags': return Object.values(flags || {});
                case 'status': return Object.values(statusPoints || {});
                case 'choices': return Object.values(choices || {});
                case 'scenes': return Object.values(scenes || {});
                case 'paths': return Object.values(paths || {});
                case 'chapters': return Object.values(chapters || {});
                case 'quests': return Object.values(quests || {});
                case 'endings': return Object.values(endings || {});
                default: return [];
              }
            };

            const activeItemData = dashboardItems.find(i => i.id === activeNavItem);
            const activeLabel = activeItemData?.label || '';
            const activeColor = activeItemData?.color || 'var(--color-text-primary)';
            const activeEntities = getActiveEntities();
            const filteredEntities = activeEntities.filter(e => 
              (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
              (e.text || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
              (e.id || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-ghost)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => onNavChange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13 }} title="Back to Overview">
                      ← Overview
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: activeColor }}>{activeLabel}</span>
                      <span style={{ fontSize: 10, background: 'var(--color-surface-card)', padding: '2px 6px', borderRadius: 99, color: 'var(--color-text-muted)' }}>
                        {activeEntities.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded text-sm outline-none transition-colors"
                      style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-primary)' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-border-ghost)'}
                    />
                    <button onClick={handleAddNew} className="p-1 px-2 rounded cursor-pointer transition-colors font-medium text-xs" style={{ background: 'rgba(0,209,255,0.08)', color: 'var(--color-accent-primary-dim)', border: '1px solid rgba(0,209,255,0.2)' }} title="New Entity">
                      + New
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                  {filteredEntities.map(entity => (
                    <EntityListItem key={entity.id} entity={entity} activeColor={activeColor} onSelect={onSetEditId} onFocus={focusNode} />
                  ))}
                  {filteredEntities.length === 0 && (
                    <div className="text-center p-4 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>No matches found</div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div>
                <h2 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Project Overview
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {dashboardItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex flex-col p-2.5 rounded-md cursor-pointer hover:border-white/10 transition-all active:scale-[0.98]" 
                      style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}
                      onClick={() => onNavChange(item.id)}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <item.icon className="w-3 h-3" style={{ color: item.color }} />
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--color-text-primary)' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags Section */}
              <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-ghost)' }}>
                <div 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsFlagsExpanded(!isFlagsExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flags</span>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <span style={{ color: 'var(--color-accent-success)' }}>●{activeFlagsCount}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>/ {totalFlagsCount}</span>
                    </div>
                  </div>
                  {isFlagsExpanded ? <ChevronUp className="w-3 h-3 text-muted" /> : <ChevronDown className="w-3 h-3 text-muted" />}
                </div>

                {isFlagsExpanded && (
                  <div className="mt-3 flex flex-col">
                    {totalFlagsCount > 10 && (
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Search flags..."
                          value={flagSearchTerm}
                          onChange={(e) => setFlagSearchTerm(e.target.value)}
                          className="w-full px-2 py-1.5 rounded outline-none transition-colors"
                          style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-primary)', fontSize: 11 }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--color-border-ghost)'}
                        />
                      </div>
                    )}
                    <div className="max-h-[240px] overflow-y-auto pr-1 flex flex-col gap-[2px] py-[6px] custom-scrollbar-hidden" style={{ scrollbarWidth: 'none' }}>
                      {filteredFlags.map(f => (
                        <FlagDashRow key={f.id} flag={f} onToggle={toggleFlagState} />
                      ))}
                      {filteredFlags.length === 0 && (
                        <div className="py-4 text-center text-[10px] italic text-muted">No matching flags</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .custom-scrollbar-hidden::-webkit-scrollbar { display: none; }
      `}</style>
    </aside>
  );
}

