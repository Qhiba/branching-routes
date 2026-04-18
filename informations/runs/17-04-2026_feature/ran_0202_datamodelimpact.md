# Data Model Impact — Path_Chapter_Entities

---

## Does this feature add new fields to any entity?

**Yes — two locations.**

### 1. New top-level store collections

Two new dictionaries are added to `narrativeStore` state and to the exported JSON:

```json
"path": {
  "p-{uuid}": { "id": "p-{uuid}", "name": "Act 1" }
},
"chapter": {
  "c-{uuid}": { "id": "c-{uuid}", "name": "The Forest Path" }
}
```

- `path` is keyed by IDs prefixed `p-`.
- `chapter` is keyed by IDs prefixed `c-`.
- Both default to `{}` in empty and migrated graphs.

### 2. New optional fields on all node `data` objects

Every node entry in `common{}`, `choice{}`, and `ending{}` gains two optional fields inside `data`:

```json
"data": {
  "label": "...",
  "content": "...",
  "isStartNode": false,
  "flags_set": [],
  "status_set": [],
  "pathId": null,
  "chapterId": null
}
```

- `pathId`: `string | null` — references an ID in `path{}`. Null means unassigned.
- `chapterId`: `string | null` — references an ID in `chapter{}`. Null means unassigned.
- These fields are **optional on read** — any existing node that lacks them is treated as `null`.

---

## Is every addition strictly additive?

**Yes.**

- The two new top-level keys (`path`, `chapter`) are additive.
- The two new node-level fields (`pathId`, `chapterId`) are additive and optional.
- No existing field is renamed, removed, or retyped.
- No existing collection (`common`, `choice`, `ending`, `flag`, `status`, `edges`) changes shape.

---

## Does the export/import round-trip survive this change?

**Yes, with one schema version bump.**

| Action | Detail |
|--------|--------|
| **Export** | `exportGraph()` emits `schemaVersion: 4` and includes `path` and `chapter` dictionaries alongside existing keys. |
| **Import v4** | `importProject()` accepts `schemaVersion: 4`. Reads `path` and `chapter` directly. |
| **Import v3** | `importProject()` defaults `path: {}` and `chapter: {}`. Node `pathId`/`chapterId` fields absent on old nodes are treated as `null` at read time — no migration step needed. |
| **Import v1/v2** | Existing migration paths continue to produce v3-structured data, which then receives the v3→v4 pass (setting `path: {}`, `chapter: {}`). |

No data is lost in either direction.

---

## Which entity IDs or prefixes does this touch?

| Prefix | Entity | Generator call |
|--------|--------|----------------|
| `p-{uuid}` | Path | `generateId('p')` |
| `c-{uuid}` | Chapter | `generateId('c')` |

All other existing prefixes (`n-`, `e-`, `f-`, `sp-`, `cond-`) are unaffected.
