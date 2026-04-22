# Fix Report — Phase 6: Node & Edge Configuration

Current Phase: 6
Date: 23-04-2026

## Addressed Issues & Human Notes

### 1. Interaction: Double-Click Logic Refinement
**Issue:** Human Note 1 — Remove double-click creation, implement double-click to edit.
```jsx
// GraphCanvas.jsx
const onNodeDoubleClick = useCallback((event, node) => {
  if (isCampaignActive) return;
  event.stopPropagation();
  window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId: node.id } }));
}, [isCampaignActive]);
```
*   **What was fixed:** Double-clicking the pane no longer creates nodes; double-clicking a node now opens the configuration modal.
*   **Impact:** Neither; this aligns with the planned Phase 6 UX delta.

### 2. Context Menu: Expanded Actions
**Issue:** Human Note 2 — Add "Edit Node" and "Edit Edge" to context menu.
```jsx
// ContextMenu.jsx
case 'node':
  return (
    <>
      <button className="context-menu__item" onClick={handleAction(() => {
        window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId: targetId } }));
      })}>
        Edit Node
      </button>
      {/* ... */}
```
*   **What was fixed:** Added explicit edit triggers for nodes and edges to the right-click menu.
*   **Impact:** Neither; strictly follows the behavioral change request.

### 3. Modal: Logic-First Hierarchy
**Issue:** Human Note 3 — Move "Requires Condition" above Narrative Text.
```jsx
// NodeConfigModal.jsx (VariantCard)
<div className="ncm-card__body">
  <div className="ncm-field">
    <label className="ncm-label">Internal Name</label>
    <input /* ... */ />
  </div>
  <ConditionBuilder /* Condition is now above text... */ />
  <div className="ncm-field">
    <label className="ncm-label">Narrative Text</label>
    <textarea /* ... */ />
  </div>
</div>
```
*   **What was fixed:** Reordered fields in Variant and Option cards to prioritize logic conditions over content.
*   **Impact:** Neither.

### 4. Modal: Routing Field Placement
**Issue:** Human Note 4 — Move Chapter/Path dropdowns below Node Label.
```jsx
// NodeConfigModal.jsx
<div className="ncm-field">
  <label className="ncm-label">Node Label</label>
  <input /* ... */ />
</div>
<div className="ncm-row">
  <div className="ncm-field"><label>Chapter</label> <select>...</select></div>
  <div className="ncm-field"><label>Path</label> <select>...</select></div>
</div>
```
*   **What was fixed:** Grouped organizational metadata (Label, Chapter, Path) at the top of the narrative column.
*   **Impact:** Neither.

### 5 & 9. Modal: User-Defined Types
**Issue:** Human Note 5 & 9 — Add dropdown for node types using store data.
```jsx
// NodeConfigModal.jsx
const commonTypes = Object.values(useNarrativeStore(s => s.commonType) || {});
// ...
<select value={data.nodeSubTypeId || ''} onChange={e => patch('nodeSubTypeId', e.target.value)}>
  <option value="">None</option>
  {typeOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
</select>
```
*   **What was fixed:** Removed hardcoded type constants and wired subtypes to the store-defined entities from the left sidebar.
*   **Impact:** Neither; ensures compatibility with the existing data model.

### 6. Canvas: Dynamic Subtype Labeling
**Issue:** Human Note 6 — Reflect subtype name in node type bar.
```jsx
// CommonNode.jsx
<span className="story-node__type-label">
  {subTypeName ? subTypeName.toUpperCase() : 'COMMON'}
</span>
```
*   **What was fixed:** The node "type bar" now displays the specific subtype name (e.g., "DIALOGUE") instead of just "COMMON".
*   **Impact:** Neither.

### 7. Modal: Start Node Selection
**Issue:** Human Note 7 — Change "Set Start Node" to a button.
```css
/* NodeConfigModal.css */
.ncm-start-btn {
    background-color: #020617;
    border: 1px solid var(--color-border);
    /* ... premium button styling ... */
}
```
*   **What was fixed:** Replaced the toggle switch with a high-fidelity action button that locks to an active state once the node is set as start.
*   **Impact:** Neither.

### 8. Modal: Card Title Clarity
**Issue:** Human Note 8 — Option cards should show the option text as the header.
```jsx
// NodeConfigModal.jsx
const cardTitle = option.label && option.label.trim() ? option.label : `Option ${index + 1}`;
```
*   **What was fixed:** Collapsible cards in the Branching Options section now use the actual user-input text as their header.
*   **Impact:** Neither.

### 10. Modal: Edge Configuration
**Issue:** Human Note 10 — Implement Edge editing modal.
```jsx
// EdgeConfigModal.jsx
export default function EdgeConfigModal({ edgeId, onClose }) {
  // Handles label, conditions, and deletion...
}
```
*   **What was fixed:** Created a dedicated `EdgeConfigModal` to replace the legacy `EdgeInspector`.
*   **Impact:** Neither; completes the Phase 6 feature set.

### 11. Self-Review: Orphan Node Fix (Critical)
**Issue:** Critical Bug — Cancelling new node creation left orphaned data.
```jsx
// GraphCanvas.jsx
const cancelNodeModal = () => {
  deleteNode(pendingNodeModal);
  setPendingNodeModal(null);
};
return (
  <NodeConfigModal onCancel={cancelNodeModal} />
);
```
*   **What was fixed:** Wired the modal `onCancel` (backdrop/Esc/Cancel button) to explicitly delete the node from the store if it hasn't been saved yet.
*   **Impact:** Behavior Delta; fixes an uncaptured regression in the atomic creation flow.

### 12. Self-Review: Barrel Cleanup
**Issue:** Major Cleanup — Retired components still exported.
```javascript
// components/index.js
// REMOVED: NodeInspector — retired in Phase 6, superseded by NodeConfigModal
// REMOVED: OptionEditor, VariantEditor — retired in Phase 6
```
*   **What was fixed:** Cleaned up the barrel export file to prevent usage of dead code.
*   **Impact:** Neither.

## Files Modified
1. `f:\Projects\Web\branching-routes\src\components\GraphCanvas.jsx`
2. `f:\Projects\Web\branching-routes\src\components\modals\NodeConfigModal.jsx`
3. `f:\Projects\Web\branching-routes\src\components\modals\NodeConfigModal.css`
4. `f:\Projects\Web\branching-routes\src\components\modals\EdgeConfigModal.jsx`
5. `f:\Projects\Web\branching-routes\src\components\modals\EdgeConfigModal.css`
6. `f:\Projects\Web\branching-routes\src\components\ContextMenu.jsx`
7. `f:\Projects\Web\branching-routes\src\components\nodes\CommonNode.jsx`
8. `f:\Projects\Web\branching-routes\src\components\nodes\EndingNode.jsx`
9. `f:\Projects\Web\branching-routes\src\components\index.js`
10. `f:\Projects\Web\branching-routes\src\styles\global.css`
