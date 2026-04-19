import React from 'react';
import { useNarrativeStore, useUIStore } from 'store';

export default function EdgeInspector() {
  const selectedEdgeId = useUIStore(state => state.selectedEdgeId);
  const edge = useNarrativeStore(state => state.edges.find(e => e.id === selectedEdgeId));
  const flags = Object.values(useNarrativeStore(state => state.flag));
  const statuses = Object.values(useNarrativeStore(state => state.status));
  const rawSourceOptions = useNarrativeStore(state => {
    const currentEdge = state.edges.find(e => e.id === selectedEdgeId);
    if (!currentEdge) return undefined;
    const choiceNode = state.choice[currentEdge.sourceId];
    return choiceNode?.data?.options;
  });
  const sourceOptions = rawSourceOptions || [];
  const updateEdge = useNarrativeStore(state => state.updateEdge);
  const deleteEdge = useNarrativeStore(state => state.deleteEdge);

  if (!edge) return null;

  const sourceOption = sourceOptions.find(opt => opt.id === edge.optionId);

  const handleLabelChange = (e) => {
    updateEdge(edge.id, { label: e.target.value });
  };

  const toggleCondition = () => {
    if (edge.condition) {
      updateEdge(edge.id, { condition: null });
    } else {
      updateEdge(edge.id, { condition: { operator: 'and', conditions: [] } });
    }
  };

  const updateConditionOperator = (operator) => {
    updateEdge(edge.id, { condition: { ...edge.condition, operator } });
  };

  const addFlagClause = () => {
    const newClause = { flag: flags[0]?.id || '', state: true };
    updateEdge(edge.id, { condition: { ...edge.condition, conditions: [...edge.condition.conditions, newClause] } });
  };

  const addStatusClause = () => {
    const newClause = { status: statuses[0]?.id || '', min: 0 };
    updateEdge(edge.id, { condition: { ...edge.condition, conditions: [...edge.condition.conditions, newClause] } });
  };

  const updateClause = (index, patch) => {
    const updated = [...edge.condition.conditions];
    updated[index] = { ...updated[index], ...patch };
    updateEdge(edge.id, { condition: { ...edge.condition, conditions: updated } });
  };

  const removeClause = (index) => {
    const updated = [...edge.condition.conditions];
    updated.splice(index, 1);
    updateEdge(edge.id, { condition: { ...edge.condition, conditions: updated } });
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Label (Choice text)</label>
        <input
          type="text"
          name="edge-label"
          value={edge.label || ''}
          onChange={handleLabelChange}
          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {sourceOption && (
        <div style={{ marginTop: '-8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Connected from option</label>
          <input
            type="text"
            value={sourceOption.label || 'Unnamed Option'}
            readOnly
            style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          />
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Condition</h4>
          <button
            onClick={toggleCondition}
            style={{ padding: '4px 8px', background: edge.condition ? 'var(--color-bg-hover)' : 'var(--color-primary)', color: edge.condition ? 'var(--color-text-primary)' : 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
          >
            {edge.condition ? 'Remove Condition' : 'Add Condition'}
          </button>
        </div>

        {flags.length === 0 && statuses.length === 0 && edge.condition && (
          <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginBottom: '8px' }}>
            No flags or statuses defined yet. Add them in their respective tabs.
          </div>
        )}

        {edge.condition && (
          <div style={{ background: 'var(--color-bg-base)', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)' }}>
                <input type="radio" name="edge-condition-op" checked={edge.condition.operator === 'and'} onChange={() => updateConditionOperator('and')} /> AND
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)' }}>
                <input type="radio" name="edge-condition-op" checked={edge.condition.operator === 'or'} onChange={() => updateConditionOperator('or')} /> OR
              </label>
            </div>

            {edge.condition.conditions.map((clause, index) => {
              if ('flag' in clause) {
                // Flag clause
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Flag</span>
                    <select
                      value={clause.flag || ''}
                      onChange={(e) => updateClause(index, { flag: e.target.value })}
                      style={{ flex: 1, minWidth: '100px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    >
                      {!clause.flag && <option value="">Select flag...</option>}
                      {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)' }}>
                      <input
                        type="checkbox"
                        checked={clause.state}
                        onChange={(e) => updateClause(index, { state: e.target.checked })}
                      />
                      Is True
                    </label>
                    <button onClick={() => removeClause(index)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>🗑️</button>
                  </div>
                );
              } else if ('status' in clause) {
                // Status clause
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', padding: '2px 4px', background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', borderRadius: '4px' }}>Status</span>
                    <select
                      value={clause.status || ''}
                      onChange={(e) => updateClause(index, { status: e.target.value })}
                      style={{ flex: 1, minWidth: '100px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    >
                      {!clause.status && <option value="">Select status...</option>}
                      {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <input
                      type="number"
                      placeholder="Min (opt)"
                      value={clause.min !== undefined ? clause.min : ''}
                      onChange={(e) => updateClause(index, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                      style={{ width: '60px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    />
                    <span style={{color: 'var(--color-text-secondary)', fontSize: '0.85rem'}}>≤ eval ≤</span>
                    <input
                      type="number"
                      placeholder="Max (opt)"
                      value={clause.max !== undefined ? clause.max : ''}
                      onChange={(e) => updateClause(index, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                      style={{ width: '60px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    />

                    <button onClick={() => removeClause(index)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>🗑️</button>
                  </div>
                );
              }
              return null;
            })}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={addFlagClause}
                style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + Add Flag Clause
              </button>
              <button
                onClick={addStatusClause}
                style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + Add Status Clause
              </button>
            </div>
          </div>
        )}
      </div>



      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <button
          onClick={() => deleteEdge(edge.id)}
          style={{ width: '100%', padding: '10px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', cursor: 'pointer' }}
        >
          Delete Edge
        </button>
      </div>
    </div>
  );
}
