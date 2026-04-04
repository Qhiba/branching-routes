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
    <!-- example: "Product shape #2 (web app with offline storage) + MVP boundary #1 (editor only, no simulation). Web app gives zero-install access; starting without simulation keeps scope small." -->

2.  Q: What are you explicitly rejecting from the brainstorm, and why?
    A:
    <!-- example: "Desktop app shape — adds packaging/distribution complexity for no benefit at this stage. Also rejecting multiplayer collaboration — too large for a first version." -->

---

### Boundary

3.  Q: What is the ONE thing this first push must deliver?
    A:
    <!-- example: "A working graph editor where the user can create nodes, connect them, and export the structure as JSON." -->

4.  Q: What is explicitly out of scope for this push?
    A:
    <!-- example: "Simulation/playback, branching condition logic, save/load from browser storage, any styling beyond functional layout." -->

5.  Q: What is the definition of done?
    A:
    <!-- example: "User can add 5+ nodes, connect them with edges, and click Export to get a valid JSON file that could be re-imported later." -->

---

### Foundation

6.  Q: What tech stack and platform decisions are locked?
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