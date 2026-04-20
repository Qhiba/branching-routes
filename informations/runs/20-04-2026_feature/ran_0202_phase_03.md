# Phase 3 — Visual Node Clustering

---

**Goal:** Render translucent colored regions behind canvas nodes to make path and chapter membership spatially visible — turning organizational labels into spatial regions on the canvas.

---

## What it adds

### `src/store/uiStore.js` (MODIFY)

Add `clusterMode: 'off'` to initial state. Add `cycleClusterMode` action:

```js
cycleClusterMode: () => set(state => {
  const next = { off: 'chapter', chapter: 'path', path: 'both', both: 'off' };
  return { clusterMode: next[state.clusterMode] };
})
```

`clusterMode` is a string primitive — AR-14 safe (no array/object reference). Not persisted to IndexedDB — resets to `'off'` on page reload (correct non-persistent behavior per scope).

---

### `src/hooks/useKeyboardShortcuts.js` (MODIFY)

Add `G` handler in the view shortcuts section (after R, before the `isCampaignActive` guard). `G` is a view-only toggle — allowed during campaign mode, same as V (snap) and L (tidy):

```js
if (e.key.toLowerCase() === 'g') {
  useUIStore.getState().cycleClusterMode();
  return;
}
```

---

### `src/components/TopBar.jsx` (MODIFY)

Read `clusterMode` and `cycleClusterMode` from `useUIStore`. Add cluster button after the Snap button in `topbar__right`:

```jsx
const clusterMode = useUIStore(s => s.clusterMode);
const cycleClusterMode = useUIStore(s => s.cycleClusterMode);

// In JSX:
<button onClick={cycleClusterMode} className="topbar__btn">
  Clusters: {clusterMode.toUpperCase()}
</button>
```

Button is NOT `disabled` during campaign mode — clustering is a view-only control.

---

### `src/components/GraphCanvas.jsx` (MODIFY)

**Introduce `ClusterOverlay` component** (defined in the same file as a local function component, above `GraphCanvasInner`):

```
ClusterOverlay({ chapterBoxes, pathBoxes })
  - props: pre-computed bounding boxes keyed by entity id
  - reads: clusterMode from useUIStore
  - reads: viewport from useViewport() — triggers re-render on pan/zoom
  - renders: <div class="cluster-overlay">
               <svg class="cluster-overlay__svg"
                    style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})`,
                             transformOrigin: '0 0' }}>
                 {/* chapter rects when clusterMode === 'chapter' | 'both' */}
                 {/* path blobs when clusterMode === 'path' | 'both' */}
               </svg>
             </div>
```

**Chapter regions:** SVG `<rect>` with `rx={8}` `ry={8}` (corner-based), fill from cluster color palette, `fillOpacity={0.15}`, `stroke` from same color, `strokeOpacity={0.4}`, `strokeWidth={1}`.

**Path regions:** SVG `<rect>` with `rx={0}` `ry={0}` (no corners), fill from cluster color palette, `fillOpacity={0.2}`, filtered with `feGaussianBlur stdDeviation="12"`. Gaussian blur applied via an SVG `<defs><filter id="blur-{entityId}">` per path. Using a blurred rectangle achieves the "soft blob smear" visual without requiring convex hull computation.

**Color hash function** — module-level constant (not inside any component):
```js
const CLUSTER_PALETTE = [
  '#a78bfa', '#34d399', '#f87171', '#60a5fa',
  '#fbbf24', '#a3e635', '#e879f9', '#2dd4bf'
];
function hashEntityColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLUSTER_PALETTE[Math.abs(hash) % CLUSTER_PALETTE.length];
}
```
Defined outside all components — stable reference, never recreated.

**Bounding box computation** — in `GraphCanvasInner` via `useMemo`, keyed on node position data:

```js
const allNodes = useMemo(() => [
  ...Object.values(common),
  ...Object.values(choice),
  ...Object.values(ending),
], [common, choice, ending]);

const clusterBoxes = useMemo(() => {
  const PADDING = 24;
  const NODE_W = 250, NODE_H = 150;
  const computeBoxes = (entityKey) => {
    const groups = {};
    allNodes.forEach(node => {
      const id = node.data[entityKey];
      if (!id) return;
      if (!groups[id]) groups[id] = [];
      groups[id].push(node.position);
    });
    return Object.entries(groups).map(([id, positions]) => {
      const xs = positions.map(p => p.x);
      const ys = positions.map(p => p.y);
      return {
        id, color: hashEntityColor(id),
        x: Math.min(...xs) - PADDING,
        y: Math.min(...ys) - PADDING,
        width: Math.max(...xs) - Math.min(...xs) + NODE_W + PADDING * 2,
        height: Math.max(...ys) - Math.min(...ys) + NODE_H + PADDING * 2,
      };
    });
  };
  return {
    chapterBoxes: computeBoxes('chapterId'),
    pathBoxes: computeBoxes('pathId'),
  };
}, [allNodes]);
```

`clusterBoxes` only recomputes when `allNodes` changes (node added/removed/moved). It does NOT recompute on viewport pan/zoom — those are handled entirely via CSS transform in `ClusterOverlay`.

**Render `<ClusterOverlay>` inside `GraphCanvasInner`:**

```jsx
<div ref={canvasRef} className={`canvas-wrapper ...`}>
  <ClusterOverlay
    chapterBoxes={clusterBoxes.chapterBoxes}
    pathBoxes={clusterBoxes.pathBoxes}
  />
  {/* ... existing modals ... */}
  <ReactFlow ...>
```

`ClusterOverlay` is the first child — it renders behind the React Flow node layer. The overlay uses `position: absolute; z-index: var(--z-cluster)` (value: `0`) which keeps it below React Flow's internal nodes (which use `z-index` values starting at 1 per `zIndex` prop on derived nodes).

---

### `src/styles/tokens.css` (MODIFY)

Add 8 cluster palette color tokens (see `ran_0202_filemap.md`). These are defined as CSS custom properties even though they're also used in the JS `CLUSTER_PALETTE` array — the tokens document the palette for CSS-side use (e.g. future legend styling).

---

### `src/styles/global.css` (MODIFY)

Append cluster overlay CSS after Phase 2 blocks:
- `.cluster-overlay`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; z-index: var(--z-cluster);`
- `.cluster-overlay__svg`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;`

---

## Produces

| Action | File |
|---|---|
| MODIFY | `src/store/uiStore.js` |
| MODIFY | `src/hooks/useKeyboardShortcuts.js` |
| MODIFY | `src/components/TopBar.jsx` |
| MODIFY | `src/components/GraphCanvas.jsx` |
| MODIFY | `src/styles/tokens.css` |
| MODIFY | `src/styles/global.css` |

---

## What it leaves temporarily incomplete

Nothing. This is the final phase. The feature is complete.

---

## What the next phase depends on from this phase

Nothing. No downstream push depends on clustering state.

---

## Reference files needed

- `src/store/uiStore.js` — current state shape (to append without breaking existing fields)
- `src/hooks/useKeyboardShortcuts.js` — current structure (to identify the view shortcuts section)
- `src/components/GraphCanvas.jsx` — full current file (to add `ClusterOverlay`, bounding box memo, and adjust render tree)
- `src/components/TopBar.jsx` — current file (to locate button placement in `topbar__right`)
- `src/styles/tokens.css` — current shape (to append cluster tokens)
- `src/styles/global.css` — current shape (to append cluster CSS)
- `ran_0201_scope.md` — cluster visual spec (chapter = corner-based, path = soft blob, ~20% opacity)

---

## Rollback cost

**MEDIUM.** Rollback: revert `uiStore.js` additions (remove 2 fields); remove `G` branch from `useKeyboardShortcuts.js`; remove cluster button from `TopBar.jsx`; remove `<ClusterOverlay>` render, `clusterBoxes` memo, and `allNodes` memo from `GraphCanvas.jsx`; remove `hashEntityColor` function and `CLUSTER_PALETTE` constant; remove token additions from `tokens.css`; remove CSS blocks from `global.css`. No new files to delete.

---

## Hard stop triggers

- Cluster regions are visually misaligned with nodes during pan or zoom (RISK-CP-01 — coordinate space mismatch; viewport transform not applied)
- Panning with clustering enabled is noticeably slower than without (RISK-CP-05 — bounding boxes re-computed per frame; check `useMemo` dep array)
- `cycleClusterMode` triggers an AR-14 re-render loop (should be impossible since it returns a string primitive — but verify)
- Clicking through the overlay does not reach nodes or edges (pointer-events leak — verify `pointer-events: none` on `.cluster-overlay` and `.cluster-overlay__svg`)
- Path cluster blur filter renders as a solid opaque rectangle (SVG filter not applying — check filter `id` uniqueness and reference syntax)

---

## Acceptance Criteria

Done when:
1. Pressing `G` cycles through `off → chapter → path → both → off` (label visible in TopBar button)
2. In `chapter` mode: corner-based rounded rectangles appear behind nodes that have a `chapterId` assigned; nodes without `chapterId` have no region; each chapter group gets a distinct color
3. In `path` mode: soft blurred regions appear behind nodes that have a `pathId` assigned; edges of the blob are diffuse (no sharp corners); each path group gets a distinct color
4. In `both` mode: both chapter and path overlays are visible simultaneously
5. In `off` mode: no overlays visible
6. Clusters remain spatially aligned with their nodes during pan and zoom
7. Clicking on a node covered by a cluster overlay selects the node normally (no pointer-event blocking)
8. The TopBar cluster button also cycles through the modes correctly
9. Cluster mode does not reset to `off` during the session unless explicitly cycled back

---

## Verification

Open the app with a graph that has at least 3 nodes: two assigned to the same chapter, one to a different chapter, and at least two nodes with `pathId` values.

1. Press `G` — TopBar button should read "Clusters: CHAPTER"; colored rounded rectangles appear behind the chapter-grouped nodes
2. Press `G` again — button reads "Clusters: PATH"; soft blurred blob regions appear behind path-grouped nodes
3. Press `G` again — button reads "Clusters: BOTH"; both rectangle and blob overlays are visible simultaneously
4. Press `G` again — button reads "Clusters: OFF"; all overlays disappear
5. Enable "Clusters: CHAPTER"; pan the canvas by clicking and dragging — confirm the chapter regions move with the nodes (stay aligned)
6. Zoom in and out — confirm the regions scale correctly with the canvas zoom
7. Click on a node that is inside a colored cluster region — confirm the node is selected and the inspector shows its properties (click passes through the overlay)
8. Click the cluster cycle button in TopBar — confirm it cycles the same as pressing G
