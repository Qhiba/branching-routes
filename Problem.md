# Considerations & Potential Challenges

## 1. Managing the IDs and "Orphaned" References (Phase 1)
IDs like `F001` or `CH001` are auto-assigned and never change. However, what happens if a user **deletes** a flag that is currently used in different scenes or choices?
*Challenge/Solution:* We need a validation layer that checks for orphaned references. When a flag is deleted, the app should either warn the user ("This flag is used in 3 choices and 2 scenes") or block the export, preventing broken logic from being saved.

## 2. Visual Clutter in the Editor UI
As narrative games scale, you can easily end up with 500+ flags and 200+ scenes. Even with `snake_case` naming conventions, dropdowns will become unusable.
*Challenge/Solution:* Introduce a lightweight "Tagging" or "Category" mechanism just for the editor's UI early on. Letting writers categorize flags by characters (`NPC_KING`, `COMPANION_ALICE`) or events will drastically help scalability without waiting for Phase 3's Quests.

## 3. Node Graph Scaling (Phase 4)
Visualizing a graph when there are 1,000 choices could be visually overwhelming and slow down the browser's DOM.
*Challenge/Solution:* Look into a robust canvas-renderer for your node graph early (like `reactflow` or a WebGL approach), rather than raw DOM elements.
