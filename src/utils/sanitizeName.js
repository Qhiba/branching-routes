// ============================================================
// sanitizeName.js — Entity name sanitization
// ============================================================
// Lowercases and replaces non-alphanumeric characters with
// underscores (AR-07). Enforced on creation and import.
// ============================================================

/**
 * Sanitize an entity name to lowercase_with_underscores.
 *
 * Rules:
 * 1. Convert to lowercase.
 * 2. Replace every non-alphanumeric character (including spaces,
 *    punctuation, unicode) with `_`.
 * 3. Consecutive underscores are NOT collapsed — the transform
 *    is a simple 1:1 character replacement.
 *
 * @param {string} name — Raw entity name from user input or import.
 * @returns {string} Sanitized name.
 *
 * @example
 *   sanitizeName('My Scene Name!')  // "my_scene_name_"
 *   sanitizeName('hello-world 123') // "hello_world_123"
 *   sanitizeName('UPPER_case')      // "upper_case"
 *   sanitizeName('')                // ""
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
