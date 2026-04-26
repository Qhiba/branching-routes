import React, { useState, useEffect } from 'react';
import {
    GitCommit, GitPullRequest, BoxSelect,
    ChevronDown, Play, Undo, RotateCcw, X, Save, Upload
} from 'lucide-react';
// FIX 2: Added useUIStore for overlay toggle
// FIX 3: Added snapshotCampaign, autosaveCampaign, setAutosaveCampaign for save/load controls
import { useSimulationStore, useCampaignStore, useUIStore } from 'store';
import './FloatingMiddleBar.css';

export default function FloatingMiddleBar() {
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const enterCampaign = useSimulationStore(s => s.enterCampaign);
    const exitCampaign = useSimulationStore(s => s.exitCampaign);
    const undoLastNode = useSimulationStore(s => s.undoLastNode);
    const resetSimulation = useSimulationStore(s => s.reset);
    // FIX 3: save/load/autosave selectors
    const snapshotCampaign = useSimulationStore(s => s.snapshotCampaign);
    const autosaveCampaign = useSimulationStore(s => s.autosaveCampaign);
    const setAutosaveCampaign = useSimulationStore(s => s.setAutosaveCampaign);
    // FIX 2: overlay toggle selectors
    const showTraversalOverlay = useUIStore(s => s.showTraversalOverlay);
    const toggleTraversalOverlay = useUIStore(s => s.toggleTraversalOverlay);

    const campaignsMap = useCampaignStore(s => s.campaigns);
    const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
    const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);

    // Flatten campaigns object for mapping
    const campaigns = Object.values(campaignsMap);
    const firstCampaignId = campaigns.length > 0 ? campaigns[0].id : '';

    const [selectedId, setSelectedId] = useState(firstCampaignId);
    // FIX 3: save flash state for visual feedback
    const [saveFlash, setSaveFlash] = useState(false);

    // FIX 3: derived — does the active campaign have a saved snapshot to load?
    const activeCampaign = activeCampaignId ? campaignsMap[activeCampaignId] : null;
    const hasSavedSnapshot = activeCampaign?.snapshot?.activeNodeId != null;

    // Sync selectedId dynamically if the first campaign changes or is initialized late
    useEffect(() => {
        if (campaigns.length > 0 && !campaignsMap[selectedId]) {
            setSelectedId(campaigns[0].id);
        }
    }, [campaignsMap, selectedId, campaigns]);

    // FIX 3: save handler with flash feedback
    const handleSave = () => {
        snapshotCampaign();
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 1500);
    };

    // FIX 3: load last save handler
    const handleLoadSave = () => {
        if (!activeCampaign) return;
        setActiveCampaign(activeCampaign.id);
        enterCampaign(activeCampaign);
    };

    const activeCampaignName = campaignsMap[activeCampaignId]?.name || 'Unknown Campaign';

    const handleStartCampaign = () => {
        if (selectedId) {
            const camp = campaignsMap[selectedId];
            if (camp) {
                setActiveCampaign(selectedId);
                enterCampaign(camp);
            }
        }
    };

    const handleCreateNode = (type) => {
        window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
    };

    if (isCampaignActive) {
        return (
            <div className="ui-v2-floating-bar ui-v2-floating-bar--campaign">
                <div className="ui-v2-floating-active-name">
                    <div className="ui-v2-floating-pulse"></div>
                    <span className="ui-v2-floating-campaign-name" title={activeCampaignName}>
                        {activeCampaignName}
                    </span>
                </div>

                {/* FIX 2: Overlay toggle — moved here from StatusStrip, left of Undo */}
                <button className="ui-v2-floating-btn-action" onClick={toggleTraversalOverlay}>
                    Overlay: {showTraversalOverlay ? 'ON' : 'OFF'}
                </button>

                <div className="ui-v2-floating-divider-indigo"></div>

                <button className="ui-v2-floating-btn-action" onClick={undoLastNode}>
                    <Undo className="w-3.5 h-3.5" /> Undo
                </button>

                <button className="ui-v2-floating-btn-action" onClick={resetSimulation}>
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                {/* FIX 3: Save / Load / Autosave — moved here from SandboxPanel, right of Reset */}
                <div className="ui-v2-floating-divider-indigo"></div>

                <button className="ui-v2-floating-btn-action" onClick={handleSave}>
                    <Save className="w-3.5 h-3.5" /> {saveFlash ? '✓' : 'Save'}
                </button>

                <button
                    className="ui-v2-floating-btn-action"
                    onClick={handleLoadSave}
                    disabled={!hasSavedSnapshot}
                    title={hasSavedSnapshot ? 'Load last save' : 'No save yet'}
                >
                    <Upload className="w-3.5 h-3.5" /> Load
                </button>

                <label className="ui-v2-floating-autosave">
                    <input
                        type="checkbox"
                        checked={autosaveCampaign}
                        onChange={() => setAutosaveCampaign(!autosaveCampaign)}
                        className="ui-v2-floating-autosave__checkbox"
                    />
                    Auto
                </label>

                <div className="ui-v2-floating-divider-indigo"></div>

                <button className="ui-v2-floating-btn-danger" onClick={exitCampaign}>
                    <X className="w-3.5 h-3.5" /> Exit
                </button>
            </div>
        );
    }

    // Active Authoring Mode
    return (
        <div className="ui-v2-floating-bar ui-v2-floating-bar--authoring">
            <div className="ui-v2-floating-nodes">
                <button
                    onClick={() => handleCreateNode('common')}
                    className="ui-v2-floating-node-btn ui-v2-floating-node-btn--common"
                    title="Common Node"
                >
                    <GitCommit className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleCreateNode('choice')}
                    className="ui-v2-floating-node-btn ui-v2-floating-node-btn--choice"
                    title="Choice Node"
                >
                    <GitPullRequest className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleCreateNode('ending')}
                    className="ui-v2-floating-node-btn ui-v2-floating-node-btn--ending"
                    title="Ending Node"
                >
                    <BoxSelect className="w-4 h-4" />
                </button>
            </div>

            <div className="ui-v2-floating-divider"></div>

            <div className="ui-v2-floating-campaign-start">
                <div className="ui-v2-floating-select-wrap">
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="ui-v2-floating-select"
                        disabled={campaigns.length === 0}
                    >
                        {campaigns.length === 0 && <option value="">No Campaigns</option>}
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 ui-v2-floating-select-icon" />
                </div>
                <button
                    onClick={handleStartCampaign}
                    className="ui-v2-floating-btn-start"
                    disabled={campaigns.length === 0}
                >
                    <Play className="ui-v2-floating-play-icon" /> Start
                </button>
            </div>
        </div>
    );
}
