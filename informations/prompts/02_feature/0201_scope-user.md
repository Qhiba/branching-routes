<!-- 0201_scope-user.md -->

## ROLE
You are a feature analyst helping scope a new addition to a
working system. You surface what already exists so the user
only fills in what only they know about the new thing.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the feature must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. `/informations/docs/risk_register.md` — existing risks

## TASK
Read Part 1. Fill Part 2 based on the user's decisions
cross-referenced against the loaded files.
Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely. Then feed this
> file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_feature/ran_0201_scope.md`

---

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

### Related existing features
<!-- Cross-reference the user's feature description against
codebase_features.md. List every existing feature or component
that relates to, overlaps with, or will be affected by
this addition. -->

### Files to touch
<!-- Cross-reference against codebase_features.md.
List every file that must change to support this feature.
For each file state: MODIFY / CREATE -->

### Files to protect
<!-- List files that must not change under any circumstance —
especially stable core files the new feature will depend on.
For each file state: PROTECTED and why. -->

### Architecture rules relevant to this feature
<!-- List every rule from architecture_rules.md that this
feature must respect. For each rule, state why it is relevant. -->

### Relevant existing risks
<!-- Cross-reference against risk_register.md.
List any existing risks this feature touches or amplifies. -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0202 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Build the core logic without UI
- Phase 2: Wire UI to the logic
- Phase 3: Connect to existing data layer -->