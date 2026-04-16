import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

export default function StatusManager() {
  const statusDict = useNarrativeStore(state => state.status);
  const statuses = Object.values(statusDict);
  const addStatus = useNarrativeStore(state => state.addStatus);
  const deleteStatus = useNarrativeStore(state => state.deleteStatus);
  
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState(0);
  const [newMinValue, setNewMinValue] = useState('');
  const [newMaxValue, setNewMaxValue] = useState('');

  const [deleteError, setDeleteError] = useState(null);

  const isNameValid = /^[a-zA-Z0-9_]+$/.test(newName) && !statuses.some(s => s.name === newName);
  const hasTypedName = newName.length > 0;

  const handleAddStatus = (e) => {
    e.preventDefault();
    if (!isNameValid) return;
    
    const minVal = newMinValue === '' ? null : Number(newMinValue);
    const maxVal = newMaxValue === '' ? null : Number(newMaxValue);
    
    // CHANGED: addStatus with value, minValue, maxValue
    addStatus(newName, newValue, minVal, maxVal);
    
    // reset form
    setNewName('');
    setNewValue(0);
    setNewMinValue('');
    setNewMaxValue('');
  };

  const handleDelete = (id) => {
    setDeleteError(null);
    const result = deleteStatus(id);
    if (result && result.blocked) {
      // PRESERVED: Referential Integrity behavior
      setDeleteError({ id, references: result.references });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Existing Statuses</h4>
        
        {statuses.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            No statuses defined. Add one below.
          </div>
        ) : (
          statuses.map(statusObj => (
            <div key={statusObj.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <code style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{statusObj.name}</code>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Default: <strong>{String(statusObj.value)}</strong>
                    {(statusObj.minValue !== null || statusObj.maxValue !== null) && (
                      <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>
                        [Min: {statusObj.minValue !== null ? statusObj.minValue : 'None'}, Max: {statusObj.maxValue !== null ? statusObj.maxValue : 'None'}]
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(statusObj.id)}
                  style={{ padding: '4px 8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>

              {deleteError && deleteError.id === statusObj.id && (
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
        <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Add New Status</h4>
        
        <form onSubmit={handleAddStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Name (alphanumeric_)</label>
            <input 
              type="text" 
              name="new-status-name"
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. courage"
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
            <input 
              type="number" 
              name="new-status-default-num"
              value={newValue} 
              onChange={(e) => setNewValue(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Min Value (Optional)</label>
              <input 
                type="number" 
                name="new-status-min"
                value={newMinValue} 
                onChange={(e) => setNewMinValue(e.target.value)}
                placeholder="None"
                style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Max Value (Optional)</label>
              <input 
                type="number" 
                name="new-status-max"
                value={newMaxValue} 
                onChange={(e) => setNewMaxValue(e.target.value)}
                placeholder="None"
                style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!hasTypedName || !isNameValid}
            style={{ marginTop: '8px', padding: '10px', background: (!hasTypedName || !isNameValid) ? 'var(--color-bg-hover)' : 'var(--color-accent)', color: (!hasTypedName || !isNameValid) ? 'var(--color-text-secondary)' : 'white', border: (!hasTypedName || !isNameValid) ? '1px solid var(--color-border)' : '1px solid var(--color-accent)', cursor: (!hasTypedName || !isNameValid) ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Add Status
          </button>
        </form>
      </div>
    </div>
  );
}
