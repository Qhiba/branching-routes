// CHANGED: Ported logic from CampaignSelector to CampaignListPanel
// PRESERVED: Campaign lifecycle methods exactly matched to useCampaignStore
import React, { useState } from 'react';
import { useCampaignStore, useSimulationStore, useNarrativeStore } from 'store';
import { Play, Plus, Pencil, Trash2, EyeOff } from 'lucide-react';
import NameModal from '../NameModal';
import './RightPanels.css';

export default function CampaignListPanel() {
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const enterCampaign = useSimulationStore(s => s.enterCampaign);

    const campaignsMap = useCampaignStore(s => s.campaigns);
    const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
    const addCampaign = useCampaignStore(s => s.addCampaign);
    const deleteCampaign = useCampaignStore(s => s.deleteCampaign);
    const updateCampaign = useCampaignStore(s => s.updateCampaign);
    const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);

    const clearAllSeen = useNarrativeStore(s => s.clearAllSeen);
    const seenCount = useNarrativeStore(s => s.editorSeenNodeIds.length + s.editorSeenOptionIds.length);

    const campaigns = Object.values(campaignsMap);
    const [newCampName, setNewCampName] = useState('');
    const [editItem, setEditItem] = useState(null);

    const handleCreate = () => {
        if (!newCampName.trim()) return;
        addCampaign(newCampName.trim());
        setNewCampName('');
    };

    const handleEnter = (camp) => {
        if (isCampaignActive) return; // Normally UI blocks it, but ensure safety
        setActiveCampaign(camp.id);
        enterCampaign(camp);
    };

    return (
        <div className="campaign-panel">
            <div className="campaign-panel__header">
                <div className="campaign-panel__title">
                    <Play size={14} className="play-icon--fill" /> Campaign Scenarios
                </div>
                <div className="campaign-panel__desc">
                    Create discrete starting points and test distinct branches of your narrative simulation.
                </div>
            </div>

            <div className="campaign-panel__create">
                <input
                    type="text"
                    placeholder="Name new campaign..."
                    className="campaign-panel__input"
                    value={newCampName}
                    onChange={e => setNewCampName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <button className="campaign-panel__add-btn" onClick={handleCreate}>
                    <Plus size={14} />
                </button>
            </div>

            <div className="campaign-panel__hr" />

            {/* Clear All Seen marks */}
            {seenCount > 0 && !isCampaignActive && (
                <button
                    className="campaign-panel__clear-seen-btn"
                    onClick={clearAllSeen}
                    title="Remove all seen marks from nodes and options"
                >
                    <EyeOff size={12} />
                    Clear All Seen ({seenCount})
                </button>
            )}

            <div className="campaign-panel__list custom-scrollbar">
                <span className="campaign-panel__section-label">Available Campaigns</span>
                {campaigns.map(camp => {
                    const isActiveSession = isCampaignActive && activeCampaignId === camp.id;
                    return (
                        <div key={camp.id} className="campaign-panel__item">
                            <div className="campaign-panel__item-left">
                                <div className={`campaign-panel__dot ${isActiveSession ? 'campaign-panel__dot--active' : ''}`} />
                                <span className={`campaign-panel__item-name ${isActiveSession ? 'campaign-panel__item-name--active' : ''}`}>{camp.name}</span>
                            </div>

                            <div className="campaign-panel__item-actions">
                                {!isCampaignActive && (
                                    <button
                                        className="campaign-panel__action-btn campaign-panel__action-btn--enter"
                                        onClick={() => handleEnter(camp)}
                                        title="Start campaign"
                                    >
                                        <Play size={11} className="play-icon--fill" />
                                    </button>
                                )}
                                <button
                                    className="campaign-panel__action-btn"
                                    onClick={() => setEditItem(camp)}
                                    title="Rename"
                                >
                                    <Pencil size={11} />
                                </button>
                                <button
                                    className="campaign-panel__action-btn campaign-panel__action-btn--danger"
                                    onClick={() => deleteCampaign(camp.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editItem && (
                <NameModal
                    entityType="campaign"
                    initialData={editItem}
                    onClose={() => setEditItem(null)}
                    onConfirm={(name) => updateCampaign(editItem.id, { name })}
                />
            )}
        </div>
    );
}
