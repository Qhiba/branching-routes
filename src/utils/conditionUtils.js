/**
 * Condition Group Utilities
 *
 * Provides helpers for the two-level OR-of-AND condition group system.
 * A "group" is { operator: 'and'|'or', conditions: [...] } where conditions
 * are either leaf conditions ({ flag, state } or { status, min, max }) or
 * nested groups.
 *
 * Legacy flat arrays are auto-converted by normalizeRequires().
 */

export function isConditionGroup(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && (obj.operator === 'and' || obj.operator === 'or');
}

export function isLeafCondition(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && (obj.flag !== undefined || obj.status !== undefined);
}

/**
 * Normalize a requires value into a group structure.
 * Handles: null, undefined, [], legacy flat array, or already a group.
 */
export function normalizeRequires(requires) {
  if (!requires || (Array.isArray(requires) && requires.length === 0)) {
    return { operator: 'and', conditions: [] };
  }
  if (Array.isArray(requires)) {
    return { operator: 'and', conditions: requires };
  }
  if (isConditionGroup(requires)) {
    return requires;
  }
  return { operator: 'and', conditions: [] };
}

/**
 * True if group is an AND group with zero conditions (i.e., always passes).
 */
export function isFallbackGroup(group) {
  const normalized = normalizeRequires(group);
  return normalized.operator === 'and' && normalized.conditions.length === 0;
}

/**
 * Check if a group has any leaf conditions at any depth.
 */
export function hasConditions(group) {
  const normalized = normalizeRequires(group);
  return flattenConditions(normalized).length > 0;
}

/**
 * Recursively extract all leaf conditions from a group tree.
 */
export function flattenConditions(group) {
  const normalized = normalizeRequires(group);
  const result = [];
  for (const item of normalized.conditions) {
    if (isLeafCondition(item)) {
      result.push(item);
    } else if (isConditionGroup(item)) {
      result.push(...flattenConditions(item));
    }
  }
  return result;
}

/**
 * Recursive evaluator: AND → every, OR → some.
 * State is { flags: { [id]: boolean }, status: { [id]: number } }.
 */
export function evaluateGroup(group, state) {
  const normalized = normalizeRequires(group);

  if (normalized.conditions.length === 0) return true;

  if (normalized.operator === 'and') {
    return normalized.conditions.every(item => {
      if (isLeafCondition(item)) return evaluateLeaf(item, state);
      if (isConditionGroup(item)) return evaluateGroup(item, state);
      return true;
    });
  }

  // OR
  return normalized.conditions.some(item => {
    if (isLeafCondition(item)) return evaluateLeaf(item, state);
    if (isConditionGroup(item)) return evaluateGroup(item, state);
    return true;
  });
}

function evaluateLeaf(leaf, state) {
  if (leaf.flag) {
    return state.flags[leaf.flag] === leaf.state;
  }
  if (leaf.status) {
    const val = state.status[leaf.status];
    if (leaf.min !== undefined && val < leaf.min) return false;
    if (leaf.max !== undefined && val > leaf.max) return false;
    return true;
  }
  return true;
}

/**
 * Recursively filter out leaf conditions matching a predicate.
 * Prunes empty sub-groups after filtering.
 */
export function filterConditions(group, predicate) {
  const normalized = normalizeRequires(group);
  const filtered = normalized.conditions
    .map(item => {
      if (isLeafCondition(item)) {
        return predicate(item) ? null : item;
      }
      if (isConditionGroup(item)) {
        return filterConditions(item, predicate);
      }
      return item;
    })
    .filter(item => {
      if (item === null) return false;
      if (isConditionGroup(item)) return item.conditions.length > 0;
      return true;
    });

  return { operator: normalized.operator, conditions: filtered };
}

/**
 * Produce a compact display string for a condition group.
 * AND groups: "a AND b"
 * OR groups: "a ∨ b"
 */
export function conditionsSummary(group, maxItems = 4) {
  const normalized = normalizeRequires(group);
  if (normalized.conditions.length === 0) return '';

  const sep = normalized.operator === 'or' ? ' ∨ ' : ' · ';
  const labels = normalized.conditions.map(item => {
    if (isLeafCondition(item)) {
      return leafLabel(item);
    }
    if (isConditionGroup(item)) {
      const inner = conditionsSummary(item, maxItems);
      if (item.operator === 'or') {
        return `(${inner})`;
      }
      return inner;
    }
    return '?';
  });

  const visible = labels.slice(0, maxItems);
  const extra = labels.length > maxItems ? [`+${labels.length - maxItems}`] : [];
  return [...visible, ...extra].join(sep);
}

function leafLabel(leaf) {
  if (leaf.flag) return `${leaf.flag}=${String(leaf.state)}`;
  if (leaf.status) {
    const parts = [];
    if (leaf.min !== undefined) parts.push(`≥${leaf.min}`);
    if (leaf.max !== undefined) parts.push(`≤${leaf.max}`);
    return `${leaf.status}${parts.length > 0 ? ' ' + parts.join(' ') : ''}`;
  }
  return '?';
}
