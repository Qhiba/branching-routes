# Phase Overview — Context_menus_keyboard_shortcuts_creation_bar

---

| Phase | Name | Goal | Reference Files Needed |
|---|---|---|---|
| 1 | Foundation | Establish the `hooks/` directory and alias, add `selectedNodeIds` and `labelDisplayMode` to `uiStore`, scaffold the keyboard hook (listener only, no dispatch), migrate ESC handler, wire multi-select | `vite.config.js`, `src/store/uiStore.js`, `src/components/GraphCanvas.jsx`, `ran_0201_scope.md`, `ran_0202_filemap.md`, `ran_0202_risks.md` |
| 2 | Keyboard Shortcuts, Naming Modal, and Label Display Mode | Implement full shortcut dispatch (N/C/E via `canvas-add-node`, F/S/P/H via `canvas-open-name-modal`, R → `toggleLabelDisplayMode`); create `NameModal.jsx`; implement verbose label rendering on `CommonNode`, `ChoiceNode`, and `ConditionalEdge` | `src/hooks/useKeyboardShortcuts.js`, `src/components/NameModal.jsx` (new), `src/components/GraphCanvas.jsx`, `src/components/nodes/CommonNode.jsx`, `src/components/nodes/ChoiceNode.jsx`, `src/components/edges/ConditionalEdge.jsx`, `src/store/narrativeStore.js` (read-only), `src/store/uiStore.js` (read-only), `src/store/simulationStore.js` (read-only), `ran_0202_risks.md` (RISK-CMK-01, RISK-CMK-07, RISK-CMK-08, RISK-CMK-09) |
| 3 | Context Menu | Build `ContextMenu.jsx`, wire all four right-click targets in `GraphCanvas`, implement viewport-edge flip and dismiss logic | `src/components/GraphCanvas.jsx`, `src/components/ContextMenu.jsx` (new), `src/components/index.js`, `src/styles/global.css`, `ran_0202_risks.md` (RISK-CMK-02, RISK-CMK-04, RISK-CMK-05) |
| 4 | Creation Bar | Build `CreationBar.jsx`, mount in `TopBar`; node buttons use `canvas-add-node` event; metadata buttons use `canvas-open-name-modal` event (no auto-name generation) | `src/components/CreationBar.jsx` (new), `src/components/TopBar.jsx`, `src/components/GraphCanvas.jsx`, `src/components/index.js`, `src/styles/global.css`, `ran_0202_risks.md` (RISK-CMK-07, RISK-CMK-08) |
