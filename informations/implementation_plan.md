## Implementation Plan — Data Model Overhaul

> **Status: All phases completed.** Every phase below has been implemented in the codebase. This document is retained as a historical reference of what was built.

---

### Phase 1 — Data Model Changes ✅

The foundation. Everything else depends on this being correct first.

**Flag**
- Add optional `path` (nullable string, Path ID) and `chapter` (nullable string, Chapter ID) fields to the Flag entity
- Default both to `null` on creation
- Update `sanitizeName` and CRUD actions to handle the new fields
- Update cascade deletion: when a Path or Chapter is deleted, null out references on Flags (same pattern as existing cascade cleanup)

**Scene**
- Add optional `type` field (nullable string, defaults to `null`)
- Add `flags_set` array (same format as Choice option `flags_set`)
- Add `status_set` array (same format as Choice option `status_set`)
- Update all Scene CRUD actions to handle the new fields
- Update cascade deletion: when a Flag is deleted, remove it from Scene `flags_set`. When a Status Point is deleted, remove it from Scene `status_set`

**Metadata**
- Add `scene_types` string array to the project metadata object
- Default to empty array `[]` on new projects
- Include in export/import serialization
- On import, merge scene types from file with existing (deduplicate)
- On scene type deletion from the list, scenes referencing that type fall back to `null` silently

---

### Phase 2 — Simulator Engine Update ✅

Scene can now write state. The simulator must reflect this.

- `handleSceneContinue` must apply `flags_set` and `status_set` from the Scene before resolving `next` routing — same logic currently used in `handleOptionSelect`
- Snapshot caching logic must account for Scene-level state changes, not just option-level
- Dynamic Tracker (live flag/status HUD) must show state changes triggered by Scenes, not just Choices
- Route Tracer (`annotatePath`) must annotate Scene steps with their `flags_set` and `status_set` changes, same as it currently does for option steps

---

### Phase 3 — Settings Panel (Top Bar) ✅

New UI container for project-level configuration.

- Add a Settings button to the top bar alongside Reset / Import / Export
- Settings opens a modal or slide-in panel
- Inside Settings: a **Scene Types** section
  - Display current scene types as a list of string chips
  - Add new type via text input (sanitized to lowercase, underscores — same `sanitizeName` rule)
  - Delete a type from the list (with a warning that scenes using it will lose their type)
- Settings panel is the home for future metadata-level config — design it as a container, not a one-off

---

### Phase 4 — Form Updates ✅

Update all create/edit forms to expose the new fields.

**Flag forms** (sidebar FlagForm and any modal equivalent)
- Add optional Path dropdown (same SearchableDropdown pattern)
- Add optional Chapter dropdown
- Both nullable, clearable

**Scene forms** (SceneModalForm)
- Add Type field — searchable dropdown populated from `metadata.scene_types`, nullable, with an option to type a new value that prompts the user to add it to the list first (or redirect to Settings)
- Add `flags_set` editor — same UI pattern as existing flags_set on Choice option form
- Add `status_set` editor — same UI pattern as existing status_set on Choice option form

---

### Phase 5 — Canvas and Node Display Updates ✅

Visual changes only. No data shape changes.

**SceneNode**
- Render `type` as a colored badge/label on the node (replacing or alongside the current "SCENE" badge)
- Color and icon per type — type string maps to a color from a small palette, cycling if more types exist than colors
- Render `flags_set` and `status_set` counts as indicator chips if non-empty (e.g. `✦ 2 flags set`)

**Scene Variant display fix**
- Replace the current `◆ 2 variants` chip with per-variant condition chips
- Each variant shows its conditions inline, same visual pattern as Choice option requirements
- Base variant always shown last as a fallback indicator

---

### Phase 6 — Import / Export and Migration ✅

Ensure existing projects don't break.

- Export must include new Flag fields (`path`, `chapter`), Scene fields (`type`, `flags_set`, `status_set`), and `metadata.scene_types`
- Import must handle old files gracefully — missing fields default to `null` or `[]`, no errors thrown
- Write a migration function (same pattern as existing `migrateOptionNext`) that patches loaded data from IndexedDB to add missing new fields with correct defaults
- Update the two standalone test scripts to cover new fields

---

### Order of Dependency

```
Phase 1 → Phase 2 → Phase 4 → Phase 5
Phase 3 (independent, can be done anytime after Phase 1)
Phase 6 (last, after all shape changes are finalized)
```

Phase 1 must be done first. Everything else reads from the new data shape.