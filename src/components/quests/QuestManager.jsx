import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, Map, AlertCircle } from 'lucide-react';
import QuickNav from '../shared/QuickNav';
import DebouncedInput from '../shared/DebouncedInput';

export default function QuestManager() {
  const { quests, addQuest, updateQuestName, deleteQuest } = useEditor();
  const [newName, setNewName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addQuest(newName);
    setNewName('');
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
        <Map className="w-8 h-8 text-secondary-container" />
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Quest Manager</h2>
          <p className="text-sm text-zinc-400 mt-1">Define broad story quests. Quests are organizational tags for scenes.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface-container-low p-5 rounded-2xl border border-white/5 shadow-inner flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New quest name (e.g. rescue_the_merchant)"
          className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary-container text-on-surface placeholder-zinc-600 shadow-inner"
        />
        <button type="submit" disabled={!newName.trim()} className="text-[10px] font-bold tracking-widest uppercase text-secondary-container bg-secondary-container/10 border border-secondary-container/20 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-secondary-container/20 hover:border-secondary-container/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Create Quest
        </button>
      </form>

      <div className="space-y-4">
        {Object.values(quests).map(quest => (
          <div key={quest.id} id={quest.id} className="scroll-mt-8 bg-surface-container-high border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg group hover:border-secondary-container/30 hover:shadow-2xl hover:ring-1 hover:ring-secondary-container/20 transition-all">
            <div className="flex items-center gap-4 flex-1">
              <span className="font-mono text-[10px] font-bold text-secondary-container bg-secondary-container/10 border border-secondary-container/20 px-3 py-1.5 rounded uppercase tracking-widest">{quest.id}</span>
              <DebouncedInput
                type="text"
                value={quest.name}
                onChange={(val) => updateQuestName(quest.id, val)}
                className="font-headline font-bold text-lg text-on-surface bg-transparent border-b-2 border-transparent hover:border-white/10 focus:border-secondary-container focus:outline-none py-1 transition-colors flex-1"
              />
            </div>
            
            <button 
              onClick={() => {
                if(window.confirm(`Delete quest ${quest.id}? It will be removed from all assigned scenes/choices.`)) {
                  deleteQuest(quest.id);
                }
              }}
              className="p-2 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Quest"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {Object.keys(quests).length === 0 && (
          <div className="text-center py-12 bg-surface-container-low border border-white/10 border-dashed rounded-2xl flex flex-col items-center shadow-inner">
             <AlertCircle className="w-8 h-8 text-zinc-500 mb-3" />
             <p className="text-sm text-zinc-400 mt-1">No quests exist yet.</p>
          </div>
        )}
      </div>
      </div>
      <QuickNav items={Object.values(quests)} title="Quests" renderLabel={q => q.name || 'Unnamed Quest'} />
    </div>
  );
}
