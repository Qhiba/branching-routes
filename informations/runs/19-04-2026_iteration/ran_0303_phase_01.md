# Phase 1 — IndexedDB Layer

## Goal
Add IndexedDB as an automatic, always-on primary persistence layer so work survives tab close and crashes, without changing any visible UI behavior or export format.

## What it changes
- `fileSystem.js` gains two new exported functions: `saveToIndexedDB(graphData)` and `loadFromIndexedDB()`.
- On app boot (`main.jsx` or an `initPersistence` module), `loadFromIndexedDB()` is called. If data is found, it is passed to `narrativeStore.loadGraph()` to hydrate the store before first render.
- A Zustand `subscribe` call on `narrativeStore` is established after boot. On any state change, a debounced `saveToIndexedDB` fires with the output of `exportGraph()`.
- `narrativeStore.loadGraph()` is the only path used for boot restore — this guarantees `uiStore.resetSelection()` fires, and `exitCampaign()` is called explicitly before or after load to prevent campaign state from bleeding through.

**RULE CANDIDATE:** Centralizing app-boot side effects (IndexedDB restore, store subscription wiring) in a dedicated `initPersistence()` function called from `main.jsx` is a new pattern. Worth formalizing in architecture rules after the iteration stabilizes. (Do not add to `architecture_rules.md` yet — flag for 0309.)

## Produces
| File | Action |
|---|---|
| `src/utils/fileSystem.js` | Add `saveToIndexedDB` and `loadFromIndexedDB` functions. Existing `exportProject` and `importProject` remain unchanged in this phase. |
| `src/utils/index.js` | Re-export `saveToIndexedDB` and `loadFromIndexedDB`. |
| `src/main.jsx` | Add boot-time `loadFromIndexedDB()` call and `narrativeStore.subscribe()` auto-save wiring. |

## Migration step
**In-place migration.** IndexedDB starts empty on first load. No existing data is transformed. The first auto-save after boot writes the current in-memory store state into IndexedDB. If IndexedDB is empty on boot, the app initializes as normal with a blank graph (existing behavior preserved).

The object written to IndexedDB must be identical in shape to the output of `narrativeStore.exportGraph()` — no new fields, no format changes in this phase.

## What it leaves temporarily inconsistent
- `TopBar.handleNew` does not yet clear IndexedDB when the user starts a new graph. After this phase, clicking New replaces the in-memory store but the auto-save subscription immediately writes the new empty state over IndexedDB — so the inconsistency self-heals within one debounce cycle. No action node required from the user; Phase 3 explicitly adds a manual `clearIndexedDB()` call to `handleNew` for correctness.

## What the next phase depends on from this phase
- `saveToIndexedDB` and `loadFromIndexedDB` are available and tested.
- The subscribe wiring is in place to write after every change.
- Boot restore uses `loadGraph()` so teardown side effects stay intact.

## Reference files needed
- `src/utils/fileSystem.js`
- `src/store/narrativeStore.js` (to understand `exportGraph()` output shape and `loadGraph()` contract)
- `src/store/uiStore.js` (to confirm `resetSelection()` is called inside `loadGraph`)
- `src/store/simulationStore.js` (to identify where `exitCampaign()` must be called on restore)
- `src/main.jsx`

## Rollback cost if this phase fails
**LOW.** All new code is additive. Removing the `subscribe` call from `main.jsx` and the two new functions from `fileSystem.js` and `index.js` restores the prior state exactly. No existing behavior is modified.

## Hard stop triggers
- IndexedDB write fails silently and the console confirms no data is being persisted → investigate before proceeding.
- Boot restore calls `loadGraph()` correctly but `uiStore.resetSelection()` is confirmed not to fire → STOP. Teardown integrity must be verified before Phase 2.
- The auto-save subscription fires synchronously on every render (not debounced) causing performance degradation visible in the browser → STOP and fix debounce before proceeding.

## Acceptance Criteria
Done when:
1. Every store mutation triggers a debounced write to IndexedDB.
2. Reloading the browser tab (F5) restores the graph to the exact state before reload without any user action.
3. `uiStore.resetSelection()` fires on boot restore (confirming `loadGraph()` is the restore path).
4. Closing the tab and reopening the app recovers the last saved state.
5. On first-ever boot (empty IndexedDB), the app starts with a blank graph as before.

## Verification
1. Open the app. Create two or three nodes and connect them.
2. Close the browser tab entirely (do not click Export).
3. Reopen the app in a new tab.
4. Confirm the graph is exactly as you left it — nodes, edges, and labels all restored.
5. Open DevTools → Application → IndexedDB and confirm an entry exists for this app.
6. Click New. Confirm the graph clears. Reload the tab. Confirm the app opens to a blank graph (not the previous nodes).
