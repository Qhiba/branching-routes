# Phase 01 — Design System

> **Who does this:** The AI.
> **Prerequisite:** Phase 00 complete (scaffold exists, `npm install` done, `npm run dev` shows the default Vite page).
> **No terminal required.** All steps are file writes.

---

## Goal
Author the visual design system — tokens, global CSS, Vite alias config, `index.html` metadata, and the App layout shell — so every future phase has a consistent style foundation to build on.

## Produces
- `vite.config.js` — `src/` path alias configured
- `index.html` — title and SEO meta updated
- `src/main.jsx` — cleaned up (remove Vite boilerplate, import global CSS)
- `src/App.jsx` — three-region layout shell (TopBar / Canvas / Sidebar placeholders)
- `src/styles/tokens.css` — all design system CSS custom properties
- `src/styles/global.css` — CSS reset and base element styles

## Dependencies Required Before This Phase
- Phase 00 complete — project scaffold exists, all npm packages installed

## Reference Documents
- `ran_0003_architecture.md` — AR-01 (naming), AR-06 (import alias), AR-10 (no network)
- `ran_0003_filemap.md` — `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`, style files

---

## Steps

### 1. `vite.config.js` — Configure path aliases

Replace the default config with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      store:      path.resolve(__dirname, 'src/store'),
      utils:      path.resolve(__dirname, 'src/utils'),
      styles:     path.resolve(__dirname, 'src/styles'),
    }
  }
})
```

Why: all project imports will use `components/Foo` instead of `../../components/Foo`. Enforces AR-06.

---

### 2. `index.html` — Title and meta description

Update the `<head>`:
- `<title>Branching Routes</title>`
- Add: `<meta name="description" content="A graph-based narrative flow designer. Build branching stories visually, define flags, apply conditions, and simulate live paths." />`
- Add Google Fonts link for **Inter** (weights 400, 500, 700):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  ```

---

### 3. `src/styles/tokens.css` — Design tokens

Create this file. Define all values as CSS custom properties on `:root`.

**Colour — backgrounds**
```css
--color-bg-base:     #0f1117;   /* page / canvas background */
--color-bg-surface:  #1a1d27;   /* panels, sidebar */
--color-bg-elevated: #22263a;   /* cards, node bodies */
--color-bg-hover:    #2a2f47;   /* hover state on interactive surfaces */
```

**Colour — text**
```css
--color-text-primary:   #e8eaf0;
--color-text-secondary: #9da3b8;
--color-text-muted:     #5a6180;
```

**Colour — accent and semantic states**
```css
--color-accent:    #6c8ef7;   /* primary interactive, selected rings */
--color-active:    #f7a44a;   /* simulation active node */
--color-visited:   #5a6180;   /* simulation visited (dimmed) */
--color-reachable: #4dcf8e;   /* simulation reachable (pulsing) */
--color-danger:    #e05c5c;   /* delete buttons, warnings */
--color-border:    #2e3354;   /* default element borders */
```

**Colour — canvas**
```css
--color-canvas-bg:  #0f1117;
--color-canvas-dot: #2e3354;
```

**Spacing (4px base unit)**
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 32px;
--space-8: 48px;
```

**Typography**
```css
--font-family-base:   'Inter', system-ui, sans-serif;
--font-size-xs:       11px;
--font-size-sm:       13px;
--font-size-md:       15px;
--font-size-lg:       18px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-bold:   700;
--line-height-base:   1.5;
```

**Borders and radii**
```css
--radius-sm:  4px;
--radius-md:  8px;
--radius-lg:  12px;
--radius-full: 9999px;
```

**Shadows**
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
```

**Transitions**
```css
--transition-fast:   120ms ease;
--transition-normal: 220ms ease;
```

---

### 4. `src/styles/global.css` — Reset and base styles

```css
@import './tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-base);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  outline: none;
  transition: border-color var(--transition-fast);
}

input:focus, textarea:focus, select:focus {
  border-color: var(--color-accent);
}

/* Simulation reachable pulse animation */
@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Utility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

---

### 5. `src/main.jsx` — Clean up boilerplate

Remove Vite's default CSS import. Import global CSS instead:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

### 6. `src/App.jsx` — Three-region layout shell

```jsx
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app__topbar">
        TopBar — placeholder
      </header>
      <main className="app__canvas">
        Canvas — placeholder
      </main>
      <aside className="app__sidebar">
        Sidebar — placeholder
      </aside>
    </div>
  )
}
```

Create `src/App.css`:

```css
.app {
  display: grid;
  grid-template-rows: 48px 1fr;
  grid-template-columns: 1fr 300px;
  grid-template-areas:
    "topbar  topbar"
    "canvas  sidebar";
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app__topbar {
  grid-area: topbar;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.app__canvas {
  grid-area: canvas;
  background: var(--color-canvas-bg);
  overflow: hidden;
  position: relative;
}

.app__sidebar {
  grid-area: sidebar;
  background: var(--color-bg-surface);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
}
```

No store wiring. No logic. Placeholder text only.

---

## Acceptance Criteria
- Done when: `npm run dev` starts without errors, the browser shows a dark three-region layout with no Vite boilerplate visible, and no console errors are present.

## Verification
1. Open `http://localhost:5173`
2. Confirm: dark background (`#0f1117`), three visible regions (48px top bar, canvas area, 300px sidebar)
3. Confirm: font is Inter (DevTools → Elements → Computed → font-family)
4. Open DevTools Console — zero errors
5. Open DevTools Network tab — zero outgoing requests after load (no API calls — AR-10)

## Next Phase Dependency
Phase 02 requires the `src/` path aliases (Step 1 of this phase) and the installed npm packages (Phase 00) to resolve store and utility imports correctly.
