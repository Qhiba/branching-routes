# Documentation Pass — Campaign Mode Rewire

**Iteration:** 18-04-2026 Campaign Mode Rewire  
**Audit verdict:** SHIP (ran_0308_audit_1.md)  
**Date:** 19-04-2026

---

## Files Updated

### 1. `informations/docs/project_overview.md`

**Updated.** Three entries in the folder structure were stale.

- `simulationStore.js` comment: updated from "simulation state (active node, flags, reachable sets)" to full campaign-mode description.
- `TopBar.jsx` comment: updated from "simulation controls" to "Enter/Exit Campaign Mode + Reset controls".
- `GraphCanvas.jsx` comment: added "passive analysis trigger".
- `Sidebar.jsx` comment: updated from "Inspector / Flags / Status / Paths" to include "Sandbox (campaign only)".
- `SandboxPanel.jsx`: new entry added immediately after Sidebar.

---

### 2. `informations/docs/codebase_features.md`

**Updated.** Seven component entries rewritten; one new entry added; barrel export list updated; changelog entry added.

**Rewritten entries:**
- `simulationStore.js` — fully replaced; now documents `isCampaignActive`, six-state enum, `seenNodeIds`, `selectedOptionId`, `sandboxOverrides`, `orphanedNodeIds`/`unreachableNodeIds`, and all new actions.
- `TopBar.jsx` — replaced "Start / Stop" with "Enter/Exit Campaign Mode + Reset" description.
- `GraphCanvas.jsx` — added passive analysis trigger, campaign advance logic, ESC key handling.
- `Sidebar.jsx` — updated to 5 tabs, added campaign guard and SandboxPanel dependency.
- `CommonNode.jsx` — added six-state + seen + warning badge behaviour.
- `ChoiceNode.jsx` — added option clickability, selected/dimmed states, warning badges.
- `EndingNode.jsx` — added six-state + seen + warning badge behaviour.
- `ConditionalEdge.jsx` — replaced "--traversed/--reachable" with four-class campaign vocabulary.
- `tokens.css` — added five new campaign-state colour tokens.
- `global.css` — full enumeration of all new CSS additions.
- `components/index.js` — added `SandboxPanel` to key exports.

**New entry added:**
- `SandboxPanel.jsx` — new component section added above `components/index.js`.

---

### 3. `informations/docs/architecture_rules.md`

**Updated.** Two changes made.

**AR-08 body rewritten** — removed stale `graphStore` reference (renamed to `narrativeStore` on 14-04-2026) and updated "start/stop simulation" vocabulary to "enterCampaign/exitCampaign campaign" vocabulary. Sandbox overrides explicitly added to the isolation guarantee.

**AR-16 added** — Six-state node visual enum formalised.

#### Changelog Entry — `architecture_rules.md`
- AR-08: Vocabulary updated: `graphStore` → `narrativeStore`, "starting/stopping simulation" → "entering/exiting campaign". Sandbox override isolation clause added.
- AR-16 (NEW): Campaign Visual State Vocabulary — closed six-value enum (`active`, `locked`, `complete`, `failed`, `branch_locked`, `reachable`) plus orthogonal `seen` indicator. No new visual state may be added without updating this rule.

#### RULE CANDIDATE Decisions

| Candidate | Decision | Rationale |
|-----------|----------|-----------|
| **Six-state node enum as canonical simulation-visual vocabulary** | **FORMALIZED — AR-16** | The enum is now consumed by 5 independent subsystems. It is load-bearing and stable. Deferring further risks ad-hoc proliferation. |
| **Passive structural analysis placement in `simulationStore`** | **DEFERRED** | `ran_0303_behaviordelta.md` §Flags explicitly instructs "Do not add to `architecture_rules.md` in this iteration." The pattern is implemented and working but has not been tested across varied graph topologies. The placement decision (in `simulationStore` vs a dedicated slice) needs another iteration to settle before being prescriptive. |

---

### 4. `informations/docs/risk_register.md`

**Updated.** Five new RESOLVED entries added from `ran_0303_risks.md`.

Summary table: five new rows (RISK-CM-01 through RISK-CM-05) appended.

| Risk ID | Evidence |
|---------|---------|
| RISK-CM-01 | `simulationStore.js` L12 choice-gate; Group B test confirms non-choice paths unaffected |
| RISK-CM-02 | `computePassiveAnalysis` (L102–L133) surfaces unreachable nodes; warning badges on all 3 node types |
| RISK-CM-03 | `applySandboxOverride` writes to `simulationStore` only; AR-08 body updated to explicitly cover this |
| RISK-CM-04 | All selectors return primitives; `runPassiveAnalysis` equality check before `set()`; audit §5 clean |
| RISK-CM-05 | grep confirms zero functional `.simulation-mode` references; `.campaign-mode` rules verified in `global.css:530–535` |

---

### 5. `informations/docs/example_datamodel.json`

**Skipped.** Audit §4 confirmed NOT APPLICABLE. No schema change. `schemaVersion` remains `4`. No new persisted fields on nodes, edges, flags, status, paths, chapters, or meta. Existing save files load without modification. The existing example continues to correctly illustrate the post-iteration data shape.

---

## Changelog Entry Added to `codebase_features.md`

```
## [2026-04-18] — Campaign_Mode_Rewire
### Added
- SandboxPanel.jsx: New campaign-only ephemeral flag/status override panel.
- simulationStore.js: isCampaignActive, enterCampaign/exitCampaign/reset lifecycle, selectOption, applySandboxOverride, runPassiveAnalysis, six-state enum, seenNodeIds, sandboxOverrides, orphanedNodeIds/unreachableNodeIds.
- tokens.css: Five campaign-state colour tokens (locked, complete, failed, branch-locked, seen).
- global.css: Six-state node CSS classes, --seen overlay, option interaction classes, edge condition classes, warning badge, sandbox panel styles.
- CommonNode/ChoiceNode/EndingNode: Structural warning badges in edit mode.
- Sidebar.jsx: Conditional fifth Sandbox tab + editor guard.
- components/index.js: SandboxPanel barrel export.
### Changed
- simulationStore.js: isRunning → isCampaignActive; start → enterCampaign; computeReachable adds selectedOptionId filter; computeNodeStates produces six-state enum.
- TopBar.jsx: Start/Stop → Enter/Exit Campaign Mode + Reset Simulation.
- GraphCanvas.jsx: simulation-mode → campaign-mode CSS class; passive analysis trigger; ESC key selection clear.
- CommonNode/ChoiceNode/EndingNode: Six-state CSS modifiers + --seen overlay.
- ConditionalEdge.jsx: Four-class campaign vocabulary (--traversed, --condition-pass, --condition-fail, --unselected-option-dim).
### Deprecated
- isRunning field → isCampaignActive.
- start() action → enterCampaign().
- .simulation-mode CSS class → .campaign-mode.
- Three-state visual model → six-state enum + independent --seen overlay.
### Migration
- no — schemaVersion remains 4. All changes ephemeral. Existing saves load without modification.
```
