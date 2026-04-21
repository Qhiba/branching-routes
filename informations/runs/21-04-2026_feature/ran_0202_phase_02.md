# Phase 2 — Traversal Overlay + Coverage Metrics

---

**Goal:** Surface Phase 1's traversal data visually — highlight traversed edges with a distinct overlay color when the toggle is on, and display live coverage metrics in a new bottom bar. The phase introduces the `StatusStrip` component and the `App.css` layout change that hosts it.

---

## What it adds

**`src/styles/tokens.css`**
- Add three tokens under the existing campaign-state token block:
  - `--color-traversal-overlay: #f97316` — warm orange, distinct from the existing `--color-visited` (grey) and `--color-reachable` (blue)
  - `--color-route-overlay: #22d3ee` — cyan, reserved now, used in Phase 4
  - `--opacity-coverage-gap: 0.2` — reserved now, used in Phase 3

**`src/styles/global.css`**
- Add `.conditional-edge--traversal-overlay` CSS class (after the existing `.conditional-edge--traversed` block): `stroke: var(--color-traversal-overlay) !important; stroke-width: 3px !important;`
- Add `.status-strip` component block (at the end of the file): fixed-height flex row, `background: var(--color-bg-surface)`, `border-top: 1px solid var(--color-border)`, three readout cells each with a label and a count, a right-side toggle button. Campaign-only visibility is handled in the component, not CSS.
- Both additions must be listed as explicit file entries in the phase file map per AR-21.

**`src/components/edges/ConditionalEdge.jsx`**
- Add `showTraversalOverlay = useUIStore(s => s.showTraversalOverlay)` selector (boolean primitive, AR-14, AR-23).
- Change the existing `isTraversed` selector to only apply the traversal class when `showTraversalOverlay` is true: `const isTraversedOverlay = useSimulationStore(s => s.isCampaignActive && s.traversedEdgeIds.includes(id)) && showTraversalOverlay`
- Update className logic: when `isTraversedOverlay` is true, apply `conditional-edge--traversal-overlay` (new class, distinct warm color). When the overlay is off, traversed edges render as inert (no traversal class applied). `--condition-pass` class logic is unchanged.
- The existing `--traversed` class name is superseded; the CSS rule for it can remain in `global.css` for backward compatibility but will no longer be applied by this component.

**`src/components/StatusStrip.jsx`** (CREATE)
- Campaign-mode only: returns null when `!isCampaignActive`.
- Per-slice selectors (AR-23):
  - `seenCount = useSimulationStore(s => s.seenNodeIds.length)` — number
  - `traversedCount = useSimulationStore(s => s.traversedEdgeIds.length)` — number
  - `isCampaignActive = useSimulationStore(s => s.isCampaignActive)` — boolean
  - `showTraversalOverlay = useUIStore(s => s.showTraversalOverlay)` — boolean
  - `toggleTraversalOverlay = useUIStore(s => s.toggleTraversalOverlay)` — function (stable ref)
  - `common = useNarrativeStore(s => s.common)` — object ref
  - `choice = useNarrativeStore(s => s.choice)` — object ref
  - `ending = useNarrativeStore(s => s.ending)` — object ref
  - `edges = useNarrativeStore(s => s.edges)` — array ref
  - `seenNodeIds = useSimulationStore(s => s.seenNodeIds)` — array ref (stable until advance/undo)
- Derived counts computed with `useMemo` (not inline on every render):
  - `totalNodeCount = useMemo(() => Object.keys(common).length + Object.keys(choice).length + Object.keys(ending).length, [common, choice, ending])`
  - `totalEndingCount = useMemo(() => Object.keys(ending).length, [ending])`
  - `totalEdgeCount = useMemo(() => edges.length, [edges])`
  - `endingsReachedCount = useMemo(() => seenNodeIds.filter(id => !!ending[id]).length, [seenNodeIds, ending])`
  - `visitedCount = seenCount + (isCampaignActive ? 1 : 0)` — `seenNodeIds` records DEPARTED nodes; the active node is not yet in it; add 1 while campaign is active to count the current node
- Renders three readouts: `Nodes: {visitedCount} / {totalNodeCount}`, `Endings: {endingsReachedCount} / {totalEndingCount}`, `Edges: {traversedCount} / {totalEdgeCount}`
- Renders an "Overlay: ON/OFF" toggle button calling `toggleTraversalOverlay`
- No side effects on render (AR-14). No `useState` for coverage data (AR-03).

**`src/App.jsx`**
- Import `StatusStrip` from `components` barrel.
- Add `<footer className="app__statusbar"><StatusStrip /></footer>` after the `<aside className="app__sidebar">` element.

**`src/App.css`**
- Change `grid-template-rows: 48px 1fr` → `grid-template-rows: 48px 1fr 28px`
- Add `"statusbar statusbar"` as the third row in `grid-template-areas`
- Add `.app__statusbar` rule: `grid-area: statusbar; background: var(--color-bg-surface); border-top: 1px solid var(--color-border); overflow: hidden; display: flex; align-items: center; padding: 0 var(--space-4);`

**`src/components/index.js`**
- Add `export { default as StatusStrip } from './StatusStrip'`

---

## Produces

| Action | File |
|--------|------|
| MODIFY | `src/styles/tokens.css` |
| MODIFY | `src/styles/global.css` |
| MODIFY | `src/components/edges/ConditionalEdge.jsx` |
| CREATE | `src/components/StatusStrip.jsx` |
| MODIFY | `src/App.jsx` |
| MODIFY | `src/App.css` |
| MODIFY | `src/components/index.js` |

---

## What it leaves temporarily incomplete

- `--color-route-overlay` and `--opacity-coverage-gap` tokens are added but unused (Phase 3 uses opacity, Phase 4 uses route overlay color)
- `StatusStrip` has no dead-end count readout yet (Phase 3 adds it)
- `RouteFinderDialog` open button is not wired yet (Phase 4 adds it to StatusStrip or TopBar)
- `--coverage-gap` node dimming does not exist yet (Phase 3)
- The `--route-overlay` edge class does not exist yet (Phase 4)

---

## What the next phase depends on from this phase

- Phase 3 depends on `--opacity-coverage-gap` token existing in `tokens.css`
- Phase 3 depends on `StatusStrip.jsx` existing to add the dead-end count readout
- Phase 4 depends on `--color-route-overlay` token existing in `tokens.css`
- Phase 4 depends on `src/components/index.js` having `StatusStrip` exported (no duplicate needed)

---

## Reference files needed

- `ran_0202_phase_01.md` — confirms `traversalRecords`, `showTraversalOverlay` exist from Phase 1
- `src/styles/tokens.css` — insertion point for new tokens
- `src/styles/global.css` — insertion point for new CSS classes
- `src/components/edges/ConditionalEdge.jsx` — current `isTraversed` selector and class logic
- `src/App.jsx` — current layout structure
- `src/App.css` — current grid definition

---

## Rollback cost if this phase fails: LOW

- `tokens.css` additions are unused tokens — safe to remove
- `global.css` additions are new CSS blocks at the end of the file — safe to remove
- `ConditionalEdge.jsx` change is a localised selector swap — reverting restores previous behavior
- `StatusStrip.jsx` is a new file — delete it
- `App.jsx` and `App.css` changes are a single additive region — reverting removes the bottom bar
- No data model changes to roll back

---

## Hard stop triggers for this phase

1. **Bottom-bar grid region breaks canvas height.** If the canvas loses its `1fr` row or the total layout exceeds `100vh`, the canvas will shrink unexpectedly. Hard stop: after adding the 28px row, verify the canvas area is still full-height minus 48px (topbar) minus 28px (strip) = `calc(100vh - 76px)`.
2. **`StatusStrip` subscribes to `seenNodeIds` array and causes re-renders on every advance.** The `seenNodeIds.length` selector returns a number — safe. But `seenNodeIds` itself (the array ref) is used in `useMemo` for `endingsReachedCount`. Since `seenNodeIds` is replaced by a new array on every `advance()`, the `useMemo` will recompute on every advance. This is acceptable (the memo is cheap). Hard stop only if the full `seenNodeIds` subscription (not the memo) causes observable re-render storms.
3. **`ConditionalEdge` traversal overlay class conflicts with `--condition-pass` animation.** The `--condition-pass` class has a pulse animation. If both classes are applied simultaneously, the visual is confusing. Verify: a traversed edge that was the condition-pass edge for the PREVIOUS step should show `--traversal-overlay` (already traversed), not `--condition-pass` (currently reachable). The existing priority logic (`if (isTraversed) ... else if (isConditionPass)`) handles this correctly — confirm it is preserved.

---

## Acceptance Criteria

- [ ] Bottom bar is visible at the bottom of the canvas area during campaign mode; absent in edit mode
- [ ] "Nodes: X / Y", "Endings: X / Y", "Edges: X / Y" readouts update correctly as the simulation advances
- [ ] "Overlay: ON" / "Overlay: OFF" button toggles the traversal edge highlight
- [ ] When overlay ON: traversed edges display in a distinct warm orange color, visually separate from the blue condition-pass pulse
- [ ] When overlay OFF: traversed edges show no special color (inert)
- [ ] Canvas height is unchanged from before this phase (no layout regression)
- [ ] Edit mode shows no bottom bar (or a collapsed/empty strip)

---

## Verification

Open the app. Enter campaign mode. Advance through 3 nodes. Confirm the bottom bar shows "Nodes: 3 / X", "Edges: 3 / X". If you advance into an ending, confirm "Endings: 1 / X". Click the "Overlay: OFF" button — traversed edges return to their default color. Click "Overlay: ON" — orange traversal path reappears. Exit campaign mode — bottom bar disappears (or shows zeros). Re-enter edit mode — canvas fills the same height as before.
