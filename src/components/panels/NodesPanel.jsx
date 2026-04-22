// CHANGED: Added new NodesPanel for central node filtering and listing
// PRESERVED: Hooked into existing narrativeStore and triggers legacy canvas events
import React, { useState } from 'react';
import { useNarrativeStore } from 'store';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import './RightPanels.css';

export default function NodesPanel() {
    const common = useNarrativeStore(state => state.common);
    const choice = useNarrativeStore(state => state.choice);
    const ending = useNarrativeStore(state => state.ending);

    const chapters = useNarrativeStore(state => state.chapter);
    const paths = useNarrativeStore(state => state.path);
    const commonTypes = useNarrativeStore(state => state.commonType);
    const endingTypes = useNarrativeStore(state => state.endingType);
    const deleteNode = useNarrativeStore(state => state.deleteNode);

    const [activeTab, setActiveTab] = useState('common');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [filterPath, setFilterPath] = useState('');
    const [filterTypeNode, setFilterTypeNode] = useState('');

    const nodesDict = activeTab === 'common' ? common : activeTab === 'choice' ? choice : ending;

    const nodes = Object.values(nodesDict || {}).filter(n => {
        let match = (n.data?.label || n.id).toLowerCase().includes(searchQuery.toLowerCase());
        if (filterChapter) match = match && n.data?.chapterId === filterChapter;
        if (filterPath) match = match && n.data?.pathId === filterPath;
        if (filterTypeNode) {
            if (activeTab === 'common') match = match && n.data?.commonTypeId === filterTypeNode;
            if (activeTab === 'ending') match = match && n.data?.endingTypeId === filterTypeNode;
        }
        return match;
    });

    const handleFocus = (nodeId) => {
        window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
    };

    const handleEdit = (nodeId) => {
        window.dispatchEvent(new CustomEvent('canvas-focus-node', { detail: { nodeId } }));
        window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId } }));
    };

    const handleDelete = (id) => {
        deleteNode(id);
    };

    const handleCreateNode = () => {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: activeTab } }));
    };

    return (
        <div className="nodes-panel">
            <div className="nodes-panel__tabs">
                {['common', 'choice', 'ending'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setFilterChapter(''); setFilterPath(''); setFilterTypeNode(''); }}
                        className={`nodes-panel__tab ${activeTab === tab ? 'nodes-panel__tab--active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="nodes-panel__search" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search className="nodes-panel__search-icon" size={14} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab} nodes...`}
                        className="nodes-panel__input"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(activeTab === 'common' || activeTab === 'ending') && (
                        <select value={filterTypeNode} onChange={e => setFilterTypeNode(e.target.value)} className="nodes-panel__input" style={{ flex: 1, padding: '6px', fontSize: '10px' }}>
                            <option value="">All Types</option>
                            {Object.values(activeTab === 'common' ? commonTypes : endingTypes).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    )}
                    <select value={filterChapter} onChange={e => setFilterChapter(e.target.value)} className="nodes-panel__input" style={{ flex: 1, padding: '6px', fontSize: '10px' }}>
                        <option value="">All Chapters</option>
                        {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filterPath} onChange={e => setFilterPath(e.target.value)} className="nodes-panel__input" style={{ flex: 1, padding: '6px', fontSize: '10px' }}>
                        <option value="">All Paths</option>
                        {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="nodes-panel__list custom-scrollbar">
                {nodes.map(node => {
                    const label = node.data?.label || node.id;
                    const data = node.data || {};
                    return (
                        <div key={node.id} className={`nodes-panel__item nodes-panel__item--${activeTab}`} onClick={() => handleFocus(node.id)}>
                            <div className="nodes-panel__item-info">
                                <span className="nodes-panel__item-name">{label}</span>
                                {data.content && (
                                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                        {data.content}
                                    </span>
                                )}
                                {activeTab === 'common' && (
                                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 'bold' }}>
                                        <span>{(data.flags_set || []).length} Flags</span> •
                                        <span>{(data.status_set || []).length} Status</span> •
                                        <span>{(data.variants || []).length} Variants</span>
                                    </div>
                                )}
                                {activeTab === 'choice' && (
                                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 'bold' }}>
                                        <span>{(data.flags_set || []).length} Flags</span> •
                                        <span>{(data.status_set || []).length} Status</span> •
                                        <span>{(data.options || []).length} Options</span>
                                    </div>
                                )}
                            </div>
                            <div className="nodes-panel__item-actions">
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(node.id); }} className="panel-action-btn" title="Edit">
                                    <Pencil size={12} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }} className="panel-action-btn panel-action-btn--danger" title="Delete">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {nodes.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        No {activeTab} nodes found.
                    </div>
                )}
            </div>

            <button className="nodes-panel__add-full-btn" onClick={handleCreateNode}>
                <Plus size={16} /> Add {activeTab} Node
            </button>
        </div>
    );
}
