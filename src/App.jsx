// CHANGED (Phase 8): Removed RouteFinderDialog import — superseded by RouteTracingPanel inside RightSidebar
import { TopBar, GraphCanvas, Toast, CommandPalette, StatusStrip, LeftSidebar, RightSidebar, FloatingMiddleBar } from 'components';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app__topbar">
        <TopBar />
      </header>
      {/* ADDED: Phase 1 — Left side rail */}
      <aside className="app__leftbar">
        <LeftSidebar />
      </aside>
      <main className="app__canvas">
        {/* ADDED: Phase 5 — Floating bar for quick-create and campaign active pill */}
        <FloatingMiddleBar />
        <GraphCanvas />
      </main>
      {/* CHANGED: Render RightSidebar instead of raw Sidebar; RightSidebar hosts legacy Sidebar internally */}
      <aside className="app__rightbar">
        <RightSidebar />
      </aside>
      {/* ADDED: Phase 2 — Status strip (bottom bar with coverage metrics; visible in campaign mode) */}
      <footer className="app__statusbar">
        <StatusStrip />
      </footer>
      {/* ADDED: Phase 1 — Toast notifications overlay (fixed positioning, no grid impact) */}
      <Toast />
      {/* ADDED: Phase 2 — Command palette overlay for keyboard-driven navigation/authoring (fixed positioning, no grid impact) */}
      <CommandPalette />
      {/* CHANGED (Phase 8): Removed RouteFinderDialog mount — RouteTracingPanel in RightSidebar is the new entry point */}
    </div>
  );
}
