import { TopBar, GraphCanvas, Sidebar, Toast, CommandPalette } from 'components';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app__topbar">
        <TopBar />
      </header>
      <main className="app__canvas">
        <GraphCanvas />
      </main>
      <aside className="app__sidebar">
        <Sidebar />
      </aside>
      {/* ADDED: Phase 1 — Toast notifications overlay (fixed positioning, no grid impact) */}
      <Toast />
      {/* ADDED: Phase 2 — Command palette overlay for keyboard-driven navigation/authoring (fixed positioning, no grid impact) */}
      <CommandPalette />
    </div>
  );
}
