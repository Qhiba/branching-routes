import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, GitFork, AlertCircle } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function PathManager() {
  const { paths, addPath, updatePathName, deletePath } = useEditor();
  const [newName, setNewName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPath(newName);
    setNewName('');
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
        <div className="flex items-center gap-3 mb-8">
        <GitFork className="w-8 h-8 text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Path Manager</h2>
          <p className="text-sm text-gray-500">Define broad story branches or character routes. Paths are organizational only.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New path name (e.g. vigilante)"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={!newName.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium tracking-wide flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <Plus className="w-4 h-4" /> Create Path
        </button>
      </form>

      <div className="space-y-3">
        {Object.values(paths).map(path => (
          <div key={path.id} id={path.id} className="scroll-mt-8 bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-lg">{path.id}</span>
              <DebouncedInput
                type="text"
                value={path.name}
                onChange={(val) => updatePathName(path.id, val)}
                className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
              />
            </div>
            
            <button 
              onClick={() => {
                if(window.confirm(`Delete path ${path.id}? It will be removed from all assigned scenes/choices.`)) {
                  deletePath(path.id);
                }
              }}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {Object.keys(paths).length === 0 && (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 border-dashed rounded-2xl flex flex-col items-center">
             <AlertCircle className="w-8 h-8 text-gray-400 mb-3" />
             <p className="text-gray-500 font-medium tracking-wide">No paths exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(paths)} title="Paths" renderLabel={p => p.name || 'Unnamed Path'} />
    </div>
  );
}
