## ROLE
You are a behavioral analyst helping scope an iteration.
You translate the user's decisions into a technical foundation
for the plan.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the change must respect
4. `/informations/runs/[DD-MM-YYYY]_iteration/ran_0301_understand.md` — current state map

## TASK
Read Part 1. Fill Part 2 based on the user's decisions cross-referenced
against the loaded files. Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely based on your reading of
> `ran_0301_understand.md`. Then feed this file to the AI.
> Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_iteration/ran_0302_scope.md`

---

## Part 1 — User fills

### What I am changing
Canvas

### Why this needs to change
The current single StoryNode renderer applies uniform visual treatment across all node types, with no distinction between a narrative beat, a decision point, and a terminal state. As the data model moves to typed sub-collections, the renderer must reflect that separation visually — designers need to identify node types at a glance without reading labels or opening the inspector.

Each type receives a distinct accent color applied to borders, badges, and header strips rather than card fills, preserving canvas readability at scale. Common nodes use a green accent to signal neutral continuity. Choice nodes use a blue accent with a treatment that suggests branching — option count, wider body, or a decision icon. Ending nodes use an orange accent with a terminal treatment such as a filled accent bar or stop indicator.

All three types share the existing dark card background from the design system. A type label pill is included on each node as a redundancy layer beyond color, ensuring type remains legible regardless of how the designer perceives the accent palette.

### New behavior after this push
**Contains:** Distinct visual identity per node type. Each type gets a unique color scheme, border treatment, and type indicator so designers can instantly identify node types on the canvas at a glance.

**Design direction:**
- **Common nodes** — Green accent (`#4ade80` family). Solid left border or top accent stripe. Clean, neutral body — these are the workhorses, shouldn't scream.
- **Choice nodes** — Blue accent (`#60a5fa` family). Distinctive shape treatment (e.g., wider body, option count badge, or branching icon). Must visually suggest "decision point."
- **Ending nodes** — King orange accent (`#fb923c` family). Terminal feel — perhaps a double border, filled accent bar, or stop icon. Must feel final.
- All three types share the same dark card background from the app theme. Color appears as accents (borders, badges, header strips), not as full card fills — keeps the canvas readable at scale.
- Type label badge (small pill: "Common" / "Choice" / "Ending") on each node for redundancy beyond color.

### Accepted blast radius
<!-- Which dependencies from ran_0301 are you okay with changing —
even if they appear in the preservation list?
These are conscious decisions, not oversights. -->
**Graph visual derivation:**
**Simulation advancing:** on aesthetics design perspective

### Definition of done
| Action | File | Detail |
|--------|------|--------|
| MODIFY | `src/components/nodes/CommonNode.jsx` | Green accent styling, type badge |
| MODIFY | `src/components/nodes/ChoiceNode.jsx` | Blue accent styling, type badge, option count indicator |
| MODIFY | `src/components/nodes/EndingNode.jsx` | Orange accent styling, type badge, terminal visual treatment |
| MODIFY | `src/styles/tokens.css` | Node type color tokens: `--color-node-common`, `--color-node-choice`, `--color-node-ending` |
| MODIFY | `src/styles/global.css` | Node type CSS classes |

### Assumptions I am making
NONE

---

## Part 2 — AI fills, user does not edit

### What must stay exactly the same
<!-- Pull from Section 7 of ran_0301_understand.md.
Then cross-reference against "Accepted blast radius" in Part 1.
- Items NOT in the accepted blast radius → PROTECTED
- Items the user explicitly accepted → ACKNOWLEDGED RISK
Present the full list with each item labeled accordingly. -->

### Affected file list
<!-- Cross-reference the user's decisions against the dependency map
in ran_0301_understand.md. For each file state:
CHANGES / PROTECTED / MONITOR -->

### Migration flags
<!-- Cross-reference against the Persistence Inventory in
ran_0301_understand.md. For each risk or conflict raised by
the user's decisions:
- What the user decided
- Which behavior or persisted item it touches
- Flag as: MIGRATION REQUIRED / PROCEED WITH CAUTION / SAFE -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0303 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Rewire input handling without changing output format
- Phase 2: Update output format and all callers -->