# Behavioral Map: Import / Export Layer

## 1. What It Does Now
The Import / Export Layer handles the serialization of the canonical `narrativeStore` graph state into a JSON file, and its deserialization from disk back into the store. 

When exporting, it triggers `narrativeStore.exportGraph()`, which packages the application state into an object and formats timestamps (`createdAt`, `updatedAt`) into `DD-MM-YYYY` strings. It attaches a `schemaVersion: 4` property. The `fileSystem` utility then serializes it to JSON and uses the modern browser File System Access API (with a Blob/`<a>` tag fallback) to prompt the user to save the file.

When importing, it prompts the user to select a JSON file. The text is parsed, and a series of migrations executes depending on `schemaVersion` (supporting `v1`, `v2`, and `v3`). Migrations transparently re-shape the data (e.g., splitting a flat `nodes[]` array into `common`/`choice`/`ending` sub-collections, translating legacy condition operators into `flag`/`status` clauses, stripping deprecated `sideEffects` from edges). The fully migrated `v4` data is returned to `TopBar`, which feeds it to `narrativeStore.loadGraph()` to unilaterally overwrite the current runtime state. Loading or creating a new graph implicitly clears UI selection and unconditionally halts any active campaign mode simulation.

## 2. Input / Output Contract
- **Export (`exportProject`):**
  - **Input:** `graphData` object (the `v4` canonical state from `exportGraph()`) and a `defaultTitle` string.
  - **Output:** Returns a `Promise<void>` (triggers a browser-native file download). Output format is a standard JSON text file.
- **Import (`importProject`):**
  - **Input:** Unstructured filesystem JSON text.
  - **Output:** Returns a `Promise<Object | null>`. The `Object` matches the runtime `v4` schema structure exactly (`meta`, `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`).
- **Store Retrieval (`narrativeStore.exportGraph`):**
  - **Input:** Takes no arguments, pulls from Zustand internal state.
  - **Output:** Returns an object representation of the state with string-formatted timestamps and `schemaVersion: 4` appended.
- **Store Application (`narrativeStore.loadGraph`):**
  - **Input:** A `v4` JSON object containing all required canonical keys.
  - **Output:** Nothing (side-effect: overwrites Zustand `narrativeStore` state).

## 3. Full Dependency Map
- **Upstream (What depends on it):**
  - `<TopBar />` component entirely depends on this layer; its New, Import, and Export buttons orchestrate calls between `fileSystem.js` and `narrativeStore.js`.
- **Downstream (What it depends on):**
  - `fileSystem.js` depends on browser APIs (`window.showSaveFilePicker`, `window.showOpenFilePicker`, `Blob`, `URL.createObjectURL`, `<input type="file">`).
  - `fileSystem.js` depends on `utils/uuid.js` (`generateId`) to create fresh IDs when retrofitting new format condition structures to old files.
  - `narrativeStore.js` `loadGraph` and `newGraph` functions depend on `uiStore` to forcefully call `resetSelection()`.

## 4. Implicit Assumptions
- **OBSERVATION:** The system assumes imported JSON data structurally resolves correctly if its `schemaVersion` matches 1, 2, 3, or 4. Other values crash the loader with an `unsupported_schema_version` error immediately without inspecting the file contents.
- **OBSERVATION:** When parsing `meta.createdAt` / `updatedAt` for export, `exportGraph` coerces integer timestamps to `DD-MM-YYYY` format. When later imported, these strings persist as strings in the active state, rather than reverting to integers. This makes the `Date.now()` vs String typing fundamentally unstable contextually.
- `fileSystem.js` assumes legacy files define node `type` correctly; any unexpected type defaults straight into the `common` sub-collection under `schemaVersion: 1`. 
- `TopBar` relies on the UI property `isCampaignActive` to inherently prevent exports and imports midway through a simulation. Just to be safe, `handleImport` and `handleNew` still strictly trigger `exitCampaign()`.

## 5. Change Surface
If this area is modified, the following are affected:
- **Input / Output contract** mapping to `schemaVersion`.
- **Side effects:** DOM injections for fallback file download mechanisms. 
- **Data model fields:** Changes dictate new schema versions and new migration code chains in `fileSystem.js`.

## 6. Persistence Inventory
Every piece of state managed by the export layer is serialized and saved across sessions. 

**schemaVersion**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L568
- Where it is read back: `src/utils/fileSystem.js`, `importProject`, L71
- Storage layer: JSON file
- Current format: Number
- Is key persisted? YES
- MIGRATION REQUIRED

**meta**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L569
- Where it is read back: `src/store/narrativeStore.js`, `loadGraph`, L517
- Storage layer: JSON file
- Current format: Object (with nested timestamp Strings, arrays, Strings)
- Is key persisted? YES
- MIGRATION REQUIRED

**common, choice, ending**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L576-L578
- Where it is read back: `src/store/narrativeStore.js`, `loadGraph`, L525-L527
- Storage layer: JSON file
- Current format: Objects acting as Dictionaries (Node Data)
- Is key persisted? YES
- MIGRATION REQUIRED

**edges**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L579
- Where it is read back: `src/store/narrativeStore.js`, `loadGraph`, L528
- Storage layer: JSON file
- Current format: Array of Objects
- Is key persisted? YES
- MIGRATION REQUIRED

**flag, status**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L580-L581
- Where it is read back: `src/store/narrativeStore.js`, `loadGraph`, L529-L530
- Storage layer: JSON file
- Current format: Objects acting as Dictionaries 
- Is key persisted? YES
- MIGRATION REQUIRED

**path, chapter**
- Where it is written: `src/store/narrativeStore.js`, `exportGraph`, L582-L583
- Where it is read back: `src/store/narrativeStore.js`, `loadGraph`, L531-L532
- Storage layer: JSON file
- Current format: Objects acting as Dictionaries
- Is key persisted? YES
- MIGRATION REQUIRED

## 7. What Currently Works
- **Progressive Schema Migration:** Handled gracefully from `schemaVersion` 1, 2, and 3 into 4 using robust in-line mappings. The system correctly identifies missing fields for old versions and patches them. If broken, legacy save files are unreadable.
- **Universal Save/Load via Browser Fallbacks:** The File System API wrapper flawlessly reverts to Blob and DOM node simulation if Native FS Picker is not supported. Breaking this disables saving for offline standard browser functionality outside Chromium. 
- **Application Teardown:** Triggering `import` or `new` successfully tears down standard graph selections (calling `uiStore.resetSelection()`) and cancels any active session hooks (`exitCampaign()`). Breaking this results in dangling invalid ID pointers.
