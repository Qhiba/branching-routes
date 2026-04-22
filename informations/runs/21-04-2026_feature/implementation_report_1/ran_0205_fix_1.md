# Fix Report — Route_Tracing
## Audit Fix Pass: 1

---

## 1. Issues Addressed

| # | Issue Description | Fix Applied | Integration Impact |
|---|-------------------|-------------|--------------------|
| 1 | `--coverage-gap` CSS uses hardcoded opacity & grayscale. | Replaced `opacity: 0.6; filter: grayscale(40%);` with `opacity: var(--opacity-coverage-gap); filter: grayscale(80%);` in `global.css`. | Resolves divergence with design tokens, no broader effect. |
| 2 & 3 | `RouteFinderDialog` bypasses store action and isn't campaign-mode-only. | Replaced `computeRoutes` via `simulationStore.js` with `computeRoutesFromStart` supporting edit mode directly (from graph start node), resolving the AR-04 violation without breaking the desired edit mode UX. Refactored `RouteFinderDialog` to call it. | Resolves AR-04, embraces the intentional edit-mode routing deviation. |
| 4 | Unused `toggleRouteFinderDialog` import in `StatusStrip.jsx`. | Removed the import completely. | None (removed unused code). |

---

## 2. Unplanned Changes Addressed

| # | Issue Description | Fix Applied | Integration Impact |
|---|-------------------|-------------|--------------------|
| N/A | Human notes list missing modals. | **Note**: The user notes in `0205_fix.md` reference `CreationBar`, `ESC` modals, and Sidebar `Flags` deletion guards. These belong to a previous pipeline ("Integrating Node Configuration Modal"). They do not apply to `21-04-2026_feature` (Route Tracing) and have been ignored as out of context for this feature scope. | No impact on `Route_Tracing`. |

---

## 3. Files Modified

1. `f:\Projects\Web\branching-routes\src\styles\global.css`
2. `f:\Projects\Web\branching-routes\src\store\simulationStore.js`
3. `f:\Projects\Web\branching-routes\src\components\RouteFinderDialog.jsx`
4. `f:\Projects\Web\branching-routes\src\components\StatusStrip.jsx`

---

## Conclusion
All blocking issues identified in `ran_0207_audit_1.md` have been fixed. The implementation aligns with architectural requirements, resolves unused imports, and correctly embraces the edit-mode pathfinding design intentionally chosen over campaign-mode.

> Route to: **0206 Test** or re-run **0207 Audit** as pass 2.
