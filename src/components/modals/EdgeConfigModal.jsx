import React, { useEffect, useState } from 'react';
import { X, Check, Link2, GitBranch, Trash2, Plus } from 'lucide-react';
import { useNarrativeStore } from 'store';
import '../modals/NodeConfigModal.css'; /* Reuse ncm-* token styles */
import './EdgeConfigModal.css';

// ADDED: Phase 6 — Edge configuration modal (mirrors NodeConfigModal design language)

// EXPLORE: Custom SearchableSelect
function SearchableSelect({ value, options, onChange, placeholder, className }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selected = options.find(o => o.id === value);
    return (
        <div className={`ncm-searchable-select ${className || ''}`}>
            <div className="ncm-searchable-select__trigger" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
                <span className="ncm-searchable-select__value">{selected ? selected.name : <span className="ncm-searchable-select__placeholder">{placeholder}</span>}</span>
                <span className="ncm-searchable-select__caret">▾</span>
            </div>
            {open && (
                <div className="ncm-searchable-select__dropdown" onClick={e => e.stopPropagation()}>
                    <input type="text" autoFocus placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="ncm-input ncm-searchable-select__search" />
                    <div className="ncm-searchable-select__options">
                        {options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).map(o => (
                            <div key={o.id} className="ncm-searchable-select__option" onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}>
                                {o.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {open && <div className="ncm-searchable-select__backdrop" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />}
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
        <div className="ncm-backdrop" onClick={onClose}>
            <div className="ncm-container ncm-container--narrow ecm-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="ncm-header">
                    <div className="ncm-header__left">
                        <span className="ncm-type-badge ecm-type-badge">EDGE</span>
                        <h3 className="ncm-header__title">Configure Edge</h3>
                    </div>
                    <button className="ncm-close-btn" onClick={onClose}>
                        <X className="ncm-icon-lg" />
                    </button>
                </div>

                {/* Body — single column */}
                <div className="ncm-body">
                    <div className="ncm-col ncm-col--left-only">

                        {/* Connection info */}
                        <div>
                            <div className="ncm-section-title">
                                <Link2 className="ncm-section-title__icon" />
                                <h4 className="ncm-section-title__text">Connection</h4>
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
                            <div className="ncm-section-title">
                                <GitBranch className="ncm-section-title__icon" />
                                <h4 className="ncm-section-title__text">Edge Label</h4>
                            </div>
                            <div className="ncm-field">
                                <label className="ncm-label">Label (narrative / choice text)</label>
                                <input
                                    className="ncm-input"
                                    type="text"
                                    value={edge.label || ''}
                                    onChange={e => updateEdge(edge.id, { label: e.target.value })}
                                    placeholder="e.g. 'Go north', 'Accept the deal'…"
                                />
                            </div>
                        </div>

                        {/* Condition builder */}
                        <div>
                            <div className="ncm-condition-box">
                                <div className="ncm-condition-header">
                                    <span className="ncm-condition-label">Traversal Condition</span>
                                    <div className="ncm-flex-row">
                                        {edge.condition && (
                                            <div className="ncm-operator-toggle">
                                                <button
                                                    className={`ncm-operator-btn ${edge.condition.operator === 'and' ? 'ncm-operator-btn--active' : 'ncm-operator-btn--inactive'}`}
                                                    onClick={() => setOperator('and')}
                                                >AND</button>
                                                <button
                                                    className={`ncm-operator-btn ${edge.condition.operator === 'or' ? 'ncm-operator-btn--active' : 'ncm-operator-btn--inactive'}`}
                                                    onClick={() => setOperator('or')}
                                                >OR</button>
                                            </div>
                                        )}
                                        <button className="ncm-add-btn ncm-add-btn--sm" onClick={toggleCondition}>
                                            {edge.condition
                                                ? <><X className="ncm-icon-xs" /> Remove</>
                                                : <><Plus className="ncm-icon-xs" /> Add Condition</>}
                                        </button>
                                    </div>
                                </div>

                                {edge.condition && (
                                    <div>
                                        {flags.length === 0 && statuses.length === 0 && (
                                            <div className="ncm-hint">
                                                No flags or statuses defined yet — add them in the left sidebar.
                                            </div>
                                        )}
                                        {edge.condition.conditions.map((clause, idx) => {
                                            if ('flag' in clause) {
                                                return (
                                                    <div key={idx} className="ncm-clause-row">
                                                        <span className="ncm-clause-type ncm-clause-type--flag">FLAG</span>
                                                        <SearchableSelect
                                                            className="ncm-clause-select"
                                                            value={clause.flag || ''}
                                                            onChange={val => updateClause(idx, { flag: val })}
                                                            options={flags}
                                                            placeholder="Select flag..."
                                                        />
                                                        <button
                                                            className={`ncm-clause-value ${clause.state ? 'ncm-clause-value--true' : 'ncm-clause-value--false'}`}
                                                            onClick={() => updateClause(idx, { state: !clause.state })}
                                                        >
                                                            {clause.state ? 'TRUE' : 'FALSE'}
                                                        </button>
                                                        <button className="ncm-remove-btn" onClick={() => removeClause(idx)}>
                                                            <X className="ncm-icon-sm" />
                                                        </button>
                                                    </div>
                                                );
                                            } else if ('status' in clause) {
                                                return (
                                                    <div key={idx} className="ncm-clause-row">
                                                        <span className="ncm-clause-type ncm-clause-type--status">STAT</span>
                                                        <SearchableSelect
                                                            className="ncm-clause-select"
                                                            value={clause.status || ''}
                                                            onChange={val => updateClause(idx, { status: val })}
                                                            options={statuses}
                                                            placeholder="Select status..."
                                                        />
                                                        <input
                                                            type="number" className="ncm-clause-number" placeholder="Min"
                                                            value={clause.min !== undefined ? clause.min : ''}
                                                            onChange={e => updateClause(idx, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        />
                                                        <span className="ncm-clause-sep">≤</span>
                                                        <input
                                                            type="number" className="ncm-clause-number" placeholder="Max"
                                                            value={clause.max !== undefined ? clause.max : ''}
                                                            onChange={e => updateClause(idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        />
                                                        <button className="ncm-remove-btn" onClick={() => removeClause(idx)}>
                                                            <X className="ncm-icon-sm" />
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
                        </div>

                        {/* Danger zone */}
                        <div className="ecm-danger-zone">
                            <button className="ecm-delete-btn" onClick={handleDelete}>
                                <Trash2 className="ncm-icon-base" />
                                Delete Edge
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="ncm-footer">
                    <button className="ncm-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="ncm-btn-save" onClick={onClose}>
                        <Check className="ncm-icon-base" /> Done
                    </button>
                </div>
            </div>
        </div >
    );
}
