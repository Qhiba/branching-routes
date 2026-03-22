# Ruthless Code Review — Branching Narrative Editor

All 17 source files reviewed line-by-line. Findings categorized by severity.

---

## 🔴 CRITICAL — Bugs & Data Integrity

### 1. `deleteFlag` / `deleteStatusPoint` have a scoping bug that skips cleanup
**Files:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L72-L116)

In both `deleteFlag` and `deleteStatusPoint`, the `changed` flag is declared **outside** the inner loop but evaluated **per-iteration**. Once `changed` flips `true` for one choice, it stays `true` — and **all subsequent choices get shallow-cloned even if they had no references**.

Worse, for the `deleteFlag` cleanup on choices (line 93), the `if (changed)` guard is **inside** the loop, so the first choice that triggers `changed = true` causes every subsequent choice's object to be overwritten with a potentially stale `newChoiceReqs` and `newOptions` from a previous iteration that may not have been recalculated yet.

```js
// Line 81-95 — The bug:
let changed = false;
for (const chId in newChoices) {
  const choice = newChoices[chId];
  const newChoiceReqs = /*...*/;
  if (newChoiceReqs.length !== /*...*/) changed = true; // once true, never false again

  const newOptions = /*...*/;
  // ⚠️ Once changed=true, EVERY subsequent choice gets overwritten
  if (changed) newChoices[chId] = { ...choice, requires: newChoiceReqs, options: newOptions };
}
```

**Fix:** Reset `changed` per-choice, or use a per-item dirty check:
```js
for (const chId in newChoices) {
  let itemDirty = false;
  // ...checks set itemDirty...
  if (itemDirty) { newChoices[chId] = ...; changed = true; }
}
```

---

### 2. `deleteChoice` / `deleteScene` read stale closures
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L374-L424)

Both `deleteChoice` and `deleteScene` reference `scenes` and `choices` from their closure to compute cross-references, then call `setChoices` / `setScenes`:

```js
const deleteChoice = useCallback((id) => {
  const referencingScenes = Object.values(scenes).filter(/*...*/); // ← uses closure
  const referencingChoices = Object.values(choices).filter(/*...*/); // ← stale if batched
  // ...
  setChoices(prev => { /* deletes from prev */ });
}, [choices, scenes]); // dependency forces re-creation on every state change
```

**Problems:**
- The dependency array `[choices, scenes]` defeats `useCallback` entirely — the function is recreated on **every** state change, which means every child component that receives `deleteChoice` re-renders every time any choice or scene changes.
- If multiple deletions are batched (rare, but possible), the closure state is stale relative to the updater function state.

**Fix:** Move the reference check inside the `setChoices(prev => ...)` updater, or use `useRef` for the latest values.

---

### 3. Entry node never cleared when its target is deleted
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L374-L424)

This is documented in your own [Problem.md](file:///f:/Projects/Web/branching-routes/Problem.md) (line 32-33) but **has not been implemented**. Deleting a scene or choice that is the current `entryNode` leaves a dangling pointer. The export will succeed with a dead `entry_node` in the JSON.

**Fix:** Add `if (id === entryNode) setEntryNode(null);` inside `deleteScene` and `deleteChoice`.

---

### 4. [handleStart](file:///f:/Projects/Web/branching-routes/src/components/simulator/Simulator.jsx#61-68) doesn't record `statusPushed` in initial history step
**File:** [Simulator.jsx](file:///f:/Projects/Web/branching-routes/src/components/simulator/Simulator.jsx#L61-L67)

```js
const handleStart = (nodeId) => {
  setHistoryStack([{ nodeId, type, flagsPushed: [] }]);
  //                                ^^^ missing statusPushed
};
```

The `activeState` computation accesses `step.statusPushed` (line 24). If the first step lacks this property, [(step.statusPushed || []).forEach(...)](file:///f:/Projects/Web/branching-routes/src/App.jsx#15-267) silently becomes a no-op — which happens to be correct **for now**, but violates the established data contract and will break if any future code assumes the property exists.

---

### 5. Import validation is dangerously weak
**File:** [App.jsx](file:///f:/Projects/Web/branching-routes/src/App.jsx#L53-L82)

The import handler checks if **any** of the top-level keys exist and then blindly loads the data. There is:
- **No schema validation** — malformed objects (e.g., a flag without an [id](file:///f:/Projects/Web/branching-routes/src/components/simulator/Simulator.jsx#263-330) field) will corrupt state silently.
- **No ID collision detection** — your own [Problem.md](file:///f:/Projects/Web/branching-routes/Problem.md) says "warns on ID conflicts before merging" but this is not implemented. A merge will silently overwrite existing entities.
- **No type checking** — if `data.flags` is a string instead of an object, `setFlags("corrupted")` poisons the entire app.

---

## 🟠 HIGH — Performance Issues

### 6. Monolithic context causes full-tree re-renders
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx)

The entire application state (flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode) lives in a single context `value` object. Despite the `useMemo` wrapper, the value changes whenever **any** state slice changes, causing **every** consumer to re-render.

You already identified this in a previous conversation (Refactoring React Components) but it was not implemented. When you have 500+ flags and 200+ scenes, editing a single flag name will re-render the Simulator, SceneEditor, ChoiceEditor, and every manager component.

**Fix:** Split into at minimum `DataContext` (state) and `ActionsContext` (stable callbacks), or use a state manager like Zustand with selectors.

---

### 7. `getFlagReferences` recalculates on every render
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L55-L70)

`getFlagReferences` iterates over **all** choices and **all** scenes every time it's called. In [FlagManager](file:///f:/Projects/Web/branching-routes/src/components/flags/FlagManager.jsx#6-120), it's called **once per flag** during render (line 72). With 200 flags and 100 choices + 100 scenes, that's 200 × 200 = **40,000 iterations per render**.

**Fix:** Either memoize the reference map once and share it, or compute it lazily and cache.

---

### 8. [SearchableDropdown](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx#5-192) reconstructs options arrays on every render
**Files:** [ChoiceEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#L250-L254), [SceneEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/scenes/SceneEditor.jsx#L218-L221), [App.jsx](file:///f:/Projects/Web/branching-routes/src/App.jsx#L100-L103)

Every dropdown receives `options={[...Object.values(scenes).map(...), ...Object.values(choices).map(...)]}` as an inline expression. This creates a **new array reference on every render**, defeating any memoization inside [SearchableDropdown](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx#5-192) and causing `filteredOptions` to recompute.

This is multiplied in [ChoiceEditor](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#8-305) where each expanded option renders 3+ dropdowns, each with its own copy of the full scenes+choices array.

**Fix:** `useMemo` the options arrays at the component level.

---

### 9. [FlagManager](file:///f:/Projects/Web/branching-routes/src/components/flags/FlagManager.jsx#6-120) calls `getFlagReferences` twice per flag
**File:** [FlagManager.jsx](file:///f:/Projects/Web/branching-routes/src/components/flags/FlagManager.jsx#L72-L73)

```jsx
.map(flag => {
  const refs = getFlagReferences(flag.id); // ← called in render loop
```

Then [handleDelete](file:///f:/Projects/Web/branching-routes/src/components/flags/FlagManager.jsx#17-31) calls it again (line 18). This is the same O(n×m) function. At scale this will cause noticeable jank.

---

### 10. No virtualization for large lists (acknowledged in Problem.md)
**Files:** All manager components, [SearchableDropdown.jsx](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx)

Your [Problem.md](file:///f:/Projects/Web/branching-routes/Problem.md) line 28-29 correctly identifies this. None of the list components use virtualization. With 5,000 items, the [SearchableDropdown](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx#5-192) will render 5,000 DOM nodes.

---

## 🟡 MEDIUM — Architecture & Design

### 11. [generateId](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#19-29) is not collision-safe after import
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L20-L28)

[generateId](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#19-29) finds the max numeric suffix and increments. But if you import data with IDs like `F500` while the current max is `F003`, the next generated ID correctly becomes `F501`. However, if the imported data has **gaps** (e.g., `F001`, `F500` with no `F002`-`F499`), you'll get `F501`, which is correct but means gap IDs are permanently wasted. Not a bug, but worth documenting.

More critically, [generateId](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#19-29) is called **inside** the `useState` updater:
```js
setFlags(prev => {
  const id = generateId('F', prev);
  return { ...prev, [id]: { id, name: snakeName, state: false } };
});
```
In React StrictMode, this updater can be called **twice**. Since it reads from `prev`, it should be safe, but this pattern is fragile.

---

### 12. [sanitizeName](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#30-31) is not enforced on import
**File:** [EditorContext.jsx](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#L30)

[sanitizeName](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#30-31) enforces snake_case on creation, but `loadData` accepts raw imported data without sanitization. Imported flags with names like `"Met The King!"` will bypass validation.

---

### 13. Status names in [StatusManager](file:///f:/Projects/Web/branching-routes/src/components/status/StatusManager.jsx#6-90) bypass [sanitizeName](file:///f:/Projects/Web/branching-routes/src/context/EditorContext.jsx#30-31)
**File:** [StatusManager.jsx](file:///f:/Projects/Web/branching-routes/src/components/status/StatusManager.jsx#L49)

When editing a status point name, `updateStatusPoint(sp.id, { name: e.target.value })` passes the raw value. The `updateStatusPoint` function just spreads updates without sanitization:
```js
const updateStatusPoint = useCallback((id, updates) => {
  // No sanitizeName() call!
  return { ...prev, [id]: { ...prev[id], ...updates } };
});
```

This violates **Design Rule #2**: "Flag and status names are `snake_case`."

**Same issue affects:** `updateEnding` (ending names)

---

### 14. Accordion state uses objects vs Sets inconsistently
**Files:** [ChoiceEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#L10-L11) (uses [Set](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#306-356)), [EndingManager.jsx](file:///f:/Projects/Web/branching-routes/src/components/endings/EndingManager.jsx#L10) (uses plain object)

[ChoiceEditor](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#8-305) and [SceneEditor](file:///f:/Projects/Web/branching-routes/src/components/scenes/SceneEditor.jsx#8-256) use `new Set()` for expanded state, while [EndingManager](file:///f:/Projects/Web/branching-routes/src/components/endings/EndingManager.jsx#7-146) uses a plain object `{}`. This is inconsistent and the object-based approach has a subtle bug: [toggleExpand](file:///f:/Projects/Web/branching-routes/src/components/endings/EndingManager.jsx#23-24) does [({ ...p, [id]: !p[id] })](file:///f:/Projects/Web/branching-routes/src/App.jsx#15-267) — on first toggle, `p[id]` is `undefined`, and `!undefined` is `true`, which works by accident. This is brittle.

---

### 15. No error boundaries
**File:** Entire application

If any component throws during render (e.g., accessing a property on a deleted entity), the entire application crashes with a white screen. A single error boundary around the main content area would prevent total data loss.

---

### 16. No data persistence
**File:** Entire application

All state lives in React `useState`. Refreshing the browser **destroys all work**. There's no `localStorage`, `IndexedDB`, or auto-save. For a tool that manages potentially hours of narrative logic work, this is a significant UX risk.

---

## 🔵 LOW — Code Quality & Standards

### 17. Dead file: [App.css](file:///f:/Projects/Web/branching-routes/src/App.css) is empty
**File:** [App.css](file:///f:/Projects/Web/branching-routes/src/App.css)

0 bytes. Not imported anywhere. Delete it.

---

### 18. Unused `ToggleLeft` / `ToggleRight` imports
**File:** [FlagManager.jsx](file:///f:/Projects/Web/branching-routes/src/components/flags/FlagManager.jsx#L3)

```js
import { Trash2, Plus, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
//                                   ^^^^^^^^^^^^^^^^^^^^^ unused
```

---

### 19. Unused `CheckSquare` import
**File:** [ChoiceEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#L3)

```js
import { Plus, Trash2, CheckSquare, ChevronDown, ... } from 'lucide-react';
//                     ^^^^^^^^^^^^ unused
```

---

### 20. Array index as `key` for conditions and routes
**Files:** [ConditionEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/shared/ConditionEditor.jsx#L34), [SceneEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/scenes/SceneEditor.jsx#L194)

```jsx
{conditions.map((cond, idx) => {
  return (<div key={idx}>  // ← index key
```

Using array index as key causes React to incorrectly reconcile DOM when items are reordered or deleted from the middle. This can lead to input fields showing stale values after deletion.

**Fix:** Assign a unique ID to each condition when created (similar to how choice options get `opt_${Date.now()}_...`).

---

### 21. `hasConditions` variable declared but unused
**File:** [SceneEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/scenes/SceneEditor.jsx#L63)

```js
const hasConditions = scene.requires && scene.requires.length > 0;
// Never referenced anywhere
```

---

### 22. Inconsistent `next` handling on list items
**File:** [ChoiceEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/choices/ChoiceEditor.jsx#L251)

The "Loop" option uses `{ id: null, name: "Current Choice (Loop)" }` in the dropdown options list. When selected, `onChange` receives `null`. But calling `onChange(null)` on the [SearchableDropdown](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx#5-192) sets `value` to `null`, which then makes `selectedOption = options.find(o => o.id === null)` match the loop option — this works, but **only because `null === null`**. If the null-ID option is removed from the list, the dropdown shows the placeholder instead of the actual state, causing UI confusion.

---

### 23. [ConditionEditor](file:///f:/Projects/Web/branching-routes/src/components/shared/ConditionEditor.jsx#6-109) min/max deletion reconstructs the entire object
**File:** [ConditionEditor.jsx](file:///f:/Projects/Web/branching-routes/src/components/shared/ConditionEditor.jsx#L73-L78)

```js
if (e.target.value === '') {
  const n = {...cond}; delete n.min; updateCondition(idx, n);
}
```

[updateCondition](file:///f:/Projects/Web/branching-routes/src/components/shared/ConditionEditor.jsx#23-28) then does `next[idx] = { ...next[idx], ...updates }`. The spread of the entire `cond` object (which no longer has `min`) onto `next[idx]` (which still has `min`) will **NOT** delete the `min` key. `{ ...{min: 5}, ...{status: 'SP001'} }` still has `min: 5`. So deleting `min` or `max` is silently broken.

> [!CAUTION]
> This means once a `min` or `max` value is set on a status condition, **it can never be removed** through the UI. This is a data correctness bug.

---

### 24. No XSS concern (but watch for future risk)
The app is client-only React with no `dangerouslySetInnerHTML` usage. Text content is safely escaped by React's JSX rendering. However, the `whitespace-pre-wrap` on scene description (Simulator line 201) could become dangerous if you ever switch to a Markdown renderer.

---

### 25. No keyboard accessibility on custom dropdowns
**File:** [SearchableDropdown.jsx](file:///f:/Projects/Web/branching-routes/src/components/shared/SearchableDropdown.jsx)

The dropdown only handles `Enter` for auto-selecting the first result. There's no `Escape` to close, no `ArrowUp`/`ArrowDown` to navigate, and no `aria-*` attributes. The dropdown trigger button swallows clicks but isn't keyboard-navigable in a standard way.

---

### 26. QuickNav uses `document.getElementById` (imperative in React)
**File:** [QuickNav.jsx](file:///f:/Projects/Web/branching-routes/src/components/shared/QuickNav.jsx#L9-L14)

```js
const el = document.getElementById(id);
el.classList.add('ring-4', ...);
setTimeout(() => el.classList.remove('ring-4', ...), 1500);
```

Directly manipulating classes outside React's control. If the component unmounts before the timeout fires, this will attempt to modify a possibly-removed DOM node.

---

### 27. No test suite exists
There are **zero tests**. No unit tests, no integration tests, no E2E tests. For a tool that manages complex branching logic with cascading deletions and state calculations, this is a significant risk.

---

## Summary Scorecard

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Data Integrity / Bugs | 5 | — | — | — |
| Performance | — | 5 | — | — |
| Architecture / Design | — | — | 6 | — |
| Code Quality | — | — | — | 11 |
| **Total** | **5** | **5** | **6** | **11** |

---

## Top 5 Priorities (Fix These First)

1. **Fix the `changed` flag scoping bug** in `deleteFlag`/`deleteStatusPoint` — silent data corruption
2. **Fix [ConditionEditor](file:///f:/Projects/Web/branching-routes/src/components/shared/ConditionEditor.jsx#6-109) min/max removal** — the delete operation is silently broken
3. **Add entry node cleanup** on `deleteScene`/`deleteChoice` — dangling pointer
4. **Add data persistence** (`localStorage` or `IndexedDB`) — all work lost on refresh
5. **Split the context** or add `React.memo` barriers — performance degrades fast at scale
