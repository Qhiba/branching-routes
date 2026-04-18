# ran_0202_filemap.md — File Map

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

## `src/store/narrativeStore.js` — EXISTING, MODIFY

**What changes and why:**
- Add `addVariant(nodeId, variantData)` — creates a new variant object with `generateId('v')` and appends it to `node.data.variants[]`. Writes via `updateNode`-equivalent logic inside `set()`.
- Add `updateVariant(nodeId, variantId, patch)` — patches a single variant in `node.data.variants[]` by ID.
- Add `deleteVariant(nodeId, variantId)` — removes variant from `node.data.variants[]` by ID.
- Add `addOption(nodeId, optionData)` — creates a new option object with `generateId('opt')` and appends it to `node.data.options[]`. Only operates on `choice{}` nodes.
- Add `updateOption(nodeId, optionId, patch)` — patches a single option in `node.data.options[]` by ID.
- Add `deleteOption(nodeId, optionId)` — removes option from `node.data.options[]` by ID. Also removes any edges where `edge.optionId === optionId` to prevent dangling handle references.
- Extend `deleteFlag(id)` — add scans of `node.data.variants[].requires.conditions` and `node.data.options[].requires.conditions` and `node.data.options[].flags_set` across all collections.
- Extend `deleteStatus(id)` — add scans of `node.data.variants[].requires.conditions` and `node.data.options[].requires.conditions` and `node.data.options[].status_set` across all collections.

**What must NOT change:**
- Signatures of all existing actions (`addNode`, `updateNode`, `deleteNode`, `setStartNode`, `addEdge`, `updateEdge`, `deleteEdge`, `addFlag`, `updateFlag`, `deleteFlag`, `addStatus`, `updateStatus`, `deleteStatus`, `addPath`, `updatePath`, `deletePath`, `addChapter`, `updateChapter`, `deleteChapter`, `updateMeta`, `loadGraph`, `newGraph`, `exportGraph`).
- The `useUIStore.getState().clearIfSelected` calls in `deleteNode` and `deleteEdge` (INVARIANT BI-04, BI-05).
- The window debug export hook at the bottom of the file.
- The circular dependency guard comment (INVARIANT HS-08).

**Phase:** Phase 1

---

## `src/store/uiStore.js` — EXISTING, MODIFY

**What changes and why:**
- Add state field `choiceDisplayMode: 'medium'` — default compact rendering for choice nodes.
- Add action `setChoiceDisplayMode(mode)` — sets `'medium'` or `'full'`. Consumed by `ChoiceNode`. Allows designer to toggle between a condensed option list and a fully expanded one.

**What must NOT change:**
- `selectedNodeId`, `selectedEdgeId`, `snapToGrid` state fields.
- All existing actions: `selectNode`, `selectEdge`, `clearSelection`, `clearIfSelected`, `resetSelection`, `toggleSnapToGrid`.

**Phase:** Phase 2

---

## `src/components/OptionEditor.jsx` — NEW, CREATE

**What changes and why:**
- New component rendering the option list for a selected choice node.
- Props: `nodeId` (string), `options` (array, defaults to `[]`).
- Each row shows: option label input, `requires` clause builder (same UI pattern as `EdgeInspector` flag/status clauses), `flags_set` checkbox list, `status_set` row list with amount inputs.
- Add/remove row controls at the bottom.
- All mutations dispatched via `addOption`, `updateOption`, `deleteOption` from `narrativeStore`.
- Reads `flag{}` and `status{}` via targeted selectors for clause building.

**What must NOT change:**
- N/A — new file.

**Phase:** Phase 2

---

## `src/components/VariantEditor.jsx` — NEW, CREATE

**What changes and why:**
- New component rendering the variant list for a selected common node.
- Props: `nodeId` (string), `variants` (array, defaults to `[]`).
- Each row shows: variant label input, variant text textarea, `requires` clause builder.
- Add/remove controls at the bottom.
- All mutations dispatched via `addVariant`, `updateVariant`, `deleteVariant` from `narrativeStore`.
- Reads `flag{}` and `status{}` via targeted selectors.

**What must NOT change:**
- N/A — new file.

**Phase:** Phase 3

---

## `src/components/NodeInspector.jsx` — EXISTING, MODIFY

**What changes and why:**
- Import `OptionEditor` and `VariantEditor`.
- After the existing Status Modifiers section, conditionally mount `<VariantEditor>` when `nodeType === 'common'`.
- After the existing Status Modifiers section, conditionally mount `<OptionEditor>` when `nodeType === 'choice'`.
- Pass `nodeId={node.id}` and `variants={data.variants ?? []}` / `options={data.options ?? []}` as props.

**What must NOT change:**
- All existing form fields in their current order: Label, Content, Path, Chapter, Start Node, Set Flags, Status Modifiers, Delete.
- Existing targeted selectors for `flag`, `status`, `path`, `chapter`.
- Existing handlers: `handleLabelChange`, `handleContentChange`, `handleStartNodeClick`, `toggleFlag`, `addStatusEffect`, `updateStatusEffect`, `removeStatusEffect`.
- The `if (!node) return null` guard.

**Phase:** Phase 2 (for `OptionEditor` mount), Phase 3 (for `VariantEditor` mount)

---

## `src/components/nodes/ChoiceNode.jsx` — EXISTING, MODIFY

**What changes and why:**
- Replace the single `<Handle type="source">` with a mapped set of per-option `<Handle>` elements, one per entry in `data.options ?? []`, each with `id={option.id}` as the React Flow `handleId`.
- Render option labels inside the node body beneath the existing title/content area.
- Add `choiceDisplayMode` selector from `uiStore`; when `'full'`, expand the option display; when `'medium'`, show a condensed list.
- Keep the existing single source handle as a **fallback** when `data.options` is absent or empty (backward compatibility for saved files with no options).
- Replace the `data.sideEffects` guard (currently stale — references the pre-v3 field name) with a guard on `(data.flags_set?.length || data.status_set?.length)`.

**What must NOT change:**
- `React.memo` wrapper.
- Target handle (`type="target"`, `Position.Left`).
- Simulation state class logic (`isActive`, `isVisited`, `isReachable`).
- `outgoingEdgeCount` selector (keep for the metadata badge; it reflects total outgoing edges irrespective of options).
- The `story-node choice-node` class structure.

**Phase:** Phase 2

---

## `src/components/EdgeInspector.jsx` — EXISTING, MODIFY

**What changes and why:**
- Read `edge.optionId` from the selected edge.
- If `optionId` is present, look up `choice[sourceNode].data.options` to find the option label. Display as a read-only labelled field: "Connected from option: [label]".
- The `sourceId` must be resolved first: look up which choice node matches `edge.sourceId` in `narrativeStore.choice`.
- If `optionId` is absent or the source is not a choice node, hide the field entirely.

**What must NOT change:**
- Label field, Condition section (operator toggle, flag/status clause add/remove), Delete Edge button.
- All existing handlers: `handleLabelChange`, `toggleCondition`, `updateConditionOperator`, `addFlagClause`, `addStatusClause`, `updateClause`, `removeClause`.

**Phase:** Phase 3

---

## `src/components/GraphCanvas.jsx` — EXISTING, LIMITED MODIFY

**What changes and why:**
- The `onConnect` callback already calls `addEdge(sourceId, targetId)`. Extend it to also pass `handleId` (the React Flow `connection.sourceHandle`) to `addEdge`, so that if `handleId` matches an option ID (`opt-` prefix), the resulting edge gets `optionId` set.
- This requires `addEdge` to accept an optional third argument `optionId` and stamp it on the new edge when provided.

**What must NOT change:**
- All canvas interaction handlers: click-to-select, drag-to-move, double-click-to-add, simulation advance-by-click.
- Custom node/edge type registration.
- Simulation mode CSS class.
- React Flow `Background`, `Controls`, `MiniMap` configuration.

**Phase:** Phase 3

---

## `src/components/index.js` — EXISTING, MODIFY

**What changes and why:**
- Add `VariantEditor` and `OptionEditor` to the barrel export.

**What must NOT change:**
- All existing named exports.

**Phase:** Phase 2 (add `OptionEditor`), Phase 3 (add `VariantEditor`)
