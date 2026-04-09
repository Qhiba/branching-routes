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
    A working graph canvas where the designer can create nodes, connect them with other nodes, set boolean flags, and see the simulation highlight active paths in real time.

4.  Q: What is explicitly out of scope for this push?
    A:
    Node Route tracing and backtracing feature

5.  Q: What is the definition of done?
    A:
    Designer can build a 5-node branching story - with a common-node, choice node, and ending node as the main node - toggle a boolean flag, and see the graph visually update to reflect which paths are reachable.

---

## Part 2 — AI fills, user does not edit
### Foundation

6.  Q: What tech stack and platform best fits this project and user's constraints?
    A:
    <!-- example: "React + Vite, plain JavaScript (no TypeScript), browser-only, no backend." -->

7.  Q: What is the initial file/folder structure?
    A:
    <!-- example: "Standard Vite scaffold. Components in src/components/, state in src/store/, utilities in src/utils/." -->

---

### Risk

8.  Q: What assumptions am I making that could be wrong?
    A:
    <!-- example: "Assuming React Flow will handle the graph rendering without heavy customization. If it doesn't, I may need to switch to a canvas-based approach." -->
