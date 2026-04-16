# Migration Strategy — Push 4: Flag/Status Split + Condition Evaluator

Three persisted items require migration. Each is addressed below.

---

## Item 1 — `flags[]` → `flag{}` + `status{}`

**What changes:** The top-level export key `flags` (an array) is replaced by two object dictionaries: `flag` and `status`.

**Strategy: Parallel Support**

Reason: Existing saved files at `schemaVersion: 2` contain `flags[]`. Discarding them forces users to rebuild all variable definitions. The import function already contains a v1→v2 migration path; this push adds a v2→v3 migration path following the same pattern.

**Implementation:**
- `fileSystem.js` detects `schemaVersion: 2` and converts `flags[]` entries:
  - Items with `type: 'boolean'` → inserted into `flag{}` keyed by `id`, retaining their `id`, `name`, and `state` (from `defaultValue`).
  - Items with `type: 'number'` → inserted into `status{}` keyed by `id`, retaining their `id`, `name`, and `value` (from `defaultValue`), with `minValue: null`, `maxValue: null`.
- `schemaVersion: 3` is emitted on all new exports.
- v1 import path is also updated to redistribute to `flag{}` and `status{}` instead of `flags[]`.

---

## Item 2 — `node.data.sideEffects[]` → `data.flags_set[]` + `data.status_set[]`

**What changes:** Each node's `data.sideEffects` array is removed and replaced by `data.flags_set` and `data.status_set`.

**Strategy: In-place Migration**

Reason: The conversion rule is deterministic. `sideEffects` entries with `type: 'boolean'` flags map cleanly to `flags_set[]` (set-true operations). `sideEffects` entries with `type: 'number'` flags map to `status_set[]` with `amount` from `value`. Since `subtract` is now expressed as a negative `amount`, no information is lost. This transformation can occur entirely within the v2→v3 import path in `fileSystem.js`.

**Implementation:**
- During `schemaVersion: 2` import, for each node in `common{}`, `choice{}`, `ending{}`:
  - Read `data.sideEffects[]` (may be absent or empty on v2 saves).
  - For each entry where the referenced `flagId` resolves to a boolean flag: push `flagId` into `data.flags_set[]`.
  - For each entry where the referenced `flagId` resolves to a numeric flag: push `{ statusId: flagId, amount: operation === 'subtract' ? -value : value }` into `data.status_set[]`.
  - Remove `data.sideEffects` from the node.
- Post-migration nodes always have `data.flags_set: []` and `data.status_set: []` (never undefined).

---

## Item 3 — Edge `condition` clause shape

**What changes:** Clause objects change from `{ flagId, comparator, value }` to either `{ id, flag, state }` (flag clause) or `{ id, status, min?, max? }` (status clause). The top-level `operator` field changes from `'AND'`/`'OR'` to lowercase `'and'`/`'or'`. The `clauses` key is renamed to `conditions`.

**Strategy: In-place Migration**

Reason: All condition data exists in persisted edge records. The transformation rule is deterministic per clause type based on the referenced flag's type. The conversion can be performed inside the `fileSystem.js` v2→v3 migration path.

**Implementation:**
- During `schemaVersion: 2` import, for each edge in `edges[]` that has a non-null `condition`:
  - Convert `operator` from `'AND'`/`'OR'` to `'and'`/`'or'`.
  - Rename `clauses` → `conditions`.
  - For each clause: generate a new random `id` (format: `cond_{random6}`). If the clause's `flagId` resolves to a boolean flag: emit `{ id, flag: flagId, state: value }`. If to a numeric flag: map `comparator` to `min`/`max` → `>=`/`>` set `min`, `<=`/`<` set `max`, `==` sets both `min` and `max` to the same value.
