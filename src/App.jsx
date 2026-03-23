import React, { useState, useMemo } from 'react';
import { Flag, ListTree, Layers, Download, Upload, PlayCircle, GitFork, Book, Dumbbell, Map, Award, Network } from 'lucide-react';
import FlagManager from './components/flags/FlagManager';
import ChoiceEditor from './components/choices/ChoiceEditor';
import SceneEditor from './components/scenes/SceneEditor';
import Simulator from './components/simulator/Simulator';
import RouteViewer from './components/routeviewer/RouteViewer';
import PathManager from './components/paths/PathManager';
import ChapterManager from './components/chapters/ChapterManager';
import StatusManager from './components/status/StatusManager';
import QuestManager from './components/quests/QuestManager';
import EndingManager from './components/endings/EndingManager';
import SearchableDropdown from './components/shared/SearchableDropdown';
import { useEditor } from './context/EditorContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

function App() {
  const [activeTab, setActiveTab] = useState('flags');
  const { flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode, setEntryNode, loadData } = useEditor();

  // Memoize entry point dropdown options (#8)
  const entryPointOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
  ], [scenes, choices]);

  const handleExport = () => {
    if (!entryNode) {
      alert("Validation Error: No entry point set. Please select an entry point before exporting.");
      return;
    }

    const data = {
      metadata: {
        version: "1.0",
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        entry_node: entryNode
      },
      path: paths,
      chapter: chapters,
      flags,
      choices,
      scenes,
      status: statusPoints,
      quests,
      endings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branching-routes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object') {
          alert("Invalid file: root must be a JSON object.");
          return;
        }

        // Type-check each data slice — must be objects (or absent)
        const sliceKeys = ['flags', 'choices', 'scenes', 'path', 'chapter', 'status', 'quests', 'endings'];
        for (const key of sliceKeys) {
          if (data[key] !== undefined && (typeof data[key] !== 'object' || data[key] === null || Array.isArray(data[key]))) {
            alert(`Invalid file: "${key}" must be a plain object, got ${Array.isArray(data[key]) ? 'array' : typeof data[key]}.`);
            return;
          }
        }

        // Require at least one valid data slice
        if (!sliceKeys.some(k => data[k] && Object.keys(data[k]).length > 0)) {
          alert("Invalid file structure. No valid data found.");
          return;
        }

        // Structural validation — ensure entities have 'id' fields
        const validateEntities = (obj, label) => {
          const bad = [];
          for (const [key, val] of Object.entries(obj || {})) {
            if (!val || typeof val !== 'object' || !val.id) bad.push(key);
          }
          if (bad.length > 0) {
            alert(`Invalid ${label}: entries [${bad.join(', ')}] are missing required "id" field.`);
            return false;
          }
          return true;
        };
        if (!validateEntities(data.flags, 'flags')) return;
        if (!validateEntities(data.choices, 'choices')) return;
        if (!validateEntities(data.scenes, 'scenes')) return;
        if (!validateEntities(data.path, 'paths')) return;
        if (!validateEntities(data.chapter, 'chapters')) return;
        if (!validateEntities(data.status, 'status points')) return;
        if (!validateEntities(data.quests, 'quests')) return;
        if (!validateEntities(data.endings, 'endings')) return;

        // ID collision detection
        const collisions = [];
        const checkCollisions = (incoming, existing, label) => {
          if (!incoming) return;
          const overlapping = Object.keys(incoming).filter(id => existing[id]);
          if (overlapping.length > 0) collisions.push(`${label}: ${overlapping.join(', ')}`);
        };
        checkCollisions(data.flags, flags, 'Flags');
        checkCollisions(data.choices, choices, 'Choices');
        checkCollisions(data.scenes, scenes, 'Scenes');
        checkCollisions(data.path, paths, 'Paths');
        checkCollisions(data.chapter, chapters, 'Chapters');
        checkCollisions(data.status, statusPoints, 'Status');
        checkCollisions(data.quests, quests, 'Quests');
        checkCollisions(data.endings, endings, 'Endings');

        if (collisions.length > 0) {
          const proceed = window.confirm(
            `Warning: The following IDs already exist and will be OVERWRITTEN:\n\n${collisions.join('\n')}\n\nProceed with import?`
          );
          if (!proceed) return;
        }

        loadData({
          metadata: data.metadata || {},
          flags: data.flags || {},
          choices: data.choices || {},
          scenes: data.scenes || {},
          paths: data.path || {},
          chapters: data.chapter || {},
          status: data.status || {},
          quests: data.quests || {},
          endings: data.endings || {}
        });
      } catch (err) {
        alert("Failed to parse JSON file. Check that it is valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input 
  };

  const NavIcon = ({ icon, label, active, onClick }) => (
    <button 
      onClick={onClick}
      className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-all relative group ${active ? 'text-primary bg-primary/10 border-r-2 border-primary rounded-r-none' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
      title={label}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 absolute left-full ml-4 bg-surface-container-high px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none transition-opacity">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-full flex bg-background text-on-surface font-body overflow-hidden text-sm">
      {/* Left Navigation Rail */}
      <aside className="w-20 flex-shrink-0 border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-lg flex flex-col items-center py-6 gap-6 z-40">
        <div className="text-primary font-bold tracking-widest uppercase text-[10px] text-center px-1 mb-4">
          NEXUS
        </div>
        <nav className="flex flex-col gap-2 w-full items-center flex-1">
          <NavIcon icon={<Flag className="w-6 h-6" />} label="Flags" active={activeTab === 'flags'} onClick={() => setActiveTab('flags')} />
          <NavIcon icon={<Dumbbell className="w-6 h-6" />} label="Status" active={activeTab === 'status'} onClick={() => setActiveTab('status')} />
          <NavIcon icon={<GitFork className="w-6 h-6" />} label="Paths" active={activeTab === 'paths'} onClick={() => setActiveTab('paths')} />
          <NavIcon icon={<Book className="w-6 h-6" />} label="Chapters" active={activeTab === 'chapters'} onClick={() => setActiveTab('chapters')} />
          <NavIcon icon={<Award className="w-6 h-6" />} label="Endings" active={activeTab === 'endings'} onClick={() => setActiveTab('endings')} />
          <NavIcon icon={<Network className="w-6 h-6" />} label="Route Viewer" active={activeTab === 'routeviewer'} onClick={() => setActiveTab('routeviewer')} />
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2">
           <NavIcon icon={<PlayCircle className="w-6 h-6 text-secondary-container" />} label="Play" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Floating */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-md shadow-lg shadow-black/20 h-16 border-b border-white/5">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-headline font-black text-primary tracking-tighter">Kinetic Engine</h1>
            <div className="flex hidden md:flex items-center gap-6 font-headline font-medium text-zinc-400 text-sm ml-4">
              <button onClick={() => setActiveTab('scenes')} className={`hover:text-white transition-all pb-1 ${activeTab === 'scenes' ? 'text-primary border-b-2 border-primary' : ''}`}>Scenes</button>
              <button onClick={() => setActiveTab('choices')} className={`hover:text-white transition-all pb-1 ${activeTab === 'choices' ? 'text-primary border-b-2 border-primary' : ''}`}>Choices</button>
              <button onClick={() => setActiveTab('quests')} className={`hover:text-white transition-all pb-1 ${activeTab === 'quests' ? 'text-primary border-b-2 border-primary' : ''}`}>Quests</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* IO Buttons */}
            <label className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors" title="Import">
              <Upload className="w-5 h-5" />
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Export">
              <Download className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            <div className="w-64">
              <SearchableDropdown
                value={entryNode || null}
                onChange={setEntryNode}
                options={entryPointOptions}
                placeholder="Starting Node..."
                showFilters={true}
                buttonClass="bg-black/40 border-white/5 text-on-surface"
              />
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-auto pt-16 relative w-full h-full text-on-surface">
          <ErrorBoundary>
            {activeTab === 'paths' && <PathManager />}
            {activeTab === 'chapters' && <ChapterManager />}
            {activeTab === 'quests' && <QuestManager />}
            {activeTab === 'endings' && <EndingManager />}
            {activeTab === 'flags' && <FlagManager />}
            {activeTab === 'status' && <StatusManager />}
            {activeTab === 'choices' && <ChoiceEditor />}
            {activeTab === 'scenes' && <SceneEditor />}
            {activeTab === 'simulator' && <Simulator />}
            {activeTab === 'routeviewer' && <RouteViewer />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
