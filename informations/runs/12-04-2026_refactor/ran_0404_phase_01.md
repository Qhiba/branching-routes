# Phase 1 — Aesthetics

---

**Goal**
Lock in the dark-mode-only theme by refining color token values and removing any implicit light-mode assumptions, without touching any logic layer.

---

**What it restructures**

- `src/styles/tokens.css`: Color values refined. A header comment block added declaring dark-mode-only intent. No variable names change.
- `src/styles/global.css`: Any hard-coded hex values replaced with token references. Any `@media (prefers-color-scheme: light)` rules removed if present (none found in current file — confirming absence is a Phase 1 action).

---

**Produces**

- `src/styles/tokens.css` — modified (values only)
- `src/styles/global.css` — modified only if hard-coded colors are present

---

**Migration step**

NONE — CSS variable names are unchanged (DC-07). Values are not persisted. No saved files are affected.

---

**What it leaves temporarily inconsistent**

Nothing. This phase is self-contained and fully reversible.

---

**What the next phase depends on from this phase**

Phase 2 depends on nothing from Phase 1. Phase order is sequenced by increasing risk, not dependency. Phase 1 can be skipped and re-done at any time without affecting Phases 2–4.

---

**Reference files needed**

- `ran_0404_structuraldelta.md §2 Theme Layer`
- `ran_0402_first-audit.md §2 DC-07`
- `ran_0402_first-audit.md §5 HS-09`
- `src/styles/tokens.css`
- `src/styles/global.css`

---

**Rollback cost if this phase fails:** LOW
Revert `tokens.css` and `global.css` to the previous git commit. Zero logic impact.

---

**Hard stop triggers for this phase**

- HS-09: Any CSS variable name in `tokens.css` is renamed, removed, or a new variable is added that shadows an existing one — STOP.
- Any component style breaks silently (rendering invisible text, invisible nodes, invisible edges) — STOP. Restore previous token values.

---

**Acceptance Criteria**

Done when:
1. All variable names in `tokens.css` are byte-for-byte identical to the pre-refactor file.
2. No hard-coded hex colors exist in `global.css`.
3. No `@media (prefers-color-scheme: light)` block exists anywhere in `tokens.css` or `global.css`.
4. The app renders with no visible layout or color regressions.

---

**Verification**

Open the app. Confirm:
1. The canvas background, sidebar, and topbar all render with dark backgrounds.
2. Nodes display with defined borders and text is readable.
3. Start a two-node simulation: the active node has a distinct orange/highlight border, the reachable node has a distinct green/pulsing border, and the visited node appears dimmed. All three are visually distinguishable from each other and from an unvisited, non-reachable node.
