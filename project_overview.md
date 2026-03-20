# Branching Narrative Editor: Project Overview

---

## The Problem

A branching narrative game grows in complexity exponentially with every choice added. The core challenge is that the entire story is controlled by **flags** — boolean states that remember what the player did. Every scene, every dialogue, every ending depends on which flags were set and which were not.

Managing this logic by hand in raw JSON files causes three compounding problems:

**1. It is error-prone.**
Referencing a flag ID that doesn't exist, forgetting to set a flag after a choice, or writing a condition backwards are all silent errors. Nothing tells you something is wrong until the game breaks during play.

**2. It is hard to visualize.**
When a scene requires five flags in specific states, it is nearly impossible to mentally trace whether that scene is actually reachable from any real playthrough. Dead ends and unreachable content accumulate invisibly.

**3. It is difficult to test.**
Verifying that a specific ending is reachable requires manually tracking every flag dependency across every possible sequence of choices. There is no way to simulate a path without playing through it yourself.

---

## The Condition

Before building a solution, the following constraints shape what we are building:

- The project starts small and must be **expandable without rewriting**. Phase 1 cannot break Phase 4.
- The editor is a **local web tool**, not a game engine. It manages the logic data.
- The team writes JSON by hand today, so the tool must feel like an upgrade — not a replacement that adds friction.
- The sandbox simulates through **choices**, not by toggling flags directly. This ensures the sandbox can only ever produce states a real player could reach.

---

## The Core Architecture

Everything in the system traces back to one concept: the **flag**.

```
Path    →  which story branch or character does this belong to?
Chapter →  when in the story does this happen?
Flag    →  smallest unit of truth. A named boolean. Nothing more.
Status  →  a hidden running number. Increments or decrements via choices.
Choice  →  writes flags and changes status. The moment a player decides something.
Scene   →  reads flags and status. A narrative moment shown only when conditions are met.
Quest   →  groups dialogues and scene. Organizational only - no new logic yet.
Act     →  groups quests. Organizational only — no new logic.
Ending  →  reads flags and status. Emerges from what was written in choices.
```

Logic only lives at two levels: **flag/status** and **choice**. Everything above and below is structure and labeling.

### Path
A top-level collection. Defines which story branch or character an entity belongs to. Referenced by ID on choices and scenes. Has no logic of its own — purely organizational.

```json
"P001": { "id": "P001", "name": "common" },
"P002": { "id": "P002", "name": "vigilante" }
```

### Chapter
A top-level collection. Defines when in the story an entity occurs. Referenced by ID on choices and scenes. Has no logic of its own — purely organizational.

```json
"C001": { "id": "C001", "name": "prologue" },
"C002": { "id": "C002", "name": "chapter_1" }
```

### Flag
No requirements. No logic. Just an ID, a `snake_case` name, and a `state` that starts as `false`. The flag does not decide when it gets set — the choice does.

```json
"F001": { "id": "F001", "name": "gave_food_to_stranger", "state": false }
```

### Status Point
A hidden running number. Starts at a defined value and changes via choices. Never set directly — only incremented or decremented. Has no `path` or `chapter` — status points are global across the entire game.

```json
"SP001": { "id": "SP001", "name": "strength", "value": 0 }
```

### Choice
Each option has `requires` (conditions to show this option), `flags_set` (flags it flips on selection), `status_set` (status changes on selection), and `next` (where the player goes after picking this option).

`flags_set` only ever flips a flag from `false` to `true`. Never the reverse. If a later event undoes something, a **new flag** is created for that event — old flags are never unset.

`next` on a choice option is always a single target ID — the branching already happened when the player picked the option.

```json
{
  "label": "Yes, I give him food",
  "requires": [],
  "flags_set": ["F001"],
  "status_set": [{ "status": "SP001", "amount": 2 }],
  "next": "S001"
}
```

### Scene
Shown only when all `requires` conditions are met. Has its own `next` — an ordered array of conditional targets checked after the scene plays. The first entry whose `requires` passes wins. The last entry should always be a fallback with empty `requires`.

```json
{
  "requires": [
    { "flag": "F001", "state": true },
    { "status": "SP001", "min": 1 }
  ],
  "next": [
    { "requires": [{ "flag": "F002", "state": true }], "target": "CH003" },
    { "requires": [], "target": "CH002" }
  ]
}
```

### Condition Format Decision
All conditions — on choices, options, and scenes — use **structured objects**. Flag conditions use `flag` + `state`. Status conditions use `status` + `min` and/or `max`. Both live in the same `requires` array.

```js
const passes = node.requires.every(c => {
  if (c.flag) return gameState.flags[c.flag] === c.state;
  if (c.status) {
    const val = gameState.status[c.status];
    if (c.min !== undefined && val < c.min) return false;
    if (c.max !== undefined && val > c.max) return false;
    return true;
  }
});
```

This was chosen because:
- The visual editor builds forms around structured data, not parsed strings.
- The renderer needs zero string manipulation — just direct comparisons.
- `state: false` is as explicit and readable as `state: true`.
- `min` and `max` express all range cases — "at least 3", "below 4", "between 3 and 7".

---

## The Solution

A local React web application that acts as the single source of truth for the game's branching logic. It manages a master JSON collection through a visual editor, and exports a single clean validated file that the game engine reads directly.

The logic is fully decoupled from the rendering code. The game does not need to know how the logic was authored.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React v19.2.0 |
| Build Tool | Vite v7.2.4 |
| Styling | Tailwind CSS v4.1.18 (via `@tailwindcss/vite` plugin) |
| Icons | Lucide React v0.562.0 |
| Node Graph (Phase 4) | React Flow `@xyflow/react` v12.10.0 |

---

## Phases & Features

### Phase 1 — Core Editor
The full logic engine. Everything in later phases is built on top of what is defined here.

**Top Navigation**
- A button to navigate each menu or page of the site

**Path & Chapter Manager**
- Create and name paths and chapters for categorization
- Both are referenced by ID on choices and scenes

**Flag Manager**
- Create, name, and browse all flags
- A search bar to search by name or ID
- `snake_case` names enforced — flags are logic references, not display text
- IDs auto-assigned (`F001`, `F002`, ...) and never change after creation
- State starts as `false` on creation — only choices can flip it to `true`

**Status Point Manager**
- Create and name status points
- Set starting value (number, defaults to 0)
- IDs auto-assigned (`SP001`, `SP002`, ...)
- No path or chapter — status points are global

**Choice Editor**
- Build choices with a visual form
- Attach `chapter` and `path` for categorization
- Add and remove options per choice
- Attach `requires` conditions on the choice root and on each option:
  - Flag condition: structured flag + state selector
  - Status condition: structured status point + min and/or max value
- Assign `flags_set` per option via a searchable dropdown
- Assign `status_set` per option — status point and signed amount
- Empty `flags_set` (`[]`) is valid — means the option intentionally sets nothing
- Assign `next` per option via a searchable dropdown (scene or choice ID)
- Empty `next` (`null`) is valid — means the option loops back to the current choice with the selected option greyed out

**Scene Editor**
- Write scene name and description
- Attach `chapter` and `path` for categorization
- Attach `requires` conditions using flag and status condition objects
- Attach `next` as an ordered conditional array — each entry has `requires` and `target`
- Last `next` entry should always be a fallback with empty `requires`
- Preview which flags and status ranges must be met for the scene to appear

**Import**
- Accept `branching-routes.json` — warns on ID conflicts before merging

**Export**
- Outputs single `branching-routes.json` master file
- Validated before export — no broken references, no empty IDs, no missing fallbacks on scene `next`

---

### Phase 2 — Simulation Sandbox
Simulates a playthrough through choices. Flags and status are only changed by making choices — never toggled or set directly.

**Choice Simulator**
- Step through choices sequentially as a player would
- Each choice made sets flags and changes status defined in the selected option
- Choices stored as a history stack — not as raw flag or status state

**Live Scene Panel**
- Shows which scenes are currently visible based on active flags and status values
- Updates in real time as choices are made
- Highlights scenes that just became visible or hidden

**Undo / Replay**
- Undo the last choice — recalculates all flags and status from the remaining history stack
- Reset to start — clears history, all flags return to `false`, all status return to starting value
- Identifies dead ends — choices or scenes unreachable from the current path

---

### Phase 3 — Structure Layer
Organizational metadata on top of Phase 1 data. No logic changes.

**Quest Editor**
- Group scenes into named quests
- Mark quest start scene and conclusion scene
- Quest completion is itself a flag — `quest_NAME_complete`

**Act / Chapter Editor**
- Group quests into acts
- Acts are display and pacing labels only — no conditions or flags

---

### Phase 4 — Route Viewer & Backtracking
Requires the full flag graph from Phase 1–3 to be meaningful.

**Node Graph Viewer**
- Visualize the full branching structure as an interactive node graph using React Flow
- See how choices connect to scenes connect to outcomes

**Route Backtracking**
- Select a target scene or ending
- System traces backwards through the flag dependency graph
- Outputs the required choices and their order to reach the target
- Identifies the minimum set of choices needed (optimal path)

---

## Design Rules (Non-Negotiable)

These must be respected from Phase 1 onward to avoid painful rewrites later:

1. **Every entity gets a unique ID on creation.** `F001`, `CH001`, `S001`, `SP001`, `P001`, `C001` — never changes after assigned.
2. **Flag and status names are `snake_case`.** They are logic references, not display text.
3. **Flags have no `requires` field.** The flag is just a name. The choice decides when it gets set.
4. **Status points have no `path` or `chapter`.** They are global across the entire game.
5. **Conditions use the object format.** `{ "flag": "F001", "state": true }` or `{ "status": "SP001", "min": 3 }` — never string operators.
6. **The sandbox only sets flags and status through choices.** No raw toggling in the simulator.
7. **Each phase wraps the previous one.** No phase rewrites the data format of an earlier phase — only adds new optional fields.
8. **Flags are additive only.** `flags_set` flips `false → true`, never the reverse. If a later event undoes something narratively, create a new flag for it — never unset an existing one.
9. **Scene `next` always has a fallback.** The last entry in the `next` array must have `requires: []` so the scene is never stuck with nowhere to go.

---

## Output File

| File | Contents |
|------|----------|
| `branching-routes.json` | Single master file — metadata, paths, chapters, flags, status, choices, scenes |

The game renderer reads this file directly. Narrative logic is fully decoupled from rendering code.

---

## The Sandbox Problem

### The Impossible State Problem
Flags are permanent in the actual game. If you toggle an early flag to `false` while deep in a simulation, you create a state no real player could ever reach — scenes that are mutually exclusive start appearing together. This is a known unsolved design problem.

### The Two Types of Cascade

There are two distinct cascade problems that look similar but require different solutions at different phases:

**Problem 1 — Sandbox integrity (Phase 2)**
When you undo a choice in the sandbox, all flags and status changes from that choice should also revert. This keeps the sandbox in a valid state.

Solution: store choices as a **history stack**, not as raw flag or status state. Undo = pop the last choice and recalculate everything from scratch by replaying the remaining history. No complex cascade math — always valid.

```js
// Flags and status are never stored directly — always derived from history
function recalcState(choiceHistory) {
  const flags = {};
  const status = {};
  choiceHistory.forEach(entry => {
    const option = getOption(entry);
    option.flags_set.forEach(f => flags[f] = true);
    option.status_set.forEach(s => {
      status[s.status] = (status[s.status] ?? getStartingValue(s.status)) + s.amount;
    });
  });
  return { flags, status };
}
```

**Problem 2 — Route backtracking (Phase 4)**
Given a target ending or scene, trace backwards through the flag dependency graph to find which choices must be made to reach it. This finds optimal and required paths.

This requires the full flag graph to exist first. It cannot be built meaningfully until there are enough flags, choices, and scenes defined to make path tracing useful. Scheduled for Phase 4.

### Phased Sandbox Approach

| Phase | Sandbox behavior |
|-------|-----------------|
| Phase 1 | Flag editor allows free toggle for isolated scene testing. Warning shown when a flag belongs to a choice. |
| Phase 2 | Sandbox simulates through choices only. Choices stored as a history stack. Undo recalculates from scratch. |
| Phase 3 | No sandbox changes — structure layer only. |
| Phase 4 | Route backtracking — trace backwards from a target to find required choices. Requires full flag graph. |
