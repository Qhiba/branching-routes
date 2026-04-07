// ============================================================
// ConditionEditor.jsx — Recursive AND/OR condition tree editor
// ============================================================
// Renders a recursive condition group tree with:
//   - AND/OR operator toggle at each group level
//   - Add flag condition / status condition / nested group
//   - Remove condition at any depth
//   - Visual nesting with indentation and color coding
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-02: reads flag/status lists from useNarrativeStore
//   AR-03: all requires fields are {operator, conditions:[]}
//   AR-05: conditions array defaults to []
//   AR-06: condition IDs generated via generateId()
//   AR-09: styling via ConditionEditor.css
// ============================================================

import { useCallback } from 'react';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { generateId } from '@/utils/generateId.js';
import {
  Plus,
  Trash2,
  FolderPlus,
  Flag,
  BarChart2,
} from 'lucide-react';

import './ConditionEditor.css';

// ── Recursive group renderer ─────────────────────────────────

/**
 * Renders a single condition group and its children recursively.
 *
 * @param {object} props
 * @param {object} props.group — The condition group { operator, conditions }
 * @param {(updatedGroup: object) => void} props.onUpdate — Callback when group changes
 * @param {Array} props.flags — All flags from the store
 * @param {Array} props.statusPoints — All status points from the store
 * @param {number} [props.depth=0] — Nesting depth for visual indentation
 * @param {boolean} [props.removable=false] — Whether this group can be removed
 * @param {() => void} [props.onRemove] — Callback to remove this group
 */
function ConditionGroup({
  group,
  onUpdate,
  flags,
  statusPoints,
  depth = 0,
  removable = false,
  onRemove,
}) {
  const operator = group?.operator || 'and';
  const conditions = group?.conditions || [];

  // Toggle AND ↔ OR
  const handleToggleOperator = useCallback(() => {
    onUpdate({
      ...group,
      operator: operator === 'and' ? 'or' : 'and',
    });
  }, [group, operator, onUpdate]);

  // Add a flag condition
  const handleAddFlagCondition = useCallback(() => {
    const defaultFlagId = flags.length > 0 ? flags[0].id : '';
    const newCondition = {
      id: generateId('cond'),
      flag: defaultFlagId,
      state: true,
    };
    onUpdate({
      ...group,
      conditions: [...conditions, newCondition],
    });
  }, [group, conditions, flags, onUpdate]);

  // Add a status condition
  const handleAddStatusCondition = useCallback(() => {
    const defaultStatusId = statusPoints.length > 0 ? statusPoints[0].id : '';
    const newCondition = {
      id: generateId('cond'),
      status: defaultStatusId,
      min: 0,
    };
    onUpdate({
      ...group,
      conditions: [...conditions, newCondition],
    });
  }, [group, conditions, statusPoints, onUpdate]);

  // Add a nested group
  const handleAddNestedGroup = useCallback(() => {
    const nestedGroup = {
      operator: 'and',
      conditions: [],
    };
    onUpdate({
      ...group,
      conditions: [...conditions, nestedGroup],
    });
  }, [group, conditions, onUpdate]);

  // Remove a condition by index
  const handleRemoveCondition = useCallback(
    (index) => {
      const updated = [...conditions];
      updated.splice(index, 1);
      onUpdate({ ...group, conditions: updated });
    },
    [group, conditions, onUpdate]
  );

  // Update a leaf condition by index
  const handleUpdateCondition = useCallback(
    (index, updatedCond) => {
      const updated = [...conditions];
      updated[index] = updatedCond;
      onUpdate({ ...group, conditions: updated });
    },
    [group, conditions, onUpdate]
  );

  // Determine depth-based accent color class
  const depthClass = `condition-group--depth-${Math.min(depth, 3)}`;

  return (
    <div className={`condition-group ${depthClass}`}>
      {/* Group header */}
      <div className="condition-group__header">
        <button
          className="condition-group__operator-btn"
          onClick={handleToggleOperator}
          title={`Switch to ${operator === 'and' ? 'OR' : 'AND'}`}
          type="button"
        >
          {operator.toUpperCase()}
        </button>

        <div className="condition-group__actions">
          <button
            className="condition-group__action-btn"
            onClick={handleAddFlagCondition}
            title="Add flag condition"
            disabled={flags.length === 0}
            type="button"
          >
            <Flag size={11} />
          </button>
          <button
            className="condition-group__action-btn"
            onClick={handleAddStatusCondition}
            title="Add status condition"
            disabled={statusPoints.length === 0}
            type="button"
          >
            <BarChart2 size={11} />
          </button>
          <button
            className="condition-group__action-btn"
            onClick={handleAddNestedGroup}
            title="Add nested group"
            type="button"
          >
            <FolderPlus size={11} />
          </button>
          {removable && (
            <button
              className="condition-group__action-btn condition-group__action-btn--danger"
              onClick={onRemove}
              title="Remove group"
              type="button"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Condition list */}
      {conditions.length === 0 ? (
        <div className="condition-group__empty">
          No conditions (always passes)
        </div>
      ) : (
        <div className="condition-group__list">
          {conditions.map((cond, index) => {
            // Nested group
            if (cond.operator != null) {
              return (
                <ConditionGroup
                  key={`group-${index}`}
                  group={cond}
                  onUpdate={(updated) => handleUpdateCondition(index, updated)}
                  flags={flags}
                  statusPoints={statusPoints}
                  depth={depth + 1}
                  removable
                  onRemove={() => handleRemoveCondition(index)}
                />
              );
            }

            // Flag condition
            if (cond.flag != null) {
              return (
                <FlagConditionRow
                  key={cond.id}
                  condition={cond}
                  flags={flags}
                  onUpdate={(updated) => handleUpdateCondition(index, updated)}
                  onRemove={() => handleRemoveCondition(index)}
                />
              );
            }

            // Status condition
            if (cond.status != null) {
              return (
                <StatusConditionRow
                  key={cond.id}
                  condition={cond}
                  statusPoints={statusPoints}
                  onUpdate={(updated) => handleUpdateCondition(index, updated)}
                  onRemove={() => handleRemoveCondition(index)}
                />
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Flag condition row ───────────────────────────────────────

function FlagConditionRow({ condition, flags, onUpdate, onRemove }) {
  return (
    <div className="condition-row condition-row--flag">
      <Flag size={11} className="condition-row__icon" />
      <select
        className="condition-row__select"
        value={condition.flag}
        onChange={(e) => onUpdate({ ...condition, flag: e.target.value })}
      >
        {flags.length === 0 && (
          <option value="">No flags</option>
        )}
        {flags.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name || f.id}
          </option>
        ))}
      </select>
      <select
        className="condition-row__select condition-row__select--state"
        value={condition.state ? 'true' : 'false'}
        onChange={(e) =>
          onUpdate({ ...condition, state: e.target.value === 'true' })
        }
      >
        <option value="true">= true</option>
        <option value="false">= false</option>
      </select>
      <button
        className="condition-row__remove-btn"
        onClick={onRemove}
        title="Remove condition"
        type="button"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ── Status condition row ─────────────────────────────────────

function StatusConditionRow({ condition, statusPoints, onUpdate, onRemove }) {
  return (
    <div className="condition-row condition-row--status">
      <BarChart2 size={11} className="condition-row__icon" />
      <select
        className="condition-row__select"
        value={condition.status}
        onChange={(e) => onUpdate({ ...condition, status: e.target.value })}
      >
        {statusPoints.length === 0 && (
          <option value="">No status points</option>
        )}
        {statusPoints.map((sp) => (
          <option key={sp.id} value={sp.id}>
            {sp.name || sp.id}
          </option>
        ))}
      </select>
      <input
        type="number"
        className="condition-row__number"
        value={condition.min ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onUpdate({
            ...condition,
            min: val === '' ? undefined : Number(val),
          });
        }}
        placeholder="min"
        title="Minimum value"
      />
      <input
        type="number"
        className="condition-row__number"
        value={condition.max ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onUpdate({
            ...condition,
            max: val === '' ? undefined : Number(val),
          });
        }}
        placeholder="max"
        title="Maximum value"
      />
      <button
        className="condition-row__remove-btn"
        onClick={onRemove}
        title="Remove condition"
        type="button"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ── Main ConditionEditor ─────────────────────────────────────

/**
 * Recursive condition group editor.
 *
 * @param {object} props
 * @param {string} [props.label="Requires"] — Label text
 * @param {object} props.value — The condition group { operator, conditions }
 * @param {(updatedGroup: object) => void} props.onChange — Callback when group is updated
 */
function ConditionEditor({ label = 'Requires', value, onChange }) {
  const flags = Object.values(useNarrativeStore((s) => s.flag));
  const statusPoints = Object.values(useNarrativeStore((s) => s.status));

  // Ensure we always have a valid group (AR-03)
  const group = value && value.operator
    ? value
    : { operator: 'and', conditions: [] };

  return (
    <div className="inspector-field">
      <label className="inspector-field__label">{label}</label>
      <ConditionGroup
        group={group}
        onUpdate={onChange}
        flags={flags}
        statusPoints={statusPoints}
        depth={0}
      />
    </div>
  );
}

export default ConditionEditor;
