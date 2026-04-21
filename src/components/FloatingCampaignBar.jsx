import React from 'react';
import { useSimulationStore, useCampaignStore } from 'store';
import {
    Undo,
    RotateCcw,
    X,
    Zap
} from 'lucide-react';

/**
 * FloatingCampaignBar (Phase 1 UI Refresh)
 * Renders an absolute-positioned pill over the canvas during active campaigns.
 */
export default function FloatingCampaignBar() {
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const activeNodeId = useSimulationStore(s => s.activeNodeId);
    const exitCampaign = useSimulationStore(s => s.exitCampaign);
    const resetSimulation = useSimulationStore(s => s.reset);
    const undoLastNode = useSimulationStore(s => s.undoLastNode);
    const traversalRecordsLength = useSimulationStore(s => s.traversalRecords.length);

    const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
    const campaigns = useCampaignStore(s => s.campaigns);
    const activeCampaignName = activeCampaignId && campaigns[activeCampaignId] ? campaigns[activeCampaignId].name : 'Default';

    if (!isCampaignActive) return null;

    return (
        <div className="floating-overlay-target">
            <div className="floating-pill floating-pill--campaign">
                <div className="fcb__name-pill">
                    <div className="fcb__status-dot"></div>
                    <span className="fcb__name">{activeCampaignName}</span>
                </div>

                <button
                    className="fcb__btn"
                    onClick={undoLastNode}
                    disabled={traversalRecordsLength === 0}
                    title="Undo Step"
                >
                    <Undo className="fcb__btn-icon" />
                    <span>Undo</span>
                </button>

                <button
                    className="fcb__btn"
                    onClick={resetSimulation}
                    title="Reset Simulation"
                >
                    <RotateCcw className="fcb__btn-icon" />
                    <span>Reset</span>
                </button>

                <div className="fcb__divider"></div>

                <button
                    className="fcb__btn fcb__btn--exit"
                    onClick={exitCampaign}
                    title="Exit Campaign Mode"
                >
                    <X className="fcb__btn-icon" />
                    <span>Exit</span>
                </button>
            </div>
        </div>
    );
}
