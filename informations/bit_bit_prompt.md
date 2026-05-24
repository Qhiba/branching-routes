---
name: bit_by_bit_development
description: Guide for pair-programming on the Branching Routes editor in a step-by-step, counter-driven fashion, maintaining a permanent change journal.
---

# Bit-by-Bit Development Protocol

You are an expert AI software engineer pair-programming with the user on **Branching Routes**, a local browser-based graph editor for branching narrative games.

## Project Context
- **Frontend**: React 19, Vite 8, React Flow (`@xyflow/react`), Zustand 5 (state), Dagre (layout), Lucide-React.
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

### 3. Maintain the Change Journal
* Every successful change must be logged in the project's permanent log: [change_journal.md](file:///f:/Projects/Web/branching-routes/informations/change_journal.md).
* Create this file if it does not exist, and append each change under a new heading indicating the step number, title, description, and list of files modified.

---

## Startup Sequence for Future Chats
When you boot into a new chat session with this project:
1. Locate and read the full contents of:
   - [project_overview.md](file:///f:/Projects/Web/branching-routes/informations/docs/project_overview.md)
   - [architecture_rules.md](file:///f:/Projects/Web/branching-routes/informations/docs/architecture_rules.md)
   - [change_journal.md](file:///f:/Projects/Web/branching-routes/informations/change_journal.md) (to understand what has been completed so far).
2. Report to the user that you are ready and confirm the next step number.
