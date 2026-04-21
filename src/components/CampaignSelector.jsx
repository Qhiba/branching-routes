import React from 'react';
import { useCampaignStore, useSimulationStore } from 'store';
import { Play, ChevronDown } from 'lucide-react';

/**
 * CampaignSelector (Phase 1 UI Refresh)
 * Renders the campaign dropdown and start button in the TopBar.
 */
export default function CampaignSelector() {
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);

  const campaigns = useCampaignStore(s => s.campaigns);
  const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);

  // If campaign is active, the FloatingCampaignBar handles the UI.
  if (isCampaignActive) return null;

  const campaignList = Object.values(campaigns);

  // If no campaigns, auto-create a default one
  if (campaignList.length === 0) {
    return (
      <button
        className="topbar__action-btn"
        style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
        onClick={() => {
          const { useCampaignStore: store } = require('store'); // safety if needed
          const id = store.getState().addCampaign('Default');
          setActiveCampaign(id);
          enterCampaign();
        }}
      >
        <Play className="topbar__control-icon" /> Initialize Campaign
      </button>
    );
  }

  const handleStart = () => {
    const activeCamp = campaigns[activeCampaignId] || campaignList[0];
    if (!activeCampaignId) setActiveCampaign(activeCamp.id);
    enterCampaign(activeCamp);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative' }}>
        <select
          value={activeCampaignId || ''}
          onChange={(e) => setActiveCampaign(e.target.value)}
          className="topbar__title-input"
          style={{
            width: '160px',
            paddingRight: '32px',
            fontSize: 'var(--font-size-xs)',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            appearance: 'none',
            cursor: 'pointer'
          }}
        >
          {campaignList.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <ChevronDown
          className="topbar__control-icon"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            opacity: 0.5
          }}
        />
      </div>

      <button
        onClick={handleStart}
        className="topbar__action-btn"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          padding: '6px 16px',
          fontWeight: 'bold',
          border: 'none'
        }}
      >
        <Play className="topbar__control-icon" style={{ fill: 'currentColor' }} /> Start
      </button>
    </div>
  );
}
