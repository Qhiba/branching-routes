import React, { useState, useEffect } from 'react';
import { useEditor, useEditorActions } from '../../context/EditorContext';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function FlagManager() {
  const { flags, addFlag, updateFlagName, deleteFlag, toggleFlagState } = useEditor();
  const { getFlagReferenceMap } = useEditorActions();
  const [flagRefMap, setFlagRefMap] = useState({});

  useEffect(() => {
    setFlagRefMap(getFlagReferenceMap());
  }, [getFlagReferenceMap]);

  const [newFlagName, setNewFlagName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newFlagName.trim()) return;
    addFlag(newFlagName);
    setNewFlagName('');
  };

  const handleDelete = (id) => {
    const freshMap = getFlagReferenceMap();
    const refs = freshMap[id] || { choices: [], scenes: [] };
    const inUse = refs.choices.length > 0 || refs.scenes.length > 0;
    
    if (inUse) {
      if (!window.confirm(`Warning: This flag is currently used in ${refs.choices.length} choices and ${refs.scenes.length} scenes. Deleting it will irrevocably cascade and remove it from them. Are you absolutely sure?`)) {
        return;
      }
    } else {
       if (!window.confirm("Delete this flag?")) return;
    }
    
    deleteFlag(id);
    setFlagRefMap(getFlagReferenceMap());
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Flag Manager</h2>
          <p className="text-sm text-gray-500 mt-1">The definitive list of conditions the game tracks over time.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newFlagName}
          onChange={(e) => setNewFlagName(e.target.value)}
          placeholder="New flag name (e.g. met_the_king)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-5 h-5" />
          Add Flag
        </button>
      </form>

      <div className="space-y-3">
        {Object.values(flags).length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No flags created yet.<br/> <span className="text-sm mt-2 block">Create a flag to start building your narrative logic.</span>
          </div>
        ) : (
          Object.values(flags)
            .sort((a, b) => {
              const numA = parseInt(a.id.replace('F', ''), 10);
              const numB = parseInt(b.id.replace('F', ''), 10);
              return numB - numA; // newest first
            })
            .map(flag => {
            const refs = flagRefMap[flag.id] || { choices: [], scenes: [] };
            const inUseCount = refs.choices.length + refs.scenes.length;
            
            return (
              <div key={flag.id} id={flag.id} className="scroll-mt-8 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-12 text-center">
                    {flag.id}
                  </span>
                  
                  <DebouncedInput 
                    type="text"
                    value={flag.name}
                    onChange={(val) => updateFlagName(flag.id, val)}
                    className="flex-1 font-medium text-gray-800 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 transition-colors"
                    placeholder="flag_name"
                  />
                  
                  <div className="flex items-center gap-3">

                    {inUseCount > 0 && (
                      <span className="text-xs flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200" title={`Used in ${refs.choices.length} choices and ${refs.scenes.length} scenes`}>
                        <AlertCircle className="w-3.5 h-3.5" />
                         in use ({inUseCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 w-10 flex justify-end">
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete flag"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
      <QuickNav items={Object.values(flags).sort((a,b) => parseInt(b.id.replace('F','')) - parseInt(a.id.replace('F','')))} title="Flags" renderLabel={f => f.name || 'Unnamed'} />
    </div>
  );
}
