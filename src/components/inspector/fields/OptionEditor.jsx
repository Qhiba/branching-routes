// ============================================================
// OptionEditor.jsx — Array editor for Choice `options`
// ============================================================
// Renders the options list for a Choice entity.
// Each option includes: label, requires (conditions),
// flags_set, status_set, and next (routing).
// Supports add/remove and collapsible detail sections.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-05: all array fields default to []
//   AR-06: option IDs via generateId()
//   AR-09: styles via InspectorPanel.css
// ============================================================

import { useCallback, useState } from 'react';
import { generateId } from '@/utils/generateId.js';
import ConditionEditor from './ConditionEditor.jsx';
import NextEditor from './NextEditor.jsx';
import FlagSetEditor from './FlagSetEditor.jsx';
import StatusSetEditor from './StatusSetEditor.jsx';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * Choice options array editor.
 *
 * @param {object} props
 * @param {Array<object>} props.value — Current options array
 * @param {(value: Array) => void} props.onChange — Called with updated array
 */
function OptionEditor({ value = [], onChange }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const handleAdd = useCallback(() => {
    const option = {
      id: generateId('opt'),
      label: '',
      requires: { operator: 'and', conditions: [] },
      flags_set: [],
      status_set: [],
      next: [],
    };
    onChange([...(value || []), option]);
  }, [value, onChange]);

  const handleRemove = useCallback(
    (index) => {
      const updated = [...(value || [])];
      updated.splice(index, 1);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleUpdateField = useCallback(
    (index, field, newValue) => {
      const updated = [...(value || [])];
      updated[index] = { ...updated[index], [field]: newValue };
      onChange(updated);
    },
    [value, onChange]
  );

  const toggleExpanded = useCallback((optionId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  }, []);

  return (
    <div className="inspector-field">
      <div className="inspector-field__header">
        <label className="inspector-field__label">Options</label>
        <button
          className="inspector-field__add-btn"
          onClick={handleAdd}
          title="Add option"
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
      {(value || []).length === 0 ? (
        <div className="inspector-field__empty">No options defined</div>
      ) : (
        <div className="inspector-field__array-list">
          {(value || []).map((option, index) => {
            const isExpanded = expandedIds.has(option.id);
            const condCount = option.requires?.conditions?.length || 0;
            const flagCount = option.flags_set?.length || 0;
            const statusCount = option.status_set?.length || 0;
            const nextCount = option.next?.length || 0;
            const badgeTotal = condCount + flagCount + statusCount + nextCount;

            return (
              <div key={option.id} className="inspector-field__array-block inspector-field__array-block--option">
                {/* Option header row */}
                <div className="inspector-field__array-row">
                  <button
                    className="inspector-field__expand-btn"
                    onClick={() => toggleExpanded(option.id)}
                    title={isExpanded ? 'Collapse' : 'Expand details'}
                    type="button"
                  >
                    {isExpanded
                      ? <ChevronDown size={12} />
                      : <ChevronRight size={12} />}
                  </button>
                  <input
                    type="text"
                    className="inspector-field__input inspector-field__input--compact"
                    value={option.label}
                    onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                    placeholder="Option label..."
                  />
                  {badgeTotal > 0 && (
                    <span className="inspector-field__badge">{badgeTotal}</span>
                  )}
                  <button
                    className="inspector-field__remove-btn"
                    onClick={() => handleRemove(index)}
                    title="Remove option"
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="inspector-field__nested inspector-field__nested--option">
                    {/* Prerequisites */}
                    <ConditionEditor
                      label="Requires"
                      value={option.requires}
                      onChange={(updated) => handleUpdateField(index, 'requires', updated)}
                    />

                    {/* Side effects: flags */}
                    <FlagSetEditor
                      value={option.flags_set}
                      onChange={(updated) => handleUpdateField(index, 'flags_set', updated)}
                    />

                    {/* Side effects: status */}
                    <StatusSetEditor
                      value={option.status_set}
                      onChange={(updated) => handleUpdateField(index, 'status_set', updated)}
                    />

                    {/* Routing */}
                    <NextEditor
                      label="Routing (Next)"
                      value={option.next}
                      onChange={(updated) => handleUpdateField(index, 'next', updated)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OptionEditor;
