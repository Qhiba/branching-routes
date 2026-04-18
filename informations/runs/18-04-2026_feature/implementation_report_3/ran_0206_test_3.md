# ran_0206_test_3.md — QA Test Plan

**Feature:** Variants_on_nodes_and_Options_on_choices
**Phase:** 3
**Generated:** 2026-04-18

---

## Group A — Feature Verification

Phase 3 is primarily a UI integration phase (React DOM rendering). However, the critical Bug 4 modification altered the central engine logic (`addEdge`) to allow concurrent distinct edge routing between identical nodes via Option context.

**T1. Distinct Options Allow Identical Targeted Connections**
- Initialize a `choice` node and a `common` target node.
- Add edge using option `opt-123`.
- Add second edge using option `opt-456`.
- **Expected:** Success. Two edges are formally registered bypassing legacy dupe limits.

**T2. Strict Anti-Duplication Enforcement On Shared Options**
- Initialize a `choice` node and a `common` target node.
- Add edge utilizing `opt-123`.
- Attempt to add string-identical edge deploying `opt-123` again.
- **Expected:** Failure throws intentional safety Error guarding system integrity.

## Group B — Integration Suite

**T3. Legacy Duplicate Protection Preservation**
- Initialize vanilla `common` source and target.
- Add baseline un-optioned edge.
- Try repeating the same connection sequence.
- **Expected:** Rejection behaves securely identically to vanilla routing prior to Feature changes mapping back to a null option check gracefully.

---

### Final Test Execution Results

Terminal output confirmed on `2026-04-18`:
```text
$ npx vite-node tests/test_feature_phase_3.js
[PASS] T1. Distinct Options Allow Identical Targeted Connections
[PASS] T2. Strict Anti-Duplication Enforcement On Shared Options
[PASS] T3. Legacy Duplicate Protection Preservation

--- TEST RESULTS ---
3 passed, 0 failed
INTEGRATION: CLEAN
```

**Conclusion:** All logic rules hold firm. The Phase 3 integration is formally verified and closed.
