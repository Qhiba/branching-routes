// ============================================================
// VariantEditor.jsx — Array editor for `variants`
// ============================================================
// Renders the variant list for a Common Node.
// Each variant has: text field + condition sub-editor.
// Supports add/remove.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-05: variants defaults to []
//   AR-06: variant IDs via generateId()
//   AR-09: styles via InspectorPanel.css
// ============================================================

import { useCallback, useState } from 'react';
import { generateId } from '@/utils/generateId.js';
import ConditionEditor from './ConditionEditor.jsx';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * Variant array editor.
 *
 * @param {object} props
 * @param {Array<{id: string, text: string, requires: object}>} props.value — Current variants array
 * @param {(value: Array) => void} props.onChange — Called with updated array
 */
function VariantEditor({ value = [], onChange }) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  const handleAdd = useCallback(() => {
    const variant = {
      id: generateId('variant'),
      text: '',
      requires: { operator: 'and', conditions: [] },
    };
    onChange([...(value || []), variant]);
  }, [value, onChange]);

  const handleRemove = useCallback(
    (index) => {
      const updated = [...(value || [])];
      updated.splice(index, 1);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleUpdateText = useCallback(
    (index, text) => {
      const updated = [...(value || [])];
      updated[index] = { ...updated[index], text };
      onChange(updated);
    },
    [value, onChange]
  );

  const handleUpdateRequires = useCallback(
    (index, requires) => {
      const updated = [...(value || [])];
      updated[index] = { ...updated[index], requires };
      onChange(updated);
    },
    [value, onChange]
  );

  const toggleExpanded = useCallback((variantId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  }, []);

  return (
    <div className="inspector-field">
      <div className="inspector-field__header">
        <label className="inspector-field__label">Variants</label>
        <button
          className="inspector-field__add-btn"
          onClick={handleAdd}
          title="Add variant"
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
      {(value || []).length === 0 ? (
        <div className="inspector-field__empty">No variants</div>
      ) : (
        <div className="inspector-field__array-list">
          {(value || []).map((variant, index) => {
            const isExpanded = expandedIds.has(variant.id);
            const condCount = variant.requires?.conditions?.length || 0;

            return (
              <div key={variant.id} className="inspector-field__array-block">
                <div className="inspector-field__array-row">
                  <button
                    className="inspector-field__expand-btn"
                    onClick={() => toggleExpanded(variant.id)}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                    type="button"
                  >
                    {isExpanded
                      ? <ChevronDown size={12} />
                      : <ChevronRight size={12} />}
                  </button>
                  <input
                    type="text"
                    className="inspector-field__input inspector-field__input--compact"
                    value={variant.text}
                    onChange={(e) => handleUpdateText(index, e.target.value)}
                    placeholder="Variant text..."
                  />
                  {condCount > 0 && (
                    <span className="inspector-field__badge">{condCount}</span>
                  )}
                  <button
                    className="inspector-field__remove-btn"
                    onClick={() => handleRemove(index)}
                    title="Remove variant"
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="inspector-field__nested">
                    <ConditionEditor
                      label="Conditions"
                      value={variant.requires}
                      onChange={(updated) => handleUpdateRequires(index, updated)}
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

export default VariantEditor;
