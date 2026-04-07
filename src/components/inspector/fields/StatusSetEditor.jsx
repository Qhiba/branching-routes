// ============================================================
// StatusSetEditor.jsx — Array editor for `status_set` entries
// ============================================================
// Renders a list of status delta entries, each with a status
// point selector and an amount number input. Supports add/remove.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-02: reads status list from useNarrativeStore
//   AR-05: status_set defaults to []
//   AR-09: styling via InspectorPanel.css
// ============================================================

import { useCallback } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Status set array editor.
 *
 * @param {object} props
 * @param {Array<{status: string, amount: number}>} props.value — Current status_set array
 * @param {(value: Array<{status: string, amount: number}>) => void} props.onChange — Called with updated array
 */
function StatusSetEditor({ value = [], onChange }) {
  const statusPoints = useNarrativeStore((s) => s.status);
  const statusList = Object.values(statusPoints);

  const handleAdd = useCallback(() => {
    if (statusList.length === 0) return;
    // Default to the first status point not already in the list
    const usedIds = (value || []).map((d) => d.status);
    const available = statusList.find((sp) => !usedIds.includes(sp.id));
    const targetId = available ? available.id : statusList[0].id;
    onChange([...(value || []), { status: targetId, amount: 0 }]);
  }, [value, onChange, statusList]);

  const handleRemove = useCallback(
    (index) => {
      const updated = [...(value || [])];
      updated.splice(index, 1);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (index, field, newValue) => {
      const updated = [...(value || [])];
      updated[index] = {
        ...updated[index],
        [field]: field === 'amount' ? Number(newValue) || 0 : newValue,
      };
      onChange(updated);
    },
    [value, onChange]
  );

  const statusOptions = statusList.map((sp) => ({
    value: sp.id,
    label: sp.name || sp.id,
  }));

  return (
    <div className="inspector-field">
      <div className="inspector-field__header">
        <label className="inspector-field__label">Status Set</label>
        <button
          className="inspector-field__add-btn"
          onClick={handleAdd}
          disabled={statusList.length === 0}
          title="Add status delta"
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
      {statusList.length === 0 ? (
        <div className="inspector-field__empty">
          No status points defined. Press <kbd>S</kbd> to create one.
        </div>
      ) : (value || []).length === 0 ? (
        <div className="inspector-field__empty">No status effects</div>
      ) : (
        <div className="inspector-field__array-list">
          {(value || []).map((delta, index) => (
            <div key={index} className="inspector-field__array-row">
              <select
                className="inspector-field__select inspector-field__select--compact"
                value={delta.status}
                onChange={(e) => handleChange(index, 'status', e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="inspector-field__input inspector-field__input--number"
                value={delta.amount}
                onChange={(e) => handleChange(index, 'amount', e.target.value)}
                title="Amount (+ or -)"
              />
              <button
                className="inspector-field__remove-btn"
                onClick={() => handleRemove(index)}
                title="Remove"
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusSetEditor;
