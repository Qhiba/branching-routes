import React from 'react';
import { useGraphStore, useUIStore } from 'store';

export default function NodeInspector() {
  const selectedNodeId = useUIStore(state => state.selectedNodeId);
  const node = useGraphStore(state => state.nodes.find(n => n.id === selectedNodeId));
  const flags = useGraphStore(state => state.flags);
  const updateNode = useGraphStore(state => state.updateNode);
  const setStartNode = useGraphStore(state => state.setStartNode);
  const deleteNode = useGraphStore(state => state.deleteNode);

  if (!node) return null;
  const data = node.data || {};

  const handleLabelChange = (e) => {
    updateNode(node.id, { data: { ...data, label: e.target.value } });
  };

  const handleContentChange = (e) => {
    updateNode(node.id, { data: { ...data, content: e.target.value } });
  };

  const handleStartNodeClick = () => {
    setStartNode(node.id);
  };

  const addSideEffect = () => {
    const newSideEffect = { flagId: flags[0]?.id || '', operation: 'set', value: flags[0]?.type === 'boolean' ? false : 0 };
    updateNode(node.id, { data: { ...data, sideEffects: [...(data.sideEffects || []), newSideEffect] } });
  };

  const updateSideEffect = (index, patch) => {
    const updated = [...(data.sideEffects || [])];
    updated[index] = { ...updated[index], ...patch };

    // reset value type if flag id changed
    if (patch.flagId) {
      const newFlag = flags.find(f => f.id === patch.flagId);
      if (newFlag) {
        updated[index].value = newFlag.type === 'boolean' ? false : 0;
        updated[index].operation = 'set';
      }
    }

    updateNode(node.id, { data: { ...data, sideEffects: updated } });
  };

  const removeSideEffect = (index) => {
    const updated = [...(data.sideEffects || [])];
    updated.splice(index, 1);
    updateNode(node.id, { data: { ...data, sideEffects: updated } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Label</label>
        <input
          type="text"
          name="node-label"
          value={data.label || ''}
          onChange={handleLabelChange}
          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Content</label>
        <textarea
          name="node-content"
          value={data.content || ''}
          onChange={handleContentChange}
          rows={5}
          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', resize: 'vertical' }}
        />
      </div>

      <button
        onClick={handleStartNodeClick}
        disabled={data.isStartNode}
        style={{ padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', cursor: data.isStartNode ? 'default' : 'pointer', opacity: data.isStartNode ? 0.7 : 1 }}
      >
        {data.isStartNode ? 'Start Node ✓' : 'Set as Start Node'}
      </button>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Side Effects</h4>

        {(data.sideEffects || []).map((se, index) => {
          const flag = flags.find(f => f.id === se.flagId);
          return (
            <div key={index} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'var(--color-bg-base)', padding: '8px', border: '1px solid var(--color-border)' }}>
              <select
                name={`se-flag-${index}`}
                value={se.flagId}
                onChange={(e) => updateSideEffect(index, { flagId: e.target.value })}
                style={{ flex: 1, padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                {!se.flagId && <option value="">Select flag...</option>}
                {flags.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>

              {flag && (
                <>
                  <select
                    name={`se-op-${index}`}
                    value={se.operation}
                    onChange={(e) => updateSideEffect(index, { operation: e.target.value })}
                    style={{ width: '80px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="set">set</option>
                    {flag.type === 'number' && (
                      <>
                        <option value="add">add</option>
                        <option value="subtract">sub</option>
                      </>
                    )}
                  </select>

                  {flag.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      name={`se-val-bool-${index}`}
                      checked={se.value}
                      onChange={(e) => updateSideEffect(index, { value: e.target.checked })}
                    />
                  ) : (
                    <input
                      type="number"
                      name={`se-val-num-${index}`}
                      value={se.value}
                      onChange={(e) => updateSideEffect(index, { value: Number(e.target.value) })}
                      style={{ width: '60px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    />
                  )}
                </>
              )}

              <button onClick={() => removeSideEffect(index)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>🗑️</button>
            </div>
          );
        })}

        <button
          onClick={addSideEffect}
          style={{ width: '100%', padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', marginTop: '8px' }}
        >
          Add Side Effect
        </button>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <button
          onClick={() => deleteNode(node.id)}
          style={{ width: '100%', padding: '10px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', cursor: 'pointer' }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
