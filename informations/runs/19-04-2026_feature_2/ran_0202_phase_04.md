# Phase 4 — Creation Bar

---

**Goal:** Build `CreationBar.jsx` and mount it in `TopBar`. Node buttons (Common, Choice, Ending) dispatch `canvas-add-node`. Metadata buttons (Flag, Status, Path, Chapter) dispatch `canvas-open-name-modal` — the event pattern established in Phase 2.

---

## What it adds

### `src/components/CreationBar.jsx` — new component:

- Receives `disabled: boolean` prop (passed from `TopBar` as `isCampaignActive`).
- Renders a horizontal row of seven buttons:

  | Button | Action |
  |---|---|
  | Common | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'common' } }))` |
  | Choice | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'choice' } }))` |
  | Ending | `window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'ending' } }))` |
  | Flag | `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'flag' } }))` |
  | Status | `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'status' } }))` |
  | Path | `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'path' } }))` |
  | Chapter | `window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType: 'chapter' } }))` |

- All buttons carry `disabled={disabled}`.
- **Node buttons** use `canvas-add-node` — `GraphCanvas` handles `addNode` with viewport-center positioning. `CreationBar` is outside `ReactFlowProvider` and cannot call `useReactFlow()` or `screenToFlowPosition`.
- **Metadata buttons** dispatch `canvas-open-name-modal` — `GraphCanvas` opens `NameModal` with the correct `entityType`. The user types a name in the modal and confirms; creation happens there. **No auto-name generation.**

### `src/components/TopBar.jsx`:

- Import `CreationBar` from `'./CreationBar.jsx'`.
- Render `<CreationBar disabled={isCampaignActive} />` between `.topbar__center` and `.topbar__right`, wrapped in `<div className="topbar__creation-bar">`.

### `src/components/index.js`:
- Add `export { default as CreationBar } from './CreationBar';`.

### `src/styles/global.css` — additive block:
- `.topbar__creation-bar`: `display: flex; align-items: center; gap: 4px; padding: 0 8px; border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border);`
- `.creation-bar__btn`: compact variant of `.topbar__btn` with smaller padding and font size.

---

## Produces

| File | Status |
|---|---|
| `src/components/CreationBar.jsx` | NEW |
| `src/components/TopBar.jsx` | MODIFIED |
| `src/components/index.js` | MODIFIED |
| `src/styles/global.css` | MODIFIED (additive) |

---

## What it leaves temporarily incomplete

Nothing — this is the final phase. All four feature surfaces (multi-select foundation, keyboard shortcuts + modal + label display, context menus, creation bar) are complete after this phase.

---

## What the next phase depends on from this phase

This is the final implementation phase. The subsequent prompt (0203_implement) will execute the code in phase order: 1 → 2 → 3 → 4.

---

## Reference files needed

- `src/components/CreationBar.jsx` (new — this phase creates it)
- `src/components/TopBar.jsx` (current)
- `src/components/GraphCanvas.jsx` (Phase 2/3 state — `canvas-add-node` and `canvas-open-name-modal` listeners already in place)
- `src/styles/global.css` — existing `.topbar__btn` styles to match visual language
- `ran_0202_risks.md` — RISK-CMK-07 (canvas-center placement via event), RISK-CMK-08 (modal ESC already handled in NameModal from Phase 2)

---

## Rollback cost if this phase fails: LOW

- Delete `CreationBar.jsx`.
- Revert `TopBar.jsx` (remove import + render — 2–3 line change).
- Revert `components/index.js` (remove `CreationBar` export).
- Revert `global.css` (remove creation bar style block).
- Phases 1–3 fully intact. App reverts to foundation + shortcuts + modal + label display + context menus state.

---

## Hard stop triggers

- `CreationBar` renders but `TopBar` layout breaks (existing controls overflow or collapse).
- Clicking "Common" does not create a node on the canvas.
- Clicking "Flag" does not open the `NameModal` (modal stays closed; no flag created).
- Clicking "Flag", typing a name, and confirming does not create the flag in the Flags sidebar tab.
- Clicking "Flag", typing nothing, confirms anyway (Confirm button not disabled on empty input).
- Creation bar buttons remain enabled during campaign mode (AR-08 violation).
- `useReactFlow()` called inside `CreationBar` — will throw "must be used within a ReactFlowProvider". Detection: the error message. Fix: use the custom event pattern, never call `useReactFlow()` here.

---

## Acceptance Criteria

Done when:
1. The creation bar is visible in the top bar with all seven buttons.
2. "Common" creates a Common node visible near canvas center.
3. "Choice" creates a Choice node; "Ending" creates an Ending node.
4. "Flag" opens the naming modal (title: "New Flag"). Typing "TestFlag" and confirming creates a flag named "TestFlag" in the Flags sidebar tab.
5. "Status", "Path", "Chapter" each open their modal with the correct title. Confirming with a name creates the entity; cancelling creates nothing.
6. Confirming with an empty input in the modal is blocked.
7. All seven buttons are visually disabled (greyed-out) during campaign mode.
8. The existing TopBar layout is not broken — title input, snap/tidy/new/import/export buttons, and campaign controls all function correctly.

---

## Verification

Open the app.
1. Confirm the creation bar is visible in the top bar.
2. Click "Common" — confirm a new Common node appears near canvas center.
3. Click "Flag" — confirm the "New Flag" modal appears. Type "TestFlag" and click Confirm — open the Flags tab and confirm "TestFlag" appears.
4. Click "Flag" again — leave input empty — confirm Confirm is disabled. Click Cancel — confirm no new flag was created.
5. Click "Status" — type "Gold" and confirm — open Status tab and confirm "Gold" appears.
6. Click "Path" — type "Act 1" and confirm — open Paths tab and confirm "Act 1" appears.
7. Click "Chapter" — type "Prologue" and confirm — confirm "Prologue" appears in Paths tab.
8. Enter Campaign Mode — confirm all seven creation bar buttons are greyed-out and unclickable.
9. Click a creation bar button in campaign mode — confirm no modal opens and nothing is created.
10. Confirm existing TopBar controls still work: Tidy Layout, Snap toggle, New, Import, Export.

---

## RULE CANDIDATE (flagged for 0208 Document phase)

**Pattern:** Components or hooks that need to trigger canvas-space operations (node creation at viewport center, modal open) but live outside the `ReactFlowProvider` subtree should use custom DOM events (`window.dispatchEvent(new CustomEvent(...))`), consistent with the existing `graph-layout-tidy` pattern. This feature uses this pattern for three distinct event types: `graph-layout-tidy`, `canvas-add-node`, and `canvas-open-name-modal`. Should be formalized as: **"Canvas operations from non-provider components use named custom DOM events; `GraphCanvas` is the sole handler."** Do not add to `architecture_rules.md` until 0208.
