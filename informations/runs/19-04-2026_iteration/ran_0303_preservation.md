# Preservation Plan: Import / Export Layer

## PROTECTED Items

No behaviors from `ran_0301_understand.md` Section 7 remain PROTECTED. All three were accepted into the blast radius by the user.

---

## ACKNOWLEDGED RISK Items

### 1. Progressive Schema Migration
**Accepted impact:** The v1–v4 migration chain code in `fileSystem.js` will be rewritten as part of the Phase 2 overhaul. The original logic is not automatically preserved by a rewrite — it must be ported explicitly.

**What contains the blast radius:**
- Before Phase 2 begins, the engineer reads the existing `fileSystem.js` migration functions (L75–L223) thoroughly and verifies against the `example_datamodel.json` fixture.
- After porting, the same fixture file and any v1/v2/v3 legacy files available are used to confirm output is identical to the old code.
- The hard stop trigger in Phase 2 explicitly blocks progress if a legacy file fails to import correctly after the port.
- Phase 2 acceptance criteria include explicit testing of a v1 legacy file import.

---

### 2. Universal Save/Load via Browser Fallbacks
**Accepted impact:** The Blob/`<a>` fallback for export and the `<input type="file">` fallback for import may be modified or simplified as `fileSystem.js` is rewritten. The user acknowledged that changes to these paths are acceptable.

**What contains the blast radius:**
- The Blob fallback for export is retained for browsers without `showSaveFilePicker` (Firefox, Safari). This is not removed — it is the only export mechanism for those browsers and removing it with no replacement would be a silent data-portability regression.
- The `<input type="file">` fallback for import is retained for the same reason.
- What may change: the fallback paths may be simplified or wrapped differently inside the new code structure, but their presence is maintained.
- The Phase 2 file map explicitly states the contract (`exportProject` signature and `importProject` return type) must remain stable.

---

### 3. Application Teardown
**Accepted impact:** The trigger for teardown changes from a user button click to potentially a boot-time auto-restore event. If teardown is not re-implemented at the new trigger point, `uiStore.resetSelection()` and `exitCampaign()` do not fire on boot restore.

**What contains the blast radius:**
- Phase 1 explicitly wires `exitCampaign()` after `loadFromIndexedDB()` + `loadGraph()` at boot. `loadGraph()` already calls `uiStore.resetSelection()` internally.
- The Phase 1 hard stop triggers block progress if `uiStore.resetSelection()` is confirmed not to fire.
- Phase 3 includes an explicit verification step for both teardown calls across all three load paths (button import, button new, boot restore).
- Phase 3 acceptance criteria item 6 specifically tests that a session in Campaign Mode does not survive a tab reload.
