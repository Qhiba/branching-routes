// ============================================================
// StatusOverridePanel.jsx — Status point number inputs for campaign state
// ============================================================
// Renders a list of all status points from the narrative store
// with number inputs. Changing a value sets an override in the
// simulation store, which feeds into the simulation engine.
//
// Dependencies: useNarrativeStore (status list), useSimulationStore (overrides)
// Architecture: AR-02 (state in stores), AR-09 (tokens in CSS)
// ============================================================

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { X } from 'lucide-react';

/**
 * StatusOverridePanel — renders all status points with override inputs.
 *
 * Each status point shows:
 *   - Status name (monospaced)
 *   - Range label (min–max if applicable)
 *   - Number input bound to simulation store statusOverrides
 *   - Clear button to remove the override (revert to data model default)
 */
export default function StatusOverridePanel() {
  const statusPoints = useNarrativeStore((s) => s.status);
  const statusOverrides = useSimulationStore((s) => s.statusOverrides);
  const setStatusOverride = useSimulationStore((s) => s.setStatusOverride);
  const clearStatusOverride = useSimulationStore((s) => s.clearStatusOverride);

  const statusEntries = Object.values(statusPoints);

  if (statusEntries.length === 0) {
    return (
      <div className="campaign-panel__list-empty">
        No status points defined yet.
      </div>
    );
  }

  return (
    <div className="status-override-list">
      {statusEntries.map((sp) => {
        const hasOverride = sp.id in statusOverrides;
        // Display value: override if set, otherwise data model default
        const currentValue = hasOverride
          ? statusOverrides[sp.id]
          : (sp.value ?? 0);

        // Build range label
        const minLabel = sp.minValue != null ? sp.minValue : '−∞';
        const maxLabel = sp.maxValue != null ? sp.maxValue : '∞';

        return (
          <div key={sp.id} className="status-override-item">
            <span className="status-override-item__name" title={sp.id}>
              {sp.name || sp.id}
            </span>

            <span className="status-override-item__range">
              [{minLabel}..{maxLabel}]
            </span>

            <input
              className="status-override-item__input"
              type="number"
              value={currentValue}
              min={sp.minValue ?? undefined}
              max={sp.maxValue ?? undefined}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || raw === '-') return;
                let num = parseInt(raw, 10);
                if (isNaN(num)) return;
                // Clamp to min/max if defined
                if (sp.minValue != null && num < sp.minValue) num = sp.minValue;
                if (sp.maxValue != null && num > sp.maxValue) num = sp.maxValue;
                setStatusOverride(sp.id, num);
              }}
            />

            <button
              className="status-override-item__clear"
              title="Clear override (revert to default)"
              disabled={!hasOverride}
              onClick={() => clearStatusOverride(sp.id)}
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
