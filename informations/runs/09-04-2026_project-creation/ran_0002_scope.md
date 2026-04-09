## ROLE
You are a product strategist helping scope a new software project.
You make the hard tradeoff decisions so the user doesn't have to.

## CONTEXT
Read the brainstorm report first:
`ran_0001_brainstorm.md`

## TASK
Pre-fill every answer below based on the brainstorm output.
Keep answers to 1–3 sentences. Be decisive — do not hedge.
Save to: `informations/runs/[DD-MM-YYYY]_project-creation/ran_0002_scope.md`

> **For the user:** Review Part 1 only. Correct anything that doesn't match your intent. Do not touch Part 2.

---

## Part 1 — Review and correct if needed
### Convergence

1.  Q: Which ideas from the brainstorm are you picking, and why?
    A:
    - Product shape #1, except the `can be installed on desktop`, running it on the localhost is fine.
    - Coure user workflows #1, the playtest shoudn't be split screened. I was thinking of more `live` checker with the node can have status dan can be changed by the user on the go and the system are calculating the possible next node.
    - Differentiation #1 and #2, both are combined to create a better engine, route finder, and backtracking system to search on how to reach x node.
    - MPV Boundary #1 and #2, the json are the main datamodel of this canvas but it also act as a visualizer of narrative, such as highlighting active node, highligting the edges of possible node, higlighting chosen choice option and dimmed others.
    - Risks and unknown #1 address the problem and add the feature to solve the problem.


2.  Q: What are you explicitly rejecting from the brainstorm, and why?
    A:
    - Product shape #2, it is too complex and my target are not coder or programmer.
    - Core user workflows #2, again it is too complex for code or text integration, the vision are to create a figma like drag-n-drop graph system.
    - MPV Boundary #2, it is not for visualizer of exiting Narrative Script files, at least for now.

---

### Boundary

3.  Q: What is the ONE thing this first push must deliver?
    A:
    A working graph canvas where the designer can create nodes, connect them with choices, define flags (boolean and numerical), apply AND/OR conditions to edges, and see the simulation highlight active paths in real time.

4.  Q: What is explicitly out of scope for this push?
    A:
    Node Route tracing and backtracing feature

5.  Q: What is the definition of done?
    A:
    Designer can build a 5-node branching story, set a boolean flag and a numerical variable, apply an AND/OR condition to a path, and see the graph visually update to reflect which paths are reachable.

---

## Part 2 — AI fills, user does not edit
### Foundation

6.  Q: What tech stack and platform best fits this project and user's constraints?
    A:
    React + Vite for a fast, browser-based localhost application without a backend. React Flow handles the visual canvas and node interactions, while Zustand manages the global graph state and live variable checking.

7.  Q: What is the initial file/folder structure?
    A:
    A standard Vite React scaffold. Components (canvas, nodes, toolbars) live in `src/components/`, state management and graph traversal logic in `src/store/`, utility functions (like JSON parsing) in `src/utils/`, and global styles in `src/styles/`.

---

### Risk

8.  Q: What assumptions am I making that could be wrong?
    A:
    Assuming that React Flow can fluently handle the real-time "live checker" state updates and path highlighting without suffering performance bottlenecks. Assuming that users will be comfortable managing local JSON files instead of an integrated cloud save system.
