import React, { useState } from 'react';
import { Flag, ListTree, Layers, Download, Upload, PlayCircle, GitFork, Book, Dumbbell } from 'lucide-react';
import FlagManager from './components/flags/FlagManager';
import ChoiceEditor from './components/choices/ChoiceEditor';
import SceneEditor from './components/scenes/SceneEditor';
import Simulator from './components/simulator/Simulator';
import PathManager from './components/paths/PathManager';
import ChapterManager from './components/chapters/ChapterManager';
import StatusManager from './components/status/StatusManager';
import { useEditor } from './context/EditorContext';

function App() {
  const [activeTab, setActiveTab] = useState('flags');
  const { flags, choices, scenes, paths, chapters, statusPoints, loadData } = useEditor();

  const handleExport = () => {
    const data = {
      metadata: {
        version: "1.0",
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      },
      path: paths,
      chapter: chapters,
      flags,
      choices,
      scenes,
      status: statusPoints
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'narrative_structure.json';
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
        if (data.flags || data.choices || data.scenes || data.path || data.chapter || data.status) {
          loadData({
            flags: data.flags || {},
            choices: data.choices || {},
            scenes: data.scenes || {},
            paths: data.path || {},
            chapters: data.chapter || {},
            status: data.status || {}
          });
        } else {
          alert("Invalid file structure. Missing flags, choices, or scenes.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'flags' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'status' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'paths' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'chapters' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Book className={`w-5 h-5 ${activeTab === 'chapters' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Chapters
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(chapters).length}
                </span>
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">Events</h3>
              <button
                onClick={() => setActiveTab('choices')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'choices' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === 'scenes' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Layers className={`w-5 h-5 ${activeTab === 'scenes' ? 'text-indigo-600' : 'text-gray-400'}`} />
                Scenes
                <span className="ml-auto bg-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-gray-100">
                  {Object.keys(scenes).length}
                </span>
              </button>
            </nav>

            <nav className="flex flex-col gap-1.5 mt-auto pt-8 border-t border-gray-100">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl font-bold tracking-wide transition-all ${
                  activeTab === 'simulator' ? 'bg-indigo-950 text-white shadow-[0_4px_20px_rgba(49,46,129,0.3)]' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-900/10'
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
          <div className="w-full max-w-[100rem] mx-auto h-full flex flex-col">
            {activeTab === 'paths' && <PathManager />}
            {activeTab === 'chapters' && <ChapterManager />}
            {activeTab === 'flags' && <FlagManager />}
            {activeTab === 'status' && <StatusManager />}
            {activeTab === 'choices' && <ChoiceEditor />}
            {activeTab === 'scenes' && <SceneEditor />}
            {activeTab === 'simulator' && <Simulator />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
