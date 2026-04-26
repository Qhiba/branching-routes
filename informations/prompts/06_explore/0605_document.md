# 0605 Document — Explore

## CONTEXT
<!-- You fill this section. -->

**PROJECT NAME:** [PROJECT NAME]
**STACK:** [STACK]

---

## TASK

Load the following files:
- `ran_0601_plan.md` from `/informations/runs/[DD-MM-YYYY]_explore/`
- All `ran_0602_execute_[N].md` files from the same folder
- `/informations/docs/project_overview.md`
- `/informations/docs/codebase_features.md`
- `/informations/docs/architecture_rules.md`
- `/informations/docs/risk_register.md`

Evaluate each documentation file individually below.
Update only what this explore run actually changed. Skip everything that did not change.
Never leave contradictory documentation — if an old entry now describes something
that no longer works that way, rewrite the old entry.

---

### project_overview.md
Does this change affect how the project works at a high level — its purpose, its main
behavior, or how users interact with it?
- YES → update the relevant section
- NO → skip; write "No changes required."

### codebase_features.md
Update any feature entries whose behavior changed.
Add a changelog entry at the top of the changelog section:

```
[DD-MM-YYYY] — Explore: [plain language summary of what changed]
```

If no feature entries changed behavior, still add the changelog entry — it records
that the explore run happened.

### architecture_rules.md
Only update if this explore run introduced a new pattern clearly worth formalizing,
or if an existing rule now needs adjustment based on what was discovered.
Do not add rules speculatively. If in doubt, skip.
- Changed → describe what was updated and why
- No change → skip; write "No changes required."

### risk_register.md
- For any risk that this change resolves: update Status to RESOLVED, add a note
- For any new risk surfaced during the explore run (from audit flags or execute reports):
  add a new entry with Status: OPEN
- No changes → write "No changes required."

---

## SAVE REPORT

Save report to:
`/informations/runs/[DD-MM-YYYY]_explore/ran_0605_document.md`

The report lists every documentation file and what was done to it (updated / skipped).

Update `/informations/docs/` files in place.
