import React, { useMemo, useState } from 'react';
import { AlertTriangle, Flag, Layers, GitFork, Book, Dumbbell, Award, ListTree } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';
import { useEditor } from '../../context/EditorContext';

import FlagForm from './forms/FlagForm';
import StatusForm from './forms/StatusForm';
import PathForm from './forms/PathForm';
import ChapterForm from './forms/ChapterForm';
import QuestForm from './forms/QuestForm';
import EndingForm from './forms/EndingForm';
import ChoiceForm from './forms/ChoiceForm';
import SceneForm from './forms/SceneForm';
import DynamicTracker from './DynamicTracker';

export default function LeftSidebar({ activeNavItem, onNavChange, activeEditId, onSetEditId, onClearEdit, sim }) {
  const { flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode, setEntryNode } = useEditor();
  const [searchTerm, setSearchTerm] = useState("");

  const editingEntityId = activeEditId;
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  React.useEffect(() => {
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

  // Determine entry node type for chip
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

  return (
    <aside className="w-[320px] max-w-[320px] overflow-hidden flex-shrink-0 flex flex-col h-full z-10" style={{ background: 'var(--color-surface-panel)', borderRight: '1px solid var(--color-border-panel)' }}>
      {sim && sim.isRunning ? (
        <DynamicTracker sim={sim} />
      ) : activeEditId || isCreatingNew ? (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {(() => {
            switch (activeNavItem) {
              case 'flags': return <FlagForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'status': return <StatusForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'paths': return <PathForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'chapters': return <ChapterForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'quests': return <QuestForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'endings': return <EndingForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'choices': return <ChoiceForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              case 'scenes': return <SceneForm entityId={editingEntityId} onSave={closeForm} onCancel={closeForm} />;
              default: return <div className="p-4 text-center mt-10" style={{ color: 'var(--color-text-muted)' }}>Select a type to edit.</div>;
            }
          })()}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
        
          {/* Entry Node Selection */}
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

          {/* Mode Switcher */}
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
                  <>
                    {/* Mode 2 Header */}
                    <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-ghost)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <button 
                          onClick={() => onNavChange(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13 }}
                          title="Back to Overview"
                        >
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
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded text-sm outline-none transition-colors"
                          style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-primary)' }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--color-border-ghost)'}
                        />
                        <button 
                          onClick={() => setIsCreatingNew(true)}
                          className="p-1 px-2 rounded cursor-pointer transition-colors font-medium text-xs"
                          style={{ background: 'rgba(0,209,255,0.08)', color: 'var(--color-accent-primary-dim)', border: '1px solid rgba(0,209,255,0.2)' }}
                          title="New Entity"
                        >
                          + New
                        </button>
                      </div>
                    </div>
                    
                    {/* Entity List */}
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                      {filteredEntities.map(entity => (
                        <div 
                          key={entity.id} 
                          onClick={() => onSetEditId(entity.id)}
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
                      ))}
                      {filteredEntities.length === 0 && (
                        <div className="text-center p-4 text-xs italic" style={{ color: 'var(--color-text-muted)' }}>No matches found</div>
                      )}
                    </div>
                  </>
              </div>
            );
          })() : (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div>
                <h2 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Project Overview
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {dashboardItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="flex flex-col p-2.5 rounded-md" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)' }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon className="w-3 h-3" style={{ color: item.color }} />
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }}>
                            {item.label}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--color-text-primary)' }}>
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
