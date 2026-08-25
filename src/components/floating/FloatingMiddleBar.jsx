import React, { useState, useEffect } from 'react';
import {
    GitCommit, GitPullRequest, BoxSelect, GitMerge,
    ChevronDown, Play, Undo, RotateCcw, X, Save, Upload, Eye,
    LogIn, LogOut
} from 'lucide-react';
// FIX 2: Added useUIStore for overlay toggle
// FIX 3: Added snapshotCampaign, autosaveCampaign, setAutosaveCampaign for save/load controls
import { useSimulationStore, useCampaignStore, useUIStore, useNarrativeStore } from 'store';
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
    const followActiveNode = useUIStore(s => s.followActiveNode);
    const setFollowActiveNode = useUIStore(s => s.setFollowActiveNode);

    // Save Seen selectors
    const applySeenFromCampaign = useNarrativeStore(s => s.applySeenFromCampaign);
    const edges = useNarrativeStore(s => s.edges);
    const activeNodeId = useSimulationStore(s => s.activeNodeId);
    const seenNodeIds = useSimulationStore(s => s.seenNodeIds);
    const traversedEdgeIds = useSimulationStore(s => s.traversedEdgeIds);

    const campaignsMap = useCampaignStore(s => s.campaigns);
    const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
    const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);

    // Flatten campaigns object for mapping
    const campaigns = Object.values(campaignsMap);
    const firstCampaignId = campaigns.length > 0 ? campaigns[0].id : '';

    const [selectedId, setSelectedId] = useState(firstCampaignId);
    // FIX 3: save flash state for visual feedback
    const [saveFlash, setSaveFlash] = useState(false);
    const [seenFlash, setSeenFlash] = useState(false);

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

    const handleSaveSeen = () => {
        // Include the node the player is currently on (not yet in seenNodeIds)
        const allSeenNodeIds = activeNodeId
            ? [...new Set([...seenNodeIds, activeNodeId])]
            : [...seenNodeIds];
        // Derive option keys from traversed edges that carry an optionId
        const optionKeys = traversedEdgeIds
            .map(edgeId => edges.find(e => e.id === edgeId))
            .filter(e => e?.optionId)
            .map(e => `${e.sourceId}::${e.optionId}`);
        applySeenFromCampaign(allSeenNodeIds, optionKeys);
        setSeenFlash(true);
        setTimeout(() => setSeenFlash(false), 1500);
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
            <div className="br-floating-bar br-floating-bar--campaign">
                <div className="br-floating-bar__active-name">
                    <div className="br-floating-bar__pulse"></div>
                    <span className="br-floating-bar__campaign-name" title={activeCampaignName}>
                        {activeCampaignName}
                    </span>
                </div>

                {/* FIX 2: Overlay toggle — moved here from StatusStrip, left of Undo */}
                <button className="br-floating-bar__btn-action" onClick={toggleTraversalOverlay}>
                    Overlay: {showTraversalOverlay ? 'ON' : 'OFF'}
                </button>

                <button className="br-floating-bar__btn-action" onClick={() => setFollowActiveNode(!followActiveNode)}>
                    Follow: {followActiveNode ? 'ON' : 'OFF'}
                </button>

                <div className="br-floating-bar__divider-indigo"></div>

                <button className="br-floating-bar__btn-action" onClick={undoLastNode}>
                    <Undo className="w-3.5 h-3.5" /> Undo
                </button>

                <button className="br-floating-bar__btn-action" onClick={resetSimulation}>
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                {/* FIX 3: Save / Load / Autosave — moved here from SandboxPanel, right of Reset */}
                <div className="br-floating-bar__divider-indigo"></div>

                <button className="br-floating-bar__btn-action" onClick={handleSave}>
                    <Save className="w-3.5 h-3.5" /> {saveFlash ? '✓' : 'Save'}
                </button>

                <button
                    className="br-floating-bar__btn-action"
                    onClick={handleLoadSave}
                    disabled={!hasSavedSnapshot}
                    title={hasSavedSnapshot ? 'Load last save' : 'No save yet'}
                >
                    <Upload className="w-3.5 h-3.5" /> Load
                </button>

                <label className="br-floating-bar__autosave">
                    <input
                        type="checkbox"
                        checked={autosaveCampaign}
                        onChange={() => setAutosaveCampaign(!autosaveCampaign)}
                        className="br-floating-bar__autosave__checkbox"
                    />
                    Auto
                </label>

                <div className="br-floating-bar__divider-indigo"></div>

                <button
                    className="br-floating-bar__btn-action"
                    onClick={handleSaveSeen}
                    title="Merge nodes and options visited in this session into the canvas seen marks"
                >
                    <Eye className="w-3.5 h-3.5" /> {seenFlash ? '✓' : 'Save Seen'}
                </button>

                <div className="br-floating-bar__divider-indigo"></div>

                <button className="br-floating-bar__btn-danger" onClick={exitCampaign}>
                    <X className="w-3.5 h-3.5" /> Exit
                </button>
            </div>
        );
    }

    // Hide floating bar in Edit Mode (functions moved to TopBar)
    return null;
}
