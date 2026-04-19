import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

export default function VariantEditor({ nodeId, variants }) {
  const flags = Object.values(useNarrativeStore(s => s.flag));
  const statuses = Object.values(useNarrativeStore(s => s.status));
  const addVariant = useNarrativeStore(s => s.addVariant);
  const updateVariant = useNarrativeStore(s => s.updateVariant);
  const deleteVariant = useNarrativeStore(s => s.deleteVariant);

  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddVariant = () => {
    addVariant(nodeId, { label: `Variant ${variants.length + 1}` });
  };

  // Condition Helpers
  const toggleCondition = (v) => {
    if (v.requires) {
      updateVariant(nodeId, v.id, { requires: null });
    } else {
      updateVariant(nodeId, v.id, { requires: { operator: 'and', conditions: [] } });
    }
  };

  const updateConditionOperator = (v, operator) => {
    updateVariant(nodeId, v.id, { requires: { ...v.requires, operator } });
  };

  const addFlagClause = (v) => {
    const newClause = { flag: flags[0]?.id || '', state: true };
    updateVariant(nodeId, v.id, {
      requires: { ...v.requires, conditions: [...v.requires.conditions, newClause] }
    });
  };

  const addStatusClause = (v) => {
    const newClause = { status: statuses[0]?.id || '', min: 0 };
    updateVariant(nodeId, v.id, {
      requires: { ...v.requires, conditions: [...v.requires.conditions, newClause] }
    });
  };

  const updateClause = (v, index, patch) => {
    const updated = [...v.requires.conditions];
    updated[index] = { ...updated[index], ...patch };
    updateVariant(nodeId, v.id, { requires: { ...v.requires, conditions: updated } });
  };

  const removeClause = (v, index) => {
    const updated = [...v.requires.conditions];
    updated.splice(index, 1);
    updateVariant(nodeId, v.id, { requires: { ...v.requires, conditions: updated } });
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '2px solid var(--color-border)', paddingTop: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Variants</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {variants.map((v, index) => {
          const isExpanded = !!expandedRows[v.id];
          return (
            <div key={v.id} style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              
              <div style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => toggleExpand(v.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', flexShrink: 0, width: '20px', padding: 0 }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
                <input
                  type="text"
                  value={v.label || ''}
                  onChange={(e) => updateVariant(nodeId, v.id, { label: e.target.value })}
                  placeholder={`Variant ${index + 1}`}
                  style={{ flex: 1, minWidth: 0, padding: '4px 6px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
                <button 
                  onClick={() => deleteVariant(nodeId, v.id)} 
                  title="Delete Variant"
                  style={{ padding: '4px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', cursor: 'pointer', flexShrink: 0 }}>
                  🗑️
                </button>
              </div>

              {isExpanded && (
                <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Variant Content */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Text</label>
                    <textarea
                      value={v.text || ''}
                      onChange={(e) => updateVariant(nodeId, v.id, { text: e.target.value })}
                      rows={3}
                      placeholder="Variant narrative content..."
                      style={{ width: '100%', padding: '8px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                    />
                  </div>
                  
                  {/* Requires Block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Requires Condition</h4>
                      <button
                        onClick={() => toggleCondition(v)}
                        style={{ padding: '4px 8px', background: v.requires ? 'var(--color-bg-hover)' : 'var(--color-primary)', color: v.requires ? 'var(--color-text-primary)' : 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        {v.requires ? 'Remove Condition' : 'Add Condition'}
                      </button>
                    </div>

                    {v.requires && (
                      <div style={{ background: 'var(--color-bg-surface)', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                            <input type="radio" checked={v.requires.operator === 'and'} onChange={() => updateConditionOperator(v, 'and')} /> AND
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                            <input type="radio" checked={v.requires.operator === 'or'} onChange={() => updateConditionOperator(v, 'or')} /> OR
                          </label>
                        </div>

                        {v.requires.conditions.map((clause, idx) => {
                          if ('flag' in clause) {
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Flag</span>
                                <select
                                  value={clause.flag || ''}
                                  onChange={(e) => updateClause(v, idx, { flag: e.target.value })}
                                  style={{ flex: 1, minWidth: 0, padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                >
                                  {!clause.flag && <option value="">Select flag...</option>}
                                  {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                                  <input type="checkbox" checked={clause.state} onChange={(e) => updateClause(v, idx, { state: e.target.checked })} /> Is True
                                </label>
                                <button onClick={() => removeClause(v, idx)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto', flexShrink: 0 }}>🗑️</button>
                              </div>
                            );
                          } else if ('status' in clause) {
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Status</span>
                                <select
                                  value={clause.status || ''}
                                  onChange={(e) => updateClause(v, idx, { status: e.target.value })}
                                  style={{ flex: 1, minWidth: 0, padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                >
                                  {!clause.status && <option value="">Select status...</option>}
                                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <input
                                  type="number" placeholder="Min (opt)"
                                  value={clause.min !== undefined ? clause.min : ''}
                                  onChange={(e) => updateClause(v, idx, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  style={{ width: '60px', padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                />
                                <span style={{color: 'var(--color-text-secondary)', fontSize: '0.85rem'}}>≤ eval ≤</span>
                                <input
                                  type="number" placeholder="Max (opt)"
                                  value={clause.max !== undefined ? clause.max : ''}
                                  onChange={(e) => updateClause(v, idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                                  style={{ width: '60px', padding: '4px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                />
                                <button onClick={() => removeClause(v, idx)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto', flexShrink: 0 }}>🗑️</button>
                              </div>
                            );
                          }
                          return null;
                        })}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button onClick={() => addFlagClause(v)} style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Flag Clause</button>
                          <button onClick={() => addStatusClause(v)} style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Status Clause</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleAddVariant}
        style={{ width: '100%', padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', marginTop: '12px' }}
      >
        + Add Variant
      </button>
    </div>
  );
}
