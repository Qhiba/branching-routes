# Scope: Simulation Engine & Canvas — Campaign Mode Rewire

## Part 1 — User filled

### What I am changing
Simulation Engine, Canvas

### Why this needs to change
The current start/stop simulation lifecycle has no separation between editing and simulation — simulation visuals bleed into the editing canvas, and there is no concept of a saved simulation state to return to. As campaign sheets are introduced in Push 9, the simulation engine needs a host to run inside; an always-on model has no clean activation boundary to attach a campaign to.

### New behavior after this push
**Contains:** Replace start/stop lifecycle with campaign-mode activation. Simulation engine only runs when a campaign is active — editing canvas stays clean. Six-state node enum. Seen tracking. Sandbox flag/status toggling. Choice option interaction during simulation. Passive structural warnings during editing.

**Two canvas modes:**
- **Editing (no campaign active)** — Nodes show type colors only (green/blue/orange from Push 3). No simulation visuals. Passive reachability warnings as subtle badges on orphaned or unreachable nodes. Options visible but not clickable.
- **Campaign (campaign active)** — Full simulation visuals. Node states render (active/locked/complete/failed/branch_locked). Seen indicators appear. Options become clickable. Edges show condition pass/fail. Sandbox toggles available.

**Simulation interaction with choice options (campaign mode only):**
- Options in active choice nodes become clickable during simulation
- Clicking an option fires its `flags_set`/`status_set` side effects
- Selected option gets a highlighted state (accent border or filled background)
- Edges evaluate conditions outward from the selected option — only edges matching the selected option's `sourceHandle` are considered for advance
- Unselected options dim but remain visible

### Accepted blast radius
- **Live State Decoration:** The current `--active`/`--visited`/`--reachable` visual vocabulary is intentionally being replaced by the six-state enum plus seen tracking. CSS classes and rendering hooks will change shape.
- **Pure Condition Routing:** The current "evaluate all outgoing edges from the active node" model is being replaced with "evaluate edges outward from the selected option only" for choice nodes. Routing semantics change even though `conditionEvaluator.js` stays pure.
- **Simulation/Editor Isolation:** The `isRunning` boolean guard model is being replaced with an explicit campaign-mode activation boundary. Any code path keyed on `isRunning` will need to consult the new activation predicate instead.
- **Option ID stamping:** The stamping mechanism itself stays, but its downstream consumption changes — `optionId` becomes load-bearing for selected-option routing in campaign mode. Any fragility in how `sourceHandle` is matched to `optionId` now manifests as broken routing, not just mis-anchored visuals.

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/simulationStore.js` | Rewrite: campaign-mode activation, recalculation when active, rich node states, seen tracking, sandbox toggles, selected option tracking, passive reachability analysis |
| MODIFY | `src/components/TopBar.jsx` | Remove Start/Stop buttons, add Enter/Exit Campaign Mode toggle, Reset Simulation |
| MODIFY | `src/components/GraphCanvas.jsx` | Conditional simulation visuals based on campaign active state, passive warning badges in edit mode |
| MODIFY | `src/components/nodes/CommonNode.jsx` | Six-state visual rendering + seen indicator (campaign mode), passive warning badge (edit mode) |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` | Six-state visual rendering + seen indicator + option click handler + selected option highlight (campaign mode) |
| MODIFY | `src/components/nodes/EndingNode.jsx` | Six-state visual rendering + seen indicator (campaign mode) |
| MODIFY | `src/components/edges/ConditionalEdge.jsx` | Condition evaluation visuals in campaign mode, dim edges from unselected options |
| MODIFY | `src/styles/global.css` | Simulation state CSS classes, option selected/dimmed states, passive warning badge styles |

### Assumptions I am making
None

---

## Part 2 — AI filled

### What must stay exactly the same

From Section 7 of `ran_0301_understand.md`, cross-referenced against the accepted blast radius:

| Item | Label | Notes |
|---|---|---|
| **Live State Decoration** | ACKNOWLEDGED RISK | User explicitly accepted this will change. The raw narrative → simulation state overlay mechanism will be rebuilt around a six-state enum + seen tracking. Current `--active`/`--visited`/`--reachable` CSS classes will be superseded. |
| **Pure Condition Routing** | ACKNOWLEDGED RISK | User explicitly accepted this will change. Routing semantics shift from "all outgoing edges evaluated from active node" to "only edges matching selected option's `sourceHandle` evaluated". `conditionEvaluator.js` itself stays pure (AR-07). |
| **Option ID stamping** | ACKNOWLEDGED RISK | User explicitly accepted this risk. The stamping mechanism in `GraphCanvas.jsx > onConnect` and `reactFlowEdges` memoization stays in place, but `optionId` is being promoted from a purely visual anchor into a *routing key* consumed by the selected-option edge filter. Any latent bugs in handle → `optionId` mapping (e.g., the `"opt-"` prefix assumption at `GraphCanvas.jsx:139`) now cause broken campaign playthroughs, not just misaligned edge rendering. AR-15 edge uniqueness tuple still expected to hold. |
| **Simulation/Editor Isolation** | ACKNOWLEDGED RISK | User explicitly accepted this will change. The `isRunning` guard model is being replaced with campaign-mode activation, but the *spirit* of AR-08 (simulation never mutates narrative data) must hold. The boundary is being refactored, not removed. |

**Additional invariants (derived from architecture rules, always protected):**
- **AR-03 / AR-04 / AR-05:** All new state (campaign active, node states, seen set, selected option, sandbox overrides) must live in `simulationStore`, never in component `useState` or `narrativeStore`.
- **AR-07:** Condition evaluation stays in `conditionEvaluator.js` only. The selected-option routing is a *filter* on which edges get evaluated, not a new evaluator.
- **AR-08:** Sandbox flag/status toggling must override simulation's ephemeral state only — never write back to `narrativeStore.flag` or `narrativeStore.status` defaults.
- **AR-14:** New selectors on `simulationStore` (node state lookup, seen lookup, selected option lookup) must return `undefined`/`null` on miss — never `{}` or `[]`.

### Affected file list

| File | Label | Reason |
|---|---|---|
| `src/store/simulationStore.js` | CHANGES | Full rewrite per DoD. |
| `src/components/TopBar.jsx` | CHANGES | Start/Stop → Enter/Exit Campaign + Reset. |
| `src/components/GraphCanvas.jsx` | CHANGES | Campaign-active gating of simulation visuals; edit-mode passive warnings; click-advance logic moves from edge-first picking to selected-option-first picking. |
| `src/components/nodes/CommonNode.jsx` | CHANGES | Six-state rendering + seen indicator + edit-mode warning badge. |
| `src/components/nodes/ChoiceNode.jsx` | CHANGES | Six-state + seen + option click + selected highlight + dim unselected. |
| `src/components/nodes/EndingNode.jsx` | CHANGES | Six-state + seen indicator. |
| `src/components/edges/ConditionalEdge.jsx` | CHANGES | Pass/fail visual in campaign mode; dim edges from unselected options. |
| `src/styles/global.css` | CHANGES | New state classes; option selected/dimmed; warning badge styles. |
| `src/store/narrativeStore.js` | MONITOR | Read-only source for `simulationStore` via `getState()`. No mutations. Watch for new selector patterns. |
| `src/store/uiStore.js` | MONITOR | Campaign-active state does NOT belong here (AR-08) — stays in `simulationStore`. Confirm no leakage. |
| `src/utils/conditionEvaluator.js` | PROTECTED | AR-07. Pure functions untouched — the caller changes, not the callee. |
| `src/components/NodeInspector.jsx` | MONITOR | May need a read-only gate during campaign mode (structural authoring should arguably be disabled). Confirm in 0303. |
| `src/components/EdgeInspector.jsx` | MONITOR | Same consideration as NodeInspector. |
| `src/components/OptionEditor.jsx` | MONITOR | Options being clickable in campaign mode creates risk if the user is mid-edit when entering campaign mode. Confirm in 0303. |
| `src/components/VariantEditor.jsx` | MONITOR | Same consideration. |
| `src/styles/tokens.css` | MONITOR | May need new tokens for the six states (locked/complete/failed/branch_locked) and warning badge. Confirm in 0303. |
| `src/App.jsx` / `src/App.css` | PROTECTED | Layout shell unaffected. |
| `src/utils/fileSystem.js` | PROTECTED | No schema change; campaign state is ephemeral. |
| `src/store/index.js`, `src/components/index.js`, `src/utils/index.js` | PROTECTED | Barrel exports unchanged. |

### Migration flags

Cross-referenced against the Persistence Inventory in `ran_0301_understand.md`:

| Decision | Touches | Label | Detail |
|---|---|---|---|
| Campaign-mode activation replaces `isRunning` | `simulationStore` internal state (ephemeral, AR-08) | SAFE | No persisted data references `isRunning`. Save files never contain simulation state. |
| Six-state node enum (active/locked/complete/failed/branch_locked) | Derived simulation state only | SAFE | States are computed from topology + current flag/status values — no new persisted fields on `common`/`choice`/`ending` nodes. |
| Seen tracking | New ephemeral set on `simulationStore` | SAFE | Replaces/extends `visitedNodeIds`; not persisted. |
| Sandbox flag/status toggling | `simulationStore.currentFlagValues` + new sandbox override layer | PROCEED WITH CAUTION | Must not write back to `narrativeStore.flag[id].defaultValue` or `narrativeStore.status[id].value`. AR-08 violation risk if misimplemented. Add an explicit test that sandbox edits survive only until `reset()` or `exit campaign`. |
| Selected option tracking | New ephemeral field on `simulationStore` | SAFE | Not persisted. Reads `edge.optionId` (existing persisted field) but adds no new persisted data. |
| `optionId` (from Persistence Inventory — MIGRATION REQUIRED) | Read by new selected-option routing | PROCEED WITH CAUTION | Format stays `"opt-{uuid}"`. The routing change makes this field *more* load-bearing. Any stale/missing `optionId` on existing files becomes a correctness issue at campaign time. Confirm `fileSystem.js` migration chains still initialise it on legacy imports. |
| `position` (from Persistence Inventory — MIGRATION REQUIRED) | Canvas rendering | SAFE | Untouched by this push. |
| Passive reachability analysis in edit mode | New derived state on `simulationStore` (or a dedicated slice) | SAFE | Purely computed from `narrativeStore` topology; no new persisted fields. Note: traditionally this kind of structural analysis belongs to a "lint"-style concept, but placing it on `simulationStore` is consistent with using the same edge/condition machinery. Confirm placement in 0303. |

**Net result:** No `schemaVersion` bump required. Existing save files load without migration. The only upgrade path risk is pre-options edges with null `optionId` attached to choice nodes that now have options — those nodes will have no routable path when an option is selected. Detectable via the new passive reachability warnings.

### Suggested phase shape

Each phase is independently stoppable and testable. Earlier phases do not depend on later phases to compile or run.

- **Phase 1 — Campaign-mode boundary (no visual change yet)**
  Rewire `simulationStore` to expose `isCampaignActive`, `enterCampaign()`, `exitCampaign()`, `resetCampaign()` alongside (temporarily) the existing `isRunning`/`start`/`stop`. Update `TopBar` to the new buttons. `GraphCanvas` and nodes still read the old signals. Ship-stoppable: the editor works, campaign toggle flips a flag. Test: toggling campaign mode doesn't affect narrative data (AR-08 holds).

- **Phase 2 — Six-state enum + seen tracking in campaign mode**
  Replace internal simulation state derivation with the six-state enum. Add seen set. Nodes subscribe to the new state selectors and render the new visuals (behind `isCampaignActive`). Remove the old `--active`/`--visited`/`--reachable` code paths. CSS classes swap. Ship-stoppable: campaign mode is visually correct for non-choice paths. Test: entering campaign mode on existing saves produces expected state transitions.

- **Phase 3 — Choice option interaction + selected-option routing**
  Add `selectedOptionId` to `simulationStore`. `ChoiceNode` registers option click handlers that fire `flags_set`/`status_set` and set selected option. Rewrite the "reachable edges from active node" computation to filter by `sourceHandle === selectedOptionId` when the active node is a choice. Unselected options dim; `ConditionalEdge` dims accordingly. Ship-stoppable: full campaign-mode playthrough works end-to-end. Test: multi-option routing to same target (AR-15 case) advances along the option the user actually picked.

- **Phase 4 — Passive reachability warnings (edit mode) + sandbox toggles + polish**
  Add edit-mode structural analysis to `simulationStore` (or a dedicated slice) producing orphan/unreachable sets. Wire warning badges onto nodes. Add sandbox flag/status override UI (scope of UI surface TBD in 0303 — may be a TopBar drawer or a Sidebar tab). Finalise `global.css` and any new `tokens.css` entries. Ship-stoppable: full scope delivered. Test: sandbox overrides reset on `exitCampaign()`; warning badges disappear when author fixes topology.
