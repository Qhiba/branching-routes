# ran_0303_risks — Risk Register

## Risk 1 — Node Lookup Breaks Mid-Refactor

**Description:** Between Phase 1 (store restructure) and Phase 3 (canvas update), `GraphCanvas.jsx` still destructures `nodes` from `narrativeStore`. If Phase 1 removes `state.nodes` without Phase 3 already being in place, the canvas will read `undefined` and crash all rendering.

**Early detection signal:** App loads but canvas is blank; React throws "cannot read properties of undefined" on `.map()`.

**Mitigation:** Phase 1 must maintain a computed read-only `nodes` getter (or alias) that flattens all three sub-collections into an array, keeping the existing destructure in `GraphCanvas` functional until Phase 3 replaces it. Alternatively, Phase 1 and Phase 3 must be executed in a single atomic commit — document this as a hard dependency.

---

## Risk 2 — Legacy Import Silently Misdistributes Nodes

**Description:** The flat `nodes[]` legacy migration in `fileSystem.js` distributes entries by `type` field. If a legacy file contains entries with an unrecognized or missing `type`, those nodes are silently dropped into no sub-collection, becoming invisible in the editor.

**Early detection signal:** Loaded legacy graph has fewer nodes visible than the original file contained.

**Mitigation:** In the legacy import path, any node whose `type` does not match `'common'`, `'choice'`, or `'ending'` defaults to `'common'`. This is logged to the console with the node `id` for traceability. Zero silent drops permitted.

---

## Risk 3 — `deleteFlag()` Misses Nodes After Sub-Collection Change

**Description:** `deleteFlag()` currently iterates `state.nodes`. After Phase 1, this array no longer exists. If the sub-collection iteration is not updated in lockstep, flag deletion checks will report all flags as unreferenced and permit unsafe deletions — corrupting graphs with dangling `flagId` references in node side effects.

**Early detection signal:** Deleting a flag succeeds without error even when nodes have side effects referencing it.

**Mitigation:** `deleteFlag()` must be updated in Phase 1 alongside `addNode`/`updateNode`. Its sub-collection scan (`Object.values(state.common)`, `Object.values(state.choice)`, `Object.values(state.ending)`) is a hard Phase 1 acceptance criterion — the phase is not done until this is verified.

---

## Risk 4 — `simulationStore.start()` Fails to Find Start Node

**Description:** `simulationStore.start()` currently calls `graphState.nodes.find(n => n.data?.isStartNode)`. After Phase 1, `graphState.nodes` is gone. If the lookup is not updated alongside the store shape change, the simulation will always throw "No start node exists" even when a valid start node is present.

**Early detection signal:** Clicking "Start Simulation" throws an error dialog even with an `isStartNode` node in the graph.

**Mitigation:** Phase 1 acceptance criteria explicitly includes verifying simulation start works. The start-node lookup is updated to search all three sub-collections. The `// INVARIANT: LBA-01` comment must remain as a guard marker.

---

## Risk 5 — `schemaVersion` Rejection Breaks Import of New Files

**Description:** `fileSystem.js` currently rejects any file where `schemaVersion !== 1`. After Phase 2, new exports carry `schemaVersion: 2`. If the version check is not updated, newly exported files cannot be re-imported.

**Early detection signal:** Export a file after Phase 2. Attempt to re-import it. Import throws `unsupported_schema_version`.

**Mitigation:** Phase 2 updates the version check to accept both `1` and `2`. Schema version acceptance is part of Phase 2 acceptance criteria — the phase is not done until a roundtrip (export then re-import) of a `schemaVersion: 2` file is verified.
