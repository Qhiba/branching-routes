# 0304 Execute - Phase 3

## Files Modified

- `src/components/nodes/CommonNode.jsx` — new: Created as a dedicated renderer for 'common' node type, with both target and source handles, adapting legacy StoryNode rendering.
- `src/components/nodes/ChoiceNode.jsx` — new: Created as a dedicated renderer for 'choice' node type, adapting legacy StoryNode with visually distinct class names and indicators.
- `src/components/nodes/EndingNode.jsx` — new: Created for 'ending' node type, intentionally omitting the source handle natively rather than dynamically, fulfilling the AR-12 validation constraint.
- `src/components/GraphCanvas.jsx` — modified: Rewrote `derivedNodes` to unpack and dynamically map the separate `narrativeStore` collections (`common`, `choice`, `ending`), updated NodeTypes to include the three new components, and stripped `sideEffects` entirely from the conditionalEdge pass-through.
- `src/components/index.js` — modified: Exported the three replacement node components (`CommonNode`, `ChoiceNode`, `EndingNode`) and removed `StoryNode`.
- `src/components/nodes/StoryNode.jsx` — deleted: Component was wholly superseded by the explicit rendering components, as scoped by the migration and behavioral delta specifications.

## Flags Raised

- **// AMBIGUOUS: Class name for ChoiceNode**
  The plan stated `Same CSS class scheme as CommonNode (or a distinct 'choice-node' class if a visual distinction is desired — the class name is an authoring decision flagged here)`.
  **Resolution:** I added `choice-node` to the class list and added a `[Choice]` indicator in the node title UI to fulfill the potential distinct intent.
