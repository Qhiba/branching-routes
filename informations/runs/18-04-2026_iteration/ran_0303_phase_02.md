# Phase 2 — Six-state node enum + seen tracking + campaign-gated visuals

- **Goal** — Replace the ad-hoc three-state visual model with the canonical six-state enum plus a separate seen overlay, and gate all simulation visuals behind `isCampaignActive`.

- **What it changes** — `simulationStore` gains a derived `nodeStates` shape returning one of `active` / `locked` / `complete` / `failed` / `branch_locked` per known-touched node, or `undefined` for untouched. A `seenNodeIds` set replaces / complements `visitedNodeIds`. Node components subscribe via a single `nodeState` selector rather than three booleans. CSS classes rename accordingly. Outside campaign mode nodes and edges render with no simulation visuals.

  State semantics:
  - `active` — `id === activeNodeId`
  - `locked` — node is a reachable target from the active node but no currently-evaluated edge into it passes (all its inbound edges from active fail condition evaluation). Visible reachability signal with negative affordance.
  - `complete` — this is an ending node that has been reached during play (terminal success)
  - `failed` — this is an ending node that was reached through a failure branch, OR any node where the player has advanced into it and it has no outgoing edges nor is it an ending. Authoring-time this also applies when a node has outgoing edges but none can ever satisfy (pure-fail dead-end). Phase 2 scope: implement the first two meanings (ending reached + no outgoing edges). The authoring-time dead-end semantics defer to Phase 4's passive analysis.
  - `branch_locked` — reachable only through edges sourced from a choice option whose `requires` condition currently fails. Relevant once Phase 3 lands selected-option routing; Phase 2 stubs the state with `undefined` and Phase 3 fills it in.

  Seen tracking: any node the player has been `active` on gets added to `seenNodeIds`. Rendered as a separate overlay glyph (e.g., a dot/check in the corner of the node card), orthogonal to the six-state enum.

- **Produces** — Files modified:
  - `src/store/simulationStore.js` — add `seenNodeIds: Set<string>` (stored as array for Zustand reference stability; gets a new reference on update). Add a derived `nodeStates` map computed during `enterCampaign` and `advance`. Update `advance` to push the previous active node into `seenNodeIds`. Add `getNodeState(id)` selector (a simple read, not a computation — all computation happens inside the actions).
  - `src/components/nodes/CommonNode.jsx` — replace three selectors with `const nodeState = useSimulationStore(s => s.nodeStates[id])` and `const isSeen = useSimulationStore(s => s.seenNodeIds.includes(id))`. Replace the `if/else if` class chain with `className = \`story-node common-node ${nodeState ? 'story-node--' + nodeState : ''} ${isSeen ? 'story-node--seen' : ''}\``. Gate both on `isCampaignActive` — but rather than a runtime gate, rely on the store: when `isCampaignActive === false`, `nodeStates` is `{}` and `seenNodeIds` is `[]`, so selectors naturally return falsy. Confirm AR-14: `.includes()` returns a primitive, `nodeStates[id]` returns a primitive or `undefined`.
  - `src/components/nodes/ChoiceNode.jsx` — same refactor.
  - `src/components/nodes/EndingNode.jsx` — same refactor.
  - `src/components/edges/ConditionalEdge.jsx` — rebind `isTraversed` to only read during campaign (already guarded by empty `traversedEdgeIds` in edit mode). Rename `isReachable` class application to `--condition-pass` for clarity — the same edge data, new vocabulary aligned with Phase 3 needs.
  - `src/styles/global.css` — add the six new state classes. Add `.story-node--seen` overlay rule. Retire `.story-node--visited` and `.story-node--reachable` rules (the classes themselves are no longer applied). Add `.conditional-edge--condition-pass` (replaces `--reachable`). Retain `--traversed`.
  - `src/styles/tokens.css` — add `--color-node-locked`, `--color-node-complete`, `--color-node-failed`, `--color-node-branch-locked`, `--color-node-seen` tokens. `--color-active` keeps its meaning.

- **Migration step** — NONE.

- **What it leaves temporarily inconsistent** — `branch_locked` state always resolves to `undefined` until Phase 3 adds selected-option routing. Authoring-time dead-end detection for `failed` state is incomplete until Phase 4's passive analysis. Both are acceptable — the visual states simply don't appear in those circumstances; no broken UI.

- **What the next phase depends on from this phase** — `nodeStates` map and `seenNodeIds` set existing in `simulationStore`. `selectedOptionId` field does not exist yet — Phase 3 adds it. Phase 3 augments `nodeStates` computation to consider `selectedOptionId` when computing `branch_locked`.

- **Reference files needed** — listed in `ran_0303_phases.md`. Plus `ran_0303_phase_01.md` for the boundary rename that Phase 2 builds on.

- **Rollback cost if this phase fails** — **MEDIUM.** The visual refactor touches six files and CSS. Reverting restores the three-state model but requires undoing CSS class application in four node/edge components. The store state shape change (adding `nodeStates`, `seenNodeIds`) is additive and does not break Phase 1 — Phase 1 can ship alone. If Phase 2 must be reverted, Phase 1 stays intact.

- **Hard stop triggers for this phase**
  - Entering campaign mode triggers an infinite render loop ("Maximum update depth exceeded"). Stop, audit new selectors for reference-instability per AR-14.
  - Nodes render with *multiple* simulation state classes simultaneously (e.g., both `--active` and `--locked`). Stop, audit the state-assignment order in `simulationStore` — must be exclusive.
  - Exiting campaign mode leaves `seenNodeIds` populated visually. Stop, ensure `exitCampaign` clears `seenNodeIds`.
  - Importing an existing save and entering campaign renders a state not in the enum (blank outline or wrong colour). Stop, audit `nodeStates` computation for unhandled branches.

- **Acceptance Criteria — Done when:**
  - `simulationStore` exposes `nodeStates` (object keyed by node id, values in the six-state enum or `undefined`) and `seenNodeIds` (array of node ids).
  - All three node components apply exactly one state class (or none) per node.
  - All three node components apply the seen overlay class independently.
  - Entering a campaign visually shows the start node as `active`; reachable nodes show the appropriate state (`locked` if its inbound edge from active fails, otherwise no state yet since they aren't active or seen).
  - Advancing to a node adds the previous node to `seenNodeIds` — the seen glyph appears on the node just left behind.
  - Exiting campaign returns all nodes to plain type-coloured rendering (green / blue / orange from Push 3) with no simulation visuals.
  - AR-14 verification: cold-load the app, open the node inspector, enter and exit campaign three times without a re-render crash.

- **Verification** — Open the app. In edit mode, create a small chain: common start → common → ending. Enter campaign mode. The start node should show an `active` state (same colour as today's active). Click into the reachable path to advance. The node you just left should now carry a seen glyph. The newly-active node is now `active`. Reach the ending — it should render `complete`. Exit campaign — all state classes and seen glyphs disappear, leaving only type colours. Re-enter — the state computes fresh from the start node. Create a node with no outgoing edges (dead-end common), advance into it — it should render `failed`. Create an unreachable island of nodes, advance near it but never into it — those nodes should remain plain (not falsely show `locked` or `failed`).
