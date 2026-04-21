# CreationModal — Integration Phase Plan

## Purpose

A small (360px wide) centred modal for creating new named narrative entities. Adapts its form body based on `entityType`:

| `entityType` | Body shown |
|---|---|
| `'Flags'` | Name input + True/False segmented state toggle |
| `'Status'` | Name input + Initial value + optional Min/Max |
| `'Chapter'` \| `'Paths'` | Name input only |
| `null` | Modal hidden |

---

## Props Table

| Prop | Type | Description |
|---|---|---|
| `entityType` | `'Flags' \| 'Status' \| 'Chapter' \| 'Paths' \| null` | Controls visibility and form variant |
| `onClose` | `() => void` | Called to close without creating |
| `onConfirm` | `(data: object) => void` | Called with final values on Confirm |

### `onConfirm` data shape by entity type

| `entityType` | Data shape |
|---|---|
| `'Flags'` | `{ name: string, initialState: boolean }` |
| `'Status'` | `{ name: string, initialValue: number, min: number\|null, max: number\|null }` |
| `'Chapter'` \| `'Paths'` | `{ name: string }` |

---

## Local State (AR-03 Compliant)

| State | Type | Purpose |
|---|---|---|
| `nameInput` | `string` | Draft name field — purely transient |
| `flagState` | `boolean` | Flag initial value toggle — UI only |
| `statusInitial` | `number` | Status initial value input — UI only |
| `statusMin` / `statusMax` | `string` | Optional bound inputs — UI only |

All local state resets when `onConfirm` fires and `onClose` is called.

---

## Real-App Store Mapping

| Prop | Store / Action |
|---|---|
| `entityType` | Local `useState` in parent (e.g. `LeftSidebar` sets it when "+" is clicked) |
| `onClose` | `setCreationModalType(null)` |
| `onConfirm` for Flags | `narrativeStore.addFlag({ name, defaultValue: initialState })` |
| `onConfirm` for Status | `narrativeStore.addStatus({ name, defaultValue: initialValue, min, max })` |
| `onConfirm` for Chapter | `narrativeStore.addChapter({ name })` |
| `onConfirm` for Paths | `narrativeStore.addPath({ name })` |

---

## Integration Notes

- **Existing `NameModal.jsx`** handles text-only entity creation triggered by keyboard shortcuts (F/S/P/H) and `CreationBar` buttons. This `CreationModal` provides the **richer form-based UI** accessed from the left sidebar. Both can coexist.
- **Name validation**: The real app's store actions (`addFlag`, `addStatus`) perform alphanumeric + underscore validation per AR-02. The component currently allows any string — add client-side pre-validation before calling `onConfirm`.
- **Enter key**: The name input wires `onKeyDown` to `Enter` → `handleConfirm`. This is consistent with `NameModal.jsx` behaviour.

---

## Files

- `CreationModal.jsx` — Component implementation
- `CreationModal.md` — This document
