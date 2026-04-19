# 6. Risk Register

Top five risks specific to changing existing behaviour in this iteration.

---

## R-01 — `computeReachable` semantic shift leaks into non-choice paths
- **Description:** Phase 3 rewrites `computeReachable` to apply the selected-option filter. If the filter is applied unconditionally — instead of only when the active node is a choice — common nodes and ending nodes silently become unreachable because they have no `selectedOptionId`.
- **Early detection signal:** Advancing from a common node in campaign mode fails — no edges light up. Manual test: author a `start(common) → common → ending` chain, enter campaign, click nothing, observe outgoing reachable edges from the start node.
- **Mitigation:** In Phase 3, gate the selected-option filter on `activeNode.type === 'choice'` (or equivalently, `activeNode` being present in `narrativeStore.choice`). Write the check as an explicit early return. Validate with a common-only chain before touching choice flows.

## R-02 — Legacy edges with null `optionId` on choice nodes silently break campaign
- **Description:** Pre-options-feature save files may contain edges sourced from a choice node with `optionId: null`. Under the new routing filter these edges never match any `selectedOptionId` and so the choice node becomes a dead-end. Current code would have routed through them by target-find.
- **Early detection signal:** Importing an old save, entering campaign, advancing to a choice node, finding no options clickable OR finding options clickable but no edges reachable after click.
- **Mitigation:** Phase 4 passive reachability warnings surface this — an author sees a warning badge on the choice node indicating unreachable outgoing edges. Also: Phase 3 adds a dev-console warning when `computeReachable` filters out all edges on a choice node while options exist, to surface this during authoring. Do not auto-migrate `optionId: null` edges — that belongs in a future migration push if the pattern is common.

## R-03 — Sandbox overrides leak into `narrativeStore` (AR-08 violation)
- **Description:** Phase 4 sandbox UI writes override values. If `applySandboxOverride` accidentally calls `updateFlag` / `updateStatus` on `narrativeStore` instead of mutating `simulationStore.currentFlagValues`, the author's authored defaults are overwritten, corrupting the graph silently.
- **Early detection signal:** After a campaign run with sandbox edits, exporting the save emits non-authored flag/status default values. Or: exiting campaign and re-entering shows the sandbox values persisted as "defaults" — they should revert.
- **Mitigation:** Implement `applySandboxOverride` as a single-line `set()` on `simulationStore` state, with a test in Phase 4 acceptance: export the graph before campaign, run campaign with sandbox edits, exit campaign, export again, diff the two exports — must be identical. Also: code review the sandbox path specifically for any `useNarrativeStore.getState().updateFlag` / `.updateStatus` calls, which are forbidden in this feature.

## R-04 — AR-14 selector infinite-loop on new store fields
- **Description:** New selectors in phases 2–4 (`nodeStates[id]`, `seenNodeIds.includes(id)`, `orphanedNodeIds.includes(id)`) may accidentally return `[]` or `{}` when state is empty, triggering Zustand's infinite re-render loop that crashes the UI. Mentioned explicitly in AR-14.
- **Early detection signal:** Dev console shows "Maximum update depth exceeded" on app load or on entering campaign mode. UI freezes. Happens immediately on affected render path.
- **Mitigation:** Every new selector must return a stable existing reference (`state.seenNodeIds`) or a primitive (`state.nodeStates[id]`). Components default outside the hook (e.g., `const seen = useSimulationStore(s => s.seenNodeIds) ?? EMPTY_ARRAY` where `EMPTY_ARRAY` is a module-level const). Per-phase review gate: after Phase 2 and Phase 4, load the app cold and enter/exit campaign mode three times — any loop surfaces immediately.

## R-05 — `campaign-mode` CSS class swap breaks authoring controls during Phase 1
- **Description:** Phase 1 renames `.simulation-mode` → `.campaign-mode` in `global.css` and in the `GraphCanvas` wrapper. If any rule in `global.css` (e.g., `.simulation-mode .react-flow__handle { pointer-events: none }` at line 332, or `header.simulation-mode .file-actions` at line 336) is not updated in lock-step, the canvas either (a) accepts drag-connects during campaign mode, (b) rejects them during edit mode. Both are regressions.
- **Early detection signal:** After Phase 1, entering campaign mode leaves handles visible and draggable (no pointer-events lockout) OR exiting campaign mode leaves handles invisible and non-interactive.
- **Mitigation:** Phase 1 acceptance criteria include a grep for `simulation-mode` across the repo after the rename — must return zero matches. Also: manual test entering and exiting campaign mode and attempting a drag-connect in each — must be blocked in campaign, allowed in edit. Keep the class swap mechanical (search-and-replace) rather than rewriting rules in place.
