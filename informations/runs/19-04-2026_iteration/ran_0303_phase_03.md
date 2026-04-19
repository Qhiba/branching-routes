# Phase 3 — TopBar Wiring

## Goal
Reconnect `TopBar.jsx` call sites to the updated function signatures from Phase 2, and verify that all three load paths (button import, button new, boot restore from IndexedDB) correctly fire teardown side effects.

## What it changes
- **`handleExport`:** Updated to call `exportProject` with the current schema, matching any signature changes from Phase 2.
- **`handleImport`:** Updated to call the hardened `importProject`. Confirms that after successful import, `loadGraph()` is called (which fires `uiStore.resetSelection()`), and `exitCampaign()` is called explicitly.
- **`handleNew`:** Updated to explicitly clear IndexedDB (call `clearIndexedDB()` or equivalent) before calling `newGraph()`. This closes the self-healing gap left by Phase 1.
- **Boot restore teardown:** Verified that the boot restore path in `main.jsx` (from Phase 1) also calls `exitCampaign()` explicitly. `uiStore.resetSelection()` is already covered by `loadGraph()`. This is a verification step — if Phase 1 wired it correctly, no code change is needed here. If not, the fix lands here.
- No new behavior is added. This phase is purely a wiring and verification pass.

## Produces
| File | Action |
|---|---|
| `src/components/TopBar.jsx` | `handleExport`, `handleImport`, `handleNew` updated to match new signatures and include `clearIndexedDB` call on New. |
| `src/main.jsx` | Verified or amended: boot restore path calls `exitCampaign()` after `loadGraph()`. If Phase 1 already did this correctly, this file does not change. |
| `src/utils/fileSystem.js` | `clearIndexedDB()` function added if not already present from Phase 1. |
| `src/utils/index.js` | Re-export `clearIndexedDB` if added. |

## Migration step
NONE. This phase touches no persisted keys or data formats.

## What it leaves temporarily inconsistent
Nothing. This is the final phase. After Phase 3, the system must be fully consistent across all load paths.

## What the next phase depends on from this phase
Nothing — this is the last phase. The iteration is complete when this phase passes acceptance criteria.

## Reference files needed
- `src/components/TopBar.jsx`
- `src/utils/fileSystem.js` (Phase 2 output)
- `src/store/narrativeStore.js` (`loadGraph`, `newGraph`, `exportGraph`)
- `src/store/uiStore.js` (`resetSelection`)
- `src/store/simulationStore.js` (`exitCampaign`)
- `src/main.jsx` (Phase 1 output)

## Rollback cost if this phase fails
**LOW.** `TopBar.jsx` is the primary change target. If wiring fails, reverting `TopBar.jsx` to its Phase 2-end state restores the previous behavior. Phases 1 and 2 are unaffected.

## Hard stop triggers
- After clicking Import and loading a file, `selectedNodeId` in `uiStore` still references a node from the previous graph → STOP. `resetSelection()` is not firing correctly.
- After clicking Import while campaign mode is active, `isCampaignActive` remains `true` → STOP. `exitCampaign()` is not being called.
- After clicking New, a browser reload restores the previously-deleted graph → STOP. `clearIndexedDB()` is not executing before the auto-save fires.
- After a browser reload restoring from IndexedDB, `isCampaignActive` is `true` → STOP. Boot restore path is not calling `exitCampaign()`.

## Acceptance Criteria
Done when:
1. Clicking Export works and produces a downloadable file.
2. Clicking Import opens a file picker, loads the graph, and clears the current selection.
3. Clicking Import while Campaign Mode is active exits Campaign Mode before loading.
4. Clicking New clears the graph and, after a reload, the app opens to a blank graph (not the previous state).
5. Reloading the tab (without clicking New) restores the previous graph.
6. Reloading the tab after a session in Campaign Mode opens the app in edit mode (not Campaign Mode).

## Verification
1. Build a graph with several nodes. Enter Campaign Mode. Click Import and load any valid file. Confirm: Campaign Mode is exited, the imported graph is shown, and no previously-selected node is highlighted.
2. Build a graph. Click New. Confirm the canvas clears. Close and reopen the tab. Confirm the app opens to a blank graph.
3. Build a graph. Close the tab without clicking Export. Reopen the tab. Confirm the graph is restored.
4. Build a graph. Enter Campaign Mode. Close the tab. Reopen the tab. Confirm the graph is restored and the app is in edit mode (not Campaign Mode).
