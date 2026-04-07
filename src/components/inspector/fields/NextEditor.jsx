// ============================================================
// NextEditor.jsx — Array editor for `next` entries
// ============================================================
// Renders the outgoing connections list for a Common Node.
// Each entry shows: target picker + condition sub-editor.
// Supports add/remove and editing conditions per entry.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-02: reads node/choice/ending lists from useNarrativeStore
//   AR-04: next is always [{id, target, requires}], never null
//   AR-05: defaults to []
//   AR-06: new entry IDs via generateId()
//   AR-09: styles via InspectorPanel.css
// ============================================================

import { useCallback, useState } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { generateId } from '@/utils/generateId.js';
import ConditionEditor from './ConditionEditor.jsx';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

/**
 * Next entries array editor.
 *
 * @param {object} props
 * @param {Array<{id: string, target: string, requires: object}>} props.value — Current next array
 * @param {(value: Array) => void} props.onChange — Called with updated array
 * @param {string} [props.label="Routing (Next)"] — Label text
 */
function NextEditor({ value = [], onChange, label = 'Routing (Next)' }) {
  const common = useNarrativeStore((s) => s.common);
  const choice = useNarrativeStore((s) => s.choice);
  const ending = useNarrativeStore((s) => s.ending);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Build target options from all graph entities
  const targetOptions = [
    ...Object.values(common).map((n) => ({
      value: n.id,
      label: `[N] ${n.name || n.id}`,
    })),
    ...Object.values(choice).map((c) => ({
      value: c.id,
      label: `[CH] ${c.text?.substring(0, 20) || c.id}`,
    })),
    ...Object.values(ending).map((e) => ({
      value: e.id,
      label: `[E] ${e.name || e.id}`,
    })),
  ];

  const handleAdd = useCallback(() => {
    const entry = {
      id: generateId('route'),
      target: targetOptions.length > 0 ? targetOptions[0].value : '',
      requires: { operator: 'and', conditions: [] },
    };
    onChange([...(value || []), entry]);
  }, [value, onChange, targetOptions]);

  const handleRemove = useCallback(
    (index) => {
      const updated = [...(value || [])];
      updated.splice(index, 1);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleUpdateTarget = useCallback(
    (index, target) => {
      const updated = [...(value || [])];
      updated[index] = { ...updated[index], target };
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

  const toggleExpanded = useCallback((entryId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  return (
    <div className="inspector-field">
      <div className="inspector-field__header">
        <label className="inspector-field__label">{label}</label>
        <button
          className="inspector-field__add-btn"
          onClick={handleAdd}
          title="Add routing entry"
          type="button"
        >
          <Plus size={12} />
        </button>
      </div>
      {(value || []).length === 0 ? (
        <div className="inspector-field__empty">No outgoing connections</div>
      ) : (
        <div className="inspector-field__array-list">
          {(value || []).map((entry, index) => {
            const isExpanded = expandedIds.has(entry.id);
            const condCount = entry.requires?.conditions?.length || 0;

            return (
              <div key={entry.id} className="inspector-field__array-block">
                <div className="inspector-field__array-row">
                  <button
                    className="inspector-field__expand-btn"
                    onClick={() => toggleExpanded(entry.id)}
                    title={isExpanded ? 'Collapse' : 'Expand conditions'}
                    type="button"
                  >
                    {isExpanded
                      ? <ChevronDown size={12} />
                      : <ChevronRight size={12} />}
                  </button>
                  <select
                    className="inspector-field__select inspector-field__select--compact"
                    value={entry.target}
                    onChange={(e) => handleUpdateTarget(index, e.target.value)}
                  >
                    <option value="">— Select target —</option>
                    {targetOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {condCount > 0 && (
                    <span className="inspector-field__badge">{condCount}</span>
                  )}
                  <button
                    className="inspector-field__remove-btn"
                    onClick={() => handleRemove(index)}
                    title="Remove"
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="inspector-field__nested">
                    <ConditionEditor
                      label="Conditions"
                      value={entry.requires}
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

export default NextEditor;
