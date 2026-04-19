# Phase 2 — Export / Import Update

## Goal
Update the explicit export format and harden the import path with field-level validation, sanitization, and defaults injection — replacing the current bare schema-version-only guard.

## What it changes
- **Export:** `narrativeStore.exportGraph()` output is evaluated for changes. If no structural field changes are introduced by this iteration, `schemaVersion` stays at `4`. If a new top-level field or format change is required, `schemaVersion` increments to `5` and a v4→v5 migration pass is added to `importProject`. This decision is made on entry to Phase 2 by inspecting the actual changes required — the plan gates on it.
- **Import (`importProject`):** Validation is expanded beyond the version number guard. After migration runs, the result is sanitized: missing required fields receive safe defaults, unknown top-level keys are stripped, and node collections are validated for minimum structural correctness (e.g., each node has `id`, `type`, `data`). A malformed file that passes the version check but has structural gaps no longer silently corrupts the store.
- **v1–v4 migration chain:** Explicitly ported from the old `fileSystem.js` into the new structure. No logic changes — behavior-identical port. This is the highest-risk step in this phase.
- **Export format:** `.json` remains the default. The `.zip` path for campaign data is **deferred** — campaign persistence is not yet defined, so no zip logic is introduced. A comment or stub marks the extension point.

## Produces
| File | Action |
|---|---|
| `src/utils/fileSystem.js` | `importProject` updated: expanded validation, sanitization, defaults injection, v1–v4 migration chain ported. `exportProject` updated if schema version increments. |
| `src/store/narrativeStore.js` | `exportGraph()` updated if schema version increments (`schemaVersion: 5`, new fields added). Otherwise unchanged. |
| `src/utils/index.js` | Re-exports updated only if new functions are introduced (unlikely in this phase). |

## Migration step
**Parallel support.** The import function continues to accept v1, v2, v3, and v4 files. Migration chains for those versions are ported verbatim. If `schemaVersion` increments to `5`, a new v4→v5 migration pass is appended at the end of the chain. The accepted version array `[1, 2, 3, 4]` becomes `[1, 2, 3, 4, 5]`. Existing v4 export files remain importable without modification.

If no schema bump: migration chains are ported unchanged, accepted versions list is unchanged.

## What it leaves temporarily inconsistent
- `TopBar.jsx` still calls `exportProject` and `importProject` using the old call signatures. If signatures change in this phase (new arguments, renamed exports), `TopBar` will error until Phase 3 updates the call sites. This is acceptable — Phase 3 is next and must follow immediately.

## What the next phase depends on from this phase
- `importProject` is the authoritative, hardened import function with sanitization and defaults.
- `exportProject` emits the correct current schema version.
- All migration chains are verified against the v1–v4 fixture files from `example_datamodel.json`.

## Reference files needed
- `src/utils/fileSystem.js`
- `src/store/narrativeStore.js` (`exportGraph` output shape — L557–L585)
- `informations/docs/example_datamodel.json` (v4 reference structure for validation baseline)
- `ran_0301_understand.md` (§6 Persistence Inventory — all persisted keys and formats)
- `ran_0303_migrationstrategy.md`

## Rollback cost if this phase fails
**MEDIUM.** `exportProject` and `importProject` are modified. If the migration chain port introduces a regression (legacy file fails to import), the old `fileSystem.js` must be restored. This requires keeping a copy of the pre-Phase-2 file before editing begins. The IndexedDB layer (Phase 1) is unaffected by a rollback of this phase.

## Hard stop triggers
- A v1, v2, or v3 fixture file imports incorrectly after the migration chain port → STOP. Compare old and new migration logic line by line before proceeding.
- A v4 file imports and the store ends up missing a required key (`common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`) → STOP.
- `exportGraph()` emits a version number that `importProject` does not accept → STOP. Version guard and emitter must always be in sync.

## Acceptance Criteria
Done when:
1. A v4 exported file opens correctly after re-import.
2. A v1 fixture file (with legacy `nodes[]` array and old `flags[]` format) imports and the graph renders correctly.
3. A file with a missing `path` or `chapter` key imports and the app initializes those collections to `{}` rather than crashing.
4. A file with `schemaVersion: 99` is rejected with a clear error.
5. `exportProject` emits valid JSON matching the current schema version.

## Verification
1. Export your current graph. Open the exported `.json` file in a text editor. Confirm `schemaVersion` is the expected value and all keys (`meta`, `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`) are present.
2. Import the file back. Confirm the graph loads without errors and all nodes/edges are present.
3. If you have an older `.json` file from a previous version of the app, import it. Confirm it loads and migrates correctly.
4. Try importing a random, invalid JSON file. Confirm the app shows an error and does not crash.
