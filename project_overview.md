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
- The editor is a **local web tool**, not a game engine. It manages the logic data. The game reads the exported JSON separately.
- The team writes JSON by hand today, so the tool must feel like an upgrade — not a replacement that adds friction.
- **Flags are permanent in the actual game.** A player cannot undo a choice mid-story. The sandbox must respect this while still being flexible enough for testing.
- The sandbox simulates through **choices**, not by toggling flags directly. This ensures the sandbox can only ever produce states a real player could reach.

---

## The Core Architecture

Everything in the system traces back to one concept: the **flag**.

```
Flag    →  smallest unit of truth. A named boolean. Nothing more.
Choice  →  writes flags. The moment a player decides something.
Scene   →  reads flags. A narrative moment shown only when conditions are met.
Quest   →  groups scenes. Organizational only — no new logic.
Act     →  groups quests. Organizational only — no new logic.
Ending  →  reads flags. Emerges from what was written in choices.
```

Logic only lives at two levels: **flag** and **choice**. Everything above is structure and labeling.

### Flag
See `example_flag.json`.
No requirements. No logic. Just an ID, a `snake_case` name, and a `state` that starts as `false`. The flag does not decide when it gets set — the choice does.

### Choice
See `example_choice.json`.
Each option has `requires` (conditions to show this option) and `flags_set` (flags it flips on selection).
`flags_set` only ever flips a flag from `false` to `true`. Never the reverse. If a later event undoes something, a **new flag** is created for that event — old flags are never unset.

### Scene
See `example_scene.json`.
Shown only when all `requires` conditions are met. Each condition is a structured object checking a flag's current state against an expected value.

### Condition Format Decision
Conditions use **structured objects with an explicit `state` field**. This was chosen because:
- The visual editor builds forms around structured data, not parsed strings.
- The renderer needs zero string manipulation — just a direct comparison.
- `state: false` is as explicit and readable as `state: true`.

```js
const passes = node.requires.every(c => gameState.flags[c.flag] === c.state);
```

---

## The Solution

A local React web application that acts as the single source of truth for the game's branching logic. It manages three master JSON collections — `flags`, `choices`, `scenes` — through a visual editor, and exports clean validated files that the game engine reads directly.

The logic is fully decoupled from the rendering code. The game does not need to know how the logic was authored.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React v19.2.0 |
| Build Tool | Vite v7.2.4 |
| Styling | Tailwind CSS v4.1.18 (via `@tailwindcss/vite` plugin) |
| Icons | Lucide React v0.562.0 |

---

## Phases & Features

### Phase 1 — Core Editor
The full logic engine. Everything in later phases is built on top of what is defined here.

**Flag Manager**
- Create, name, and browse all flags
- `snake_case` names enforced — flags are logic references, not display text
- IDs auto-assigned (`F001`, `F002`, ...) and never change after creation
- State starts as `false` on creation — only choices can flip it to `true`

**Choice Editor**
- Build choices with a visual form
- Add and remove options per choice
- Attach `requires` conditions to each option using structured flag + state selectors
- Assign `flags_set` per option from a dropdown of existing flags
- Empty `flags_set` (`[]`) is valid — means the option intentionally sets nothing
- Warning shown when `flags_set` references a flag that doesn't exist yet

**Scene Editor**
- Write scene name and description
- Attach `requires` conditions using the structured object-with-state pattern
- Preview which flags must be active or inactive for the scene to appear

**Export**
- Outputs `flags.json`, `choices.json`, `scenes.json`
- Validated before export — no broken flag references, no empty IDs

---

### Phase 2 — Simulation Sandbox
Simulates a playthrough through choices. Flags are only set by making choices — never toggled directly.

**Choice Simulator**
- Step through choices sequentially as a player would
- Each choice made sets the flags defined in the selected option
- Choices stored as a history stack — not as raw flag state

**Live Scene Panel**
- Shows which scenes are currently visible based on active flags
- Updates in real time as choices are made
- Highlights scenes that just became visible or hidden

**Undo / Replay**
- Undo the last choice — recalculates all flags from the remaining history stack
- Reset to start — clears history, all flags return to `false`
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
- Visualize the full branching structure as an interactive node graph
- See how choices connect to scenes connect to outcomes

**Route Backtracking**
- Select a target scene or ending
- System traces backwards through the flag dependency graph
- Outputs the required choices and their order to reach the target
- Identifies the minimum set of choices needed (optimal path)

---

## Design Rules (Non-Negotiable)

These must be respected from Phase 1 onward to avoid painful rewrites later:

1. **Every entity gets a unique ID on creation.** `F001`, `CH001`, `S001` — never changes after assigned.
2. **Flag names are `snake_case`.** They are logic references, not display text.
3. **Flags have no `requires` field.** The flag is just a name. The choice decides when it gets set.
4. **Conditions use the object format.** `{ "flag": "F001", "state": true }` — never string operators.
5. **The sandbox only sets flags through choices.** No raw flag toggling in the simulator.
6. **Each phase wraps the previous one.** No phase rewrites the data format of an earlier phase — only adds new optional fields.
7. **Flags are additive only.** `flags_set` flips `false → true`, never the reverse. If a later event undoes something narratively, create a new flag for it — never unset an existing one.

---

## Output Files

| File | Contents |
|------|----------|
| `flags.json` | Master collection of all flags |
| `choices.json` | Master collection of all choices and their options |
| `scenes.json` | Master collection of all scenes and their conditions |

The game renderer reads these files directly. Narrative logic is fully decoupled from rendering code.

---

## The Sandbox Problem

### The Impossible State Problem
Flags are permanent in the actual game. If you toggle an early flag to `false` while deep in a simulation, you create a state no real player could ever reach — scenes that are mutually exclusive start appearing together. This is a known unsolved design problem.

### The Two Types of Cascade

There are two distinct cascade problems that look similar but require different solutions at different phases:

**Problem 1 — Sandbox integrity (Phase 2)**
When you undo a choice in the sandbox, all flags that were set by that choice should also unset. This keeps the sandbox in a valid state.

Solution: store choices as a **history stack**, not as raw flag toggles. Undo = pop the last choice and recalculate all flags from scratch by replaying the remaining history. No complex cascade math — always valid.

```js
// Flags are never stored directly — always derived
function recalcFlags(choiceHistory) {
  return choiceHistory.flatMap(entry => getOption(entry).flags_set);
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
