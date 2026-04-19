# Migration Strategy: Import / Export Layer

Two MIGRATION REQUIRED items were flagged in `ran_0302_scope.md`.

---

## Item 1 — IndexedDB as new primary write path

**Flagged as:** MIGRATION REQUIRED

**Strategy: In-place migration**

IndexedDB is a new storage layer being added alongside the existing file-based layer. No existing persisted data needs restructuring. IndexedDB starts empty on first load; the user is not prompted to migrate. On first boot after the update, the auto-save will simply write the current in-memory store state into IndexedDB. If the user had previously exported a `.json` file, they can still import it as before — this is handled by the existing import path.

No schema transform needed. The object written to IndexedDB is identical in shape to what `exportGraph()` produces today.

**Why not parallel support:** There is no old IndexedDB format to support — this is a greenfield introduction. No format conflict.

**Why not clean break:** Nothing is being removed from the existing JSON export format at this time. Old files remain importable.

---

## Item 2 — schemaVersion bump and v1–v4 migration chain preservation

**Flagged as:** MIGRATION REQUIRED

**Strategy: Parallel support**

The current export emits `schemaVersion: 4`. The current import accepts versions `[1, 2, 3, 4]` and runs migration chains.

This iteration does **not** require a schema version bump unless the export format itself changes (e.g., new top-level fields added, field formats change). If Phase 2's import validation or export shape changes are additive-only (applying defaults, stricter validation), no version bump is needed and existing v4 files remain valid.

If Phase 2 does introduce a structural export change, the version increments to `5` and a v4→v5 migration pass is added to the chain. The decision is deferred to Phase 2 execution — the plan gates on this.

The existing v1–v4 migration functions in `fileSystem.js` must be **explicitly ported** into the rewritten file. They are not automatically preserved by a rewrite. This is the highest-risk item in this iteration.

**Why parallel support:** The system must continue reading v1–v4 on import for all existing user files. The new code must handle old files exactly as the old code did.

**Why not clean break:** Breaking import of pre-v4 files is an explicit non-goal. Users with legacy files must not be locked out.
