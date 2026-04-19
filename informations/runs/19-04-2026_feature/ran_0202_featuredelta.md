# Campaign_Sheets — Feature Delta

---

## What the system does NOT have now

- **No campaign persistence.** Every time the user clicks "Enter Campaign Mode", simulation starts from scratch — `enterCampaign()` seeds flags from `narrativeStore` defaults and has no knowledge of any prior run. When the user exits, all traversal progress (`activeNodeId`, `seenNodeIds`, `traversedEdgeIds`, `currentFlagValues`) is discarded permanently.
- **No named campaign slots.** There is no concept of a campaign identity ("good_ending_run", "chapter_2_test"). The simulation is anonymous and singular.
- **No campaign-level IndexedDB persistence.** Only `narrativeStore` state (graph data) is auto-saved to IndexedDB. Simulation state is explicitly excluded (AR-08) and is never written anywhere.
- **No campaign store.** There is no `campaignStore.js`. No Zustand store exists for managing a campaign list, an active campaign ID, or campaign snapshots.
- **No campaign selector UI.** `TopBar.jsx` has a single "Enter Campaign Mode" button that calls `enterCampaign()` unconditionally. There is no way to pick, create, name, or switch campaigns from the UI.
- **No ZIP export.** `exportProject` always produces a `.json` file. No multi-file bundle format exists.
- **No campaign import.** `importProject` only accepts `.json` narrative files. It has no awareness of campaign files or `.zip` bundles.

---

## What the system will have after this feature

- **`campaignStore.js`** — A new Zustand store owning the campaign dictionary (`campaigns{}`), the active campaign ID, and all CRUD actions. Provides `saveCampaignsToIndexedDB` / `loadCampaignsFromIndexedDB` for a second IndexedDB object store.
- **`CampaignSelector.jsx`** — A new component mounted inside `TopBar` that renders the campaign list, a "New Campaign" creation form, and switch/delete/reset controls. Replaces the bare "Enter Campaign Mode" button in the edit-mode state.
- **Campaign-aware `enterCampaign()`** — A modified `enterCampaign` that accepts an optional campaign snapshot payload. When provided, it hydrates `simulationStore` from the saved `flagOverrides` and `statusOverrides` instead of seeding from `narrativeStore` defaults.
- **Campaign-aware `exitCampaign()`** — A modified `exitCampaign` that snapshots current simulation state back to `campaignStore` before tearing down, so the campaign is saved automatically on exit.
- **Debounced campaign auto-save subscriber** — Wired in `main.jsx` `initPersistence()`, following the same debounce pattern as the narrative subscriber.
- **Boot-time campaign restore** — `initPersistence()` also loads campaigns from IndexedDB on startup, restoring the campaign list without auto-resuming any active campaign.
- **ZIP export (campaigns present)** — When campaigns exist, `exportProject` bundles `datamodel.json` + one `campaigns/{name}.json` per campaign into a `.zip` file using a browser-side library (JSZip). Campaign-less projects continue exporting as `.json`.
- **ZIP import** — `importProject` detects `.zip` vs. `.json` by file extension and routes accordingly. ZIP imports unpack `datamodel.json` (through the existing migration chain) and load campaign files alongside it.

---

## What existing behavior is identical in both

- **Narrative data model** — `narrativeStore` is not touched. `common`, `choice`, `ending`, `edges`, `flag`, `status`, `path`, `chapter`, `meta`, and `exportGraph()` are completely unchanged.
- **Simulation mechanics** — The six-state node enum, `seenNodeIds` tracking, `advance()`, `selectOption()`, `applySandboxOverride()`, passive structural analysis (`runPassiveAnalysis`), and all AR-08–compliant sandbox isolation remain byte-for-byte identical in behavior.
- **Narrative IndexedDB auto-save** — The `narrativeStore` subscriber, debounce timing (1000ms), and `saveToIndexedDB` / `loadFromIndexedDB` functions are unchanged except for internal DB version bump when adding the new campaigns object store.
- **Campaign-less export** — Projects with no campaigns continue to export as a single `.json` file. The fallback codepath in `exportProject` is preserved.
- **Import migration chain** — The v1→v3, v2→v3, v3→v4 migration chain in `importProject` is untouched. Legacy files continue to import without modification.
- **Authoring lock-out** — `isCampaignActive` governs all authoring control disabling. This gate is unchanged.
- **Sidebar Sandbox tab** — Visible only when `isCampaignActive`, unchanged.
- **All node/edge renderers** — `CommonNode`, `ChoiceNode`, `EndingNode`, `ConditionalEdge` consume `simulationStore` state only and require zero modification.
- **All authoring UI** — `NodeInspector`, `EdgeInspector`, `FlagManager`, `StatusManager`, `PathChapterManager`, `VariantEditor`, `OptionEditor`, `SandboxPanel` — completely unchanged.
- **Condition evaluation** — `conditionEvaluator.js` is not touched.
- **AR-08 isolation guarantee** — Campaign snapshots stored in `campaignStore` are simulation data. They never write to `narrativeStore.flag` or `narrativeStore.status`.
