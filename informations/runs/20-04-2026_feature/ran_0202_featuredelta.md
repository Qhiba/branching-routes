# Feature Delta — Command_palette_toast_Visual_Node_Clustering

---

## What the system does NOT have now

- No command palette or searchable overlay — the only way to locate a specific node is to pan the canvas and visually scan
- No way to jump to a specific entity (node, flag, path, chapter) programmatically
- No toast notification system; no general-purpose user feedback API
- No visual indication of path or chapter membership on the canvas — the only access is through inspector dropdown values
- No explicit z-index scale; each overlay component (ContextMenu, NameModal) sets its own ad-hoc values, with no coordinated hierarchy

---

## What it will have after this feature

- `Ctrl+K` opens a searchable command palette covering all narrative entities (common/choice/ending nodes, flags, statuses, paths, chapters); selecting an entity pans and zooms the canvas to it via `canvas-navigate-to-node` DOM event
- Static action items in the palette (Create Common Node, Create Choice Node, Create Ending Node, Create Flag, Create Status, Create Path, Create Chapter) dispatch the matching store mutation or DOM event; authoring actions hidden during campaign mode, navigation items always visible
- Entity results show chapter/path context inline for disambiguation when multiple entities share the same label
- Top-right stacked auto-dismiss toast notifications with `info`/`success`/`warning`/`error` variants, owned by a new `toastStore`
- General-purpose `addToast(message, variant)` API — no hardcoded consumer content; downstream pushes (route tracing, etc.) call it independently
- Translucent colored regions rendered behind canvas nodes reflecting path and chapter membership: chapters as corner-based rounded SVG rectangles, paths as soft Gaussian-blur SVG regions (~20% opacity)
- `G` key cycles cluster mode: `off → chapter → path → both → off` (view shortcut, allowed in campaign mode)
- Cluster mode cycle button in TopBar
- Explicit z-index scale in `tokens.css`: `--z-cluster`, `--z-context-menu`, `--z-modal`, `--z-palette`, `--z-toast`

---

## What existing behavior is identical in both

- All authoring CRUD: node/edge/flag/status/path/chapter create, read, update, delete — unchanged
- Campaign mode lifecycle: enter, advance, exit, reset, snapshot — unchanged
- Sandbox overrides, passive analysis — unchanged
- IndexedDB auto-save, export/import, schema version 4 — unchanged; no schema bump
- All existing keyboard shortcuts: N, C, E, F, S, P, H, Del, Esc, V, L, R — unchanged
- All existing UI components: TopBar layout and handlers, Sidebar, NodeInspector, EdgeInspector, ContextMenu, NameModal, CreationBar — functional behavior unchanged
- Data model: no new fields on any entity in `narrativeStore`
- MiniMap: already present in GraphCanvas; not modified
