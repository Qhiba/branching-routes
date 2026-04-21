# PrimaryTopBar — Integration Phase Plan

## Purpose

The fixed 56px header bar at the very top of the app shell. Handles branding, editable project title, canvas controls (Tidy Layout / Snap / Clusters), and file actions (New / Import / Export).

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `projectName` | `string` | Current project title shown in the text input |
| `onProjectNameChange` | `(name: string) => void` | Fires on every keystroke in the title input |
| `onTidyLayout` | `() => void` | Triggers Dagre auto-layout |
| `snapEnabled` | `boolean` | Whether Snap-to-Grid is ON |
| `onSnapToggle` | `() => void` | Toggles snap-to-grid |
| `clustersEnabled` | `boolean` | Whether cluster overlay is on |
| `onClustersToggle` | `() => void` | Cycles cluster mode |
| `onNew` | `() => void` | Creates a new blank project |
| `onImport` | `() => void` | Opens the import file dialog |
| `onExport` | `() => void` | Exports the current project |

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `projectName` | `useNarrativeStore(s => s.meta.title)` |
| `onProjectNameChange` | `narrativeStore.updateMeta({ title: name })` |
| `snapEnabled` | `useUIStore(s => s.snapToGrid)` |
| `onSnapToggle` | `uiStore.toggleSnapToGrid()` |
| `clustersEnabled` | `useUIStore(s => s.clusterMode !== 'off')` |
| `onClustersToggle` | `uiStore.cycleClusterMode()` |
| `onTidyLayout` | Dispatch `canvas-layout-tidy` DOM event → `GraphCanvas` handles (AR-19) |
| `onNew` | `TopBar.jsx` → `handleNew()` (clears IndexedDB + stores + newGraph) |
| `onImport` | `TopBar.jsx` → `handleImport()` (importProject utility) |
| `onExport` | `TopBar.jsx` → `handleExport()` (exportProject utility) |

---

## Integration Notes

- **This component is a drop-in replacement** for the top section of the existing `TopBar.jsx`. The existing `TopBar.jsx` also mounts `<CampaignSelector />`, `<CreationBar />`, and campaign-active controls — those are handled by `FloatingMiddleBar` in this design split.
- The `Snap: ON/OFF` button now reads from `snapEnabled` prop and shows the correct label without any internal state.
- `Clusters: ON/OFF` reflects `clusterMode !== 'off'` — a simplified binary for the button label. The actual four-state cycle (`off → chapter → path → both`) runs in `uiStore.cycleClusterMode()`.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 78–119. No visual changes.

---

## Files

- `PrimaryTopBar.jsx` — Component implementation
- `PrimaryTopBar.md` — This document
