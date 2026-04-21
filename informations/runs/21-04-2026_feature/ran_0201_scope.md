## ROLE
You are a feature analyst helping scope a new addition to a
working system. You surface what already exists so the user
only fills in what only they know about the new thing.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the feature must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. `/informations/docs/risk_register.md` — existing risks

## TASK
Read Part 1. Fill Part 2 based on the user's decisions
cross-referenced against the loaded files.
Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely. Then feed this
> file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_feature/ran_0201_scope.md`

---

## Part 1 — User fills

### Feature name
<!-- [SNAKE_CASE NAME] -->
Route_Tracing

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
Adds a full route-tracing and analysis layer on top of campaign-mode simulation. While a campaign is active, the canvas visually marks every edge the simulation has crossed, highlights the current node, and differentiates seen from unseen nodes. Traversal is recorded as rich snapshot records — each traversal captures the edge ID, flag values, status values, source and target node IDs, and a sequence number — enabling downstream analysis beyond simple visual highlighting.

A companion control, the **Undo Active Node Button**, lets authors step back exactly one node when they've made a wrong choice at a choice node. Pressing it pops the most recent traversal record, restores flag and status values from the prior snapshot, and returns the current node pointer to the previous position. Without this, a mis-click at a choice node would force the author to abandon the campaign or reset it entirely — Undo turns a ten-minute loss into a one-click recovery.

From this foundation, three analysis capabilities layer in:

**Coverage metrics** surface in the bottom bar as StatusStrip. Readouts include nodes visited / total, endings reached / total, edges traversed / total. Authors can glance at the strip and see their testing coverage without leaving the canvas.

**Dead-end and unreachable-node counter** gives authors a simple seen/unseen count aggregated across campaigns, surfacing nodes that have never been reached by any simulation run and nodes with no outgoing edges that aren't endings. On-demand or debounced. Additionally, nodes that are unreachable from the active node are visually dimmed on the canvas — a greyed-out or semi-transparent appearance that makes structural gaps obvious at a glance. Reachable nodes retain full opacity.

**Shortest route respecting gates** computes traversable paths from start to a target node, respecting flag and status gates — every returned path must be actually traversable given the narrative's conditional logic. Paths are returned as a sorted list from shortest to longest, never as a single "best" answer. All paths respect gates; there is no mode that ignores conditions. When multiple paths tie on length, the user can specify flag or status priorities to break ties — for example, preferring paths where `hasKey = true` over paths where it's false, or preferring paths where health stays above a threshold. The user can also cap the number of paths returned, with a default of 5. UI to select target, set priorities, set path limit, and a second overlay to display the computed routes distinct from actual traversed edges — with path selection (e.g., tabs or a list) to switch which route is highlighted.

Together, these features turn the simulation from a "can I reach the end" walking mode into a proper authoring instrument for validating branching coverage, reasoning about reachability, and exploring alternative routes.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- Does not persist traversal records. They live in `simulationStore` runtime state per AR-08. Closing the tab discards them; reopening starts with empty traversal data.

- Does not replay traversal as a timeline. The Undo Active Node Button steps back exactly one node; there is no multi-step scrubbing, no slider, no "show me where I was 10 steps ago" control.

- Does not overlay multiple campaigns simultaneously. Tracing reflects the active campaign only. No cross-campaign diff, no "edges in A but not B" view.

- Does not export traversal, metrics, or analysis results. All output is visual and in-app. No report generation, no CSV export, no coverage dashboard beyond StatusStrip readouts.

- Does not annotate paths with author notes. Tracing is read-only state reflection, not a commentary layer.

- Does not offer a "shortest-route ignoring gates" mode. Every returned path must satisfy gate conditions. Authors asking "what would be shortest if I could bypass this gate" will not find the feature here.

- Does not return a single best path. The shortest-route feature returns a sorted list. Authors choose which path to display.

- Does not auto-discover what priorities matter. Flag and status priorities for tie-breaking are user-specified inputs, not inferred from the narrative structure.

- Does not return unbounded path counts. There is always a cap, defaulting to 5. Authors who want to explore exhaustively must raise the limit manually, and the solver will still enforce an upper bound to prevent runaway computation on pathological graphs.

- Does not allow manual path drawing. Authors cannot sketch hypothetical routes on the canvas without actually simulating them.

- Does not enforce any rule against disabling the overlay. Tracing and metrics have toggles. The underlying record data persists in runtime state whether the overlay shows it or not.

### Why this feature is needed now
Previous update gave the app persistent campaigns — named simulation snapshots authors can save, reload, and switch between. Without visual tracing, campaigns are data without display; authors have no way to see what a campaign actually explored besides stepping through it again manually. For a tool whose job is validating branching narratives, this is the missing half of the simulation loop: the first half lets you run simulations; this update lets you read them.

The Undo button is needed now because the current simulation mode has no recovery path from a wrong choice. An author who misclicks at a choice node must either abandon the campaign, reset it entirely (losing all prior progress), or live with the corrupted path. None of these are acceptable for a tool whose purpose is careful branching-narrative validation. One-step Undo is the minimum viable recovery mechanism and belongs with the core tracing work, not a future polish update.

The analysis features (metrics, dead-end detection with dimming, shortest-route) are needed now for a related reason: the data model is complete. After previous updates, every entity the app will ever have exists. After previous updates, every runtime behavior exists. This is the earliest moment where static and dynamic analysis can run against a stable surface without risk of being invalidated by future schema changes.

The sorted-paths-with-priorities design for shortest-route specifically addresses a real authoring need: a branching narrative rarely has one "correct" shortest path — authors want to compare alternatives. "Can the player reach this ending without picking up the key?" is a different question from "What's the fastest route?" and both deserve answers. Returning a sorted, user-capped list of gate-respecting paths with priority-based tie-breaking gives authors a proper exploration tool rather than a single opaque answer.

The rich traversal record (each record containing `edgeId`, `flagSnapshot`, `statusSnapshot`, `fromNodeId`, `toNodeId`, and `sequence`) shape also pressures the timing. The cheapest moment to commit to rich traversal records is when route tracing first ships. Retrofitting the shape later would require a refactor update touching every campaign's runtime state assumptions. Landing all four features as one family, built on a shape designed to serve all of them, avoids that cost entirely.

Finally, UI polish must come last. Every visual element the polish update styles has to exist first. Landing tracing, Undo, metrics, dimming, and analysis overlays before UI Polish update means those update can style them in a single coherent pass rather than being reopened for each new addition.


### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| ADD | `src/utils/routeTracer.js` | BFS, shortest path, goal-directed pathfinding algorithms |
| ADD | `src/components/RouteFinderDialog.jsx` | Route trace UI + filter options |
| MODIFY | `src/components/GraphCanvas.jsx` | Route overlay rendering |
| MODIFY | `src/store/simulationStore.js` | Route trace state |
| MODIFY | `src/utils/index.js` | Re-exports |


### Assumptions I am making
<!-- [LIST OR "NONE"] -->
This will come with a risk that I don't know how to mitigate:
**Missing Definition of done**, I don't know what to add or modify for the Visual Node Clustering feature.

**AR-08 pressure from the shortest-route feature.** Shortest-route-with-gates may compute expensive results on large graphs, and returning multiple sorted paths amplifies cost. The temptation will be to cache computed route sets across sessions. AR-08 currently forbids persisting simulation state. Either accept re-solving on every load, or amend AR-08 to distinguish *authored* simulation state (never persisted) from *derived/computed* simulation artifacts (optionally cached). Declare this tension in the shortest-route push's Audit First, don't discover it mid-execute.

**Re-render storms from traversal updates.** Every simulation step appends a record. Edge components must not subscribe to the full array or the full Set — use per-edge primitive selectors per AR-14. Same rule applies to metric readouts and to the shortest-route overlay — return primitives, not aggregate objects.

**Rich traversal record memory at scale.** Rich records are ~200 bytes each. A campaign with thousands of steps still fits comfortably in memory, but cap the record array if unbounded growth is possible (e.g., a looping simulation). A reasonable ceiling with rolling discard of oldest records would protect against runaway memory without meaningful data loss.

**Edge ID resolution with option-specific edges.** AR-15 requires edge uniqueness to include `optionId`. Traversal records, metric counts, dimming logic, Undo rollback, and shortest-route outputs must all capture full edge identity, not just the source/target pair. A choice node with multiple options routing to the same target produces multiple distinct edges — conflating them would corrupt every analysis feature.

**Reset and switch plumbing.** Campaign reset, campaign switch, exit campaign mode, and project reload all need to clear traversal records. Missing one creates stale overlay data. Centralize the clear logic in a single reducer action called from each trigger point.

**Undo button state consistency.** Stepping back one node must cleanly reverse the last traversal's effects: pop the most recent traversal record, restore flag and status values from that record's snapshot, and update the current node pointer to the prior node. Because each traversal record captures the pre-entry flag and status snapshots, reversal is a restore-from-snapshot operation — but this requires Undo to only operate while at least one record exists. First-node-of-campaign Undo should be disabled or a no-op. If the shortest-route overlay is active when Undo fires, mark the overlay stale — the route was anchored to the pre-Undo node and may no longer be relevant. If auto-save fires between the user's click and the state rollback, the saved campaign could reflect either the pre-Undo or post-Undo state depending on timing; sequence the rollback before the save, or debounce the save until after Undo completes.

**Dead-end detection edge cases.** Nodes with no outgoing edges that *are* ending-type are correct terminals, not dead ends. The counter must respect node type. Keep scope to "no outgoing edges + not ending-type" and document the narrow definition.

**Dimming semantics.** Unreachable nodes are dimmed based on *simulation history* across campaigns, not static analysis. A node that is actually reachable but never visited will be dimmed until a campaign reaches it. This is intentional — the feature surfaces coverage gaps. However, authors may misinterpret dimming as "proven unreachable." Document clearly: "Dimmed = never visited in any campaign so far, not necessarily impossible to reach."

**Shortest-route gate satisfaction complexity.** Finding traversable paths with state-dependent gates is harder than plain BFS. A gate failing at the current state may become satisfiable after visiting a third node that sets the required flag. Full state-space search is exponential in the worst case. Scope options: (a) bounded BFS with a configurable max depth, (b) state-space search with timeout, (c) state-space search with a hard node-visit cap. Pick one and document the limitation. Authors need to understand which question the feature actually answers — "the shortest paths found within budget X" is not the same as "the globally shortest paths."

**Sorted-paths enumeration cost.** Returning multiple paths is strictly more expensive than returning one. Yen's k-shortest-paths algorithm on a gated state-space can be costly on dense graphs. The default cap of 5 plus a user-adjustable limit helps, but there must also be a hard ceiling (e.g., 50) that the UI can't exceed, to prevent accidental browser hangs from a typo in the input field.

**Priority specification UX.** Flag and status priorities are a user input that determines tie-breaking among equal-length paths. This needs a clear UI — a list of flags/statuses with preferred values, probably. Avoid overengineering: priorities should be a simple ordered list of `{key, preferredValue}` pairs, not a full expression language. Document that priorities only apply to ties; they do not override path length ordering.

**Priority ambiguity when no tie exists.** If the user specifies priorities but all returned paths have different lengths, the priorities silently don't apply. This can confuse users ("why isn't my priority doing anything?"). Surface this in the UI — show which paths tied and how priorities broke the tie, or note "no ties to break" when priorities were unused.

**Shortest-route result staleness.** If the narrative changes after a route is computed, the displayed route may reference edges or gates that no longer exist. Either invalidate results on narrative change, or mark them stale with a re-run prompt. Silent staleness is the worst option.

**Visual layering conflicts.** Path colors (Push 5), chapter grouping (Push 5), node state colors (Push 3), variant indicators (Push 6), traversal overlay (Push 13), current node emphasis (Push 13), unreachable-node dimming (Push 13), shortest-route overlay (Push 13C) — with multiple sorted paths, potentially multiple shortest-route overlays visible at once. This is a lot of visual signal. Document precedence rules and consider rendering only one shortest-route path at a time (the user-selected one from the sorted list) rather than all of them simultaneously. Push 14 can't fix semantic layering, only aesthetic treatment.

**Shortest-route UI affordance ambiguity.** How does the user select a target node? Click? Right-click menu? Palette? And how do they see the sorted list, select a path, adjust priorities, change the cap? Design the full input/output surface in the shortest-route push before execute — it's more UI than the other two analysis features combined.

---

## Part 2 — AI fills, user does not edit

### Related existing features

**`src/store/simulationStore.js`** — The direct host for all new state this feature adds. Already owns: active node pointer, `seenNodeIds` set, `traversedEdgeIds` set, `currentFlagValues`, campaign lifecycle (`enterCampaign`, `advance`, `reset`, `exitCampaign`), and `snapshotCampaign`. The rich traversal records, Undo action, coverage selectors, dead-end counter, and unreachable-from-active-node set all extend this store. The existing `advance()` action is the insertion point for appending traversal records on every step.

**`src/store/campaignStore.js`** — Owns the persisted campaign snapshots. The snapshot shape (`activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, `flagOverrides`, `statusOverrides`) already includes `traversedEdgeIds` — the crude predecessor to the new rich records. The rich records stay runtime-only; the snapshot shape does not need to change. Relevant because every trigger that clears traversal records (campaign switch, campaign reset, exit) flows through or alongside `campaignStore` actions.

**`src/utils/conditionEvaluator.js`** — The only file permitted to contain gate evaluation logic (AR-07). The shortest-route pathfinder in `routeTracer.js` must call `evaluateCondition`/`evaluateClause` from here to determine whether an edge's gate is satisfiable from a given flag/status state. This file is read-only for this feature.

**`src/components/GraphCanvas.jsx`** — Already applies simulation visual states, renders the cluster overlay, and owns the `advance`-by-click logic. The traversal overlay, current-node emphasis, unreachable dimming, and shortest-route overlay all render inside this component. The Undo button, if rendered in the canvas area rather than TopBar, would also land here — though TopBar is more consistent with the existing Reset/Exit controls.

**`src/components/edges/ConditionalEdge.jsx`** — Already has a `--traversed` CSS class for edges that have been advanced along. The new traversal overlay is an extension of this existing visual; the component must be updated to distinguish the traversal overlay color from the shortest-route overlay color, since both are active simultaneously.

**`src/components/nodes/CommonNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`** — Already apply the six-state enum CSS and the orthogonal `--seen` overlay. The unreachable-dimming indicator is a second orthogonal overlay (like `--seen`) that applies independently of campaign state. All three node renderers need to read the new dimming signal and apply it.

**`src/components/TopBar.jsx`** — Already hosts Reset Simulation and Exit Campaign Mode controls. The Undo Active Node Button is a campaign-mode control that belongs alongside them. The StatusStrip is a new bottom-bar region, not a TopBar addition.

**`src/styles/tokens.css` and `src/styles/global.css`** — Already define the five campaign state tokens, the six-state CSS classes, the `--seen` overlay, the `--traversed` edge class, and the cluster overlay. New tokens and CSS classes for traversal overlay color, shortest-route overlay color, unreachable-dimming opacity, and StatusStrip layout all extend these files.

**`src/App.jsx` and `src/App.css`** — Currently a three-region grid (TopBar / Canvas / Sidebar). The StatusStrip requires a fourth region — a bottom bar — which means both files change to accommodate the new layout slot.

---

### Files to touch

| Action | File | Reason |
|--------|------|--------|
| MODIFY | `src/store/simulationStore.js` | Add `traversalRecords[]` state; add `undoLastNode()` action; add coverage metric selectors (`visitedCount`, `endingsReachedCount`, `traversedEdgeCount`, `totalNodeCount`, `totalEndingCount`, `totalEdgeCount`); add `unreachableFromActiveNodeIds` set (derived on each `advance`); add dead-end count selector; clear all new state in `exitCampaign()`, `reset()`, and on campaign switch |
| MODIFY | `src/store/uiStore.js` | Add `showTraversalOverlay: boolean` toggle; add `showRouteFinderDialog: boolean` toggle; add `showShortestRouteOverlay: boolean` toggle; all three default `false` |
| MODIFY | `src/components/TopBar.jsx` | Add Undo Active Node Button (campaign mode only, disabled when `traversalRecords.length === 0`) |
| MODIFY | `src/components/GraphCanvas.jsx` | Wire traversal overlay rendering (per-edge color from `traversalRecords`); wire current-node emphasis CSS; wire unreachable-from-active-node dimming; wire shortest-route overlay (per-edge color from computed routes); listen for RouteFinderDialog target-node click event if target selection is click-driven |
| MODIFY | `src/components/edges/ConditionalEdge.jsx` | Add traversal overlay CSS class (distinct from existing `--traversed`); add shortest-route overlay CSS class; keep `--traversed` for backward compatibility or fold it into the new overlay class |
| MODIFY | `src/components/nodes/CommonNode.jsx` | Add `--coverage-gap` orthogonal CSS class when `unreachableFromActiveNodeIds` includes this node's ID |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` | Same as CommonNode |
| MODIFY | `src/components/nodes/EndingNode.jsx` | Same as CommonNode |
| MODIFY | `src/App.jsx` | Add `<StatusStrip />` as a fourth region below the canvas |
| MODIFY | `src/App.css` | Expand three-region grid to four-region; add bottom bar slot for StatusStrip (fixed height, e.g. 28px) |
| MODIFY | `src/styles/tokens.css` | Add tokens: `--color-traversal-overlay`, `--color-route-overlay`, `--opacity-coverage-gap`, plus any StatusStrip colors |
| MODIFY | `src/styles/global.css` | Add CSS classes: `.conditional-edge--traversal-overlay`, `.conditional-edge--route-overlay`, `.story-node--coverage-gap`, StatusStrip component styles, RouteFinderDialog overlay styles |
| MODIFY | `src/utils/index.js` | Re-export new utilities from `routeTracer.js` |
| MODIFY | `src/components/index.js` | Re-export `RouteFinderDialog`, `StatusStrip` |
| CREATE | `src/utils/routeTracer.js` | Pure functions: gate-respecting BFS from start to target; Yen's k-shortest-paths variant on gated state-space; dead-end node detection (no outgoing edges, non-ending type); unreachable-node detection; all gate checks via `evaluateCondition` import |
| CREATE | `src/components/RouteFinderDialog.jsx` | Searchable target-node selector (with chapter/path disambiguation per AR-22); priority list UI (`{flagOrStatusId, preferredValue}[]`); path-cap input with hard ceiling enforcement; computed results display (sorted list, tab/list path selector); re-run prompt on stale results; campaign-mode only |
| CREATE | `src/components/StatusStrip.jsx` | Bottom bar reading six coverage primitives from `simulationStore` selectors; campaign-mode only visibility; no side effects on render (AR-14) |

---

### Files to protect

| File | Status | Reason |
|------|--------|--------|
| `src/utils/conditionEvaluator.js` | PROTECTED | AR-07: the sole home of all condition evaluation logic. `routeTracer.js` calls it but must not modify it. Adding gate logic inside `routeTracer.js` itself would violate AR-07. |
| `src/store/narrativeStore.js` | PROTECTED | AR-08: canonical graph data must never receive simulation state. Traversal records, metrics, and route results all live in `simulationStore`. No field may be added to `narrativeStore` for tracing purposes. |
| `src/store/campaignStore.js` | PROTECTED | The snapshot shape (`activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, `flagOverrides`, `statusOverrides`) does not need to change — traversal records are runtime-only per AR-08. Touching this file risks the snapshot round-trip and the ZIP import/export path. |
| `src/utils/fileSystem.js` | PROTECTED | Persistence layer. Traversal records are ephemeral (AR-08). No new IndexedDB fields, no schema version bump, no ZIP format change is required for this feature. |
| `src/utils/uuid.js` | PROTECTED | Stable leaf utility with no feature dependencies. |
| `src/store/toastStore.js` | PROTECTED | Ephemeral notification store with no relation to tracing. |

---

### Architecture rules relevant to this feature

| Rule | Why it applies |
|------|---------------|
| **AR-08 — Simulation Isolation** | All traversal records, Undo state, coverage metrics, dead-end counts, route results, and dimming sets must live exclusively in `simulationStore`. None of these may be written to `narrativeStore`, `campaignStore`, or IndexedDB. Entering or exiting a campaign must fully clear them. This is the highest-priority rule for this feature. |
| **AR-14 — Zustand Selector Stability** | Every new selector — per-edge traversal check, per-node dimming check, coverage metric readouts, route result lookup — must return a primitive (boolean, number, string) or an existing stable reference. The six coverage counters in StatusStrip must read as numbers, not derived arrays. The per-node dimming check must read as a boolean (`Set.has(id)`), not return a new Set. |
| **AR-07 — Condition Evaluation** | `routeTracer.js` performs gate-respecting pathfinding. Every gate check inside the pathfinder must call `evaluateCondition`/`evaluateClause` from `conditionEvaluator.js`. Inline flag/status comparison logic inside `routeTracer.js` itself is not permitted. |
| **AR-15 — Edge Uniqueness Tuple** | Traversal records must store the full `(edgeId, sourceId, targetId, optionId)` tuple — not just `edgeId`. Metric counting, Undo rollback, and route overlay rendering must all use the full tuple to avoid conflating multiple option-edges between the same node pair. |
| **AR-03 — State Management** | Traversal records, route results, priority inputs, path cap, and dialog open state that must survive re-renders or be read by multiple components belong in Zustand stores (`simulationStore` for simulation data, `uiStore` for overlay toggles). Component `useState` is limited to transient UI concerns inside `RouteFinderDialog` (e.g., the priority input field's current text before commit). |
| **AR-04 — Data Layer Separation** | `routeTracer.js` is a pure-function utility. It must not import or call any Zustand store. Results are computed outside the store and then written in via store actions. Components read results from the store, not by calling `routeTracer.js` directly. |
| **AR-16 — Campaign Visual State Vocabulary** | The six-state enum (`active`, `locked`, `complete`, `failed`, `branch_locked`, `reachable`) plus orthogonal `seen` already exists. The unreachable-dimming indicator is a second orthogonal overlay (`--coverage-gap`), not a new enum value. AR-16 must be updated to document this second orthogonal indicator alongside `seen`. The traversal overlay and shortest-route overlay are purely additive CSS on edges and do not affect node states. |
| **AR-19 — Canvas-Space Operations via DOM Events** | `RouteFinderDialog` is rendered outside the `ReactFlowProvider` subtree. If target-node selection is implemented as a "click on canvas to pick target" interaction, the click must be handled inside `GraphCanvas` and communicated back via a DOM event or a `uiStore` field. `RouteFinderDialog` must not attempt to call `useReactFlow()` directly. |
| **AR-20 — Store Action Signatures in Data Model Doc** | Every new `simulationStore` action (`undoLastNode`, `computeRoutes`, `clearRouteResults`, etc.) and every new `uiStore` action (`setShowTraversalOverlay`, `toggleRouteFinderDialog`, etc.) must be declared in the data model impact document before execution begins. |
| **AR-21 — CSS Changes Explicit in File Map** | The new CSS blocks in `global.css` (coverage-gap overlay, traversal overlay class, route overlay class, StatusStrip styles, RouteFinderDialog styles) must each appear as an explicit entry in the per-phase file maps — not bundled implicitly with the component that uses them. |
| **AR-22 — Disambiguation Context in Overlays** | `RouteFinderDialog` presents a searchable list of nodes for target selection. Every node result must display its chapter name and/or path name inline, identical to the CommandPalette pattern (`resolveNodeContext()`). A project with 50 nodes routinely has duplicate labels; omitting context makes the target selector ambiguous. |
| **AR-23 — Per-Slice Selectors** | `RouteFinderDialog` and `StatusStrip` must subscribe to `simulationStore` and `narrativeStore` via targeted per-slice selectors, not whole-store destructures. The six StatusStrip readouts each get their own primitive selector. The RouteFinderDialog node list gets `useNarrativeStore(s => s.common)`, `useNarrativeStore(s => s.choice)`, `useNarrativeStore(s => s.ending)` — three separate subscriptions, not one. |

---

### Relevant existing risks

| Risk | Relevance to Route_Tracing |
|------|---------------------------|
| **RISK-01 — Re-Render Storms** | Directly amplified. Traversal records append on every `advance()` call. If any node or edge component subscribes to the full `traversalRecords[]` array, a render storm fires on every step. All per-node and per-edge checks must use primitive selectors (e.g., `s.traversedEdgeIds.has(edgeId)` → boolean). StatusStrip readouts must use number selectors, not derived arrays. This is the highest-probability risk for this feature. |
| **RISK-04 — Graph Readability at Scale** | Amplified by the new visual layers. Traversal overlay, unreachable dimming, current-node emphasis, and shortest-route overlay all compete with existing cluster overlay, six-state node colors, `--seen` overlay, and verbose label mode. Visual precedence rules must be declared before implementation — see the user's "Visual layering conflicts" assumption. |
| **RISK-CMK-10 — Silent Store Action Signature Changes** | The pattern to avoid: every new store action added to `simulationStore` and `uiStore` must be declared in the data model impact document per AR-20. The `undoLastNode`, `computeRoutes`, `clearRouteResults`, and overlay toggle actions are all new contracts that future callers need documented. |
| **RISK-CMK-11 — Scope Expansion Bypasses File Map** | This feature touches significantly more files than the user's Definition of Done table lists (5 files listed vs. 15+ identified above). Without explicit per-phase file maps covering all touched files, future auditors will not find the full change surface. Phase file maps must be complete. |
| **RISK-CPT-01 — Whole-Store Destructure** | The same anti-pattern that affects `CommandPalette` will re-emerge in `RouteFinderDialog` and `StatusStrip` if not actively avoided. Both new components must use per-slice selectors from the start (AR-23). |
| **RISK-CPT-02 — Stale Closure in Toggle Effects** | `RouteFinderDialog` will have open/close toggle state. The same stale-closure risk that affects the CommandPalette's `isOpen` effect applies here. Use a ref or functional-set pattern for the toggle handler. |

---

### Suggested phase shape

Each phase below is independently stoppable — the feature is shippable at any phase boundary.

**Phase A — Traversal records + Undo**
Build the data layer only; no new visuals yet.
- Add `traversalRecords[]` to `simulationStore`; extend `advance()` to append a rich record on every step
- Add `undoLastNode()` action: pop last record, restore flag/status snapshot, update active node pointer
- Disable Undo when `traversalRecords.length === 0`; Undo while shortest-route overlay is active marks results stale
- Add Undo Active Node Button to `TopBar` (campaign mode only)
- Clear `traversalRecords` in `exitCampaign()`, `reset()`, and on campaign switch
- Testable: Undo correctly reverses a single step; flag/status values match pre-advance snapshot; first-node Undo is a no-op

**Phase B — Traversal overlay + Coverage metrics**
Visualise what Phase A recorded.
- Extend `ConditionalEdge` with traversal overlay CSS class (color distinct from the existing `--traversed` class)
- Current-node emphasis on the active node (augments existing `--active` class, does not replace it)
- Create `StatusStrip.jsx`; add bottom-bar slot to `App.jsx` / `App.css`; wire six coverage metric selectors in `simulationStore`
- Add overlay toggle to `uiStore`; add toggle button somewhere accessible in campaign mode
- Testable: StatusStrip shows accurate counts; toggling overlay shows/hides traversal coloring without data loss

**Phase C — Dead-end detection + Unreachable dimming**
Surface structural analysis on top of traversal data.
- Add `detectDeadEnds()` to `routeTracer.js`: nodes with no outgoing edges whose type is not `ending`
- Add `--coverage-gap` orthogonal CSS overlay to all three node renderers; driven by `unreachableFromActiveNodeIds` set in `simulationStore`
- Update AR-16 to document `--coverage-gap` as the second orthogonal indicator alongside `--seen`
- Wire dead-end and never-visited counts into StatusStrip (or as a separate on-demand readout)
- Testable: Dead-end counter excludes ending nodes; coverage-gap dimming applied only to nodes not in `seenNodeIds` across campaigns; reachable nodes retain full opacity

**Phase D — Shortest-route pathfinding + UI**
The most complex sub-feature; build last when all overlay infrastructure exists.
- Implement gate-respecting bounded BFS / Yen's k-shortest in `routeTracer.js`; all gate checks via `evaluateCondition`
- Add computed route results state to `simulationStore`; mark stale on narrative change or Undo
- Create `RouteFinderDialog.jsx`: target-node selector (with disambiguation per AR-22), priority list, path-cap input with hard ceiling, sorted result list with path selection, stale-result re-run prompt
- Add shortest-route overlay CSS class to `ConditionalEdge`; render only the user-selected path, not all paths simultaneously
- Add `showRouteFinderDialog` toggle to `uiStore`; wire open/close button in campaign-mode UI
- Testable: Correct gate-respecting paths returned for sample narrative; priority tie-breaking applies only on equal-length paths; stale overlay marked on narrative edit; hard path-cap prevents browser hang
