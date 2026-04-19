import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

function getNodeLabel(ref, common, choice, ending) {
  const parts = ref.split(':');
  const kind = parts[0];
  if (kind.startsWith('edge_')) return null;
  const nodeId = parts[1];
  const node = common[nodeId] || choice[nodeId] || ending[nodeId];
  return node ? { label: node.data?.label || nodeId, nodeId } : null;
}

export default function FlagManager() {
  const flagDict = useNarrativeStore(state => state.flag);
  const flags = Object.values(flagDict);
  const addFlag = useNarrativeStore(state => state.addFlag);
  const deleteFlag = useNarrativeStore(state => state.deleteFlag);
  const common = useNarrativeStore(state => state.common);
  const choice = useNarrativeStore(state => state.choice);
  const ending = useNarrativeStore(state => state.ending);
  
  const [newName, setNewName] = useState('');
  const [newState, setNewState] = useState(false);

  const [deleteError, setDeleteError] = useState(null);

  const isNameValid = /^[a-zA-Z0-9_]+$/.test(newName) && !flags.some(f => f.name === newName);
  const hasTypedName = newName.length > 0;

  const handleAddFlag = (e) => {
    e.preventDefault();
    if (!isNameValid) return;
    
    addFlag(newName, newState);
    
    // reset form
    setNewName('');
    setNewState(false);
  };

  const handleDelete = (id) => {
    setDeleteError(null);
    const result = deleteFlag(id);
    if (result && result.blocked) {
      setDeleteError({ id, references: result.references });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Existing Flags</h4>
        
        {flags.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            No flags defined. Add one below.
          </div>
        ) : (
          flags.map(flagObj => (
            <div key={flagObj.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <code style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{flagObj.name}</code>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Default: <strong>{String(flagObj.state)}</strong>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(flagObj.id)}
                  style={{ padding: '4px 8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>

              {deleteError && deleteError.id === flagObj.id && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                  <strong>Cannot delete. Referenced by:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                    {deleteError.references.map((ref, idx) => {
                      const node = getNodeLabel(ref, common, choice, ending);
                      return (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span>{node ? node.label : ref}</span>
                          {node && (
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: node.nodeId } }))}
                              style={{ padding: '1px 6px', fontSize: '0.75rem', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              Focus
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <button onClick={() => setDeleteError(null)} style={{ marginTop: '8px', padding: '2px 8px', fontSize: '0.8rem', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Dismiss</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Add New Flag</h4>
        
        <form onSubmit={handleAddFlag} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Name (alphanumeric_)</label>
            <input 
              type="text" 
              name="new-flag-name"
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. has_key"
              style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            {hasTypedName && !isNameValid && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                Invalid or duplicate name.
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Default Value</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
              <input 
                type="checkbox" 
                name="new-flag-default-bool"
                checked={newState} 
                onChange={(e) => setNewState(e.target.checked)}
              />
              True
            </label>
          </div>

          <button 
            type="submit" 
            disabled={!hasTypedName || !isNameValid}
            style={{ marginTop: '8px', padding: '10px', background: (!hasTypedName || !isNameValid) ? 'var(--color-bg-hover)' : 'var(--color-accent)', color: (!hasTypedName || !isNameValid) ? 'var(--color-text-secondary)' : 'white', border: (!hasTypedName || !isNameValid) ? '1px solid var(--color-border)' : '1px solid var(--color-accent)', cursor: (!hasTypedName || !isNameValid) ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Add Flag
          </button>
        </form>
      </div>
    </div>
  );
}
