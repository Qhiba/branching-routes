import React, { useState } from 'react';
import { useNarrativeStore, useUIStore } from 'store';
import { Search, Pencil, Trash2, Plus, GripVertical, SlidersHorizontal, Filter } from 'lucide-react';
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
    const [localFilterChapter, setLocalFilterChapter] = useState('');
    const [localFilterPath, setLocalFilterPath] = useState('');
    const [localFilterTypeNode, setLocalFilterTypeNode] = useState('');
    const [showListFilters, setShowListFilters] = useState(false);

    let nodesDict = {};
    if (activeTab === 'common') {
        Object.keys(common || {}).forEach(k => {
            if (common[k].type !== 'warp_entrance' && common[k].type !== 'warp_exit' && common[k].type !== 'hub') {
                nodesDict[k] = common[k];
            }
        });
    } else if (activeTab === 'choice') {
        nodesDict = choice;
    } else if (activeTab === 'ending') {
        nodesDict = ending;
    } else if (activeTab === 'warp') {
        Object.keys(common || {}).forEach(k => {
            if (common[k].type === 'warp_entrance' || common[k].type === 'warp_exit') {
                nodesDict[k] = common[k];
            }
        });
    } else if (activeTab === 'hub') {
        Object.keys(common || {}).forEach(k => {
            if (common[k].type === 'hub') {
                nodesDict[k] = common[k];
            }
        });
    }

    const nodes = Object.values(nodesDict || {}).filter(n => {
        let match = (n.data?.label || n.id).toLowerCase().includes(searchQuery.toLowerCase());
        if (localFilterChapter) match = match && n.data?.chapterId === localFilterChapter;
        if (localFilterPath) match = match && n.data?.pathId === localFilterPath;
        if (localFilterTypeNode) {
            if (activeTab === 'common') match = match && n.data?.commonTypeId === localFilterTypeNode;
            if (activeTab === 'ending') match = match && n.data?.endingTypeId === localFilterTypeNode;
        }
        return match;
    });

    const isDragDisabled = activeTab === 'warp' || activeTab === 'hub' || searchQuery.trim().length > 0 || localFilterChapter !== '' || localFilterPath !== '' || localFilterTypeNode !== '';

    const onDragEnd = (result) => {
        if (activeTab === 'warp' || activeTab === 'hub') return;
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
        if (activeTab === 'warp') {
            window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'warp_entrance' } }));
        } else {
            window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: activeTab } }));
        }
    };

    return (
        <div className="nodes-panel">
            <div className="nodes-panel__canvas-header">
                <div className="nodes-panel__canvas-title">
                    Nodes
                </div>
            </div>

            <div className="nodes-panel__tabs">
                {['common', 'choice', 'ending', 'warp', 'hub'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { 
                            setActiveTab(tab); 
                            setLocalFilterChapter(''); 
                            setLocalFilterPath(''); 
                            setLocalFilterTypeNode(''); 
                        }}
                        className={`nodes-panel__tab ${activeTab === tab ? 'nodes-panel__tab--active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="nodes-panel__search nodes-panel__search--col">
                <div className="nodes-panel__search-row">
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
                    <button
                        type="button"
                        onClick={() => setShowListFilters(!showListFilters)}
                        className={`nodes-panel__options-btn ${showListFilters ? 'nodes-panel__options-btn--active' : ''}`}
                        title="Toggle list filters"
                    >
                        <Filter size={14} />
                    </button>
                </div>
                {showListFilters && (
                    <div className="nodes-panel__filters-row">
                        {(activeTab === 'common' || activeTab === 'ending') && (
                            <select value={localFilterTypeNode} onChange={e => setLocalFilterTypeNode(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                                <option value="">All Types</option>
                                {Object.values(activeTab === 'common' ? commonTypes : endingTypes).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}
                        <select value={localFilterChapter} onChange={e => setLocalFilterChapter(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                            <option value="">All Chapters</option>
                            {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={localFilterPath} onChange={e => setLocalFilterPath(e.target.value)} className="nodes-panel__input nodes-panel__filter-select">
                            <option value="">All Paths</option>
                            {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}
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
                                {activeTab === 'warp' && (
                                    <div className="nodes-panel__item-stats">
                                        <span>Type: {node.type === 'warp_entrance' ? 'Entrance' : 'Exit'}</span> •
                                        <span>Channel: {data.portalChannel || '(not set)'}</span>
                                    </div>
                                )}
                                {activeTab === 'hub' && (
                                    <div className="nodes-panel__item-stats">
                                        <span>Router Hub</span> •
                                        <span>{(data.flags_set || []).length} Flags</span> •
                                        <span>{(data.status_set || []).length} Status</span>
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
                <Plus size={16} /> Add {activeTab === 'warp' ? 'Warp' : activeTab} Node
            </button>
        </div>
    );
}
