# Phase 1 — Toast Infrastructure

---

**Goal:** Ship the general-purpose `addToast(message, variant)` API and `Toast` component as fully standalone infrastructure — independently testable before the command palette or clustering are built. This phase satisfies the "Toast infrastructure before Route Tracing Feature" justification in the scope.

---

## What it adds

### `src/store/toastStore.js` (CREATE)
Zustand store with:
- Initial state: `toasts: []` (typed array, never null — AR-14 compliance)
- `addToast(message, variant, duration = 4000)`: generates `generateId('toast')`, pushes `{ id, message, variant, duration }` to `toasts`, schedules `setTimeout(() => removeToast(id), duration)`. The timeout handle must be stored per-toast (e.g. in a module-level `Map`) so manual dismiss can cancel it.
- `removeToast(id)`: filters toast by id from `toasts`

No imports from `narrativeStore`, `simulationStore`, or `campaignStore` — would risk circular imports per AR-06.

### `src/components/Toast.jsx` (CREATE)
Fixed-position overlay component:
- Reads `toasts` via `useToastStore(s => s.toasts)` — stable reference, no fallback literal
- Renders `.toast-container` (top-right fixed, `z-index: var(--z-toast)`, `pointer-events: none`)
- Each toast: `.toast .toast--{variant}` card with message, variant left-border accent, and dismiss button
- Dismiss button calls `useToastStore.getState().removeToast(id)`
- No local state — visibility is derived entirely from `toasts.length > 0`

### `src/App.jsx` (MODIFY)
Import `Toast` from `components`. Render `<Toast />` inside `.app` div after the `<aside>` element. `Toast` uses `position: fixed` so it does not affect the CSS grid layout.

### `src/store/index.js` (MODIFY)
Add: `export { useToastStore } from './toastStore.js';`

### `src/components/index.js` (MODIFY)
Add: `export { default as Toast } from './Toast';`

### `src/styles/tokens.css` (MODIFY)
Add z-index scale and toast color tokens (see `ran_0202_filemap.md` for exact values). All additions are new variable names — no existing token is modified.

### `src/styles/global.css` (MODIFY)
Append Toast CSS blocks at end of file:
- `.toast-container`: fixed positioning, z-index, flex-column stack, gap, pointer-events: none
- `.toast`: card surface, padding, border-radius, shadow, pointer-events: auto, slide-in animation optional
- `.toast--info`, `.toast--success`, `.toast--warning`, `.toast--error`: left-border accent using `--color-toast-*` tokens

---

## Produces

| Action | File |
|---|---|
| CREATE | `src/store/toastStore.js` |
| CREATE | `src/components/Toast.jsx` |
| MODIFY | `src/App.jsx` |
| MODIFY | `src/store/index.js` |
| MODIFY | `src/components/index.js` |
| MODIFY | `src/styles/tokens.css` |
| MODIFY | `src/styles/global.css` |

---

## What it leaves temporarily incomplete

Nothing. Toast is fully standalone. Phase 2 (palette) can optionally call `addToast` for action confirmation feedback — useful but not required. Phase 3 (clustering) is entirely independent.

---

## What the next phase depends on from this phase

Phase 2 may call `useToastStore.getState().addToast(...)` from palette action handlers for optional feedback (e.g. "Flag created"). This is a convenience dependency — Phase 2 can ship without it.

---

## Reference files needed

- `src/store/index.js` — current shape (to append without breaking existing exports)
- `src/components/index.js` — current shape
- `src/App.jsx` — current shape (to locate mount point)
- `src/styles/tokens.css` — current shape (to append without overriding)
- `src/styles/global.css` — current shape (to append at end, not overwrite)
- `src/utils/uuid.js` — `generateId` prefix pattern

---

## Rollback cost

**LOW.** Rollback: delete `toastStore.js` and `Toast.jsx`; remove one line from each of `store/index.js`, `components/index.js`, `App.jsx`; remove the appended token and CSS blocks. No existing file's logic is altered — only additions.

---

## Hard stop triggers

- `useToastStore(s => s.toasts)` selector returns a new `[]` literal on miss (AR-14 violation — infinite re-render risk)
- `addToast` is called during any component's render cycle (would trigger the AR-14 loop)
- `toastStore.js` imports `narrativeStore`, `simulationStore`, or `campaignStore` at module level
- Any timer handle leaks after `Toast` component unmounts (causes "Can't perform a React state update on an unmounted component" warning)
- `toastStore` is wired into IndexedDB in `main.jsx` (scope violation — must remain ephemeral)

---

## Acceptance Criteria

Done when:
1. `useToastStore.getState().addToast('Phase 1 test', 'success')` called from browser DevTools renders a toast in the top-right corner
2. The toast auto-dismisses after ~4 seconds
3. Clicking the dismiss button removes the toast immediately
4. All four variants (`info`, `success`, `warning`, `error`) render with distinct left-border accent colors
5. Multiple toasts stack vertically without overlapping
6. Opening the app produces zero spontaneous toasts
7. No console errors on mount

---

## Verification

Open the app in the browser. Open DevTools console. Run:

```js
(await import('/src/store/toastStore.js')).useToastStore.getState().addToast('Test message', 'success')
```

Confirm: a green-accented toast appears top-right. Wait ~4 seconds — confirm it disappears automatically. Run the same command with `'warning'`, `'error'`, `'info'` — confirm distinct accent colors for each. Run the command twice rapidly — confirm both toasts stack.

Then reload the page — confirm no toasts appear on load.
