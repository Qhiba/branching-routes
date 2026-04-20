# Data Model Impact — Command_palette_toast_Visual_Node_Clustering

---

## narrativeStore changes

**NONE.** `narrativeStore` is not modified. No new fields on `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, or `chapter` entities. Schema version remains `4`. Export/import round-trip is unaffected.

Cluster colors are derived at render time from a deterministic hash of entity ID (`path.id` or `chapter.id`) mapped to a fixed palette array defined as a module-level constant. No color field is stored anywhere.

---

## New Zustand state (ephemeral — not persisted)

### `uiStore` additions

| Field | Type | Initial value | Declared by |
|---|---|---|---|
| `clusterMode` | `'off' \| 'chapter' \| 'path' \| 'both'` | `'off'` | Phase 3 |

**New action:** `cycleClusterMode()` — advances `clusterMode` through the four-state cycle using a lookup table:
`{ off: 'chapter', chapter: 'path', path: 'both', both: 'off' }`.
Writes only to `uiStore`; never touches `narrativeStore` or `simulationStore`.

`uiStore` is not wired to IndexedDB. `clusterMode` resets to `'off'` on every page load. This is the correct non-persistent behavior per scope ("Does not persist cluster toggle state across sessions").

---

### New `toastStore`

| Field | Type | Initial value |
|---|---|---|
| `toasts` | `Array<{ id: string, message: string, variant: 'info' \| 'success' \| 'warning' \| 'error', duration: number }>` | `[]` |

**New actions:**

`addToast(message, variant, duration = 4000)` — creates a toast with `generateId('toast')`, pushes to `toasts`, and schedules `removeToast(id)` via `setTimeout(duration)`. The timeout must be stored and cleared if the user manually dismisses before auto-dismiss fires.

`removeToast(id)` — filters the toast by id from `toasts`. Selector stability: `toasts` is initialised as `[]` in store initial state so no selector ever needs a `?? []` fallback (AR-14 compliance).

`toastStore` is ephemeral:
- **MUST NOT** be wired into IndexedDB via `main.jsx`
- **MUST NOT** appear in `exportGraph()` output
- **MUST NOT** have any boot-time restore logic

---

## Export/import round-trip

NOT AFFECTED. `exportGraph()` in `narrativeStore` serialises only the narrative data (AR-05). Neither `toastStore` state nor `uiStore.clusterMode` appear in exported JSON. Files exported before this feature import identically after it. Schema version 4 is unchanged.

---

## New ID prefixes

`toast-` — produced by `generateId('toast')` in `toastStore` for auto-dismiss tracking. Does not appear in any exported file. Does not conflict with existing prefixes (`n-`, `e-`, `f-`, `s-`, `p-`, `c-`, `opt-`).

---

## Store action signature changes (AR-20)

| Store | Action | Change | Phase |
|---|---|---|---|
| `uiStore` | `cycleClusterMode` | NEW — no parameters, no return value | 3 |
| `toastStore` | `addToast(message, variant, duration?)` | NEW — `duration` optional, defaults 4000ms | 1 |
| `toastStore` | `removeToast(id)` | NEW | 1 |

`useKeyboardShortcuts` gains two new shortcut bindings that call existing or new store actions:
- `Ctrl+K` → dispatches `palette-toggle` DOM event (no store call)
- `G` → calls `useUIStore.getState().cycleClusterMode()`

These cross-file contracts are declared here per AR-20.
