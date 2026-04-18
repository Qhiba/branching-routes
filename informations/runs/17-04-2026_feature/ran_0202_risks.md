# Risk Register — Path_Chapter_Entities

---

## RISK-PCE-01 — Orphaned Node References After Path/Chapter Deletion

**Description:**
When a designer deletes a path or chapter, any node whose `data.pathId` or `data.chapterId` matches the deleted ID becomes invalid. If the cascade sweep in `deletePath`/`deleteChapter` is missing or incomplete, `NodeInspector` dropdowns will display stale IDs that no longer exist in `path{}` or `chapter{}`, causing broken `<select>` values.

**Likelihood:** High — deletion is a routine editing action.

**Impact:** Medium — No crash, but the UI shows a blank or mismatched dropdown value which confuses the designer.

**Early Detection Signal:**
In Phase 1, after implementing `deletePath`, open the console and call `useNarrativeStore.getState().deletePath(id)`. Then inspect any node that had that `pathId`. If `data.pathId` still holds the deleted ID, the cascade is missing.

**Mitigation:**
`deletePath` and `deleteChapter` must do a full sweep of `common`, `choice`, and `ending` within the same `set()` call, nullifying matching references before removing the entity from the dictionary. This must be verified at the Phase 1 acceptance gate.

---

## RISK-PCE-02 — Schema Version Guard Breaks Legacy Imports

**Description:**
The current version guard in `fileSystem.js` accepts only `[1, 2, 3]`. After the bump to `schemaVersion: 4`, any file saved under this feature will be rejected by an un-patched copy of the app, and the patched app must still accept v1–v3 files.

**Likelihood:** High — the schema version bump is mandatory.

**Impact:** High — A mismatch here blocks all file import/export for new saves.

**Early Detection Signal:**
In Phase 1, export a new graph and attempt to re-import it before adding `4` to the version guard. The import will throw `unsupported_schema_version`. Also test that a v3 file imported after the patch correctly defaults `path: {}` and `chapter: {}`.

**Mitigation:**
Add `4` to the accepted versions array and add the v3→v4 migration branch in `fileSystem.js` as part of Phase 1 (same phase as the store schema change). Never ship the store change without the corresponding import update.

---

## RISK-PCE-03 — `loadGraph` and `newGraph` Omit New Collections, Causing Undefined State

**Description:**
If `loadGraph` or `newGraph` in `narrativeStore.js` are not updated to initialize `path: {}` and `chapter: {}`, those keys will be `undefined` in store state. Any component that reads `Object.values(narrativeStore.path)` will throw a runtime error.

**Likelihood:** High — easy to miss when adding keys to only the initial state but forgetting the reset/load actions.

**Impact:** High — crash on New Graph or File Import.

**Early Detection Signal:**
In Phase 1 verification, click "New" in the app after the store change. Open the console and run `useNarrativeStore.getState().path`. If the result is `undefined`, the reset is missing. Then import a v3 file and check again.

**Mitigation:**
`newGraph` and `loadGraph` must be updated in the same commit as the initial state addition. The Phase 1 acceptance criteria explicitly check all three initialization paths.

---

## RISK-PCE-04 — `NodeInspector` Dropdown Triggers Unnecessary Re-Renders

**Description:**
If the Zustand selector for `path{}` in `NodeInspector` subscribes to the entire store object rather than a targeted selector, every store mutation (including node drags, flag edits, simulation advances) will trigger a re-render of `NodeInspector`. This amplifies RISK-01 (render storms).

**Likelihood:** Medium — natural to write `useNarrativeStore(s => s)` for simplicity.

**Impact:** Medium — performance degradation at scale; does not break functionality.

**Early Detection Signal:**
In Phase 3, open DevTools React Profiler, drag a node on the canvas, and count `NodeInspector` renders. If it renders on every canvas drag event, the selector is too broad.

**Mitigation:**
Both new selectors in `NodeInspector` must be targeted:
- `useNarrativeStore(state => state.path)` (only re-renders when `path` dict changes)
- `useNarrativeStore(state => state.chapter)` (only re-renders when `chapter` dict changes)
These are narrow subscriptions and will not fire on node/edge mutations.

---

## RISK-PCE-05 — Path Name Validation Not Applied, Allowing Empty or Duplicate Names

**Description:**
Unlike flags and statuses (which enforce `^[a-zA-Z0-9_]+$` validation in the store), the `addPath` and `addChapter` actions have no prior art requiring a name format. If no validation is added, a designer can create empty-named or duplicate-named paths/chapters, making the "Paths" tab dropdown list unreadable.

**Likelihood:** Medium — the `PathChapterManager` UI needs an empty-string guard at minimum.

**Impact:** Low — no crash, no silent data corruption, but the UX degrades.

**Early Detection Signal:**
In Phase 2, submit the add-path form with an empty input. If a blank entry appears in the list, validation is missing.

**Mitigation:**
`addPath` and `addChapter` store actions must validate that `name.trim().length > 0` before creating the entity, throwing if not. The `PathChapterManager` form must also disable the confirm button when the input is empty (UI-layer guard, not a substitute for the store guard).

---

## RULE CANDIDATE — AR-05 Enumeration Is Stale

**Found during:** Post-Phase-1 rule compliance check (0202_plan.md condition).

**Which rule:** `AR-05 — Single Source of Truth`

**Current rule body (excerpt):**
> "The canonical graph representation is the Zustand `narrativeStore`. The React Flow `nodes` and `edges` arrays are derived from the typed node sub-collections (`common`, `choice`, `ending`)…"

**Why it is a candidate:** The rule body implicitly enumerates the canonical store shape as `common`, `choice`, `ending`. The `flag{}` and `status{}` dictionaries were added in the prior schema v3 refactor without updating this text. `path{}` and `chapter{}` are now being added by this feature. The rule's *intent* (Zustand is the single truth) is fully honoured — no existing rule is being violated — but the enumerated store shape described in the rule text is two schema versions out of date.

**Classification:** RULE CANDIDATE — not a BLOCKER, not a RULE CONFLICT. The rule does not need to change before execution continues.

**Action:** In `0208 Document`, update AR-05's body to list `common`, `choice`, `ending`, `flag`, `status`, `path`, `chapter` as the full canonical store shape, and update the rationale sentence accordingly.
