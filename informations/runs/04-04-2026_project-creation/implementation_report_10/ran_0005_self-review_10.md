# Phase 10 — Simulation Engine: Self-Review Report

> **Phase:** 10 — Simulation Engine
> **Date:** 2026-04-07
> **Reviewer:** Self-review per prompt `0005_self-review.md`
> **Report reviewed:** `ran_0004_execute_10.md`

---

## Issues Found

### 1. Dead import — `useMemo` in `GraphCanvas.jsx`

- **File:** `src/components/graph/GraphCanvas.jsx`, line 23
- **Rule violated:** Universal check — Dead code
- **What the code does:** Imports `useMemo` from React alongside `useState`, `useCallback`, and `useEffect`.
- **What it should do:** Remove `useMemo` from the import — it is not used anywhere in the file body. The sync pattern was changed from `useMemo` to `useEffect` (bugfix) but the import was not cleaned up.

```diff
-import { useState, useCallback, useEffect, useMemo } from 'react';
+import { useState, useCallback, useEffect } from 'react';
```

---

### 2. Dead import — `useSimulationStore` in `useGraphSync.js`

- **File:** `src/hooks/useGraphSync.js`, line 21
- **Rule violated:** Universal check — Dead code
- **What the code does:** Imports `useSimulationStore` from `@/store/useSimulationStore.js` but never uses it anywhere in the file.
- **What it should do:** Remove the unused import. The plan's file map (§3) lists `useSimulationStore` as a dependency of `useGraphSync.js`, but the current implementation does not use it — simulation state is read individually by node/edge renderers, not by the sync hook.

```diff
-import { useSimulationStore } from '@/store/useSimulationStore.js';
```

---

### 3. Stale report — `equalityFn: () => false` claim is out of date

- **File:** `ran_0004_execute_10.md`, line 61
- **Rule violated:** Universal check — Consistency (report does not match code)
- **What the report says:** `useSimulationSync.js` uses `equalityFn: () => false` to force immediate trigger on any state change.
- **What the code actually does:** All three subscriptions use `{ equalityFn: shallowEqual }` (lines 138, 154, 166 of `useSimulationSync.js`). The report describes the pre-bugfix implementation and should be updated to reflect the current shallowEqual approach and the input-only subscription strategy.

---

### 4. Inline styles on node renderers — borderline AR-09

- **File:** `src/components/graph/nodes/CommonNodeRenderer.jsx`, line 106
- **File:** `src/components/graph/nodes/ChoiceNodeRenderer.jsx`, line 91
- **File:** `src/components/graph/nodes/EndingNodeRenderer.jsx`, line 95
- **Rule violated:** AR-09 (borderline)
- **What the code does:** `style={{ position: 'relative' }}` is applied inline to the root node div, required for absolute-positioned state badges.
- **What it should do:** Move `position: relative` into the CSS class (`.common-node`, `.choice-node`, `.ending-node`) rather than as an inline style. This is a minor issue — the layout requirement is real — but AR-09 says no hard-coded values in component stylesheets/markup. The `position` property is structural, not a spacing/color/font token, so this is a borderline violation.

---

### 5. Inline styles on `ConditionalEdge.jsx` label — borderline AR-09

- **File:** `src/components/graph/edges/ConditionalEdge.jsx`, lines 121–137
- **Rule violated:** AR-09 (borderline)
- **What the code does:** Uses inline `style` objects for edge label positioning and visual appearance (background, padding, border, etc.), referencing CSS custom properties via string values like `'var(--color-bg-secondary)'`.
- **What it should do:** The positioning `transform` must remain inline (React Flow's `EdgeLabelRenderer` requires absolute positioning at `labelX/labelY`). However, the visual styling (background, padding, border, font-size, etc.) should be in `ConditionalEdge.css` classes rather than inline styles. The code does use token values via `var()` strings, but inline styles bypass the CSS cascade and make maintenance harder.

---

### 6. Inline style on `ArrowRight` icon — minor AR-09

- **File:** `src/components/graph/nodes/CommonNodeRenderer.jsx`, line 197
- **Rule violated:** AR-09 (minor)
- **What the code does:** `style={{ verticalAlign: 'middle', marginRight: '2px' }}` on a `lucide-react` icon.
- **What it should do:** Use a CSS class on the icon element. The `2px` margin is a hard-coded spacing value not from the token scale.

---

## Summary

6 issues found total:
- **2 dead code** (unused imports — must fix)
- **1 stale report** (documentation inconsistency — should update)
- **3 borderline AR-09** (inline styles — minor, won't break functionality)

No violations of AR-01 through AR-08 or AR-10. All data model rules (AR-03, AR-04, AR-05) are correctly handled by the simulation engine. The pure-function architecture is clean. All files listed in the plan's file map for Phase 10 exist and are functional.
