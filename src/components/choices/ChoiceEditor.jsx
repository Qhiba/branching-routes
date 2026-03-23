import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical, ListTree } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';
import SearchableDropdown from '../shared/SearchableDropdown';
import DebouncedInput from '../shared/DebouncedInput';

export default function ChoiceEditor() {
  const { flags, statusPoints, paths, chapters, choices, scenes, endings, entryNode, setEntryNode, addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice } = useEditor();
  const [expandedChoices, setExpandedChoices] = useState(new Set());
  const [expandedOptions, setExpandedOptions] = useState(new Set());

  // Memoize dropdown options to avoid reconstructing on every render (#8)
  const dropdownOptions = useMemo(() => [
    { id: null, name: "Current Choice (Loop)" },
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const toggleChoice = (id) => {
    setExpandedChoices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleOption = (id) => {
    setExpandedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedChoices(new Set(Object.keys(choices)));
  const collapseAll = () => setExpandedChoices(new Set());

  const handleAddChoice = () => {
    addChoice("");
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">Choice Editor</h2>
            <p className="text-sm text-zinc-400 mt-1">Design the decisions and their outcomes.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={collapseAll} className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="Collapse All">
               <FoldVertical className="w-5 h-5" />
            </button>
            <button onClick={expandAll} className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="Expand All">
               <UnfoldVertical className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddChoice}
              className="signature-gradient text-on-primary px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_15px_rgba(0,209,255,0.3)] text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Choice
            </button>
          </div>
        </div>

      {Object.values(choices).length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-surface-container-low rounded-2xl border border-dashed border-white/10">
          No choices created yet.<br/> <span className="text-sm mt-2 block">A choice is the moment a player makes a decision.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(choices)
            .sort((a, b) => parseInt(b.id.replace('CH', '')) - parseInt(a.id.replace('CH', '')))
            .map(choice => {
              const isExpanded = expandedChoices.has(choice.id);

              return (
              <div key={choice.id} id={choice.id} className={`scroll-mt-8 border ${isExpanded ? 'border-primary/30 shadow-2xl ring-1 ring-primary/20' : 'border-white/5 shadow-lg hover:border-white/10'} rounded-2xl bg-surface-container-high transition-all overflow-hidden`}>
                {/* Accordion Header */}
                <div 
                  className={`flex ${isExpanded ? 'bg-primary/5 border-b border-primary/20' : 'bg-transparent'} p-4 items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none`}
                  onClick={() => toggleChoice(choice.id)}
                >
                  <div className="text-zinc-500">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>

                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                    {choice.id}
                  </span>

                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className={`font-headline text-lg font-bold truncate ${choice.text ? 'text-on-surface' : 'text-zinc-600 italic'}`}>
                      {choice.text || 'Unnamed Choice'}
                    </span>
                    
                    {!isExpanded && (
                      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                        {choice.chapter && <span className="bg-secondary-container/10 text-secondary-container px-2 py-0.5 rounded border border-secondary-container/20 truncate max-w-[120px]">CH: {chapters[choice.chapter]?.name || choice.chapter}</span>}
                        {choice.path && <span className="bg-tertiary-container/10 text-tertiary-container px-2 py-0.5 rounded border border-tertiary-container/20 truncate max-w-[120px]">PTH: {paths[choice.path]?.name || choice.path}</span>}
                        
                        <span className="bg-surface-container-lowest text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                          OPT: {choice.options?.length || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryNode(choice.id);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors border ${entryNode === choice.id ? 'bg-secondary-container/20 text-secondary-container border-secondary-container shadow-[0_0_10px_rgba(171,249,0,0.2)]' : 'bg-surface-container-lowest text-zinc-500 border-white/5 hover:bg-secondary-container/10 hover:text-secondary-container hover:border-secondary-container/30'}`}
                      title={entryNode === choice.id ? "Current Entry Node" : "Set as Entry Point"}
                    >
                      {entryNode === choice.id ? 'Entry Node' : 'Set Entry Point'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this choice?")) {
                          deleteChoice(choice.id);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors"
                      title="Delete Choice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                <div className="p-6 bg-surface-container shadow-inner space-y-6">
                  <div className="space-y-4">
                    <DebouncedInput
                      type="text"
                      value={choice.text}
                      onChange={(val) => updateChoice(choice.id, { text: val })}
                      className="w-full font-headline font-bold text-on-surface focus:outline-none focus:border-b-2 focus:border-primary bg-transparent pb-1 transition-colors text-xl placeholder-zinc-600"
                      placeholder="Choice prompt text..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 shadow-inner">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Story Chapter</label>
                        <select value={choice.chapter || ''} onChange={(e) => updateChoice(choice.id, { chapter: e.target.value || null })} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="">No Chapter Assigned</option>
                            {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 shadow-inner">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Story Path</label>
                        <select value={choice.path || ''} onChange={(e) => updateChoice(choice.id, { path: e.target.value || null })} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="">No Path Assigned</option>
                            {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Choice-level conditions */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-white/5 shadow-inner">
                      <label className="font-label text-xs font-bold text-primary uppercase tracking-widest mb-3 block">Visibility Conditions</label>
                      <ConditionEditor
                        conditions={choice.requires || []}
                        onChange={(newReqs) => updateChoice(choice.id, { requires: newReqs })}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-label text-xs font-bold text-secondary-container uppercase tracking-widest">Options</h4>
                      <button
                        onClick={() => addChoiceOption(choice.id)}
                        className="text-[10px] flex items-center gap-1.5 text-secondary-container hover:text-secondary-fixed font-bold tracking-widest uppercase px-3 py-2 bg-secondary-container/10 border border-secondary-container/20 hover:border-secondary-container hover:bg-secondary-container/20 rounded-lg transition-colors shadow-sm"
                      >
                        <Plus className="w-3 h-3" /> Add Option
                      </button>
                    </div>

                    {(!choice.options || choice.options.length === 0) ? (
                      <div className="text-xs text-center py-6 text-zinc-500 bg-surface-container-lowest rounded-xl border border-white/5 font-mono uppercase tracking-widest shadow-inner">
                        No options added to this choice.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {choice.options.map((opt, idx) => {
                          const optKey = opt.id || `${choice.id}-opt-${idx}`;
                          const isOptExpanded = expandedOptions.has(optKey);
                          
                          return (
                          <div key={optKey} className={`border ${isOptExpanded ? 'border-primary/30 shadow-2xl ring-1 ring-primary/20 border-l-4 border-l-primary' : 'border-white/5 border-l-4 border-l-zinc-600 hover:border-white/20 shadow-lg'} rounded-r-xl rounded-l-md bg-surface-container-lowest relative transition-all group hover:shadow-xl`}>
                            {/* Accordion Header for Option */}
                            <div 
                              className={`flex p-4 items-center gap-4 cursor-pointer ${isOptExpanded ? 'bg-primary/5 border-b border-primary/20' : 'hover:bg-white/5'} select-none transition-colors`}
                              onClick={() => toggleOption(optKey)}
                            >
                              <div className="text-zinc-500">
                                {isOptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center gap-3">
                                <span className={`font-headline text-base font-bold truncate ${opt.label ? 'text-on-surface' : 'text-zinc-600 italic'}`}>
                                  {opt.label || `Option ${idx + 1}`}
                                </span>
                                
                                {!isOptExpanded && opt.next && (
                                  <span className="bg-surface-container text-zinc-400 px-2 flex items-center gap-1.5 py-1 rounded border border-white/5 text-[10px] shadow-sm ml-2 font-mono">
                                    <ListTree className="w-3 h-3 text-secondary-container" />
                                    Next: {opt.next}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteChoiceOption(choice.id, idx);
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors"
                                  title="Delete Option"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Option Content */}
                            {isOptExpanded && (
                            <div className="p-6 space-y-6 bg-surface-container shadow-inner">
                              <div className="pr-1">
                                <label className="block text-[10px] font-bold font-mono text-zinc-500 mb-2 uppercase tracking-widest">Option Label</label>
                                <DebouncedInput
                                  type="text"
                                  value={opt.label}
                                  onChange={(val) => updateChoiceOption(choice.id, idx, { ...opt, label: val })}
                                  className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary shadow-inner text-on-surface placeholder-zinc-600"
                                  placeholder="e.g. Yes, I accept..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                {/* Left: Requirements and Next */}
                                <div className="space-y-6 pr-4 border-r border-white/5">
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold font-mono text-zinc-500 mb-2 uppercase tracking-widest">Next Destination</label>
                                    <SearchableDropdown
                                      value={opt.next || null}
                                      onChange={(val) => updateChoiceOption(choice.id, idx, { ...opt, next: val || null })}
                                      options={dropdownOptions}
                                      placeholder="Current Choice (Loop)"
                                      showFilters={true}
                                      buttonClass="bg-black/40 border-white/5 text-on-surface"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-bold font-mono text-zinc-500 mb-2 uppercase tracking-widest">Option Conditions</label>
                                    <ConditionEditor
                                      conditions={opt.requires || []}
                                      onChange={(newReqs) => updateChoiceOption(choice.id, idx, { ...opt, requires: newReqs })}
                                    />
                                  </div>
                                </div>

                                {/* Right: Flags and Status Set */}
                                <div className="space-y-6 pl-2">
                                  <div className="space-y-2">
                                    <FlagsSetEditor
                                      flagsSet={opt.flags_set || []}
                                      onChange={(newFlagsSet) => updateChoiceOption(choice.id, idx, { ...opt, flags_set: newFlagsSet })}
                                      availableFlags={Object.values(flags)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <StatusSetEditor
                                      statusSet={opt.status_set || []}
                                      onChange={(newStatusSet) => updateChoiceOption(choice.id, idx, { ...opt, status_set: newStatusSet })}
                                      availableStatus={Object.values(statusPoints)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            )})}
        </div>
      )}
      </div>
      <QuickNav items={Object.values(choices).sort((a,b) => parseInt(b.id.replace('CH','')) - parseInt(a.id.replace('CH','')))} title="Choices" renderLabel={c => c.text ? (c.text.length > 25 ? c.text.substring(0, 25) + '...' : c.text) : '...'} />
    </div>
  );
}

function FlagsSetEditor({ flagsSet, onChange, availableFlags }) {
  const addFlagMod = (flagId) => {
    if (!flagsSet.includes(flagId)) onChange([...flagsSet, flagId]);
  };
  const updateFlagMod = (idx, flagId) => {
    const next = [...flagsSet];
    next[idx] = flagId;
    onChange(next);
  };
  const removeFlagMod = (idx) => onChange(flagsSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase">Flags Set (On Select)</label>
      </div>
      
      {availableFlags.length === 0 ? (
        <div className="text-[10px] py-4 text-center text-zinc-600 bg-surface-container-lowest border border-dashed border-white/5 rounded-xl font-mono uppercase tracking-widest">
          No flags available.
        </div>
      ) : (
        <div className="space-y-3">
          {flagsSet.map((flagId, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-primary/5 p-3 border border-primary/20 rounded-xl relative shadow-inner">
               <SearchableDropdown
                 value={flagId}
                 onChange={(val) => updateFlagMod(idx, val)}
                 options={availableFlags}
                 placeholder="Select Flag..."
                 showFilters={true}
                 className="flex-1 min-w-[150px]"
                 buttonClass="border-primary/20 bg-black/40 text-primary focus:ring-primary/50"
               />
               <button onClick={() => removeFlagMod(idx)} className="text-zinc-500 hover:text-error hover:bg-error/10 p-2 rounded border border-transparent hover:border-error/20 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="pt-2">
             <button onClick={() => addFlagMod(availableFlags[0]?.id || '')} disabled={availableFlags.length===0} className="text-[10px] text-primary hover:text-primary-fixed bg-primary/10 border border-primary/20 hover:border-primary/50 hover:bg-primary/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all shadow-sm w-full justify-center">
                <Plus className="w-3.5 h-3.5" /> Set Flag Target
             </button>
          </div>
        </div>
      )}
      <p className="text-[10px] text-zinc-500 font-mono mt-3 opacity-80 leading-relaxed">
        * Selected flags will be set to TRUE when this option is chosen.
      </p>
    </div>
  );
}

function StatusSetEditor({ statusSet, onChange, availableStatus }) {
  const addStatusMod = (statusId) => onChange([...statusSet, { status: statusId, amount: 0 }]);
  const updateStatusMod = (idx, updates) => {
    const next = [...statusSet];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
  };
  const removeStatusMod = (idx) => onChange(statusSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase">Status Modifiers</label>
      </div>
      
      {availableStatus.length === 0 ? (
        <div className="text-[10px] py-4 text-center text-zinc-600 bg-surface-container-lowest border border-dashed border-white/5 rounded-xl font-mono uppercase tracking-widest">
          No statuses available.
        </div>
      ) : (
        <div className="space-y-3">
          {statusSet.map((mod, idx) => (
            <div key={idx} className="flex flex-col gap-3 bg-secondary-container/5 p-3 border border-secondary-container/20 rounded-xl relative shadow-inner">
               <div className="flex items-center gap-3">
                 <SearchableDropdown
                   value={mod.status}
                   onChange={val => updateStatusMod(idx, { status: val })}
                   options={availableStatus}
                   placeholder="Select Status..."
                   showFilters={false}
                   className="flex-1 min-w-0"
                   buttonClass="border-secondary-container/20 bg-black/40 text-secondary-container focus:ring-secondary-container/50"
                 />
                 <button onClick={() => removeStatusMod(idx)} className="text-zinc-500 hover:text-error hover:bg-error/10 p-2 rounded border border-transparent hover:border-error/20 transition-all"><Trash2 className="w-4 h-4" /></button>
               </div>
               <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-white/10 transition-colors focus-within:border-secondary-container focus-within:ring-1 focus-within:ring-secondary-container w-full justify-between">
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Amount offset:</span>
                 <input type="number" value={mod.amount} onChange={e => updateStatusMod(idx, { amount: parseInt(e.target.value,10)||0 })} className="w-20 bg-transparent border-none text-sm text-right font-mono text-on-surface focus:outline-none font-bold" />
               </div>
            </div>
          ))}
          <div className="pt-2">
             <button onClick={() => addStatusMod(availableStatus[0]?.id || '')} disabled={availableStatus.length===0} className="text-[10px] text-secondary-container hover:text-secondary-fixed bg-secondary-container/10 border border-secondary-container/20 hover:border-secondary-container/50 hover:bg-secondary-container/20 px-3 py-2.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all shadow-sm w-full justify-center">
                <Plus className="w-3.5 h-3.5" /> Modify Status
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
