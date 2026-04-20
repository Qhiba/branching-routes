<!-- ran_0201_scope.md -->

## Part 1 — User fills

### Feature name
<!-- [SNAKE_CASE NAME] -->
Command_palette_toast_Visual_Node_Clustering

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
Adds three power-user feature layers on top of the existing canvas. 
**`Ctrl+K` command palette** — searchable overlay covering all narrative entities (common/choice/ending nodes, flags, statuses, paths, chapters) plus static actions. Selecting an entity pans and zooms the canvas to it; selecting an action fires the underlying store mutation or dispatches the matching custom DOM event. 

**Toast notifications** — top-right stacked auto-dismiss messages with `info`/`success`/`warning`/`error` variants, owned by a new `toastStore`. 

**Visual node clustering** — translucent colored regions rendered behind nodes on the canvas, with two distinct visual treatments: chapters render as corner-based rounded-rectangle regions hugging their node bounding box, paths render as non-corner-based soft blob smears (SVG hulls with Gaussian blur, ~20% opacity). Toggle via a button in the top bar and a G keyboard shortcut that cycles through `off` → `chapter` → `path` → `both` → `off`. Colors are auto-assigned from a hashed palette keyed to entity ID so no schema change is needed.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- Does not add a minimap — `<MiniMap />` already exists in `GraphCanvas.jsx.`
- Does not add route tracing. Push 13 owns that. The toast API ships here as general-purpose infrastructure; Push 13 consumes it for route result messages.
- Does not restyle any existing UI. Push 14.
- Does not change the data model. No `color` field added to `path`/`chapter` — cluster colors are derived at render time.
- Does not persist cluster toggle state across sessions unless trivial to add via `uiStore` (decide during Plan step).
- Does not allow user-chosen cluster colors. Auto-assigned from palette hash only.
- Does not add cluster-based filtering, bulk-selection, or drag-group-as-unit. Visual only.
- Does not add command palette history, favorites, or fuzzy-ranking tuning beyond simple substring match.
- Does not relocate the `Ctrl+K` trigger to a button. Keyboard-only.
- Does not change simulation, persistence, campaigns, or any store behavior for authoring.

### Why this feature is needed now
Three unrelated gaps converge at this point in the sequence.

**Navigation at scale**. Previous update made entity creation fast via shortcuts and creation bar, but entity finding is still slow — the only way to jump to a specific node is to pan the canvas and eyeball it. At ~50+ nodes this is the dominant friction point. Command palette collapses "find and jump to X" into a keystroke and a few letters, completing the keyboard-first authoring loop Push 11 started.

**Invisible organizational structure**. Current system has paths and chapters as first-class entities, but their presence on the canvas is currently zero — a node's chapter is a dropdown value in the inspector, not something you can see at a glance. Visual clustering makes the organizational layer actually visible, turning paths and chapters from labels into spatial regions. The chapter-vs-path visual split (corner-based vs blob) also clarifies that these are two different kinds of grouping — structural containers vs. narrative threads — not two words for the same thing.

**Toast infrastructure before Route Tracing Feature**. Route tracing produces results that need a feedback channel ("Route found: 7 hops" / "No route exists"). Building the toast system as part of Push 12 lets it ship standalone, tested, and documented — so route tracing can consume it cleanly rather than bundling notification plumbing with pathfinding logic.
All three are self-contained additions that require no schema change, no simulation change, and no shell change. Doing them before Push 10 keeps the shell refactor's target surface complete — Push 10 will know exactly what it's housing.


### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| ADD | `src/components/CommandPalette.jsx` | Search entities, execute actions, navigate |
| ADD | `src/components/Toast.jsx` | Top-right auto-dismiss notifications |
| MODIFY | `src/components/GraphCanvas.jsx` | Minimap integration, node clustering toggle |
| MODIFY | `src/App.jsx` | Toast + CommandPalette mount points |


### Assumptions I am making
<!-- [LIST OR "NONE"] -->
This will come with a risk that I don't know how to mitigate:
- **Missing Definition of done**, I don't know what to add or modify for the Visual Node Clustering feature.

**Ctrl+K conflicts with Firefox's search bar focus**. Firefox claims Ctrl+K for "focus search bar." ``event.preventDefault()`` must fire before the browser handles it. Test specifically on Firefox. (Chrome has no default binding for Ctrl+K.)

**Command palette ESC double-handling** — same class as RISK-CMK-08. The global shortcut hook handles ESC → `clearSelection`. Palette's ESC-to-close must `stopPropagation` before dispatching close, or the canvas selection will clear underneath the dismissed palette.

**Command palette input field vs. global shortcut guard**. The palette's search input is an input field. When the user types "N" to search for "North Tower," the keyboard hook's input-field guard (RISK-CMK-01) must fire correctly. Current guard checks ``event.target`` tag — should work, but verify the palette input's render path.

**Command palette search over large entity sets triggers re-render on each keystroke**. If the palette subscribes to `narrativeStore` and filters on every keystroke, a 500-node graph with a 10-letter query does 5000 filter passes. Memoize the search index; rebuild only when store state actually changes, not on every keystroke.

**Toast store infinite loop risk (AR-14)**. If `toasts` is read via `useToastStore(s => s.toasts)` and a toast fires on render, new array reference → re-render → fires toast → loop. Return references, not new literals. Toast-add calls should be idempotent or firing should be in effects, not render.

**Minimap re-render storms (RISK-01)**. Minimap subscribes to React Flow's node/edge state internally — fine. But if the node color function reads `chapterId` → looks up `chapter` in `narrativeStore` → returns a new color on every render, it can thrash. Memoize the color function outside the JSX or use `useCallback` with stable deps.

**Node clustering by chapter/path at 200+ nodes**. If clustering renders colored overlays behind nodes, that's another render layer on the canvas. May compound with RISK-01. Keep clustering opt-in, not default-on.

**Command palette entity collisions**. Two nodes named "Start" in different chapters — palette shows them ambiguously. Display `chapter / path` context inline in results, or the palette becomes frustrating on real projects.

**Campaign-mode command palette behavior**. During campaign mode, authoring commands ("Create Flag...") must be disabled or hidden. Navigation commands ("Jump to node") should remain available. Filter the command list by `isCampaignActive` in the palette.

**Toast-to-route-tracing coupling deferred**. Next Update will produce the actual route messages. This update should ship a general-purpose `addToast(message, variant)` API and leave consumer wiring to downstream pushes. Avoid hardcoding route-specific toast content here.

**Toast z-index stack vs. ContextMenu vs. NameModal vs. CommandPalette**. Four overlay layers now. Establish an explicit z-index scale in `tokens.css` — don't let each component invent its own.

---


## Part 2 — AI fills, user does not edit

---

### Related existing features

| Component / Store | How it relates |
|---|---|
| `src/hooks/useKeyboardShortcuts.js` | Must gain two new shortcut bindings: `Ctrl+K` (open/close palette) and `G` (cycle cluster mode). The existing input-field guard bails on single-key shortcuts — `Ctrl+K` is a modifier combo and must be intercepted before or outside that guard so it works even when the palette's own `<input>` is focused. |
| `src/components/GraphCanvas.jsx` | Receives two new responsibilities: (1) cluster overlay SVG layer rendered behind nodes; (2) a `canvas-navigate-to-node` custom DOM event listener that pans and zooms to the target node using `useReactFlow().setCenter()`. Both are additive — existing canvas wiring is unchanged. |
| `src/store/uiStore.js` | Owns all UI-only state. `clusterMode` (`'off' | 'chapter' | 'path' | 'both'`) and `cycleClusterMode` action belong here per AR-03. The cluster toggle button in `TopBar` and the `G` shortcut both write to this field. |
| `src/store/narrativeStore.js` | The command palette reads `common`, `choice`, `ending`, `flag`, `status`, `path`, and `chapter` dictionaries to build its search index. Read-only — no mutations from this feature. |
| `src/components/TopBar.jsx` | Receives the cluster toggle button (cycles through `off → chapter → path → both → off`). Mounts alongside the existing Tidy Layout and Snap-to-Grid controls. |
| `src/components/ContextMenu.jsx` | An existing overlay layer. Its z-index must be placed on the explicit scale being added to `tokens.css` in this feature. No logic changes. |
| `src/components/NameModal.jsx` | An existing overlay layer. Same z-index scale placement concern. No logic changes. |
| `src/styles/tokens.css` | Receives the project's first explicit z-index scale (`--z-cluster`, `--z-context-menu`, `--z-modal`, `--z-palette`, `--z-toast`). Also receives cluster palette color tokens for auto-hashed entity colors. |
| `src/styles/global.css` | Receives new CSS blocks for Toast, CommandPalette, and cluster overlay regions. Per AR-21, all three must be listed explicitly in the feature file map. |
| `src/App.jsx` | Receives two new mount points: `<Toast />` and `<CommandPalette />`. Both are overlay components positioned fixed in the viewport — correct mount point per AR-19 (they are outside `ReactFlowProvider`, so they cannot call `useReactFlow()` directly; palette navigation must go via DOM event). |

---

### Files to touch

| Action | File | Reason |
|---|---|---|
| CREATE | `src/components/CommandPalette.jsx` | Searchable overlay component — entity search index, keyboard navigation, action dispatch, ESC-to-close with `stopPropagation` |
| CREATE | `src/components/Toast.jsx` | Top-right fixed overlay, reads `toastStore`, renders stacked auto-dismiss messages |
| CREATE | `src/store/toastStore.js` | Owns `toasts[]`, `addToast(message, variant)`, auto-dismiss timer logic, `removeToast(id)` |
| MODIFY | `src/App.jsx` | Mount `<Toast />` and `<CommandPalette />` inside the root layout |
| MODIFY | `src/store/uiStore.js` | Add `clusterMode: 'off'` initial state and `cycleClusterMode` action |
| MODIFY | `src/store/index.js` | Re-export `useToastStore` from the barrel |
| MODIFY | `src/components/GraphCanvas.jsx` | (1) Render cluster overlay SVG layer below React Flow nodes; (2) listen for `canvas-navigate-to-node` event and call `setCenter` |
| MODIFY | `src/components/TopBar.jsx` | Add cluster mode cycle button (reads `clusterMode`, calls `cycleClusterMode`) |
| MODIFY | `src/hooks/useKeyboardShortcuts.js` | Add `Ctrl+K` (before input-field guard) to toggle palette; add `G` (after guard) to `cycleClusterMode` |
| MODIFY | `src/styles/tokens.css` | Add explicit z-index scale; add cluster palette color tokens |
| MODIFY | `src/styles/global.css` | Add CSS blocks for Toast, CommandPalette overlay, and cluster overlay SVG regions |
| MODIFY | `src/components/index.js` | Add `CommandPalette` and `Toast` barrel exports |

---

### Files to protect

| File | Why protected |
|---|---|
| `src/store/narrativeStore.js` | **PROTECTED** — Data model must not change (user constraint: no `color` field, no schema bump). Palette reads this store; it must never write to it. |
| `src/store/simulationStore.js` | **PROTECTED** — Simulation isolation (AR-08). Cluster overlays are purely visual and must not read or write simulation state. |
| `src/store/campaignStore.js` | **PROTECTED** — No campaign changes in scope. |
| `src/utils/conditionEvaluator.js` | **PROTECTED** — Pure utility untouched by this feature (AR-07). |
| `src/utils/fileSystem.js` | **PROTECTED** — No schema change, no persistence change. `toastStore` is ephemeral and must not be wired into IndexedDB. |
| `src/utils/uuid.js` | **PROTECTED** — No changes needed; `generateId` is already available to the new store. |
| `src/main.jsx` | **PROTECTED** — `toastStore` is ephemeral and requires no boot-time restore or IndexedDB subscriber. Adding one would violate AR-17 without justification. |
| `src/components/nodes/CommonNode.jsx` | **PROTECTED** — Cluster overlays render behind nodes in the canvas, not on the node components. No node renderer changes needed. |
| `src/components/nodes/ChoiceNode.jsx` | **PROTECTED** — Same as CommonNode above. |
| `src/components/nodes/EndingNode.jsx` | **PROTECTED** — Same as CommonNode above. |
| `src/components/edges/ConditionalEdge.jsx` | **PROTECTED** — No edge rendering changes in scope. |
| `src/utils/index.js` | **PROTECTED** — `toastStore` exports come from the store barrel (`store/index.js`), not the utils barrel. No change needed. |

---

### Architecture rules relevant to this feature

| Rule | Why it applies |
|---|---|
| **AR-01 — File naming** | `CommandPalette.jsx` and `Toast.jsx` are PascalCase components. `toastStore.js` is camelCase with `store` suffix. All correct. |
| **AR-03 — State management** | `clusterMode` state belongs in `uiStore` (UI-only). `toasts[]` belongs in `toastStore`. The palette's search text is local `useState` (UI-only, ephemeral, never narrative data). |
| **AR-04 — Data layer separation** | The palette reads narrative entities via `useNarrativeStore` selectors. Any action it fires (e.g., "Create Flag") must go through the matching store action. Navigation dispatches a DOM event — `GraphCanvas` performs the actual canvas operation. |
| **AR-06 — Import constraints** | `useToastStore` must be re-exported from `store/index.js`. `CommandPalette` and `Toast` must be re-exported from `components/index.js`. Ensure `toastStore.js` does not import `narrativeStore` or `simulationStore` at module level to avoid circular imports. |
| **AR-08 — Simulation isolation** | Cluster overlays derive colors from entity IDs at render time — they must not read `simulationStore` state. Overlays remain visually stable regardless of campaign mode. |
| **AR-14 — Zustand selector stability** | `toastStore` must initialise `toasts: []` so selectors never use a `?? []` fallback (which returns a new array reference on every call). `clusterMode` is a string primitive — stable by definition. No selector in any new store may return a new `[]` or `{}` literal. |
| **AR-19 — Canvas operations via DOM events** | `CommandPalette` mounts in `App.jsx`, outside `ReactFlowProvider`. Its "jump to entity" action must dispatch `window.dispatchEvent(new CustomEvent('canvas-navigate-to-node', { detail: { nodeId } }))`. `GraphCanvas` owns the listener and calls `useReactFlow().setCenter()` internally. Direct `useReactFlow()` calls from the palette are forbidden. |
| **AR-20 — Declare store action changes** | `cycleClusterMode` on `uiStore`, `addToast`/`removeToast` on `toastStore`, and the `Ctrl+K`/`G` additions to `useKeyboardShortcuts` are cross-file contracts — all must be declared in the data model impact document before implementation begins. |
| **AR-21 — CSS additions explicit in file map** | Three new CSS blocks (Toast, CommandPalette, cluster overlay) go into `global.css`. Cluster color tokens and z-index scale go into `tokens.css`. All five must be their own line items in the feature file map. |

---

### Relevant existing risks

| Risk | How this feature touches or amplifies it |
|---|---|
| **RISK-01 — Re-render storms** | Cluster overlays compute chapter/path bounding boxes over all node positions on every render. At 200+ nodes this amplifies the existing risk. Mitigation: memoize bounding box computation (`useMemo`) keyed on node position array reference; rebuild only when positions change. Default `clusterMode: 'off'` prevents the cost unless the designer activates it. |
| **RISK-CMK-01 — Shortcuts fire inside input fields** | The existing input-field guard correctly suppresses `G` when the palette search input is focused. However, `Ctrl+K` must fire even from within the palette input (to allow closing the palette while typing). Intercept `Ctrl+K` before the input-field guard in the keyboard hook. |
| **RISK-CMK-08 — ESC double-handling** | The palette must attach its own `keydown` listener calling `event.stopPropagation()` before closing — the same pattern already used by `NameModal.jsx`. This is not resolved automatically; it must be deliberately implemented for `CommandPalette`. |
| **AR-14 (toast loop)** | If `addToast` is called during render (e.g., from a `useEffect` with unstable deps), the new toast triggers a re-render → `addToast` fires again → infinite loop. All `addToast` calls must live in event handlers or effects with stable deps — never inline in render. |

**New risks introduced (not yet in register — add during Plan step):**

| Suggested ID | Description |
|---|---|
| `RISK-CP-01` | `Ctrl+K` claims Firefox's search-bar focus — `event.preventDefault()` must fire first in the handler; test on Firefox specifically. |
| `RISK-CP-02` | Entity name collisions in palette results — two nodes named "Start" in different chapters appear ambiguously. Display `chapter / path` context inline in each result row. |
| `RISK-CP-03` | Palette search performance at scale — filtering 500 nodes on every keystroke is expensive. Memoize the search index; rebuild only when `narrativeStore` state changes, not on every keystroke. |
| `RISK-CP-04` | Campaign-mode palette action filtering — authoring actions ("Create Flag") must be hidden or disabled when `isCampaignActive`; navigation actions ("Jump to node") must remain. Gate by `isCampaignActive` in the palette render. |
| `RISK-CP-05` | z-index collision across four overlay layers (cluster / ContextMenu / NameModal / CommandPalette / Toast) — without an explicit scale in `tokens.css`, any component can silently win the stack. Establish the scale in Phase 1. |
| `RISK-CP-06` | Cluster color hash function instability — if the color derivation function is recreated on each render it breaks `React.memo` on the overlay. Define it outside the component or in a stable `useCallback`. |

---

### Suggested phase shape

**Phase 1 — Toast infrastructure (fully standalone)**

Files: `toastStore.js` (CREATE), `Toast.jsx` (CREATE), `App.jsx` (MODIFY), `store/index.js` (MODIFY), `components/index.js` (MODIFY), `tokens.css` (MODIFY — z-index scale + toast tokens), `global.css` (MODIFY — Toast CSS block).

Stop condition: `useToastStore.getState().addToast('Hello', 'success')` called from browser DevTools renders a top-right toast that auto-dismisses. No other feature needed to test this phase.

---

**Phase 2 — Command Palette**

Files: `CommandPalette.jsx` (CREATE), `App.jsx` (MODIFY — add mount point), `useKeyboardShortcuts.js` (MODIFY — Ctrl+K), `GraphCanvas.jsx` (MODIFY — `canvas-navigate-to-node` listener), `components/index.js` (MODIFY), `global.css` (MODIFY — palette CSS block).

Stop condition: `Ctrl+K` opens the palette; typing "Forest" finds the Forest Entrance node; pressing Enter pans the canvas to it; ESC closes the palette without clearing canvas selection; authoring action buttons are hidden during campaign mode.

---

**Phase 3 — Visual Node Clustering**

Files: `uiStore.js` (MODIFY — `clusterMode` + `cycleClusterMode`), `useKeyboardShortcuts.js` (MODIFY — G shortcut), `TopBar.jsx` (MODIFY — cluster button), `GraphCanvas.jsx` (MODIFY — SVG overlay layer), `tokens.css` (MODIFY — cluster palette colors), `global.css` (MODIFY — cluster overlay CSS).

Clustering rendering detail:
- Chapters: corner-based rounded-rectangle SVG `<rect>` hugging the node bounding box
- Paths: SVG `<polygon>` or `<path>` hull with `feGaussianBlur` filter applied, ~20% opacity, no corners
- Colors: deterministic hash of entity ID mapped to a fixed palette array — no store field, no schema change

Stop condition: `G` cycles through all four modes; chapter regions appear as sharp-cornered translucent boxes; path regions appear as soft blobs; toggling to `'off'` removes all overlays; clusters are visible at default zoom and remain stable when panning.
