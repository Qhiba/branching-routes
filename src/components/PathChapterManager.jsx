import React, { useState } from 'react';
import { useNarrativeStore, useSimulationStore } from 'store';
import { Search, Plus, Trash2, Pencil, FolderTree, BookOpen, GripVertical, Tag } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import NameModal from './NameModal';
import './EntityList.css';

function getNodeLabel(ref, common, choice, ending) {
  const parts = ref.split(':');
  const kind = parts[0];
  if (kind.startsWith('edge_')) return null;
  const nodeId = parts[1];
  const node = common[nodeId] || choice[nodeId] || ending[nodeId];
  return node ? { label: node.data?.label || nodeId, nodeId } : null;
}

// CHANGED: Replaced dual-view UI with isolated EntityListView filter logic
// PRESERVED: All CRUD operations perfectly mirror original logic onto useNarrativeStore
export default function PathChapterManager({ filterType }) {
  const isChapter = filterType === 'chapter';
  const isCommonType = filterType === 'commonType';
  const isEndingType = filterType === 'endingType';
  const isTag = filterType === 'tag';

  const dict = useNarrativeStore(state =>
    isChapter ? state.chapter :
      isCommonType ? state.commonType :
        isEndingType ? state.endingType :
          isTag ? state.tag :
            state.path
  );
  const items = Object.values(dict || {});

  const deleteItem = useNarrativeStore(state =>
    isChapter ? state.deleteChapter :
      isCommonType ? state.deleteCommonType :
        isEndingType ? state.deleteEndingType :
          isTag ? state.deleteTag :
            state.deletePath
  );
  
  const common = useNarrativeStore(state => state.common);
  const choice = useNarrativeStore(state => state.choice);
  const ending = useNarrativeStore(state => state.ending);
  
  const reorderDictionaryKeys = useNarrativeStore(state => state.reorderDictionaryKeys);

  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const isDragDisabled = searchQuery.trim().length > 0;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceId = filteredItems[result.source.index].id;
    const targetId = filteredItems[result.destination.index].id;
    if (sourceId !== targetId) {
      const dictName = isChapter ? 'chapter' : isCommonType ? 'commonType' : isEndingType ? 'endingType' : isTag ? 'tag' : 'path';
      reorderDictionaryKeys(dictName, sourceId, targetId);
    }
  };

  const handleRename = (e, item) => {
    e.stopPropagation();
    setEditItem(item);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeleteError(null);
    const result = deleteItem(id);
    if (result && result.blocked) {
      setDeleteError({ id, references: result.references });
    }
  };

  const handleForceDelete = (id) => {
    deleteItem(id, true);
    setDeleteError(null);
  };

  const Icon = isCommonType || isEndingType ? FolderTree : isChapter ? BookOpen : isTag ? Tag : FolderTree;
  const iconColor = isCommonType ? 'var(--color-emerald)' : isEndingType ? 'var(--color-amber)' : isChapter ? 'var(--color-indigo)' : isTag ? 'var(--color-pink)' : 'var(--color-cyan)';

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const typeLabel = isChapter ? 'chapters' : isCommonType ? 'common types' : isEndingType ? 'ending types' : isTag ? 'tags' : 'paths';

  return (
    <div className="entity-list-view">
      <div className="entity-list-header">
        <div className="entity-list-search">
          <Search className="entity-list-search-icon" size={14} />
          <input
            type="text"
            placeholder={`Search ${typeLabel}...`}
            className="entity-list-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="entity-list-add-btn"
          onClick={() => !isCampaignActive && setEditItem('new')}
          disabled={isCampaignActive}
          title={isCampaignActive ? 'Cannot add entities during campaign mode' : 'Add Item'}
        >
          <Plus size={16} />
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`manager-list-${filterType}`} isDropDisabled={isDragDisabled}>
          {(provided) => (
            <div className="entity-list-content custom-scrollbar" {...provided.droppableProps} ref={provided.innerRef}>
              {filteredItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isDragDisabled}>
                  {(provided, snapshot) => (
                    <div 
                      className={`entity-list-item-wrapper ${snapshot.isDragging ? 'is-dragging' : ''}`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={provided.draggableProps.style}
                    >
                      <div className="entity-list-item">
                        <div className="entity-list-item-left">
                          <div {...provided.dragHandleProps} className="entity-drag-handle" style={{ display: 'flex', alignItems: 'center', cursor: isDragDisabled ? 'default' : 'grab', marginRight: '8px', opacity: isDragDisabled ? 0.3 : 0.6 }}>
                            <GripVertical size={14} />
                          </div>
                          <Icon size={14} className={`entity-icon--${isCommonType ? 'emerald' : isEndingType ? 'amber' : isChapter ? 'indigo' : isTag ? 'pink' : 'cyan'}`} />
                          <span className="entity-list-item-name">{item.name}</span>
                        </div>
                        <div className="entity-list-item-actions">
                          <button className="entity-action-btn" onClick={(e) => handleRename(e, item)}>
                            <Pencil size={14} />
                          </button>
                          <button className="entity-action-btn entity-action-btn--danger" onClick={(e) => handleDelete(e, item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {deleteError && deleteError.id === item.id && (
                        <div className="entity-delete-error">
                          <strong className="entity-delete-error__title">Cannot delete: referenced by {deleteError.references.length} node{deleteError.references.length > 1 ? 's' : ''}</strong>
                          <ul className="entity-delete-error__list">
                            {deleteError.references.map((ref, idx) => {
                              const node = getNodeLabel(ref, common, choice, ending);
                              return (
                                <li key={idx} className="entity-delete-error__ref">
                                  <span className="entity-delete-error__ref-name">{node ? node.label : ref}</span>
                                  {node && (
                                    <button
                                      onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: node.nodeId } }))}
                                      className="entity-delete-error__focus-btn"
                                    >
                                      Focus
                                    </button>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                          <div className="entity-delete-error__footer">
                            <button onClick={() => setDeleteError(null)} className="entity-delete-error__dismiss-btn">Dismiss</button>
                            <button onClick={() => handleForceDelete(item.id)} className="entity-delete-error__force-btn" title="Cascades delete to strip references">
                              Force Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editItem && <NameModal entityType={filterType} initialData={editItem === 'new' ? null : editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
