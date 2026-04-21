# UI Integration Plan: `ui_design.jsx` → Real App

> **NOTE:** The prototype is a **self-contained visual mock**. It uses hard-coded local state and Tailwind classes.
> The real app uses **Zustand stores**, **BEM CSS classes**, and a **Vite + React** setup.
> This plan only replaces *visual structure* — all store wiring must stay intact.

---

## Quick Reference: What Is and Isn't Changing

| Scope | Status |
|---|---|
| Store logic (Zustand) | ✅ Keep as-is |
| Campaign / simulation logic | ✅ Keep as-is |
| CSS design tokens (`tokens.css`) | ✅ Keep as-is |
| `App.jsx` grid layout | ✅ Keep as-is |
| TopBar: visual structure | 🔄 Refactor JSX → match prototype |
| TopBar: campaign floating bar | 🆕 New sub-component |
| Sidebar: nameplate / accordion layout | 🔄 Replace tab bar with nameplate tabs |
| StatusStrip: bottom bar layout | 🔄 Style update only (data all correct) |
| Left sidebar: Flags/Status/Chapter/Paths | 🔄 Visual lift (already functional) |
| Right sidebar: Nodes / Route Tracing / Campaign | 🔄 New layout wrapper needed |
| NodeConfigModal | 🆕 New full-featured modal |
| CreationModal (Flag/Status quick-create) | 🔄 Minor polish only |

---

## Phase 1 — Reskin the TopBar (Moderate Risk)

**Target file:** `src/components/TopBar.jsx`  
**Risk:** Medium — must preserve all store calls and event handlers exactly.

### What the prototype shows
- A **single horizontal bar** with: Brand logo | Project title input | View controls group (Tidy, Snap, Clusters) | File actions group (New, Import, Export)
- When campaign is active: the center bar becomes a **floating pill** (absolutely positioned in the canvas area) showing: `● CampaignName | Undo | Reset | [Exit]`
- The floating pill is **not** inside TopBar — it overlays the canvas.

### What to do

**Step 1a — Restructure `TopBar.jsx` JSX** to match the prototype's 4-section layout:
```
[Brand] | [Title Input] | [View Controls] | [File Actions] + [Campaign/Start]
```
All existing handlers (`handleTidyLayout`, `handleNew`, `handleImport`, `handleExport`) stay unchanged — only change the wrapper `<div>` structure and CSS classes.

**Step 1b — Add the floating campaign bar to `GraphCanvas.jsx`** (or `App.jsx`).  
This is a new `<div>` that renders absolutely over the canvas when `isCampaignActive` is true:
```jsx
// Inside the canvas area, when isCampaignActive:
<div className="floating-campaign-bar">
  <span className="fcb__name">● {activeCampaignName}</span>
  <button onClick={undoLastNode}>Undo</button>
  <button onClick={resetSimulation}>Reset</button>
  <button onClick={exitCampaign}>Exit</button>
</div>
```
Add corresponding CSS in `global.css` under a `/* ADDED: UI Refresh — Floating Campaign Bar */` comment.

> **IMPORTANT:** Do NOT move campaign logic from stores into the component. Only move the **render location** of the campaign pill from the TopBar area to floating-over-canvas.

**Step 1c — Update `CampaignSelector.jsx`** to render inside the floating bar instead of the TopBar right section when campaign is active.

---

## Phase 2 — Reskin the Left Sidebar (Low Risk)

**Target file:** `src/components/Sidebar.jsx` (and its sub-panels)  
**Risk:** Low — the sidebar is almost entirely view-only with minimal store interaction.

### What the prototype shows
- **Vertical nameplate tabs** (rotated text, 42px wide, slide in/out) on the left edge
- Tab IDs: `Flags`, `Status`, `Chapter`, `Paths`
- Panel slides in with `300px` width, containing a search bar + list + "+" create button
- All tabs are **disabled / dimmed** when `isCampaignActive`

### What to do
The existing `Sidebar.jsx` has horizontal tabs and a fixed 300px panel. Replace the `<div className="sidebar-tabs">` and its children with the **nameplate tab** pattern from the prototype.

The child panels (`FlagManager`, `StatusManager`, `PathChapterManager`) remain unchanged — just wrap them in the new sliding panel container.

```css
/* Add to global.css */
.nameplate-tab { writing-mode: vertical-rl; text-orientation: mixed; /* ... */ }
.left-sidebar { display: flex; height: 100%; }
.left-sidebar__rail { width: 42px; /* ... */ }
.left-sidebar__panel { transition: width 300ms ease; overflow: hidden; }
.left-sidebar__panel--open { width: 320px; }
.left-sidebar__panel--closed { width: 0; }
```

> **WARNING:** The `App.css` grid currently sets `grid-template-columns: 1fr 300px`. If you add a left sidebar column, update the grid to `42px 1fr 300px` (or `320px 1fr 42px` when the panel is open). Consider using a CSS variable for the left-panel width so it can be toggled dynamically.

---

## Phase 3 — Reskin the Right Sidebar (Medium Risk)

**Target file:** `src/components/Sidebar.jsx` → split into `LeftSidebar.jsx` + `RightSidebar.jsx`  
**Risk:** Medium — the Nodes list connects to `useUIStore` for selection; Route Tracing triggers `toggleRouteFinderDialog`.

### What the prototype shows
- Mirror of the left sidebar, but on the **right edge**
- Tab IDs: `Nodes`, `Route Tracing`, `Campaign List`
- `Nodes` panel: tab bar (Common/Choice/Ending) + search + filterable node list with Edit/Delete per item
- `Route Tracing` panel: target node selector + tie-breaking priorities + "Run Trace" button
- `Campaign List` panel: create input + campaign list with Enter/Delete actions
- Right sidebar is **disabled / dimmed** when `isCampaignActive`

### What to do
Split the current `Sidebar.jsx` into two files:

1. **`LeftSidebar.jsx`** — wraps `FlagManager`, `StatusManager`, `PathChapterManager` with nameplate tabs
2. **`RightSidebar.jsx`** — contains Nodes list + `RouteFinderDialog` trigger + `CampaignSelector`

Store mapping for `RightSidebar.jsx`:

| Prototype section | Real store / component |
|---|---|
| Node list (Common/Choice/Ending) | `useNarrativeStore(s => s.common/choice/ending)` |
| Edit button → open node config | `useUIStore(s => s.setSelectedNodeId)` |
| Route Tracing | `toggleRouteFinderDialog` (already in `useUIStore`) |
| Campaign List | `useCampaignStore` (already fully implemented) |

Update `App.jsx` to import both new components and place them in the correct grid areas.

---

## Phase 4 — New NodeConfigModal (High Risk / High Value)

**Target file:** New `src/components/NodeConfigModal.jsx`  
**Risk:** High — this modal needs to read AND write node data from `useNarrativeStore`, replacing the existing `NodeInspector.jsx` flow.

### What the prototype shows
- A **full-screen backdrop modal** (2-column for Common/Choice, 1-column for Ending)
- **Left column:** Label input, Description textarea, Chapter/Path selects, "Set as Start Node" toggle
- **Right column:** On-Enter Modifiers (Set Flags, Status Modifiers) + Branching Options/Variants with sub-conditions builder (AND/OR segmented control)
- Header: node type badge + node title + close button
- Footer: Cancel | Save Node

### What to do

> **CAUTION:** This is the most complex piece. Do NOT attempt this in the same session as the layout changes. Treat it as a separate iteration.

1. Audit `NodeInspector.jsx`, `OptionEditor.jsx`, and `VariantEditor.jsx` to understand the existing data shape and store write patterns.
2. The new modal **wraps the same logic** — it re-presents it in the 2-column layout using the existing data.
3. Trigger: the Edit button on a node card in `RightSidebar.jsx` calls `useUIStore(s => s.setSelectedNodeId)` and sets a new `nodeConfigModalOpen` UI flag.

---

## Phase 5 — StatusStrip Visual Update (Low Risk)

**Target file:** `src/components/StatusStrip.jsx`  
**Risk:** Very low — all data selectors are correct; only layout/style changes needed.

### What the prototype shows
- Full-width bottom bar always visible with left section: `[24 Common] [12 Choice] [3 Ending] | [Flags: 8] [Statuses: 4] [Paths: 2] [Chapters: 1]`
- When campaign active: right section appended with `Nodes: 1/9 | Endings: 0/3 | Edges: 0/8 | Dead-ends: 0 | [Overlay: ON]`
- The **left section is always visible** — currently the entire component only renders during a campaign.

### What to do
Remove the `if (!isCampaignActive) return null` early return guard. Split the render into two sections:
- **Always visible:** static node/flag/status/path counts (read from `useNarrativeStore`)
- **Campaign only:** coverage metrics + Overlay toggle (already implemented, just wrapped in a conditional)

This is a quick win — all data is already being selected, just the render guard needs to be lifted.

---

## CSS Migration Reference

The prototype uses **Tailwind utility classes**. All migrated styles must use **CSS variables** from `tokens.css`:

| Tailwind class | CSS variable equivalent |
|---|---|
| `bg-slate-950` / `bg-[#070A11]` | `var(--color-bg-base)` |
| `bg-slate-900` | `var(--color-bg-surface)` |
| `bg-slate-800` / `bg-slate-800/40` | `var(--color-bg-elevated)` |
| `hover:bg-slate-800` | `var(--color-bg-hover)` |
| `border-slate-700` / `border-slate-800` | `var(--color-border)` |
| `text-slate-200` / `text-white` | `var(--color-text-primary)` |
| `text-slate-400` | `var(--color-text-secondary)` |
| `text-slate-500` | `var(--color-text-muted)` |
| `text-indigo-400` / `bg-indigo-600` | `var(--color-primary)` / `var(--color-accent)` |
| `rounded-full` | `border-radius: var(--radius-full)` |
| `rounded-md` | `border-radius: var(--radius-md)` |
| `rounded` | `border-radius: var(--radius-sm)` |
| `shadow-md` / `shadow-lg` | `var(--shadow-md)` / `var(--shadow-lg)` |
| `transition-colors` | `transition: var(--transition-fast)` |
| `transition-all duration-300` | `transition: var(--transition-normal)` |

---

## Recommended Work Order

```
Phase 1: TopBar layout          → TopBar.jsx + CampaignSelector.jsx
    ↓
Phase 2: Left Sidebar nameplate → Sidebar.jsx split into LeftSidebar.jsx
    ↓
Phase 3: Right Sidebar nameplate → new RightSidebar.jsx + App.jsx + App.css grid update
    ↓
Phase 5: StatusStrip always-on  → StatusStrip.jsx (quick win, ~10 min)
    ↓
Phase 4: NodeConfigModal        → new NodeConfigModal.jsx (separate session)
```

Each phase can be committed and tested independently. Phases 1, 2, and 5 are safe to do in a single session. Phase 3 requires care around the `App.css` grid. Phase 4 is a separate feature sprint.

---

## Files Touched Summary

| File | Change Type |
|---|---|
| `src/components/TopBar.jsx` | JSX restructure, CSS class rename |
| `src/components/CampaignSelector.jsx` | Move render into floating bar |
| `src/components/Sidebar.jsx` | Split into Left + Right |
| `src/components/LeftSidebar.jsx` | **New file** — extracted from Sidebar |
| `src/components/RightSidebar.jsx` | **New file** — Nodes + RouteTrace + Campaign |
| `src/components/NodeConfigModal.jsx` | **New file** — Phase 4, separate session |
| `src/components/StatusStrip.jsx` | Remove `isCampaignActive` guard on static counts |
| `src/App.jsx` | Update imports (LeftSidebar, RightSidebar) |
| `src/App.css` | Grid column update for dual sidebars |
| `src/styles/global.css` | New CSS blocks: nameplate tabs, floating campaign bar |
