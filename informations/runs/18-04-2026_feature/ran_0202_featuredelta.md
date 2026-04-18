# ran_0202_featuredelta.md — Feature Delta

**Feature:** Variants_on_nodes_and_Options_on_choices
**Generated:** 2026-04-18

---

## What the system does NOT have now

- **Common nodes** have a single `label` and `content` field. There is no mechanism to define alternative text that displays based on runtime flag or status state. Designers who need conditional text must duplicate the entire node.
- **Choice nodes** have no concept of discrete player-selectable options. The entire node is a single source of edges. There is no way to attach a label, conditions, or side effects to an individual selectable action.
- **Edges** from choice nodes attach to the node as a whole using a single source handle. There is no way for an edge to declare which specific option it originates from.
- **`ChoiceNode.jsx`** renders a single source handle and a generic outgoing-edge count badge. It has no per-option rendering.
- **`NodeInspector.jsx`** has no variant editing UI for common nodes and no option editing UI for choice nodes.
- **`uiStore`** has no display-mode concept for choice nodes.
- **`deleteFlag` / `deleteStatus`** referential integrity scans do not inspect `variants[].requires` or `options[].requires/flags_set/status_set` — those fields do not yet exist.

---

## What the system WILL have after this feature

- **Common nodes** carry an optional `variants[]` array in `node.data`. Each variant has an `id`, a `label`, a `text` body, and a `requires` condition object (same format as edge conditions). The variant list is editable via `VariantEditor.jsx` mounted inside `NodeInspector`.
- **Choice nodes** carry an optional `options[]` array in `node.data`. Each option has an `id`, a `label`, a `requires` availability condition, a `flags_set[]` array, and a `status_set[]` array. The option list is editable via `OptionEditor.jsx` mounted inside `NodeInspector`.
- **Edges** from choice nodes carry an optional `optionId` field. When a designer draws an edge from a per-option handle on a `ChoiceNode`, the connect handler in `GraphCanvas` stamps the originating option's ID onto `edge.optionId`. `EdgeInspector` displays the option label as a read-only field.
- **`ChoiceNode.jsx`** renders one source `Handle` per option (keyed by option `id`), option labels in the node body, and respects a `choiceDisplayMode` setting (`'medium'` | `'full'`) sourced from `uiStore`.
- **`uiStore`** holds `choiceDisplayMode` and a `setChoiceDisplayMode` action.
- **`deleteFlag` / `deleteStatus`** referential integrity scans are extended to include `variants[].requires` and `options[].requires`, `options[].flags_set`, and `options[].status_set`.
- **`narrativeStore`** exposes CRUD helpers for variants and options that write through `updateNode`-style patches rather than creating new store slices.

---

## What existing behavior is identical in both

- All node CRUD (`addNode`, `updateNode`, `deleteNode`, `setStartNode`) — unchanged in signature and behavior.
- All edge CRUD (`addEdge`, `updateEdge`, `deleteEdge`) — unchanged. The new `optionId` field is additive; all existing edge logic ignores it.
- `conditionEvaluator.js` — unchanged and untouched. Variant and option `requires` are the same clause format; no new evaluation logic is introduced.
- `simulationStore` — unchanged and untouched. Variant activation during simulation is out of scope.
- `fileSystem.js` — unchanged for this feature (migration decision deferred to Phase 1). The existing v1–v4 chain continues to work; absent `variants`/`options` fields default to `[]` at the UI layer.
- `flag{}`, `status{}`, `path{}`, `chapter{}` schemas — unchanged.
- `CommonNode.jsx`, `EndingNode.jsx` — unchanged.
- `FlagManager`, `StatusManager`, `PathChapterManager` — unchanged.
- Simulation controls, export/import, Tidy Layout, Snap-to-Grid — unchanged.
- The three-region grid layout (`App.jsx`, `App.css`) — unchanged.
- All existing `NodeInspector` fields (Label, Content, Path, Chapter, Start Node, Set Flags, Status Modifiers, Delete) — preserved and positioned above the new editor sections.
