# Risk Register — Branching Routes Refactor

**Top 5 risks specific to this structural refactor.**

---

## R01 — Cross-Store Selection Clearing Introduces a Race Condition Window

**Description:**  
The current `deleteNode`/`deleteEdge` logic clears selection in a single Zustand `set()` call. After Phase 2, this becomes two sequential `set()` calls across two stores. Between those two calls, there is a brief window where the graph entity is deleted but `uiStore` still holds its ID as `selectedNodeId` or `selectedEdgeId`. If a component re-renders synchronously between the two calls (e.g., because Zustand's subscriptions fire immediately), the inspector may attempt to render a node/edge that no longer exists.

**Early detection signal:** After Phase 2, selecting a node and deleting it causes a null-reference error in `NodeInspector` or `EdgeInspector` (e.g., `Cannot read properties of undefined`).

**Mitigation:** Components reading `selectedNodeId`/`selectedEdgeId` must guard with a derived selector: look up the node/edge by ID from `narrativeStore` — if not found, treat as null. This is a defensive pattern regardless of the refactor. Confirm it is in place before ending Phase 2.

---

## R02 — Missed Import Reference After Store Rename (Phase 4)

**Description:**  
`graphStore` is imported in 10+ files. The rename to `narrativeStore` is a sweeping change. A single missed import (`import { useGraphStore } from 'store'`) will fail silently at runtime if Zustand's barrel still exports both names, or throw a module error if it doesn't. Both failure modes are hard to spot during a visual smoke test.

**Early detection signal:** After Phase 4, the app renders but some action (e.g., adding a flag, selecting an edge) does nothing or throws `useGraphStore is not a function`.

**Mitigation:** After Phase 4, remove `useGraphStore` from `store/index.js`. Any file that still imports it will then throw a build-time or runtime module error immediately, making the miss un-ignorable. Use a project-wide search (`grep -r "useGraphStore"`) to confirm zero remaining references before marking Phase 4 complete.

---

## R03 — Prefixed IDs Break Existing Saved Files If `loadGraph` Is Not Verified

**Description:**  
Phase 3 changes `generateId` to emit `"n-{uuid}"` format. Old saved files contain bare UUID IDs. All cross-references in a saved file (edge `sourceId`/`targetId`, condition `flagId`, sideEffect `flagId`) point to the bare UUID format. If any code path transforms or rejects the old format during `loadGraph`, referential integrity collapses silently — edges may point to nonexistent nodes, conditions reference nonexistent flags.

**Early detection signal:** After Phase 3, loading an old file displays nodes but no edges, or simulation refuses to find a start node.

**Mitigation:** Run the load test explicitly: export a file before Phase 3 (with bare UUIDs), then load it after Phase 3 completes. Confirm nodes, edges, flags, and simulation all work correctly on the old file.

---

## R04 — `uiStore` Imported by `narrativeStore` Creates a Circular Risk

**Description:**  
Phase 2 requires `narrativeStore` to call `useUIStore.getState()`. If, at any point, `uiStore` later imports from `narrativeStore` (e.g., a developer adds a convenience selector), a circular import chain is introduced between store files. This violates AR-06 and causes Zustand to initialize in an undefined order, producing subtle bugs (store methods missing, state undefined on first render).

**Early detection signal:** App loads but `useNarrativeStore` or `useUIStore` is undefined at runtime, or initial state is missing fields.

**Mitigation:** Add a comment in `uiStore.js`: `// THIS FILE MUST NOT IMPORT FROM narrativeStore.js — AR-06`. Enforce via code review. Future phases should not add uiStore-to-narrativeStore dependencies.

---

## R05 — CSS Token Value Changes Break Simulation State Visuals

**Description:**  
Phase 1 updates color values in `tokens.css`. The simulation relies on specific color tokens (`--color-active`, `--color-reachable`, `--color-visited`) to visually distinguish active, reachable, and visited nodes/edges. If the new values are too similar to each other or to the default node color (`--color-bg-elevated`), simulation state distinctions become invisible — the designer cannot tell which nodes are active or reachable.

**Early detection signal:** After Phase 1, running a simulation shows no visual difference between the active node and an unvisited node, or reachable nodes don't pulse.

**Mitigation:** After Phase 1, run a simulation with at least 3 nodes (one active, one reachable, one visited) and confirm all three are visually distinct. Check that the `pulse-border` animation on `.story-node--reachable` remains visible against the canvas background (`--color-canvas-bg`).
