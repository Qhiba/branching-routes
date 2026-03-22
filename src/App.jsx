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

  return (
    <div className="h-screen flex flex-col bg-gray-50/50 overflow-hidden font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 shrink-0 relative z-20">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-inner">
              <ListTree className="w-5 h-5 text-indigo-50" />
            </div>
            <h1 className="font-bold border-gray-200 text-xl tracking-tight text-gray-800">Narrative Logic Editor</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64 mr-2 hidden md:block">
              <SearchableDropdown
                value={entryNode || null}
                onChange={setEntryNode}
                options={entryPointOptions}
                placeholder="Set Entry Point..."
                showFilters={true}
              />
            </div>
            <label className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-900/20"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden w-full">
        {/* Dedicated Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto shrink-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 flex-1 flex flex-col gap-8">

            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Variables</h3>

              <button
                onClick={() => setActiveTab('flags')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'flags' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Flag className={`w-5 h-5 ${activeTab === 'flags' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Flags
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(flags).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('status')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'status' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Dumbbell className={`w-5 h-5 ${activeTab === 'status' ? 'text-emerald-600' : 'text-gray-400'}`} />
                Status Points
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(statusPoints).length}
                </span>
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Structure</h3>
              <button
                onClick={() => setActiveTab('paths')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'paths' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <GitFork className={`w-5 h-5 ${activeTab === 'paths' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Paths
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(paths).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'chapters' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Book className={`w-5 h-5 ${activeTab === 'chapters' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Chapters
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(chapters).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quests')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'quests' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Map className={`w-5 h-5 ${activeTab === 'quests' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Quests
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(quests).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('endings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'endings' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Award className={`w-5 h-5 ${activeTab === 'endings' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Endings
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(endings).length}
                </span>
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Events</h3>
              <button
                onClick={() => setActiveTab('choices')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'choices' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <ListTree className={`w-5 h-5 ${activeTab === 'choices' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Choices
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(choices).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scenes')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'scenes' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Layers className={`w-5 h-5 ${activeTab === 'scenes' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Scenes
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(scenes).length}
                </span>
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Analysis</h3>
              <button
                onClick={() => setActiveTab('routeviewer')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'routeviewer' ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
              >
                <Network className={`w-5 h-5 ${activeTab === 'routeviewer' ? 'text-violet-600' : 'text-gray-400'}`} />
                Route Viewer
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5 mt-auto pt-8 border-t border-gray-100">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold tracking-wide transition-all ${activeTab === 'simulator' ? 'bg-indigo-950 text-white shadow-[0_4px_20px_rgba(49,46,129,0.3)]' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-900/10'
                  }`}
              >
                <PlayCircle className={`w-5 h-5 ${activeTab === 'simulator' ? 'text-indigo-400' : 'text-gray-400'}`} />
                Play Sandbox
              </button>
            </nav>

          </div>
        </aside>

        {/* Expansive Main Content Area */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-8 flex flex-col bg-gray-50/50">
          <ErrorBoundary>
          <div className="w-full max-w-[100rem] mx-auto h-full flex flex-col">
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
          </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
