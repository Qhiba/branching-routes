# Phase 3 — Node Assignment

---

**Goal:** Let designers assign a path and chapter to any selected node via dropdowns in `NodeInspector`, writing the reference into `node.data`.

---

## What it adds

- `NodeInspector.jsx` gains two new targeted Zustand selectors: one for `path{}`, one for `chapter{}`.
- Two `<select>` dropdowns added below the Content textarea:
  - **Path:** Options are "None" + all entries from `path{}`. Value is `node.data.pathId || ''`.
  - **Chapter:** Options are "None" + all entries from `chapter{}`. Value is `node.data.chapterId || ''`.
- On change, each dropdown calls `updateNode(node.id, { data: { ...data, pathId: value || null } })` and the equivalent for `chapterId`.
- Selecting "None" writes `null` to the field.

---

## Produces

| File | Change |
|------|--------|
| `src/components/NodeInspector.jsx` | MODIFY — add two selectors + two `<select>` dropdowns |

---

## What it leaves temporarily incomplete

Nothing. This is the final phase. After this phase the feature is complete per the Definition of Done in `ran_0201_scope.md`.

---

## What the next phase depends on from this phase

N/A — this is the final phase.

---

## Reference files needed

- `ran_0202_phase_01.md` (confirms `path{}` / `chapter{}` exist in store)
- `ran_0202_phase_02.md` (confirms manager UI is live so there are entries to select)
- `ran_0202_filemap.md`
- `ran_0202_integrationpoints.md`
- `src/components/NodeInspector.jsx`

---

## Rollback cost if this phase fails: LOW

Only one file is touched. The changes are strictly additive — new selectors and new JSX blocks. Removing the added selectors and the two dropdown blocks restores `NodeInspector` to its Phase 2 state. All other tabs and the canvas are unaffected.

---

## Hard stop triggers for this phase

- Any existing `NodeInspector` handler (`handleLabelChange`, `handleContentChange`, `handleStartNodeClick`, `toggleFlag`, `addStatusEffect`, `updateStatusEffect`, `removeStatusEffect`, `deleteNode`) changes behavior. **STOP.**
- The new selectors subscribe to the full store object instead of targeted keys. **STOP** (RISK-PCE-04).
- `pathId` or `chapterId` is stored in local component state instead of written through `updateNode`. **STOP** (AR-03 / AR-04 violation).
- Any import from `simulationStore` or `conditionEvaluator` is added. **STOP.**

---

## Acceptance Criteria

Done when:
- [ ] Selecting a node shows two dropdowns ("Path" and "Chapter") in the Inspector panel.
- [ ] Each dropdown lists "None" plus all paths/chapters currently in the store.
- [ ] Selecting a path from the dropdown persists: re-selecting the same node shows the chosen path still selected.
- [ ] Selecting "None" clears the assignment (sets `pathId` to `null`).
- [ ] Exporting the graph, then re-importing it, restores the correct `pathId`/`chapterId` on all nodes.
- [ ] Deleting a path via `PathChapterManager` causes any node that had that path assigned to show "None" in the dropdown after re-selecting it (cascade from Phase 1).
- [ ] All previously working NodeInspector fields (Label, Content, Start Node, Set Flags, Status Modifiers, Delete) remain functional.

---

## Verification

Open the app in a browser with at least one node on the canvas.

1. Click the "Paths" tab — add at least one path (e.g., "Act 1") and one chapter (e.g., "Chapter 1").
2. Click the "Inspector" tab — select a node.
3. Confirm a "Path" dropdown and a "Chapter" dropdown are visible below the Content field.
4. Confirm both dropdowns contain a "None" option and the entries created in step 1.
5. Select "Act 1" from the Path dropdown. Click elsewhere to deselect, then re-select the same node. Confirm the Path dropdown still shows "Act 1".
6. Select "Chapter 1" from the Chapter dropdown. Re-select the node. Confirm it persists.
7. Export the graph. Re-import it. Re-select the node. Confirm the Path and Chapter dropdowns still show the correct values.
8. Go to the "Paths" tab. Delete "Act 1". Return to "Inspector" and select the node again. Confirm the Path dropdown now shows "None".
9. Edit the node's Label field. Confirm it still saves correctly (existing behavior preserved).
10. Toggle a flag checkbox. Confirm it still saves correctly (existing behavior preserved).
