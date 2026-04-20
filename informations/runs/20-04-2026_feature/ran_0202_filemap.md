# File Map — Command_palette_toast_Visual_Node_Clustering

> Per AR-21: every CSS addition to `global.css` or `tokens.css` is listed as an explicit entry.

---

## New files

### `src/store/toastStore.js` — CREATE — Phase 1
**What changes:** New Zustand store. Initial state: `toasts: []`. Actions: `addToast(message, variant, duration?)`, `removeToast(id)`. `addToast` generates a `toast-` prefixed ID, pushes to `toasts`, and schedules `setTimeout → removeToast`. Timeout handle stored per-toast so manual dismiss cancels the timer. No imports from `narrativeStore` or `simulationStore` (would risk circular imports per AR-06).

**What must NOT change:** N/A (new file).

---

### `src/components/Toast.jsx` — CREATE — Phase 1
**What changes:** New fixed-position overlay component. Reads `toasts` from `useToastStore(s => s.toasts)`. Renders `.toast-container` (top-right, fixed, `z-index: var(--z-toast)`). Each toast is a `.toast .toast--{variant}` card with message text, variant icon, and an `×` dismiss button that calls `removeToast(id)`. No local state needed — visibility is derived from `toasts.length > 0`. Mounts in `App.jsx`.

**What must NOT change:** N/A (new file).

---

### `src/components/CommandPalette.jsx` — CREATE — Phase 2
**What changes:** New fixed overlay component. Internal state: `isOpen` (boolean, toggled by `palette-toggle` DOM event), `query` (string, search input). Renders a full-screen `.palette-overlay` backdrop and a centered `.palette-panel`. Search index built via `useMemo` over all `narrativeStore` entity collections — rebuilds only when store collections change, not on every keystroke. Results filtered by `query.toLowerCase()` substring match. Two sections: Entities (navigate) and Actions (authoring, hidden when `isCampaignActive`). Entity rows show type badge + chapter/path context. Keyboard nav: `↑`/`↓` moves selection, `Enter` confirms, `ESC` closes with `event.stopPropagation()`. On entity select: dispatches `canvas-navigate-to-node` DOM event with `{ nodeId }`. On action select: dispatches matching `canvas-add-node` or `canvas-open-name-modal` event. Backdrop click closes. Listens for `palette-toggle` DOM event on `window`.

**What must NOT change:** N/A (new file).

---

## Modified files

### `src/App.jsx` — MODIFY — Phase 1, Phase 2
**What changes:**
- Phase 1: import `Toast`; render `<Toast />` inside `.app` div after `<aside>`. `Toast` uses `position: fixed` so it doesn't affect the grid.
- Phase 2: import `CommandPalette`; render `<CommandPalette />` after `<Toast />`. Also uses `position: fixed`.

**What must NOT change:** The `.app` CSS grid; the three existing children and their grid-area assignments (`app__topbar`, `app__canvas`, `app__sidebar`); `App.css` import.

---

### `src/store/index.js` — MODIFY — Phase 1
**What changes:** Add one line: `export { useToastStore } from './toastStore.js';`

**What must NOT change:** The existing four exports (`useNarrativeStore`, `useSimulationStore`, `useCampaignStore`, `useUIStore`).

---

### `src/components/index.js` — MODIFY — Phase 1, Phase 2
**What changes:**
- Phase 1: add `export { default as Toast } from './Toast';`
- Phase 2: add `export { default as CommandPalette } from './CommandPalette';`

**What must NOT change:** All 21 existing component exports.

---

### `src/styles/tokens.css` — MODIFY — Phase 1, Phase 3

**Phase 1 additions** (z-index scale + toast colors):
```css
/* Z-index scale */
--z-cluster:       0;
--z-context-menu:  100;
--z-modal:         200;
--z-palette:       300;
--z-toast:         400;

/* Toast semantic colors */
--color-toast-info:    #7393f8;
--color-toast-success: #4caf7d;
--color-toast-warning: #f8ab54;
--color-toast-error:   #e56666;
```

**Phase 3 additions** (cluster palette — 8 distinct colors visually separate from node type colors):
```css
--cluster-color-0: #a78bfa;  /* violet */
--cluster-color-1: #34d399;  /* emerald */
--cluster-color-2: #f87171;  /* rose */
--cluster-color-3: #60a5fa;  /* blue */
--cluster-color-4: #fbbf24;  /* amber */
--cluster-color-5: #a3e635;  /* lime */
--cluster-color-6: #e879f9;  /* fuchsia */
--cluster-color-7: #2dd4bf;  /* teal */
```

**What must NOT change:** Invariant comment DC-07; all existing token names and values; no light-mode media query blocks; no modifications to existing color, spacing, typography, or shadow tokens.

---

### `src/styles/global.css` — MODIFY — Phase 1, Phase 2, Phase 3

**Phase 1 additions** — append to end of file:
- `.toast-container`: `position: fixed; top: var(--space-4); right: var(--space-4); z-index: var(--z-toast); display: flex; flex-direction: column; gap: var(--space-2); pointer-events: none;`
- `.toast`: card styles — background, border, padding, border-radius, shadow; `pointer-events: auto`
- `.toast--info`, `.toast--success`, `.toast--warning`, `.toast--error`: left-border accent colors using toast color tokens

**Phase 2 additions** — append after Phase 1 blocks:
- `.palette-overlay`: full-screen backdrop, `position: fixed; inset: 0; z-index: var(--z-palette); background: rgba(0,0,0,0.6);`
- `.palette-panel`: centered panel, `position: absolute; top: 20%; left: 50%; transform: translateX(-50%); width: 520px; max-height: 60vh; overflow-y: auto; background: var(--color-bg-elevated); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);`
- `.palette-input`: search input styles
- `.palette-results`: results list wrapper
- `.palette-item`, `.palette-item--selected`: result row styles; selected state uses `--color-bg-hover` background
- `.palette-item__badge`, `.palette-item__context`: entity type badge and chapter/path disambiguation text

**Phase 3 additions** — append after Phase 2 blocks:
- `.cluster-overlay`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden;`
- `.cluster-overlay__svg`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;`

**What must NOT change:** `@import './tokens.css'` at top; all existing CSS blocks from prior iterations; order of existing rules; all simulation state classes; all node/edge component styles.

---

### `src/store/uiStore.js` — MODIFY — Phase 3
**What changes:** Add `clusterMode: 'off'` to initial state. Add `cycleClusterMode` action using a lookup-table cycle (no switch statement):
```js
cycleClusterMode: () => set(state => {
  const next = { off: 'chapter', chapter: 'path', path: 'both', both: 'off' };
  return { clusterMode: next[state.clusterMode] };
})
```

**What must NOT change:** All existing state fields (`selectedNodeId`, `selectedEdgeId`, `selectedNodeIds`, `snapToGrid`, `choiceDisplayMode`, `labelDisplayMode`); all existing actions and their signatures; the `setSelectedNodeIds` order-independent equality check; the `clearSelection` and `resetSelection` implementations.

---

### `src/hooks/useKeyboardShortcuts.js` — MODIFY — Phase 2, Phase 3

**Phase 2 addition** — add BEFORE the input-field guard block (first check inside `handleKeyDown`):
```js
// Ctrl+K: toggle palette — fires even when palette input is focused
if (e.ctrlKey && e.key === 'k') {
  e.preventDefault();
  window.dispatchEvent(new Event('palette-toggle'));
  return;
}
```

**Phase 3 addition** — add in the view shortcuts section, after the `R` key handler, BEFORE the `isCampaignActive` guard:
```js
if (e.key.toLowerCase() === 'g') {
  useUIStore.getState().cycleClusterMode();
  return;
}
```
`G` is a view shortcut (like V, L, R) — allowed during campaign mode.

**What must NOT change:** Input-field guard block (`INPUT`/`TEXTAREA`/`isContentEditable` check); campaign-mode guard placement; all existing shortcut handlers (N, C, E, F, S, P, H, Del, Esc, V, L, R); `isCampaignActive` in the `useEffect` dependency array.

---

### `src/components/TopBar.jsx` — MODIFY — Phase 3
**What changes:** Read `clusterMode` and `cycleClusterMode` from `useUIStore`. Add a cluster cycle button in `topbar__right` after the Snap button:
```jsx
<button onClick={cycleClusterMode} className="topbar__btn">
  Clusters: {clusterMode.toUpperCase()}
</button>
```
Button is NOT disabled during campaign mode (cluster toggle is a view-only control, same as Snap to Grid).

**What must NOT change:** All existing layout regions (`topbar__left`, `topbar__center`, `topbar__right`); all existing handlers (`handleNew`, `handleImport`, `handleExport`, `handleTidyLayout`); all existing button disabled states tied to `isCampaignActive`; `CampaignSelector` and `CreationBar` mount points.

---

### `src/components/GraphCanvas.jsx` — MODIFY — Phase 2, Phase 3

**Phase 2 addition** — new `useEffect` in `GraphCanvasInner`:
```js
useEffect(() => {
  const handleNavigate = (e) => {
    const { nodeId } = e.detail;
    const state = useNarrativeStore.getState();
    const node = state.common[nodeId] || state.choice[nodeId] || state.ending[nodeId];
    if (!node) return;
    setCenter(node.position.x + 125, node.position.y + 75, { zoom: 1.2, duration: 400 });
  };
  window.addEventListener('canvas-navigate-to-node', handleNavigate);
  return () => window.removeEventListener('canvas-navigate-to-node', handleNavigate);
}, [setCenter]);
```
`setCenter` from `useReactFlow()` — already partially destructured in the file via `fitView`; add `setCenter` to the same destructure.

**Phase 3 addition** — introduce `<ClusterOverlay>` as a separate component defined in the same file (or a sibling file):
- `ClusterOverlay` reads `clusterMode` from `useUIStore`; reads node positions from `narrativeStore`; reads `path`/`chapter` dictionaries from `narrativeStore`; uses `useViewport()` for the transform
- Bounding box computation is in a `useMemo` inside `ClusterOverlay`, keyed on the flat node position map — does not re-run on every pan frame
- Apply the viewport transform via inline style on the SVG wrapper: `transform: translate(${x}px, ${y}px) scale(${zoom})`; `transformOrigin: '0 0'`
- Renders inside `GraphCanvasInner`, as the first child of canvas-wrapper div (before `<ReactFlow>`), so it appears behind nodes
- `<svg>` uses `overflow: visible` to extend beyond viewport bounds; outer div clips to canvas

**What must NOT change:** All existing event listener `useEffect` blocks; `onNodeClick` campaign-advance logic; `runPassiveAnalysis` trigger; `onConnect` edge-stamping; `onNodeDragStop` multi-select position persistence; `ReactFlowProvider` wrapper; all `onContext*` handlers.
