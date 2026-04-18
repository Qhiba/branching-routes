# ran_0201_scope.md — Variants_on_nodes_and_Options_on_choices

**Generated:** 2026-04-18
**Prompt file:** `0201_scope-user.md`

---

## Part 1 — User input (preserved verbatim)

### Feature name
Variants_on_nodes_and_Options_on_choices

### What this feature does
- **Variants on Common Node:** Allows designers to define alternate text on a common node that displays conditionally based on flag and status state, so a single node can show different content without duplicating nodes in the graph.
- **Options on Choice Node:** Allows designers to define multiple selectable options on a choice node — each with its own conditions, side effects, and a dedicated source handle — so edges can be anchored to a specific option rather than the node as a whole.

### What this feature does NOT do
- **Variants on Common Node:**
  - Does not affect routing or edge behavior — variants are display-only, not branching points.
  - Does not render variant switching on the canvas; which variant is active is a simulation concern for a later update.
  - Does not finalize the variant editor UI — form styling is deferred to a later update.
- **Options on Choice Node:**
  - Does not change how edges evaluate conditions — option conditions gate availability, routing logic stays on the edge.
  - Does not affect common node or ending node edge behavior — per-option source handles exist only on choice nodes.
  - Does not finalize the option editor UI — form styling is deferred to a later update.

### Why this feature is needed now
- **Variants on Common Node:** Without variants, designers must duplicate common nodes to express minor conditional text differences, bloating the graph with structurally identical nodes that differ only in content.
- **Options on Choice Node:** The flag and status system from previous iteration update has nowhere to apply at the choice level — without options, choice nodes cannot express what the player selects, what state changes on selection, or which specific option an outgoing edge belongs to.

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/store/narrativeStore.js` | Variant + option CRUD actions |
| ADD | `src/components/VariantEditor.jsx` | Variant list + conditional text editing |
| ADD | `src/components/OptionEditor.jsx` | Option editing: label, requires, flags_set, status_set |
| MODIFY | `src/components/NodeInspector.jsx` | Mount VariantEditor for common nodes, OptionEditor for choices |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` | Render option labels, per-option source handles, medium/full toggle |
| MODIFY | `src/store/uiStore.js` | Option display mode setting (medium/full) |
| MODIFY | `src/components/EdgeInspector.jsx` | Show which option an edge connects from |

### Assumptions
NONE

---

## Part 2 — AI fills

### Related existing features

| Existing feature | Relationship |
|---|---|
| `flag{}` dictionary in `narrativeStore` | Variants reference `flag` IDs in their `requires` conditions; options reference flag IDs in `flags_set` and `requires`. Both features consume the existing flag schema directly. |
| `status{}` dictionary in `narrativeStore` | Variants and options reference `status` IDs in `requires` (min/max threshold) and in `status_set` side-effect arrays. Same schema as node-level `status_set` already in use. |
| `updateNode` / node CRUD in `narrativeStore` | Variant and option lists are stored inside `node.data`. All mutations must go through the existing `updateNode` action (AR-04). No new store slice is needed; `variants[]` and `options[]` are just new fields inside `data`. |
| `NodeInspector.jsx` | The primary mount point for both new editor components. It already reads node `data` and dispatches `updateNode`. `VariantEditor` mounts only when `nodeType === 'common'`; `OptionEditor` mounts only when `nodeType === 'choice'`. |
| `ChoiceNode.jsx` | Currently renders a single source handle and an outgoing-edge count badge. The per-option handles (one per option) and option label list replace or augment this surface. The existing `uiStore` is extended with a display mode toggle. |
| `EdgeInspector.jsx` | Edges gained an `optionId` field when connected from a specific option handle on a choice node. `EdgeInspector` must read and display (read-only) which option the edge originates from. |
| `conditionEvaluator.js` | Variant `requires` conditions and option `requires` conditions use the **exact same** `{ operator, conditions[] }` clause format already evaluated by this utility. No schema extension needed. |
| `fileSystem.js` migration chain | Any time `node.data` shape changes (new optional arrays `variants`, `options`), legacy files must not crash. Because both arrays are **optional** (absent = `[]`), no schema version bump is strictly required — consumers must default to `[]`. Whether a v5 bump is warranted is a Phase 1 decision. |
| `simulationStore.js` | Variant activation (which variant text is shown during simulation) is deferred by the user's scope. `simulationStore` is listed here because it is the future consumer of `requires` on variants, and any data-shape decision made now constrains it. It must **not** be touched in this feature. |

---

### Files to touch

| File | Action | Reason |
|---|---|---|
| `src/store/narrativeStore.js` | MODIFY | Add `addVariant`, `updateVariant`, `deleteVariant` on common nodes; `addOption`, `updateOption`, `deleteOption` on choice nodes. All operate through `updateNode`-style patches on `node.data`. |
| `src/store/uiStore.js` | MODIFY | Add `choiceDisplayMode` state (`'medium'` \| `'full'`) and a `setChoiceDisplayMode` action, consumed by `ChoiceNode` to switch rendering density. |
| `src/components/VariantEditor.jsx` | CREATE | New component. Renders a list of variant entries on a common node. Each variant: `id`, `label`, `text`, `requires` (same condition object as edge conditions). Provides add/remove row controls. Reads `flag{}` and `status{}` from store for the `requires` clause builder. |
| `src/components/OptionEditor.jsx` | CREATE | New component. Renders a list of option entries on a choice node. Each option: `id`, `label`, `requires` (availability condition), `flags_set[]`, `status_set[]`. Provides add/remove row controls. |
| `src/components/NodeInspector.jsx` | MODIFY | Conditionally mount `<VariantEditor nodeId={node.id} variants={data.variants} />` for `nodeType === 'common'`. Conditionally mount `<OptionEditor nodeId={node.id} options={data.options} />` for `nodeType === 'choice'`. Both editors dispatch back via `updateNode`. |
| `src/components/nodes/ChoiceNode.jsx` | MODIFY | Replace single source `Handle` with one `Handle` per option (keyed by option `id`). Render option labels in the node body. Accept `choiceDisplayMode` from `uiStore` to toggle between compact (medium) and full layout. Guard against `data.options` being absent — default to `[]` (backward compat). |
| `src/components/EdgeInspector.jsx` | MODIFY | Read `edge.optionId`. If set, cross-reference `choice[sourceNode].data.options` to display the option label as a read-only field ("Connected from option: X"). The `optionId` field is set by `GraphCanvas` at connect time, not by this inspector. |
| `src/components/index.js` | MODIFY | Add barrel exports for `VariantEditor` and `OptionEditor`. |

---

### Files to protect

| File | Status | Reason |
|---|---|---|
| `src/utils/conditionEvaluator.js` | **PROTECTED** | The variant `requires` and option `requires` fields use the identical condition object already evaluated here. No change is needed. Any modification risks breaking edge condition evaluation and simulation. |
| `src/store/simulationStore.js` | **PROTECTED** | Variant activation during simulation is explicitly out of scope. Touching `simulationStore` risks breaking the live simulation and violates AR-08 (simulation isolation). |
| `src/utils/fileSystem.js` | **PROTECTED** (unless v5 bump decided) | `variants[]` and `options[]` are new optional arrays on node data — absent fields default to `[]` at UI layer. A schema bump is deferred to Phase 1 decision. Do not touch until that decision is made. |
| `src/components/nodes/CommonNode.jsx` | **PROTECTED** | Variants are display-only and not rendered on the canvas node in this feature. `CommonNode` must not be altered. |
| `src/components/nodes/EndingNode.jsx` | **PROTECTED** | Not touched by either sub-feature. Editing it while ChoiceNode is in flux increases collision risk. |
| `src/components/FlagManager.jsx` | **PROTECTED** | Flag management is stable and does not change shape. `VariantEditor` and `OptionEditor` consume flags read-only. |
| `src/components/StatusManager.jsx` | **PROTECTED** | Same as `FlagManager`. |
| `src/components/PathChapterManager.jsx` | **PROTECTED** | Unrelated to this feature. |
| `src/components/GraphCanvas.jsx` | **PROTECTED (with exception)** | The connect handler must stamp `optionId` on new edges from choice nodes. This is the single permitted touch — everything else in `GraphCanvas` is off-limits. If this touch is deferred, `EdgeInspector` will simply show "No option" for all existing edges. |

---

### Architecture rules relevant to this feature

| Rule | Why it is relevant |
|---|---|
| **AR-03 — State Management** | `variants[]` and `options[]` live in `node.data` inside the Zustand store. `VariantEditor` and `OptionEditor` may keep form-open/collapse state locally but must never hold variant or option data in `useState`. |
| **AR-04 — Data Layer Separation** | `VariantEditor` and `OptionEditor` are read-only consumers of store state. All writes go through `updateNode` (or the new dedicated actions that call it). Direct mutation of `node.data` from a component is forbidden. |
| **AR-05 — Single Source of Truth** | `variants[]` on a common node and `options[]` on a choice node are canonical state in `narrativeStore`. `ChoiceNode` reads `data.options` from React Flow's passed `data` prop (which is derived from the store) — not a separate local copy. |
| **AR-06 — Import Constraints** | `VariantEditor` and `OptionEditor` import from the `store` barrel (`useNarrativeStore`) and from `utils` (`generateId`). They must not import directly from internal store files or each other in a way that creates circular dependencies. |
| **AR-07 — Condition Evaluation** | Variant `requires` and option `requires` use the same condition format. Any rendering of clause state (true/false badge) must call `evaluateCondition` from `conditionEvaluator.js`, not inline logic. |
| **AR-09 — JSON Format Stability** | Adding `variants[]` and `options[]` to `node.data` is an additive change. Decide in Phase 1 whether this warrants a `schemaVersion: 5` bump. The import function must not reject files that lack these fields — default to `[]`. |
| **AR-11 — Side Effect Placement** | Option `flags_set[]` and `status_set[]` are side effects on the **node** (triggered when the player picks that option and the simulation enters the node). This preserves AR-11: side effects remain on nodes, not edges. |
| **AR-12 — Node Type Structural Constraints** | Per-option source handles exist **only** on choice nodes. `addEdge` already guards against starting edges from `ending{}`. The new per-option handle IDs must not collide with node IDs — prefix them (e.g. `handle-{optionId}`). |

---

### Relevant existing risks

| Risk | Relationship to this feature |
|---|---|
| **RISK-01 — Re-render storms** | `ChoiceNode` will grow: it now subscribes to `data.options` (a potentially long array) and `choiceDisplayMode` from `uiStore`. Both selectors must be targeted (`s => s.choice[id]?.data.options` and `s => s.choiceDisplayMode`) to avoid full-store re-renders. `React.memo` must be preserved. |
| **RISK-02 — Flag/status referential integrity** | `VariantEditor` variant `requires` clauses and `OptionEditor` option `requires` + `flags_set` reference flag and status IDs. Currently `deleteFlag` and `deleteStatus` scan `edges` and `node.data.flags_set` / `node.data.status_set`. After this feature, they must **also** scan `node.data.variants[].requires` and `node.data.options[].requires` and `node.data.options[].flags_set/status_set`. Failure to extend these scans will leave dangling IDs and silence the referential-integrity guard. **This is the highest-priority new risk introduced by this feature.** |
| **RISK-PCE-04 — NodeInspector re-renders** | `NodeInspector` already uses targeted selectors. Adding `VariantEditor` and `OptionEditor` as children must not introduce broad `useNarrativeStore(s => s)` subscriptions in the new files. |

**New risk introduced — RISK-VNO-01:**
> **Option handle ID collision with node IDs.**
> Per-option source handles need unique IDs for React Flow's connect events to carry an `handleId`. If `generateId('h')` is called and the resulting ID accidentally matches an existing node or edge ID, connect events will misroute.
> **Mitigation:** Prefix handles with a non-node prefix (e.g. `opt-{uuid}` already distinct from `n-`, `e-`, `f-`, `p-`, `c-`). Validate in the connect handler.

**New risk introduced — RISK-VNO-02:**
> **Backward compatibility of `data.options` absence on existing choice nodes.**
> Existing saved files and in-memory choice node objects have no `options` field. If `ChoiceNode.jsx` reads `data.options.length` without a guard, it will throw on every existing choice node.
> **Mitigation:** Default to `[]` in every consumer: `const options = data.options ?? [];`. Enforce this pattern in code review. Decide in Phase 1 whether to add a `newGraph`/`loadGraph` migration that stamps `options: []` on all choice nodes.

---

### Suggested phase shape

- **Phase 1 — Data layer**
  Add `variants[]` to common node `data` and `options[]` to choice node `data` schemas. Add CRUD helpers to `narrativeStore` (`addVariant`, `updateVariant`, `deleteVariant`, `addOption`, `updateOption`, `deleteOption`). Extend `deleteFlag` and `deleteStatus` referential integrity scans. Decide schema version bump. Write a standalone test verifying add/update/delete round-trips and that referential integrity blocks deletions. Independently stoppable — no UI needed to verify.

- **Phase 2 — `OptionEditor` and `ChoiceNode` per-option handles**
  Build `OptionEditor.jsx` (option list, add/remove, label, requires, flags_set, status_set). Wire into `NodeInspector` for choice nodes. Modify `ChoiceNode.jsx` to render one source `Handle` per option with correct `handleId`. Add `choiceDisplayMode` to `uiStore`. Test: create a choice node, add two options, verify two distinct handles appear and are draggable to targets.

- **Phase 3 — `VariantEditor` and `EdgeInspector` option display**
  Build `VariantEditor.jsx` (variant list, add/remove, label, text, requires). Wire into `NodeInspector` for common nodes. Extend `GraphCanvas` connect handler to stamp `optionId` on edges from choice nodes. Update `EdgeInspector` to display the originating option label (read-only). Test: create a variant, save, reload — variant persists. Connect an edge from an option handle — EdgeInspector shows option name.
