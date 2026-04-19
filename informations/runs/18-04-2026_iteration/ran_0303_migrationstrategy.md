# 2. Migration Strategy

**NOT APPLICABLE.**

`ran_0302_scope.md` flags no items as `MIGRATION REQUIRED`. All persisted items were labelled `SAFE` or `PROCEED WITH CAUTION`:

- **`position`** — SAFE (untouched by this push).
- **`optionId`** — PROCEED WITH CAUTION (format unchanged, field unchanged; the new routing consumer reads it but writes no new format). Handled as a **risk**, not a migration — see `ran_0303_risks.md` item R-02.
- **Campaign-mode activation / six-state enum / seen tracking / sandbox / selected option / passive reachability** — all SAFE (ephemeral, `simulationStore`-only, no persisted representation).

No `schemaVersion` bump. No in-place transform. No parallel-support window. Existing save files continue to load through `fileSystem.js` without change.

**Implication for phases:** No phase carries a migration step. All phase blocks state `Migration step: NONE`.
