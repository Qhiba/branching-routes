# Phase 06 — File I/O & Acceptance Testing

## Goal
Wire the Save and Open file actions in the TopBar, and validate the complete Definition of Done by building and simulating a 5-node branching story with at least one boolean flag, one numerical variable, and one AND/OR condition.

## Produces
- `TopBar.jsx` — New, Open, Save buttons fully wired
- `fileSystem.js` — exercised and validated (fallback for non-Chromium browsers confirmed)
- No new source files — this phase wires existing work and validates correctness

## Dependencies Required Before This Phase
- Phase 01 through 05 complete
- `graphStore.exportGraph()` implemented (Phase 02)
- `graphStore.loadGraph()` implemented (Phase 02)
- `graphStore.newGraph()` implemented (Phase 02)
- `utils/fileSystem.js` implemented (Phase 02)

## Reference Documents
- `ran_0003_architecture.md` — AR-09 (schema version), AR-10 (no network), AR-05 (single source of truth)
- `ran_0003_datamodel.md` — minimal valid file example, `schemaVersion` field
- `ran_0003_filemap.md` — `TopBar`, `fileSystem.js`
- `ran_0003_risks.md` — RISK-03 (File System Access API fallback)

## Steps

### 1. Wire **New** button in `TopBar.jsx`

`onClick`:
1. Show a browser `confirm()` dialog: "Start a new project? Unsaved changes will be lost."
2. If confirmed, call `graphStore.newGraph()` and `simulationStore.reset()`.

### 2. Wire **Open** button in `TopBar.jsx`

`onClick`:
1. Call `openFile()` from `utils/fileSystem.js`
2. On success: call `graphStore.loadGraph(data)` and `simulationStore.reset()`
3. On error `'unsupported_schema_version'`: show alert "This file uses an unsupported format version. Please open a valid Branching Routes file."
4. On user cancel (the file picker was closed without selecting): do nothing silently

### 3. Wire **Save** button in `TopBar.jsx`

`onClick`:
1. Call `graphStore.exportGraph()` to get the serialisable object
2. Call `saveFile(graphData)` from `utils/fileSystem.js`
3. On success: briefly show a "Saved ✓" status indicator in the TopBar (auto-dismiss after 2 seconds using `setTimeout` + `useState`)
4. On error: show alert "Save failed. Check browser permissions for file access."

### 4. Validate File System API Fallback (RISK-03)

Open the app in Firefox (or any non-Chromium browser). Attempt to Save. Confirm the browser's native download dialog appears (not a JS error). Attempt to Open. Confirm a file picker input appears. Log results in Verification below.

### 5. Acceptance Test — Full Definition of Done

Build the following graph in the running app to validate scope Q5's Definition of Done:

**Flags:**
- `has_key` (boolean, default: `false`)
- `player_score` (number, default: `0`)

**Nodes:**
1. **"Entrance Hall"** — Start node; side effect: `player_score += 1`
2. **"Locked Door"** — no side effects
3. **"Key Room"** — side effect: `has_key = true`
4. **"Inner Chamber"** — no side effects
5. **"Dead End"** — no side effects

**Edges:**
- Entrance Hall → Locked Door: condition `has_key == true` (locked initially)
- Entrance Hall → Key Room: no condition (always passable)
- Key Room → Entrance Hall: no condition (loop back)
- Entrance Hall → Dead End: no condition (always passable)
- Locked Door → Inner Chamber: no condition

**Expected simulation behaviour:**
1. Start simulation at Entrance Hall. `player_score` becomes 1, `has_key` is false.
2. Reachable from Entrance Hall: Key Room, Dead End (not Locked Door — condition fails).
3. Advance to Key Room. `has_key` becomes true.
4. Reachable from Key Room: Entrance Hall.
5. Advance to Entrance Hall. `player_score` becomes 2.
6. Now Locked Door is reachable (condition `has_key == true` passes).
7. Advance to Locked Door → Inner Chamber accessible.

## Acceptance Criteria
- Done when:
  1. The 5-node graph described above can be built entirely through the UI (no console commands)
  2. The simulation behaves exactly as described in the Expected Simulation Behaviour above
  3. The graph can be Saved (a `.json` file is downloaded/written)
  4. The same `.json` file can be Opened and the graph is fully restored (nodes, edges, flags, positions, conditions all present)
  5. Zero console errors throughout

## Verification
1. Build the 5-node Entrance Hall graph as described above
2. Run the simulation. Verify step-by-step:
   - Step 1: Locked Door is NOT reachable (no pulse animation)
   - Step 2: Advance to Key Room — `has_key = true` in console: `useSimulationStore.getState().currentFlagValues`
   - Step 3: Loop back to Entrance Hall — Locked Door now pulses as reachable
3. Save the graph as `test_save.json`. Open the file in a text editor — confirm `schemaVersion: 1` is present and all 5 nodes are listed.
4. Click New → confirm canvas clears
5. Click Open → select `test_save.json` → confirm the 5-node graph is fully restored with all conditions intact
6. Open the app in Firefox — confirm Save downloads a file without JS errors (RISK-03 validation)

---

## Phase Complete — Project Scope Satisfied

This phase marks the completion of the MVP defined in `ran_0002_scope.md` Q5:

> "Designer can build a 5-node branching story, set a boolean flag and a numerical variable, apply an AND/OR condition to a path, and see the graph visually update to reflect which paths are reachable."

All Phases 01–06 complete = **Branching Routes v1.0 — MVP Done**.
