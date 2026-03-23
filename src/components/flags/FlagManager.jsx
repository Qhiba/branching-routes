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
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">Flag Manager</h2>
            <p className="text-sm text-zinc-400 mt-1">The definitive list of conditions the game tracks over time.</p>
          </div>
        </div>

      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newFlagName}
          onChange={(e) => setNewFlagName(e.target.value)}
          placeholder="New flag name (e.g. met_the_king)"
          className="flex-1 px-4 py-3 bg-surface-container-low border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow text-on-surface placeholder-zinc-600 shadow-inner"
        />
        <button
          type="submit"
          className="signature-gradient text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_15px_rgba(0,209,255,0.3)] text-xs"
        >
          <Plus className="w-4 h-4" />
          Add Flag
        </button>
      </form>

      <div className="space-y-4">
        {Object.values(flags).length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-surface-container-low rounded-2xl border border-dashed border-white/10 shadow-inner">
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
              <div key={flag.id} id={flag.id} className="scroll-mt-8 flex items-center justify-between p-4 bg-surface-container-high border border-white/5 shadow-lg rounded-2xl hover:border-primary/30 hover:shadow-2xl hover:ring-1 hover:ring-primary/20 transition-all group">
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded w-12 text-center uppercase tracking-widest">
                    {flag.id}
                  </span>
                  
                  <DebouncedInput 
                    type="text"
                    value={flag.name}
                    onChange={(val) => updateFlagName(flag.id, val)}
                    className="flex-1 font-headline font-bold text-lg text-on-surface focus:outline-none focus:border-b-2 focus:border-primary bg-transparent py-1 transition-colors"
                    placeholder="flag_name"
                  />
                  
                  <div className="flex items-center gap-3">
                    {inUseCount > 0 && (
                      <span className="text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-widest text-error bg-error/10 px-2.5 py-1 rounded border border-error/20" title={`Used in ${refs.choices.length} choices and ${refs.scenes.length} scenes`}>
                        <AlertCircle className="w-3.5 h-3.5" />
                         in use ({inUseCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 w-10 flex justify-end">
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="p-2 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors opacity-0 group-hover:opacity-100"
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
