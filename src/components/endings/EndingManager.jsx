import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, Award, AlertCircle, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import ConditionEditor from '../shared/ConditionEditor';
import DebouncedInput from '../shared/DebouncedInput';

export default function EndingManager() {
  const { endings, addEnding, updateEnding, deleteEnding } = useEditor();
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const handleExpandAll = () => {
    setExpanded(new Set(Object.keys(endings)));
  };

  const handleCollapseAll = () => {
    setExpanded(new Set());
  };

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addEnding(newName);
    setNewName('');
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
        <div className="flex items-center gap-3 mb-8">
        <Award className="w-8 h-8 text-indigo-600 shrink-0" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Ending Manager</h2>
          <p className="text-sm text-gray-500">Define endings based on specific logic flag and status requirements.</p>
        </div>
        {Object.keys(endings).length > 0 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCollapseAll} 
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
              title="Collapse All"
            >
              <FoldVertical className="w-5 h-5" />
            </button>
            <button 
              onClick={handleExpandAll} 
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
              title="Expand All"
            >
              <UnfoldVertical className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New ending name (e.g. good_ending)"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" disabled={!newName.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium tracking-wide flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <Plus className="w-4 h-4" /> Create Ending
        </button>
      </form>

      <div className="space-y-4">
        {Object.values(endings).map(ending => (
          <div key={ending.id} id={ending.id} className="scroll-mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm transition-all duration-200 hover:border-indigo-300">
            {/* Header / Accordion toggle */}
            <div 
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-indigo-50/30 select-none group ${expanded.has(ending.id) ? 'bg-gray-50/50 border-b border-gray-100 rounded-t-2xl' : 'bg-gray-50/50 rounded-2xl'}`}
              onClick={() => toggleExpand(ending.id)}
            >
              <button className="text-gray-400 group-hover:text-indigo-500 transition-colors p-1">
                {expanded.has(ending.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-lg">{ending.id}</span>
              
              <DebouncedInput
                type="text"
                value={ending.name}
                onChange={(val) => updateEnding(ending.id, { name: val })}
                onClick={(e) => e.stopPropagation()} // Prevent toggling when renaming
                className="font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                placeholder="Ending Name"
              />
              
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 bg-white px-2.5 py-1 rounded-md border border-gray-100 shadow-sm">
                  {ending.requires?.length || 0} Conditions
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm(`Delete ending ${ending.id}?`)) {
                      deleteEnding(ending.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Expanded Content */}
            {expanded.has(ending.id) && (
              <div className="p-5 border-t border-gray-100 bg-white space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Requirements to Trigger
                  </h4>
                  <div className="pl-2 border-l-2 border-indigo-100">
                    <ConditionEditor 
                      conditions={ending.requires || []} 
                      onChange={(newReqs) => updateEnding(ending.id, { requires: newReqs })} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {Object.keys(endings).length === 0 && (
          <div className="text-center py-12 bg-gray-50 border border-gray-200 border-dashed rounded-2xl flex flex-col items-center">
             <AlertCircle className="w-8 h-8 text-gray-400 mb-3" />
             <p className="text-gray-500 font-medium tracking-wide">No endings exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(endings)} title="Endings" renderLabel={e => e.name || 'Unnamed Ending'} />
    </div>
  );
}
