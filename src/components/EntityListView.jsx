import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNarrativeStore } from 'store';

/**
 * EntityListView (Phase 2 Refinement)
 * Premium list component for sidebars matching the protoype design.
 */
export default function EntityListView({ type, items, icon: Icon, iconColor, onAdd, onEdit, onDelete, deleteError, onClearError }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="entity-list-view">
            {/* Search & Add Header */}
            <div className="entity-list-view__header">
                <div className="entity-list-view__search-wrapper">
                    <Search className="entity-list-view__search-icon" />
                    <input
                        type="text"
                        placeholder={`Search ${type.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sidebar-panel__search"
                    />
                </div>
                <button
                    onClick={onAdd}
                    className="entity-list-view__plus-btn"
                    title={`Create new ${type}`}
                >
                    <Plus style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* Scrollable List */}
            <div className="entity-list-view__content custom-scrollbar">
                {filteredItems.length === 0 ? (
                    <div className="entity-list-view__empty">
                        No {type.toLowerCase()} found
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="entity-item-container">
                            <div className="entity-list-card">
                                <div className="entity-list-card__info">
                                    <Icon className="entity-list-card__icon" style={{ color: iconColor }} />
                                    <span className="entity-list-card__name" title={item.name}>{item.name}</span>
                                </div>
                                <div className="entity-list-card__actions">
                                    <button
                                        onClick={() => onEdit?.(item)}
                                        className="entity-list-card__action-btn"
                                        title="Edit"
                                    >
                                        <Pencil style={{ width: 14, height: 14 }} />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(item.id)}
                                        className="entity-list-card__action-btn entity-list-card__action-btn--danger"
                                        title="Delete"
                                    >
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                    </button>
                                </div>
                            </div>

                            {/* Guard Rail Warning */}
                            {deleteError && deleteError.id === item.id && (
                                <div className="entity-list-warning">
                                    <div className="entity-list-warning__header">
                                        <span>Referenced by:</span>
                                        <button onClick={onClearError} className="entity-list-warning__close">Dismiss</button>
                                    </div>
                                    <ul className="entity-list-warning__list">
                                        {deleteError.references.map((ref, idx) => (
                                            <li key={idx} className="entity-list-warning__item">
                                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.label || ref}</span>
                                                {ref.nodeId && (
                                                    <button
                                                        className="entity-list-warning__focus"
                                                        onClick={() => window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId: ref.nodeId } }))}
                                                    >
                                                        Focus
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
