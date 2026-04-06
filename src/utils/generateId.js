// ============================================================
// generateId.js — Unique ID generation with prefix
// ============================================================
// Produces IDs in the format: "prefix_<timestamp>_<4-char random>"
// No module-level mutable state (AR-06, anti-pattern AP7).
// ============================================================

/**
 * Generate a unique ID string.
 *
 * @param {string} prefix — Short prefix describing the element type
 *   (e.g. "cond", "opt", "variant", "route").
 * @returns {string} ID in the format `"prefix_<timestamp>_<4rand>"`
 *
 * @example
 *   generateId('cond')    // "cond_1712345678901_a7x9"
 *   generateId('opt')     // "opt_1712345678902_k3m2"
 *   generateId('variant') // "variant_1712345678903_p4z8"
 */
export function generateId(prefix) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random}`;
}
