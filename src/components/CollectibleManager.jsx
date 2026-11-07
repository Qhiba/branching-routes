// ADDED (Redesign Step 4): left-sidebar "Collectibles" panel.
// Categories with their collectibles; each collectible shows how many Common nodes grant it (expand to jump to
// them) or that it is not placed yet. Drag to reorder within a category or move to another category.
// CHANGED (2026-11-05): clicking a category name collapses / expands its collectibles (session-only; searching shows matches).
// All mutations go through narrativeStore actions (AR-04); built on design-system primitives (AR-37).
import React, { useMemo, useState } from 'react';
import { Search, Plus, FolderPlus, Pencil, Trash2, Gem, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNarrativeStore, useSimulationStore } from 'store';
import CollectibleDialog from './CollectibleDialog';
import ConfirmModal from './ConfirmModal';
import './EntityList.css';
import './CollectibleManager.css';

const NO_CATEGORY = '__none__';

function focusNode(nodeId) {
    window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
}

export default function CollectibleManager() {
    const categories = useNarrativeStore(s => s.collectibleCategory);
    const collectibles = useNarrativeStore(s => s.collectible);
    const common = useNarrativeStore(s => s.common);
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

    const [query, setQuery] = useState('');
    const [dialog, setDialog] = useState(null);      // { kind, initialData, defaultCategoryId }
    const [confirm, setConfirm] = useState(null);    // { title, message, confirmLabel, onConfirm }
    const [expandedId, setExpandedId] = useState(null);
    const [collapsed, setCollapsed] = useState({}); // groupId -> true while the category is collapsed
    const toggleCollapsed = (groupId) => setCollapsed(prev => ({ ...prev, [groupId]: !prev[groupId] }));

    // collectibleId -> [{ id, label }] of Common nodes granting it
    const grantedBy = useMemo(() => {
        const map = {};
        Object.values(common).forEach(n => {
            (n.data?.collectibleIds || []).forEach(cid => {
                (map[cid] = map[cid] || []).push({ id: n.id, label: n.data?.label || 'Untitled node' });
            });
        });
        return map;
    }, [common]);

    const q = query.trim().toLowerCase();
    const groups = useMemo(() => {
        const list = [...Object.values(categories).map(c => ({ id: c.id, category: c })), { id: NO_CATEGORY, category: null }];
        return list.map(g => ({
            ...g,
            items: Object.values(collectibles).filter(c =>
                (g.category ? c.categoryId === g.category.id : !c.categoryId || !categories[c.categoryId]) &&
                (!q || c.name.toLowerCase().includes(q))
            ),
        })).filter(g => g.category || g.items.length > 0);
    }, [categories, collectibles, q]);

    const total = Object.keys(collectibles).length;
    const dragDisabled = isCampaignActive || q.length > 0;

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        const store = useNarrativeStore.getState();
        if (destination.droppableId !== source.droppableId) {
            store.updateCollectible(draggableId, { categoryId: destination.droppableId === NO_CATEGORY ? null : destination.droppableId });
            return;
        }
        if (destination.index === source.index) return;
        const group = groups.find(g => g.id === source.droppableId);
        const target = group?.items[destination.index];
        if (target) store.reorderDictionaryKeys('collectible', draggableId, target.id);
    };

    const askDeleteCollectible = (c) => {
        const nodes = grantedBy[c.id] || [];
        setConfirm({
            title: `Delete "${c.name}"?`,
            message: nodes.length > 0
                ? `${nodes.length} node${nodes.length === 1 ? '' : 's'} grant this collectible. Deleting it also removes it from ${nodes.length === 1 ? 'that node' : 'those nodes'}.`
                : 'This collectible is not placed on any node.',
            confirmLabel: 'Delete collectible',
            onConfirm: () => useNarrativeStore.getState().deleteCollectible(c.id, true),
        });
    };

    const askDeleteCategory = (cat) => {
        const count = Object.values(collectibles).filter(c => c.categoryId === cat.id).length;
        setConfirm({
            title: `Delete category "${cat.name}"?`,
            message: count > 0
                ? `Its ${count} collectible${count === 1 ? '' : 's'} will be deleted too and removed from every node.`
                : 'The category is empty.',
            confirmLabel: 'Delete category',
            onConfirm: () => useNarrativeStore.getState().deleteCollectibleCategory(cat.id, true),
        });
    };

    return (
        <div className="entity-list-view">
            <div className="entity-list-header">
                <div className="entity-list-search">
                    <Search className="entity-list-search-icon" size={14} />
                    <input
                        type="text"
                        className="entity-list-input"
                        placeholder="Search collectibles"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        aria-label="Search collectibles"
                    />
                </div>
                <button
                    className="entity-list-add-btn"
                    disabled={isCampaignActive}
                    title="New category"
                    aria-label="New category"
                    onClick={() => setDialog({ kind: 'category', initialData: null })}
                >
                    <FolderPlus size={15} />
                </button>
                <button
                    className="entity-list-add-btn"
                    disabled={isCampaignActive}
                    title="New collectible"
                    aria-label="New collectible"
                    onClick={() => setDialog({ kind: 'collectible', initialData: null })}
                >
                    <Plus size={16} />
                </button>
            </div>

            {total === 0 && Object.keys(categories).length === 0 ? (
                <div className="br-empty">
                    <p className="br-empty__title">No collectibles yet</p>
                    <p className="br-empty__text">
                        Track CGs, Live2D scenes, items or achievements, then see which nodes grant each one.
                        Start with a category such as "CG".
                    </p>
                    <button className="br-btn br-btn--sm" disabled={isCampaignActive} onClick={() => setDialog({ kind: 'category', initialData: null })}>
                        <FolderPlus />New category
                    </button>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="entity-list-content custom-scrollbar">
                        {groups.map(group => {
                            // While searching, every group stays open so the matches are visible
                            const isCollapsed = !q && !!collapsed[group.id];
                            return (
                            <div key={group.id} className="br-collectibles__group">
                                <div className="entity-list-item br-collectibles__category">
                                    <button
                                        type="button"
                                        className="br-collectibles__toggle"
                                        aria-expanded={!isCollapsed}
                                        onClick={() => toggleCollapsed(group.id)}
                                        title={isCollapsed ? 'Show collectibles' : 'Hide collectibles'}
                                    >
                                        {isCollapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
                                        <span className="entity-list-item-name br-collectibles__category-name">
                                            {group.category ? group.category.name : 'No category'}
                                        </span>
                                        <span className="br-badge">{group.items.length}</span>
                                    </button>
                                    {group.category && (
                                        <div className="entity-list-item-actions">
                                            <button className="entity-action-btn" title="New collectible in this category" aria-label={`New collectible in ${group.category.name}`}
                                                disabled={isCampaignActive}
                                                onClick={() => setDialog({ kind: 'collectible', initialData: null, defaultCategoryId: group.category.id })}>
                                                <Plus size={14} />
                                            </button>
                                            <button className="entity-action-btn" title="Rename category" aria-label={`Rename ${group.category.name}`}
                                                disabled={isCampaignActive}
                                                onClick={() => setDialog({ kind: 'category', initialData: group.category })}>
                                                <Pencil size={14} />
                                            </button>
                                            <button className="entity-action-btn entity-action-btn--danger" title="Delete category" aria-label={`Delete ${group.category.name}`}
                                                disabled={isCampaignActive}
                                                onClick={() => askDeleteCategory(group.category)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!isCollapsed && (
                                <Droppable droppableId={group.id} isDropDisabled={dragDisabled}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="br-collectibles__items">
                                            {group.items.length === 0 && (
                                                <p className="br-collectibles__hint">Empty. Drag a collectible here or use +.</p>
                                            )}
                                            {group.items.map((c, index) => {
                                                const nodes = grantedBy[c.id] || [];
                                                const isOpen = expandedId === c.id;
                                                return (
                                                    <Draggable key={c.id} draggableId={c.id} index={index} isDragDisabled={dragDisabled}>
                                                        {(dragProvided, snapshot) => (
                                                            <div
                                                                ref={dragProvided.innerRef}
                                                                {...dragProvided.draggableProps}
                                                                className={`entity-list-item-wrapper${snapshot.isDragging ? ' is-dragging' : ''}`}
                                                            >
                                                                <div className="entity-list-item">
                                                                    <div className="entity-list-item-left">
                                                                        <span {...dragProvided.dragHandleProps} className="entity-drag-handle br-collectibles__handle" aria-label="Drag to reorder">
                                                                            <GripVertical size={14} />
                                                                        </span>
                                                                        <Gem size={14} className="entity-icon--purple" aria-hidden="true" />
                                                                        <span className="entity-list-item-name">{c.name}</span>
                                                                    </div>
                                                                    <div className="br-collectibles__right">
                                                                        {nodes.length > 0 ? (
                                                                            <button
                                                                                className="br-collectibles__count"
                                                                                aria-expanded={isOpen}
                                                                                onClick={() => setExpandedId(isOpen ? null : c.id)}
                                                                                title="Show the nodes that grant this collectible"
                                                                            >
                                                                                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                                {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="br-collectibles__orphan" title="No node grants this collectible yet">Not placed</span>
                                                                        )}
                                                                        <div className="entity-list-item-actions">
                                                                            <button className="entity-action-btn" aria-label={`Edit ${c.name}`} title="Edit" disabled={isCampaignActive}
                                                                                onClick={() => setDialog({ kind: 'collectible', initialData: c })}>
                                                                                <Pencil size={14} />
                                                                            </button>
                                                                            <button className="entity-action-btn entity-action-btn--danger" aria-label={`Delete ${c.name}`} title="Delete" disabled={isCampaignActive}
                                                                                onClick={() => askDeleteCollectible(c)}>
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {isOpen && (
                                                                    <ul className="br-collectibles__nodes">
                                                                        {nodes.map(n => (
                                                                            <li key={n.id}>
                                                                                <button className="br-row" data-route="common" onClick={() => focusNode(n.id)}>
                                                                                    <span className="br-route" />
                                                                                    <span className="br-row__main">{n.label}</span>
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
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
                                )}
                            </div>
                            );
                        })}
                        {q && groups.every(g => g.items.length === 0) && (
                            <p className="br-collectibles__hint">No collectible matches "{query.trim()}".</p>
                        )}
                    </div>
                </DragDropContext>
            )}

            {dialog && (
                <CollectibleDialog
                    kind={dialog.kind}
                    initialData={dialog.initialData}
                    defaultCategoryId={dialog.defaultCategoryId}
                    onClose={() => setDialog(null)}
                />
            )}
            <ConfirmModal
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                danger
                onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
}
