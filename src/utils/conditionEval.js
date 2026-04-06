// ============================================================
// conditionEval.js — Recursive condition group evaluation
// ============================================================
// Evaluates nested AND/OR condition groups against runtime
// flag and status state. Used by simulation engine and
// route tracing.
// ============================================================

/**
 * Evaluate a condition group against the current flag and status state.
 *
 * Condition group structure (AR-03):
 *   { operator: "and"|"or", conditions: [...] }
 *
 * Condition types:
 *   - Flag:   { id, flag, state }       → flagMap[flag] === state
 *   - Status (min only):  { id, status, min }        → statusMap[status] >= min
 *   - Status (max only):  { id, status, max }        → statusMap[status] <= max
 *   - Status (range):     { id, status, min, max }   → min <= statusMap[status] <= max
 *   - Nested group:       { operator, conditions }    → recursive evaluation
 *
 * @param {object} conditionGroup — A condition group object `{ operator, conditions }`.
 * @param {object} flagMap — Map of flag ID → boolean (e.g. `{ F001: true, F002: false }`).
 * @param {object} statusMap — Map of status ID → number (e.g. `{ SP001: 5, SP002: -3 }`).
 * @returns {boolean} Whether the condition group passes.
 *
 * @example
 *   evaluateCondition(
 *     { operator: 'and', conditions: [
 *       { id: 'c1', flag: 'F001', state: true },
 *       { id: 'c2', status: 'SP001', min: 0 },
 *     ]},
 *     { F001: true },
 *     { SP001: 5 }
 *   ) // → true
 */
export function evaluateCondition(conditionGroup, flagMap, statusMap) {
  // Empty or invalid groups pass (no constraints = always valid)
  if (!conditionGroup || !conditionGroup.conditions) return true;

  const { operator, conditions } = conditionGroup;

  // Empty conditions array always passes
  if (conditions.length === 0) return true;

  if (operator === 'and') {
    return conditions.every((cond) => evaluateSingle(cond, flagMap, statusMap));
  }

  if (operator === 'or') {
    return conditions.some((cond) => evaluateSingle(cond, flagMap, statusMap));
  }

  // Unknown operator — fail safe (treat as unmet)
  return false;
}

/**
 * Evaluate a single condition entry. May be a leaf condition
 * (flag or status) or a nested group (has `operator` field).
 *
 * @param {object} cond — Single condition or nested group.
 * @param {object} flagMap — Flag state map.
 * @param {object} statusMap — Status value map.
 * @returns {boolean}
 */
function evaluateSingle(cond, flagMap, statusMap) {
  // Nested group — recurse
  if (cond.operator != null) {
    return evaluateCondition(cond, flagMap, statusMap);
  }

  // Flag condition: { id, flag, state }
  if (cond.flag != null) {
    // Empty flag ID is invalid data — fail the condition
    if (cond.flag === '') return false;
    const currentState = flagMap[cond.flag] ?? false;
    return currentState === cond.state;
  }

  // Status condition: { id, status, min?, max? }
  if (cond.status != null) {
    // Empty status ID is invalid data — fail the condition
    if (cond.status === '') return false;
    const currentValue = statusMap[cond.status] ?? 0;
    const hasMin = cond.min != null;
    const hasMax = cond.max != null;

    if (hasMin && hasMax) {
      return currentValue >= cond.min && currentValue <= cond.max;
    }
    if (hasMin) {
      return currentValue >= cond.min;
    }
    if (hasMax) {
      return currentValue <= cond.max;
    }

    // Status condition with no min/max — malformed, fail the condition
    return false;
  }

  // Unknown condition type — fail safe
  return false;
}
