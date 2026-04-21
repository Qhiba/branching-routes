# Branching Routes — Architecture Rules

> **This file is the single source of truth for all architecture rules in this project.**
> All future work — iterations, refactors, new features — must reference and comply with these rules.

---

## AR-01 — Naming: Files

All component files use PascalCase (e.g., `NodeCard.jsx`). All store files use camelCase with a `store` suffix (e.g., `graphStore.js`). All utility files use camelCase with no suffix (e.g., `conditionEvaluator.js`).

**Rationale:** Consistent naming conventions make files immediately identifiable by their role (component vs. store vs. utility) without opening them.

---

## AR-02 — Naming: Variables and Entities

Graph entity IDs are UUID v4 strings generated at creation time and never mutated. Node data fields use camelCase (e.g., `nodeId`, `nodeLabel`). Flag/variable names defined by the designer must be alphanumeric + underscore only (validated on input).

**Rationale:** Immutable UUIDs prevent accidental ID collisions and referential integrity breakage. Restricted flag names avoid injection risks and ensure safe use in condition evaluation.

---

## AR-03 — State Management

All global application state (graph nodes, edges, flags, simulation state) lives exclusively in Zustand stores. React component local state (`useState`) is limited to UI-only concerns (e.g., modal open/closed, hover state) and must never hold graph data.

**Rationale:** A single state management pattern prevents data duplication and makes the entire application state inspectable and serializable from one place.

---

## AR-04 — Data Layer Separation

No component file may directly mutate the graph data structure. All mutations must go through a Zustand store action. Components are read-only consumers of store state.

**Rationale:** Enforcing unidirectional data flow prevents scattered, hard-to-trace mutations and ensures all state changes are auditable through store actions.

---

## AR-05 — Single Source of Truth

The canonical graph representation is the Zustand `narrativeStore`. It holds `common{}`, `choice{}`, `ending{}`, `edges[]`, `flag{}`, `status{}`, `path{}`, `chapter{}`, and `meta`. The React Flow `nodes` and `edges` arrays are derived from the typed node sub-collections and re-synced on every store change. The JSON export/import format is the serialised form of `narrativeStore` state only.

**Rationale:** A single canonical store ensures every consumer reads the same data. Enumerating the full shape prevents drift between the rule and the implementation.

---

## AR-06 — Import Constraints

Absolute imports are resolved from `src/` (configured in `vite.config.js`). Barrel files (`index.js`) are used only at the top level of each directory (`components/`, `store/`, `utils/`). Circular imports between store files are forbidden.

**Rationale:** Absolute imports improve readability and refactoring safety. Barrel files simplify imports without creating deep re-export chains. Circular imports cause runtime errors in Zustand's module initialisation.

---

## AR-07 — Condition Evaluation

All condition logic (AND/OR flag evaluation for edges) must live in `src/utils/conditionEvaluator.js` and be pure functions: `evaluateCondition(condition, flagState) => boolean`. No condition logic may be embedded in components or store actions.

**Rationale:** Centralising condition logic makes it independently testable, prevents duplication, and ensures consistent evaluation semantics everywhere conditions are checked.

---

## AR-08 — Simulation Isolation

Simulation state (active node, traversed edges, current flag values mid-campaign, sandbox overrides, node state enum, seen set) must live exclusively in `simulationStore` and must never pollute `narrativeStore`. Entering and exiting a campaign must reset `simulationStore` to a clean initial state. Sandbox overrides write only to `simulationStore.currentFlagValues` — never to `narrativeStore.flag` or `narrativeStore.status`.

**Rationale:** Isolation guarantees that running a campaign never modifies the designer's graph data. The graph is always in its "authored" state regardless of campaign activity.

---

## AR-09 — JSON Format Stability

The exported JSON structure is versioned via a top-level `"schemaVersion"` field (starting at `1`). Any breaking change to the data model increments this field. The import function must validate and reject files with an unrecognised schema version.

**Rationale:** Schema versioning enables safe evolution of the data format while preserving backward-compatible import of older files.

---

## AR-10 — No External Backend

This application makes zero network requests at runtime. No fetch, axios, or WebSocket calls are permitted in application code. All persistence is via the browser's File System Access API (`showSaveFilePicker` / `showOpenFilePicker`).

**Rationale:** The project is scoped as a fully offline, localhost tool. Eliminating network dependencies ensures the app works without internet access and avoids all privacy/data-residency concerns.

---

## AR-11 — Side Effect Placement

Side effects exist only on nodes. When the simulation advances along an edge, only the destination node's `sideEffects` fire upon entry. This must be enforced inside `simulationStore.advance()` and nowhere else. Edges carry no `sideEffects` field.

**Rationale:** The rule existed to manage execution order ambiguity caused by effects on both edges and nodes. Removing edge side effects eliminates the ambiguity entirely, so the ordering concern no longer applies.

---

## AR-12 — Node Type Structural Constraints

Ending nodes are stored in a dedicated ending{} sub-collection. Because they are structurally separated from connectable node types, narrativeStore.addEdge() must validate that the source ID does not belong to the ending collection and throw if it does. The UI must hide the outgoing handle on EndingNode to reinforce this at the interaction layer.

**Rationale:** The enforcement mechanism is the same but the lookup target changed — from a type field on a flat array entry to sub-collection identity.

---

## AR-13 — Sub-Array CRUD via Dedicated Store Actions

Nested arrays inside `node.data` (e.g., `variants[]`, `options[]`) must be managed exclusively through dedicated store actions (e.g., `addVariant`, `updateVariant`, `deleteVariant`) rather than generic `updateNode` patches that replace the entire array. Each action must perform its own validation and cascading cleanup (e.g., `deleteOption` removes edges with matching `optionId`).

**Rationale:** Dedicated actions prevent accidental full-array overwrites, enforce referential integrity cascades, and make store mutations auditable through named action calls. Validated through the Variants_on_nodes_and_Options_on_choices feature implementation.

---

## AR-14 — Zustand Selector Stability

Zustand selectors must never return new object or array literals (e.g., `[]`, `{}`) as fallback values. Returning a new reference on every call causes Zustand to detect a state change on every render cycle, triggering infinite re-render loops. Selectors must return `undefined` or `null` for absent data; the consuming component defaults outside the hook.

**Rationale:** A `return []` inside a selector creates a new array reference on every evaluation. Zustand uses strict equality (`===`) to detect changes, so a new reference triggers a re-render, which re-evaluates the selector, which returns another new reference — producing an infinite loop that crashes the UI.

---

## AR-15 — Edge Uniqueness Tuple

The duplicate-edge check in `narrativeStore.addEdge()` uses the tuple `(sourceId, targetId, optionId)` to determine uniqueness. Two edges between the same source and target nodes are permitted if and only if they originate from different option handles (i.e., have different `optionId` values). Edges with `optionId: null` (non-option edges) are still subject to the standard one-edge-per-pair constraint.

**Rationale:** Multiple choice options on the same node may legitimately route to the same target with different side effects. The previous `(sourceId, targetId)` check blocked this valid authoring pattern.

---

## AR-16 — Campaign Visual State Vocabulary

The canonical visual states applied to nodes during an active campaign are a closed six-value enum: `active` (the current node in focus), `locked` (in topology but condition-blocked from the active node), `complete` (an ending node reached successfully), `failed` (a dead-end node with no satisfiable outgoing edges), `branch_locked` (reachable only via an option branch that was not selected), and `reachable` (satisfies its incoming condition from the active node and is available to advance into). A seventh orthogonal indicator, `seen`, may be applied independently to any node already visited during the campaign and does not replace its enum state. An eighth orthogonal indicator, `coverage-gap`, may be applied independently to mark nodes that have no forward graph path from the current active node (not forward-reachable). It does not replace the six-state enum value; it is applied additively to indicate structural unreachability from the active position. Nodes not in any of these categories carry no simulation CSS modifier. No new visual state may be introduced outside this enum without updating this rule.

**Rationale:** The enum is consumed by five independent subsystems (CommonNode, ChoiceNode, EndingNode, ConditionalEdge, simulationStore selectors). Without a fixed vocabulary, each subsystem risks inventing its own ad-hoc visual states, leading to inconsistent rendering and ambiguous state semantics across the graph. The `coverage-gap` orthogonal indicator communicates structural isolation from the active node while preserving the primary six-state enum semantics.

---

## AR-17 — Boot-Time Side-Effect Isolation

All app-boot side effects — IndexedDB restore, store subscription wiring, and any future initialisation that must complete before first render — must be encapsulated in a single dedicated async function (currently `initPersistence()` in `src/main.jsx`). This function must complete before `createRoot().render()` is called. No boot-time I/O or store subscription wiring may be embedded directly in component lifecycle hooks or store initialisers.

**Rationale:** Centralising boot side effects in one place makes the startup sequence auditable and predictable. Ensuring it resolves before render prevents components from mounting with partially-restored state. Boot-level I/O that lives in component effects is invisible at the module layer and cannot be sequenced reliably relative to other boot concerns.

---

## AR-18 — Snapshot Shape Must Match Data Model Schema

When any store action constructs a snapshot object for persistence, the object's field set must exactly match the shape declared in the data model impact document for that feature. Every field present in the data model schema must appear in the snapshot; no field may be omitted. Specifically: if the schema separates data by type (e.g. `flagOverrides` for booleans, `statusOverrides` for numerics), the snapshot construction code must maintain that separation — not collapse them into a single field.

**Rationale:** The `statusOverrides` omission in the Campaign_Sheets feature demonstrated this bug class. A snapshot that writes to a different shape than the one the reader expects causes silent data loss on round-trip — the write appears to succeed but the values are reset to defaults on restore. Formalising this as a rule makes it a self-review checkpoint for any future feature that introduces persistence snapshots.

---

## AR-19 — Canvas-Space Operations From Outside ReactFlowProvider Must Use DOM Events

Components and hooks that need to trigger canvas-space operations (node creation at viewport center, fit-view, layout, modal open) but are rendered or mounted outside the `ReactFlowProvider` subtree must use the established custom DOM event pattern (`window.dispatchEvent(new CustomEvent('canvas-*', { detail: ... }))`) to communicate with `GraphCanvas`. `GraphCanvas` owns the listener and executes the operation using its own `useReactFlow()` context. Direct calls to React Flow hooks from outside the provider are not permitted.

**Rationale:** React Flow's hooks (`useReactFlow`, `screenToFlowPosition`, etc.) are context-bound — they throw or return incorrect values when called outside the `ReactFlowProvider` subtree. `TopBar` and all hooks mounted in `GraphCanvas` are outside the provider; any component in this position that needs canvas state must delegate to `GraphCanvas` via the event bus. This pattern was established by `graph-layout-tidy` and extended by this feature's `canvas-add-node` and `canvas-open-name-modal` events.

---

## AR-20 — Store-Action Signature Additions Must Be Declared in the Feature's Data Model Impact Document

When a feature adds optional parameters or new return values to existing store actions, those changes must be enumerated in the feature's `ran_0202_datamodelimpact.md` (or equivalent integration points document) before implementation begins. Additive signature changes are cross-file contracts: existing callers continue to work, but future callers and maintainers need a declared source of truth for the full current signature.

**Rationale:** The `addNode` optional `label` parameter and `return id` addition in the Context_menus_keyboard_shortcuts_creation_bar feature were not declared in the data model impact document, surfacing as a post-hoc audit finding. Even backward-compatible additions create implicit expectations; without declaration they can surprise future callers and complicate auditing.

---

## AR-21 — New Component Stylesheet Additions Must Be Explicit in the Feature File Map

When a new component requires new CSS rules added to `global.css` or a standalone `.css` file, that stylesheet change must be listed as an explicit file in the feature's file map (`ran_0202_filemap.md`) alongside the component file. It is not sufficient to bundle CSS additions implicitly with the component entry.

**Rationale:** `global.css` is a shared stylesheet — undeclared additions are invisible in per-phase file maps, making it difficult to audit which styles belong to which feature, track regressions, and review CSS specificity conflicts. Explicit file map entries ensure stylesheet changes are reviewed with the same rigour as component changes.

---

## AR-22 — Overlay Components Presenting Named Entities Must Expose Disambiguation Context

Any overlay component that presents a searchable or listable view of named narrative entities (nodes, flags, statuses, paths, chapters) must display sufficient context alongside each result to disambiguate entries that share the same label. For node-type entities, this means resolving and displaying the associated chapter name and/or path name inline in each result row. Non-node entities (paths, chapters, flags, statuses) that are containers rather than members are exempt.

**Rationale:** A project with 50+ nodes routinely has multiple entities sharing the same label (e.g., two "Start" nodes in different chapters). Without context, a palette or search result is ambiguous — the designer selects the wrong entity with no visible indication. The CommandPalette feature demonstrated this pattern: `resolveNodeContext()` joins `chapterId`/`pathId` against the narrative dictionaries and renders a `.palette-item__context` span when either is present. Formalising this as a rule prevents future overlay components from shipping without it.

---

## AR-23 — Zustand Store Subscriptions Must Use Per-Slice Selectors, Not Whole-Store Destructures

Components must not subscribe to a Zustand store by destructuring the entire store object (e.g., `const { nodes, flags, actions } = useNarrativeStore()`). Each subscription must target only the specific slice of state the component needs via a selector function (e.g., `useNarrativeStore(s => s.flag)`). This applies to all stores: `narrativeStore`, `uiStore`, `simulationStore`, `campaignStore`, `toastStore`.

**Rationale:** Whole-store destructuring causes the component to re-render on every state change to any field in the store, regardless of whether the component's actual data changed. At the scale of `narrativeStore` — which is mutated on every node drag, label edit, and side-effect change — this creates unnecessary re-render pressure on every subscribing component simultaneously. Per-slice selectors ensure components re-render only when their relevant slice changes. AR-14 addresses reference stability within selectors; this rule addresses subscription granularity. The CommandPalette feature surfaced a whole-store destructure (`CommandPalette.jsx:10`) as an open risk, prompting formalisation of this constraint.

---

## AR-24 — Store Fields With Multiple Writers Must Declare Each Writer's Guard Posture

When a single store field can be written by more than one action, the data model impact document (AR-20) must list each writer separately and declare its precondition contract — specifically whether the action requires a campaign to be active (`isCampaignActive` guard), is callable in any mode (unguarded), or has other preconditions. Each caller must choose the correct writer based on its own context.

**Rationale:** The Route_Tracing feature introduced two writers for `shortestRouteResults`: `computeRoutes` (campaign-guarded, calls the full pathfinder) and `setShortestRouteResults` (unguarded, used by the dialog in edit mode). This two-writer pattern is legitimate but was discovered only through a debugging loop (BUG-03) because only one writer was declared. Without explicit guard-posture declaration per writer, callers cannot distinguish which action is appropriate for their context — a campaign-mode caller might invoke the unguarded writer and bypass the guard invariant, or an edit-mode caller might be blocked by a guard it doesn't need. This rule extends AR-20 from "declare the action" to "declare each action's precondition contract."

---

## AR-25 — Dialogs With Shared-State Side Effects Must Consolidate All Close Paths in `handleClose`

Any dialog component that writes to a shared Zustand store as part of its primary action must implement a single `handleClose` function that performs all three cleanup steps atomically: (1) reset local transient state, (2) write the final state to the store (or clear partial state), and (3) set the dialog-open flag to false. All close paths — the cancel button, the post-action auto-close, and ESC key handling — must call this single function rather than independently managing the cleanup sequence.

**Rationale:** The Route_Tracing feature's `RouteFinderDialog` initially suffered BUG-02 (dialog did not auto-close after run) because `handleRun` performed the store write but not the dialog-close, while the close button performed the dialog-close but not a state cleanup. The two-path divergence caused local and shared state to drift. Dialogs that trigger shared-store writes are the class most prone to this failure mode because the store write is the novel responsibility that splits from the existing close contract. A single `handleClose` function makes the combined obligation explicit and ensures all paths execute the full cleanup, not a partial subset.
