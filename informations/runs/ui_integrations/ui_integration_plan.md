# UI Integration Plan

Each phase is self-contained. Tell the agent:
> **"Execute `@[informations/runs/ui_integrations/ui_integration_plan.md]` for Phase N"**

Reference files for every phase:
- `@[informations/runs/ui_integrations/AppShell.jsx]` — full working mock wiring (use if unsure how props connect)
- `@[informations/docs/architecture_rules.md]` — mandatory architectural constraints
- `@[informations/docs/codebase_features.md]` — existing component/store reference

---

## Phase 1 — GlobalStatusStrip

**Goal:** Replace `StatusStrip.jsx` with the new bottom bar that shows both static entity counts and live campaign stats.

**Files:**
- Component: `@[informations/runs/ui_integrations/GlobalStatusStrip.jsx]`
- Plan: `@[informations/runs/ui_integrations/GlobalStatusStrip.md]`
- Replace: `src/components/StatusStrip.jsx`

**Instructions:**
1. Delete `StatusStrip.jsx` and replace its usage in `App.jsx` with `<GlobalStatusStrip />`.
2. Wire each prop from `GlobalStatusStrip.md` → Real-App Store Mapping table.
3. All count props (`counts.common`, `counts.flags`, etc.) must use AR-14 primitive selectors — derive `Object.keys(s.subCollection).length` per slice, never pass whole objects.
4. Pass `campaignStats={null}` when `isCampaignActive === false`.
5. Wire `overlayOn` / `onToggleOverlay` to `uiStore.showTraversalOverlay` / `uiStore.toggleTraversalOverlay()`.

---

## Phase 2 — LeftSidebar + CreationModal

**Goal:** Add a new left data management panel with tabs for Flags, Status, Chapter, and Paths. The "+" button opens a richer creation form.

**Files:**
- Components: `@[informations/runs/ui_integrations/LeftSidebar.jsx]`, `@[informations/runs/ui_integrations/CreationModal.jsx]`
- Plans: `@[informations/runs/ui_integrations/LeftSidebar.md]`, `@[informations/runs/ui_integrations/CreationModal.md]`
- Modify: `src/App.jsx` (add to layout)

**Instructions:**
1. Add `<LeftSidebar />` to the leftmost column of the canvas layout row in `App.jsx`.
2. Manage `activePanel` with local `useState` in the parent, or in `uiStore` if persistence is needed.
3. Wire entity lists: `flags`, `statuses`, `chapters`, `paths` from `useNarrativeStore` sub-collections (use stable selectors per AR-23).
4. `onCreateEntity('Flags'/'Status')` → open `<CreationModal entityType={...} />`.
5. `onCreateEntity('Chapter'/'Paths')` → dispatch existing `canvas-open-name-modal` DOM event (AR-19).
6. `onConfirm` in `CreationModal` → call `narrativeStore.addFlag/addStatus/addChapter/addPath`.
7. `onEditEntity(type, id)` → open `NameModal` pre-filled with current name.
8. `onDeleteEntity(type, id)` → call `narrativeStore.deleteFlag/deleteStatus/deleteChapter/deletePath(id)`.
9. Wire `campaignMode` from `useSimulationStore(s => s.isCampaignActive)` — sidebar dims automatically.

---

## Phase 3 — NodeConfigModal

**Goal:** Add a wide (860px / 420px) modal for configuring individual nodes, opened from an explicit edit action.

**Files:**
- Component: `@[informations/runs/ui_integrations/NodeConfigModal.jsx]`
- Plan: `@[informations/runs/ui_integrations/NodeConfigModal.md]`
- Modify: parent that manages node selection (e.g. `App.jsx` or `RightSidebar` consumer)

**Instructions:**
1. Add a `nodeConfigType` state (`'Common'|'Choice'|'Ending'|null`) in the parent.
2. Render `<NodeConfigModal nodeType={nodeConfigType} ... />` at the top level (above layout).
3. Wire `chapters`, `paths`, `flags`, `statuses` from `useNarrativeStore` sub-collections.
4. Wire `initialData` by looking up the selected node from `narrativeStore` using `uiStore.selectedNodeId`.
5. `onSave` must call the **dedicated sub-array store actions** per AR-13 — do not patch the entire `node.data` object:
   - Flag modifiers → `narrativeStore.updateNode(id, { sideEffects: { flags_set: [...] } })`
   - Status modifiers → `narrativeStore.updateNode(id, { sideEffects: { status_set: [...] } })`
   - Variants (Common) → `narrativeStore.addVariant / updateVariant / deleteVariant`
   - Options (Choice) → `narrativeStore.addOption / updateOption / deleteOption`
6. `isStartNode` toggle → `narrativeStore.setStartNode(id)` on save.

---

## Phase 4 — FloatingMiddleBar

**Goal:** Replace the existing campaign pill bar / `CampaignSelector` with a floating dual-mode bar centred over the canvas.

**Files:**
- Component: `@[informations/runs/ui_integrations/FloatingMiddleBar.jsx]`
- Plan: `@[informations/runs/ui_integrations/FloatingMiddleBar.md]`
- Replace: `src/components/CampaignSelector.jsx` (and its usage in the canvas area)

**Instructions:**
1. Place `<FloatingMiddleBar />` inside the canvas container with `position: absolute; top: 24px; left: 50%; transform: translateX(-50%)`. The container must be `position: relative`.
2. Wire `campaignMode` from `useSimulationStore(s => s.isCampaignActive)`.
3. Wire `campaigns` from `useCampaignStore(s => Object.values(s.campaigns))`.
4. `onStartCampaign` → `campaignStore.setActiveCampaign(selectedId)` then `simulationStore.enterCampaign(payload)`.
5. `onExitCampaign` → `simulationStore.exitCampaign()`.
6. **AR-19 — node-add buttons must dispatch DOM events**, not call store directly:
   ```js
   window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'common' } }))
   ```
7. Add `undoDisabled` guard: disable Undo button when `simulationStore.traversalRecords.length === 0`.

---

## Phase 5 — PrimaryTopBar

**Goal:** Integrate the new top header component, replacing the branding + canvas controls section of `TopBar.jsx`.

**Files:**
- Component: `@[informations/runs/ui_integrations/PrimaryTopBar.jsx]`
- Plan: `@[informations/runs/ui_integrations/PrimaryTopBar.md]`
- Modify: `src/components/TopBar.jsx`

**Instructions:**
1. Replace the branding + project name + canvas control buttons section of `TopBar.jsx` with `<PrimaryTopBar />`.
2. Keep the existing `handleNew`, `handleImport`, `handleExport` functions — pass them as `onNew`, `onImport`, `onExport`.
3. `projectName` ← `useNarrativeStore(s => s.meta.title)`.
4. `onProjectNameChange` → `narrativeStore.updateMeta({ title: name })`.
5. `snapEnabled` ← `useUIStore(s => s.snapToGrid)` / `onSnapToggle` → `uiStore.toggleSnapToGrid()`.
6. `clustersEnabled` ← `useUIStore(s => s.clusterMode !== 'off')` / `onClustersToggle` → `uiStore.cycleClusterMode()`.
7. `onTidyLayout` → dispatch `canvas-layout-tidy` DOM event (AR-19).

---

## Phase 6 — RightSidebar

**Goal:** Add the right panel with Nodes list, Route Tracing, and Campaign List tabs alongside the existing `Sidebar.jsx`.

**Files:**
- Component: `@[informations/runs/ui_integrations/RightSidebar.jsx]`
- Plan: `@[informations/runs/ui_integrations/RightSidebar.md]`
- Modify: `src/App.jsx` (add to layout)

**Instructions:**
1. Add `<RightSidebar />` to the rightmost column of the canvas layout row in `App.jsx`, to the right of (or replacing) the existing `<Sidebar />`.
2. Derive the flat `nodes` array: spread `common`, `choice`, `ending` sub-collections and map to `{ id, name: n.data.label, type }`.
3. `onEditNode(id)` → set `nodeConfigType` state to open `NodeConfigModal` (from Phase 3).
4. `onDeleteNode(id)` → call `narrativeStore.deleteNode(id)`.
5. **Route Tracing — AR-24**: choose the correct store writer based on `isCampaignActive`:
   - Edit mode → `simulationStore.setShortestRouteResults(paths)` (unguarded)
   - Campaign mode → `simulationStore.computeRoutes(targetNodeId, priorities, pathCap)`
6. Campaign CRUD: `onAddCampaign` → `campaignStore.addCampaign(name)`, `onDeleteCampaign` → `campaignStore.deleteCampaign(id)`, `onEditCampaignName` → open `NameModal` → `campaignStore.updateCampaign(id, { name })`.
7. Wire `campaignMode` to dim the sidebar automatically.
