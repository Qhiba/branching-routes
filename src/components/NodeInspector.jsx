import React from 'react';
import { useNarrativeStore, useUIStore } from 'store';
// ADDED: Import OptionEditor for choice node options
import OptionEditor from './OptionEditor';
// ADDED: Import VariantEditor for common node variants
import VariantEditor from './VariantEditor';

export default function NodeInspector() {
  const selectedNodeId = useUIStore(state => state.selectedNodeId);
  const nodeType = useNarrativeStore(state => {
    if (!selectedNodeId) return undefined;
    if (state.common[selectedNodeId]) return 'common';
    if (state.choice[selectedNodeId]) return 'choice';
    if (state.ending[selectedNodeId]) return 'ending';
    return undefined;
  });

  const node = useNarrativeStore(state => {
    if (!selectedNodeId) return undefined;
    if (state.common[selectedNodeId]) return state.common[selectedNodeId];
    if (state.choice[selectedNodeId]) return state.choice[selectedNodeId];
    if (state.ending[selectedNodeId]) return state.ending[selectedNodeId];
    return undefined;
  });

  const flags = Object.values(useNarrativeStore(state => state.flag));
  const statuses = Object.values(useNarrativeStore(state => state.status));
  // ADDED: Targeted selectors for paths and chapters
  const paths = Object.values(useNarrativeStore(state => state.path));
  const chapters = Object.values(useNarrativeStore(state => state.chapter));
  const updateNode = useNarrativeStore(state => state.updateNode);
  const setStartNode = useNarrativeStore(state => state.setStartNode);
  const deleteNode = useNarrativeStore(state => state.deleteNode);
  // PROTECTED: All existing handlers (handleLabelChange, handleContentChange, handleStartNodeClick,
  // toggleFlag, addStatusEffect, updateStatusEffect, removeStatusEffect, deleteNode) and the visual
  // structure (Label, Content, Start Node, Set Flags, Status Modifiers, Delete) are preserved unchanged.

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

  // CHANGED: unified sideEffects[] array → split side effect logic into boolean flags_set and numeric status_set
  const toggleFlag = (flagId) => {
    const currentFlags = data.flags_set || [];
    const newFlags = currentFlags.includes(flagId)
      ? currentFlags.filter(id => id !== flagId)
      : [...currentFlags, flagId];
    updateNode(node.id, { data: { ...data, flags_set: newFlags } });
  };

  const addStatusEffect = () => {
    const defaultStatusId = statuses[0]?.id || '';
    updateNode(node.id, { data: { ...data, status_set: [...(data.status_set || []), { statusId: defaultStatusId, amount: 0 }] } });
  };

  const updateStatusEffect = (index, patch) => {
    const updated = [...(data.status_set || [])];
    updated[index] = { ...updated[index], ...patch };
    updateNode(node.id, { data: { ...data, status_set: updated } });
  };

  const removeStatusEffect = (index) => {
    const updated = [...(data.status_set || [])];
    updated.splice(index, 1);
    updateNode(node.id, { data: { ...data, status_set: updated } });
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

      {/* ADDED: Path assignment dropdown */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Path</label>
        <select
          value={data.pathId || ''}
          onChange={(e) => updateNode(node.id, { data: { ...data, pathId: e.target.value || null } })}
          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">None</option>
          {paths.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* ADDED: Chapter assignment dropdown */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Chapter</label>
        <select
          value={data.chapterId || ''}
          onChange={(e) => updateNode(node.id, { data: { ...data, chapterId: e.target.value || null } })}
          style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">None</option>
          {chapters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {nodeType !== 'ending' && (
        <button
          onClick={handleStartNodeClick}
          disabled={data.isStartNode}
          style={{ padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', cursor: data.isStartNode ? 'default' : 'pointer', opacity: data.isStartNode ? 0.7 : 1 }}
        >
          {data.isStartNode ? 'Start Node ✓' : 'Set as Start Node'}
        </button>
      )}


      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Set Flags (True)</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {flags.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No flags available.</div>
          ) : (
            flags.map(f => {
              const checked = (data.flags_set || []).includes(f.id);
              return (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFlag(f.id)}
                  />
                  {f.name}
                </label>
              );
            })
          )}
        </div>

        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>Status Modifiers</h4>

        {(data.status_set || []).map((se, index) => {
          return (
            <div key={index} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'var(--color-bg-base)', padding: '8px', border: '1px solid var(--color-border)' }}>
              <select
                name={`se-status-${index}`}
                value={se.statusId || ''}
                onChange={(e) => updateStatusEffect(index, { statusId: e.target.value })}
                style={{ flex: 1, padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                {!se.statusId && <option value="">Select status...</option>}
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <input
                type="number"
                name={`se-amount-${index}`}
                value={se.amount !== undefined ? se.amount : 0}
                onChange={(e) => updateStatusEffect(index, { amount: Number(e.target.value) })}
                style={{ width: '80px', padding: '4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                placeholder="Amount"
              />

              <button onClick={() => removeStatusEffect(index)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>🗑️</button>
            </div>
          );
        })}

        <button
          onClick={addStatusEffect}
          style={{ width: '100%', padding: '8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px dashed var(--color-border)', cursor: 'pointer', marginTop: '8px' }}
        >
          Add Status Modifier
        </button>
      </div>

      {/* ADDED: Mount VariantEditor for common nodes */}
      {nodeType === 'common' && (
        <VariantEditor nodeId={node.id} variants={Array.isArray(data.variants) ? data.variants : []} />
      )}

      {/* ADDED: Mount OptionEditor for choice nodes */}
      {nodeType === 'choice' && (
        <OptionEditor nodeId={node.id} options={Array.isArray(data.options) ? data.options : []} />
      )}

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
