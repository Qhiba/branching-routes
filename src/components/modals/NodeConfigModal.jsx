import React, { useState, useRef, useEffect } from 'react';
import {
    X, Check, AlignLeft, Route, Zap, SlidersHorizontal,
    ChevronUp, ChevronDown, Plus, Trash2, ChevronRight, Star, Eye
} from 'lucide-react';
import { useNarrativeStore, useSimulationStore } from 'store';
import './NodeConfigModal.css';

// CHANGED: Phase 6 — Replaced legacy NodeInspector docked panel → full-screen 2-column modal

// CHANGED: Common and Ending types are user-defined in narrativeStore.commonType / endingType
// Not hardcoded — user creates them via the left sidebar (LeftSidebar > Node Types section)

// -- Sub-component: Section Title --
function SectionTitle({ icon: Icon, title }) {
    return (
        <div className="br-node-config-modal__section-title">
            <Icon className="br-node-config-modal__section-title__icon" />
            <h4 className="br-node-config-modal__section-title__text">{title}</h4>
        </div>
    );
}

// EXPLORE: Feature 1 & 2 - Searchable dropdown wrapper — dropdown uses position:fixed to escape overflow-clipping ancestors
function SearchableSelect({ value, options, onChange, placeholder, className }) {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [query, setQuery] = useState('');
    const triggerRef = useRef(null);
    const selected = options.find(o => o.id === value);

    const handleOpen = (e) => {
        e.stopPropagation();
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const DROPDOWN_HEIGHT = 220; // search input (~36px) + ~5 options
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const spaceAbove = rect.top - 8;
            const openUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
            const maxHeight = Math.min(DROPDOWN_HEIGHT, openUpward ? spaceAbove : spaceBelow);

            setDropdownStyle(
                openUpward
                    ? {
                        position: 'fixed',
                        bottom: window.innerHeight - rect.top + 4,
                        left: rect.left,
                        width: rect.width,
                        maxHeight,
                        zIndex: 9999,
                    }
                    : {
                        position: 'fixed',
                        top: rect.bottom + 4,
                        left: rect.left,
                        width: rect.width,
                        maxHeight,
                        zIndex: 9999,
                    }
            );
        }
        setOpen(prev => !prev);
    };

    return (
        <div className={`br-node-config-modal__searchable-select ${className || ''}`}>
            <div ref={triggerRef} className="br-node-config-modal__searchable-select__trigger" onClick={handleOpen}>
                <span className="br-node-config-modal__searchable-select__value">{selected ? selected.name : <span className="br-node-config-modal__searchable-select__placeholder">{placeholder}</span>}</span>
                <span className="br-node-config-modal__searchable-select__caret">▾</span>
            </div>
            {open && (
                <div className="br-node-config-modal__searchable-select__dropdown br-node-config-modal__searchable-select__dropdown--fixed" style={dropdownStyle} onClick={e => e.stopPropagation()}>
                    <input type="text" autoFocus placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="br-node-config-modal__input br-node-config-modal__searchable-select__search" />
                    <div className="br-node-config-modal__searchable-select__options">
                        {options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).map(o => (
                            <div key={o.id} className="br-node-config-modal__searchable-select__option" onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}>
                                {o.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {open && <div className="br-node-config-modal__searchable-select__backdrop" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />}
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
        <div className="br-node-config-modal__condition-box">
            <div className="br-node-config-modal__condition-header">
                <span className="br-node-config-modal__condition-label">Requires Condition</span>
                <div className="br-node-config-modal__flex-row">
                    {requires && (
                        <div className="br-node-config-modal__operator-toggle">
                            <button
                                className={`br-node-config-modal__operator-btn ${requires.operator === 'and' ? 'br-node-config-modal__operator-btn--active' : 'br-node-config-modal__operator-btn--inactive'}`}
                                onClick={() => updateOperator('and')}
                            >AND</button>
                            <button
                                className={`br-node-config-modal__operator-btn ${requires.operator === 'or' ? 'br-node-config-modal__operator-btn--active' : 'br-node-config-modal__operator-btn--inactive'}`}
                                onClick={() => updateOperator('or')}
                            >OR</button>
                        </div>
                    )}
                    <button className="br-node-config-modal__add-btn br-node-config-modal__add-btn--sm" onClick={handleToggle}>
                        {requires
                            ? <><X className="br-node-config-modal__icon-xs" /> Remove</>
                            : <><Plus className="br-node-config-modal__icon-xs" /> Add Condition</>}
                    </button>
                </div>
            </div>

            {requires && (
                <div>
                    {requires.conditions.map((clause, idx) => {
                        if ('flag' in clause) {
                            return (
                                <div key={idx} className="br-node-config-modal__clause-row">
                                    <span className="br-node-config-modal__clause-type br-node-config-modal__clause-type--flag">FLAG</span>
                                    {/* EXPLORE: Searchable filter */}
                                    <SearchableSelect
                                        className="br-node-config-modal__clause-select"
                                        value={clause.flag || ''}
                                        onChange={val => updateClause(idx, { flag: val })}
                                        options={flags}
                                        placeholder="Select flag..."
                                    />
                                    <button
                                        onClick={() => updateClause(idx, { state: !clause.state })}
                                        className={`br-node-config-modal__clause-value ${clause.state ? 'br-node-config-modal__clause-value--true' : 'br-node-config-modal__clause-value--false'}`}
                                    >
                                        {clause.state ? 'TRUE' : 'FALSE'}
                                    </button>
                                    <button className="br-node-config-modal__remove-btn" onClick={() => removeClause(idx)}>
                                        <X className="br-node-config-modal__icon-sm" />
                                    </button>
                                </div>
                            );
                        } else if ('status' in clause) {
                            return (
                                <div key={idx} className="br-node-config-modal__clause-row">
                                    <span className="br-node-config-modal__clause-type br-node-config-modal__clause-type--status">STAT</span>
                                    {/* EXPLORE: Searchable filter */}
                                    <SearchableSelect
                                        className="br-node-config-modal__clause-select"
                                        value={clause.status || ''}
                                        onChange={val => updateClause(idx, { status: val })}
                                        options={statuses}
                                        placeholder="Select status..."
                                    />
                                    <input
                                        type="number" className="br-node-config-modal__clause-number" placeholder="Min"
                                        value={clause.min !== undefined ? clause.min : ''}
                                        onChange={e => updateClause(idx, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    />
                                    <span className="br-node-config-modal__clause-sep">≤</span>
                                    <input
                                        type="number" className="br-node-config-modal__clause-number" placeholder="Max"
                                        value={clause.max !== undefined ? clause.max : ''}
                                        onChange={e => updateClause(idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                                    />
                                    <button className="br-node-config-modal__remove-btn" onClick={() => removeClause(idx)}>
                                        <X className="br-node-config-modal__icon-sm" />
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    })}
                    <div className="br-node-config-modal__add-clause-row">
                        <button className="br-node-config-modal__add-btn" onClick={addFlagClause}>+ Flag Clause</button>
                        {statuses.length > 0 && (
                            <button className="br-node-config-modal__add-btn" onClick={addStatusClause}>+ Status Clause</button>
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
        <div className="br-node-config-modal__card">
            <div className="br-node-config-modal__card__header" onClick={() => setExpanded(v => !v)}>
                <div className="br-node-config-modal__card__header-left">
                    {expanded
                        ? <ChevronUp className="br-node-config-modal__card__chevron" />
                        : <ChevronRight className="br-node-config-modal__card__chevron" />
                    }
                    <span className="br-node-config-modal__card__title">
                        {variant.label && variant.label.trim() ? variant.label : `Variant ${index + 1}`}
                    </span>
                </div>
                <button className="br-node-config-modal__remove-btn" onClick={e => { e.stopPropagation(); deleteVariant(nodeId, variant.id); }}>
                    <Trash2 className="br-node-config-modal__icon-md" />
                </button>
            </div>
            {expanded && (
                <div className="br-node-config-modal__card__body">
                    <div className="br-node-config-modal__field">
                        <label className="br-node-config-modal__label">Internal Name</label>
                        <input
                            className="br-node-config-modal__input"
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
                    <div className="br-node-config-modal__field">
                        <label className="br-node-config-modal__label">Narrative Text</label>
                        <textarea
                            className="br-node-config-modal__textarea"
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

// -- Sub-component: Searchable flag dropdown --
function FlagDropdown({ flags, selectedIds, onAdd }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const available = flags.filter(f =>
        !selectedIds.includes(f.id) &&
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="br-flag-dropdown" ref={ref}>
            <button
                className="br-flag-dropdown__trigger"
                onClick={() => { setOpen(o => !o); setSearch(''); }}
                disabled={flags.length === 0}
            >
                <Plus className="br-flag-dropdown__icon" />
                Add flag…
                <ChevronDown className={`br-flag-dropdown__chevron ${open ? 'br-flag-dropdown__chevron--open' : ''}`} />
            </button>
            {open && (
                <div className="br-flag-dropdown__panel">
                    <input
                        className="br-flag-dropdown__search"
                        autoFocus
                        type="text"
                        placeholder="Search flags…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="br-flag-dropdown__options">
                        {available.length === 0
                            ? <span className="br-flag-dropdown__empty">No flags found</span>
                            : available.map(f => (
                                <button
                                    key={f.id}
                                    className="br-flag-dropdown__option"
                                    onClick={() => { onAdd(f.id); setOpen(false); setSearch(''); }}
                                >
                                    {f.name}
                                </button>
                            ))
                        }
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
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const editorSeenOptionIds = useNarrativeStore(s => s.editorSeenOptionIds);
    const toggleOptionSeen = useNarrativeStore(s => s.toggleOptionSeen);
    const isOptionSeen = editorSeenOptionIds.includes(`${nodeId}::${option.id}`);

    const toggleFlagSet = (flagId) => {
        const current = option.flags_set || [];
        const next = current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId];
        updateOption(nodeId, option.id, { flags_set: next });
    };

    const addStatusEffect = () => {
        updateOption(nodeId, option.id, {
            status_set: [...(option.status_set || []), { statusId: statuses[0]?.id || '', amount: 0, mode: 'add' }]
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
        <div className="br-node-config-modal__card">
            <div className="br-node-config-modal__card__header" onClick={() => setExpanded(v => !v)}>
                <div className="br-node-config-modal__card__header-left">
                    {expanded
                        ? <ChevronUp className="br-node-config-modal__card__chevron" />
                        : <ChevronRight className="br-node-config-modal__card__chevron" />
                    }
                    <span className="br-node-config-modal__card__title">{cardTitle}</span>
                </div>
                <div className="br-node-config-modal__card__header-right">
                    {!isCampaignActive && (
                        <button
                            className={`br-node-config-modal__seen-btn ${isOptionSeen ? 'br-node-config-modal__seen-btn--active' : ''}`}
                            title={isOptionSeen ? 'Mark option as unseen' : 'Mark option as seen'}
                            onClick={e => { e.stopPropagation(); toggleOptionSeen(nodeId, option.id); }}
                        >
                            <Check className="br-node-config-modal__icon-xs" />
                        </button>
                    )}
                    <button className="br-node-config-modal__remove-btn" onClick={e => { e.stopPropagation(); deleteOption(nodeId, option.id); }}>
                        <Trash2 className="br-node-config-modal__icon-md" />
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="br-node-config-modal__card__body">
                    <div className="br-node-config-modal__field">
                        <label className="br-node-config-modal__label">Option Text</label>
                        <input
                            className="br-node-config-modal__input"
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
                        <div className="br-node-config-modal__field">
                            <label className="br-node-config-modal__label">On-Select: Set Flags</label>
                            <FlagDropdown
                                flags={flags}
                                selectedIds={option.flags_set || []}
                                onAdd={toggleFlagSet}
                            />
                            {(option.flags_set || []).length > 0 && (
                                <>
                                    <div className="br-flag-dropdown__divider" />
                                    <div className="br-node-config-modal__flags-tags">
                                        {(option.flags_set || []).map(flagId => {
                                            const f = flags.find(fl => fl.id === flagId);
                                            return f ? (
                                                <span key={flagId} className="br-node-config-modal__flag-tag">
                                                    {f.name}
                                                    <button className="br-node-config-modal__flag-tag__remove" onClick={() => toggleFlagSet(flagId)}>
                                                        <X className="br-node-config-modal__icon-xs" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {statuses.length > 0 && (
                        <div className="br-node-config-modal__field">
                            <label className="br-node-config-modal__label">On-Select: Status Modifiers</label>
                            {(option.status_set || []).map((se, idx) => (
                                <div key={idx} className="br-node-config-modal__status-row br-node-config-modal__mb-6">
                                    <SearchableSelect
                                        className="br-node-config-modal__select"
                                        value={se.statusId || ''}
                                        onChange={val => updateStatusEffect(idx, { statusId: val })}
                                        options={statuses}
                                        placeholder="Select status..."
                                    />
                                    <div className="br-node-config-modal__mode-toggle">
                                        <button
                                            className={`br-node-config-modal__mode-btn br-node-config-modal__mode-btn--add ${(se.mode || 'add') === 'add' ? 'br-node-config-modal__mode-btn--active-add' : ''}`}
                                            onClick={() => updateStatusEffect(idx, { mode: 'add' })}
                                            title="Add / subtract from current value"
                                        >ADD</button>
                                        <button
                                            className={`br-node-config-modal__mode-btn br-node-config-modal__mode-btn--set ${(se.mode || 'add') === 'set' ? 'br-node-config-modal__mode-btn--active-set' : ''}`}
                                            onClick={() => updateStatusEffect(idx, { mode: 'set' })}
                                            title="Force status to exact value"
                                        >SET</button>
                                    </div>
                                    <input
                                        type="number"
                                        className="br-node-config-modal__status-amount"
                                        value={se.amount ?? 0}
                                        placeholder={(se.mode || 'add') === 'set' ? 'Value' : 'Amount'}
                                        onChange={e => updateStatusEffect(idx, { amount: Number(e.target.value) })}
                                    />
                                    <button className="br-node-config-modal__remove-btn" onClick={() => removeStatusEffect(idx)}>
                                        <Trash2 className="br-node-config-modal__icon-md" />
                                    </button>
                                </div>
                            ))}
                            <button className="br-node-config-modal__add-btn" onClick={addStatusEffect}>
                                <Plus className="br-node-config-modal__icon-xs" /> Add Status Modifier
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
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const isSeen = useNarrativeStore(s => s.editorSeenNodeIds.includes(nodeId));
    const toggleNodeSeen = useNarrativeStore(s => s.toggleNodeSeen);

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
    const typeBadgeClass = isChoice 
        ? 'br-node-config-modal__type-badge--choice' 
        : isEnding 
            ? 'br-node-config-modal__type-badge--ending' 
            : 'br-node-config-modal__type-badge--common';


    const patch = (field, value) => updateNode(node.id, { data: { ...data, [field]: value } });

    const toggleFlag = (flagId) => {
        const current = data.flags_set || [];
        const next = current.includes(flagId) ? current.filter(id => id !== flagId) : [...current, flagId];
        patch('flags_set', next);
    };

    const addStatusEffect = () => {
        patch('status_set', [...(data.status_set || []), { statusId: statuses[0]?.id || '', amount: 0, mode: 'add' }]);
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
        <div className="br-node-config-modal__backdrop" onClick={handleCancel}>
            <div
                className={`br-node-config-modal__container ${isEnding ? 'br-node-config-modal__container--narrow' : 'br-node-config-modal__container--wide'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="br-node-config-modal__header">
                    <div className="br-node-config-modal__header__left">
                        {/* FIX 6: Badge shows subtype name if set */}
                        <span className={`br-node-config-modal__type-badge ${typeBadgeClass}`}>
                            {badgeText}
                        </span>
                        <h3 className="br-node-config-modal__header__title">Configure Node</h3>
                    </div>
                    <div className="br-node-config-modal__header__right">
                        {!isCampaignActive && (
                            <button
                                className={`br-node-config-modal__seen-btn ${isSeen ? 'br-node-config-modal__seen-btn--active' : ''}`}
                                title={isSeen ? 'Mark node as unseen' : 'Mark node as seen'}
                                onClick={() => toggleNodeSeen(nodeId)}
                            >
                                <Eye className="br-node-config-modal__icon-base" />
                                {isSeen ? 'Seen' : 'Mark Seen'}
                            </button>
                        )}
                        <button className="br-node-config-modal__close-btn" onClick={onClose}>
                            <X className="br-node-config-modal__icon-lg" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="br-node-config-modal__body">

                    {/* LEFT COLUMN: Narrative & Routing */}
                    <div className={`br-node-config-modal__col ${isEnding ? 'br-node-config-modal__col--left-only' : 'br-node-config-modal__col--left'}`}>
                        <div>
                            <SectionTitle icon={AlignLeft} title="Narrative Content" />
                            {/* FIX 4: Label first */}
                            <div className="br-node-config-modal__field br-node-config-modal__mb-14">
                                <label className="br-node-config-modal__label">Node Label</label>
                                <input
                                    className="br-node-config-modal__input"
                                    type="text"
                                    value={data.label || ''}
                                    onChange={e => patch('label', e.target.value)}
                                    placeholder="Enter node label..."
                                />
                            </div>

                            {/* FIX 4: Chapter & Path immediately below label */}
                            <div className="br-node-config-modal__row br-node-config-modal__mb-14">
                                <div className="br-node-config-modal__field">
                                    <label className="br-node-config-modal__label">Chapter</label>
                                    <select
                                        className="br-node-config-modal__select"
                                        value={data.chapterId || ''}
                                        onChange={e => patch('chapterId', e.target.value || null)}
                                    >
                                        <option value="">None</option>
                                        {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="br-node-config-modal__field">
                                    <label className="br-node-config-modal__label">Path</label>
                                    <select
                                        className="br-node-config-modal__select"
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
                                <div className="br-node-config-modal__field br-node-config-modal__mb-14">
                                    <label className="br-node-config-modal__label">{isCommon ? 'Common Type' : 'Ending Type'}</label>
                                    {typeOptions.length === 0 ? (
                                        <div className="br-node-config-modal__hint">
                                            No {isCommon ? 'common' : 'ending'} types defined yet. Add them in the left sidebar.
                                        </div>
                                    ) : (
                                        <select
                                            className="br-node-config-modal__select"
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
                            <div className="br-node-config-modal__field">
                                <label className="br-node-config-modal__label">Description / Content</label>
                                <textarea
                                    className="br-node-config-modal__textarea"
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
                                    className={`br-node-config-modal__start-btn ${data.isStartNode ? 'br-node-config-modal__start-btn--active' : ''}`}
                                    onClick={() => setStartNode(node.id)}
                                    disabled={data.isStartNode}
                                >
                                    <Star className={`br-node-config-modal__icon-base ${data.isStartNode ? 'br-node-config-modal__star-icon--active' : ''}`} />
                                    {data.isStartNode ? 'This is the Start Node ✓' : 'Set as Start Node'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Logic & Effects (hidden for Ending) */}
                    {!isEnding && (
                        <div className="br-node-config-modal__col br-node-config-modal__col--right">
                            {/* On-Enter Modifiers */}
                            <div>
                                <SectionTitle icon={Zap} title="On-Enter Modifiers" />
                                <div className="br-node-config-modal__modifiers-box">
                                    <div>
                                        <label className="br-node-config-modal__label br-node-config-modal__label--block">Set Flags (True)</label>
                                        {flags.length === 0
                                            ? <span className="br-node-config-modal__hint--inline">No flags defined.</span>
                                            : <FlagDropdown
                                                flags={flags}
                                                selectedIds={data.flags_set || []}
                                                onAdd={toggleFlag}
                                            />
                                        }
                                        {(data.flags_set || []).length > 0 && (
                                            <>
                                                <div className="br-flag-dropdown__divider" />
                                                <div className="br-node-config-modal__flags-tags">
                                                    {(data.flags_set || []).map(flagId => {
                                                        const f = flags.find(fl => fl.id === flagId);
                                                        return f ? (
                                                            <span key={flagId} className="br-node-config-modal__flag-tag">
                                                                {f.name}
                                                                <button className="br-node-config-modal__flag-tag__remove" onClick={() => toggleFlag(flagId)}>
                                                                    <X className="br-node-config-modal__icon-xs" />
                                                                </button>
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="br-node-config-modal__border-top">
                                        <label className="br-node-config-modal__label br-node-config-modal__label--block">Status Modifiers</label>
                                        {(data.status_set || []).map((se, idx) => (
                                            <div key={idx} className="br-node-config-modal__status-row br-node-config-modal__mb-6">
                                                <SearchableSelect
                                                    className="br-node-config-modal__select"
                                                    value={se.statusId || ''}
                                                    onChange={val => updateStatusEffect(idx, { statusId: val })}
                                                    options={statuses}
                                                    placeholder="Select status..."
                                                />
                                                <div className="br-node-config-modal__mode-toggle">
                                                    <button
                                                        className={`br-node-config-modal__mode-btn br-node-config-modal__mode-btn--add ${(se.mode || 'add') === 'add' ? 'br-node-config-modal__mode-btn--active-add' : ''}`}
                                                        onClick={() => updateStatusEffect(idx, { mode: 'add' })}
                                                        title="Add / subtract from current value"
                                                    >ADD</button>
                                                    <button
                                                        className={`br-node-config-modal__mode-btn br-node-config-modal__mode-btn--set ${(se.mode || 'add') === 'set' ? 'br-node-config-modal__mode-btn--active-set' : ''}`}
                                                        onClick={() => updateStatusEffect(idx, { mode: 'set' })}
                                                        title="Force status to exact value"
                                                    >SET</button>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="br-node-config-modal__status-amount"
                                                    value={se.amount ?? 0}
                                                    placeholder={(se.mode || 'add') === 'set' ? 'Value' : 'Amount'}
                                                    onChange={e => updateStatusEffect(idx, { amount: Number(e.target.value) })}
                                                />
                                                <button className="br-node-config-modal__remove-btn" onClick={() => removeStatusEffect(idx)}>
                                                    <Trash2 className="br-node-config-modal__icon-md" />
                                                </button>
                                            </div>
                                        ))}
                                        <button className="br-node-config-modal__add-btn" onClick={addStatusEffect}>
                                            <Plus className="br-node-config-modal__icon-xs" /> Add Status Modifier
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Variants (Common) or Options (Choice) */}
                            <div>
                                <SectionTitle icon={SlidersHorizontal} title={isChoice ? 'Branching Options' : 'Narrative Variants'} />
                                <div className="br-node-config-modal__flex-col">
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
                                        className="br-node-config-modal__add-btn br-node-config-modal__add-btn--full"
                                        onClick={() => isChoice
                                            ? addOption(node.id, { label: `Option ${(data.options || []).length + 1}` })
                                            : addVariant(node.id, { label: `Variant ${(data.variants || []).length + 1}` })
                                        }
                                    >
                                        <Plus className="br-node-config-modal__icon-sm" />
                                        Add {isChoice ? 'Option' : 'Variant'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="br-node-config-modal__footer">
                    <button className="br-node-config-modal__btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="br-node-config-modal__btn-save" onClick={onClose}>
                        <Check className="br-node-config-modal__icon-base" /> Save Node
                    </button>
                </div>
            </div>
        </div>
    );
}
