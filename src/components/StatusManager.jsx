import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Plus, Trash2, Pencil, Activity } from 'lucide-react';
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
// PRESERVED: All CRUD operations perfectly mirror original logic onto useNarrativeStore
export default function StatusManager() {
  const statusDict = useNarrativeStore(state => state.status);
  const statuses = Object.values(statusDict);
  const deleteStatus = useNarrativeStore(state => state.deleteStatus);
  const common = useNarrativeStore(state => state.common);
  const choice = useNarrativeStore(state => state.choice);
  const ending = useNarrativeStore(state => state.ending);

  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filteredStatuses = statuses.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeleteError(null);
    const result = deleteStatus(id);
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
            placeholder="Search statuses..."
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
        {filteredStatuses.map(statusObj => (
          <div key={statusObj.id} className="entity-list-item-wrapper">
            <div className="entity-list-item">
              <div className="entity-list-item-left">
                <Activity size={14} className="entity-icon--rose" />
                <div className="entity-list-item-col">
                  <span className="entity-list-item-name">{statusObj.name}</span>
                  <span className="entity-list-item-sub">
                    Default: {String(statusObj.value)}
                    {(statusObj.minValue !== null || statusObj.maxValue !== null) && ` [Min: ${statusObj.minValue ?? 'None'}, Max: ${statusObj.maxValue ?? 'None'}]`}
                  </span>
                </div>
              </div>
              <div className="entity-list-item-actions">
                <button className="entity-action-btn" onClick={(e) => { e.stopPropagation(); setEditItem(statusObj); }}>
                  <Pencil size={14} />
                </button>
                <button className="entity-action-btn entity-action-btn--danger" onClick={(e) => handleDelete(e, statusObj.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {deleteError && deleteError.id === statusObj.id && (
              <div className="entity-delete-error">
                <strong className="entity-delete-error__title">Cannot delete: referenced by {deleteError.references.length} node{deleteError.references.length > 1 ? 's' : ''}</strong>
                <ul className="entity-delete-error__list">
                  {deleteError.references.map((ref, idx) => {
                    const node = getNodeLabel(ref, common, choice, ending);
                    return (
                      <li key={idx} className="entity-delete-error__ref">
                        <span className="entity-delete-error__ref-name">{node ? node.label : ref}</span>
                        {node && (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: node.nodeId } }))}
                            className="entity-delete-error__focus-btn"
                          >
                            Focus
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="entity-delete-error__footer">
                  <button onClick={() => setDeleteError(null)} className="entity-delete-error__dismiss-btn">Dismiss</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editItem && <NameModal entityType="status" initialData={editItem === 'new' ? null : editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
