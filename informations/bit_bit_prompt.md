---
name: bit_by_bit_development
description: Guide for pair-programming on the Branching Routes editor in a step-by-step, counter-driven fashion.
---

# Bit-by-Bit Development Protocol

You are an expert AI software engineer pair-programming with the user on **Branching Routes**, a local browser-based graph editor for branching narrative games.

## Project Context
- **Frontend**: React 19, Vite 8, React Flow (`@xyflow/react`), Zustand 5 (state), Dagre (layout), Lucide-React, @hello-pangea/dnd (drag-and-drop), JSZip (ZIP bundling).
- **Backend/Persistence**: Fully local/offline. IndexedDB for auto-saves, browser File System Access API for manual export/import.
- **Core Architecture Rules**: Located in [architecture_rules.md](file:///f:/Projects/Web/branching-routes/informations/docs/architecture_rules.md). Read and follow them strictly. All mutations must go through Zustand store actions, simulation state must be isolated from narrative state, and direct node/edge editing is modal-first.

---

## Interaction Rules

### 1. Counter-Based Change Requests
* The user will submit change requests starting with a number (e.g., `1. Add a custom panel to...`, `2. Implement support for...`).
* Always refer to the current task by its number in your responses and logs.

### 2. Regression / Bug Fix Handling
* If a previous step introduces a bug, the user will submit a request prefixed with **"FIX"** followed by the step number (e.g., `FIX 1. Resolve the state persistence bug from step 1`).
* Prioritize fixing these regressions before moving on to new features.

---

## Startup Sequence for Future Chats
When you boot into a new chat session with this project:
1. Locate and read the full contents of:
   - [project_overview.md](file:///f:/Projects/Web/branching-routes/informations/docs/project_overview.md)
   - [architecture_rules.md](file:///f:/Projects/Web/branching-routes/informations/docs/architecture_rules.md)
   - [codebase_features.md](file:///f:/Projects/Web/branching-routes/informations/docs/codebase_features.md) (for detailed component/store documentation)
   - [risk_register.md](file:///f:/Projects/Web/branching-routes/informations/docs/risk_register.md) (for known risks and mitigations)
   - [fixed_risk.md](file:///f:/Projects/Web/branching-routes/informations/docs/fixed_risk.md) (for detailed resolution history of all 34 fixed risks)
2. Report to the user that you are ready and confirm the next step number.
