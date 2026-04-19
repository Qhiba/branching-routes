# Risk Register: Import / Export Layer

## Risk 1 — Migration chain port introduces silent regression on legacy files

**Description:** The v1–v4 migration functions in `fileSystem.js` (L75–L223) are ~150 lines of branching transformation logic. When the file is rewritten in Phase 2, these functions must be ported verbatim. A subtle difference (a missing field, a wrong fallback, an off-by-one in a conditional) produces a migration that appears to succeed but silently corrupts node data, edge conditions, or flag references on import.

**Early detection signal:** A v1 or v2 legacy file imports without an error but the resulting graph is missing nodes, has blank conditions, or has flag references that don't resolve in the store.

**Mitigation:** Before Phase 2 begins, capture the output of the current `importProject` on a v1 fixture file (using `example_datamodel.json` or a hand-crafted v1 test payload) and save it as a reference snapshot. After porting, run the same file through the new code and diff the outputs. Any divergence is a hard stop.

---

## Risk 2 — Auto-save subscription fires too frequently and causes write storms

**Description:** The Zustand `subscribe` call wired in Phase 1 fires on every state change to `narrativeStore`. Every node drag, every keystroke in an inspector field, every edge connect emits a change. Without debouncing, this could issue hundreds of IndexedDB writes per second during active editing — degrading performance and potentially causing write queuing issues.

**Early detection signal:** Browser DevTools → Performance shows repeated `indexedDB.transaction` calls during node dragging. UI jank is noticeable during drag operations.

**Mitigation:** The subscribe callback must use a debounce with a minimum interval (e.g., 800ms–1500ms). The Phase 1 hard stop trigger explicitly blocks progress if uncontrolled subscription performance is observed. The debounce interval may need tuning based on observed write latency.

---

## Risk 3 — Boot restore bypasses or duplicates teardown side effects

**Description:** Phase 1 adds a boot-time `loadFromIndexedDB()` → `loadGraph()` sequence in `main.jsx`. If `exitCampaign()` is not called before or after this sequence, a prior campaign session (e.g., `isCampaignActive: true`, a stale `currentNodeId`) could bleed into the restored state. Conversely, if `exitCampaign()` is called but `simulationStore` has already initialized to a clean state, the call is a no-op — which is fine. The dangerous case is if campaign state is somehow serialized into IndexedDB and restored.

**Early detection signal:** After a tab reload, the TopBar shows "Campaign Active" and the graph canvas is in campaign-mode visual state despite no explicit campaign entry.

**Mitigation:** `simulationStore` state is ephemeral and must never be written to IndexedDB. Only `narrativeStore.exportGraph()` output (which contains no simulation state per AR-08) is passed to `saveToIndexedDB`. The Phase 1 implementation must explicitly verify that the saved payload matches `exportGraph()` output and contains none of `simulationStore`'s fields. Phase 3 acceptance criterion 6 tests the campaign bleed scenario directly.

---

## Risk 4 — `handleNew` in TopBar clears the store but auto-save writes back before IndexedDB is cleared

**Description:** After clicking New, `newGraph()` fires and sets the store to empty. The debounced auto-save subscription then writes this empty state to IndexedDB — which is the correct outcome. However, if `clearIndexedDB()` is called explicitly (Phase 3) before the debounce fires, and then the user immediately closes the tab during the debounce window, IndexedDB could be in a cleared state without the empty graph being re-written. On next boot, the app would start blank — which is arguably correct, but the behavior depends on timing.

**Early detection signal:** Clicking New and immediately closing the tab results in the app re-opening with the graph from before "New" was clicked (IndexedDB still had old data, debounce hadn't fired, `clearIndexedDB` was called before write).

**Mitigation:** The `handleNew` sequence should be: (1) call `clearIndexedDB()` synchronously, (2) call `newGraph()`, (3) allow the subscribe debounce to write the blank state. If the user closes the tab during the debounce window after step 1, they get a blank app on restore — which is the correct post-New state. This ordering is explicit in the Phase 3 implementation note and verified in Phase 3 acceptance criteria item 4.

---

## Risk 5 — Schema version emitter and import version guard diverge after Phase 2

**Description:** `narrativeStore.exportGraph()` emits a `schemaVersion` number. `importProject()` in `fileSystem.js` validates against an accepted-versions array. If Phase 2 increments the emitter to 5 but the import guard is not updated to include 5, every file exported after the update is immediately rejected on re-import. This is a straightforward but catastrophic pairing error.

**Early detection signal:** Export a file, then immediately import it. An "unsupported schema version" error appears.

**Mitigation:** The Phase 2 acceptance criteria explicitly require exporting a file and re-importing it as the first test. The implementation checklist for Phase 2 pairs the `schemaVersion` emitter update with the version guard update as a single atomic change — they are never updated independently.
