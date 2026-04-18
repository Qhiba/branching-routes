# ran_0202_phase_03.md — Phase 3: Variants UI, Edge Stamping, and EdgeInspector Display

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

**Phase 3 — Variants UI, Edge Stamping, and EdgeInspector Display**

- **Goal** — Complete the feature by adding variant editing to common nodes, stamping option provenance onto edges at connect time, and surfacing that provenance in the edge inspector.

- **What it adds:**
  - `src/components/VariantEditor.jsx` (CREATE): Renders the variant list for the selected common node.
    - Each row: variant label text input, variant text textarea (the alternate narrative content), `requires` clause builder (same clause UI as `EdgeInspector` and `OptionEditor`).
    - Add variant button at the bottom (calls `addVariant`).
    - Remove variant button per row (calls `deleteVariant`).
    - All mutations via `addVariant`, `updateVariant`, `deleteVariant` from `narrativeStore`.
    - Reads `flag{}` and `status{}` via targeted selectors.
    - Local state limited to UI concerns only (row collapse) — AR-03 compliant.
  - `src/components/NodeInspector.jsx`: Conditionally mounts `<VariantEditor nodeId={node.id} variants={data.variants ?? []} />` below the Status Modifiers section when `nodeType === 'common'`.
  - `src/components/GraphCanvas.jsx`: In the `onConnect` handler, reads `connection.sourceHandle`. If it starts with `'opt-'`, passes it as the `optionId` argument to `addEdge(source, target, connection.sourceHandle)`. Otherwise, calls `addEdge(source, target)` as before.
  - `src/components/EdgeInspector.jsx`:
    - New targeted selector: `useNarrativeStore(s => s.choice[edge?.sourceId]?.data?.options ?? [])`.
    - If `edge.optionId` is present and non-null, finds the matching option in the list and displays its label as a read-only field labelled "Connected from option".
    - If `edge.optionId` is absent or no matching option is found, the field is hidden entirely.
  - `src/components/index.js`: Adds `VariantEditor` to barrel export.

- **Produces:**
  - `src/components/VariantEditor.jsx` — created
  - `src/components/NodeInspector.jsx` — modified (VariantEditor mount)
  - `src/components/GraphCanvas.jsx` — modified (onConnect extension)
  - `src/components/EdgeInspector.jsx` — modified (optionId display)
  - `src/components/index.js` — modified

- **What it leaves temporarily incomplete:**
  - Variant activation during simulation — out of scope per user's definition. `requires` on variants is authored but never evaluated in this phase. The simulation path through `simulationStore` is entirely untouched.
  - Display mode toggle UI (the button to switch `choiceDisplayMode` between `'medium'` and `'full'`) — if not provided in Phase 2, it may be deferred and added here or in a follow-on pass. This is low risk as it is purely a UI toggle with no data implications.

- **What the next phase depends on from this phase:**
  - This is the final phase. There is no Phase 4 for this feature.
  - Future simulation iterations will depend on `variants[].requires` having a stable schema — the shape established here must be treated as stable.

- **Reference files needed:**
  - `src/store/narrativeStore.js` (Phase 1 output)
  - `src/components/nodes/ChoiceNode.jsx` (Phase 2 output — option IDs established)
  - `src/components/NodeInspector.jsx` (Phase 2 output)
  - `src/components/EdgeInspector.jsx`
  - `src/components/GraphCanvas.jsx`
  - `ran_0202_filemap.md`
  - `ran_0202_risks.md` (RISK-VNO-01, RISK-VNO-03, RISK-VNO-04)

- **Rollback cost if this phase fails:** MEDIUM — four files modified, one created. Reverting `NodeInspector.jsx`, `GraphCanvas.jsx`, `EdgeInspector.jsx`, `index.js` to Phase 2 state and deleting `VariantEditor.jsx` fully restores Phase 2. Phase 1 and 2 outcomes are unaffected.

- **Hard stop triggers for this phase:**
  - `GraphCanvas.onConnect` change causes existing (non-option) edge connections to fail or throw → stop; the guard is wrong.
  - `VariantEditor` stores variant data in local React state → BLOCKER (AR-03 violation).
  - `EdgeInspector` crashes when `edge.sourceId` is not in `choice{}` (i.e., edge from a common node) → stop; add `?.` guard.
  - `addEdge` in `narrativeStore` throws when `optionId` is passed as a third argument → stop Phase 1 was incomplete.

- **Acceptance Criteria — Done when:**
  1. Selecting a common node shows a "Variants" section in the Inspector with an "Add Variant" button.
  2. Adding a variant creates a row with label input, text textarea, and a `requires` clause builder.
  3. Adding a flag clause to a variant's `requires` and then attempting to delete that flag from the Flags tab shows a blocking warning — the deletion is prevented.
  4. Drawing an edge from a per-option handle on a choice node (Phase 2 handle), then selecting that edge, shows a read-only "Connected from option: [option label]" field in `EdgeInspector`.
  5. Drawing an edge from the fallback handle (choice node with no options) shows no "Connected from option" field.
  6. Drawing an edge from a common node shows no "Connected from option" field.
  7. Exporting the project and re-importing it preserves all variants and options — labels, text, and `requires` clauses survive the round-trip.
  8. Deleting a choice node also removes all edges that were connected from its option handles (cascade already handled by existing `deleteNode` edge filter — verify it covers option-handle edges too).

- **Verification:**
  Open the app. Create a common node, select it, add a variant with a label "Brave version" and some text. Create a flag `courage_high`, add it as a `requires` clause on the variant. Go to the Flags tab and try to delete `courage_high` — confirm a blocking warning appears and the flag is not deleted. Then create a choice node, add two options ("Go left", "Go right"). Drag an edge from "Go right"'s handle to another node. Select that edge — the Inspector should show "Connected from option: Go right". Export the project to JSON, open the file in a text editor, confirm `variants` and `options` arrays are present. Re-import — confirm everything is still intact.
