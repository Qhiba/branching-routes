// CHANGED: Added new NodesPanel for central node filtering and listing
// PRESERVED: Hooked into existing narrativeStore and triggers legacy canvas events
import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Pencil, Trash2, Plus, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './RightPanels.css';

export default function NodesPanel() {
    const common = useNarrativeStore(state => state.common);
    const choice = useNarrativeStore(state => state.choice);
    const ending = useNarrativeStore(state => state.ending);

    const chapters = useNarrativeStore(state => state.chapter);
    const paths = useNarrativeStore(state => state.path);
    const commonTypes = useNarrativeStore(state => state.commonType);
    const endingTypes = useNarrativeStore(state => state.endingType);
    const deleteNode = useNarrativeStore(state => state.deleteNode);
    const reorderDictionaryKeys = useNarrativeStore(state => state.reorderDictionaryKeys);

    const [activeTab, setActiveTab] = useState('common');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [filterPath, setFilterPath] = useState('');
    const [filterTypeNode, setFilterTypeNode] = useState('');

    const nodesDict = activeTab === 'common' ? common : activeTab === 'choice' ? choice : ending;

    const nodes = Object.values(nodesDict || {}).filter(n => {
        let match = (n.data?.label || n.id).toLowerCase().includes(searchQuery.toLowerCase());
        if (filterChapter) match = match && n.data?.chapterId === filterChapter;
        if (filterPath) match = match && n.data?.pathId === filterPath;
        if (filterTypeNode) {
            if (activeTab === 'common') match = match && n.data?.commonTypeId === filterTypeNode;
            if (activeTab === 'ending') match = match && n.data?.endingTypeId === filterTypeNode;
        }
        return match;
    });

    const isDragDisabled = searchQuery.trim().length > 0 || filterChapter !== '' || filterPath !== '' || filterTypeNode !== '';

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const sourceId = nodes[result.source.index].id;
        const targetId = nodes[result.destination.index].id;
        if (sourceId !== targetId) {
            reorderDictionaryKeys(activeTab, sourceId, targetId);
        }
    };

    const handleFocus = (nodeId) => {
        window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
    };

    const handleEdit = (nodeId) => {
        window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
        window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId } }));
    };

    const handleDelete = (id) => {
        deleteNode(id);
    };

    const handleCreateNode = () => {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: activeTab } }));
    };

    return (
        <div className="nodes-panel">
            <div className="nodes-panel__tabs">
                {['common', 'choice', 'ending'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setFilterChapter(''); setFilterPath(''); setFilterTypeNode(''); }}
                        className={`nodes-panel__tab ${activeTab === tab ? 'nodes-panel__tab--active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="nodes-panel__search nodes-panel__search--col">
                <div className="nodes-panel__search-input-wrap">
                    <Search className="nodes-panel__search-icon" size={14} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab} nodes...`}
                        className="nodes-panel__input"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="nodes-panel__filters-row">
                    {(activeTab === 'common' || activeTab === 'ending') && (
                        <select value={filterTypeNode} onChange={e => setFilterTypeNode(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                            <option value="">All Types</option>
                            {Object.values(activeTab === 'common' ? commonTypes : endingTypes).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    )}
                    <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                        <option value="">All Chapters</option>
                        {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filterPath} onChange={e => setFilterPath(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                        <option value="">All Paths</option>
                        {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={`nodes-panel-${activeTab}`} isDropDisabled={isDragDisabled}>
                    {(provided) => (
                        <div className="nodes-panel__list custom-scrollbar" {...provided.droppableProps} ref={provided.innerRef}>
                            {nodes.map((node, index) => {
                                const label = node.data?.label || node.id;
                                const data = node.data || {};
                                return (
                                    <Draggable key={node.id} draggableId={node.id} index={index} isDragDisabled={isDragDisabled}>
                                        {(provided, snapshot) => (
                                            <div 
                                                className={`nodes-panel__item nodes-panel__item--${activeTab} ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                                onClick={() => handleFocus(node.id)}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={provided.draggableProps.style}
                                            >
                                                <div {...provided.dragHandleProps} className="entity-drag-handle" style={{ display: 'flex', alignItems: 'center', cursor: isDragDisabled ? 'default' : 'grab', marginRight: '8px', opacity: isDragDisabled ? 0.3 : 0.6, height: '100%' }}>
                                                    <GripVertical size={14} />
                                                </div>
                                                <div className="nodes-panel__item-info">
                                                    <span className="nodes-panel__item-name">{label}</span>
                                {data.content && (
                                    <span className="nodes-panel__item-content">
                                        {data.content}
                                    </span>
                                )}
                                {activeTab === 'common' && (
                                    <div className="nodes-panel__item-stats">
                                        <span>{(data.flags_set || []).length} Flags</span> •
                                        <span>{(data.status_set || []).length} Status</span> •
                                        <span>{(data.variants || []).length} Variants</span>
                                    </div>
                                )}
                                {activeTab === 'choice' && (
                                    <div className="nodes-panel__item-stats">
                                        <span>{(data.flags_set || []).length} Flags</span> •
                                        <span>{(data.status_set || []).length} Status</span> •
                                        <span>{(data.options || []).length} Options</span>
                                    </div>
                                )}
                            </div>
                            <div className="nodes-panel__item-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(node.id); }} className="panel-action-btn" title="Edit">
                                    <Pencil size={12} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} className="panel-action-btn panel-action-btn--danger" title="Delete">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                            {nodes.length === 0 && (
                                <div className="nodes-panel__empty">
                                    No {activeTab} nodes found.
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <button className="nodes-panel__add-full-btn" onClick={handleCreateNode}>
                <Plus size={16} /> Add {activeTab} Node
            </button>
        </div>
    );
}
