# 1. Behavior Delta — Simulation Engine & Canvas

## Before (current behavior)

- **Lifecycle model.** Simulation is a binary `isRunning` flag in `simulationStore`. `start()` validates a start node, seeds `currentFlagValues`, computes reachable edges from the start node. `reset()` clears all simulation state. `TopBar` exposes `Start Simulation` / `Stop Simulation` buttons.
- **Canvas mode.** A single canvas view. When `isRunning`, the canvas applies a `simulation-mode` wrapper class that disables handles/edges/connection preview via CSS, and nodes/edges apply `--active` / `--visited` / `--reachable` classes. When not running, the same classes are absent.
- **Node visual state.** Three-state model: `active` (the currently focused node), `visited` (previously advanced through), `reachable` (current node's outgoing edge evaluates true). Only one class applies per node via an `if/else if` chain. No "seen" concept distinct from visited. No locked/complete/failed/branch-locked concepts.
- **Edge visual state.** Two-state model: `--traversed` (has been advanced along) or `--reachable` (currently satisfies its condition from active node). No condition pass/fail distinction during editing; edges are inert visually outside simulation.
- **Routing model.** `computeReachable(activeNodeId, edges, flagValues)` filters all edges where `sourceId === activeNodeId` and `evaluateCondition(edge.condition, flagValues)` is true. All outgoing edges are considered equally regardless of option origin. Advance is triggered via `onNodeClick` on the destination node, which resolves the advancing edge by `storeEdges.find(e => e.sourceId === activeStateId && e.targetId === clickedId)`.
- **Choice option interaction.** Options render as labelled sub-divs inside `ChoiceNode` body, each with its own source `Handle`. Clicking an option does nothing during simulation. Options never fire their `flags_set` / `status_set` side effects through player action — only via authoring-time mutations.
- **Flag/status mutation during simulation.** Only fires when the player advances an edge: the destination node's `data.flags_set` and `data.status_set` apply via `applyFlagsSet` / `applyStatusSet`. Options' side effects are authored but never executed during play.
- **Structural warnings.** None. Orphaned or unreachable nodes render identically to reachable ones in edit mode.
- **Editor guard.** `isRunning` gates most `TopBar` controls (`disabled={isRunning}`) and suppresses normal canvas interactions via `simulation-mode` CSS.

## After (target behavior)

- **Lifecycle model.** Replaces `isRunning` with `isCampaignActive`. `enterCampaign()` replaces `start()`; `exitCampaign()` replaces `stop()`; `reset()` stays but is reinterpreted as "restart the active campaign from its start node" (distinct from `exitCampaign`). `TopBar` exposes `Enter Campaign Mode` / `Exit Campaign Mode` and `Reset Simulation`.
- **Canvas mode.** Two modes keyed on `isCampaignActive`:
  - **Editing (inactive):** Nodes show type colours only. No simulation classes. Options visible but not clickable. Passive structural warning badges appear on orphaned/unreachable nodes.
  - **Campaign (active):** Full simulation visuals. Six-state node rendering. Seen indicators. Options become clickable. Edges show condition pass/fail. Sandbox flag/status toggles available.
- **Node visual state (campaign only).** Six-state enum, one state per node: `active`, `locked` (reachable-but-blocked-by-condition), `complete` (terminal reached successfully), `failed` (dead-end: no outgoing edges satisfy their conditions), `branch_locked` (reachable only through options currently blocked), plus the ambient base state for nodes not yet touched. Seen tracking renders as a separate indicator overlay (icon/glyph) orthogonal to the six-state enum.
- **Edge visual state (campaign only).** Conditions evaluate continuously: pass / fail / traversed / outward-from-unselected-option-dimmed. Outside campaign mode edges stay inert.
- **Routing model.** Selected-option filter: when the active node is a choice, `computeReachable` considers only edges whose `sourceHandle` / `optionId` matches the player's selected option. Non-choice active nodes continue to consider all outgoing edges. Advance-by-clicking-destination becomes advance-by-clicking-option (for choice nodes), then edges from that option are evaluated.
- **Choice option interaction (campaign only).** Clicking an option on the active choice node: (a) fires its `flags_set` / `status_set` side effects, (b) sets `selectedOptionId` in `simulationStore`, (c) recomputes reachable edges filtered to that option, (d) highlights the selected option, (e) dims unselected options and their outgoing edges. Advancing along a reachable edge then moves to the next node and clears `selectedOptionId`.
- **Flag/status mutation during simulation.** Fires in two places: option click (from `data.options[].flags_set` / `status_set`) and edge advance (from destination node's `data.flags_set` / `status_set`). Order: option effects first, then advance effects on entry to the target.
- **Structural warnings (edit mode only).** `simulationStore` (or a dedicated slice of it) exposes a derived `orphanedNodeIds` / `unreachableNodeIds` set computed from topology against default flag/status values. Nodes render a subtle warning badge when present in this set. Disappears the moment the structural issue is fixed.
- **Editor guard.** `isCampaignActive` gates authoring controls. `TopBar` `disabled={isCampaignActive}` mirrors the current `disabled={isRunning}` guard. Canvas inhibits pane-add / drag-connect / node-drag commits the same way.
- **Sandbox (campaign only).** A UI surface (location TBD in Phase 4 — likely a Sidebar panel or TopBar drawer, not a new tab) lets the player toggle individual flag values and set status amounts during a campaign. Writes only to `simulationStore.currentFlagValues`, never to `narrativeStore.flag[id].state` or `narrativeStore.status[id].value`. Sandbox edits survive until `reset()` or `exitCampaign()`.

## Identical in both

- **Canonical graph ownership.** `narrativeStore` remains the single source of truth for `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`, `meta` (AR-05).
- **Condition evaluator.** `utils/conditionEvaluator.js` and the shape of its `evaluateCondition(condition, flagState) => boolean` contract (AR-07).
- **Side-effect placement.** Side effects remain on nodes and on option definitions. Edges still carry no `sideEffects` (AR-11). The only new call site is firing option side effects on option click — the *location* of authored data doesn't move.
- **Simulation isolation.** No write-back from simulation state to narrative data (AR-08). Sandbox edits are ephemeral.
- **Persistence.** No schema bump. `schemaVersion` stays at `4`. No new persisted fields on nodes, edges, flags, status, paths, chapters, or meta. `position` and `optionId` formats unchanged.
- **Node / edge ID formats.** UUID-prefixed strings (`n-{uuid}`, `e-{uuid}`, `opt-{uuid}`). `optionId` stamping on `GraphCanvas.onConnect` unchanged.
- **React Flow integration.** Custom node/edge types, handle-based connections, per-option source handles on `ChoiceNode`, `sourceHandle` anchoring on edges all unchanged.
- **Start node semantics.** Exactly one node with `data.isStartNode: true` required to enter campaign mode. Error path preserved.
- **File I/O.** `fileSystem.js` unchanged. Existing saves load without migration.
- **AR-08 spirit.** Enter/exit semantics map 1:1 onto start/stop semantics — the boundary moves, the isolation invariant holds.

---

## Flags

- **BLOCKER:** None.
- **RULE CONFLICT:** None. AR-08's rationale ("simulation never mutates narrative data" + "starting/stopping resets simulationStore") holds unchanged under the `enterCampaign`/`exitCampaign` renaming — the wording of AR-08 references "start/stop" at the UI level but the rule's mechanism (reset on boundary transition) is preserved. No rule text needs to change for this iteration to land.
- **RULE CANDIDATE (for 0309):** Placement of passive structural analysis (orphan / unreachable node detection) inside `simulationStore`. Reuses the condition machinery but runs without campaign activation. Whether this belongs in `simulationStore`, a dedicated `analysisStore`, or a slice convention is worth formalising after the pattern settles. Do not add to `architecture_rules.md` in this iteration.
- **RULE CANDIDATE (for 0309):** The six-state node enum as the canonical simulation-visual vocabulary. Currently an ad-hoc trio (`active`/`visited`/`reachable`). After this push the enum becomes load-bearing for multiple consumers. Worth documenting as the fixed vocabulary so future visual states don't proliferate ad-hoc.
