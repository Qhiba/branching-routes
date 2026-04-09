# Brainstorming Report: Graph-Based Narrative Flow Engine

## 1. Product shape
**Idea 1: Progressive Web App (PWA) with Local File System Access**
- **Idea:** A lightweight PWA that runs in the browser but can be installed to the desktop, directly reading and saving narrative JSON files from the user's local disk via the File System Access API.
- **Why it addresses the core problem:** It guarantees the "local browser app" constraint while functioning like a native application, removing the need for a backend or cloud syncing and giving developers direct control of their data.
- **Risk/Tradeoff:** If the user works across different devices or browsers that don't fully support local file system APIs, it introduces friction and forces them to manually import/export.

**Idea 2: IDE Plugin (e.g., VS Code Extension)**
- **Idea:** A visualization and editing plugin built directly into popular code editors, rendering the narrative map in a side panel next to the actual game code or dialogue script files.
- **Why it addresses the core problem:** It puts the design tool exactly where game developers already work, dramatically speeding up the iteration loop between adjusting logic and seeing the resulting flow visual.
- **Risk/Tradeoff:** It might alienate less technical narrative designers or writers who prefer standalone visual editors without the overhead of navigating an IDE.

---

## 2. Core user workflows
**Idea 1: The "Live Playtest" Split Screen**
- **Idea:** The user builds the graph on the left side of the screen, and clicks a "Play" button to interact with a text-adventure-style interface on the right side, watching the graph nodes highlight as they make narrative choices.
- **Why it addresses the core problem:** It instantly validates branching logic. The user can continuously experiment with variables (like an inventory or relationship points) and visually trace exactly why a certain story branch was locked or activated.
- **Risk/Tradeoff:** Creating an interpreter robust enough to accurately simulate variables and conditions might quickly balloon the scope beyond a simple visualization tool.

**Idea 2: Bi-Directional Script-to-Graph Syncing**
- **Idea:** Users write their narrative in a standardized plain-text format (like Ink or Markdown), and the tool automatically generates the visual nodal graph; moving nodes on the graph updates the text file in real-time.
- **Why it addresses the core problem:** It caters perfectly to writers who think in text rather than nodes, allowing them to type freely while still benefiting from a high-level visual map of their story's structure.
- **Risk/Tradeoff:** Resolving conflicts when a user makes complex structural changes in both the text and visual graph simultaneously can lead to corrupted logic or a frustrating UX.

---

## 3. Differentiation
**Idea 1: "State-Aware" Logic Engines over Static Drawings**
- **Idea:** Unlike generic diagramming tools, this app natively understands variables (e.g., `PlayerHealth`, `HasItem`). Nodes execute state changes, and connections conditionally render based on current state.
- **Why it addresses the core problem:** Draw IO and Figma can only represent what the story *looks* like. This tool actually *runs* the story, bridging the gap between a flowchart and an actionable game data structure.
- **Risk/Tradeoff:** This requires users to learn a specific syntax or logic system for defining their variables, which increases the barrier to entry compared to just drawing a box and an arrow.

**Idea 2: "Story Coverage" and Unreachable Branch Detection**
- **Idea:** The engine provides a visual heatmap or automated diagnostic tool that points out "dead ends" or branches that mathematically can never be reached under any combination of player states.
- **Why it addresses the core problem:** This introduces an automated debugging layer that Figma or Draw IO simply cannot offer, saving developers massive amounts of time during bug-testing and QA of complex narratives.
- **Risk/Tradeoff:** Calculating every possible state permutation in a highly complex, interconnected game graph might cause severe performance bottlenecks in a local browser environment.

---

## 4. MVP boundary
**Idea 1: A Pure JSON Node Editor**
- **Idea:** A basic canvas where users drop text nodes, draw connecting arrows, define simple string variables on nodes, and output the entire structure as a clean JSON file to be parsed by whatever game engine they choose.
- **Why it addresses the core problem:** It provides the absolute minimum necessary functionality to organize and map structural flow without getting bogged down in complex visual styling or collaborative features.
- **Risk/Tradeoff:** A bare-bones UI might feel too clunky or unpolished to convince people to leave their established, beautiful workflows like Figma, even if the data output is better.

**Idea 2: Visualizer-Only for Existing Formats**
- **Idea:** An app that doesn't let you *build* narratives visually, but simply ingests existing Narrative Script files (like Twine or Ink) and renders them as a highly performant, searchable, read-only interactive map.
- **Why it addresses the core problem:** It focuses purely on solving the "visualization and debugging" part of the problem without having to build a complex graphical editor layout system from scratch.
- **Risk/Tradeoff:** It ties the product's relevance entirely to a third-party standard and limits the tool's utility to the end of a user's workflow, acting only as a viewer rather than a creation tool.

---

## 5. Risks and unknowns
**Idea 1: The "Visual Spaghetti" Dilemma at Scale**
- **Idea:** The core risk that building any graph tool uncovers: when a narrative reaches 500+ nodes with intersecting conditions, it becomes completely unreadable, rendering the visual map actually worse than reading plain text.
- **Why it addresses the core problem:** By identifying this risk early, the MVP must prioritize grouping tools, sub-graphs, collapsed nodes, or auto-layout algorithms, proving it can handle the complexity of real games.
- **Risk/Tradeoff:** Effectively solving visual graph nesting and clean auto-routing is incredibly difficult UI/UX engineering, and could consume the majority of the development time.

**Idea 2: Large Canvas Performance Bottlenecks**
- **Idea:** Rendering thousands of DOM-based nodes or a massive WebGL canvas in a browser tab could cause staggering lag, frame drops, and browser crashes, especially when trying to animate the "live state."
- **Why it addresses the core problem:** Modern narrative games are massive. If the tool fails to remain performant at production scale, game developers will abandon it entirely, rendering it a toy for small projects only.
- **Risk/Tradeoff:** Committing to high-performance rendering (e.g., custom WebGL or strict virtualization) right away severely limits development speed and makes simple feature additions much harder to implement.
