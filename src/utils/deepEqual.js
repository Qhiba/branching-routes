// ============================================================
// deepEqual.js — Structural deep equality check
// ============================================================
// Replaces JSON.stringify comparison (anti-pattern AP3).
// Handles objects, arrays, primitives, null, and undefined.
// ============================================================

/**
 * Perform a structural deep equality check between two values.
 *
 * Supports: primitives, null, undefined, plain objects, arrays.
 * Does NOT support: Date, RegExp, Map, Set, class instances, etc.
 * (The data model only uses plain JSON-serializable structures.)
 *
 * @param {*} a — First value.
 * @param {*} b — Second value.
 * @returns {boolean} `true` if structurally equal.
 *
 * @example
 *   deepEqual({ a: 1 }, { a: 1 })          // true
 *   deepEqual([1, 2], [1, 2])                // true
 *   deepEqual({ a: 1 }, { a: 1, b: 2 })     // false
 *   deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }) // true (order-insensitive)
 */
export function deepEqual(a, b) {
  // Identical references or identical primitives
  if (a === b) return true;

  // If either is null/undefined (and they're not ===), they differ
  if (a == null || b == null) return false;

  // Different types
  if (typeof a !== typeof b) return false;

  // Primitives that aren't === are not equal
  if (typeof a !== 'object') return false;

  // Array check — both must be arrays or both must not be
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;

  if (aIsArray) {
    // Array comparison: same length, same elements in order
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Object comparison: same keys, same values (order-insensitive)
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}
