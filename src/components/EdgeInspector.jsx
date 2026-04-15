import React from 'react';
import { useNarrativeStore, useUIStore } from 'store';

export default function EdgeInspector() {
  const selectedEdgeId = useUIStore(state => state.selectedEdgeId);
  const edge = useNarrativeStore(state => state.edges.find(e => e.id === selectedEdgeId));
  const flags = useNarrativeStore(state => state.flags);
  const updateEdge = useNarrativeStore(state => state.updateEdge);
  const deleteEdge = useNarrativeStore(state => state.deleteEdge);

  if (!edge) return null;

  const handleLabelChange = (e) => {
    updateEdge(edge.id, { label: e.target.value });
  };

  const toggleCondition = () => {
    if (edge.condition) {
      updateEdge(edge.id, { condition: null });
    } else {
      updateEdge(edge.id, { condition: { operator: 'AND', clauses: [] } });
    }
  };

  const updateConditionOperator = (operator) => {
    updateEdge(edge.id, { condition: { ...edge.condition, operator } });
  };

  const addClause = () => {
    const newClause = { flagId: flags[0]?.id || '', comparator: '==', value: flags[0]?.type === 'boolean' ? true : 0 };
    updateEdge(edge.id, { condition: { ...edge.condition, clauses: [...edge.condition.clauses, newClause] } });
  };

  const updateClause = (index, patch) => {
    const updated = [...edge.condition.clauses];
    updated[index] = { ...updated[index], ...patch };

    if (patch.flagId) {
      const newFlag = flags.find(f => f.id === patch.flagId);
      if (newFlag) {
        updated[index].value = newFlag.type === 'boolean' ? true : 0;
        updated[index].comparator = '==';
      }
    }

    updateEdge(edge.id, { condition: { ...edge.condition, clauses: updated } });
  };

  const removeClause = (index) => {
    const updated = [...edge.condition.clauses];
    updated.splice(index, 1);
    updateEdge(edge.id, { condition: { ...edge.condition, clauses: updated } });
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

        {flags.length === 0 && edge.condition && (
          <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginBottom: '8px' }}>
            No flags defined yet. Add flags in the Flags tab first.
          </div>
        )}

        {edge.condition && (
          <div style={{ background: 'var(--color-bg-base)', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)' }}>
                <input type="radio" name="edge-condition-op" checked={edge.condition.operator === 'AND'} onChange={() => updateConditionOperator('AND')} /> AND
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)' }}>
                <input type="radio" name="edge-condition-op" checked={edge.condition.operator === 'OR'} onChange={() => updateConditionOperator('OR')} /> OR
              </label>
            </div>

            {edge.condition.clauses.map((clause, index) => {
              const flag = flags.find(f => f.id === clause.flagId);
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <select
                    name={`clause-flag-${index}`}
                    value={clause.flagId}
                    onChange={(e) => updateClause(index, { flagId: e.target.value })}
                    style={{ flex: 1, minWidth: '100px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  >
                    {!clause.flagId && <option value="">Select flag...</option>}
                    {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>

                  {flag && (
                    <>
                      <select
                        name={`clause-comp-${index}`}
                        value={clause.comparator}
                        onChange={(e) => updateClause(index, { comparator: e.target.value })}
                        style={{ width: '60px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        {flag.type === 'number' && (
                          <>
                            <option value=">">&gt;</option>
                            <option value=">=">&gt;=</option>
                            <option value="<">&lt;</option>
                            <option value="<=">&lt;=</option>
                          </>
                        )}
                      </select>

                      {flag.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          name={`clause-val-bool-${index}`}
                          checked={clause.value}
                          onChange={(e) => updateClause(index, { value: e.target.checked })}
                        />
                      ) : (
                        <input
                          type="number"
                          name={`clause-val-num-${index}`}
                          value={clause.value}
                          onChange={(e) => updateClause(index, { value: Number(e.target.value) })}
                          style={{ width: '60px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        />
                      )}
                    </>
                  )}
                  <button onClick={() => removeClause(index)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>🗑️</button>
                </div>
              );
            })}

            <button
              onClick={addClause}
              style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              + Add Clause
            </button>
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
