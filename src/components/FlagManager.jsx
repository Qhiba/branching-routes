import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Plus, Trash2, Pencil, Flag } from 'lucide-react';
import NameModal from './NameModal';
import './EntityList.css';

function getNodeLabel(ref, common, choice, ending) {
  const parts = ref.split(':');
  const kind = parts[0];
  if (kind.startsWith('edge_')) return null;
  const nodeId = parts[1];
  const node = common[nodeId] || choice[nodeId] || ending[nodeId];
  return node ? { label: node.data?.label || nodeId, nodeId } : null;
}

// CHANGED: Replaced legacy inline UI with full EntityListView design
// PRESERVED: All CRUD operations and deletion blockers perfectly mirror original logic onto useNarrativeStore
export default function FlagManager() {
  const flagDict = useNarrativeStore(state => state.flag);
  const flags = Object.values(flagDict);
  const deleteFlag = useNarrativeStore(state => state.deleteFlag);
  const common = useNarrativeStore(state => state.common);
  const choice = useNarrativeStore(state => state.choice);
  const ending = useNarrativeStore(state => state.ending);

  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filteredFlags = flags.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeleteError(null);
    const result = deleteFlag(id);
    if (result && result.blocked) {
      setDeleteError({ id, references: result.references });
    }
  };

  return (
    <div className="entity-list-view">
      <div className="entity-list-header">
        <div className="entity-list-search">
          <Search className="entity-list-search-icon" size={14} />
          <input
            type="text"
            placeholder="Search flags..."
            className="entity-list-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="entity-list-add-btn" onClick={() => setEditItem('new')}>
          <Plus size={16} />
        </button>
      </div>

      <div className="entity-list-content custom-scrollbar">
        {filteredFlags.map(flag => (
          <div key={flag.id} className="entity-list-item-wrapper">
            <div className="entity-list-item">
              <div className="entity-list-item-left">
                <Flag size={14} style={{ color: 'var(--color-purple)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="entity-list-item-name">{flag.name}</span>
                  <span className="entity-list-item-sub">Default: {String(flag.state)}</span>
                </div>
              </div>
              <div className="entity-list-item-actions">
                <button className="entity-action-btn" onClick={(e) => { e.stopPropagation(); setEditItem(flag); }}>
                  <Pencil size={14} />
                </button>
                <button className="entity-action-btn entity-action-btn--danger" onClick={(e) => handleDelete(e, flag.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {deleteError && deleteError.id === flag.id && (
              <div style={{ marginTop: '6px', padding: '10px 12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderLeft: '3px solid var(--color-danger)', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '8px' }}>Cannot delete: referenced by {deleteError.references.length} node{deleteError.references.length > 1 ? 's' : ''}</strong>
                <ul style={{ margin: '0 0 10px 0', paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {deleteError.references.map((ref, idx) => {
                    const node = getNodeLabel(ref, common, choice, ending);
                    return (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <span style={{ color: 'var(--color-text-primary)' }}>{node ? node.label : ref}</span>
                        {node && (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: node.nodeId } }))}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '3px', cursor: 'pointer', transition: 'background 0.2s' }}
                          >
                            Focus
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteError(null)} style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', cursor: 'pointer', borderRadius: '4px' }}>Dismiss</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editItem && <NameModal entityType="flag" initialData={editItem === 'new' ? null : editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
