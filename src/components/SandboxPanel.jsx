import React, { useState } from 'react';
import { useNarrativeStore, useSimulationStore, useCampaignStore } from 'store';

export default function SandboxPanel() {
  const flags = useNarrativeStore(s => s.flag || {});
  const statuses = useNarrativeStore(s => s.status || {});
  
  const currentFlagValues = useSimulationStore(s => s.currentFlagValues);
  const applySandboxOverride = useSimulationStore(s => s.applySandboxOverride);
  const snapshotCampaign = useSimulationStore(s => s.snapshotCampaign);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);
  const autosaveCampaign = useSimulationStore(s => s.autosaveCampaign);
  const setAutosaveCampaign = useSimulationStore(s => s.setAutosaveCampaign);

  const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
  const campaigns = useCampaignStore(s => s.campaigns);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);
  const activeCampaign = activeCampaignId ? campaigns[activeCampaignId] : null;
  const hasSavedSnapshot = activeCampaign?.snapshot?.activeNodeId != null;

  const [saveFlash, setSaveFlash] = useState(false);

  const handleSave = () => {
    snapshotCampaign();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleLoadSave = () => {
    if (!activeCampaign) return;
    // Re-enter the campaign using the stored snapshot
    setActiveCampaign(activeCampaign.id);
    enterCampaign(activeCampaign);
  };

  const handleFlagToggle = (flagId) => {
    const currentValue = currentFlagValues[flagId] || false;
    applySandboxOverride(flagId, !currentValue);
  };

  const handleStatusChange = (statusId, evt, min, max) => {
    let val = parseInt(evt.target.value, 10);
    if (isNaN(val)) return;
    if (val < min) val = min;
    if (val > max) val = max;
    applySandboxOverride(statusId, val);
  };

  return (
    <div className="sandbox-panel">
      {/* Campaign Save Controls */}
      <div className="sandbox-panel__section">
        <h4 className="sandbox-panel__section-title">Campaign Save</h4>

        {/* Autosave toggle */}
        <label className="sandbox-panel__item" style={{ cursor: 'pointer', marginBottom: '8px' }}>
          <input 
            type="checkbox" 
            checked={autosaveCampaign} 
            onChange={() => setAutosaveCampaign(!autosaveCampaign)} 
          />
          <span className="sandbox-panel__item-name">Auto-save on exit</span>
        </label>

        {/* Overwrite warning */}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.6, margin: '4px 0 8px 0', lineHeight: 1.4 }}>
          Saving will overwrite the existing save slot. This cannot be undone.
        </p>

        {/* Save button */}
        <button 
          style={{ 
            marginTop: '8px', 
            padding: '10px', 
            background: 'var(--color-accent)', 
            color: 'white', 
            border: '1px solid var(--color-accent)', 
            cursor: 'pointer', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '6px'
          }} 
          onClick={handleSave}
        >
          {saveFlash ? 'Saved ✓' : 'Save Progression'}
        </button>

        {/* Load last save button */}
        <button 
          style={{ 
            padding: '10px', 
            background: hasSavedSnapshot ? 'var(--color-bg-base)' : 'var(--color-bg-hover)', 
            color: hasSavedSnapshot ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', 
            border: '1px solid var(--color-border)', 
            cursor: hasSavedSnapshot ? 'pointer' : 'not-allowed', 
            borderRadius: '4px', 
            fontWeight: 'bold',
            width: '100%',
            opacity: hasSavedSnapshot ? 1 : 0.6
          }} 
          onClick={handleLoadSave}
          disabled={!hasSavedSnapshot}
        >
          Load Last Save
        </button>
      </div>

      <div className="sandbox-panel__header">
        <h3 className="sandbox-panel__title">Campaign Sandbox</h3>
        <p className="sandbox-panel__subtitle">Override values to test conditions. Resets on exit.</p>
      </div>

      <div className="sandbox-panel__section">
        <h4 className="sandbox-panel__section-title">Flags</h4>
        {Object.values(flags).length === 0 ? (
          <p className="sandbox-panel__empty">No flags defined.</p>
        ) : (
          <div className="sandbox-panel__list">
            {Object.values(flags).map(f => (
              <label key={f.id} className="sandbox-panel__item">
                <input 
                  type="checkbox" 
                  checked={!!currentFlagValues[f.id]} 
                  onChange={() => handleFlagToggle(f.id)} 
                />
                <span className="sandbox-panel__item-name">{f.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="sandbox-panel__section">
        <h4 className="sandbox-panel__section-title">Status Metrics</h4>
        {Object.values(statuses).length === 0 ? (
          <p className="sandbox-panel__empty">No statuses defined.</p>
        ) : (
          <div className="sandbox-panel__list">
            {Object.values(statuses).map(s => (
              <label key={s.id} className="sandbox-panel__item sandbox-panel__item--numeric">
                <span className="sandbox-panel__item-name">{s.name}</span>
                <input 
                  type="number" 
                  value={currentFlagValues[s.id] !== undefined ? currentFlagValues[s.id] : s.value} 
                  min={s.min} 
                  max={s.max}
                  onChange={(e) => handleStatusChange(s.id, e, s.min, s.max)} 
                  className="sandbox-panel__input-number"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
