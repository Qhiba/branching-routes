# Phase 2 — Management UI

---

**Goal:** Surface path and chapter CRUD in a new "Paths" Sidebar tab via a new `PathChapterManager.jsx` component.

---

## What it adds

- New file `src/components/PathChapterManager.jsx`:
  - Two sections: "Paths" and "Chapters".
  - Each section: list of existing entries (name + rename + delete), and an add-form (text input + confirm button).
  - Confirm button is disabled when the input is empty (RISK-PCE-05 UI guard).
  - All mutations call store actions only (AR-04 compliant).
  - Local `useState` used only for the add-form text inputs (AR-03 compliant).
  - Name validation (`name.trim().length > 0`) enforced in the store actions; the component does not try to catch that error — the disabled button prevents the call when empty.
- `src/components/index.js`: adds `PathChapterManager` export.
- `src/components/Sidebar.jsx`: adds "Paths" tab button and renders `<PathChapterManager />` when active.

---

## Produces

| File | Change |
|------|--------|
| `src/components/PathChapterManager.jsx` | CREATE |
| `src/components/index.js` | MODIFY — add `PathChapterManager` export |
| `src/components/Sidebar.jsx` | MODIFY — add "Paths" tab button and render |

---

## What it leaves temporarily incomplete

- Nodes cannot yet be assigned to paths or chapters. The dropdowns in `NodeInspector` do not exist yet (Phase 3 completes this).
- The manager is fully functional for CRUD, but has no visible effect on nodes until Phase 3.

---

## What the next phase depends on from this phase

- Phase 3 depends on `path{}` and `chapter{}` being populated via the manager so that the Node Inspector dropdowns have entries to show. (Phase 3 works correctly even if the manager is empty — dropdowns will just show "None".)
- Phase 3 does not depend on any specific `PathChapterManager` internal detail.

---

## Reference files needed

- `ran_0202_phase_01.md` (confirms store actions are available)
- `ran_0202_filemap.md`
- `ran_0202_integrationpoints.md`
- `src/components/Sidebar.jsx`
- `src/components/index.js`

---

## Rollback cost if this phase fails: LOW

Three files touched. `PathChapterManager.jsx` can be deleted. The `Sidebar.jsx` and `index.js` changes are additive only — removing a tab and an export line restores the prior state. No logic changes; the app remains fully functional without the new tab.

---

## Hard stop triggers for this phase

- Any existing Sidebar tab (Inspector, Flags, Status) behavior changes. **STOP.**
- `PathChapterManager` holds graph data in local state instead of only reading from the store. **STOP** (AR-03 violation).
- `PathChapterManager` mutates the store directly instead of calling actions. **STOP** (AR-04 violation).
- The new component imports from `simulationStore` or `conditionEvaluator`. **STOP.**

---

## Acceptance Criteria

Done when:
- [ ] The Sidebar shows a fourth tab labeled "Paths".
- [ ] Clicking the "Paths" tab renders `PathChapterManager` without error.
- [ ] The "Paths" section shows a text input and a disabled confirm button when the input is empty.
- [ ] Typing a name and clicking confirm creates a new entry visible in the list.
- [ ] Clicking delete on a path entry removes it from the list.
- [ ] The "Chapters" section behaves identically.
- [ ] Switching away from the "Paths" tab and back preserves the list (data lives in store, not local state).
- [ ] The Inspector, Flags, and Status tabs are unaffected.

---

## Verification

Open the app in a browser.

1. Look at the Sidebar tab bar — confirm a "Paths" tab is present.
2. Click "Paths" — confirm the `PathChapterManager` panel renders with two sections.
3. In the Paths section, leave the input empty — confirm the confirm button is disabled.
4. Type "Act 1" and click confirm — confirm an "Act 1" entry appears in the list.
5. Add a second path "Act 2" — confirm both appear.
6. Click the delete button on "Act 1" — confirm it is removed.
7. Click the "Chapters" section and repeat steps 3–6 with chapter names.
8. Click the Inspector tab, select a node, make an edit. Confirm the Inspector still works.
9. Click the Flags tab and Status tab. Confirm both still work.
10. Click "Paths" again. Confirm the chapters from step 7 are still present (store persisted).
