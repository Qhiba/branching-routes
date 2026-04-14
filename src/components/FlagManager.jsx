import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

export default function FlagManager() {
  const flags = useNarrativeStore(state => state.flags);
  const addFlag = useNarrativeStore(state => state.addFlag);
  const deleteFlag = useNarrativeStore(state => state.deleteFlag);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('boolean');
  const [newDefaultValBool, setNewDefaultValBool] = useState(false);
  const [newDefaultValNum, setNewDefaultValNum] = useState(0);

  const [deleteError, setDeleteError] = useState(null);

  const isNameValid = /^[a-zA-Z0-9_]+$/.test(newName) && !flags.some(f => f.name === newName);
  const hasTypedName = newName.length > 0;

  const handleAddFlag = (e) => {
    e.preventDefault();
    if (!isNameValid) return;
    
    const defaultValue = newType === 'boolean' ? newDefaultValBool : newDefaultValNum;
    addFlag(newName, newType, defaultValue);
    
    // reset form
    setNewName('');
    setNewType('boolean');
    setNewDefaultValBool(false);
    setNewDefaultValNum(0);
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
          flags.map(flag => (
            <div key={flag.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <code style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{flag.name}</code>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'inline-block', padding: '2px 6px', background: 'var(--color-bg-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', width: 'fit-content' }}>
                    {flag.type}
                  </span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Default: <strong>{String(flag.defaultValue)}</strong>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(flag.id)}
                  style={{ padding: '4px 8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>

              {deleteError && deleteError.id === flag.id && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                  <strong>Cannot delete. Referenced by:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                    {deleteError.references.map((ref, idx) => <li key={idx}>{ref}</li>)}
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
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Type</label>
            <select 
              name="new-flag-type"
              value={newType} 
              onChange={(e) => setNewType(e.target.value)}
              style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Default Value</label>
            {newType === 'boolean' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                <input 
                  type="checkbox" 
                  name="new-flag-default-bool"
                  checked={newDefaultValBool} 
                  onChange={(e) => setNewDefaultValBool(e.target.checked)}
                />
                True
              </label>
            ) : (
              <input 
                type="number" 
                name="new-flag-default-num"
                value={newDefaultValNum} 
                onChange={(e) => setNewDefaultValNum(Number(e.target.value))}
                style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            )}
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
