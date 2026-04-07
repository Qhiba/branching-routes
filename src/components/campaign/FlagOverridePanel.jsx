// ============================================================
// FlagOverridePanel.jsx — Flag toggle switches for campaign state
// ============================================================
// Renders a list of all flags from the narrative store with
// toggle switches. Toggling a flag sets/clears an override in
// the simulation store, which then feeds into the simulation
// engine via useSimulationSync.
//
// Dependencies: useNarrativeStore (flag list), useSimulationStore (overrides)
// Architecture: AR-02 (state in stores), AR-09 (tokens in CSS)
// ============================================================

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { X } from 'lucide-react';

/**
 * FlagOverridePanel — renders all flags with toggle overrides.
 *
 * Each flag shows:
 *   - Flag name (monospaced)
 *   - Toggle switch bound to simulation store flagOverrides
 *   - Clear button to remove the override (revert to data model default)
 */
export default function FlagOverridePanel() {
  const flags = useNarrativeStore((s) => s.flag);
  const flagOverrides = useSimulationStore((s) => s.flagOverrides);
  const setFlagOverride = useSimulationStore((s) => s.setFlagOverride);
  const clearFlagOverride = useSimulationStore((s) => s.clearFlagOverride);

  const flagEntries = Object.values(flags);

  if (flagEntries.length === 0) {
    return (
      <div className="campaign-panel__list-empty">
        No flags defined yet.
      </div>
    );
  }

  return (
    <div className="flag-override-list">
      {flagEntries.map((flag) => {
        const hasOverride = flag.id in flagOverrides;
        // Display value: override if set, otherwise data model default
        const currentValue = hasOverride
          ? flagOverrides[flag.id]
          : (flag.state ?? false);

        return (
          <div key={flag.id} className="flag-override-item">
            <span className="flag-override-item__name" title={flag.id}>
              {flag.name || flag.id}
            </span>

            <label className="toggle-switch">
              <input
                className="toggle-switch__input"
                type="checkbox"
                checked={currentValue}
                onChange={(e) => setFlagOverride(flag.id, e.target.checked)}
              />
              <span className="toggle-switch__track" />
              <span className="toggle-switch__thumb" />
            </label>

            <button
              className="flag-override-item__clear"
              title="Clear override (revert to default)"
              disabled={!hasOverride}
              onClick={() => clearFlagOverride(flag.id)}
              style={hasOverride ? {} : { visibility: 'hidden' }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
