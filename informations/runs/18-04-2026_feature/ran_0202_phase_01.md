# ran_0202_phase_01.md — Phase 1: Data Layer

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

**Phase 1 — Data Layer**

- **Goal** — Extend `narrativeStore` with variant and option CRUD actions and close the referential integrity gap in `deleteFlag` / `deleteStatus`, so all downstream UI phases have a stable, tested data foundation.

- **What it adds:**
  - `addVariant(nodeId, variantData)` — appends a new variant object (`id: generateId('v')`, `label`, `text`, `requires: null`) to `common[nodeId].data.variants[]`.
  - `updateVariant(nodeId, variantId, patch)` — patches a variant in `common[nodeId].data.variants[]` by ID.
  - `deleteVariant(nodeId, variantId)` — removes a variant from `common[nodeId].data.variants[]` by ID.
  - `addOption(nodeId, optionData)` — appends a new option object (`id: generateId('opt')`, `label`, `requires: null`, `flags_set: []`, `status_set: []`) to `choice[nodeId].data.options[]`.
  - `updateOption(nodeId, optionId, patch)` — patches an option in `choice[nodeId].data.options[]` by ID.
  - `deleteOption(nodeId, optionId)` — removes the option from `choice[nodeId].data.options[]` by ID and removes all edges where `edge.optionId === optionId` in the same `set()` call (RISK-VNO-04 mitigation).
  - `addEdge` extended — optional third argument `optionId`; when provided, stamps `edge.optionId = optionId` on the new edge object.
  - `deleteFlag` scan extended — scans `node.data.variants[].requires.conditions` and `node.data.options[].requires.conditions` and `node.data.options[].flags_set` across `common`, `choice`, `ending`.
  - `deleteStatus` scan extended — scans `node.data.variants[].requires.conditions` and `node.data.options[].requires.conditions` and `node.data.options[].status_set` across `common`, `choice`, `ending`.
  - **Schema version decision:** Decide here whether to bump to `schemaVersion: 5` (stamp `variants: []` on common nodes and `options: []` on choice nodes in `newGraph` / `loadGraph`). If yes, also update `fileSystem.js` version guard and add a v4→v5 migration pass. If no, document the `?? []` defaulting requirement.

- **Produces:**
  - `src/store/narrativeStore.js` — modified

- **What it leaves temporarily incomplete:**
  - No UI for variants or options yet — the new actions exist in the store but are not called by any component. `OptionEditor` and `VariantEditor` are not created until Phase 2 and 3.
  - `ChoiceNode` still renders a single source handle.
  - `EdgeInspector` does not yet display `optionId`.

- **What the next phase depends on from this phase:**
  - Phase 2 depends on `addOption`, `updateOption`, `deleteOption` being functional and on `uiStore.js` receiving `choiceDisplayMode`.
  - Phase 3 depends on `addVariant`, `updateVariant`, `deleteVariant` being functional and on `addEdge` accepting `optionId`.

- **Reference files needed:**
  - `src/store/narrativeStore.js`
  - `ran_0201_scope.md`
  - `ran_0202_datamodelimpact.md`
  - `ran_0202_risks.md`

- **Rollback cost if this phase fails:** LOW — only one file is modified. Reverting `narrativeStore.js` to its previous state (which is in source control) fully restores the prior behavior. No UI components exist yet.

- **Hard stop triggers for this phase:**
  - Any new action that breaks existing action signatures → stop and fix before proceeding.
  - The `deleteFlag` / `deleteStatus` extended scans throw a runtime error → stop; do not proceed to Phase 2 with broken integrity checks.
  - If a `schemaVersion: 5` bump is chosen and `fileSystem.js` is not updated in the same commit → BLOCKER. Do not continue.

- **Acceptance Criteria — Done when:**
  1. `addOption('choice-node-id', {})` succeeds and `choice['choice-node-id'].data.options` contains one entry with a valid `opt-` prefixed ID.
  2. `updateOption('choice-node-id', optionId, { label: 'Run' })` updates only the target entry.
  3. `deleteOption('choice-node-id', optionId)` removes the option and removes all edges with `edge.optionId === optionId`.
  4. `addVariant('common-node-id', {})` succeeds and `common['common-node-id'].data.variants` contains one entry with a valid `v-` prefixed ID.
  5. `deleteVariant('common-node-id', variantId)` removes the correct entry.
  6. Adding a variant with a `requires` clause referencing a flag, then calling `deleteFlag(flagId)`, returns `{ blocked: true, references: [...] }`.
  7. Adding an option with a flag in `flags_set`, then calling `deleteFlag(flagId)`, returns `{ blocked: true, references: [...] }`.
  8. Adding an option with a status in `status_set`, then calling `deleteStatus(statusId)`, returns `{ blocked: true, references: [...] }`.
  9. All existing tests (flag/status/path/chapter CRUD) continue to pass.

- **Verification:**
  Open the browser console (`window.useNarrativeStore.getState()`). Create a choice node on the canvas. In the console, call `window.useNarrativeStore.getState().addOption('<choice-node-id>', {})`. Then call `window.useNarrativeStore.getState().choice['<choice-node-id>'].data.options` — confirm one entry appears with an `opt-` prefixed `id`. Then call `deleteOption` and confirm the entry is gone. Repeat for variants on a common node.
