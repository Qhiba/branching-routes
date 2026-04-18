# ran_0203_execute_1.md — Phase 1 Implementation Report

**Feature:** Variants_on_nodes_and_Options_on_choices
**Phase:** 1 — Data Layer
**Generated:** 2026-04-18

---

## Summary

Phase 1 is complete. One file was modified. No new files were created. No files outside the Phase 1 file map were touched.

---

## Files Modified

### `src/store/narrativeStore.js`

**What changed and why:**

1. **`addEdge` signature extended** — accepts optional third argument `optionId = null`. When provided, the value is stamped onto the new edge object as `edge.optionId`. When absent or falsy, `optionId` is `null`. Existing call sites that pass only `(sourceId, targetId)` are fully backward-compatible.

2. **`deleteFlag` scan extended** — after the existing `node.data.flags_set` scan, two new loops were added:
   - Scans `node.data.variants[].requires.conditions` across all node collections, registering `variant_requires:{nodeId}:{variantId}` references.
   - Scans `node.data.options[].requires.conditions` and `node.data.options[].flags_set` across all node collections, registering `option_requires:{nodeId}:{optionId}` and `option_flags_set:{nodeId}:{optionId}` references.
   - Both loops are guarded by `Array.isArray(...)` — safe on legacy nodes with no `variants` or `options` fields.

3. **`deleteStatus` scan extended** — mirror of the flag extension:
   - Scans `node.data.variants[].requires.conditions` for status references.
   - Scans `node.data.options[].requires.conditions` and `node.data.options[].status_set` for status references.
   - Same `Array.isArray` guards applied.

4. **`addVariant` added** — appends a new variant `{ id: generateId('v'), label, text, requires: null }` to `common[nodeId].data.variants[]`. Returns state unchanged if `nodeId` is not found in `common`. Defaults absent `variants` array to `[]` before appending.

5. **`updateVariant` added** — patches a single variant by ID in `common[nodeId].data.variants[]`. No-ops if node not found.

6. **`deleteVariant` added** — filters out the target variant from `common[nodeId].data.variants[]` by variantId. No-ops if node not found.

7. **`addOption` added** — appends a new option `{ id: generateId('opt'), label, requires: null, flags_set: [], status_set: [] }` to `choice[nodeId].data.options[]`. Only operates on `choice{}` nodes. Defaults absent `options` array to `[]` before appending.

8. **`updateOption` added** — patches a single option by ID in `choice[nodeId].data.options[]`. No-ops if node not found.

9. **`deleteOption` added** — removes the option from `choice[nodeId].data.options[]` by `optionId`, and in the same `set()` call removes all `edges` where `edge.optionId === optionId`. This prevents dangling handle references (RISK-VNO-04 mitigation).

---

## Schema Version Decision

**Schema version stays at `schemaVersion: 4`.** No `fileSystem.js` change required.

Rationale: `variants[]` and `options[]` are new optional arrays in `node.data`. All consumers default absent fields to `[]` via the pattern `Array.isArray(n.data.variants) ? n.data.variants : []`. Existing v1–v4 save files load without error. A v5 bump would only be necessary to make "no options authored" distinguishable from "file predates this feature" — that distinction is not needed at this stage.

---

## Flags

None raised. No AMBIGUOUS, CONFLICT, or PLAN GAP conditions encountered.

---

## Verification Checklist (for user)

Open the browser console and run each step:

```js
// 1. Get a choice node ID from the canvas first
const s = window.useNarrativeStore.getState();
const choiceId = Object.keys(s.choice)[0]; // pick any choice node

// 2. Add an option
s.addOption(choiceId, { label: 'Test option' });
const opts = window.useNarrativeStore.getState().choice[choiceId].data.options;
console.assert(opts.length === 1, 'addOption failed');
console.assert(opts[0].id.startsWith('opt-'), 'opt- prefix missing');

// 3. Update the option
const optId = opts[0].id;
window.useNarrativeStore.getState().updateOption(choiceId, optId, { label: 'Updated' });
const updated = window.useNarrativeStore.getState().choice[choiceId].data.options[0];
console.assert(updated.label === 'Updated', 'updateOption failed');

// 4. Delete the option
window.useNarrativeStore.getState().deleteOption(choiceId, optId);
const after = window.useNarrativeStore.getState().choice[choiceId].data.options;
console.assert(after.length === 0, 'deleteOption failed');

// 5. Add a variant (need a common node ID)
const commonId = Object.keys(window.useNarrativeStore.getState().common)[0];
window.useNarrativeStore.getState().addVariant(commonId, { label: 'Alt text' });
const variants = window.useNarrativeStore.getState().common[commonId].data.variants;
console.assert(variants.length === 1, 'addVariant failed');
console.assert(variants[0].id.startsWith('v-'), 'v- prefix missing');
```
