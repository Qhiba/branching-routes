# Phase 8 Execution Report — Cleanup & Dead Code

## Goal
Delete unreferenced legacy files from Phases 1–7, audit global.css for orphan selectors, verify `npm run build` succeeds with no console warnings and bundle size holds or drops.

## Files Deleted

| Path | Reason |
|---|---|
| `src/components/Sidebar.jsx` | Wrapper that only hosted NodeInspector / EdgeInspector / SandboxPanel fallbacks; inspectors superseded, Sandbox now hosted directly in `RightSidebar`. |
| `src/components/NodeInspector.jsx` | Superseded by `modals/NodeConfigModal.jsx` (Phase 6). |
| `src/components/OptionEditor.jsx` | Only imported by NodeInspector; absorbed into NodeConfigModal's option editing. |
| `src/components/VariantEditor.jsx` | Only imported by NodeInspector; absorbed into NodeConfigModal's variant editing. |
| `src/components/EdgeInspector.jsx` | Superseded by `modals/EdgeConfigModal.jsx` (Phase 6). |
| `src/components/CampaignSelector.jsx` | Superseded by `panels/CampaignListPanel.jsx` (Phase 3). |
| `src/components/RouteFinderDialog.jsx` | Superseded by `panels/RouteTracingPanel.jsx` (Phase 3). |
| `src/components/CampaignBanner.jsx` | Unmounted in Phase 7 Fix 4 (FloatingMiddleBar pulse already signals campaign-active state). |
| `src/components/CampaignBanner.css` | Stylesheet for deleted CampaignBanner. |

`CreationBar.jsx` was already deleted in Phase 5 (visible in pre-phase `git status`).

## Files Modified

| Path | Change |
|---|---|
| `src/App.jsx` | Removed `RouteFinderDialog` import from `components` barrel; removed `<RouteFinderDialog />` mount. Comment marks removal. |
| `src/components/index.js` | Removed barrel exports for `Sidebar`, `EdgeInspector`, `CampaignSelector`, `RouteFinderDialog`, `CampaignBanner`. Left REMOVED-comment markers noting the superseding components. |
| `src/components/layout/RightSidebar.jsx` | Replaced `Sidebar` wrapper with direct `SandboxPanel` mount inside a padded scrollable container. Renamed fourth tab from `Legacy Panel` to `Sandbox`. `SandboxPanel` is the only remaining consumer; the tab preserves the authoring-time sandbox override functionality that lived in Sidebar's campaign-active fallback. |
| `src/store/uiStore.js` | Removed `showRouteFinderDialog` state and `toggleRouteFinderDialog` action — only `RouteFinderDialog.jsx` (deleted) referenced them. |
| `src/styles/global.css` | Audited for orphan selectors. Removed: legacy `.topbar-content`, `.topbar__left`, `.topbar__center`, `.topbar__right` blocks (TopBar restyled in Phase 4 with `ui-v2-*` classes in `TopBar.css`); `header.campaign-mode .file-actions` (selector unused); `.topbar__creation-bar` and `.creation-bar__btn` (CreationBar deleted in Phase 5); `.status-strip` + `.status-strip__readout/__label/__count/__toggle` (StatusStrip restyled in Phase 7 with `ui-v2-status-strip` classes in `StatusStrip.css`); the entire `.route-finder-dialog__*` block (~310 lines — component deleted, replacement uses `RightPanels.css`). |

## CSS Orphan Audit — Results

- **Removed (verified unreferenced):** `.topbar-content`, `.topbar__left strong`, `.topbar__center input`, `.topbar__right`, `.topbar__right button`, `header.campaign-mode .file-actions`, `.topbar__creation-bar`, `.creation-bar__btn`, `.status-strip`, `.status-strip__readout`, `.status-strip__label`, `.status-strip__count`, `.status-strip__toggle`, `.route-finder-dialog__*` (20+ rules).
- **Retained intentionally:** `.sandbox-panel*` rules — `SandboxPanel.jsx` still references them; the panel is now mounted inside `RightSidebar`'s "Sandbox" tab.
- **Retained intentionally:** `.name-modal*` — `NameModal.jsx` still consumes them.
- **Retained intentionally:** `.story-node*`, `.conditional-edge*`, `.react-flow__*`, `.toast*`, `.palette*`, `.cluster-overlay*`, `.context-menu*`, `.common-node*`, `.choice-node*`, `.ending-node*`, `.campaign-mode .react-flow__*` — actively used.

## Build Verification

```
> vite build
✓ 2221 modules transformed.
dist/index.html                   0.81 kB │ gzip:   0.47 kB
dist/assets/index-E1kfa-XW.css   79.24 kB │ gzip:  12.52 kB
dist/assets/index-SVGvGMsh.js   679.69 kB │ gzip: 200.98 kB
✓ built in 342ms
```

No errors, no warnings beyond the pre-existing chunk-size advisory (which is unrelated to this phase and was present before Phase 8). Build succeeds.

## Flags Raised

- **AMBIGUOUS — Sandbox tab retention:** The plan file map marks `Sidebar.jsx` as "possibly deleted"; the `new_ui_vision.jsx` reference shows only 3 right-sidebar tabs (no Sandbox). However, `SandboxPanel` provides functional campaign-time authoring overrides via `applySandboxOverride`, which is an active feature on `simulationStore` (AR-08). Deleting the Sandbox UI would silently remove live functionality, which exceeds the scope of "cleanup and dead code." I assumed the safer course: retain `SandboxPanel`, mount it directly in `RightSidebar` under a renamed "Sandbox" tab, and delete only the `Sidebar.jsx` wrapper. If the user intends `SandboxPanel` itself to be retired, that is a separate feature-scope decision, not Phase 8 cleanup.

- **NOTE — Existing chunk-size warning:** The `> 500 kB chunk` warning existed before this push and is unrelated to cleanup. Not fixing here.

## Full File List

### Deleted
- `F:/Projects/Web/branching-routes/src/components/Sidebar.jsx`
- `F:/Projects/Web/branching-routes/src/components/NodeInspector.jsx`
- `F:/Projects/Web/branching-routes/src/components/OptionEditor.jsx`
- `F:/Projects/Web/branching-routes/src/components/VariantEditor.jsx`
- `F:/Projects/Web/branching-routes/src/components/EdgeInspector.jsx`
- `F:/Projects/Web/branching-routes/src/components/CampaignSelector.jsx`
- `F:/Projects/Web/branching-routes/src/components/RouteFinderDialog.jsx`
- `F:/Projects/Web/branching-routes/src/components/CampaignBanner.jsx`
- `F:/Projects/Web/branching-routes/src/components/CampaignBanner.css`

### Modified
- `F:/Projects/Web/branching-routes/src/App.jsx`
- `F:/Projects/Web/branching-routes/src/components/index.js`
- `F:/Projects/Web/branching-routes/src/components/layout/RightSidebar.jsx`
- `F:/Projects/Web/branching-routes/src/store/uiStore.js`
- `F:/Projects/Web/branching-routes/src/styles/global.css`
