## Implementation Plan — OR-of-AND Condition Groups

> **Goal:** Transform the flat `requires` array (AND-only) into a two-level group structure supporting OR-of-AND logic.
>
> Example:
> ```
> OLD: [{ flag: 'has_key', state: true }, { status: 'rep', min: 5 }]
>      → has_key=true AND reputation≥5
>
> NEW: { operator: 'or', conditions: [
>         { operator: 'and', conditions: [{ flag: 'has_key', state: true }] },
>         { operator: 'and', conditions: [{ status: 'rep', min: 5 }] }
>      ]}
>      → has_key=true OR reputation≥5
> ```

---

### Phase 1 — Helper Functions (`src/utils/conditionUtils.js`) ✅ COMPLETE

Create a utility module that all consumers import. Centralizes recursive logic so the 24 consuming files don't each re-implement tree traversal.

**Functions:**

| Function | Purpose |
|----------|---------|
| `normalizeRequires(requires)` | Convert legacy flat array to group. Already-group returns as-is. Empty/null returns `{ operator: 'and', conditions: [] }` |
| `isConditionGroup(obj)` | Check if value is a group (`obj.operator`) vs leaf (`obj.flag` or `obj.status`) |
| `isFallbackGroup(group)` | True if AND group with 0 conditions (fallback route detection) |
| `flattenConditions(group)` | Recursively extract all leaf conditions from a group tree (for reference maps, graph building) |
| `evaluateGroup(group, state)` | Recursive evaluator: AND → `every`, OR → `some`. Takes `{ flags, status }` state |
| `filterConditions(group, predicate)` | Recursively filter out matching conditions (e.g., remove deleted flag). Prunes empty sub-groups |
| `conditionsSummary(group, maxItems)` | Produce display string like `"has_key=true ∨ rep≥5"` for node badges |
| `hasConditions(group)` | Check if group has any leaf conditions at any depth |

**Design rules:**
- Leaf = object with `flag` or `status` property (same shape as today)
- Group = object with `operator` (`'and'` | `'or'`) and `conditions` (array of leaves or groups)
- Only two levels: OR at top, AND groups inside. Deeper nesting prevented in UI but `evaluateGroup` handles arbitrary depth defensively
- `_id` preserved on leaf conditions for React keys

---

### Phase 2 — Data Model Migration ✅ COMPLETE

**`requires` changes from Array to Object:**
```
OLD: requires: [ { flag, state }, { status, min } ]     ← Array
NEW: requires: { operator: 'and', conditions: [...] }   ← Object
```

**Migration function** (add to `EditorContext.jsx`, same pattern as `migrateOptionNext`):
```js
function migrateRequires(obj) {
  if (!obj) return { operator: 'and', conditions: [] };
  if (Array.isArray(obj)) return { operator: 'and', conditions: obj };
  if (obj.operator) return obj;
  return { operator: 'and', conditions: [] };
}
```

**Apply to every `requires` location on load:**

| Entity | Locations |
|--------|-----------|
| Choice | `choice.requires` |
| Choice Option | `opt.requires` |
| Choice Option Next | `entry.requires` |
| Scene | `scene.requires` |
| Scene Variant | `variant.requires` |
| Scene Next Route | `route.requires` |
| Ending | `ending.requires` |

**New entity creation** — change `requires: []` to `requires: { operator: 'and', conditions: [] }` in:
- `EditorContext.jsx`: `addScene`, `addChoice`, `addEnding`, add-option logic
- Modal forms + sidebar forms: new route/variant creation

---

### Phase 3 — Evaluation Layer ✅ COMPLETE

**`src/hooks/useSimulator.js` (lines 73-88)**

Replace inline evaluator with:
```js
const passesRequires = useCallback((requires) => {
  const group = normalizeRequires(requires);
  return evaluateGroup(group, activeState);
}, [activeState]);
```

All call sites unchanged — they pass whatever is in `requires`, `normalizeRequires` handles both formats.

**`src/utils/routeTracer.js` (lines 166-182)**

Replace inline condition evaluation with `evaluateGroup()` for `satisfiesNext` computation.

---

### Phase 4 — ConditionEditor UI Overhaul ✅ COMPLETE

**File: `src/components/shared/ConditionEditor.jsx`**

The flat-list editor becomes a recursive group editor.

**New component structure:**
```
ConditionEditor (top-level wrapper, receives group object)
  └── GroupEditor (recursive, renders one AND or OR group)
        ├── Operator toggle (AND ↔ OR)
        ├── For each condition in group.conditions:
        │   ├── Leaf → render existing Flag/Status condition row
        │   └── Sub-group → render GroupEditor recursively
        ├── "Add Flag condition" button
        ├── "Add Status condition" button
        └── "Add OR group" button (at AND level only)
```

**UI actions:**

| Action | Effect |
|--------|--------|
| Toggle AND ↔ OR | Changes `group.operator` |
| Add Flag condition | Appends `{ flag: '', state: true, _id: ... }` to `group.conditions` |
| Add Status condition | Appends `{ status: '', min: 0, _id: ... }` to `group.conditions` |
| Add OR group | At AND level. Creates two AND sub-groups inside a new OR wrapper: current conditions go into first group, second group is empty |
| Flatten group | Moves sub-group conditions up into parent, removes wrapper |
| Delete leaf | Removes from `group.conditions`, prunes empty parent |

**Visual design:**
- Sub-groups indented with left border
- AND groups: subtle blue left-border
- OR groups: subtle amber left-border
- Operator toggle: pill showing AND/OR, clickable to switch
- Leaf conditions render exactly as today
- Top-level group has no operator toggle (always AND)

**Props contract (unchanged signature):**
```jsx
<ConditionEditor conditions={group} onChange={(newGroup) => ...} />
```

`conditions` is now a group object instead of array. `onChange` emits a group object.

**Fallback detection** (in all forms):
- OLD: `route.requires.length === 0`
- NEW: `isFallbackGroup(route.requires)`

---

### Phase 5 — Reference Tracking & Cascade Deletion ✅ COMPLETE

**File: `src/context/EditorContext.jsx`**

All `.filter(r => r.flag !== id)` on requires → use `filterConditions()`:

```js
// OLD (12+ locations):
const newReqs = (opt.requires || []).filter(r => r.flag !== id);

// NEW:
const newReqs = filterConditions(normalizeRequires(opt.requires), r => r.flag !== id);
```

Applies to both `deleteFlag` (~lines 316-363) and `deleteStatusPoint` (~lines 666-708).

**Reference map functions** (`getFlagReferenceMap`, `getStatusReferenceMap`):
```js
// OLD:
if (choice.requires) choice.requires.forEach(r => { if (r.flag) referencedFlags.add(r.flag); });

// NEW:
flattenConditions(normalizeRequires(choice.requires)).forEach(r => { if (r.flag) referencedFlags.add(r.flag); });
```

---

### Phase 6 — Dependency Graph & Reachability Analyzer ✅ COMPLETE

**`src/utils/dependencyGraph.js`**

All 8 locations that iterate `requires` arrays → use `flattenConditions()` first:
```js
const leaves = flattenConditions(normalizeRequires(scene.requires));
for (const req of leaves) { ... }
```

**`src/utils/reachabilityAnalyzer.js`**

Use `flattenConditions()` to extract leaves, then apply same flat logic.

OR-aware reachability is deferred — initial implementation uses conservative check (all leaves across all OR groups must have setters). More precise analysis (check if at least one AND-group is satisfiable) is a future enhancement.

---

### Phase 7 — Canvas Node Display ✅ COMPLETE

**Files:** `SceneNode.jsx`, `ChoiceNode.jsx`, `EndingNode.jsx`

Replace direct `.map(req => ...)` with `conditionsSummary()` for compact display.

OR groups display with separator: `flag_a=true ∨ flag_b=true`

For requires count badges, use `flattenConditions(normalizeRequires(...)).length` instead of `requires.length`.

**`src/components/simulator/Simulator.jsx`** — update ending condition display to use `flattenConditions()`.

---

### Phase 8 — Graph Layout Pass-through ✅ COMPLETE

**`src/utils/graphLayout.js`**

Update `requiresCount` computation at all 6 locations:
```js
requiresCount: flattenConditions(normalizeRequires(scene.requires)).length
```

Pass through the group object as `requires` — no shape change needed for the data pass-through.

---

### Phase 9 — Import/Export & Tests ✅ COMPLETE

**Export:** Group object serializes to JSON natively — no format wrapper needed.

**Import:** `normalizeRequires()` handles both old flat arrays and new group objects.

**Tests:**
- `dependencyGraph.test.js` — update fixtures to group format
- `routeTracer.test.js` — update fixtures to group format
- NEW `conditionUtils.test.js` — unit tests for `normalizeRequires`, `evaluateGroup`, `filterConditions`, `flattenConditions`, `conditionsSummary`, `isFallbackGroup`

---

### File Change Summary

| File | Type | Complexity |
|------|------|-----------|
| `src/utils/conditionUtils.js` | **NEW** | Medium |
| `src/components/shared/ConditionEditor.jsx` | Major rewrite | **High** |
| `src/context/EditorContext.jsx` | Moderate | Medium |
| `src/hooks/useSimulator.js` | Small | Low |
| `src/utils/routeTracer.js` | Small | Low |
| `src/utils/dependencyGraph.js` | Moderate | Low-Med |
| `src/utils/reachabilityAnalyzer.js` | Moderate | Low-Med |
| `src/utils/graphLayout.js` | Small | Low |
| `src/components/routeviewer/nodes/SceneNode.jsx` | Small | Low |
| `src/components/routeviewer/nodes/ChoiceNode.jsx` | Small | Low |
| `src/components/routeviewer/nodes/EndingNode.jsx` | Small | Low |
| `src/components/simulator/Simulator.jsx` | Small | Low |
| `src/components/routeviewer/RouteViewer.jsx` | Small | Low |
| `src/components/modals/SceneModalForm.jsx` | Small | Low |
| `src/components/modals/ChoiceModalForm.jsx` | Small | Low |
| `src/components/modals/EndingModalForm.jsx` | Small | Low |
| `src/components/layout/forms/SceneForm.jsx` | Small | Low |
| `src/components/layout/forms/ChoiceForm.jsx` | Small | Low |
| `src/components/layout/forms/EndingForm.jsx` | Small | Low |
| `src/components/scenes/SceneEditor.jsx` | Small | Low |
| `src/components/choices/ChoiceEditor.jsx` | Small | Low |
| `src/components/endings/EndingManager.jsx` | Small | Low |
| `src/utils/conditionUtils.test.js` | **NEW** | Medium |

---

### Execution Order

```
Phase 1 (helpers) → Phase 2 (migration) → Phase 3 (evaluator)
                                         → Phase 5 (cascade deletion)
                                         → Phase 6 (graph/analyzer)
                                         → Phase 7 (node display)
                                         → Phase 8 (layout)
Phase 4 (ConditionEditor UI) — can start after Phase 1, biggest effort
Phase 9 (tests) — after all phases
```

Phase 1 (~80 lines) and Phase 4 (~200-300 lines rewritten) are the critical path.
