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
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
        <Award className="w-8 h-8 text-tertiary-container shrink-0" />
        <div className="flex-1">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Ending Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Define endings based on specific logic flag and status requirements.</p>
        </div>
        {Object.keys(endings).length > 0 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCollapseAll} 
              className="p-2 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" 
              title="Collapse All"
            >
              <FoldVertical className="w-5 h-5" />
            </button>
            <button 
              onClick={handleExpandAll} 
              className="p-2 text-zinc-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" 
              title="Expand All"
            >
              <UnfoldVertical className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="bg-surface-container-low p-5 rounded-2xl border border-white/5 shadow-inner flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New ending name (e.g. good_ending)"
          className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-tertiary-container text-on-surface placeholder-zinc-600 shadow-inner"
        />
        <button type="submit" disabled={!newName.trim()} className="text-[10px] font-bold tracking-widest uppercase text-tertiary-container bg-tertiary-container/10 border border-tertiary-container/20 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-tertiary-container/20 hover:border-tertiary-container/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Create Ending
        </button>
      </form>

      <div className="space-y-4">
        {Object.values(endings).map(ending => (
          <div key={ending.id} id={ending.id} className={`scroll-mt-8 bg-surface-container-high border ${expanded.has(ending.id) ? 'border-tertiary-container/30 shadow-2xl ring-1 ring-tertiary-container/20' : 'border-white/5 shadow-lg'} rounded-2xl transition-all duration-200 hover:border-white/10 group`}>
            {/* Header / Accordion toggle */}
            <div 
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 select-none ${expanded.has(ending.id) ? 'bg-tertiary-container/5 border-b border-tertiary-container/20' : 'bg-transparent'}`}
              onClick={() => toggleExpand(ending.id)}
            >
              <button className="text-zinc-500 transition-colors p-1">
                {expanded.has(ending.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              <span className="font-mono text-[10px] font-bold text-tertiary-container bg-tertiary-container/10 border border-tertiary-container/20 px-3 py-1.5 rounded uppercase tracking-widest">{ending.id}</span>
              
              <DebouncedInput
                type="text"
                value={ending.name}
                onChange={(val) => updateEnding(ending.id, { name: val })}
                onClick={(e) => e.stopPropagation()} // Prevent toggling when renaming
                className="font-headline font-bold text-lg text-on-surface bg-transparent border-b-2 border-transparent hover:border-white/10 focus:border-tertiary-container focus:outline-none py-1 transition-colors flex-1"
                placeholder="Ending Name"
              />
              
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-surface-container-lowest px-2.5 py-1 rounded border border-white/5 shadow-sm">
                  {ending.requires?.length || 0} Conditions
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm(`Delete ending ${ending.id}?`)) {
                      deleteEnding(ending.id);
                    }
                  }}
                  className="text-zinc-500 hover:text-error hover:bg-error/10 p-2 rounded border border-transparent hover:border-error/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Expanded Content */}
            {expanded.has(ending.id) && (
              <div className="p-6 bg-surface-container space-y-6 shadow-inner rounded-b-2xl">
                <div>
                  <h4 className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest mb-3 flex items-center gap-2">
                    Requirements to Trigger
                  </h4>
                  <div className="pl-4 border-l border-white/5">
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
          <div className="text-center py-12 bg-surface-container-low border border-white/10 border-dashed rounded-2xl flex flex-col items-center shadow-inner">
             <AlertCircle className="w-8 h-8 text-zinc-500 mb-3" />
             <p className="text-sm text-zinc-400 mt-1">No endings exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(endings)} title="Endings" renderLabel={e => e.name || 'Unnamed Ending'} />
    </div>
  );
}
