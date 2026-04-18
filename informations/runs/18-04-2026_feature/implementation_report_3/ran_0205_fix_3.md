# ran_0205_fix_3.md — Fix Report

**Feature:** Variants_on_nodes_and_Options_on_choices
**Phase:** 3
**Generated:** 2026-04-18

---

## 1. Edge Source Resolving To Middle (Bug 2)

**File Modified:** `f:\Projects\Web\branching-routes\src\components\GraphCanvas.jsx`

**Corrected Section:**
```jsx
  const reactFlowEdges = useMemo(() => {
    return storeEdges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      // ADDED: ensure the edge anchors to the correct option handle
      sourceHandle: edge.optionId || null,
      type: 'conditionalEdge',
// ...
```
**What was fixed:** Passed the registered `optionId` as `sourceHandle` on the mapped React Flow edges so the UI visually anchors connections to the individual Option handles instead of collapsing backward to the center of the node.
**Integration Statement:** This safely touches the visual representation bridge (React Flow edge conversion) without altering the strict data layer delta.

## 2. Common Node Edge Black Screen (Bug 1)

**File Modified:** `f:\Projects\Web\branching-routes\src\components\EdgeInspector.jsx`

**Corrected Section:**
```jsx
  // ADDED: Safe selector to fetch options to prevent crashes
  const sourceOptions = useNarrativeStore(state => {
    const currentEdge = state.edges.find(e => e.id === selectedEdgeId);
    if (!currentEdge) return [];
    const choiceNode = state.choice[currentEdge.sourceId];
    return choiceNode?.data?.options || [];
  });
```
**What was fixed:** The Zustand hook selector evaluating the source Options array was restructured into a deterministic safe block evaluating `currentEdge.sourceId` natively within the selector block instead of relying on a closure reference outside of it, preventing a rendering crash ("black screen") evaluating `sourceId` for non-choice implementations. 
**Integration Statement:** This directly stabilizes an unaddressed gap in the feature delta integration points. No architecture violations were made.

## 3. Multiple Contextual Edges per Choice Node (Bug 4)

**File Modified:** `f:\Projects\Web\branching-routes\src\store\narrativeStore.js`

**Corrected Section:**
```jsx
    if (state.edges.some(e => e.sourceId === sourceId && e.targetId === targetId && e.optionId === optionId)) {
      throw new Error("Edge already exists between these nodes for this specific option or fallback");
    }
```
**What was fixed:** Altered the single-edge-per-target invariant rule checking natively inside `addEdge` to treat paths branching off from different specific `optionId`s as distinct logical paths. Multiple options across the same node can now point uniquely toward identical end targets, solving narrative path bottlenecks!
**Integration Statement:** The architectural concept of duplicate edge checking was strictly improved without impacting stability.

## 4. Handle Visual Appearance (Bugs 5 & 6)

**File Modified:** `f:\Projects\Web\branching-routes\src\styles\global.css`
**File Modified:** `f:\Projects\Web\branching-routes\src\components\nodes\ChoiceNode.jsx`

**What was fixed:** 
1. Re-scoped `overflow: hidden` strictly from the main `.story-node` wrapper down to specific `border-radius` clamping inside the Type Bars to unclip node handles natively.
2. Tuned the Option container relative alignment directly to compensate for Node body's implicit 12px right padding, neutralizing `.react-flow__handle` `transform` translation clipping.
3. Stripped the explicit legacy 10px `width`/`height` overrides from `.choice-node__handle` allowing UI to identically inherit the default global `.react-flow__handle` sizes!
**Integration Statement:** CSS updates; zero data architecture or model implications.
