import React from 'react';
import { useNarrativeStore, useSimulationStore } from 'store';

// FIX 3: Campaign Save section (autosave toggle, save, load) removed from SandboxPanel;
//         those controls moved to FloatingMiddleBar campaign pill
export default function SandboxPanel() {
  const flags = useNarrativeStore(s => s.flag || {});
  const statuses = useNarrativeStore(s => s.status || {});

  const currentFlagValues = useSimulationStore(s => s.currentFlagValues);
  const applySandboxOverride = useSimulationStore(s => s.applySandboxOverride);

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
