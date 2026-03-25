
---

## Backtrack Upgrade Plan

### Current State
The existing backtrack finds **direct references** — it shows which nodes have this node as their `next` target. One level deep, no path traversal, no flag awareness.

---

### What Needs to Be Added

**Step 1 — BFS Backward Traversal**

**Target file:** `src/utils/dependencyGraph.js`

The existing `getDependencyGraph()` already separates `setBy` from `requiredBy`. Extend it with a `findPathTo(targetId, entryNodeId)` function that:

- Starts at `targetId`
- Walks backwards through `next` references using BFS
- Terminates when it reaches `entryNodeId`
- Returns all valid paths as ordered arrays of node IDs, shortest path first

---

**Step 2 — Flag Requirement Tracking Along the Path**

**Target file:** `src/utils/dependencyGraph.js` or a new `src/utils/routeTracer.js`

For each path returned by the BFS, annotate each step with:
- Which option must be picked at each choice node
- What `flags_set` that option produces
- What `status_set` changes it causes
- Whether those flags satisfy the `requires` conditions of the next node in the path

This produces the full annotated route:
```
1. give_food_to_stranger
   → pick "Yes, give food"
     sets gave_food_to_stranger
     +2 strength
2. meet_the_priest
   → pick "Approach him"
     sets met_the_priest
```

---

**Step 3 — Highlight Path on Graph**

**Target file:** `RouteViewer.jsx`

Add a `tracedPath` state — an array of edge IDs representing the optimal route. When populated:
- Matching edges render with `stroke: #d4a017`, `strokeWidth: 2`, z-index above default edges
- Non-path edges dim to `opacity: 0.2`
- Clearing the backtrack result restores all edges to default

The **"Highlight on graph"** button in the inspector result view sets `tracedPath` in `RouteViewer.jsx` via a callback passed down from `App.jsx`.

---

**Step 4 — Update the Inspector Result View**

**Target file:** `LeftSidebar.jsx` — backtrack result panel

Replace the current reference list with the full annotated layout:

```
┌─────────────────────────────────────────┐
│  ← Back to inspector                   │
│  ROUTE TO  stranger_accepts_food        │
├─────────────────────────────────────────┤
│  1.  give_food_to_stranger              │
│      → "Yes, give food"                 │
│        sets gave_food_to_stranger       │
│        +2 strength                      │
│                                         │
│  2.  meet_the_priest                    │
│      → "Approach him"                   │
│        sets met_the_priest              │
│                                         │
│  Minimum choices: 2                     │
├─────────────────────────────────────────┤
│  [ Highlight path on graph ]            │
└─────────────────────────────────────────┘
```

---

### Upgrade Order

| Step | Dependency |
|---|---|
| Step 1 — BFS traversal | None — pure utility, no UI changes |
| Step 2 — Flag annotation | Requires Step 1 |
| Step 3 — Graph highlight | Requires Step 1, independent of Step 2 |
| Step 4 — Inspector UI | Requires Steps 1 and 2 |

Do Steps 1 and 2 first. Steps 3 and 4 can be done in parallel after that.