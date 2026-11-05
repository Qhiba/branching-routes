// ADDED (Redesign Step 6): right-sidebar "Browse" panel — one place to find nodes.
// Replaces NodesPanel (type tabs, local filters) and FiltersPanel (canvas filters). Search covers node labels,
// collectibles, flags and statuses (where they are set or required) and, if enabled in Settings, edge conditions
// listed under their source node. Filters live in uiStore and dim the canvas (they never hide or delete).
// Built on design-system primitives (AR-37); mutations go through store actions (AR-04).
import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Pencil, Trash2, X, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNarrativeStore, useUIStore, useSimulationStore, beginGroup, endGroup } from 'store';
import { searchGraph, nodeMatchesFilters, countActiveFilters, ROUTE_TYPE_LABELS } from 'utils';
import './BrowsePanel.css';

const TYPE_ORDER = ['common', 'choice', 'ending', 'hub', 'warp'];
// Which dictionary a section reorders (hub / warp live in common{} but are not reorderable here)
const REORDERABLE = { common: 'common', choice: 'choice', ending: 'ending' };

function focusNode(nodeId) {
    window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
    window.dispatchEvent(new CustomEvent('canvas-select-nodes', { detail: { ids: [nodeId] } }));
}

function editNode(nodeId) {
    window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
    window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId } }));
}

function Filters() {
    const chapters = useNarrativeStore(s => s.chapter);
    const paths = useNarrativeStore(s => s.path);
    const tags = useNarrativeStore(s => s.tag);
    const categories = useNarrativeStore(s => s.collectibleCategory);

    const nodeType = useUIStore(s => s.canvasFilterNodeType);
    const chapterId = useUIStore(s => s.canvasFilterChapterId);
    const pathId = useUIStore(s => s.canvasFilterPathId);
    const tagIds = useUIStore(s => s.canvasFilterTagIds);
    const tagsLogic = useUIStore(s => s.canvasFilterTagsLogic);
    const categoryId = useUIStore(s => s.canvasFilterCollectibleCategoryId);
    const ui = useUIStore.getState;

    const toggleTag = (id) => ui().setCanvasFilterTagIds(tagIds.includes(id) ? tagIds.filter(t => t !== id) : [...tagIds, id]);

    return (
        <div className="br-browse__filters" role="group" aria-label="Filters">
            <div className="br-field">
                <span className="br-field__label">Type</span>
                <div className="br-browse__chips">
                    <button className={`br-chip br-chip--button${!nodeType ? ' br-chip--on' : ''}`} onClick={() => ui().setCanvasFilterNodeType(null)} aria-pressed={!nodeType}>All</button>
                    {TYPE_ORDER.map(t => (
                        <button key={t} data-route={t} className={`br-chip br-chip--button${nodeType === t ? ' br-chip--on' : ''}`}
                            aria-pressed={nodeType === t} onClick={() => ui().setCanvasFilterNodeType(nodeType === t ? null : t)}>
                            <span className="br-route" />{ROUTE_TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="br-browse__row2">
                <div className="br-field">
                    <label className="br-field__label" htmlFor="br-browse-chapter">Chapter</label>
                    <select id="br-browse-chapter" className="br-select" value={chapterId || ''} onChange={e => ui().setCanvasFilterChapterId(e.target.value || null)}>
                        <option value="">Any chapter</option>
                        {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="br-field">
                    <label className="br-field__label" htmlFor="br-browse-path">Path</label>
                    <select id="br-browse-path" className="br-select" value={pathId || ''} onChange={e => ui().setCanvasFilterPathId(e.target.value || null)}>
                        <option value="">Any path</option>
                        {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="br-field">
                <label className="br-field__label" htmlFor="br-browse-category">Grants a collectible from</label>
                <select id="br-browse-category" className="br-select" value={categoryId || ''} onChange={e => ui().setCanvasFilterCollectibleCategoryId(e.target.value || null)}>
                    <option value="">Any category</option>
                    {Object.values(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {Object.keys(tags).length > 0 && (
                <div className="br-field">
                    <div className="br-browse__tags-head">
                        <span className="br-field__label">Tags</span>
                        {tagIds.length > 1 && (
                            <div className="br-segmented" role="radiogroup" aria-label="Tag matching">
                                <button className="br-segment" role="radio" aria-checked={tagsLogic !== 'and'} onClick={() => ui().setCanvasFilterTagsLogic('or')}>Any</button>
                                <button className="br-segment" role="radio" aria-checked={tagsLogic === 'and'} onClick={() => ui().setCanvasFilterTagsLogic('and')}>All</button>
                            </div>
                        )}
                    </div>
                    <div className="br-browse__chips">
                        {Object.values(tags).map(t => (
                            <button key={t.id} className={`br-chip br-chip--button${tagIds.includes(t.id) ? ' br-chip--on' : ''}`}
                                aria-pressed={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BrowsePanel() {
    const common = useNarrativeStore(s => s.common);
    const choice = useNarrativeStore(s => s.choice);
    const ending = useNarrativeStore(s => s.ending);
    const edges = useNarrativeStore(s => s.edges);
    const flag = useNarrativeStore(s => s.flag);
    const status = useNarrativeStore(s => s.status);
    const collectible = useNarrativeStore(s => s.collectible);
    const chapters = useNarrativeStore(s => s.chapter);

    const includeEdges = useUIStore(s => s.searchIncludeEdges);
    const selectedNodeId = useUIStore(s => s.selectedNodeId);
    const selectedNodeIds = useUIStore(s => s.selectedNodeIds);
    const filters = {
        nodeType: useUIStore(s => s.canvasFilterNodeType),
        chapterId: useUIStore(s => s.canvasFilterChapterId),
        pathId: useUIStore(s => s.canvasFilterPathId),
        tagIds: useUIStore(s => s.canvasFilterTagIds),
        tagsLogic: useUIStore(s => s.canvasFilterTagsLogic),
        collectibleCategoryId: useUIStore(s => s.canvasFilterCollectibleCategoryId),
    };
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const activeFilterCount = countActiveFilters(filters);

    const nodeById = useMemo(() => ({ ...common, ...choice, ...ending }), [common, choice, ending]);

    const results = useMemo(() => {
        const found = searchGraph(query, { common, choice, ending, edges, flag, status, collectible }, { includeEdges });
        return found.filter(r => nodeMatchesFilters(nodeById[r.nodeId], r.routeType, filters, collectible));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, common, choice, ending, edges, flag, status, collectible, includeEdges, nodeById,
        filters.nodeType, filters.chapterId, filters.pathId, filters.tagIds, filters.tagsLogic, filters.collectibleCategoryId]);

    const total = Object.keys(nodeById).length;
    const isSearching = query.trim().length > 0;
    const canReorder = !isSearching && activeFilterCount === 0 && !isCampaignActive;
    const selected = new Set(selectedNodeIds.length ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []));

    const sections = useMemo(() => TYPE_ORDER
        .map(t => ({ type: t, items: results.filter(r => r.routeType === t) }))
        .filter(sec => sec.items.length > 0), [results]);

    const onDragEnd = ({ source, destination, draggableId }) => {
        if (!destination || destination.droppableId !== source.droppableId || destination.index === source.index) return;
        const section = sections.find(sec => sec.type === source.droppableId);
        const target = section?.items[destination.index];
        const dict = REORDERABLE[source.droppableId];
        if (target && dict) useNarrativeStore.getState().reorderDictionaryKeys(dict, draggableId, target.nodeId);
    };

    const deleteNode = (nodeId) => {
        beginGroup();
        useNarrativeStore.getState().deleteNode(nodeId);
        endGroup();
    };

    const summary = isSearching
        ? `${results.length} ${results.length === 1 ? 'node matches' : 'nodes match'} "${query.trim()}"`
        : activeFilterCount
            ? `${results.length} of ${total} nodes match the filters`
            : `${total} ${total === 1 ? 'node' : 'nodes'}`;

    const renderRow = (r, index, sectionType) => {
        const chapterName = chapters[nodeById[r.nodeId]?.data?.chapterId]?.name;
        const draggable = canReorder && !!REORDERABLE[sectionType];
        return (
            <Draggable key={r.nodeId} draggableId={r.nodeId} index={index} isDragDisabled={!draggable}>
                {(p, snapshot) => (
                    <li ref={p.innerRef} {...p.draggableProps} className={`br-browse__item${snapshot.isDragging ? ' br-browse__item--dragging' : ''}`}>
                        <div
                            className={`br-row br-browse__row${selected.has(r.nodeId) ? ' br-row--selected' : ''}`}
                            data-route={r.routeType}
                            role="button"
                            tabIndex={0}
                            onClick={() => focusNode(r.nodeId)}
                            onDoubleClick={() => !isCampaignActive && editNode(r.nodeId)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNode(r.nodeId); } }}
                            title="Click to find on canvas, double-click to edit"
                        >
                            {draggable && (
                                <span {...p.dragHandleProps} className="br-browse__handle" aria-label="Drag to reorder" onClick={e => e.stopPropagation()}>
                                    <GripVertical size={13} />
                                </span>
                            )}
                            <span className="br-route br-route--stripe" />
                            <span className="br-row__main">{r.label}</span>
                            {chapterName && <span className="br-row__meta">{chapterName}</span>}
                            {!isCampaignActive && (
                                <span className="br-row__actions">
                                    <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-label={`Edit ${r.label}`} title="Edit"
                                        onClick={e => { e.stopPropagation(); editNode(r.nodeId); }}>
                                        <Pencil />
                                    </button>
                                    <button className="br-btn br-btn--danger br-btn--icon br-btn--sm" aria-label={`Delete ${r.label}`} title="Delete (Ctrl+Z to undo)"
                                        onClick={e => { e.stopPropagation(); deleteNode(r.nodeId); }}>
                                        <Trash2 />
                                    </button>
                                </span>
                            )}
                        </div>
                        {r.matches.filter(m => m.kind !== 'label').length > 0 && (
                            <ul className="br-browse__matches">
                                {r.matches.filter(m => m.kind !== 'label').map((m, i) => (
                                    <li key={i} className={`br-browse__match br-browse__match--${m.kind}`}>{m.text}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                )}
            </Draggable>
        );
    };

    return (
        <div className="br-browse">
            <div className="br-browse__bar">
                <div className="br-browse__search">
                    <Search className="br-browse__search-icon" aria-hidden="true" />
                    <input
                        className="br-input br-browse__search-input"
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}
                        placeholder="Search nodes, flags, items…"
                        aria-label="Search nodes"
                    />
                    {query && (
                        <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm br-browse__clear" aria-label="Clear search" onClick={() => setQuery('')}>
                            <X />
                        </button>
                    )}
                </div>
                <button
                    className="br-btn br-btn--icon"
                    aria-pressed={showFilters}
                    aria-expanded={showFilters}
                    aria-label={`Filters${activeFilterCount ? ` (${activeFilterCount} active)` : ''}`}
                    title="Filters"
                    onClick={() => setShowFilters(v => !v)}
                >
                    <SlidersHorizontal />
                    {activeFilterCount > 0 && <span className="br-browse__filter-count">{activeFilterCount}</span>}
                </button>
            </div>

            {showFilters && <Filters />}

            <div className="br-browse__summary">
                <span>{summary}</span>
                {activeFilterCount > 0 && (
                    <button className="br-btn br-btn--ghost br-btn--sm" onClick={() => useUIStore.getState().resetCanvasFilters()}>Clear filters</button>
                )}
            </div>

            <div className="br-browse__list custom-scrollbar">
                {total === 0 ? (
                    <div className="br-empty">
                        <p className="br-empty__title">No nodes yet</p>
                        <p className="br-empty__text">Add one with the buttons at the top, or press N for a Common node and C for a Choice node.</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="br-empty">
                        <p className="br-empty__title">Nothing found</p>
                        <p className="br-empty__text">
                            {isSearching ? 'Try a flag, status or collectible name. ' : ''}
                            {activeFilterCount ? 'Filters may be hiding results.' : ''}
                        </p>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {sections.map(sec => (
                            <section key={sec.type} className="br-browse__section" aria-label={`${ROUTE_TYPE_LABELS[sec.type]} nodes`}>
                                <h3 className="br-browse__section-title" data-route={sec.type}>
                                    <span className="br-route" />{ROUTE_TYPE_LABELS[sec.type]}
                                    <span className="br-panel-header__count">{sec.items.length}</span>
                                </h3>
                                <Droppable droppableId={sec.type} isDropDisabled={!canReorder || !REORDERABLE[sec.type]}>
                                    {(p) => (
                                        <ul ref={p.innerRef} {...p.droppableProps} className="br-browse__items">
                                            {sec.items.map((r, i) => renderRow(r, i, sec.type))}
                                            {p.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </section>
                        ))}
                    </DragDropContext>
                )}
            </div>
        </div>
    );
}
