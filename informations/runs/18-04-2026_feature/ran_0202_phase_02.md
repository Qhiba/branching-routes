# ran_0202_phase_02.md — Phase 2: Options UI and ChoiceNode Handles

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

**Phase 2 — Options UI and ChoiceNode Handles**

- **Goal** — Make options on choice nodes visible and editable, and give each option a dedicated source handle on the canvas, so designers can begin drawing option-specific edges.

- **What it adds:**
  - `src/store/uiStore.js`: New state `choiceDisplayMode: 'medium'` and action `setChoiceDisplayMode(mode)`.
  - `src/components/OptionEditor.jsx` (CREATE): Renders the option list for the selected choice node.
    - Each option row: label text input, `requires` clause builder (flag and status clause rows, same UI pattern as `EdgeInspector`), `flags_set` checkbox list, `status_set` amount rows.
    - Add option button at the bottom (calls `addOption`).
    - Remove option button per row (calls `deleteOption`).
    - All mutations via `addOption`, `updateOption`, `deleteOption` from `narrativeStore`.
    - Reads `flag{}` and `status{}` via targeted selectors (`useNarrativeStore(s => s.flag)`, `useNarrativeStore(s => s.status)`).
    - Local state limited to UI concerns only (collapse state of individual rows) — AR-03 compliant.
  - `src/components/NodeInspector.jsx`: Conditionally mounts `<OptionEditor nodeId={node.id} options={data.options ?? []} />` below the Status Modifiers section when `nodeType === 'choice'`.
  - `src/components/nodes/ChoiceNode.jsx`:
    - Replaces single source handle with a mapped set of `<Handle type="source" id={option.id} position={Position.Right}>` for each option in `data.options ?? []`.
    - Renders option labels in the node body below content preview.
    - Adds `choiceDisplayMode` selector from `uiStore`; `'full'` shows full label text; `'medium'` shows truncated.
    - Fallback: if `data.options ?? []` is empty, renders the original single source handle (backward compatibility — RISK-VNO-02 mitigation).
    - Fixes stale `data.sideEffects` guard — replaces with `(data.flags_set?.length || data.status_set?.length)`.
  - `src/components/index.js`: Adds `OptionEditor` to barrel export.

- **Produces:**
  - `src/store/uiStore.js` — modified
  - `src/components/OptionEditor.jsx` — created
  - `src/components/NodeInspector.jsx` — modified
  - `src/components/nodes/ChoiceNode.jsx` — modified
  - `src/components/index.js` — modified

- **What it leaves temporarily incomplete:**
  - Edges drawn from option handles do not yet carry `optionId` — `GraphCanvas.onConnect` is not updated until Phase 3.
  - `EdgeInspector` does not display option provenance yet — Phase 3.
  - `VariantEditor` does not exist yet — Phase 3.

- **What the next phase depends on from this phase:**
  - Phase 3 depends on option handles having stable `handleId` values (`opt-` prefix) so `GraphCanvas.onConnect` can detect them by prefix.

- **Reference files needed:**
  - `src/store/narrativeStore.js` (Phase 1 output)
  - `src/store/uiStore.js`
  - `src/components/nodes/ChoiceNode.jsx`
  - `src/components/NodeInspector.jsx`
  - `ran_0202_filemap.md`
  - `ran_0202_risks.md` (RISK-VNO-02, RISK-VNO-05)

- **Rollback cost if this phase fails:** MEDIUM — three existing files and two new/modified files. Reverting `uiStore.js`, `NodeInspector.jsx`, `ChoiceNode.jsx`, and `index.js` to their prior state and deleting `OptionEditor.jsx` fully restores Phase 1 state. No data model changes are introduced in this phase.

- **Hard stop triggers for this phase:**
  - `ChoiceNode` renders without a source handle at all (neither per-option nor fallback) → stop; canvas connections are broken.
  - `OptionEditor` subscription uses `useNarrativeStore(s => s)` (full store) → stop; RISK-VNO-05 has materialised; fix selector before proceeding.
  - Existing choice nodes (no `data.options`) crash the canvas → stop; add `?? []` guards.
  - `OptionEditor` stores option data in local React state → BLOCKER (AR-03 violation).

- **Acceptance Criteria — Done when:**
  1. Selecting a choice node and opening the Inspector shows a new "Options" section with an "Add Option" button.
  2. Clicking "Add Option" adds a row with a label input and empty `requires`/`flags_set`/`status_set` controls.
  3. Adding two options to a choice node causes two distinct source handles to appear on the right side of the node on the canvas.
  4. A choice node with no options falls back to a single source handle — no crash.
  5. A common node shows no "Options" section.
  6. An ending node shows no "Options" section.
  7. Editing a flag name does not cause all choice nodes to re-render (verify with React DevTools Profiler — no re-render on unrelated mutation).
  8. Deleting an option removes its handle from the canvas and removes the row from the Inspector.

- **Verification:**
  Open the app. Create a choice node by double-clicking the canvas. Select it. In the sidebar Inspector, scroll to the bottom — an "Options" section should appear with an "Add Option" button. Click it twice to add two options. Give them different labels. Observe the choice node on the canvas: two distinct handles should appear on the right side, one per option. Then deselect and select a common node — confirm the Options section is absent. Create a legacy project (or reload an existing save) — canvas must not be blank or show an error.
