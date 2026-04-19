import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

export default function OptionEditor({ nodeId, options }) {
  const flags = Object.values(useNarrativeStore(s => s.flag));
  const statuses = Object.values(useNarrativeStore(s => s.status));
  const addOption = useNarrativeStore(s => s.addOption);
  const updateOption = useNarrativeStore(s => s.updateOption);
  const deleteOption = useNarrativeStore(s => s.deleteOption);

  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddOption = () => {
    addOption(nodeId, { label: `Option ${options.length + 1}` });
  };

  // Condition Helpers (same pattern as EdgeInspector)
  const toggleCondition = (opt) => {
    if (opt.requires) {
      updateOption(nodeId, opt.id, { requires: null });
    } else {
      updateOption(nodeId, opt.id, { requires: { operator: 'and', conditions: [] } });
    }
  };

  const updateConditionOperator = (opt, operator) => {
    updateOption(nodeId, opt.id, { requires: { ...opt.requires, operator } });
  };

  const addFlagClause = (opt) => {
    const newClause = { flag: flags[0]?.id || '', state: true };
    updateOption(nodeId, opt.id, {
      requires: { ...opt.requires, conditions: [...opt.requires.conditions, newClause] }
    });
  };

  const addStatusClause = (opt) => {
    const newClause = { status: statuses[0]?.id || '', min: 0 };
    updateOption(nodeId, opt.id, {
      requires: { ...opt.requires, conditions: [...opt.requires.conditions, newClause] }
    });
  };

  const updateClause = (opt, index, patch) => {
    const updated = [...opt.requires.conditions];
    updated[index] = { ...updated[index], ...patch };
    updateOption(nodeId, opt.id, { requires: { ...opt.requires, conditions: updated } });
  };

  const removeClause = (opt, index) => {
    const updated = [...opt.requires.conditions];
    updated.splice(index, 1);
    updateOption(nodeId, opt.id, { requires: { ...opt.requires, conditions: updated } });
  };

  // Set Flags Helpers
  const toggleFlagSet = (opt, flagId) => {
    const currentFlags = opt.flags_set || [];
    const newFlags = currentFlags.includes(flagId)
      ? currentFlags.filter(id => id !== flagId)
      : [...currentFlags, flagId];
    updateOption(nodeId, opt.id, { flags_set: newFlags });
  };

  // Status Modifier Helpers
  const addStatusEffect = (opt) => {
    const defaultStatusId = statuses[0]?.id || '';
    updateOption(nodeId, opt.id, {
      status_set: [...(opt.status_set || []), { statusId: defaultStatusId, amount: 0 }]
    });
  };

  const updateStatusEffect = (opt, index, patch) => {
    const updated = [...(opt.status_set || [])];
    updated[index] = { ...updated[index], ...patch };
    updateOption(nodeId, opt.id, { status_set: updated });
  };

  const removeStatusEffect = (opt, index) => {
    const updated = [...(opt.status_set || [])];
    updated.splice(index, 1);
    updateOption(nodeId, opt.id, { status_set: updated });
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '2px solid var(--color-border)', paddingTop: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Options</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt, index) => {
          const isExpanded = !!expandedRows[opt.id];
          return (
            <div key={opt.id} style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              
              <div style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => toggleExpand(opt.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', flexShrink: 0, width: '20px', padding: 0 }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <input
                  type="text"
                  value={opt.label || ''}
                  onChange={(e) => updateOption(nodeId, opt.id, { label: e.target.value })}
                  placeholder={`Option ${index + 1}`}
                  style={{ flex: 1, minWidth: 0, padding: '4px 6px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
                <button 
                  onClick={() => deleteOption(nodeId, opt.id)} 
                  title="Delete Option"
                  style={{ padding: '4px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', cursor: 'pointer', flexShrink: 0 }}>
                  🗑️
                </button>
              </div>

              {isExpanded && (
                <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Requires Block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Requires Condition</h4>
                      <button
                        onClick={() => toggleCondition(opt)}
                        style={{ padding: '4px 8px', background: opt.requires ? 'var(--color-bg-hover)' : 'var(--color-primary)', color: opt.requires ? 'var(--color-text-primary)' : 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        {opt.requires ? 'Remove Condition' : 'Add Condition'}
                      </button>
                    </div>

                    {opt.requires && (
                      <div style={{ background: 'var(--color-bg-surface)', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                            <input type="radio" checked={opt.requires.operator === 'and'} onChange={() => updateConditionOperator(opt, 'and')} /> AND
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                            <input type="radio" checked={opt.requires.operator === 'or'} onChange={() => updateConditionOperator(opt, 'or')} /> OR
                          </label>
                        </div>

                        {opt.requires.conditions.map((clause, idx) => {
                          if ('flag' in clause) {
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Flag</span>
                                <select
                                  value={clause.flag || ''}
                                  onChange={(e) => updateClause(opt, idx, { flag: e.target.value })}
                                  style={{ flex: 1, minWidth: 0, padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                >
                                  {!clause.flag && <option value="">Select flag...</option>}
                                  {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={clause.state} onChange={(e) => updateClause(opt, idx, { state: e.target.checked })} /> Is True
                                </label>
                                <button onClick={() => removeClause(opt, idx)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>🗑️</button>
                              </div>
                            );
                          } else if ('status' in clause) {
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Status</span>
                                <select
                                  value={clause.status || ''}
                                  onChange={(e) => updateClause(opt, idx, { status: e.target.value })}
                                  style={{ flex: 1, minWidth: 0, padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                >
                                  {!clause.status && <option value="">Select status...</option>}
                                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <input
                                  type="number" placeholder="Min (opt)"
                                  value={clause.min !== undefined ? clause.min : ''}
                                  onChange={(e) => updateClause(opt, idx, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  style={{ width: '60px', padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                />
                                <span style={{color: 'var(--color-text-secondary)', fontSize: '0.85rem'}}>≤ eval ≤</span>
                                <input
                                  type="number" placeholder="Max (opt)"
                                  value={clause.max !== undefined ? clause.max : ''}
                                  onChange={(e) => updateClause(opt, idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  style={{ width: '60px', padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                />
                                <button onClick={() => removeClause(opt, idx)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>🗑️</button>
                              </div>
                            );
                          }
                          return null;
                        })}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button onClick={() => addFlagClause(opt)} style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Flag Clause</button>
                          <button onClick={() => addStatusClause(opt)} style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Status Clause</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Set Flags Block */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Set Flags (True)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {flags.length === 0 ? (
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No flags available.</div>
                      ) : (
                        flags.map(f => (
                          <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={(opt.flags_set || []).includes(f.id)}
                              onChange={() => toggleFlagSet(opt, f.id)}
                            />
                            {f.name}
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Status Modifiers Block */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Status Modifiers</h4>
                    {(opt.status_set || []).map((se, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <select
                          value={se.statusId || ''}
                          onChange={(e) => updateStatusEffect(opt, idx, { statusId: e.target.value })}
                          style={{ flex: 1, minWidth: 0, padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                          {!se.statusId && <option value="">Select status...</option>}
                          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input
                          type="number" placeholder="Amount"
                          value={se.amount !== undefined ? se.amount : 0}
                          onChange={(e) => updateStatusEffect(opt, idx, { amount: Number(e.target.value) })}
                          style={{ width: '80px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        />
                        <button onClick={() => removeStatusEffect(opt, idx)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>🗑️</button>
                      </div>
                    ))}
                    <button
                      onClick={() => addStatusEffect(opt)}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      + Add Status Modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleAddOption}
        style={{ width: '100%', padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', marginTop: '12px' }}
      >
        + Add Option
      </button>
    </div>
  );
}
