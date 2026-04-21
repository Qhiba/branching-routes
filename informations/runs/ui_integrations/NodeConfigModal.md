# NodeConfigModal — Integration Phase Plan

## Purpose

A wide modal (860px, 2-column) for configuring a narrative node. Auto-narrows to 420px single-column for Ending nodes which have no routing logic.

**Left column** — Narrative Content (label, description) + Routing (chapter/path dropdowns) + Start Node toggle.

**Right column** (Common / Choice only) — On-Enter Modifiers (flags set true, status modifiers) + Branching Options (Choice) or Narrative Variants (Common).

**Internal sub-components (inside `NodeConfigModal.jsx`):**
- `SectionTitle` — small icon + uppercase label divider

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `nodeType` | `'Common' \| 'Choice' \| 'Ending' \| null` | `null` = modal closed |
| `onClose` | `() => void` | Closes without saving |
| `onSave` | `(data: object) => void` | Called with payload on Save Node |
| `chapters` | `{ id, name }[]` | Chapter dropdown options |
| `paths` | `{ id, name }[]` | Path dropdown options |
| `flags` | `{ id, name }[]` | Flag options for modifier selectors |
| `statuses` | `{ id, name }[]` | Status options for modifier selectors |
| `initialData` | `object \| null` | Pre-filled values for edit mode |
| `initialData.label` | `string` | Node label |
| `initialData.description` | `string` | Node description text |
| `initialData.chapterId` | `string \| null` | Pre-selected chapter |
| `initialData.pathId` | `string \| null` | Pre-selected path |
| `initialData.isStartNode` | `boolean` | Whether node is the campaign start |

---

## Local State (AR-03 Compliant)

| State | Type | Purpose |
|---|---|---|
| `isStartNode` | `boolean` | Toggle — initialised from `initialData?.isStartNode` |
| `logicMode` | `'AND' \| 'OR'` | Condition logic for the variant/option builder row |

Both are purely UI-interaction state. No graph data is held locally.

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `nodeType` | Local `useState` in parent; set by `onEditNode` callback |
| `onClose` | `setNodeConfigType(null)` |
| `onSave` | `narrativeStore.updateNode(id, { label, content, chapterId, pathId })` + `narrativeStore.setStartNode(id)` if `isStartNode` toggled |
| `chapters` | `useNarrativeStore(s => Object.values(s.chapter))` |
| `paths` | `useNarrativeStore(s => Object.values(s.path))` |
| `flags` | `useNarrativeStore(s => Object.values(s.flag))` |
| `statuses` | `useNarrativeStore(s => Object.values(s.status))` |
| `initialData` | Look up node by `selectedNodeId` from `uiStore` in the consuming parent |

---

## Sub-Array Management (AR-13)

The **On-Enter Modifiers** and **Variants/Options** sections in the right column are currently rendered as static mockup UI. When wiring to the real app:

- Flags set → `narrativeStore.updateNode(id, { sideEffects: { flags_set: [...] } })`
- Status modifiers → `narrativeStore.updateNode(id, { sideEffects: { status_set: [...] } })`
- Variants (Common) → `narrativeStore.addVariant / updateVariant / deleteVariant` (dedicated actions per AR-13)
- Options (Choice) → `narrativeStore.addOption / updateOption / deleteOption` (dedicated actions per AR-13)

**Do not** replace the entire `node.data` object in a single patch — use the dedicated sub-array actions.

---

## Relationship to Existing Components

- **`NodeInspector.jsx`** (existing) provides a similar form inside the right `Sidebar.jsx` for the currently selected node.
- `NodeConfigModal` is the **modal overlay variant** intended for explicit "edit" click flows (from the node list in `RightSidebar` or from the FloatingMiddleBar quick-add icons for pre-configuring a new node).
- Both can coexist: `NodeInspector` for inline editing on selection, `NodeConfigModal` for explicit edit actions.

---

## Styling

All Tailwind classes are identical to `ui_design.jsx` lines 185–432. No visual changes.

---

## Files

- `NodeConfigModal.jsx` — Component implementation
- `NodeConfigModal.md` — This document
