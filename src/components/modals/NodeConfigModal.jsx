import React, { useState, useEffect } from 'react';
import {
    X, Check, AlignLeft, Route, Zap, SlidersHorizontal,
    ChevronUp, Plus, Trash2, ChevronRight, Star
} from 'lucide-react';
import { useNarrativeStore } from 'store';
import './NodeConfigModal.css';

// CHANGED: Phase 6 — Replaced legacy NodeInspector docked panel → full-screen 2-column modal

// CHANGED: Common and Ending types are user-defined in narrativeStore.commonType / endingType
// Not hardcoded — user creates them via the left sidebar (LeftSidebar > Node Types section)

// -- Sub-component: Section Title --
function SectionTitle({ icon: Icon, title }) {
    return (
        <div className="ncm-section-title">
            <Icon className="ncm-section-title__icon" style={{ width: 14, height: 14 }} />
            <h4 className="ncm-section-title__text">{title}</h4>
        </div>
    );
}

// -- Sub-component: Condition Builder (shared by Variants and Options) --
function ConditionBuilder({ requires, flags, statuses, onChange }) {
    const handleToggle = () => {
        if (requires) {
            onChange(null);
        } else {
            onChange({ operator: 'and', conditions: [] });
        }
    };

    const updateOperator = (op) => {
        onChange({ ...requires, operator: op });
    };

    const addFlagClause = () => {
        const clause = { flag: flags[0]?.id || '', state: true };
        onChange({ ...requires, conditions: [...requires.conditions, clause] });
    };

    const addStatusClause = () => {
        const clause = { status: statuses[0]?.id || '', min: 0 };
        onChange({ ...requires, conditions: [...requires.conditions, clause] });
    };

    const updateClause = (idx, patch) => {
        const updated = [...requires.conditions];
        updated[idx] = { ...updated[idx], ...patch };
        onChange({ ...requires, conditions: updated });
    };

    const removeClause = (idx) => {
        const updated = [...requires.conditions];
        updated.splice(idx, 1);
        onChange({ ...requires, conditions: updated });
    };

    return (
        <div className="ncm-condition-box">
            <div className="ncm-condition-header">
                <span className="ncm-condition-label">Requires Condition</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {requires && (
                        <div className="ncm-operator-toggle">
                            <button
                                className={`ncm-operator-btn ${requires.operator === 'and' ? 'ncm-operator-btn--active' : 'ncm-operator-btn--inactive'}`}
                                onClick={() => updateOperator('and')}
                            >AND</button>
                            <button
                                className={`ncm-operator-btn ${requires.operator === 'or' ? 'ncm-operator-btn--active' : 'ncm-operator-btn--inactive'}`}
                                onClick={() => updateOperator('or')}
                            >OR</button>
                        </div>
                    )}
                    <button className="ncm-add-btn" onClick={handleToggle} style={{ fontSize: 10 }}>
                        {requires
                            ? <><X style={{ width: 10, height: 10 }} /> Remove</>
                            : <><Plus style={{ width: 10, height: 10 }} /> Add Condition</>}
                    </button>
                </div>
            </div>

            {requires && (
                <div>
                    {requires.conditions.map((clause, idx) => {
                        if ('flag' in clause) {
                            return (
                                <div key={idx} className="ncm-clause-row">
                                    <span className="ncm-clause-type ncm-clause-type--flag">FLAG</span>
                                    <select
                                        className="ncm-clause-select"
                                        value={clause.flag || ''}
                                        onChange={e => updateClause(idx, { flag: e.target.value })}
                                    >
                                        {!clause.flag && <option value="">Select flag...</option>}
                                        {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                    <button
                                        className="ncm-clause-value"
                                        onClick={() => updateClause(idx, { state: !clause.state })}
                                        style={{ color: clause.state ? 'var(--color-emerald-500)' : '#f87171' }}
                                    >
                                        {clause.state ? 'TRUE' : 'FALSE'}
                                    </button>
                                    <button className="ncm-remove-btn" onClick={() => removeClause(idx)}>
                                        <X style={{ width: 12, height: 12 }} />
                                    </button>
                                </div>
                            );
                        } else if ('status' in clause) {
                            return (
                                <div key={idx} className="ncm-clause-row">
                                    <span className="ncm-clause-type ncm-clause-type--status">STAT</span>
                                    <select
                                        className="ncm-clause-select"
                                        value={clause.status || ''}
                                        onChange={e => updateClause(idx, { status: e.target.value })}
                                    >
                                        {!clause.status && <option value="">Select status...</option>}
                                        {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input
                                        type="number" className="ncm-clause-number" placeholder="Min"
                                        value={clause.min !== undefined ? clause.min : ''}
                                        onChange={e => updateClause(idx, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    />
                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>≤</span>
                                    <input
                                        type="number" className="ncm-clause-number" placeholder="Max"
                                        value={clause.max !== undefined ? clause.max : ''}
                                        onChange={e => updateClause(idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    />
                                    <button className="ncm-remove-btn" onClick={() => removeClause(idx)}>
                                        <X style={{ width: 12, height: 12 }} />
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })}
                    <div className="ncm-add-clause-row">
                        <button className="ncm-add-btn" onClick={addFlagClause}>+ Flag Clause</button>
                        {statuses.length > 0 && (
                            <button className="ncm-add-btn" onClick={addStatusClause}>+ Status Clause</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// -- Sub-component: Variant Card (Common node) --
// FIX 3: Requires Condition moved ABOVE the narrative text field
function VariantCard({ nodeId, variant, index, flags, statuses }) {
    const [expanded, setExpanded] = useState(false);
    const updateVariant = useNarrativeStore(s => s.updateVariant);
    const deleteVariant = useNarrativeStore(s => s.deleteVariant);

    return (
        <div className="ncm-card">
            <div className="ncm-card__header" onClick={() => setExpanded(v => !v)}>
                <div className="ncm-card__header-left">
                    {expanded
                        ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--color-text-secondary)' }} />
                        : <ChevronRight style={{ width: 14, height: 14, color: 'var(--color-text-secondary)' }} />
                    }
                    <span className="ncm-card__title">
                        {variant.label && variant.label.trim() ? variant.label : `Variant ${index + 1}`}
                    </span>
                </div>
                <button className="ncm-remove-btn" onClick={e => { e.stopPropagation(); deleteVariant(nodeId, variant.id); }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                </button>
            </div>
            {expanded && (
                <div className="ncm-card__body">
                    <div className="ncm-field">
                        <label className="ncm-label">Internal Name</label>
                        <input
                            className="ncm-input"
                            type="text"
                            value={variant.label || ''}
                            onChange={e => updateVariant(nodeId, variant.id, { label: e.target.value })}
                            placeholder={`Variant ${index + 1}`}
                        />
                    </div>
                    {/* FIX 3: Condition placed ABOVE narrative text */}
                    <ConditionBuilder
                        requires={variant.requires}
                        flags={flags}
                        statuses={statuses}
                        onChange={val => updateVariant(nodeId, variant.id, { requires: val })}
                    />
                    <div className="ncm-field">
                        <label className="ncm-label">Narrative Text</label>
                        <textarea
                            className="ncm-textarea"
                            rows={3}
                            value={variant.text || ''}
                            onChange={e => updateVariant(nodeId, variant.id, { text: e.target.value })}
                            placeholder="Variant content shown when condition matches..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// -- Sub-component: Option Card (Choice node) --
// FIX 8: Card title shows option.label if filled, fallback to "Option N"
function OptionCard({ nodeId, option, index, flags, statuses }) {
    const [expanded, setExpanded] = useState(false);
    const updateOption = useNarrativeStore(s => s.updateOption);
    const deleteOption = useNarrativeStore(s => s.deleteOption);

    const toggleFlagSet = (flagId) => {
        const current = option.flags_set || [];
        const next = current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId];
        updateOption(nodeId, option.id, { flags_set: next });
    };

    const addStatusEffect = () => {
        updateOption(nodeId, option.id, {
            status_set: [...(option.status_set || []), { statusId: statuses[0]?.id || '', amount: 0 }]
        });
    };

    const updateStatusEffect = (idx, patch) => {
        const updated = [...(option.status_set || [])];
        updated[idx] = { ...updated[idx], ...patch };
        updateOption(nodeId, option.id, { status_set: updated });
    };

    const removeStatusEffect = (idx) => {
        const updated = [...(option.status_set || [])];
        updated.splice(idx, 1);
        updateOption(nodeId, option.id, { status_set: updated });
    };

    // FIX 8: Use filled option.label as title or fall back
    const cardTitle = option.label && option.label.trim() ? option.label : `Option ${index + 1}`;

    return (
        <div className="ncm-card">
            <div className="ncm-card__header" onClick={() => setExpanded(v => !v)}>
                <div className="ncm-card__header-left">
                    {expanded
                        ? <ChevronUp style={{ width: 14, height: 14, color: 'var(--color-text-secondary)' }} />
                        : <ChevronRight style={{ width: 14, height: 14, color: 'var(--color-text-secondary)' }} />
                    }
                    <span className="ncm-card__title">{cardTitle}</span>
                </div>
                <button className="ncm-remove-btn" onClick={e => { e.stopPropagation(); deleteOption(nodeId, option.id); }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                </button>
            </div>
            {expanded && (
                <div className="ncm-card__body">
                    <div className="ncm-field">
                        <label className="ncm-label">Option Text</label>
                        <input
                            className="ncm-input"
                            type="text"
                            value={option.label || ''}
                            onChange={e => updateOption(nodeId, option.id, { label: e.target.value })}
                            placeholder={`Option ${index + 1} label...`}
                        />
                    </div>
                    <ConditionBuilder
                        requires={option.requires}
                        flags={flags}
                        statuses={statuses}
                        onChange={val => updateOption(nodeId, option.id, { requires: val })}
                    />
                    {flags.length > 0 && (
                        <div className="ncm-field">
                            <label className="ncm-label">On-Select: Set Flags</label>
                            <div className="ncm-flags-tags">
                                {(option.flags_set || []).map(flagId => {
                                    const f = flags.find(fl => fl.id === flagId);
                                    return f ? (
                                        <span key={flagId} className="ncm-flag-tag">
                                            {f.name}
                                            <button className="ncm-flag-tag__remove" onClick={() => toggleFlagSet(flagId)}>
                                                <X style={{ width: 10, height: 10 }} />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                                {flags.filter(f => !(option.flags_set || []).includes(f.id)).map(f => (
                                    <button key={f.id} className="ncm-add-btn" onClick={() => toggleFlagSet(f.id)}>
                                        <Plus style={{ width: 10, height: 10 }} /> {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {statuses.length > 0 && (
                        <div className="ncm-field">
                            <label className="ncm-label">On-Select: Status Modifiers</label>
                            {(option.status_set || []).map((se, idx) => (
                                <div key={idx} className="ncm-status-row" style={{ marginBottom: 6 }}>
                                    <select
                                        className="ncm-select"
                                        value={se.statusId || ''}
                                        onChange={e => updateStatusEffect(idx, { statusId: e.target.value })}
                                    >
                                        {!se.statusId && <option value="">Select status...</option>}
                                        {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        className="ncm-status-amount"
                                        value={se.amount ?? 0}
                                        onChange={e => updateStatusEffect(idx, { amount: Number(e.target.value) })}
                                    />
                                    <button className="ncm-remove-btn" onClick={() => removeStatusEffect(idx)}>
                                        <Trash2 style={{ width: 13, height: 13 }} />
                                    </button>
                                </div>
                            ))}
                            <button className="ncm-add-btn" onClick={addStatusEffect}>
                                <Plus style={{ width: 10, height: 10 }} /> Add Status Modifier
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// -- Main Component --
export default function NodeConfigModal({ nodeId, onClose, onCancel }) {
    // onCancel: called when user exits without saving (new node — deletes orphan)
    // onClose:  called when user saves / confirms (keeps node)
    // If onCancel is not provided, backdrop/Cancel falls back to onClose (edit flow)
    const handleCancel = onCancel || onClose;
    // PRESERVED: All store mutations through narrativeStore actions (AR-04)
    const nodeType = useNarrativeStore(s => {
        if (!nodeId) return undefined;
        if (s.common[nodeId]) return 'common';
        if (s.choice[nodeId]) return 'choice';
        if (s.ending[nodeId]) return 'ending';
        return undefined;
    });

    const node = useNarrativeStore(s => {
        if (!nodeId) return undefined;
        return s.common[nodeId] || s.choice[nodeId] || s.ending[nodeId];
    });

    // PRESERVED: Per-slice selectors (AR-23)
    const flags = Object.values(useNarrativeStore(s => s.flag) || {});
    const statuses = Object.values(useNarrativeStore(s => s.status) || {});
    const paths = Object.values(useNarrativeStore(s => s.path) || {});
    const chapters = Object.values(useNarrativeStore(s => s.chapter) || {});
    // FIX 9: Read user-defined types from store, not hardcoded presets
    const commonTypes = Object.values(useNarrativeStore(s => s.commonType) || {});
    const endingTypes = Object.values(useNarrativeStore(s => s.endingType) || {});

    const updateNode = useNarrativeStore(s => s.updateNode);
    const setStartNode = useNarrativeStore(s => s.setStartNode);
    const addVariant = useNarrativeStore(s => s.addVariant);
    const addOption = useNarrativeStore(s => s.addOption);

    // Close on Escape — use handleCancel so new-node orphan is deleted on ESC
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') handleCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleCancel]);

    if (!node) return null;
    const data = node.data || {};
    const isEnding = nodeType === 'ending';
    const isChoice = nodeType === 'choice';
    const isCommon = nodeType === 'common';

    const typeBadgeClass = isChoice ? 'ncm-type-badge--choice' : isEnding ? 'ncm-type-badge--ending' : 'ncm-type-badge--common';

    const patch = (field, value) => updateNode(node.id, { data: { ...data, [field]: value } });

    const toggleFlag = (flagId) => {
        const current = data.flags_set || [];
        const next = current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId];
        patch('flags_set', next);
    };

    const addStatusEffect = () => {
        patch('status_set', [...(data.status_set || []), { statusId: statuses[0]?.id || '', amount: 0 }]);
    };

    const updateStatusEffect = (idx, p) => {
        const updated = [...(data.status_set || [])];
        updated[idx] = { ...updated[idx], ...p };
        patch('status_set', updated);
    };

    const removeStatusEffect = (idx) => {
        const updated = [...(data.status_set || [])];
        updated.splice(idx, 1);
        patch('status_set', updated);
    };

    // FIX 9: Use store-based type lists, not hardcoded constants
    const typeOptions = isCommon ? commonTypes : isEnding ? endingTypes : [];
    const currentSubTypeId = data.nodeSubTypeId || '';
    const subTypeLabel = typeOptions.find(t => t.id === currentSubTypeId)?.name;

    // The header badge text: use subtype name if set, fallback to nodeType
    const badgeText = subTypeLabel
        ? subTypeLabel.toUpperCase()
        : nodeType?.toUpperCase();

    return (
        <div className="ncm-backdrop" onClick={handleCancel}>
            <div
                className={`ncm-container ${isEnding ? 'ncm-container--narrow' : 'ncm-container--wide'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="ncm-header">
                    <div className="ncm-header__left">
                        {/* FIX 6: Badge shows subtype name if set */}
                        <span className={`ncm-type-badge ${typeBadgeClass}`}>
                            {badgeText}
                        </span>
                        <h3 className="ncm-header__title">Configure Node</h3>
                    </div>
                    <button className="ncm-close-btn" onClick={onClose}>
                        <X style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                {/* Body */}
                <div className="ncm-body">

                    {/* LEFT COLUMN: Narrative & Routing */}
                    <div className={`ncm-col ${isEnding ? 'ncm-col--left-only' : 'ncm-col--left'}`}>
                        <div>
                            <SectionTitle icon={AlignLeft} title="Narrative Content" />
                            {/* FIX 4: Label first */}
                            <div className="ncm-field" style={{ marginBottom: 14 }}>
                                <label className="ncm-label">Node Label</label>
                                <input
                                    className="ncm-input"
                                    type="text"
                                    value={data.label || ''}
                                    onChange={e => patch('label', e.target.value)}
                                    placeholder="Enter node label..."
                                />
                            </div>

                            {/* FIX 4: Chapter & Path immediately below label */}
                            <div className="ncm-row" style={{ marginBottom: 14 }}>
                                <div className="ncm-field">
                                    <label className="ncm-label">Chapter</label>
                                    <select
                                        className="ncm-select"
                                        value={data.chapterId || ''}
                                        onChange={e => patch('chapterId', e.target.value || null)}
                                    >
                                        <option value="">None</option>
                                        {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="ncm-field">
                                    <label className="ncm-label">Path</label>
                                    <select
                                        className="ncm-select"
                                        value={data.pathId || ''}
                                        onChange={e => patch('pathId', e.target.value || null)}
                                    >
                                        <option value="">None</option>
                                        {paths.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* FIX 9: Common / Ending sub-type — from user-defined store types */}
                            {(isCommon || isEnding) && (
                                <div className="ncm-field" style={{ marginBottom: 14 }}>
                                    <label className="ncm-label">{isCommon ? 'Common Type' : 'Ending Type'}</label>
                                    {typeOptions.length === 0 ? (
                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '6px 0' }}>
                                            No {isCommon ? 'common' : 'ending'} types defined yet. Add them in the left sidebar.
                                        </div>
                                    ) : (
                                        <select
                                            className="ncm-select"
                                            value={data.nodeSubTypeId || ''}
                                            onChange={e => patch('nodeSubTypeId', e.target.value || null)}
                                        >
                                            <option value="">None</option>
                                            {typeOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div className="ncm-field">
                                <label className="ncm-label">Description / Content</label>
                                <textarea
                                    className="ncm-textarea"
                                    rows={5}
                                    value={data.content || ''}
                                    onChange={e => patch('content', e.target.value)}
                                    placeholder="Narrative text for this node..."
                                />
                            </div>
                        </div>

                        {/* FIX 7: Set Start Node as a button, not a toggle */}
                        {!isEnding && (
                            <div>
                                <SectionTitle icon={Star} title="Campaign Start" />
                                <button
                                    className={`ncm-start-btn ${data.isStartNode ? 'ncm-start-btn--active' : ''}`}
                                    onClick={() => setStartNode(node.id)}
                                    disabled={data.isStartNode}
                                >
                                    <Star style={{ width: 14, height: 14, fill: data.isStartNode ? 'currentColor' : 'none' }} />
                                    {data.isStartNode ? 'This is the Start Node ✓' : 'Set as Start Node'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Logic & Effects (hidden for Ending) */}
                    {!isEnding && (
                        <div className="ncm-col ncm-col--right">
                            {/* On-Enter Modifiers */}
                            <div>
                                <SectionTitle icon={Zap} title="On-Enter Modifiers" />
                                <div className="ncm-modifiers-box">
                                    <div>
                                        <label className="ncm-label" style={{ display: 'block', marginBottom: 8 }}>Set Flags (True)</label>
                                        <div className="ncm-flags-tags">
                                            {(data.flags_set || []).map(flagId => {
                                                const f = flags.find(fl => fl.id === flagId);
                                                return f ? (
                                                    <span key={flagId} className="ncm-flag-tag">
                                                        {f.name}
                                                        <button className="ncm-flag-tag__remove" onClick={() => toggleFlag(flagId)}>
                                                            <X style={{ width: 10, height: 10 }} />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                            {flags.filter(f => !(data.flags_set || []).includes(f.id)).map(f => (
                                                <button key={f.id} className="ncm-add-btn" onClick={() => toggleFlag(f.id)}>
                                                    <Plus style={{ width: 10, height: 10 }} /> {f.name}
                                                </button>
                                            ))}
                                            {flags.length === 0 && (
                                                <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>No flags defined.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                                        <label className="ncm-label" style={{ display: 'block', marginBottom: 8 }}>Status Modifiers</label>
                                        {(data.status_set || []).map((se, idx) => (
                                            <div key={idx} className="ncm-status-row" style={{ marginBottom: 6 }}>
                                                <select
                                                    className="ncm-select"
                                                    value={se.statusId || ''}
                                                    onChange={e => updateStatusEffect(idx, { statusId: e.target.value })}
                                                >
                                                    {!se.statusId && <option value="">Select status...</option>}
                                                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    className="ncm-status-amount"
                                                    value={se.amount ?? 0}
                                                    onChange={e => updateStatusEffect(idx, { amount: Number(e.target.value) })}
                                                />
                                                <button className="ncm-remove-btn" onClick={() => removeStatusEffect(idx)}>
                                                    <Trash2 style={{ width: 13, height: 13 }} />
                                                </button>
                                            </div>
                                        ))}
                                        <button className="ncm-add-btn" onClick={addStatusEffect}>
                                            <Plus style={{ width: 10, height: 10 }} /> Add Status Modifier
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Variants (Common) or Options (Choice) */}
                            <div>
                                <SectionTitle icon={SlidersHorizontal} title={isChoice ? 'Branching Options' : 'Narrative Variants'} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {isCommon && (data.variants || []).map((v, i) => (
                                        <VariantCard
                                            key={v.id}
                                            nodeId={node.id}
                                            variant={v}
                                            index={i}
                                            flags={flags}
                                            statuses={statuses}
                                        />
                                    ))}
                                    {isChoice && (data.options || []).map((opt, i) => (
                                        <OptionCard
                                            key={opt.id}
                                            nodeId={node.id}
                                            option={opt}
                                            index={i}
                                            flags={flags}
                                            statuses={statuses}
                                        />
                                    ))}
                                    <button
                                        className="ncm-add-btn"
                                        style={{ width: '100%', justifyContent: 'center', padding: '8px', marginTop: 4 }}
                                        onClick={() => isChoice
                                            ? addOption(node.id, { label: `Option ${(data.options || []).length + 1}` })
                                            : addVariant(node.id, { label: `Variant ${(data.variants || []).length + 1}` })
                                        }
                                    >
                                        <Plus style={{ width: 12, height: 12 }} />
                                        Add {isChoice ? 'Option' : 'Variant'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="ncm-footer">
                    <button className="ncm-btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="ncm-btn-save" onClick={onClose}>
                        <Check style={{ width: 14, height: 14 }} /> Save Node
                    </button>
                </div>
            </div>
        </div>
    );
}
