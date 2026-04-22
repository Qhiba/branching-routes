import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Plus, Trash2, Pencil, FolderTree, BookOpen } from 'lucide-react';
import NameModal from './NameModal';
import './EntityList.css';

// CHANGED: Replaced dual-view UI with isolated EntityListView filter logic
// PRESERVED: All CRUD operations perfectly mirror original logic onto useNarrativeStore
export default function PathChapterManager({ filterType }) {
  const isChapter = filterType === 'chapter';
  const isCommonType = filterType === 'commonType';
  const isEndingType = filterType === 'endingType';

  const dict = useNarrativeStore(state =>
    isChapter ? state.chapter :
      isCommonType ? state.commonType :
        isEndingType ? state.endingType :
          state.path
  );
  const items = Object.values(dict);

  const deleteItem = useNarrativeStore(state =>
    isChapter ? state.deleteChapter :
      isCommonType ? state.deleteCommonType :
        isEndingType ? state.deleteEndingType :
          state.deletePath
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState(null);

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRename = (e, item) => {
    e.stopPropagation();
    setEditItem(item);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteItem(id);
  };

  const Icon = isCommonType || isEndingType ? FolderTree : isChapter ? BookOpen : FolderTree;
  const iconColor = isCommonType ? 'var(--color-emerald)' : isEndingType ? 'var(--color-amber)' : isChapter ? 'var(--color-indigo)' : 'var(--color-cyan)';

  const typeLabel = isChapter ? 'chapters' : isCommonType ? 'common types' : isEndingType ? 'ending types' : 'paths';

  return (
    <div className="entity-list-view">
      <div className="entity-list-header">
        <div className="entity-list-search">
          <Search className="entity-list-search-icon" size={14} />
          <input
            type="text"
            placeholder={`Search ${typeLabel}...`}
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
        {filteredItems.map(item => (
          <div key={item.id} className="entity-list-item-wrapper">
            <div className="entity-list-item">
              <div className="entity-list-item-left">
                <Icon size={14} style={{ color: iconColor }} />
                <span className="entity-list-item-name">{item.name}</span>
              </div>
              <div className="entity-list-item-actions">
                <button className="entity-action-btn" onClick={(e) => handleRename(e, item)}>
                  <Pencil size={14} />
                </button>
                <button className="entity-action-btn entity-action-btn--danger" onClick={(e) => handleDelete(e, item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editItem && <NameModal entityType={filterType} initialData={editItem === 'new' ? null : editItem} onClose={() => setEditItem(null)} />}
    </div>
  );
}
