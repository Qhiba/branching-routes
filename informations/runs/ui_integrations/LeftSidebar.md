# LeftSidebar — Integration Phase Plan

## Purpose

The left-side data management panel. A 42px gutter shows four vertical nameplate tabs (Flags / Status / Chapter / Paths). Clicking a tab slides out a 320px content panel with a searchable entity list. Clicking the active tab collapses the panel. The entire component dims and becomes non-interactive during campaign mode.

**Internal sub-components (kept inside `LeftSidebar.jsx`):**
- `LeftNameplateTab` — individual vertical tab button
- `EntityListView` — search bar + scrollable row list with edit/delete

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `activePanel` | `string \| null` | Currently open tab: `'Flags'` \| `'Status'` \| `'Chapter'` \| `'Paths'` \| `null` |
| `onPanelChange` | `(id: string \| null) => void` | Called when a tab is clicked; null means collapse |
| `campaignMode` | `boolean` | Dims and locks the whole sidebar |
| `flags` | `{ id, name }[]` | Flag entity list |
| `statuses` | `{ id, name }[]` | Status entity list |
| `chapters` | `{ id, name }[]` | Chapter entity list |
| `paths` | `{ id, name }[]` | Path entity list |
| `onCreateEntity` | `(type: string) => void` | Called with entity type when "+" is clicked |
| `onEditEntity` | `(type: string, id: string) => void` | Called to open rename/edit UI |
| `onDeleteEntity` | `(type: string, id: string) => void` | Called to delete with guard |

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `activePanel` | Local `useState` in parent, or `uiStore` field if persistence is needed |
| `campaignMode` | `useSimulationStore(s => s.isCampaignActive)` |
| `flags` | `useNarrativeStore(s => Object.values(s.flag))` |
| `statuses` | `useNarrativeStore(s => Object.values(s.status))` |
| `chapters` | `useNarrativeStore(s => Object.values(s.chapter))` |
| `paths` | `useNarrativeStore(s => Object.values(s.path))` |
| `onCreateEntity('Flags')` | Open `CreationModal` with `entityType='Flags'` |
| `onCreateEntity('Status')` | Open `CreationModal` with `entityType='Status'` |
| `onCreateEntity('Chapter'/'Paths')` | Dispatch `canvas-open-name-modal` DOM event OR open `CreationModal` |
| `onEditEntity(type, id)` | Open `NameModal` with entity's current name pre-filled; on confirm call `narrativeStore.updateFlag/updateStatus/updateChapter/updatePath(id, { name })` |
| `onDeleteEntity('Flags', id)` | `narrativeStore.deleteFlag(id)` — store applies referential integrity scan |
| `onDeleteEntity('Status', id)` | `narrativeStore.deleteStatus(id)` |
| `onDeleteEntity('Chapter', id)` | `narrativeStore.deleteChapter(id)` |
| `onDeleteEntity('Paths', id)` | `narrativeStore.deletePath(id)` |

---

## Relationship to Existing Components

This component is the **visual shell** for the entity management UIs that currently live inside `Sidebar.jsx` (`FlagManager`, `StatusManager`, `PathChapterManager`). When integrating:

- The **existing `Sidebar.jsx`** (right panel) stays untouched.
- `LeftSidebar` is a **new** left panel that complements it.
- The "+" button flow uses `CreationModal` for Flag/Status (richer form) and `NameModal` (existing) for Chapter/Path.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 494–559. No visual changes.

---

## Files

- `LeftSidebar.jsx` — Component implementation
- `LeftSidebar.md` — This document
