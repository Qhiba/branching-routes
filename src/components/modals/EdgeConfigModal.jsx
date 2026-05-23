import React, { useEffect, useRef, useState } from 'react';
import { X, Check, Link2, GitBranch, Trash2, Plus } from 'lucide-react';
import { useNarrativeStore } from 'store';
import '../modals/NodeConfigModal.css'; /* Reuse br-node-config-modal__* token styles */
import './EdgeConfigModal.css';

// ADDED: Phase 6 — Edge configuration modal (mirrors NodeConfigModal design language)

// EXPLORE: Custom SearchableSelect — dropdown uses position:fixed to escape overflow-clipping ancestors
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
            const DROPDOWN_HEIGHT = 220;
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

export default function EdgeConfigModal({ edgeId, onClose }) {
    const edge = useNarrativeStore(s => s.edges.find(e => e.id === edgeId));
    const flags = Object.values(useNarrativeStore(s => s.flag) || {});
    const statuses = Object.values(useNarrativeStore(s => s.status) || {});
    const updateEdge = useNarrativeStore(s => s.updateEdge);
    const deleteEdge = useNarrativeStore(s => s.deleteEdge);

    // Read the source option (if the edge comes from a Choice node option)
    const sourceOption = useNarrativeStore(s => {
        const e = s.edges.find(e => e.id === edgeId);
        if (!e) return null;
        const choiceNode = s.choice[e.sourceId];
        return choiceNode?.data?.options?.find(o => o.id === e.optionId) || null;
    });

    // Source / target node display names
    const sourceLabel = useNarrativeStore(s => {
        const e = s.edges.find(e => e.id === edgeId);
        if (!e) return '—';
        const n = s.common[e.sourceId] || s.choice[e.sourceId] || s.ending[e.sourceId];
        return n?.data?.label || e.sourceId;
    });
    const targetLabel = useNarrativeStore(s => {
        const e = s.edges.find(e => e.id === edgeId);
        if (!e) return '—';
        const n = s.common[e.targetId] || s.choice[e.targetId] || s.ending[e.targetId];
        return n?.data?.label || e.targetId;
    });

    // ESC to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!edge) return null;

    // ── Condition helpers ──────────────────────────────────────────────
    const toggleCondition = () => {
        updateEdge(edge.id, {
            condition: edge.condition ? null : { operator: 'and', conditions: [] }
        });
    };

    const setOperator = (op) => {
        updateEdge(edge.id, { condition: { ...edge.condition, operator: op } });
    };

    const addFlagClause = () => {
        const clause = { flag: flags[0]?.id || '', state: true };
        updateEdge(edge.id, {
            condition: { ...edge.condition, conditions: [...edge.condition.conditions, clause] }
        });
    };

    const addStatusClause = () => {
        const clause = { status: statuses[0]?.id || '', min: 0 };
        updateEdge(edge.id, {
            condition: { ...edge.condition, conditions: [...edge.condition.conditions, clause] }
        });
    };

    const updateClause = (idx, patch) => {
        const updated = [...edge.condition.conditions];
        updated[idx] = { ...updated[idx], ...patch };
        updateEdge(edge.id, { condition: { ...edge.condition, conditions: updated } });
    };

    const removeClause = (idx) => {
        const updated = [...edge.condition.conditions];
        updated.splice(idx, 1);
        updateEdge(edge.id, { condition: { ...edge.condition, conditions: updated } });
    };

    const handleDelete = () => {
        deleteEdge(edge.id);
        onClose();
    };

    return (
        <div className="br-node-config-modal__backdrop" onClick={onClose}>
            <div className="br-node-config-modal__container br-node-config-modal__container--narrow ecm-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="br-node-config-modal__header">
                    <div className="br-node-config-modal__header__left">
                        <span className="br-node-config-modal__type-badge ecm-type-badge">EDGE</span>
                        <h3 className="br-node-config-modal__header__title">Configure Edge</h3>
                    </div>
                    <button className="br-node-config-modal__close-btn" onClick={onClose}>
                        <X className="br-node-config-modal__icon-lg" />
                    </button>
                </div>

                {/* Body — single column */}
                <div className="br-node-config-modal__body">
                    <div className="br-node-config-modal__col br-node-config-modal__col--left-only">

                        {/* Connection info */}
                        <div>
                            <div className="br-node-config-modal__section-title">
                                <Link2 className="br-node-config-modal__section-title__icon" />
                                <h4 className="br-node-config-modal__section-title__text">Connection</h4>
                            </div>
                            <div className="ecm-connection-row">
                                <div className="ecm-node-chip ecm-node-chip--source">
                                    <span className="ecm-node-chip__label">FROM</span>
                                    <span className="ecm-node-chip__name">{sourceLabel}</span>
                                </div>
                                <div className="ecm-arrow">→</div>
                                <div className="ecm-node-chip ecm-node-chip--target">
                                    <span className="ecm-node-chip__label">TO</span>
                                    <span className="ecm-node-chip__name">{targetLabel}</span>
                                </div>
                            </div>
                            {/* Source option read-only badge */}
                            {sourceOption && (
                                <div className="ecm-option-badge">
                                    <span className="ecm-option-badge__pill">Option</span>
                                    <span className="ecm-option-badge__name">{sourceOption.label || 'Unnamed Option'}</span>
                                </div>
                            )}
                        </div>

                        {/* Edge label */}
                        <div>
                            <div className="br-node-config-modal__section-title">
                                <GitBranch className="br-node-config-modal__section-title__icon" />
                                <h4 className="br-node-config-modal__section-title__text">Edge Label</h4>
                            </div>
                            <div className="br-node-config-modal__field">
                                <label className="br-node-config-modal__label">Label (narrative / choice text)</label>
                                <input
                                    className="br-node-config-modal__input"
                                    type="text"
                                    value={edge.label || ''}
                                    onChange={e => updateEdge(edge.id, { label: e.target.value })}
                                    placeholder="e.g. 'Go north', 'Accept the deal'…"
                                />
                            </div>
                        </div>

                        {/* Condition builder */}
                        <div>
                            <div className="br-node-config-modal__condition-box">
                                <div className="br-node-config-modal__condition-header">
                                    <span className="br-node-config-modal__condition-label">Traversal Condition</span>
                                    <div className="br-node-config-modal__flex-row">
                                        {edge.condition && (
                                            <div className="br-node-config-modal__operator-toggle">
                                                <button
                                                    className={`br-node-config-modal__operator-btn ${edge.condition.operator === 'and' ? 'br-node-config-modal__operator-btn--active' : 'br-node-config-modal__operator-btn--inactive'}`}
                                                    onClick={() => setOperator('and')}
                                                >AND</button>
                                                <button
                                                    className={`br-node-config-modal__operator-btn ${edge.condition.operator === 'or' ? 'br-node-config-modal__operator-btn--active' : 'br-node-config-modal__operator-btn--inactive'}`}
                                                    onClick={() => setOperator('or')}
                                                >OR</button>
                                            </div>
                                        )}
                                        <button className="br-node-config-modal__add-btn br-node-config-modal__add-btn--sm" onClick={toggleCondition}>
                                            {edge.condition
                                                ? <><X className="br-node-config-modal__icon-xs" /> Remove</>
                                                : <><Plus className="br-node-config-modal__icon-xs" /> Add Condition</>}
                                        </button>
                                    </div>
                                </div>

                                {edge.condition && (
                                    <div>
                                        {flags.length === 0 && statuses.length === 0 && (
                                            <div className="br-node-config-modal__hint">
                                                No flags or statuses defined yet — add them in the left sidebar.
                                            </div>
                                        )}
                                        {edge.condition.conditions.map((clause, idx) => {
                                            if ('flag' in clause) {
                                                return (
                                                    <div key={idx} className="br-node-config-modal__clause-row">
                                                        <span className="br-node-config-modal__clause-type br-node-config-modal__clause-type--flag">FLAG</span>
                                                        <SearchableSelect
                                                            className="br-node-config-modal__clause-select"
                                                            value={clause.flag || ''}
                                                            onChange={val => updateClause(idx, { flag: val })}
                                                            options={flags}
                                                            placeholder="Select flag..."
                                                        />
                                                        <button
                                                            className={`br-node-config-modal__clause-value ${clause.state ? 'br-node-config-modal__clause-value--true' : 'br-node-config-modal__clause-value--false'}`}
                                                            onClick={() => updateClause(idx, { state: !clause.state })}
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
                        </div>

                        {/* Danger zone */}
                        <div className="ecm-danger-zone">
                            <button className="ecm-delete-btn" onClick={handleDelete}>
                                <Trash2 className="br-node-config-modal__icon-base" />
                                Delete Edge
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="br-node-config-modal__footer">
                    <button className="br-node-config-modal__btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="br-node-config-modal__btn-save" onClick={onClose}>
                        <Check className="br-node-config-modal__icon-base" /> Done
                    </button>
                </div>
            </div>
        </div>
    );
}
