import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    AlignLeft,
    Route,
    Zap,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Check,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// SectionTitle — reusable section header inside the modal
// ---------------------------------------------------------------------------

function SectionTitle({ icon: Icon, title }) {
    return (
        <div className="ncm-section-title">
            <Icon className="ncm-section-title__icon" />
            <h4 className="ncm-section-title__label">{title}</h4>
        </div>
    );
}

// ---------------------------------------------------------------------------
// NodeConfigModal — public API
// ---------------------------------------------------------------------------

/**
 * NodeConfigModal
 *
 * Advanced node configuration modal. Opens at 860px (2-column) for Common/Choice
 * nodes and collapses to 420px (1-column) for Ending nodes.
 *
 * Left column  — Narrative Content (label, description) + Routing (chapter,
 *                path) + start-node toggle.
 * Right column — On-Enter Modifiers (flags set, status modifiers) + Branching
 *                Options (Choice) or Narrative Variants (Common). Hidden for Endings.
 *                NOTE: right column is currently static-preview UI; sub-array
 *                mutations (variants/options/sideEffects) must go through dedicated
 *                store actions per AR-13 when fully wired.
 *
 * Local state (AR-03 — all purely transient UI state):
 *   label        : controlled text input for node label
 *   description  : controlled textarea for node description
 *   chapterId    : controlled select for chapter assignment
 *   pathId       : controlled select for path assignment
 *   isStartNode  : boolean toggle for campaign start node
 *   logicMode    : 'AND' | 'OR' — condition logic toggle in variant builder
 *
 * Props:
 *   nodeType    {'Common'|'Choice'|'Ending'|null}  null = modal closed
 *   nodeId      {string|null}   ID of the node being edited (for onSave)
 *   onClose     {() => void}    Close without saving.
 *   onSave      {(id, data) => void}  Called with node id + payload on save.
 *   chapters    {Array}         [{ id, name }] Chapter dropdown options.
 *   paths       {Array}         [{ id, name }] Path dropdown options.
 *   flags       {Array}         [{ id, name }] Flag options (right column).
 *   statuses    {Array}         [{ id, name }] Status options (right column).
 *   initialData {object|null}   Pre-filled values for the node being edited.
 *     .label       {string}
 *     .description {string}
 *     .chapterId   {string|null}
 *     .pathId      {string|null}
 *     .isStartNode {boolean}
 *
 * Real-app wiring (invoked from App.jsx nodeConfigType state):
 *   nodeType      ← local useState('Common'|'Choice'|'Ending'|null) in App
 *   nodeId        ← uiStore.selectedNodeId
 *   onClose       → setNodeConfigType(null)
 *   onSave(id, d) → narrativeStore.updateNode(id, { data: { label, content: description,
 *                     chapterId, pathId } }) + narrativeStore.setStartNode(id) if toggled
 *   chapters      ← useNarrativeStore(s => Object.values(s.chapter))
 *   paths         ← useNarrativeStore(s => Object.values(s.path))
 *   flags         ← useNarrativeStore(s => Object.values(s.flag))
 *   statuses      ← useNarrativeStore(s => Object.values(s.status))
 *   initialData   ← look up node from narrativeStore by selectedNodeId
 */
export default function NodeConfigModal({
    nodeType = null,
    nodeId = null,
    onClose = () => { },
    onSave = () => { },
    chapters = [],
    paths = [],
    flags = [],
    statuses = [],
    initialData = null,
}) {
    // AR-03 — local UI state only; no store state held here
    const [label, setLabel] = useState(initialData?.label ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [chapterId, setChapterId] = useState(initialData?.chapterId ?? '');
    const [pathId, setPathId] = useState(initialData?.pathId ?? '');
    const [isStartNode, setIsStartNode] = useState(initialData?.isStartNode ?? false);
    const [logicMode, setLogicMode] = useState('AND');

    // Re-sync local state when initialData changes (new node opened)
    useEffect(() => {
        setLabel(initialData?.label ?? '');
        setDescription(initialData?.description ?? '');
        setChapterId(initialData?.chapterId ?? '');
        setPathId(initialData?.pathId ?? '');
        setIsStartNode(initialData?.isStartNode ?? false);
        setLogicMode('AND');
    }, [initialData, nodeType]);

    if (!nodeType) return null;

    const isEnding = nodeType === 'Ending';
    const isChoice = nodeType === 'Choice';

    const handleSave = () => {
        onSave(nodeId, {
            label,
            description,
            chapterId: chapterId || null,
            pathId: pathId || null,
            isStartNode,
        });
        onClose();
    };

    const handleKeyDown = (e) => {
        e.stopPropagation(); // mirrors NameModal — prevents global escape clearing selection
        if (e.key === 'Escape') onClose();
    };

    // Per-type accent colours (CSS classes defined below)
    const typeClass = isChoice ? 'ncm--choice' : isEnding ? 'ncm--ending' : 'ncm--common';

    return (
        <div className="ncm__backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
            <div
                className={`ncm ${typeClass} ${isEnding ? 'ncm--narrow' : 'ncm--wide'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="ncm__header">
                    <div className="ncm__header-left">
                        <span className={`ncm__type-badge ncm__type-badge--${nodeType.toLowerCase()}`}>
                            {nodeType} Node
                        </span>
                        <h3 className="ncm__title">Configure Node</h3>
                    </div>
                    <button onClick={onClose} className="ncm__close-btn" title="Close">
                        <X className="ncm__close-icon" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="ncm__body">

                    {/* LEFT COLUMN: Narrative & Routing */}
                    <div className={`ncm__col ncm__col--left ${isEnding ? 'ncm__col--full' : ''}`}>

                        <SectionTitle icon={AlignLeft} title="Narrative Content" />

                        {/* Label */}
                        <div className="ncm__field">
                            <label className="ncm__label">Node Label</label>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Node label..."
                                className="ncm__input"
                            />
                        </div>

                        {/* Description */}
                        <div className="ncm__field ncm__field--grow">
                            <label className="ncm__label">Description / Text</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Node description or narrative text..."
                                className="ncm__textarea"
                            />
                        </div>

                        <SectionTitle icon={Route} title="Routing & Placement" />

                        {/* Chapter + Path dropdowns */}
                        <div className="ncm__row">
                            <div className="ncm__field">
                                <label className="ncm__label">Chapter</label>
                                <div className="ncm__select-wrap">
                                    <select
                                        value={chapterId}
                                        onChange={e => setChapterId(e.target.value)}
                                        className="ncm__select"
                                    >
                                        <option value="">None</option>
                                        {chapters.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="ncm__select-chevron" />
                                </div>
                            </div>
                            <div className="ncm__field">
                                <label className="ncm__label">Path</label>
                                <div className="ncm__select-wrap">
                                    <select
                                        value={pathId}
                                        onChange={e => setPathId(e.target.value)}
                                        className="ncm__select"
                                    >
                                        <option value="">None</option>
                                        {paths.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="ncm__select-chevron" />
                                </div>
                            </div>
                        </div>

                        {/* Start Node toggle */}
                        <div className="ncm__start-toggle">
                            <div>
                                <div className="ncm__start-toggle-title">Set as Start Node</div>
                                <div className="ncm__start-toggle-hint">Campaigns begin execution here.</div>
                            </div>
                            <button
                                onClick={() => setIsStartNode(!isStartNode)}
                                className={`ncm__toggle-btn ${isStartNode ? 'ncm__toggle-btn--on' : ''}`}
                                title="Toggle start node"
                            >
                                <div className={`ncm__toggle-thumb ${isStartNode ? 'ncm__toggle-thumb--on' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Logic & Effects (hidden for Endings) */}
                    {!isEnding && (
                        <div className="ncm__col ncm__col--right">

                            {/* On-Enter Modifiers */}
                            <div>
                                <SectionTitle icon={Zap} title="On-Enter Modifiers" />
                                <div className="ncm__modifiers-card">

                                    {/* Set Flags */}
                                    <div>
                                        <label className="ncm__label ncm__label--spaced">Set Flags (True)</label>
                                        <div className="ncm__tag-row">
                                            <span className="ncm__flag-tag">
                                                has_lantern{' '}
                                                <button className="ncm__tag-remove" title="Remove">
                                                    <X className="ncm__tag-remove-icon" />
                                                </button>
                                            </span>
                                            <button className="ncm__add-tag-btn">
                                                <Plus className="ncm__add-tag-icon" /> Add Flag
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ncm__divider" />

                                    {/* Status Modifiers */}
                                    <div>
                                        <label className="ncm__label ncm__label--spaced">Status Modifiers</label>
                                        <div className="ncm__status-rows">
                                            <div className="ncm__status-row">
                                                <select className="ncm__status-select">
                                                    {statuses.length > 0
                                                        ? statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                                        : <option>courage</option>
                                                    }
                                                </select>
                                                <select className="ncm__status-op">
                                                    <option>+=</option>
                                                    <option>-=</option>
                                                    <option>=</option>
                                                </select>
                                                <input type="number" defaultValue={1} className="ncm__status-val" />
                                                <button className="ncm__status-del" title="Remove">
                                                    <Trash2 className="ncm__status-del-icon" />
                                                </button>
                                            </div>
                                            <button className="ncm__add-wide-btn">
                                                <Plus className="ncm__add-tag-icon" /> Add Status Modifier
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Variants (Common) or Options (Choice) */}
                            <div>
                                <SectionTitle
                                    icon={SlidersHorizontal}
                                    title={isChoice ? 'Branching Options' : 'Narrative Variants'}
                                />
                                <div className="ncm__variants">

                                    {/* Example expandable card */}
                                    <div className="ncm__variant-card">
                                        <div className="ncm__variant-header">
                                            <div className="ncm__variant-header-left">
                                                <ChevronUp className="ncm__variant-chevron" />
                                                <span className="ncm__variant-name">
                                                    {isChoice ? 'Option 1' : 'Variant 1'}
                                                </span>
                                            </div>
                                            <button className="ncm__variant-del" title="Delete">
                                                <Trash2 className="ncm__variant-del-icon" />
                                            </button>
                                        </div>

                                        <div className="ncm__variant-body">
                                            <input
                                                type="text"
                                                placeholder={isChoice ? "Option text (e.g., 'Open the door')" : 'Internal variant name'}
                                                defaultValue={isChoice ? 'Head north to the glow' : 'Has Lantern Variant'}
                                                className="ncm__input ncm__input--xs"
                                            />

                                            {/* Conditions builder */}
                                            <div className="ncm__condition-box">
                                                <div className="ncm__condition-header">
                                                    <span className="ncm__label">Requires Condition</span>

                                                    {/* AND/OR segmented control */}
                                                    <div className="ncm__logic-toggle">
                                                        <div className={`ncm__logic-thumb ${logicMode === 'AND' ? 'ncm__logic-thumb--and' : 'ncm__logic-thumb--or'}`} />
                                                        <button
                                                            onClick={() => setLogicMode('AND')}
                                                            className={`ncm__logic-btn ${logicMode === 'AND' ? 'ncm__logic-btn--active' : ''}`}
                                                        >AND</button>
                                                        <button
                                                            onClick={() => setLogicMode('OR')}
                                                            className={`ncm__logic-btn ${logicMode === 'OR' ? 'ncm__logic-btn--active' : ''}`}
                                                        >OR</button>
                                                    </div>
                                                </div>

                                                <div className="ncm__condition-list">
                                                    <div className="ncm__condition-row">
                                                        <span className="ncm__condition-pill ncm__condition-pill--flag">FLAG</span>
                                                        <span className="ncm__condition-name">has_lantern</span>
                                                        <span className="ncm__condition-value ncm__condition-value--true">TRUE</span>
                                                        <button className="ncm__condition-del" title="Remove">
                                                            <X className="ncm__tag-remove-icon" />
                                                        </button>
                                                    </div>
                                                    <div className="ncm__clause-row">
                                                        <button className="ncm__clause-btn">+ Flag Clause</button>
                                                        <button className="ncm__clause-btn">+ Status Clause</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Choice-only: on-select modifiers */}
                                            {isChoice && (
                                                <div className="ncm__condition-box">
                                                    <span className="ncm__label ncm__label--spaced">On-Select Modifiers</span>
                                                    <button className="ncm__add-wide-btn">+ Add Specific Modifier</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add variant/option button */}
                                    <button className="ncm__add-variant-btn">
                                        <Plus className="ncm__add-tag-icon" /> Add {isChoice ? 'Option' : 'Variant'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="ncm__footer">
                    <button onClick={onClose} className="button">Cancel</button>
                    <button onClick={handleSave} className="button button--primary ncm__save-btn">
                        <Check className="ncm__save-icon" /> Save Node
                    </button>
                </div>
            </div>
        </div>
    );
}
