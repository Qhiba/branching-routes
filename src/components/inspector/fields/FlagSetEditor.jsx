// ============================================================
// FlagSetEditor.jsx — Multi-select for `flags_set`
// ============================================================
// Renders a list of all defined flags with checkboxes,
// allowing the user to toggle which flags are set by an entity.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-02: reads flag list from useNarrativeStore
//   AR-05: flags_set is always an array, never null
//   AR-09: styling via InspectorPanel.css
// ============================================================

import { useCallback } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';

/**
 * Multi-select flag editor.
 *
 * @param {object} props
 * @param {string[]} props.value — Current flags_set array (flag IDs)
 * @param {(value: string[]) => void} props.onChange — Called with updated array
 */
function FlagSetEditor({ value = [], onChange }) {
  const flags = useNarrativeStore((s) => s.flag);
  const flagList = Object.values(flags);

  const handleToggle = useCallback(
    (flagId) => {
      const current = value || [];
      if (current.includes(flagId)) {
        onChange(current.filter((id) => id !== flagId));
      } else {
        onChange([...current, flagId]);
      }
    },
    [value, onChange]
  );

  if (flagList.length === 0) {
    return (
      <div className="inspector-field">
        <label className="inspector-field__label">Flags Set</label>
        <div className="inspector-field__empty">
          No flags defined. Press <kbd>F</kbd> to create one.
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-field">
      <label className="inspector-field__label">Flags Set</label>
      <div className="inspector-field__checkbox-list">
        {flagList.map((flag) => {
          const checked = (value || []).includes(flag.id);
          return (
            <label
              key={flag.id}
              className={`inspector-field__checkbox-item ${checked ? 'inspector-field__checkbox-item--checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(flag.id)}
                className="inspector-field__checkbox"
              />
              <span className="inspector-field__checkbox-label">
                {flag.name || flag.id}
              </span>
              <span className="inspector-field__checkbox-id">{flag.id}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default FlagSetEditor;
