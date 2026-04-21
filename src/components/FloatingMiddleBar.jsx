import React, { useState, useEffect } from 'react';
import {
  Play,
  Undo,
  RotateCcw,
  X,
  GitCommit,
  GitPullRequest,
  BoxSelect,
  ChevronDown,
} from 'lucide-react';
import { useSimulationStore, useCampaignStore } from 'store';

export default function FloatingMiddleBar() {
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const traversalRecordsLength = useSimulationStore(s => s.traversalRecords.length);
  const undoLastNode = useSimulationStore(s => s.undoLastNode);
  const reset = useSimulationStore(s => s.reset);
  const exitCampaign = useSimulationStore(s => s.exitCampaign);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);

  const campaignDict = useCampaignStore(s => s.campaigns);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);
  const activeCampaignName = useCampaignStore(
    s => s.activeCampaignId && s.campaigns[s.activeCampaignId]?.name
      ? s.campaigns[s.activeCampaignId].name
      : ''
  );

  const campaigns = Object.values(campaignDict);

  const [selectedCampaignId, setSelectedCampaignId] = useState(
    campaigns.length > 0 ? campaigns[0].id : ''
  );

  useEffect(() => {
    if (campaigns.length > 0) {
      setSelectedCampaignId(prev =>
        campaigns.find(c => c.id === prev) ? prev : campaigns[0].id
      );
    }
  }, [campaigns]);

  // AR-19: Dispatch DOM events for node creation — opens NodeConfigModal first
  const handleAddNode = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
  };

  const handleStartCampaign = () => {
    setActiveCampaign(selectedCampaignId);
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    enterCampaign(campaign);
  };

  if (isCampaignActive) {
    return (
      <div className="floating-overlay-target">
        <div className="floating-pill floating-pill--campaign">
          <div className="fcb__name-pill">
            <div className="fcb__status-dot" />
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
            onClick={reset}
            title="Reset Simulation"
          >
            <RotateCcw className="fcb__btn-icon" />
            <span>Reset</span>
          </button>

          <div className="fcb__divider" />

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

  return (
    <div className="floating-overlay-target">
      <div className="floating-pill floating-pill--creation">
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className="topbar__control-btn"
            onClick={() => handleAddNode('common')}
            title="Add Common Node"
          >
            <GitCommit className="topbar__control-icon" style={{ color: 'var(--color-node-common)' }} />
            <span>Common</span>
          </button>
          <button
            className="topbar__control-btn"
            onClick={() => handleAddNode('choice')}
            title="Add Choice Node"
          >
            <GitPullRequest className="topbar__control-icon" style={{ color: 'var(--color-node-choice)' }} />
            <span>Choice</span>
          </button>
          <button
            className="topbar__control-btn"
            onClick={() => handleAddNode('ending')}
            title="Add Ending Node"
          >
            <BoxSelect className="topbar__control-icon" style={{ color: 'var(--color-node-ending)' }} />
            <span>Ending</span>
          </button>
        </div>

        <div className="fcb__divider" />

        {campaigns.length > 0 ? (
          <>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="topbar__title-input"
                style={{
                  width: '160px',
                  paddingRight: '28px',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 'var(--radius-full)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown
                className="topbar__control-icon"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  opacity: 0.5,
                }}
              />
            </div>

            <button
              onClick={handleStartCampaign}
              className="topbar__action-btn"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px',
                fontWeight: 'bold',
                border: 'none',
              }}
            >
              <Play className="topbar__control-icon" style={{ fill: 'currentColor' }} />
              Start
            </button>
          </>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: '0 var(--space-2)' }}>
            No campaigns
          </span>
        )}
      </div>
    </div>
  );
}
