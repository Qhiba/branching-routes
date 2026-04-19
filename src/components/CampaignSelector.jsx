import React, { useState } from 'react';
import { useCampaignStore, useSimulationStore } from 'store';

export default function CampaignSelector() {
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);
  const resetSimulation = useSimulationStore(s => s.reset);

  const campaigns = useCampaignStore(s => s.campaigns);
  const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
  const addCampaign = useCampaignStore(s => s.addCampaign);
  const deleteCampaign = useCampaignStore(s => s.deleteCampaign);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);

  const [newName, setNewName] = useState('');

  // Active mode: campaign name label + Reset Campaign button.
  // Save controls are in the Sandbox sidebar panel.
  if (isCampaignActive) {
    const activeName = activeCampaignId && campaigns[activeCampaignId] ? campaigns[activeCampaignId].name : '';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeName && <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{activeName}</span>}
        <button className="topbar__btn topbar__btn--secondary" onClick={resetSimulation}>
          Reset Campaign
        </button>
      </span>
    );
  }

  const campaignList = Object.values(campaigns);

  if (campaignList.length === 0) {
    return (
      <button
        className="topbar__btn topbar__btn--primary"
        onClick={() => {
          const id = addCampaign('Default');
          setActiveCampaign(id);
          enterCampaign();
        }}
      >
        Enter Campaign Mode
      </button>
    );
  }

  const handleCreate = () => {
    if (!newName.trim()) return;
    addCampaign(newName.trim());
    setNewName('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {campaignList.map(camp => (
          <div key={camp.id} style={{ display: 'flex', alignItems: 'center', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>
            <span style={{ fontSize: '0.85rem', marginRight: '6px' }}>{camp.name}</span>
            <button 
              className="topbar__btn topbar__btn--primary" 
              style={{ padding: '2px 6px', fontSize: '0.75rem', marginRight: '2px' }}
              onClick={() => {
                setActiveCampaign(camp.id);
                enterCampaign(camp); 
              }}>
              Enter
            </button>
            <button 
              className="topbar__btn" 
              style={{ padding: '2px 6px', fontSize: '0.75rem' }}
              onClick={() => deleteCampaign(camp.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
        <input 
          type="text" 
          value={newName} 
          onChange={e => setNewName(e.target.value)} 
          placeholder="New Campaign"
          className="topbar__title-input"
          style={{ width: '120px' }}
        />
        <button className="topbar__btn" onClick={handleCreate}>Create</button>
      </div>
    </div>
  );
}
