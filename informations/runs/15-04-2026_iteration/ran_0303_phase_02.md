# ran_0303_phase_02 — Phase 2: Import / Export Safety

## Phase 2 — Import / Export Safety

**Goal:** Update `fileSystem.js` so that legacy files (`schemaVersion: 1`, flat `nodes[]`) are transparently converted to the new sub-collection shape on import, and new files (`schemaVersion: 2`) pass through unchanged. Resume normal file open/save workflow.

---

**What it changes:**

- `fileSystem.js` `importProject()`:
  - Accept both `schemaVersion: 1` and `schemaVersion: 2`. Throw `'unsupported_schema_version'` for anything else.
  - **Legacy path (`schemaVersion: 1`):**
    - Distribute `graphData.nodes[]` entries into `{ common: {}, choice: {}, ending: {} }` by reading each entry's `type` field.
    - Any entry whose `type` is not `'common'`, `'choice'`, or `'ending'` defaults to `'common'` and is logged to the console with its `id`.
    - Strip `sideEffects` from each edge entry. If any non-empty `sideEffects` arrays are discarded, log a console warning with the count and the affected edge IDs.
    - Add `commonNodeTypes: []` and `endingTypes: []` to the `meta` object if missing.
    - Return the normalized payload with `common`, `choice`, `ending`, `edges`, `flags`, `meta` keys.
  - **New-schema path (`schemaVersion: 2`):**
    - Pass `common`, `choice`, `ending`, `edges`, `flags`, `meta` through unchanged.
    - Return as-is.
- `narrativeStore.loadGraph()` is unchanged — it already accepts the normalized shape from Phase 1.

---

**Produces:**
- `src/utils/fileSystem.js` — modified

---

**Migration step:**

This phase *is* the migration execution for both MIGRATION REQUIRED items (nodes array restructure and edge sideEffects removal). The in-place transformation occurs at import time on the client side. No file on disk is modified — the conversion applies only to the in-memory representation loaded into the store. Re-exporting after import produces a clean `schemaVersion: 2` file.

---

**What it leaves temporarily inconsistent:**

- Canvas rendering is still not updated (Phase 3 pending). Import now works but the canvas will not correctly display imported data until Phase 3 completes.
- **Resolved by:** Phase 3.

---

**What the next phase depends on from this phase:**
- Phase 3 assumes that `loadGraph()` correctly populates `common`, `choice`, `ending` after a file import. This is guaranteed once Phase 2 is complete.

---

**Reference files needed:**
- `src/utils/fileSystem.js`
- `src/store/narrativeStore.js` (to confirm `loadGraph()` signature)
- `ran_0303_migrationstrategy.md`

---

**Rollback cost if this phase fails:** LOW
Only `fileSystem.js` reverts. Store and canvas are unchanged. The app returns to working condition for new graphs; only file import/export is affected.

---

**Hard stop triggers for this phase:**

- If the legacy node distribution logic drops any node silently (no fallback, no log) — **STOP**. Every node from the legacy file must appear in one of the three sub-collections.
- If the schema version check is expanded to accept a version it should not (anything other than `1` or `2`) — **STOP**. The acceptance range must be explicit and bounded.

---

**Acceptance Criteria:**

Done when:
1. Importing a `schemaVersion: 1` file succeeds and populates `common`, `choice`, `ending` correctly in store state.
2. Each legacy node with `type: 'ending'` appears in `state.ending`; others appear in `state.common`.
3. Any legacy edge with a non-empty `sideEffects` array triggers a console warning listing affected edge IDs.
4. Importing a `schemaVersion: 2` file succeeds and passes data through without alteration.
5. Importing a file with `schemaVersion: 3` (or any other unsupported version) throws `'unsupported_schema_version'`.
6. Exporting after importing a legacy file produces a `schemaVersion: 2` file with `common`/`choice`/`ending` keys and no `sideEffects` on edges.

---

**Verification:**

Take an existing exported `schemaVersion: 1` JSON file. Open it in the app. Check the console for any warnings about discarded edge effects. Open the file picker and import the file. Confirm all nodes appear on the canvas. Immediately export the graph. Open the exported file in a text editor and confirm `schemaVersion` is `2` and the `nodes` key is gone.

If no legacy file is available: export the current graph (which will be `schemaVersion: 2` after Phase 1), then import it back. Confirm it loads correctly.
