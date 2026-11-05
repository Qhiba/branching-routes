// ADDED (Redesign Step 7): right-sidebar "Inspect" panel — hybrid editing (AR-25 as revised).
// Quick fields are edited here directly; complex parts (Choice options and their conditions, edge conditions,
// warp connections) open the full modal via the existing DOM events (AR-19).
// Shows: nothing selected → hint; one node → node form; one edge → edge form; several nodes → bulk tools.
// All writes go through narrativeStore actions (AR-04); multi-node writes are one undo step (AR-39).
import React from 'react';
import {
    Maximize2, Trash2, Copy, Star,
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
    AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
} from 'lucide-react';
import { useNarrativeStore, useUIStore, useSimulationStore, beginGroup, endGroup } from 'store';
import { nodeRouteType, describeCondition, ROUTE_TYPE_LABELS } from 'utils';
import { duplicateSelection } from 'hooks/useKeyboardShortcuts';
import ChipsField from '../fields/ChipsField';
import StatusEffectsField from '../fields/StatusEffectsField';
import './InspectorPanel.css';

const openNodeEditor = (nodeId) => window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId } }));
const openEdgeEditor = (edgeId) => window.dispatchEvent(new CustomEvent('canvas-edit-edge-modal', { detail: { edgeId } }));
const values = (d) => Object.values(d || {});

function useSelection() {
    const selectedNodeId = useUIStore(s => s.selectedNodeId);
    const selectedEdgeId = useUIStore(s => s.selectedEdgeId);
    const selectedNodeIds = useUIStore(s => s.selectedNodeIds);
    if (selectedNodeIds.length > 1) return { kind: 'multi', ids: selectedNodeIds };
    if (selectedEdgeId) return { kind: 'edge', id: selectedEdgeId };
    const id = selectedNodeId || selectedNodeIds[0];
    return id ? { kind: 'node', id } : { kind: 'none' };
}

function NodeInspector({ nodeId, readOnly }) {
    const node = useNarrativeStore(s => s.common[nodeId] || s.choice[nodeId] || s.ending[nodeId]);
    const collection = useNarrativeStore(s => (s.choice[nodeId] ? 'choice' : s.ending[nodeId] ? 'ending' : 'common'));
    const flags = useNarrativeStore(s => s.flag);
    const statuses = useNarrativeStore(s => s.status);
    const chapters = useNarrativeStore(s => s.chapter);
    const paths = useNarrativeStore(s => s.path);
    const tags = useNarrativeStore(s => s.tag);
    const commonTypes = useNarrativeStore(s => s.commonType);
    const endingTypes = useNarrativeStore(s => s.endingType);
    const collectibles = useNarrativeStore(s => s.collectible);
    const categories = useNarrativeStore(s => s.collectibleCategory);

    if (!node) return null;
    const data = node.data || {};
    const route = nodeRouteType(node, collection);
    const store = useNarrativeStore.getState;
    const patch = (fields) => store().updateNode(nodeId, { data: fields });
    const toggleIn = (key, id) => {
        const cur = data[key] || [];
        patch({ [key]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
    };

    const isStory = route === 'common' || route === 'choice' || route === 'ending';
    const typeOptions = route === 'common' ? values(commonTypes) : route === 'ending' ? values(endingTypes) : [];
    const subtypeName = typeOptions.find(t => t.id === data.nodeSubTypeId)?.name;

    return (
        <div className="br-inspector__form">
            <div className="br-inspector__kind" data-route={route}>
                <span className="br-route" />
                <span>{ROUTE_TYPE_LABELS[route]}{node.type === 'warp_entrance' ? ' entrance' : node.type === 'warp_exit' ? ' exit' : ''}{subtypeName ? ` · ${subtypeName}` : ''}</span>
                {data.isStartNode && <span className="br-chip br-inspector__start"><Star size={11} />Start</span>}
            </div>

            <div className="br-field">
                <label className="br-field__label" htmlFor="br-insp-label">Label</label>
                <input id="br-insp-label" className="br-input" value={data.label || ''} disabled={readOnly}
                    onChange={e => patch({ label: e.target.value })} placeholder="Name this node" />
            </div>

            {isStory && (
                <>
                    <div className="br-field">
                        <label className="br-field__label" htmlFor="br-insp-content">Content</label>
                        <textarea id="br-insp-content" className="br-textarea" rows={3} value={data.content || ''} disabled={readOnly}
                            onChange={e => patch({ content: e.target.value })} placeholder="What happens here…" />
                    </div>
                    <div className="br-inspector__two">
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-chapter">Chapter</label>
                            <select id="br-insp-chapter" className="br-select" value={data.chapterId || ''} disabled={readOnly}
                                onChange={e => patch({ chapterId: e.target.value || null })}>
                                <option value="">None</option>
                                {values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-path">Path</label>
                            <select id="br-insp-path" className="br-select" value={data.pathId || ''} disabled={readOnly}
                                onChange={e => patch({ pathId: e.target.value || null })}>
                                <option value="">None</option>
                                {values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {typeOptions.length > 0 && (
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-subtype">{route === 'ending' ? 'Ending type' : 'Common type'}</label>
                            <select id="br-insp-subtype" className="br-select" value={data.nodeSubTypeId || ''} disabled={readOnly}
                                onChange={e => patch({ nodeSubTypeId: e.target.value || null })}>
                                <option value="">None</option>
                                {typeOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                    <ChipsField id="br-insp-tags" label="Tags" options={values(tags)} selectedIds={data.tagIds}
                        onToggle={(id) => toggleIn('tagIds', id)} disabled={readOnly}
                        noOptionsText="No tags yet. Create them in the Tags panel on the left." />
                </>
            )}

            {route === 'common' && (
                <ChipsField id="br-insp-collectibles" label="Collectibles granted here"
                    options={values(collectibles).map(c => ({ id: c.id, name: c.name, group: categories[c.categoryId]?.name || 'No category' }))}
                    selectedIds={data.collectibleIds}
                    onToggle={(id) => store().toggleNodeCollectible(nodeId, id)}
                    disabled={readOnly}
                    noOptionsText="No collectibles yet. Create them in the Collectibles panel on the left." />
            )}

            {(isStory || route === 'hub') && route !== 'ending' && (
                <>
                    <ChipsField id="br-insp-flags" label="Flags set to true on enter" options={values(flags)}
                        selectedIds={data.flags_set} onToggle={(id) => toggleIn('flags_set', id)} disabled={readOnly}
                        noOptionsText="No flags yet. Create them in the Flags panel on the left." />
                    <StatusEffectsField id="br-insp-status" statuses={values(statuses)} effects={data.status_set}
                        onChange={(next) => patch({ status_set: next })} disabled={readOnly} />
                </>
            )}

            {route === 'choice' && (
                <div className="br-field">
                    <span className="br-field__label">Options</span>
                    {(data.options || []).length === 0 && <span className="br-field__hint">No options yet.</span>}
                    <ol className="br-inspector__options">
                        {(data.options || []).map((opt, i) => {
                            const req = describeCondition(opt.requires, { flag: flags, status: statuses });
                            return (
                                <li key={opt.id}>
                                    <span className="br-inspector__option-label">{opt.label || `Option ${i + 1}`}</span>
                                    {req && <span className="br-inspector__option-meta">Requires {req}</span>}
                                </li>
                            );
                        })}
                    </ol>
                    <span className="br-field__hint">Options, their effects and conditions are edited in the full editor.</span>
                </div>
            )}

            {route === 'warp' && (
                <div className="br-field">
                    <span className="br-field__label">Portal channel</span>
                    <span className="br-inspector__value">{data.portalChannel || 'Not connected'}</span>
                </div>
            )}

            {!readOnly && (
                <div className="br-inspector__actions">
                    <button className="br-btn" onClick={() => openNodeEditor(nodeId)}><Maximize2 />Open full editor</button>
                    {isStory && route !== 'ending' && !data.isStartNode && (
                        <button className="br-btn br-btn--ghost" onClick={() => store().setStartNode(nodeId)}><Star />Make start node</button>
                    )}
                </div>
            )}
        </div>
    );
}

function EdgeInspector({ edgeId, readOnly }) {
    const edge = useNarrativeStore(s => s.edges.find(e => e.id === edgeId));
    const flags = useNarrativeStore(s => s.flag);
    const statuses = useNarrativeStore(s => s.status);
    const sourceLabel = useNarrativeStore(s => { const e = s.edges.find(x => x.id === edgeId); const n = e && (s.common[e.sourceId] || s.choice[e.sourceId]); return n?.data?.label; });
    const targetLabel = useNarrativeStore(s => { const e = s.edges.find(x => x.id === edgeId); const n = e && (s.common[e.targetId] || s.choice[e.targetId] || s.ending[e.targetId]); return n?.data?.label; });
    const optionLabel = useNarrativeStore(s => { const e = s.edges.find(x => x.id === edgeId); return e?.optionId ? s.choice[e.sourceId]?.data?.options?.find(o => o.id === e.optionId)?.label : null; });

    if (!edge) return null;
    const condition = describeCondition(edge.condition, { flag: flags, status: statuses });

    return (
        <div className="br-inspector__form">
            <div className="br-inspector__kind"><span>Edge</span></div>
            <div className="br-inspector__route">
                <span className="br-inspector__value">{sourceLabel || 'Unknown'}</span>
                <span aria-hidden="true">→</span>
                <span className="br-inspector__value">{targetLabel || 'Unknown'}</span>
            </div>
            {optionLabel !== null && optionLabel !== undefined && (
                <span className="br-field__hint">From option "{optionLabel || 'Untitled option'}"</span>
            )}
            <div className="br-field">
                <label className="br-field__label" htmlFor="br-insp-edge-label">Label</label>
                <input id="br-insp-edge-label" className="br-input" value={edge.label || ''} disabled={readOnly}
                    onChange={e => useNarrativeStore.getState().updateEdge(edgeId, { label: e.target.value })} placeholder="Optional" />
            </div>
            <div className="br-field">
                <span className="br-field__label">Condition</span>
                <span className="br-inspector__value">{condition ? `Requires ${condition}` : 'None: this edge is always available.'}</span>
            </div>
            {!readOnly && (
                <div className="br-inspector__actions">
                    <button className="br-btn" onClick={() => openEdgeEditor(edgeId)}><Maximize2 />Edit condition</button>
                    <button className="br-btn br-btn--danger" onClick={() => useNarrativeStore.getState().deleteEdge(edgeId)}><Trash2 />Delete edge</button>
                </div>
            )}
        </div>
    );
}

const ALIGN_BUTTONS = [
    ['left', AlignStartVertical, 'Align left edges'],
    ['centerX', AlignCenterVertical, 'Align centres'],
    ['right', AlignEndVertical, 'Align right edges'],
    ['top', AlignStartHorizontal, 'Align top edges'],
    ['middleY', AlignCenterHorizontal, 'Align middles'],
    ['bottom', AlignEndHorizontal, 'Align bottom edges'],
    ['distributeX', AlignHorizontalDistributeCenter, 'Distribute horizontally'],
    ['distributeY', AlignVerticalDistributeCenter, 'Distribute vertically'],
];

function MultiInspector({ ids, readOnly }) {
    const chapters = useNarrativeStore(s => s.chapter);
    const paths = useNarrativeStore(s => s.path);
    const tags = useNarrativeStore(s => s.tag);

    const bulk = (fn) => {
        const st = useNarrativeStore.getState();
        beginGroup();
        ids.forEach(id => {
            const node = st.common[id] || st.choice[id] || st.ending[id];
            if (node) fn(st, id, node);
        });
        endGroup();
    };
    const setField = (key, value) => bulk((st, id) => st.updateNode(id, { data: { [key]: value } }));
    const addTag = (tagId) => bulk((st, id, node) => {
        const cur = node.data?.tagIds || [];
        if (!cur.includes(tagId)) st.updateNode(id, { data: { tagIds: [...cur, tagId] } });
    });

    return (
        <div className="br-inspector__form">
            <div className="br-inspector__kind"><span>{ids.length} nodes selected</span></div>
            {!readOnly && (
                <>
                    <div className="br-field">
                        <span className="br-field__label">Arrange</span>
                        <div className="br-inspector__align" role="group" aria-label="Align and distribute">
                            {ALIGN_BUTTONS.map(([mode, icon, title]) => {
                                const Icon = icon;
                                return (
                                    <button key={mode} className="br-btn br-btn--ghost br-btn--icon" title={title} aria-label={title}
                                        disabled={mode.startsWith('distribute') && ids.length < 3}
                                        onClick={() => window.dispatchEvent(new CustomEvent('canvas-align', { detail: { mode } }))}>
                                        <Icon />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="br-inspector__two">
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-bulk-chapter">Set chapter</label>
                            <select id="br-insp-bulk-chapter" className="br-select" value="__keep" onChange={e => setField('chapterId', e.target.value === '__none' ? null : e.target.value)}>
                                <option value="__keep" disabled>Choose…</option>
                                <option value="__none">None</option>
                                {values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-bulk-path">Set path</label>
                            <select id="br-insp-bulk-path" className="br-select" value="__keep" onChange={e => setField('pathId', e.target.value === '__none' ? null : e.target.value)}>
                                <option value="__keep" disabled>Choose…</option>
                                <option value="__none">None</option>
                                {values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {values(tags).length > 0 && (
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-insp-bulk-tag">Add a tag to all</label>
                            <select id="br-insp-bulk-tag" className="br-select" value="" onChange={e => e.target.value && addTag(e.target.value)}>
                                <option value="">Choose…</option>
                                {values(tags).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="br-inspector__actions">
                        <button className="br-btn" onClick={() => duplicateSelection()}><Copy />Duplicate</button>
                        <button className="br-btn br-btn--danger" onClick={() => { bulk((st, id) => st.deleteNode(id)); useUIStore.getState().clearSelection(); }}>
                            <Trash2 />Delete {ids.length}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function InspectorPanel() {
    const sel = useSelection();
    const readOnly = useSimulationStore(s => s.isCampaignActive);

    return (
        <div className="br-inspector">
            {sel.kind === 'none' && (
                <div className="br-empty">
                    <p className="br-empty__title">Nothing selected</p>
                    <p className="br-empty__text">Click a node or an edge on the canvas to see and edit it here. Shift-drag to select several nodes.</p>
                </div>
            )}
            {sel.kind === 'node' && <NodeInspector key={sel.id} nodeId={sel.id} readOnly={readOnly} />}
            {sel.kind === 'edge' && <EdgeInspector key={sel.id} edgeId={sel.id} readOnly={readOnly} />}
            {sel.kind === 'multi' && <MultiInspector ids={sel.ids} readOnly={readOnly} />}
        </div>
    );
}
