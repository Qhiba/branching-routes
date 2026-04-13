# Phase 2 Fix Report

## Issue 1: Missing INVARIANT comment for BI-04
- Fixed in `src/store/graphStore.js` (`deleteNode`):
  ```javascript
    // MIGRATION: S25 — In-place migration 
    // INVARIANT: BI-04
    useUIStore.getState().clearIfSelected(id, 'node');
  ```
- Added structural tracking comment to explicitly declare selection wipe handles invariant BI-04.
- No behavior was changed, only the code documentation comment was added.

## Issue 2: Missing INVARIANT comment for BI-05
- Fixed in `src/store/graphStore.js` (`deleteEdge`):
  ```javascript
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-05
    useUIStore.getState().clearIfSelected(id, 'edge');
  ```
- Added structural tracking comment to explicitly declare selection wipe handles invariant BI-05.
- No behavior was changed, only the code documentation comment was added.

## Issue 3: Missing INVARIANT comment for BI-16
- Fixed in `src/store/graphStore.js` (`loadGraph`, `newGraph`):
  ```javascript
    // MIGRATION: S25 — In-place migration
    // INVARIANT: BI-16
    useUIStore.getState().resetSelection();
  ```
- Added structural tracking comment to explicitly declare selection wipe handles invariant BI-16 during graph rendering updates.
- No behavior was changed, only the code documentation comment was added.

## User Notes Handled
- Added `// NOTE: unrelated issue — not touching in refactor [Violation] 'click' handler took 1682ms` to `handleNew` in `TopBar.jsx`. Performance optimizations fall outside the architectural scope of Phase 2, so the issue was structurally flagged but deliberately bypassed according to rule constraints.
