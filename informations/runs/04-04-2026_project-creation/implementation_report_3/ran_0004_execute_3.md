# Phase 3 — Execute Report: Zustand Stores (Narrative)

> **Prompt:** `0004_execute.md`
> **Date:** 2026-04-06
> **Phase:** 3 — Zustand Stores (Narrative)

---

## 1. Files Produced

| # | File | Path | Status |
|---|------|------|--------|
| 1 | `useNarrativeStore.js` | `src/store/useNarrativeStore.js` | **Created** |

---

## 2. Implementation Summary

### Store Architecture

`useNarrativeStore` is a Zustand store wrapped with `subscribeWithSelector` middleware for granular reactive subscriptions. The store is a single flat module following the data model from §4 of the plan.

**State shape:**
```js
{
  metadata: { version, created_at, updated_at, entry_node, common_node_types, ending_types },
  path:    { [id]: PathEntity },
  chapter: { [id]: ChapterEntity },
  flag:    { [id]: FlagEntity },
  status:  { [id]: StatusPointEntity },
  common:  { [id]: CommonNodeEntity },
  choice:  { [id]: ChoiceEntity },
  ending:  { [id]: EndingEntity },
  quest:   {},
}
```

### CRUD Actions Implemented

| Entity | Add | Update | Delete |
|--------|-----|--------|--------|
| Common Node | `addCommonNode` | `updateCommonNode` | `deleteCommonNode` |
| Choice | `addChoice` | `updateChoice` | `deleteChoice` |
| Ending | `addEnding` | `updateEnding` | `deleteEnding` |
| Flag | `addFlag` | `updateFlag` | `deleteFlag` |
| Status Point | `addStatusPoint` | `updateStatusPoint` | `deleteStatusPoint` |
| Path | `addPath` | `updatePath` | `deletePath` |
| Chapter | `addChapter` | `updateChapter` | `deleteChapter` |

### Sub-element CRUD Actions

| Sub-element | Add | Update | Remove |
|-------------|-----|--------|--------|
| Common Node Next Entry | `addNextEntry` | `updateNextEntry` | `removeNextEntry` |
| Choice Option | `addOption` | `updateOption` | `removeOption` |
| Option Next Entry | `addOptionNextEntry` | — | `removeOptionNextEntry` |
| Common Node Variant | `addVariant` | `updateVariant` | `removeVariant` |
| Condition (generic) | `addCondition` | — | `removeCondition` |

### Condition Path System

`addCondition` and `removeCondition` accept a `targetPath` string parameter using a dot-notation resolver (`resolveConditionGroupPath`). Supported paths:

- `null` — entity root `requires`
- `'requires'` — same as null
- `'variants.VARIANT_ID.requires'`
- `'next.NEXT_ID.requires'`
- `'options.OPT_ID.requires'`
- `'options.OPT_ID.next.NEXT_ID.requires'`

### Cascade Delete Behaviour (Acceptance Criterion 6)

| Deleted Entity | Cascade Effect |
|----------------|----------------|
| Common Node | Removes `next[].target` refs in all common nodes + all choice options; clears `entry_node` if it was this node |
| Choice | Removes `next[].target` refs pointing to this choice in all common nodes + choice options |
| Ending | Removes `next[].target` refs pointing to this ending |
| Flag | Removes from all `flags_set[]`; removes all `requires.conditions` referencing this flag (recursive, covering variants, next entries, options) |
| Status Point | Removes from all `status_set[]`; removes all `requires.conditions` referencing this status (recursive) |
| Path | Nulls out `.path` field on all common nodes, choices, endings, flags, status points |
| Chapter | Nulls out `.chapter` field on all common nodes, choices, endings, flags, status points |

### Import / Export

- **`loadFromJSON(json)`** — applies `toRuntimeIds()` to regenerate fresh random sub-element IDs, then sanitizes all entity names (AR-07), then sets state in one `set()` call.
- **`toExportJSON()`** — reads current state via `get()`, stamps `updated_at`, then applies `toHierarchicalIds()` for human-readable sub-element IDs.
- **`resetStore()`** — resets all state to empty defaults.

---

## 3. Architecture Rules Compliance

| Rule | Status | Notes |
|------|--------|-------|
| **AR-02** | ✅ | All narrative state lives in this Zustand store |
| **AR-03** | ✅ | All `requires` fields default to `{ operator: 'and', conditions: [] }` via `emptyConditionGroup()` |
| **AR-04** | ✅ | All `next` fields default to `[]`; entries always `{ id, target, requires }` |
| **AR-05** | ✅ | All array fields default to `[]` via `createCommonNode/createChoice/etc.` factories |
| **AR-06** | ✅ | Sub-element IDs generated via `generateId('route'/'opt'/'variant'/'cond')` |
| **AR-07** | ✅ | Names sanitized in store actions (`updateCommonNode`, `updateEnding`, `updateFlag`, etc.) and on import |
| **AR-10** | ✅ | `_position` field is persisted via `entityDefaults.js` and passed through in all update paths |

---

## 4. Decisions & Assumptions

- **`addNextEntry` is Common-Node-only** as a named action. Choice Options use `addOptionNextEntry`. Direct next-entry CRUD is not exposed for choices at the top level per the data model (`choice.options[].next[]`), which is correct per spec §4.2.
- **`updateMetadata(updates)`** is provided for bulk metadata changes; `setEntryNode(id)` is a convenience wrapper.
- **`removeConditionById`** is a recursive helper that searches all depths of a conditions tree — it stops at the first match.
- **`resolveConditionGroupPath`** returns `null` for unknown/invalid paths; `addCondition`/`removeCondition` silently no-op in that case rather than throwing.
- **`sanitizeAllNames`** skips `choice.text` intentionally — `text` is the display prompt for a player-facing Choice node and is not an entity name per the data model (§4.1).
- **`deletePath` / `deleteChapter`** null out references locally without cascade-deleting those entities from their own collections — entities survive, they just lose their classification reference.

---

## 5. Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Can create, read, update, delete every entity type | ✅ |
| 2 | Sub-element CRUD: add/remove conditions, next entries, options, variants | ✅ |
| 3 | `loadFromJSON()` populates store; `toExportJSON()` produces valid export | ✅ |
| 4 | Entity names sanitized on creation (AR-07) | ✅ |
| 5 | All data structure invariants hold after every mutation (AR-03, AR-04, AR-05) | ✅ |
| 6 | Deleting a top-level entity cleans up references in `next[].target`, `flags_set`, `status_set`, `requires.conditions` | ✅ |
