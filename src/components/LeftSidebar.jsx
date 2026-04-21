import React, { useState } from 'react';
import { useSimulationStore, useNarrativeStore } from 'store';
import {
    Flag,
    Activity,
    BookOpen,
    FolderTree,
    Settings,
    HelpCircle,
    ChevronLeft
} from 'lucide-react';
import EntityListView from './EntityListView';
import NameModal from './NameModal';
import CreationModal from './CreationModal';

// Phase 2 — LeftSidebar with CreationModal for Flag/Status creation (richer form),
// and NameModal for Chapter/Path creation and all edits.

export default function LeftSidebar() {
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Flags');
    const [showNameModal, setShowNameModal] = useState(null);  // { type, item } for edit
    const [creationModalType, setCreationModalType] = useState(null); // 'Flags' | 'Status' | 'Chapter' | 'Paths'
    const [deleteError, setDeleteError] = useState(null); // { id, references }

    // AR-23: per-slice selectors (objects, not arrays — stable refs)
    const flagObj = useNarrativeStore(s => s.flag);
    const statusObj = useNarrativeStore(s => s.status);
    const chapterObj = useNarrativeStore(s => s.chapter);
    const pathObj = useNarrativeStore(s => s.path);

    const flags = Object.values(flagObj);
    const statuses = Object.values(statusObj);
    const chapters = Object.values(chapterObj);
    const paths = Object.values(pathObj);

    const tabs = [
        { id: 'Flags', icon: Flag, label: 'Flags', color: '#a78bfa', items: flags, type: 'flag' },
        { id: 'Status', icon: Activity, label: 'Status', color: '#f87171', items: statuses, type: 'status' },
        { id: 'Chapters', icon: BookOpen, label: 'Chapters', color: '#818cf8', items: chapters, type: 'chapter' },
        { id: 'Paths', icon: FolderTree, label: 'Paths', color: '#22d3ee', items: paths, type: 'path' },
    ];

    const handleTabClick = (tabId) => {
        if (activeTab === tabId && isOpen) {
            setIsOpen(false);
        } else {
            setActiveTab(tabId);
            setIsOpen(true);
        }
    };

    // Phase 2 instruction 4/5: Flags/Status → CreationModal; Chapter/Paths → NameModal (AR-19 DOM event
    // is also viable for Chapter/Path but NameModal is simpler since LeftSidebar is fixed-positioned, not
    // inside ReactFlowProvider — it could call canvas-open-name-modal, but the existing store-backed
    // NameModal path already works without needing the DOM event indirection).
    const handleAdd = (currentTab) => {
        setDeleteError(null);
        if (currentTab.type === 'flag' || currentTab.type === 'status') {
            // Richer creation form (CreationModal)
            setCreationModalType(currentTab.id); // 'Flags' or 'Status'
        } else {
            // Chapter / Path — use existing NameModal flow
            setShowNameModal({ type: currentTab.type });
        }
    };

    // Phase 2 instruction 7: edit → NameModal pre-filled with current name
    const handleEdit = (currentTab, item) => {
        setDeleteError(null);
        setShowNameModal({ type: currentTab.type, item });
    };

    // Phase 2 instruction 8: delete → store action with guard-rail
    const handleDelete = (type, id) => {
        setDeleteError(null);
        let result;
        if (type === 'flag') result = useNarrativeStore.getState().deleteFlag(id);
        if (type === 'status') result = useNarrativeStore.getState().deleteStatus(id);
        if (type === 'chapter') result = useNarrativeStore.getState().deleteChapter(id);
        if (type === 'path') result = useNarrativeStore.getState().deletePath(id);

        if (result && result.blocked) {
            setDeleteError({ id, references: result.references });
        }
    };

    // Phase 2 instruction 6: CreationModal onConfirm → store add actions
    const handleCreationConfirm = (data) => {
        const store = useNarrativeStore.getState();
        if (creationModalType === 'Flags') {
            store.addFlag(data.name, data.initialState);
        } else if (creationModalType === 'Status') {
            store.addStatus(data.name, data.initialValue, data.min, data.max);
        } else if (creationModalType === 'Chapter') {
            store.addChapter(data.name);
        } else if (creationModalType === 'Paths') {
            store.addPath(data.name);
        }
        // onClose is called by CreationModal itself after onConfirm, but we also
        // clear state here defensively (AR-25 — all close paths go through same cleanup)
        setCreationModalType(null);
    };

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <>
            <div
                className={`sidebar-container sidebar-container--left ${isCampaignActive ? 'is-disabled' : ''}`}
                style={{
                    width: isOpen ? '362px' : '42px',
                    opacity: isCampaignActive ? 0.5 : 1,
                    pointerEvents: isCampaignActive ? 'none' : 'auto',
                }}
            >
                {/* Rail */}
                <div className="sidebar-rail">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`nameplate-tab ${activeTab === tab.id && isOpen ? 'nameplate-tab--active' : ''}`}
                            onClick={() => handleTabClick(tab.id)}
                        >
                            {tab.label}
                        </div>
                    ))}

                    <div className="sidebar-rail__bottom">
                        <button className="topbar__control-btn" style={{ padding: '8px' }} title="Settings">
                            <Settings className="topbar__control-icon" />
                        </button>
                        <button className="topbar__control-btn" style={{ padding: '8px' }} title="Help">
                            <HelpCircle className="topbar__control-icon" />
                        </button>
                    </div>
                </div>

                {/* Panel */}
                <div className="sidebar-panel">
                    <div className="sidebar-panel__header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 className="sidebar-panel__title">{activeTab}</h3>
                            <button
                                className="topbar__control-btn"
                                style={{ padding: '4px' }}
                                onClick={() => setIsOpen(false)}
                            >
                                <ChevronLeft className="topbar__control-icon" />
                            </button>
                        </div>
                    </div>
                    <div className="sidebar-panel__content" style={{ padding: 0 }}>
                        {currentTab && (
                            <EntityListView
                                type={currentTab.id}
                                items={currentTab.items}
                                icon={currentTab.icon}
                                iconColor={currentTab.color}
                                onAdd={() => handleAdd(currentTab)}
                                onDelete={(id) => handleDelete(currentTab.type, id)}
                                onEdit={(item) => handleEdit(currentTab, item)}
                                deleteError={deleteError}
                                onClearError={() => setDeleteError(null)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* NameModal — edit any type, or create Chapter/Path */}
            {showNameModal && (
                <NameModal
                    entityType={showNameModal.type}
                    editItem={showNameModal.item}
                    onClose={() => setShowNameModal(null)}
                />
            )}

            {/* CreationModal — richer form for Flag/Status creation (Phase 2) */}
            <CreationModal
                entityType={creationModalType}
                onClose={() => setCreationModalType(null)}
                onConfirm={handleCreationConfirm}
            />
        </>
    );
}
