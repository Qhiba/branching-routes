### Executed Changes
- `src/components/CreationBar.jsx`: Created the new component to render the row of seven entity creation buttons that dispatch `canvas-add-node` and `canvas-open-name-modal` events.
- `src/components/TopBar.jsx`: Imported and rendered `CreationBar`, passing down `disabled={isCampaignActive}` to block authoring during campaign mode.
- `src/components/index.js`: Added the `CreationBar` export.
- `src/styles/global.css`: Appended style rules for `.topbar__creation-bar` and `.creation-bar__btn`.

### Full List of Files Modified
1. `f:\Projects\Web\branching-routes\src\components\CreationBar.jsx`
2. `f:\Projects\Web\branching-routes\src\components\TopBar.jsx`
3. `f:\Projects\Web\branching-routes\src\components\index.js`
4. `f:\Projects\Web\branching-routes\src\styles\global.css`

### Flags Raised
- None
