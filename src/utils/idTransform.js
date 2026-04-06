// ============================================================
// idTransform.js — Export/import ID transformation
// ============================================================
// toHierarchicalIds: Converts runtime random sub-element IDs
//   to human-readable hierarchical IDs for export.
// toRuntimeIds: Converts hierarchical import IDs back to
//   fresh random runtime IDs.
//
// Top-level entity IDs (N001, CH001, etc.) are never modified.
// Only sub-element IDs (conditions, variants, options, next
// entries) are transformed.
//
// Max nesting depth: 4 levels (e.g. CH001_OPT001_NE001_COND001)
// ============================================================

import { generateId } from './generateId.js';

// ── EXPORT: Runtime → Hierarchical ──────────────────────────

/**
 * Transform a data model from runtime random IDs to hierarchical
 * export IDs on all sub-elements.
 *
 * @param {object} dataModel — The full data model object with keys:
 *   metadata, path, chapter, flag, status, common, choice, ending, quest
 * @returns {object} A deep copy with hierarchical sub-element IDs.
 */
export function toHierarchicalIds(dataModel) {
  const result = structuredClone(dataModel);

  // Transform common nodes (N### prefix in export)
  if (result.common) {
    for (const entity of Object.values(result.common)) {
      transformCommonNodeExport(entity);
    }
  }

  // Transform choices (CH### prefix)
  if (result.choice) {
    for (const entity of Object.values(result.choice)) {
      transformChoiceExport(entity);
    }
  }

  // Transform endings (E### prefix)
  if (result.ending) {
    for (const entity of Object.values(result.ending)) {
      transformEndingExport(entity);
    }
  }

  return result;
}

/**
 * Transform a Common Node's sub-element IDs to hierarchical format.
 *
 * Hierarchy:
 *   N001_COND001       — condition on node requires
 *   N001_VAR001        — variant
 *   N001_VAR001_COND001 — condition on variant requires
 *   N001_NE001         — next entry
 *   N001_NE001_COND001 — condition on next entry requires
 */
function transformCommonNodeExport(node) {
  const parentId = node.id;

  // Node-level conditions
  if (node.requires?.conditions) {
    transformConditionsExport(node.requires.conditions, parentId, 'COND');
  }

  // Variants
  if (node.variants) {
    node.variants.forEach((variant, vi) => {
      const varId = `${parentId}_VAR${padIndex(vi)}`;
      variant.id = varId;

      // Variant-level conditions
      if (variant.requires?.conditions) {
        transformConditionsExport(variant.requires.conditions, varId, 'COND');
      }
    });
  }

  // Next entries
  if (node.next) {
    node.next.forEach((ne, ni) => {
      const neId = `${parentId}_NE${padIndex(ni)}`;
      ne.id = neId;

      // Next entry conditions
      if (ne.requires?.conditions) {
        transformConditionsExport(ne.requires.conditions, neId, 'COND');
      }
    });
  }
}

/**
 * Transform a Choice's sub-element IDs to hierarchical format.
 *
 * Hierarchy:
 *   CH001_COND001                  — condition on choice requires
 *   CH001_OPT001                   — option
 *   CH001_OPT001_COND001           — condition on option requires
 *   CH001_OPT001_NE001             — next entry on option
 *   CH001_OPT001_NE001_COND001     — condition on option next entry
 */
function transformChoiceExport(choice) {
  const parentId = choice.id;

  // Choice-level conditions
  if (choice.requires?.conditions) {
    transformConditionsExport(choice.requires.conditions, parentId, 'COND');
  }

  // Options
  if (choice.options) {
    choice.options.forEach((opt, oi) => {
      const optId = `${parentId}_OPT${padIndex(oi)}`;
      opt.id = optId;

      // Option-level conditions
      if (opt.requires?.conditions) {
        transformConditionsExport(opt.requires.conditions, optId, 'COND');
      }

      // Option next entries
      if (opt.next) {
        opt.next.forEach((ne, ni) => {
          const neId = `${optId}_NE${padIndex(ni)}`;
          ne.id = neId;

          // Option next entry conditions
          if (ne.requires?.conditions) {
            transformConditionsExport(ne.requires.conditions, neId, 'COND');
          }
        });
      }
    });
  }
}

/**
 * Transform an Ending's sub-element IDs to hierarchical format.
 *
 * Hierarchy:
 *   E001_COND001 — condition on ending requires
 */
function transformEndingExport(ending) {
  const parentId = ending.id;

  if (ending.requires?.conditions) {
    transformConditionsExport(ending.requires.conditions, parentId, 'COND');
  }
}

/**
 * Recursively transform condition IDs to hierarchical format.
 * Uses a flat counter across the entire condition tree so leaf
 * conditions get unique sequential IDs regardless of nesting.
 *
 * Nested groups (with `operator`) do NOT receive an ID — only
 * leaf conditions (flag/status checks) are numbered.
 *
 * @param {Array} conditions — The conditions array to transform in-place.
 * @param {string} prefix — Parent prefix (e.g. "N001", "CH001_OPT001").
 * @param {string} label — Sub-element label (always "COND" for conditions).
 * @param {object} [counter] — Shared counter object `{ value }` for flat numbering.
 */
function transformConditionsExport(conditions, prefix, label, counter = { value: 0 }) {
  for (const cond of conditions) {
    if (cond.operator != null) {
      // Nested group — no ID assigned, recurse with shared counter
      transformConditionsExport(cond.conditions ?? [], prefix, label, counter);
    } else {
      // Leaf condition — assign hierarchical ID with flat counter
      cond.id = `${prefix}_${label}${padIndex(counter.value)}`;
      counter.value++;
    }
  }
}

// ── IMPORT: Hierarchical → Runtime ──────────────────────────

/**
 * Transform imported data from hierarchical IDs to fresh random
 * runtime IDs on all sub-elements.
 *
 * Top-level entity IDs (N001, CH001, etc.) are preserved.
 * All sub-element IDs are replaced with fresh random IDs.
 *
 * @param {object} importData — The imported data model.
 * @returns {object} A deep copy with fresh random sub-element IDs.
 */
export function toRuntimeIds(importData) {
  const result = structuredClone(importData);

  // Transform common nodes
  if (result.common) {
    for (const entity of Object.values(result.common)) {
      transformCommonNodeImport(entity);
    }
  }

  // Transform choices
  if (result.choice) {
    for (const entity of Object.values(result.choice)) {
      transformChoiceImport(entity);
    }
  }

  // Transform endings
  if (result.ending) {
    for (const entity of Object.values(result.ending)) {
      transformEndingImport(entity);
    }
  }

  return result;
}

/**
 * Replace a Common Node's sub-element IDs with fresh random IDs.
 */
function transformCommonNodeImport(node) {
  // Node-level conditions
  if (node.requires?.conditions) {
    transformConditionsImport(node.requires.conditions);
  }

  // Variants
  if (node.variants) {
    for (const variant of node.variants) {
      variant.id = generateId('variant');

      if (variant.requires?.conditions) {
        transformConditionsImport(variant.requires.conditions);
      }
    }
  }

  // Next entries
  if (node.next) {
    for (const ne of node.next) {
      ne.id = generateId('route');

      if (ne.requires?.conditions) {
        transformConditionsImport(ne.requires.conditions);
      }
    }
  }
}

/**
 * Replace a Choice's sub-element IDs with fresh random IDs.
 */
function transformChoiceImport(choice) {
  // Choice-level conditions
  if (choice.requires?.conditions) {
    transformConditionsImport(choice.requires.conditions);
  }

  // Options
  if (choice.options) {
    for (const opt of choice.options) {
      opt.id = generateId('opt');

      if (opt.requires?.conditions) {
        transformConditionsImport(opt.requires.conditions);
      }

      // Option next entries
      if (opt.next) {
        for (const ne of opt.next) {
          ne.id = generateId('route');

          if (ne.requires?.conditions) {
            transformConditionsImport(ne.requires.conditions);
          }
        }
      }
    }
  }
}

/**
 * Replace an Ending's sub-element IDs with fresh random IDs.
 */
function transformEndingImport(ending) {
  if (ending.requires?.conditions) {
    transformConditionsImport(ending.requires.conditions);
  }
}

/**
 * Recursively replace all condition IDs with fresh random IDs.
 *
 * @param {Array} conditions — The conditions array to transform in-place.
 */
function transformConditionsImport(conditions) {
  for (const cond of conditions) {
    if (cond.operator != null) {
      // Nested group — recurse
      transformConditionsImport(cond.conditions ?? []);
    } else {
      // Leaf condition — replace ID
      cond.id = generateId('cond');
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Zero-pad a 0-based index to 3 digits for hierarchical IDs.
 * Uses 1-based numbering in output (index 0 → "001").
 *
 * @param {number} index — 0-based index.
 * @returns {string} Zero-padded 1-based string (e.g. "001", "012").
 */
function padIndex(index) {
  return String(index + 1).padStart(3, '0');
}
