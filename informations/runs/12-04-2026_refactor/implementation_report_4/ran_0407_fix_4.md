# Phase 4 Fix Report

## Issue 1
**Corrected Code (`src/store/simulationStore.js`):**
```javascript
  start: () => {
    // INVARIANT: LBA-01
    const graphState = useNarrativeStore.getState();
// ...
  advance: (edgeId) => {
    // ...
    // INVARIANT: LBA-01
    const graphState = useNarrativeStore.getState();
```
**Fix:** Added the missing `// INVARIANT: LBA-01` comments above the cross-store reads to reaffirm synchronous state loading.
**Confirmation:** No functional behavior was changed, only documentation comments were injected.

## Issue 2
**Corrected Code (`src/store/narrativeStore.js`):**
```javascript
import { create } from 'zustand';
import { generateId } from 'utils';
import { useUIStore } from './uiStore.js';

// INVARIANT: HS-08 (Do not import simulationStore to avoid circular dependence)

// RENAMED: graphStore.js → narrativeStore.js
```
**Fix:** Inserted the `// INVARIANT: HS-08` comment underneath the import block to actively safeguard the boundary condition.
**Confirmation:** No functional behavior was changed, only documentation comments were injected.

## Issue 3 (From User Notes: Button blending)
**Corrected Code (`src/components/FlagManager.jsx`):**
```javascript
          <button 
            type="submit" 
            disabled={!hasTypedName || !isNameValid}
            style={{ marginTop: '8px', padding: '10px', background: (!hasTypedName || !isNameValid) ? 'var(--color-bg-hover)' : 'var(--color-accent)', color: (!hasTypedName || !isNameValid) ? 'var(--color-text-secondary)' : 'white', border: (!hasTypedName || !isNameValid) ? '1px solid var(--color-border)' : '1px solid var(--color-accent)', cursor: (!hasTypedName || !isNameValid) ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Add Flag
          </button>
```
**Corrected Code (`src/styles/tokens.css`):**
```css
  /* Colour — accent and semantic states */
  --color-primary:   #7393f8;   /* general theme interaction color */
```
**Fix:** Resolved the aesthetic defect from Phase 1 where the disabled "Add Flag" button invisibly blended into the form container by assigning it a structural solid border; concurrently patched the missing `--color-primary` structural token globally to prevent silent `transparent` inheritance across associated elements.
**Confirmation:** No operational logic or behavior was executed, solely altering visual binding styling variables.
