# Phase List Overview

| # | Phase Name | Executor | Goal | References Needed |
|---|---|---|---|---|
| 00 | Setup Guide | **Human** | Install Node.js, scaffold the Vite project, install dependencies, and verify the dev server runs. | None |
| 01 | Design System | **AI** | Author tokens, global CSS, Vite alias config, and the App layout shell so every future phase has a style foundation. | `ran_0003_architecture.md`, `ran_0003_filemap.md` |
| 02 | Core Data Layer (Stores + Utilities) | **AI** | Implement the Zustand stores and pure utility functions that all future components will depend on. | `ran_0003_architecture.md`, `ran_0003_datamodel.md`, `ran_0003_filemap.md` |
| 03 | Graph Canvas & Base Node/Edge Rendering | **AI** | Render a working React Flow canvas with custom node and edge types that read from the graph store. | `ran_0003_architecture.md`, `ran_0003_filemap.md`, `ran_0003_datamodel.md` |
| 04 | Sidebar Inspectors & Flag Manager | **AI** | Allow the designer to create/edit nodes, define flags, and set edge conditions through form panels. | `ran_0003_architecture.md`, `ran_0003_datamodel.md`, `ran_0003_filemap.md` |
| 05 | Live Simulation (Live Checker) | **AI** | Implement the simulation mode where the designer advances through the graph and sees paths highlight in real time. | `ran_0003_architecture.md`, `ran_0003_datamodel.md`, `ran_0003_filemap.md`, `ran_0003_risks.md` |
| 06 | File I/O & Acceptance Testing | **AI + Human verify** | Wire up Save/Open file actions and validate the full Definition of Done with a 5-node acceptance test. | `ran_0003_architecture.md`, `ran_0003_datamodel.md`, `ran_0003_filemap.md`, `ran_0003_risks.md` |
