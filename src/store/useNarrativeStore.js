// ============================================================
// useNarrativeStore.js — Central Zustand store for all narrative data
// ============================================================
// Single source of truth for the entire narrative model.
// Manages all entity collections with full CRUD operations and
// JSON serialization (import/export).
//
// State shape:
//   { metadata, path, chapter, flag, status, common, choice, ending, quest }
//
// Architecture rules enforced:
//   AR-03: all `requires` are { operator, conditions: [] }
//   AR-04: all `next` are arrays of { id, target, requires }
//   AR-05: all array fields default to []
//   AR-06: sub-element IDs generated via generateId()
//   AR-07: entity names sanitized in store actions (not UI)
//   AR-10: _position persisted, excluded from logic
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  createCommonNode,
  createChoice,
  createEnding,
  createFlag,
  createStatusPoint,
  createPath,
  createChapter,
} from '../utils/entityDefaults.js';
import { sanitizeName } from '../utils/sanitizeName.js';
import { generateId } from '../utils/generateId.js';
import { toHierarchicalIds, toRuntimeIds } from '../utils/idTransform.js';

// ── Default metadata ────────────────────────────────────────

function createDefaultMetadata() {
  const now = new Date().toISOString();
  return {
    version: '2.0',
    created_at: now,
    updated_at: now,
    entry_node: null,
    common_node_types: ['interaction', 'cg', 'cutscene'],
    ending_types: ['good_end', 'bad_end', 'true_end', 'neutral'],
  };
}

// ── Default empty condition group (AR-03) ──────────────────

function emptyConditionGroup() {
  return { operator: 'and', conditions: [] };
}

// ── Condition helpers ───────────────────────────────────────

/**
 * Recursively remove all conditions referencing a deleted flag ID.
 * Works in-place on the conditions array.
 */
function removeConditionsByFlag(conditions, flagId) {
  if (!Array.isArray(conditions)) return;
  for (let i = conditions.length - 1; i >= 0; i--) {
    const cond = conditions[i];
    if (cond.operator != null) {
      // Nested group — recurse
      removeConditionsByFlag(cond.conditions, flagId);
    } else if (cond.flag === flagId) {
      conditions.splice(i, 1);
    }
  }
}

/**
 * Recursively remove all conditions referencing a deleted status ID.
 * Works in-place on the conditions array.
 */
function removeConditionsByStatus(conditions, statusId) {
  if (!Array.isArray(conditions)) return;
  for (let i = conditions.length - 1; i >= 0; i--) {
    const cond = conditions[i];
    if (cond.operator != null) {
      removeConditionsByStatus(cond.conditions, statusId);
    } else if (cond.status === statusId) {
      conditions.splice(i, 1);
    }
  }
}

/**
 * Recursively remove a specific condition by ID from conditions array.
 */
function removeConditionById(conditions, condId) {
  if (!Array.isArray(conditions)) return false;
  for (let i = conditions.length - 1; i >= 0; i--) {
    const cond = conditions[i];
    if (cond.operator != null) {
      removeConditionById(cond.conditions, condId);
    } else if (cond.id === condId) {
      conditions.splice(i, 1);
      return true;
    }
  }
  return false;
}

// ── Reference cleanup helpers ────────────────────────────────

/**
 * Clean all next[].target references to a deleted entity ID across
 * common nodes and choice options.
 */
function removeNextTargetRefs(state, deletedId) {
  // Clean common nodes
  for (const node of Object.values(state.common)) {
    node.next = node.next.filter((ne) => ne.target !== deletedId);
  }
  // Clean choice options
  for (const choice of Object.values(state.choice)) {
    for (const opt of choice.options) {
      opt.next = opt.next.filter((ne) => ne.target !== deletedId);
    }
  }
}

/**
 * Remove a flag ID from all flags_set arrays and all condition references.
 */
function purgeFlag(state, flagId) {
  // Remove from common node flags_set
  for (const node of Object.values(state.common)) {
    node.flags_set = node.flags_set.filter((id) => id !== flagId);
    removeConditionsByFlag(node.requires.conditions, flagId);
    for (const variant of node.variants) {
      removeConditionsByFlag(variant.requires.conditions, flagId);
    }
    for (const ne of node.next) {
      removeConditionsByFlag(ne.requires.conditions, flagId);
    }
  }
  // Remove from choice requires and options
  for (const choice of Object.values(state.choice)) {
    removeConditionsByFlag(choice.requires.conditions, flagId);
    for (const opt of choice.options) {
      opt.flags_set = opt.flags_set.filter((id) => id !== flagId);
      removeConditionsByFlag(opt.requires.conditions, flagId);
      for (const ne of opt.next) {
        removeConditionsByFlag(ne.requires.conditions, flagId);
      }
    }
  }
  // Remove from ending requires
  for (const ending of Object.values(state.ending)) {
    removeConditionsByFlag(ending.requires.conditions, flagId);
  }
}

/**
 * Remove a status point ID from all status_set arrays and all condition references.
 */
function purgeStatus(state, statusId) {
  // Remove from common node status_set
  for (const node of Object.values(state.common)) {
    node.status_set = node.status_set.filter((d) => d.status !== statusId);
    removeConditionsByStatus(node.requires.conditions, statusId);
    for (const variant of node.variants) {
      removeConditionsByStatus(variant.requires.conditions, statusId);
    }
    for (const ne of node.next) {
      removeConditionsByStatus(ne.requires.conditions, statusId);
    }
  }
  // Remove from choice options status_set and conditions
  for (const choice of Object.values(state.choice)) {
    removeConditionsByStatus(choice.requires.conditions, statusId);
    for (const opt of choice.options) {
      opt.status_set = opt.status_set.filter((d) => d.status !== statusId);
      removeConditionsByStatus(opt.requires.conditions, statusId);
      for (const ne of opt.next) {
        removeConditionsByStatus(ne.requires.conditions, statusId);
      }
    }
  }
  // Remove from ending requires
  for (const ending of Object.values(state.ending)) {
    removeConditionsByStatus(ending.requires.conditions, statusId);
  }
}

// ── Timestamp helper ─────────────────────────────────────────

function nowISO() {
  return new Date().toISOString();
}

// ── Store ────────────────────────────────────────────────────

export const useNarrativeStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State shape ─────────────────────────────────────────
    metadata: createDefaultMetadata(),
    path: {},
    chapter: {},
    flag: {},
    status: {},
    common: {},
    choice: {},
    ending: {},
    quest: {},

    // ── Metadata actions ────────────────────────────────────

    updateMetadata: (updates) => {
      set((state) => ({
        metadata: {
          ...state.metadata,
          ...updates,
          updated_at: nowISO(),
        },
      }));
    },

    setEntryNode: (nodeId) => {
      set((state) => ({
        metadata: { ...state.metadata, entry_node: nodeId, updated_at: nowISO() },
      }));
    },

    // ── Common Node CRUD ────────────────────────────────────

    addCommonNode: (overrides = {}) => {
      const node = createCommonNode(overrides);
      set((state) => ({
        common: { ...state.common, [node.id]: node },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return node.id;
    },

    updateCommonNode: (id, updates) => {
      set((state) => {
        const existing = state.common[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          // Sanitize name if provided (AR-07)
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          common: { ...state.common, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteCommonNode: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.common;
        const next = structuredClone({ common: remaining, choice: state.choice });
        removeNextTargetRefs(next, id);
        // Clear entry_node if it was this node
        const updatedMeta = {
          ...state.metadata,
          updated_at: nowISO(),
          ...(state.metadata.entry_node === id ? { entry_node: null } : {}),
        };
        return {
          common: next.common,
          choice: next.choice,
          metadata: updatedMeta,
        };
      });
    },

    // ── Choice CRUD ─────────────────────────────────────────

    addChoice: (overrides = {}) => {
      const choice = createChoice(overrides);
      set((state) => ({
        choice: { ...state.choice, [choice.id]: choice },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return choice.id;
    },

    updateChoice: (id, updates) => {
      set((state) => {
        const existing = state.choice[id];
        if (!existing) return {};
        return {
          choice: { ...state.choice, [id]: { ...existing, ...updates } },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteChoice: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.choice;
        const next = structuredClone({ common: state.common, choice: remaining });
        removeNextTargetRefs(next, id);
        return {
          common: next.common,
          choice: next.choice,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Ending CRUD ─────────────────────────────────────────

    addEnding: (overrides = {}) => {
      const ending = createEnding(overrides);
      set((state) => ({
        ending: { ...state.ending, [ending.id]: ending },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return ending.id;
    },

    updateEnding: (id, updates) => {
      set((state) => {
        const existing = state.ending[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          ending: { ...state.ending, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteEnding: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.ending;
        const next = structuredClone({ common: state.common, choice: state.choice });
        removeNextTargetRefs(next, id);
        return {
          ending: remaining,
          common: next.common,
          choice: next.choice,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Flag CRUD ───────────────────────────────────────────

    addFlag: (overrides = {}) => {
      const flag = createFlag(overrides);
      set((state) => ({
        flag: { ...state.flag, [flag.id]: flag },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return flag.id;
    },

    updateFlag: (id, updates) => {
      set((state) => {
        const existing = state.flag[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          flag: { ...state.flag, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteFlag: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.flag;
        const cloned = structuredClone({
          common: state.common,
          choice: state.choice,
          ending: state.ending,
        });
        purgeFlag(cloned, id);
        return {
          flag: remaining,
          common: cloned.common,
          choice: cloned.choice,
          ending: cloned.ending,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Status Point CRUD ────────────────────────────────────

    addStatusPoint: (overrides = {}) => {
      const sp = createStatusPoint(overrides);
      set((state) => ({
        status: { ...state.status, [sp.id]: sp },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return sp.id;
    },

    updateStatusPoint: (id, updates) => {
      set((state) => {
        const existing = state.status[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          status: { ...state.status, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteStatusPoint: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.status;
        const cloned = structuredClone({
          common: state.common,
          choice: state.choice,
          ending: state.ending,
        });
        purgeStatus(cloned, id);
        return {
          status: remaining,
          common: cloned.common,
          choice: cloned.choice,
          ending: cloned.ending,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Path CRUD ────────────────────────────────────────────

    addPath: (overrides = {}) => {
      const p = createPath(overrides);
      set((state) => ({
        path: { ...state.path, [p.id]: p },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return p.id;
    },

    updatePath: (id, updates) => {
      set((state) => {
        const existing = state.path[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          path: { ...state.path, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deletePath: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.path;
        // Null out path references in nodes that used this path
        const common = Object.fromEntries(
          Object.entries(state.common).map(([k, v]) => [
            k,
            v.path === id ? { ...v, path: null } : v,
          ])
        );
        const choice = Object.fromEntries(
          Object.entries(state.choice).map(([k, v]) => [
            k,
            v.path === id ? { ...v, path: null } : v,
          ])
        );
        const ending = Object.fromEntries(
          Object.entries(state.ending).map(([k, v]) => [
            k,
            v.path === id ? { ...v, path: null } : v,
          ])
        );
        const flag = Object.fromEntries(
          Object.entries(state.flag).map(([k, v]) => [
            k,
            v.path === id ? { ...v, path: null } : v,
          ])
        );
        const status = Object.fromEntries(
          Object.entries(state.status).map(([k, v]) => [
            k,
            v.path === id ? { ...v, path: null } : v,
          ])
        );
        return {
          path: remaining,
          common,
          choice,
          ending,
          flag,
          status,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Chapter CRUD ─────────────────────────────────────────

    addChapter: (overrides = {}) => {
      const ch = createChapter(overrides);
      set((state) => ({
        chapter: { ...state.chapter, [ch.id]: ch },
        metadata: { ...state.metadata, updated_at: nowISO() },
      }));
      return ch.id;
    },

    updateChapter: (id, updates) => {
      set((state) => {
        const existing = state.chapter[id];
        if (!existing) return {};
        const updated = {
          ...existing,
          ...updates,
          ...(updates.name != null ? { name: sanitizeName(updates.name) } : {}),
        };
        return {
          chapter: { ...state.chapter, [id]: updated },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    deleteChapter: (id) => {
      set((state) => {
        const { [id]: _removed, ...remaining } = state.chapter;
        // Null out chapter references in all entities
        const common = Object.fromEntries(
          Object.entries(state.common).map(([k, v]) => [
            k,
            v.chapter === id ? { ...v, chapter: null } : v,
          ])
        );
        const choice = Object.fromEntries(
          Object.entries(state.choice).map(([k, v]) => [
            k,
            v.chapter === id ? { ...v, chapter: null } : v,
          ])
        );
        const ending = Object.fromEntries(
          Object.entries(state.ending).map(([k, v]) => [
            k,
            v.chapter === id ? { ...v, chapter: null } : v,
          ])
        );
        const flag = Object.fromEntries(
          Object.entries(state.flag).map(([k, v]) => [
            k,
            v.chapter === id ? { ...v, chapter: null } : v,
          ])
        );
        const status = Object.fromEntries(
          Object.entries(state.status).map(([k, v]) => [
            k,
            v.chapter === id ? { ...v, chapter: null } : v,
          ])
        );
        return {
          chapter: remaining,
          common,
          choice,
          ending,
          flag,
          status,
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Next Entry sub-element CRUD ──────────────────────────
    // Applies to: Common Node `next[]` and Choice Option `next[]`

    /**
     * Add a next entry to a Common Node's `next` array.
     * @param {string} nodeId — Common Node ID
     * @param {string} target — Target entity ID
     * @param {object} [requiresOverride] — Optional condition group override
     * @returns {string} New next-entry ID
     */
    addNextEntry: (nodeId, target, requiresOverride) => {
      const entryId = generateId('route');
      const entry = {
        id: entryId,
        target,
        requires: requiresOverride ?? emptyConditionGroup(),
      };
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: { ...node, next: [...node.next, entry] },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
      return entryId;
    },

    /**
     * Remove a next entry from a Common Node by entry ID.
     * @param {string} nodeId — Common Node ID
     * @param {string} entryId — Next entry ID to remove
     */
    removeNextEntry: (nodeId, entryId) => {
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: {
              ...node,
              next: node.next.filter((ne) => ne.id !== entryId),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    /**
     * Update a next entry on a Common Node.
     * @param {string} nodeId — Common Node ID
     * @param {string} entryId — Next entry ID to update
     * @param {object} updates — Partial updates (target, requires)
     */
    updateNextEntry: (nodeId, entryId, updates) => {
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: {
              ...node,
              next: node.next.map((ne) =>
                ne.id === entryId ? { ...ne, ...updates } : ne
              ),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Option sub-element CRUD ──────────────────────────────
    // Applies to: Choice `options[]`

    /**
     * Add an option to a Choice's `options` array.
     * @param {string} choiceId — Choice entity ID
     * @param {object} [overrides] — Partial option field overrides
     * @returns {string} New option ID
     */
    addOption: (choiceId, overrides = {}) => {
      const optId = generateId('opt');
      const option = {
        id: optId,
        label: overrides.label ?? '',
        requires: overrides.requires ?? emptyConditionGroup(),
        flags_set: overrides.flags_set ?? [],
        status_set: overrides.status_set ?? [],
        next: overrides.next ?? [],
      };
      set((state) => {
        const choice = state.choice[choiceId];
        if (!choice) return {};
        return {
          choice: {
            ...state.choice,
            [choiceId]: { ...choice, options: [...choice.options, option] },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
      return optId;
    },

    /**
     * Update an option on a Choice.
     * @param {string} choiceId — Choice entity ID
     * @param {string} optionId — Option ID to update
     * @param {object} updates — Partial updates
     */
    updateOption: (choiceId, optionId, updates) => {
      set((state) => {
        const choice = state.choice[choiceId];
        if (!choice) return {};
        return {
          choice: {
            ...state.choice,
            [choiceId]: {
              ...choice,
              options: choice.options.map((opt) =>
                opt.id === optionId ? { ...opt, ...updates } : opt
              ),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    /**
     * Remove an option from a Choice by option ID.
     * @param {string} choiceId — Choice entity ID
     * @param {string} optionId — Option ID to remove
     */
    removeOption: (choiceId, optionId) => {
      set((state) => {
        const choice = state.choice[choiceId];
        if (!choice) return {};
        return {
          choice: {
            ...state.choice,
            [choiceId]: {
              ...choice,
              options: choice.options.filter((opt) => opt.id !== optionId),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    /**
     * Add a next entry to a specific Choice Option.
     * @param {string} choiceId — Choice entity ID
     * @param {string} optionId — Option ID
     * @param {string} target — Target entity ID
     * @param {object} [requiresOverride] — Optional condition group
     * @returns {string} New next-entry ID
     */
    addOptionNextEntry: (choiceId, optionId, target, requiresOverride) => {
      const entryId = generateId('route');
      const entry = {
        id: entryId,
        target,
        requires: requiresOverride ?? emptyConditionGroup(),
      };
      set((state) => {
        const choice = state.choice[choiceId];
        if (!choice) return {};
        return {
          choice: {
            ...state.choice,
            [choiceId]: {
              ...choice,
              options: choice.options.map((opt) =>
                opt.id === optionId
                  ? { ...opt, next: [...opt.next, entry] }
                  : opt
              ),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
      return entryId;
    },

    /**
     * Remove a next entry from a Choice Option.
     * @param {string} choiceId — Choice entity ID
     * @param {string} optionId — Option ID
     * @param {string} entryId — Next entry ID to remove
     */
    removeOptionNextEntry: (choiceId, optionId, entryId) => {
      set((state) => {
        const choice = state.choice[choiceId];
        if (!choice) return {};
        return {
          choice: {
            ...state.choice,
            [choiceId]: {
              ...choice,
              options: choice.options.map((opt) =>
                opt.id === optionId
                  ? { ...opt, next: opt.next.filter((ne) => ne.id !== entryId) }
                  : opt
              ),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Variant sub-element CRUD ─────────────────────────────
    // Applies to: Common Node `variants[]`

    /**
     * Add a variant to a Common Node's `variants` array.
     * @param {string} nodeId — Common Node ID
     * @param {object} [overrides] — Partial variant field overrides
     * @returns {string} New variant ID
     */
    addVariant: (nodeId, overrides = {}) => {
      const variantId = generateId('variant');
      const variant = {
        id: variantId,
        requires: overrides.requires ?? emptyConditionGroup(),
        text: overrides.text ?? '',
      };
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: { ...node, variants: [...node.variants, variant] },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
      return variantId;
    },

    /**
     * Update a variant on a Common Node.
     * @param {string} nodeId — Common Node ID
     * @param {string} variantId — Variant ID to update
     * @param {object} updates — Partial updates (text, requires)
     */
    updateVariant: (nodeId, variantId, updates) => {
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: {
              ...node,
              variants: node.variants.map((v) =>
                v.id === variantId ? { ...v, ...updates } : v
              ),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    /**
     * Remove a variant from a Common Node by variant ID.
     * @param {string} nodeId — Common Node ID
     * @param {string} variantId — Variant ID to remove
     */
    removeVariant: (nodeId, variantId) => {
      set((state) => {
        const node = state.common[nodeId];
        if (!node) return {};
        return {
          common: {
            ...state.common,
            [nodeId]: {
              ...node,
              variants: node.variants.filter((v) => v.id !== variantId),
            },
          },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Condition sub-element CRUD ───────────────────────────
    // Generic add/remove for any condition group in any entity

    /**
     * Add a condition to a condition group inside any entity.
     *
     * @param {string} entityType — Collection key: 'common'|'choice'|'ending'
     * @param {string} entityId — Entity ID
     * @param {object} conditionDef — The condition to add. Can be:
     *   - Flag condition:   { flag: 'F001', state: true }
     *   - Status condition: { status: 'SP001', min: 0 }
     *   - Nested group:     { operator: 'and', conditions: [] }
     * @param {string|null} [targetPath] — Dot-path to the condition group to add to.
     *   Examples:
     *   - null → entity root `requires`
     *   - 'variants.VARIANT_ID.requires'
     *   - 'next.NEXT_ID.requires'
     *   - 'options.OPT_ID.requires'
     *   - 'options.OPT_ID.next.NEXT_ID.requires'
     * @returns {string} New condition ID (only for leaf conditions)
     */
    addCondition: (entityType, entityId, conditionDef, targetPath = null) => {
      const condId = generateId('cond');
      const isLeaf = conditionDef.operator == null;
      const condition = isLeaf
        ? { id: condId, ...conditionDef }
        : { ...conditionDef };

      set((state) => {
        const collection = state[entityType];
        if (!collection) return {};
        const entity = collection[entityId];
        if (!entity) return {};

        const cloned = structuredClone(entity);
        const targetGroup = resolveConditionGroupPath(cloned, targetPath);
        if (targetGroup) {
          targetGroup.conditions.push(condition);
        }

        return {
          [entityType]: { ...collection, [entityId]: cloned },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });

      return isLeaf ? condId : null;
    },

    /**
     * Remove a condition by ID from any entity's condition tree.
     *
     * @param {string} entityType — Collection key: 'common'|'choice'|'ending'
     * @param {string} entityId — Entity ID
     * @param {string} condId — Condition ID to remove
     * @param {string|null} [targetPath] — Same path convention as addCondition
     */
    removeCondition: (entityType, entityId, condId, targetPath = null) => {
      set((state) => {
        const collection = state[entityType];
        if (!collection) return {};
        const entity = collection[entityId];
        if (!entity) return {};

        const cloned = structuredClone(entity);
        const targetGroup = resolveConditionGroupPath(cloned, targetPath);
        if (targetGroup) {
          removeConditionById(targetGroup.conditions, condId);
        }

        return {
          [entityType]: { ...collection, [entityId]: cloned },
          metadata: { ...state.metadata, updated_at: nowISO() },
        };
      });
    },

    // ── Import / Export ──────────────────────────────────────

    /**
     * Load the store from a valid JSON data model object.
     * Applies `toRuntimeIds` for fresh sub-element IDs.
     * Sanitizes all entity names (AR-07).
     *
     * @param {object} json — Parsed data model object
     */
    loadFromJSON: (json) => {
      // Apply runtime ID replacement on sub-elements
      const withRuntimeIds = toRuntimeIds(json);

      // Sanitize all entity names on import (AR-07)
      sanitizeAllNames(withRuntimeIds);

      set({
        metadata: withRuntimeIds.metadata ?? createDefaultMetadata(),
        path: withRuntimeIds.path ?? {},
        chapter: withRuntimeIds.chapter ?? {},
        flag: withRuntimeIds.flag ?? {},
        status: withRuntimeIds.status ?? {},
        common: withRuntimeIds.common ?? {},
        choice: withRuntimeIds.choice ?? {},
        ending: withRuntimeIds.ending ?? {},
        quest: withRuntimeIds.quest ?? {},
      });
    },

    /**
     * Produce a valid export JSON from the current store state.
     * Applies `toHierarchicalIds` for human-readable sub-element IDs.
     *
     * @returns {object} Export-ready data model object
     */
    toExportJSON: () => {
      const state = get();
      const dataModel = {
        metadata: {
          ...state.metadata,
          updated_at: nowISO(),
        },
        path: state.path,
        chapter: state.chapter,
        flag: state.flag,
        status: state.status,
        common: state.common,
        choice: state.choice,
        ending: state.ending,
        quest: state.quest,
      };
      return toHierarchicalIds(dataModel);
    },

    /**
     * Reset the store to a clean empty state.
     */
    resetStore: () => {
      set({
        metadata: createDefaultMetadata(),
        path: {},
        chapter: {},
        flag: {},
        status: {},
        common: {},
        choice: {},
        ending: {},
        quest: {},
      });
    },
  }))
);

// ── Path resolution helper ────────────────────────────────────

/**
 * Resolve a dot-path string to a condition group inside a cloned entity.
 * Returns the target ConditionGroup object, or `entity.requires` if path is null.
 *
 * Supported path segments:
 *   - 'requires'          → entity.requires
 *   - 'variants.ID.*'     → entity.variants[id].*
 *   - 'next.ID.*'         → entity.next[id].*
 *   - 'options.ID.*'      → entity.options[id].*
 *   - 'options.ID.next.ID.requires'
 *
 * @param {object} entity — Cloned entity object
 * @param {string|null} path — Dot-separated path string, or null for root requires
 * @returns {object|null} The condition group, or null if not found
 */
function resolveConditionGroupPath(entity, path) {
  if (path == null) {
    // Default: entity root requires
    return entity.requires ?? null;
  }

  const parts = path.split('.');
  let current = entity;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === 'requires') {
      return current.requires ?? null;
    }

    if (part === 'variants' || part === 'next' || part === 'options') {
      const arrayId = parts[i + 1];
      i++; // Consume the ID
      const arr = current[part];
      if (!Array.isArray(arr)) return null;
      current = arr.find((item) => item.id === arrayId);
      if (!current) return null;
      continue;
    }

    // Unknown segment
    return null;
  }

  return null;
}

// ── Name sanitization on import ───────────────────────────────

/**
 * Sanitize all entity names in a loaded data model in-place (AR-07).
 * @param {object} dataModel
 */
function sanitizeAllNames(dataModel) {
  const collections = ['path', 'chapter', 'flag', 'status', 'common', 'ending'];
  for (const key of collections) {
    if (!dataModel[key]) continue;
    for (const entity of Object.values(dataModel[key])) {
      if (entity.name != null) {
        entity.name = sanitizeName(entity.name);
      }
    }
  }
  // Choice has `text`, not `name` — no sanitization needed per data model
}
