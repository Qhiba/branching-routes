# 4. File Map

## Files modified

### `src/store/simulationStore.js`
- **Changes:** Rewrite internal state shape. Replace `isRunning` with `isCampaignActive`. Rename actions (`start` → `enterCampaign`, add `exitCampaign`, keep `advance`, keep `reset` with new "restart active campaign" semantics). Add `selectedOptionId`, `seenNodeIds`, `nodeStates` (derived or cached), `sandboxOverrides`. Add `selectOption(optionId)` and `applySandboxOverride(key, value)` actions. Add a selected-option filter in `computeReachable`. Add passive reachability computation exposed as selectors (runs when campaign inactive, reads `narrativeStore` default flag/status values).
- **Must NOT change:** The `evaluateCondition` import and its call contract (AR-07). The `useNarrativeStore.getState()` read pattern (LBA-01). The AR-08 invariant — no writes back to `narrativeStore`. The side-effect firing order rule (AR-11) — destination-node effects on advance.
- **Phases:** 1 (boundary rewire), 2 (six-state enum + seen), 3 (option routing), 4 (passive reachability + sandbox).

### `src/components/TopBar.jsx`
- **Changes:** Rename selectors/actions from `isRunning`/`start`/`reset` to `isCampaignActive`/`enterCampaign`/`exitCampaign`/`reset`. Swap `Start Simulation` / `Stop Simulation` buttons for `Enter Campaign Mode` / `Exit Campaign Mode` plus a `Reset Simulation` button. Update all `disabled={isRunning}` guards to `disabled={isCampaignActive}`. Update the banner indicator text from "Simulation Active" to "Campaign Active". Error handling in `handleStartSimulation` carries over to `handleEnterCampaign`.
- **Must NOT change:** Title edit behaviour, `handleNew` / `handleImport` / `handleExport` logic, Dagre tidy-layout logic, Snap-to-Grid toggle, project title input behaviour.
- **Phases:** 1.

### `src/components/GraphCanvas.jsx`
- **Changes:** Replace `isRunning` subscription with `isCampaignActive`. Replace `.simulation-mode` wrapper class with a `.campaign-mode` class. Rewrite `onNodeClick` advance logic: when active node is a choice, consult `selectedOptionId`; otherwise preserve current edge-find logic. Pass option click handler down to `ChoiceNode` or expose via `useSimulationStore` subscription. Add passive warning badge data source (read from store selector) in edit mode. Remove the current "click destination to advance" fallback for choice nodes once option clicks are wired (Phase 3); keep it for common/ending nodes.
- **Must NOT change:** `onConnect` `optionId` stamping logic — this is ACKNOWLEDGED RISK but stays functional byte-for-byte for edge creation. The `reactFlowEdges` `sourceHandle` mapping. `onNodeDragStart` / `onNodeDragStop` position persistence. `onPaneClick` double-click-to-add-node. The `'graph-layout-tidy'` event listener.
- **Phases:** 1 (class rename, boundary), 2 (six-state consumption via child nodes), 3 (option click handler + selected-option advance), 4 (passive warning badge wiring).

### `src/components/nodes/CommonNode.jsx`
- **Changes:** Replace the three-selector pattern (`isActive`/`isVisited`/`isReachable`) with a single `nodeState` selector that returns one of the six enum values (or `undefined` when not in campaign mode). Replace the `if/else if` CSS class chain with a single `story-node--{state}` class plus a separate `story-node--seen` overlay class. Add passive warning badge render when `orphanWarning` / `unreachableWarning` selectors return true (edit mode only). Obey AR-14: selectors return `undefined`/`null` when no state applies.
- **Must NOT change:** The `COMMON` type bar, effect count badge, body title/content, handles and their positions, `memo` wrapping.
- **Phases:** 2 (six-state + seen), 4 (passive warning badge).

### `src/components/nodes/ChoiceNode.jsx`
- **Changes:** Same six-state + seen refactor as `CommonNode`. Add click handlers on each option sub-div — only active during campaign mode when this node is `isActive`. Add `selectedOption` comparison for highlight class on the selected option and `dimmed` class on unselected options. Add a `selectedOptionId` subscription. Obey AR-14.
- **Must NOT change:** Per-option source handles (including handle `id === option.id`) and their positioning. `choiceDisplayMode` density logic. The fallback single source handle when no options exist. The outgoing-edge-count badge. Effect count badge. `memo` wrapping.
- **Phases:** 2 (six-state + seen), 3 (option click + selected highlight + dim unselected), 4 (passive warning badge).

### `src/components/nodes/EndingNode.jsx`
- **Changes:** Six-state + seen refactor matching `CommonNode`. Ending nodes will land in `active` or `complete` states; other states (locked / branch_locked / failed) will not apply.
- **Must NOT change:** Ending-specific footer bar, terminal icon, path art. The absence of an outgoing handle (AR-12). `memo` wrapping.
- **Phases:** 2 (six-state + seen), 4 (passive warning badge — ending nodes can be unreachable).

### `src/components/edges/ConditionalEdge.jsx`
- **Changes:** Replace `isTraversed` / `isReachable` selectors with an `edgeState` selector returning one of: `traversed` / `reachable` / `condition_pass` / `condition_fail` / `unselected_option_dim` / `undefined`. Map to CSS classes. Campaign-mode only for the new states; edit mode renders plain.
- **Must NOT change:** `getSmoothStepPath` usage, `BaseEdge` / `EdgeLabelRenderer` structure, condition badge and label rendering, `memo` wrapping.
- **Phases:** 2 (traversed/reachable rebinding to campaign mode), 3 (option dim + condition pass/fail when selected option is set).

### `src/styles/global.css`
- **Changes:** Add six new state classes: `.story-node--active`, `.story-node--locked`, `.story-node--complete`, `.story-node--failed`, `.story-node--branch-locked`, plus `.story-node--seen` overlay. Add `.story-node__warning-badge` for passive warnings. Add `.choice-node__option--selected` / `--dimmed` classes. Add `.conditional-edge--condition-pass` / `--condition-fail` / `--unselected-option-dim`. Rename `.simulation-mode .react-flow__*` overrides to `.campaign-mode .react-flow__*`. Retire the obsolete `.story-node--visited` / `--reachable` rules once all phases complete (Phase 2 replaces `--reachable`; the `--visited` rule is replaced by `--seen`).
- **Must NOT change:** Base `.story-node` box model, type-bar styles, meta badges, hover styles, selected-outline, handle styling defaults, edge base strokes, topbar layout.
- **Phases:** 1 (class rename only: `.simulation-mode` → `.campaign-mode`), 2 (six-state + seen + edge states), 3 (option selected/dimmed + edge condition-pass/fail + unselected-option-dim), 4 (warning badge styles).

## Files monitored (no change planned, but might be touched defensively)

### `src/store/narrativeStore.js`
- Read-only from `simulationStore`. No store actions added or modified. If Phase 4 finds the passive-reachability computation needs a memo hook inside `narrativeStore`, that would be a scope change — flag and stop.

### `src/store/uiStore.js`
- Campaign-active state does NOT go here (AR-08). `choiceDisplayMode` stays as-is.

### `src/components/NodeInspector.jsx`, `src/components/EdgeInspector.jsx`, `src/components/OptionEditor.jsx`, `src/components/VariantEditor.jsx`
- Will likely receive a single-line `disabled={isCampaignActive}` treatment in Phase 1 or Phase 4 to prevent authoring mid-campaign. This is a minor touchup, not a rewrite. If the fix requires more than adding a disabled prop / wrapping div, flag and stop.

### `src/styles/tokens.css`
- May need new tokens for the six states (locked/complete/failed/branch_locked colours) and warning badge colour. Add in Phase 2 alongside CSS class additions. Tokens already exist for `--color-active`, `--color-visited`, `--color-reachable`; reuse where the mapping is obvious.

### `src/utils/conditionEvaluator.js`
- PROTECTED. No change.

## Files NOT touched

- `src/App.jsx`, `src/App.css`, `src/main.jsx`, `index.html`, `vite.config.js`
- `src/store/index.js`, `src/utils/index.js`, `src/components/index.js` (barrels)
- `src/utils/fileSystem.js`, `src/utils/uuid.js`
- `src/components/Sidebar.jsx` (unless sandbox surface lands as a new tab — see Phase 4 open question)
- `src/components/FlagManager.jsx`, `src/components/StatusManager.jsx`, `src/components/PathChapterManager.jsx`

## New files created

**None in the primary plan.** If the sandbox surface in Phase 4 warrants its own component (`SandboxPanel.jsx`), that is a scope-aligned addition; decision deferred to Phase 4 acceptance criteria.

## Files deleted or merged

**None.** All existing components remain.
