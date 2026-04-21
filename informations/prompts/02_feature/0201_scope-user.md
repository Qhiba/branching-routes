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
<!-- Cross-reference the user's feature description against
codebase_features.md. List every existing feature or component
that relates to, overlaps with, or will be affected by
this addition. -->

### Files to touch
<!-- Cross-reference against codebase_features.md.
List every file that must change to support this feature.
For each file state: MODIFY / CREATE -->

### Files to protect
<!-- List files that must not change under any circumstance —
especially stable core files the new feature will depend on.
For each file state: PROTECTED and why. -->

### Architecture rules relevant to this feature
<!-- List every rule from architecture_rules.md that this
feature must respect. For each rule, state why it is relevant. -->

### Relevant existing risks
<!-- Cross-reference against risk_register.md.
List any existing risks this feature touches or amplifies. -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0202 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Build the core logic without UI
- Phase 2: Wire UI to the logic
- Phase 3: Connect to existing data layer -->