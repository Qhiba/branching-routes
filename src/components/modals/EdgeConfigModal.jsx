import React, { useEffect } from 'react';
import { X, Check, Link2, GitBranch, Trash2, Plus } from 'lucide-react';
import { useNarrativeStore } from 'store';
import '../modals/NodeConfigModal.css'; /* Reuse ncm-* token styles */
import './EdgeConfigModal.css';

// ADDED: Phase 6 — Edge configuration modal (mirrors NodeConfigModal design language)

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
                        <X style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                {/* Body — single column */}
                <div className="ncm-body">
                    <div className="ncm-col ncm-col--left-only">

                        {/* Connection info */}
                        <div>
                            <div className="ncm-section-title">
                                <Link2 className="ncm-section-title__icon" style={{ width: 14, height: 14 }} />
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
                                <GitBranch className="ncm-section-title__icon" style={{ width: 14, height: 14 }} />
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                        <button className="ncm-add-btn" onClick={toggleCondition} style={{ fontSize: 10 }}>
                                            {edge.condition
                                                ? <><X style={{ width: 10, height: 10 }} /> Remove</>
                                                : <><Plus style={{ width: 10, height: 10 }} /> Add Condition</>}
                                        </button>
                                    </div>
                                </div>

                                {edge.condition && (
                                    <div>
                                        {flags.length === 0 && statuses.length === 0 && (
                                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '6px 0' }}>
                                                No flags or statuses defined yet — add them in the left sidebar.
                                            </div>
                                        )}
                                        {edge.condition.conditions.map((clause, idx) => {
                                            if ('flag' in clause) {
                                                return (
                                                    <div key={idx} className="ncm-clause-row">
                                                        <span className="ncm-clause-type ncm-clause-type--flag">FLAG</span>
                                                        <select
                                                            className="ncm-clause-select"
                                                            value={clause.flag || ''}
                                                            onChange={e => updateClause(idx, { flag: e.target.value })}
                                                        >
                                                            {!clause.flag && <option value="">Select flag…</option>}
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
                                                            {!clause.status && <option value="">Select status…</option>}
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
                        </div>

                        {/* Danger zone */}
                        <div className="ecm-danger-zone">
                            <button className="ecm-delete-btn" onClick={handleDelete}>
                                <Trash2 style={{ width: 14, height: 14 }} />
                                Delete Edge
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="ncm-footer">
                    <button className="ncm-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="ncm-btn-save" onClick={onClose}>
                        <Check style={{ width: 14, height: 14 }} /> Done
                    </button>
                </div>
            </div>
        </div>
    );
}
