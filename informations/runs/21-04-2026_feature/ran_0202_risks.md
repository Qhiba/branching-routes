# Risk Register — Route_Tracing

---

## RISK-RT-01 — AR-14 Re-Render Storm from `traversalRecords` Array Subscription

**Description:** `advance()` pushes a new object into `traversalRecords[]` on every simulation step. If any component subscribes to the full array (e.g. `s.traversalRecords`), Zustand detects a new array reference on every step and re-renders that component and all its descendants. With 50+ nodes on the canvas this can produce cascading renders that lag or freeze the UI.

**Likelihood:** High — the temptation to read `traversalRecords` directly in ConditionalEdge or StatusStrip is natural.

**Impact:** High — lagging simulation on medium-sized graphs defeats the tool's core value.

**Early detection signal:** After Phase 1 ships, open Chrome DevTools → Performance tab. Simulate 10 advances on a 30-node graph. If any single advance triggers >100 component re-renders or takes >32ms, this risk has materialised.

**Mitigation:**
- `ConditionalEdge` must never subscribe to `traversalRecords`. It reads `s.traversedEdgeIds.includes(id)` — a boolean primitive from the already-maintained Set — unchanged from today.
- `StatusStrip` reads `seenNodeIds.length` and `traversedEdgeIds.length` (numbers), not the traversal records array.
- `undoLastNode()` computes what it needs from `traversalRecords` inside the action, never exposing the array to components.
- If a component genuinely needs to know "is this specific edge in my traversal records?", the selector must be `s.traversedEdgeIds.includes(id)`, not `s.traversalRecords.some(r => r.edgeId === id)` — both give the same answer but only the first is AR-14 compliant.

---

## RISK-RT-02 — `undoLastNode` Auto-Save Race Condition

**Description:** If `autosaveCampaign` is true, the debounced `campaignStore` subscriber (1000ms, wired in `main.jsx`) may fire a snapshot AFTER the user clicks Undo but BEFORE the state rollback completes. The saved campaign would then reflect the pre-Undo state, defeating the rollback.

**Likelihood:** Medium — the 1000ms debounce window is long enough that a snapshot write could be in-flight when Undo fires.

**Impact:** Medium — the campaign saves incorrect state; Load Last Save after Undo would re-advance the user to the wrong node.

**Early detection signal:** Enable autosave, advance 3 nodes, click Undo, immediately click "Save Progression" (or wait 1s for auto-save), then exit and re-enter the campaign. If the resume node is the pre-Undo destination rather than the Undo target, the race has occurred.

**Mitigation:** `undoLastNode()` must perform its full `set()` call atomically before the debounce timer can fire. Since Zustand `set()` is synchronous, the rollback completes in the same microtask as the action call — the debounce timer won't fire until the JS event loop yields. This means the race is structurally impossible as long as `undoLastNode()` is a single synchronous `set()` call. Verify this at Phase 1 acceptance.

---

## RISK-RT-03 — Phase 3 RULE CONFLICT Blocks Execution

**Description:** AR-16 states: "No new visual state may be introduced outside this enum without updating this rule." The `--coverage-gap` orthogonal overlay is a new visual state. Phase 3 cannot ship until AR-16 is amended to document `--coverage-gap` as the second orthogonal indicator (alongside `--seen`).

**Likelihood:** Certain — the conflict is structural, not probabilistic.

**Impact:** High — if Phase 3 ships without updating AR-16, the `--coverage-gap` class becomes an undocumented visual state. Future maintainers reading AR-16 would not know it exists, creating confusion when extending node styling.

**Early detection signal:** Before starting Phase 3 execution, grep `architecture_rules.md` for `coverage-gap`. If absent, Phase 3 is blocked.

**Mitigation:** The Phase 3 hard stop list includes: "AR-16 does not yet document `--coverage-gap` → stop, update `architecture_rules.md`, then continue." The 0202_phase_03.md file states this as a prerequisite check.

> **RULE CONFLICT — AR-16:** This rule requires updating before Phase 3 executes. The amendment must add `--coverage-gap` as a second orthogonal indicator alongside `--seen`, with the same semantics: it does not replace the six-state enum value, it is applied additively. The update must be made to `informations/docs/architecture_rules.md` before Phase 3 implementation begins.

---

## RISK-RT-04 — Forward BFS Cost on Each `advance()` Call (Phase 3)

**Description:** Phase 3 calls `routeTracer.computeForwardReachable(activeNodeId, graphState)` on every `advance()` call to populate `unreachableFromActiveNodeIds`. This is a BFS over the full graph. For narratives with 200+ nodes and dense edge graphs, this BFS runs on every simulation step, adding per-step overhead.

**Likelihood:** Low for typical projects (<100 nodes); Medium for large projects.

**Impact:** Medium — visible lag per simulation step on large graphs; not a crash, but degrades the authoring experience.

**Early detection signal:** On a graph with 150+ nodes, simulate 20 advances. If each advance takes >50ms in the profiler, the BFS overhead is contributing meaningfully.

**Mitigation:**
- `computeForwardReachable` is a plain BFS with no gate evaluation — O(V + E) worst case. For 200 nodes this is fast in practice.
- If profiling shows meaningful overhead: memoize the result with a `(activeNodeId, edges)` cache key; invalidate only when `advance()` or narrative topology changes. This optimisation can be deferred to Phase 3 execution if profiling shows it is needed.
- As a hard ceiling: cap BFS at 500 node visits; return the partial set with a flag. Authors with 500+ node graphs are outside the tested scale.

---

## RISK-RT-05 — Shortest-Route State-Space Search Complexity (Phase 4)

**Description:** Gate-respecting pathfinding is not plain graph BFS — a gate that fails at the current flag state may pass after visiting a flag-setting node first. A correct state-space search is exponential in the worst case. Returning k paths is strictly more expensive than returning one. On a dense graph with many flag-gated edges and k=50, the search could run for seconds or indefinitely.

**Likelihood:** Low for typical narratives with <5 flags and sparse gating; Medium for narratives with 10+ interacting flags.

**Impact:** High — a browser hang from a pathological search would block the entire authoring session.

**Early detection signal:** In RouteFinderDialog, run a search on a 30-node graph with 3 interacting flags and limit=50. If the result takes >2 seconds or the browser becomes unresponsive, the hard cap is insufficient.

**Mitigation:**
- `computeShortestPaths` enforces `HARD_CAP = 50` on the returned path count regardless of the `limit` input.
- A `MAX_STATE_VISITS` cap (e.g., 10,000 state-space nodes explored) aborts the search and returns partial results with an `exhausted: true` flag.
- `RouteFinderDialog` displays a "Search budget reached — showing best paths found" notice when `exhausted: true`. Authors understand this is "best paths within budget," not "all paths."
- Do NOT run `computeShortestPaths` synchronously on the main thread if it consistently exceeds 200ms on test graphs. If profiling Phase 4 shows this, the fix is a `queueMicrotask` / `setTimeout(0)` chunked BFS — document the pattern but don't implement it prematurely.
