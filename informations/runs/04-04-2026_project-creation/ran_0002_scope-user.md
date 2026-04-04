## SCOPE CHECKLIST (answer before moving to Plan)

> **Input:** Read your brainstorm report first.
> `informations/runs/[DD-MM-YYYY]_project-creation/ran_0001_brainstorm.md`
>
> **Output:** Copy this template into your project and fill it in.
> Save to: `informations/runs/[DD-MM-YYYY]_project-creation/ran_0002_scope.md`

Answer every question. Keep answers short — 1–3 sentences max.

---

### Convergence

1.  Q: Which ideas from the brainstorm are you picking, and why?
    A:
    Live simulation always running + graph viewport as the entire app + sandbox state testing. Always-running simulation eliminates manual stepping, making state changes immediately visible; full-window graph canvas removes UI friction for narrative designers; sandbox toggling lets writers instantly test 'what if' flag combinations. These three directly address the core V1 pain point: slow, linear debugging of conditional paths.

2.  Q: What are you explicitly rejecting from the brainstorm, and why?
    A:
    - Rejecting V1’s ‘editor with optional simulator’ — V2 is a live simulation engine first. 
    - Rejecting fixed sidebars and start/stop stepping; the whole app is the graph viewport with always‑running simulation. 
    - Rejecting ‘Scene’ vocabulary in favor of ‘Common Node’. Rejecting random, non‑hierarchical sub‑element IDs; V2 uses hierarchical IDs on export. 
    - Rejecting linear state testing; V2 uses sandbox toggles. 
    - Rejecting undo/redo (no need), batch‑change operations (only multi‑select for moving), light mode (dark only), and V1 data migration (start clean).”

---

### Boundary

3.  Q: What is the ONE thing this first push must deliver?
    A:
    A complete graph-based narrative flow engine with live simulation, full-viewport graph editing, campaign-based state testing, route tracing, and JSON/ZIP import/export — delivering all five implementation phases from the rebuild specification.

4.  Q: What is explicitly out of scope for this push?
    A:
    None — all implementation phases (1–5) are in scope for this push.

5.  Q: What is the definition of done?
    A:
    - [ ] Project setup (Vite + React + Zustand + Vanilla CSS)
    - [ ] Zustand stores: narrative store, UI store
    - [ ] Data model: CRUD for all entity types
    - [ ] IndexedDB persistence with error surfacing
    - [ ] Import/export (JSON only, no ZIP yet)
    - [ ] React Flow integration — full-viewport canvas
    - [ ] Custom node renderers (Common Node, Choice, Ending)
    - [ ] Edge rendering with connection logic
    - [ ] Right-click context menu
    - [ ] Floating inspector panel
    - [ ] Keyboard shortcuts
    - [ ] Dagre auto-layout
    - [ ] Node state management (active/locked/complete/failed/branch_locked)
    - [ ] Seen tracking (unseen/partially_seen/seen)
    - [ ] Live condition evaluation on state change
    - [ ] Edge highlighting based on condition results
    - [ ] Reachability analysis with visual warnings
    - [ ] Campaign sheet: create, save, load, reset, switch
    - [ ] Basic route trace (all paths between two nodes)
    - [ ] Shortest path (fewest nodes)
    - [ ] Path/Chapter/Flag/Status annotations on routes
    - [ ] Goal-directed pathfinding Mode A ("how to reach X?")
    - [ ] Filtered route trace (by path, chapter, flag, status)
    - [ ] Route trace visual overlay on graph
    - [ ] ZIP export/import with campaign files
    - [ ] Goal-directed pathfinding Mode B ("what do I need for X?")
    - [ ] Command palette
    - [ ] Minimal top bar + bottom status strip
    - [ ] Toast notification system
    - [ ] Performance optimization for large graphs

---

### Foundation

6.  Q: What tech stack and platform decisions are locked?
    A:
    React 19+ + Vite, plain JavaScript (JSX/ES6+, no TypeScript), @xyflow/react (graph canvas), Zustand (state management), localforage (IndexedDB), lucide-react (icons), JSZip (archive), @dagrejs/dagre (auto-layout), @dnd-kit (drag-and-drop), Vanilla CSS, browser-only, no backend, dark mode only.

7.  Q: What is the initial file/folder structure?
    A:
    Standard Vite scaffold. 
    Components in src/components/, state in src/store/, utilities in src/utils/.

---

### Risk

8.  Q: What assumptions am I making that could be wrong?
    A:
    - **Simulation Performance at Scale**, If the graph has 200+ nodes, recalculating reachability and condition evaluation on every flag/status toggle could cause UI lag.

    - **Goal-Directed Pathfinding Complexity**, Finding "what flags/statuses do I need to reach node X?" is a constraint satisfaction problem. With complex nested AND/OR conditions and mutual dependencies, worst-case is exponential.  

    - **Campaign State Consistency**, If the user edits the data model (renames a node ID, deletes a flag), existing campaign sheets may reference stale IDs.  

    - **ZIP Import/Export Browser Support**, ZIP creation/extraction in the browser requires a library (JSZip) and has file size limitations.  

    - **Top-Level ID Renumbering Still Requires Reference Replacement**, Although sub-element IDs are now random, renumbering `N001` → `N003` still requires updating every `target`, `flag`, `status` reference to that entity across the data model. 
