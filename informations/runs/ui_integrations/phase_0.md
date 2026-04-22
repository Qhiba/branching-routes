### Phase 0 — Foundation

- **Goal:** Add dependencies and design tokens needed by all later phases, without touching any rendered UI yet.
- **Changes:**
  - `npm install lucide-react`
  - Extend `src/styles/tokens.css` with missing vision tokens: indigo accent scale (`--color-accent-500` / `-600`), amber/emerald/blue/rose/purple/cyan accent families (for left-sidebar tab icon colors), a small set of shadow tokens (`--shadow-float`, `--shadow-nameplate`), backdrop-blur utility class, scrollbar-thin utility class, animation keyframes (`fade-in`, `zoom-in-95`, `slide-in-from-top`).
  - Create `src/styles/utilities.css` for vision-style primitives reused across new components (pill, nameplate, floating-bar, modal-shell, segmented-control). Imported from `global.css`.
- **Produces:** `package.json`, `package-lock.json`, `src/styles/tokens.css`, `src/styles/utilities.css`, `src/styles/global.css` (import line).
- **Leaves inconsistent:** Nothing — no UI consumes the new tokens yet.
- **Next phase depends on:** Tokens available, lucide-react installed.
- **Rollback cost:** LOW (revert files, `npm uninstall lucide-react`).
- **Hard stop triggers:** Token name collision with existing variables.
- **Acceptance:** App builds and runs identically to before.
- **Verification:** Run dev server, open the app, confirm every screen looks pixel-identical to before.