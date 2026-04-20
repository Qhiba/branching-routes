# Phase Overview — Command_palette_toast_Visual_Node_Clustering

---

| # | Name | Goal | Reference files needed |
|---|---|---|---|
| 1 | Toast Infrastructure | Ship the general-purpose `addToast` API and `Toast` component as fully standalone infrastructure, independently testable before any other sub-feature | `src/store/index.js`, `src/components/index.js`, `src/App.jsx`, `src/styles/tokens.css`, `src/styles/global.css`, `src/utils/uuid.js` |
| 2 | Command Palette | Build the `Ctrl+K` searchable overlay that navigates to entities and fires store actions | `src/hooks/useKeyboardShortcuts.js`, `src/components/GraphCanvas.jsx`, `src/App.jsx`, `src/store/narrativeStore.js`, `src/components/NameModal.jsx`, `src/styles/global.css`, `ran_0202_datamodelimpact.md` |
| 3 | Visual Node Clustering | Render translucent colored regions behind canvas nodes reflecting path and chapter membership | `src/store/uiStore.js`, `src/hooks/useKeyboardShortcuts.js`, `src/components/GraphCanvas.jsx`, `src/components/TopBar.jsx`, `src/styles/tokens.css`, `src/styles/global.css`, `ran_0201_scope.md` (cluster visual specs) |

---

## Dependency order

```
Phase 1 (Toast) → independent, no upstream dependencies
Phase 2 (Palette) → can optionally call addToast from Phase 1, but not required
Phase 3 (Clustering) → fully independent of Phase 1 and Phase 2
```

All three phases are independently stoppable. If the project stops after Phase 1, a working toast infrastructure is shipped. If it stops after Phase 2, a working palette is shipped. Phase 3 adds clustering without depending on Phase 1 or 2.

---

## Rollback summary

| Phase | Rollback cost | Rollback scope |
|---|---|---|
| 1 | LOW | Delete `toastStore.js` + `Toast.jsx`; remove 1 line from each of `store/index.js`, `components/index.js`, `App.jsx`; remove token and CSS additions |
| 2 | MEDIUM | Delete `CommandPalette.jsx`; remove `canvas-navigate-to-node` listener from `GraphCanvas.jsx`; remove Ctrl+K branch from `useKeyboardShortcuts.js`; remove mount point from `App.jsx`; remove CSS block from `global.css` |
| 3 | MEDIUM | Revert `uiStore.js` (remove 2 fields); remove G branch from `useKeyboardShortcuts.js`; remove cluster button from `TopBar.jsx`; remove `<ClusterOverlay>` render and related code from `GraphCanvas.jsx`; remove token and CSS additions |
