<!-- 0201_scope-user.md -->

## ROLE
You are a feature analyst helping scope a new addition to a
working system. You surface what already exists so the user
only fills in what only they know about the new thing.

## CONTEXT
Load these files:
1. `/informations/docs/project_overview.md` — project name and structure
2. `/informations/docs/codebase_features.md` — what each file does
3. `/informations/docs/architecture_rules.md` — rules the feature must respect
4. `/informations/docs/example_datamodel.[format]` — current data structure
5. `/informations/docs/risk_register.md` — existing risks

## TASK
Read Part 1. Fill Part 2 based on the user's decisions
cross-referenced against the loaded files.
Keep language plain — no technical jargon.

> **For the user:** Fill Part 1 completely. Then feed this
> file to the AI. Do not touch Part 2.

## Save Report
Save to: `/informations/runs/[DD-MM-YYYY]_feature/ran_0201_scope.md`

---

## Part 1 — User fills

### Feature name
<!-- [SNAKE_CASE NAME] -->
Campaign_Sheets

### What this feature does
<!-- [ONE SENTENCE — from the user's perspective] -->
Adds persistent simulation snapshots. Users can create named campaigns ("good_ending_run", "chapter_2_test"), each storing its own `nodeStates`, `flagOverrides`, and `statusOverrides`. Campaigns are saved to IndexedDB alongside narrative data and survive across sessions.
The Previous Update Enter/Exit Campaign Mode toggle becomes a campaign selector dropdown in the TopBar. Selecting a campaign hydrates `simulationStore` with that campaign's saved state and activates simulation mode. Switching campaigns auto-saves the outgoing one before loading the incoming one. Exiting returns to editing mode.
Export format upgrades to `.zip` when campaigns exist (containing `datamodel.json` + `campaigns/{name}.json`). Campaign-less projects continue exporting as `.json`.

### What this feature does NOT do
<!-- [EXPLICIT BOUNDARIES — at least 2 items] -->
- Does not change the narrative data model. `narrativeStore` is untouched; campaigns only reference narrative IDs.
- Does not mutate authored flag/status values. Campaign overrides hydrate `simulationStore` only — AR-08 applies.
- Does not auto-generate campaigns. Users explicitly create them.
- Does not add new simulation mechanics. Six-state enum, seen tracking, sandbox overrides — all from previous update, unchanged.
- Does not add route tracing (later update), UI shell changes (later update), or any new narrative entity types.
- Does not migrate existing data. Projects without campaigns continue working identically.

### Why this feature is needed now
Previous update gave the app a working simulation but no way to preserve a run. Every Enter Campaign Mode starts from scratch — the moment you exit, the traversal is gone. For a tool designed to validate branching narratives, this makes serious testing impractical: you can't compare "good ending run" against "bad ending run" side-by-side, can't return to a half-tested path, can't share a reproducible scenario.

Previous update made persistence automatic for narrative data. Campaigns are the natural next persisted entity — the plumbing (IndexedDB, auto-save subscriber, ZIP-capable export) already exists, so this is the lowest-cost moment to add them. Delaying would either mean shipping an unusable simulation layer or retrofitting persistence onto campaigns later, duplicating work.

Later update (route tracing) also depends on campaign-mode simulation being fully featured, so this unblocks downstream work.


### Definition of done
<!-- [ ] Condition 1
[ ] Condition 2
[ ] Condition 3 -->
| Action | File | Detail |
|--------|------|--------|
| ADD | `src/store/campaignStore.js` | Campaign CRUD, persistence, active campaign management |
| ADD | `src/components/CampaignSelector.jsx` | Campaign create/switch/reset UI |
| MODIFY | `src/store/simulationStore.js` | Integration with active campaign |
| MODIFY | `src/store/index.js` | Re-export campaignStore |
| MODIFY | `src/utils/fileSystem.js` | ZIP export/import for campaigns |
| MODIFY | `src/components/TopBar.jsx` | Campaign selector mount point |


### Assumptions I am making
<!-- [LIST OR "NONE"] -->
NONE

---

## Part 2 — AI fills, user does not edit

### Related existing features
<!-- Cross-reference the user's feature description against
codebase_features.md. List every existing feature or component
that relates to, overlaps with, or will be affected by
this addition. -->

### Files to touch
<!-- Cross-reference against codebase_features.md.
List every file that must change to support this feature.
For each file state: MODIFY / CREATE -->

### Files to protect
<!-- List files that must not change under any circumstance —
especially stable core files the new feature will depend on.
For each file state: PROTECTED and why. -->

### Architecture rules relevant to this feature
<!-- List every rule from architecture_rules.md that this
feature must respect. For each rule, state why it is relevant. -->

### Relevant existing risks
<!-- Cross-reference against risk_register.md.
List any existing risks this feature touches or amplifies. -->

### Suggested phase shape
<!-- Propose rough phase boundaries for 0202 to refine.
Each phase should be independently stoppable and testable.
example:
- Phase 1: Build the core logic without UI
- Phase 2: Wire UI to the logic
- Phase 3: Connect to existing data layer -->