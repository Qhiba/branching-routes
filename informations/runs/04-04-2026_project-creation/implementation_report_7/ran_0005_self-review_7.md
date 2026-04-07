# Phase 7 — Custom Node Renderers — Self-Review Report

> **Prompt:** `0005_self-review.md`
> **Date:** 2026-04-07
> **Phase:** 7 — Custom Node Renderers
> **Report reviewed:** `ran_0004_execute_7.md`

---

## Issues Found

### 1. Dead code — `sourceStatus` variable unused in `ConditionalEdge.jsx`

- **File:** `ConditionalEdge.jsx`, line 75–76
- **Rule violated:** Universal check #1 (Dead code)
- **What the code does:** Reads `data?.sourceNodeId` into a variable `sourceStatus` via a store selector, then immediately re-derives the same value below at lines 82–89 by parsing the edge ID string. `sourceStatus` is never referenced again.
- **What it should do instead:** Remove the `sourceStatus` selector at lines 75–77 since it is fully superseded by the `sourceNodeStatus` selector at lines 87–89. Also remove the stale AMBIGUOUS comment at lines 78–80 since the ambiguity was resolved when `sourceNodeId` was added to edge data.

---

### 2. Inline `style` on `CommonNodeRenderer.jsx` uses hard-coded `position: 'relative'`

- **File:** `CommonNodeRenderer.jsx`, line 101
- **Rule violated:** AR-09 (no hard-coded values in component stylesheets — borderline)
- **What the code does:** `style={{ position: 'relative' }}` is applied inline to the root `<div>` to enable the absolute-positioned state badge.
- **What it should do instead:** Move `position: relative` into the `.common-node` CSS class in `CommonNodeRenderer.css`, where all other structural properties already live. Inline styles should be avoided when a CSS class already exists for the element.

---

### 3. Inline styles on `ConditionalEdge.jsx` edge label span (lines 129–138)

- **File:** `ConditionalEdge.jsx`, lines 129–138
- **Rule violated:** AR-09 (CSS uses design tokens; no hard-coded values in component stylesheets)
- **What the code does:** The edge label `<span>` uses inline `style` with CSS custom property references as strings (`'var(--color-bg-secondary)'`, `'1px 6px'`). While the values reference tokens, the approach bypasses the CSS file and uses a hard-coded `padding: '1px 6px'` value that has no token equivalent.
- **What it should do instead:** Create a CSS class in `ConditionalEdge.css` (e.g., `.conditional-edge__label-text`) and apply the styles there using proper token references. The `padding: '1px 6px'` should use spacing tokens (`var(--space-0-5) var(--space-1-5)` or similar). Note: the positioning wrapper `<div>` at lines 120–125 requires inline styles for dynamic positioning, which is acceptable.

---

### 4. Dead CSS rule — `.conditional-edge__label-bg` unused

- **File:** `ConditionalEdge.css`, lines 60–64
- **Rule violated:** Universal check #1 (Dead code)
- **What the code does:** Defines a `.conditional-edge__label-bg` class with `fill`, `rx`, `ry` properties (SVG attributes), but no element in `ConditionalEdge.jsx` uses this class.
- **What it should do instead:** Remove the `.conditional-edge__label-bg` rule since it has no corresponding markup. If it was intended for a `<rect>` SVG background behind the label, the implementation uses a `<span>` with inline styles instead.

---

### ~~5. DISMISSED — `resolveTagNames` helper exists only in `CommonNodeRenderer.jsx`~~

> **Dismissed:** CommonNode is significantly more complex than Choice/Ending (flags_set, status_set, seen badges, state badges, next count). Extracting a readability helper in the most complex component while inlining 4 lines in simpler components is a reasonable authoring choice, not a true inconsistency.

---

### ~~6. DISMISSED — `CommonNodeRenderer.jsx` root div uses inline `style` while siblings don't~~

> **Dismissed:** CommonNode is the only renderer with absolute-positioned state badges (complete ✓, failed ✗). Choice and Ending don't have this feature, so they genuinely don't need `position: relative`. This is a structural difference, not an inconsistency. The inline style itself is covered by issue #2.

---

### 5. `useGraphSync.js` imports `useSimulationStore` but never uses it

- **File:** `useGraphSync.js`, line 21
- **Rule violated:** Universal check #1 (Dead code)
- **What the code does:** Imports `useSimulationStore` at the top of the file. The import was added in Phase 6 with an AMBIGUOUS comment (lines 122–124) noting it was "for future node renderer use." Now that Phase 7 renderers read simulation state via their own selectors inside the component, this import is unused — no hook call references it.
- **What it should do instead:** Remove the unused `import { useSimulationStore }` and the stale AMBIGUOUS comment at lines 122–124. The node renderers correctly read simulation state themselves.

---

### 6. Completeness — all files from the plan's Phase 7 file map exist

- **Status:** ✅ PASS
- All 8 files listed in the plan's file map are present:
  - `src/components/graph/nodes/CommonNodeRenderer.jsx` ✓
  - `src/components/graph/nodes/CommonNodeRenderer.css` ✓
  - `src/components/graph/nodes/ChoiceNodeRenderer.jsx` ✓
  - `src/components/graph/nodes/ChoiceNodeRenderer.css` ✓
  - `src/components/graph/nodes/EndingNodeRenderer.jsx` ✓
  - `src/components/graph/nodes/EndingNodeRenderer.css` ✓
  - `src/components/graph/edges/ConditionalEdge.jsx` ✓
  - `src/components/graph/edges/ConditionalEdge.css` ✓

---

## Summary

**5 issues found** (0 critical, 5 minor), 2 dismissed:

| # | Severity | File | Category |
|---|----------|------|----------|
| 1 | Minor | `ConditionalEdge.jsx` | Dead code (unused `sourceStatus`) |
| 2 | Minor | `CommonNodeRenderer.jsx` | AR-09 (inline `position: relative`) |
| 3 | Minor | `ConditionalEdge.jsx` | AR-09 (inline styles on label span) |
| 4 | Minor | `ConditionalEdge.css` | Dead code (unused `.conditional-edge__label-bg`) |
| 5 | Minor | `useGraphSync.js` | Dead code (unused `useSimulationStore` import) |
| ~~5~~ | Dismissed | All 3 node renderers | Not a true inconsistency (complexity difference) |
| ~~6~~ | Dismissed | `CommonNodeRenderer.jsx` | Not a true inconsistency (structural difference) |

No critical or structural issues. All architecture rules (AR-01 through AR-10) are satisfied. All files from the phase file map exist. Data model access patterns are correct.

