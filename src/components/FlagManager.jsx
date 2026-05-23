import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Plus, Trash2, Pencil, Flag, GripVertical } from 'lucide-react';
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

function isFlagUsed(id, common, choice, ending, edges) {
  for (const e of edges) {
    if (e.condition && e.condition.conditions && e.condition.conditions.some(c => c.flag === id)) return true;
  }
  const allNodes = [...Object.values(common), ...Object.values(choice), ...Object.values(ending)];
  for (const n of allNodes) {
    if (n.data && n.data.flags_set && n.data.flags_set.includes(id)) return true;
    if (n.data && Array.isArray(n.data.variants)) {
      if (n.data.variants.some(v => v.requires && Array.isArray(v.requires.conditions) && v.requires.conditions.some(c => c.flag === id))) return true;
    }
    if (n.data && Array.isArray(n.data.options)) {
      if (n.data.options.some(opt => 
        (opt.requires && Array.isArray(opt.requires.conditions) && opt.requires.conditions.some(c => c.flag === id)) || 
        (Array.isArray(opt.flags_set) && opt.flags_set.includes(id))
      )) return true;
    }
  }
  return false;
}

// CHANGED: Replaced legacy inline UI with full EntityListView design
// PRESERVED: All CRUD operations and deletion blockers perfectly mirror original logic onto useNarrativeStore
export default function FlagManager() {
  const flagDict = useNarrativeStore(state => state.flag);
  const flags = Object.values(flagDict);
  const deleteFlag = useNarrativeStore(state => state.deleteFlag);
  const common = useNarrativeStore(state => state.common);
  const choice = useNarrativeStore(state => state.choice);
  const ending = useNarrativeStore(state => state.ending);
  const edges = useNarrativeStore(state => state.edges);
  const reorderDictionaryKeys = useNarrativeStore(state => state.reorderDictionaryKeys);

  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filteredFlags = flags.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const isDragDisabled = searchQuery.trim().length > 0;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceId = filteredFlags[result.source.index].id;
    const targetId = filteredFlags[result.destination.index].id;
    if (sourceId !== targetId) {
      reorderDictionaryKeys('flag', sourceId, targetId);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeleteError(null);
    const result = deleteFlag(id);
    if (result && result.blocked) {
      setDeleteError({ id, references: result.references });
    }
  };

  return (
    <div className="entity-list-view">
      <div className="entity-list-header">
        <div className="entity-list-search">
          <Search className="entity-list-search-icon" size={14} />
          <input
            type="text"
            placeholder="Search flags..."
            className="entity-list-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="entity-list-add-btn" onClick={() => setEditItem('new')}>
          <Plus size={16} />
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="flags-list" isDropDisabled={isDragDisabled}>
          {(provided) => (
            <div className="entity-list-content custom-scrollbar" {...provided.droppableProps} ref={provided.innerRef}>
              {filteredFlags.map((flag, index) => {
                const isUsed = isFlagUsed(flag.id, common, choice, ending, edges);
                return (
                <Draggable key={flag.id} draggableId={flag.id} index={index} isDragDisabled={isDragDisabled}>
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
                          <Flag size={14} className="entity-icon--purple" fill={isUsed ? "currentColor" : "none"} />
                <div className="entity-list-item-col">
                  <span className="entity-list-item-name">{flag.name}</span>
                  <span className="entity-list-item-sub">Default: {String(flag.state)}</span>
                </div>
              </div>
              <div className="entity-list-item-actions">
                <button className="entity-action-btn" onClick={(e) => { e.stopPropagation(); setEditItem(flag); }}>
                  <Pencil size={14} />
                </button>
                <button className="entity-action-btn entity-action-btn--danger" onClick={(e) => handleDelete(e, flag.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {deleteError && deleteError.id === flag.id && (
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
                </div>
              </div>
            )}
            </div>
          )}
          </Draggable>
                );
              })}
        {provided.placeholder}
      </div>
          )}
        </Droppable>
      </DragDropContext>

      {editItem && <NameModal entityType="flag" initialData={editItem === 'new' ? null : editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
