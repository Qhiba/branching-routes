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

- The project starts small and must be **expandable without rewriting**. No phase breaks an earlier one.
- The editor is a **local web tool**, not a game engine. It manages the logic data.
- The sandbox simulates through **choices**, not by toggling flags directly. This ensures the sandbox can only ever produce states a real player could reach.

---

## The Solution

A local React web application that acts as the single source of truth for the game's branching logic. It manages a master JSON collection through a canvas-first visual editor, and exports a single clean validated file that the game engine reads directly.

The logic is fully decoupled from the rendering code. The game does not need to know how the logic was authored.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React v19.2.0 |
| Build Tool | Vite v7.2.4 |
| Styling | Tailwind CSS v4.1.18 (via `@tailwindcss/vite` plugin) |
| Icons | Lucide React v0.562.0 |
| List Virtualization | `react-virtuoso` v4.18.3 |
| Persistence | `localforage` (IndexedDB auto-save) |
| Node Graph | React Flow `@xyflow/react` v12.10.1 |
| Auto Layout | `@dagrejs/dagre` v2.0.4 |

---

## The Core Architecture

Everything in the system traces back to one concept: the **flag**.

```
Path    →  which story branch or character does this belong to?
Chapter →  when in the story does this happen? Groups quests. Organizational only — no new logic.
Flag    →  smallest unit of truth. A named boolean. Nothing more.
Status  →  a hidden running number. Increments or decrements via choices.
Choice  →  writes flags and changes status. The moment a player decides something.
Scene   →  reads flags and status. A narrative moment shown only when conditions are met.
Quest   →  groups dialogues and scenes. Organizational only — no new logic yet.
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

Top-level choice IDs are sequential (`CH001`, `CH002`, ...). Nested option IDs are randomized unique strings to preserve stable UI state when options are reordered or deleted.

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

Scenes may also have an optional `variants` array — conditional text blocks that override or extend the base description when their `requires` conditions pass. The first variant whose conditions pass wins. If no variant matches, the base description plays as-is. This avoids creating duplicate near-identical scene nodes for minor dialogue differences.

```json
{
  "id": "S001",
  "name": "stranger_accepts_food",
  "description": "The stranger looks up at you with weary eyes.",
  "variants": [
    {
      "requires": [{ "flag": "F001", "state": true }],
      "text": "He recognizes the emblem on your coat and bows his head in gratitude."
    }
  ],
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

### Ending
A terminal node. Reached via a scene's `next` target. Has `requires` conditions — the first ending whose conditions are met plays. No `next` of its own — the game stops here.

```json
"E001": {
  "id": "E001",
  "name": "good_ending",
  "requires": [
    { "flag": "F001", "state": true },
    { "status": "SP001", "min": 5 }
  ]
}
```

### Condition Format
All conditions — on choices, options, scenes, variants, and endings — use **structured objects**. Flag conditions use `flag` + `state`. Status conditions use `status` + `min` and/or `max`. Both live in the same `requires` array.

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

## Output File

| File | Contents |
|------|----------|
| `branching-routes.json` | Single master file — metadata, paths, chapters, flags, status, choices, scenes, quests, endings |

The game renderer reads this file directly. Narrative logic is fully decoupled from rendering code.

---

## Design Rules (Non-Negotiable)

These must be respected across all phases to avoid painful rewrites:

1. **Every entity gets a unique ID on creation.** `F001`, `CH001`, `S001`, `SP001`, `P001`, `C001`, `Q001`, `E001` — never changes after assigned. Nested choice option IDs are randomized strings for stable UI state.
2. **All entity names are `snake_case`.** Enforced globally via `sanitizeName` — flags, status, paths, chapters, quests, and endings are all logic references, not display text.
3. **Flags have no `requires` field.** The flag is just a name. The choice decides when it gets set.
4. **Status points have no `path` or `chapter`.** They are global across the entire game.
5. **Conditions use the object format.** `{ "flag": "F001", "state": true }` or `{ "status": "SP001", "min": 3 }` — never string operators.
6. **The sandbox only sets flags and status through choices.** No raw toggling in the simulator.
7. **Each phase wraps the previous one.** No phase rewrites the data format of an earlier phase — only adds new optional fields.
8. **Flags are additive only.** `flags_set` flips `false → true`, never the reverse. If a later event undoes something narratively, create a new flag for it — never unset an existing one.
9. **Scene `next` always has a fallback.** The last entry in the `next` array must have `requires: []` so the scene is never stuck with nowhere to go.
10. **Dual-mode deletion protection.**
    - `Endings`, `Choices`, and `Scenes` are blocked from deletion if referenced as a `next` target anywhere — writer must remove the reference first.
    - `Flags`, `Status`, `Paths`, `Chapters`, and `Quests` cascade on deletion — automatically removed from all `requires`, `flags_set`, and `status_set` references throughout the project.
11. **Simulation state is always derived.** Flags and status are never stored directly — always recalculated from `historyStack`. Snapshot caching is a performance optimization only and must never be the source of truth.
12. **Scene variants are additive only.** `variants: []` is optional on any scene. An empty or absent `variants` field means base description plays as-is. Variants use the same condition format as everything else — no new logic.
13. **Canvas edges are authoritative for `next` wiring.** Drawing an edge from an option handle to a node writes that option's `next` field. The sidebar form dropdown and the canvas edge are always in sync — two views of the same data.

---
