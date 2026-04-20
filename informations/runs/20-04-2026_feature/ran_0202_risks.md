# Risk Register — Command_palette_toast_Visual_Node_Clustering

> New risks surfaced in scoping. Existing risks from the register that this feature amplifies are noted below each new entry.

---

## RISK-CP-01 — Cluster Overlay Coordinate Space Mismatch

**Description:** The cluster overlay is an absolutely-positioned HTML/SVG element rendered alongside React Flow, not inside it. Node positions in `narrativeStore` are in "flow coordinates" — the graph's own coordinate system before the viewport pan/zoom transform. Without explicitly applying the same viewport transform, clusters render at raw store coordinates and won't align with nodes during pan or zoom.

**Likelihood:** High — incorrect by default; requires an explicit implementation step.

**Impact:** High — clusters spatially disconnected from their nodes makes the feature useless and looks broken.

**Early detection signal:** Enable clustering; pan the canvas — if clusters stay stationary while nodes move, the transform is not applied.

**Mitigation:**
1. Render `<ClusterOverlay>` as a separate component inside `GraphCanvasInner` (inside `ReactFlowProvider`)
2. `ClusterOverlay` calls `useViewport()` from `@xyflow/react` to get `{ x, y, zoom }`
3. Apply `style={{ transform: \`translate(${x}px, ${y}px) scale(${zoom})\`, transformOrigin: '0 0' }}` to the SVG wrapper element
4. All cluster region coordinates are then in flow space — same coordinate system as node positions

**Performance note:** `useViewport()` triggers a re-render of `ClusterOverlay` on every pan frame. By keeping `ClusterOverlay` as a separate component and computing bounding boxes in its own `useMemo` keyed on node positions (not on viewport), the bounding box calculation only runs when nodes move — not on every pan frame.

**Amplifies:** RISK-01 (Re-render storms) — an additional render component tracking viewport adds to the render budget.

---

## RISK-CP-02 — AR-14 Toast Infinite Re-Render Loop

**Description:** If `addToast` is called during a component's render cycle (or from a `useEffect` with an unstable dependency), calling `addToast` triggers a state change → re-render → `addToast` fires again → infinite loop. The same class of bug formally described in AR-14.

**Likelihood:** Medium — easy to trigger by accident; the constraint is non-obvious to implementors.

**Impact:** High — browser tab freezes immediately with "Maximum update depth exceeded".

**Early detection signal:** Opening the app causes the browser to freeze, or the console shows rapid-fire toast creation.

**Mitigation:**
- `toastStore` initialises `toasts: []` — no selector ever needs a `?? []` fallback (AR-14 compliance at init)
- `addToast` must only be called from: event handlers, `useEffect` callbacks with stable deps, or explicit user interactions — never from render body or unstable effects
- The `Toast.jsx` component must have no side effects in render — it only reads `toasts` and renders them
- Phase 1 acceptance test must verify that loading the app produces zero spontaneous toasts

**Amplifies:** AR-14 (Zustand selector stability) — identical failure mode, different store.

---

## RISK-CP-03 — ESC Double-Handling in CommandPalette

**Description:** Pressing ESC inside the command palette must close it. However, the global `useKeyboardShortcuts` handler also handles ESC → `clearSelection()`. Without intervention, both fire: palette closes AND canvas selection is cleared. Same class as RISK-CMK-08 (resolved for NameModal).

**Likelihood:** High — ESC is the intuitive dismiss gesture; without explicit stopPropagation, the event reaches both handlers.

**Impact:** Medium — not data-corrupting, but unexpected UX: user selects a node, opens palette, presses ESC to close — node becomes deselected.

**Early detection signal:** Select a node; open palette; press ESC; if the inspector goes blank (node deselected), double-handling has occurred.

**Mitigation:** `CommandPalette` attaches its own `keydown` listener on `window` (not on the panel div — the panel div listener would not capture events from the input field). The listener checks `e.key === 'Escape'`, calls `e.stopPropagation()`, then closes the palette. This is the exact NameModal pattern (RISK-CMK-08 resolution) — replicate it, do not invent a new approach.

---

## RISK-CP-04 — Ctrl+K Blocked When Palette Input Is Focused

**Description:** The input-field guard in `useKeyboardShortcuts` bails early when `event.target.tagName === 'INPUT'`. When the command palette is open and the user is typing in its search `<input>`, pressing `Ctrl+K` to close the palette would hit the input guard and be ignored — making the palette unclosable via keyboard.

**Likelihood:** High — the guard runs before any key check; `Ctrl+K` from an input field would be silently swallowed.

**Impact:** Medium — palette can still be closed via ESC or backdrop click, but the expected `Ctrl+K` toggle fails from within the palette.

**Early detection signal:** Open the palette; click the search input so it has focus; press `Ctrl+K` — if the palette does not close, the guard ordering is wrong.

**Mitigation:** The `Ctrl+K` handler must be inserted as the very first check inside `handleKeyDown`, before the input-field guard block. This is a structural requirement — not just "put it early". Review the code placement explicitly during self-review.

**Note:** Firefox additionally intercepts `Ctrl+K` at the browser level (focuses browser search bar). `event.preventDefault()` must be called in the handler to suppress the browser default before dispatching `palette-toggle`.

---

## RISK-CP-05 — Cluster Bounding Box Re-Computation Per Viewport Frame

**Description:** If the `useMemo` for cluster bounding boxes is collocated with `useViewport()` in the same component render, it re-runs on every pan frame — because `useViewport()` triggers a re-render on every pan event. With 200+ nodes and multiple clusters, this is a per-frame CPU spike.

**Likelihood:** Medium — depends on implementation structure; easily avoided with correct component separation.

**Impact:** Medium — canvas panning becomes visibly sluggish when clusters are enabled; amplifies RISK-01 at scale.

**Early detection signal:** Enable clustering; pan quickly on a 50+ node graph — if panning is noticeably slower than without clusters, bounding boxes are being recomputed per frame.

**Mitigation:** Separate the two concerns:
1. Bounding box computation: `useMemo` in `GraphCanvasInner`, keyed on node position data. Only reruns when a node moves.
2. Viewport transform: applied as a CSS transform on the cluster SVG wrapper inside `ClusterOverlay`, using `useViewport()`. This causes `ClusterOverlay` to re-render on pan, but it only applies a CSS transform — no bounding box math.

Pass computed bounding boxes from `GraphCanvasInner` to `ClusterOverlay` as props. The only work done per pan frame is a single CSS property update.
