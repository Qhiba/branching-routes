# Phase 2 — Command Palette

---

**Goal:** Build the `Ctrl+K` searchable overlay that navigates the canvas to any entity and fires store actions — completing the keyboard-first authoring loop.

---

## What it adds

### `src/components/CommandPalette.jsx` (CREATE)

Internal state: `isOpen` (boolean), `query` (string, search input), `selectedIndex` (integer, keyboard cursor).

**Open/close:** Listens for `palette-toggle` DOM event on `window` via `useEffect` (attach on mount, remove on unmount). Toggles `isOpen`. Closes also on backdrop click and ESC.

**ESC handling (RISK-CP-03 mitigation):** Attaches a separate `keydown` listener on `window` (not on the panel div) that calls `event.stopPropagation()` before setting `isOpen(false)` when `e.key === 'Escape'`. This prevents the global hook's ESC → `clearSelection()` from firing. Identical pattern to `NameModal.jsx`.

**Search index:** `useMemo` over all `narrativeStore` entity collections (`common`, `choice`, `ending`, `flag`, `status`, `path`, `chapter`). Each item: `{ id, label, type, chapterName, pathName }`. Rebuilds only when any collection reference changes — not on every keystroke. Selector: `useNarrativeStore(s => s.common)` etc. — one selector per collection (targeted, AR-14 safe).

**Result filtering:** `items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))` — applied in render, not in the memo. Fast enough since the filtered list is computed from the already-built index.

**Result display — two sections:**
1. **Entities** — all narrative entities; always visible; each row shows entity label, type badge, and chapter/path context (e.g. `"Chapter 1 / Forest Route"`) for disambiguation
2. **Actions** — static list: Create Common Node, Create Choice Node, Create Ending Node, Create Flag, Create Status, Create Path, Create Chapter; hidden (`display: none` or conditional render) when `isCampaignActive`

**Keyboard navigation:**
- `↑` / `↓`: move `selectedIndex` through the visible list (clamped, does not wrap)
- `Enter`: confirm the currently selected item
- `Escape`: close (handled by the separate listener above)
- Tab: no special handling — normal browser tab behavior

**On entity select:** dispatch `window.dispatchEvent(new CustomEvent('canvas-navigate-to-node', { detail: { nodeId: item.id } }))`. Close the palette after dispatch.

**On action select:** dispatch the matching DOM event:
- Create Common/Choice/Ending Node → `canvas-open-node-modal` with `{ nodeType }`
- Create Flag/Status/Path/Chapter → `canvas-open-name-modal` with `{ entityType }`
Close palette after dispatch.

**Campaign mode:** reads `isCampaignActive` from `useSimulationStore`. Authoring action section hidden when active. Entity navigation always available.

**CSS classes:** `.palette-overlay`, `.palette-panel`, `.palette-search`, `.palette-section-label`, `.palette-results`, `.palette-item`, `.palette-item--selected`, `.palette-item__type-badge`, `.palette-item__context`.

---

### `src/hooks/useKeyboardShortcuts.js` (MODIFY)

Insert as the first check inside `handleKeyDown`, before the input-field guard:

```js
if (e.ctrlKey && e.key === 'k') {
  e.preventDefault(); // Firefox: suppress browser search-bar focus
  window.dispatchEvent(new Event('palette-toggle'));
  return;
}
```

Position requirement: this block must appear before the `if (e.target.tagName === 'INPUT' ...)` guard. Placement here ensures `Ctrl+K` fires even when the palette's own `<input>` is focused.

---

### `src/components/GraphCanvas.jsx` (MODIFY)

Add `setCenter` to the `useReactFlow()` destructure (it already imports `fitView` from the same hook). Add a new `useEffect`:

```js
useEffect(() => {
  const handleNavigate = (e) => {
    const { nodeId } = e.detail;
    const state = useNarrativeStore.getState();
    const node = state.common[nodeId] || state.choice[nodeId] || state.ending[nodeId];
    if (!node) return;
    // 125 / 75 match the Dagre layout node half-dimensions used in TopBar.jsx
    setCenter(node.position.x + 125, node.position.y + 75, { zoom: 1.2, duration: 400 });
  };
  window.addEventListener('canvas-navigate-to-node', handleNavigate);
  return () => window.removeEventListener('canvas-navigate-to-node', handleNavigate);
}, [setCenter]);
```

This follows the same DOM event pattern as `canvas-focus-node` (already in the file) — no new architectural pattern introduced.

---

### `src/App.jsx` (MODIFY)

Import `CommandPalette` from `components`. Render `<CommandPalette />` inside `.app` after `<Toast />`.

---

### `src/components/index.js` (MODIFY)

Add: `export { default as CommandPalette } from './CommandPalette';`

---

### `src/styles/global.css` (MODIFY)

Append Command Palette CSS blocks after the Toast blocks from Phase 1:
- `.palette-overlay`: `position: fixed; inset: 0; z-index: var(--z-palette); background: rgba(0,0,0,0.6); display: flex; align-items: flex-start; justify-content: center; padding-top: 15vh;`
- `.palette-panel`: `width: 520px; max-height: 60vh; overflow-y: auto; background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);`
- `.palette-search`: search input, full-width, no border, transparent background, large font size
- `.palette-section-label`: muted uppercase label for section headers
- `.palette-item`: `padding: var(--space-2) var(--space-4); display: flex; align-items: center; gap: var(--space-2); cursor: pointer;`
- `.palette-item--selected`: `background: var(--color-bg-hover);`
- `.palette-item__type-badge`: small pill with type color (reuse node type colors)
- `.palette-item__context`: `color: var(--color-text-muted); font-size: var(--font-size-sm);`

---

## Produces

| Action | File |
|---|---|
| CREATE | `src/components/CommandPalette.jsx` |
| MODIFY | `src/hooks/useKeyboardShortcuts.js` |
| MODIFY | `src/components/GraphCanvas.jsx` |
| MODIFY | `src/App.jsx` |
| MODIFY | `src/components/index.js` |
| MODIFY | `src/styles/global.css` |

---

## What it leaves temporarily incomplete

Nothing. The palette is fully functional after this phase. Phase 3 (clustering) is independent.

---

## What the next phase depends on from this phase

Nothing. Phase 3 has no dependency on Phase 2.

---

## Reference files needed

- `src/hooks/useKeyboardShortcuts.js` — to find the exact insertion point for Ctrl+K (before the input-field guard)
- `src/components/GraphCanvas.jsx` — to find `useReactFlow()` destructure and add `setCenter`; to place the new `useEffect` alongside existing event listeners
- `src/App.jsx` — current shape (mount point)
- `src/store/narrativeStore.js` — entity collection shapes for search index construction
- `src/components/NameModal.jsx` — ESC `stopPropagation` pattern to replicate exactly
- `src/styles/global.css` — current shape (append after Phase 1 blocks)
- `ran_0202_datamodelimpact.md` — `canvas-navigate-to-node` DOM event declaration

---

## Rollback cost

**MEDIUM.** Rollback: delete `CommandPalette.jsx`; remove `canvas-navigate-to-node` listener block from `GraphCanvas.jsx`; remove Ctrl+K block from `useKeyboardShortcuts.js`; remove `<CommandPalette />` from `App.jsx`; remove barrel export from `components/index.js`; remove CSS blocks from `global.css`. No store changes — Phase 2 adds no state.

---

## Hard stop triggers

- `canvas-navigate-to-node` event conflicts with or silently overwrites the existing `canvas-focus-node` handler (they must coexist as separate listeners)
- ESC inside the palette clears canvas selection (RISK-CP-03 — double-handling not mitigated)
- Ctrl+K does not fire when the palette input is focused (RISK-CP-04 — guard ordering wrong)
- Search index rebuilds on every keystroke instead of on store change (RISK-CP-04 variant — check memo deps)
- Palette renders during campaign mode and exposes authoring action buttons (must be hidden, not just disabled)

---

## Acceptance Criteria

Done when:
1. `Ctrl+K` opens the palette overlay from any state (canvas focused, no input focused)
2. `Ctrl+K` while typing in the palette search input closes the palette
3. Typing a partial node name shows matching results with type badges and chapter/path context
4. Pressing `↑`/`↓` moves the selection highlight; pressing `Enter` confirms
5. Selecting a node result dispatches `canvas-navigate-to-node` and the canvas pans and zooms to the node (visible animation)
6. Selecting "Create Flag" action opens the NameModal for flag creation
7. ESC closes the palette; the previously-selected node remains selected in the inspector
8. During active campaign mode: authoring action section is hidden; entity navigation works normally
9. Pressing `Ctrl+K` on Firefox does not focus the browser search bar

---

## Verification

Open the app with a loaded graph that has nodes assigned to chapters and paths.

1. Press `Ctrl+K` — confirm the palette overlay appears with a search input and two sections (Entities, Actions)
2. Type the first two letters of a node name — confirm matching results appear, each showing a type badge and chapter/path context
3. Press `↑`/`↓` to navigate the results — confirm the selected item highlights
4. Press `Enter` on a node result — confirm the canvas smoothly pans and zooms to that node
5. Press `Ctrl+K` again — confirm the palette closes
6. Select a node on the canvas; press `Ctrl+K`; press `ESC` — confirm the palette closes and the same node is still selected in the inspector
7. Enter campaign mode; press `Ctrl+K` — confirm entity results are visible; confirm the "Create Common Node" action and other authoring actions are not visible
8. Open the palette; click into the search input and type; press `Ctrl+K` — confirm the palette closes
