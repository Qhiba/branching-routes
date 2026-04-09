import { TopBar, GraphCanvas, Sidebar } from 'components';
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
    </div>
  );
}
