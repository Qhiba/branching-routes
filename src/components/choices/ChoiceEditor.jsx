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
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Choice Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Design the decisions and their outcomes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={collapseAll} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Collapse All">
             <FoldVertical className="w-5 h-5" />
          </button>
          <button onClick={expandAll} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Expand All">
             <UnfoldVertical className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddChoice}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            Add Choice
          </button>
        </div>
      </div>

      {Object.values(choices).length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No choices created yet.<br/> <span className="text-sm mt-2 block">A choice is the moment a player makes a decision.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(choices)
            .sort((a, b) => parseInt(b.id.replace('CH', '')) - parseInt(a.id.replace('CH', '')))
            .map(choice => {
              const isExpanded = expandedChoices.has(choice.id);

              return (
              <div key={choice.id} id={choice.id} className={`scroll-mt-8 border ${isExpanded ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : 'border-gray-200 shadow-sm hover:border-gray-300'} rounded-xl bg-white transition-all`}>
                {/* Accordion Header */}
                <div 
                  className={`flex ${isExpanded ? 'bg-indigo-50/50 border-b border-indigo-100 rounded-t-xl' : 'bg-gray-50 rounded-xl'} p-3 sm:p-4 items-center gap-3 sm:gap-4 cursor-pointer hover:bg-gray-100 transition-colors select-none`}
                  onClick={() => toggleChoice(choice.id)}
                >
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>

                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                    {choice.id}
                  </span>

                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className={`font-bold truncate text-base ${choice.text ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                      {choice.text || 'Unnamed Choice'}
                    </span>
                    
                    {!isExpanded && (
                      <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs">
                        {choice.chapter && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[120px]">Ch: {chapters[choice.chapter]?.name || choice.chapter}</span>}
                        {choice.path && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 truncate max-w-[120px]">Path: {paths[choice.path]?.name || choice.path}</span>}
                        
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                          Options: {choice.options?.length || 0}
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
                      className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors border ${entryNode === choice.id ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'}`}
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
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Choice"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                <div className="p-5 bg-white space-y-6">
                  <div className="space-y-3">
                    <DebouncedInput
                      type="text"
                      value={choice.text}
                      onChange={(val) => updateChoice(choice.id, { text: val })}
                      className="w-full font-semibold text-gray-800 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 px-1 transition-colors text-lg"
                      placeholder="Choice prompt text..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Story Chapter</label>
                        <select value={choice.chapter || ''} onChange={(e) => updateChoice(choice.id, { chapter: e.target.value || null })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">No Chapter Assigned</option>
                            {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Story Path</label>
                        <select value={choice.path || ''} onChange={(e) => updateChoice(choice.id, { path: e.target.value || null })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">No Path Assigned</option>
                            {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Choice-level conditions */}
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <ConditionEditor
                        conditions={choice.requires || []}
                        onChange={(newReqs) => updateChoice(choice.id, { requires: newReqs })}
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="border-t border-gray-100 pt-5 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Options</h4>
                      <button
                        onClick={() => addChoiceOption(choice.id)}
                        className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Option
                      </button>
                    </div>

                    {(!choice.options || choice.options.length === 0) ? (
                      <div className="text-sm text-center py-4 text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                        No options added to this choice.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {choice.options.map((opt, idx) => {
                          const optKey = opt.id || `${choice.id}-opt-${idx}`;
                          const isOptExpanded = expandedOptions.has(optKey);
                          
                          return (
                          <div key={optKey} className={`border ${isOptExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50 border-l-4 border-l-indigo-400' : 'border-gray-200 border-l-4 border-l-gray-300 hover:border-gray-300 shadow-sm'} rounded-r-xl rounded-l-md bg-gray-50 relative transition-all group hover:shadow`}>
                            {/* Accordion Header for Option */}
                            <div 
                              className={`flex p-3 items-center gap-3 cursor-pointer ${isOptExpanded ? 'bg-indigo-50/50 border-b border-indigo-100 rounded-tr-xl' : 'hover:bg-gray-100 rounded-r-xl'} select-none`}
                              onClick={() => toggleOption(optKey)}
                            >
                              <div className="text-gray-400">
                                {isOptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className={`font-semibold text-sm truncate ${opt.label ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                  {opt.label || `Option ${idx + 1}`}
                                </span>
                                
                                {!isOptExpanded && opt.next && (
                                  <span className="bg-white text-gray-500 px-2 flex items-center gap-1 py-0.5 rounded border border-gray-200 text-[10px] shadow-sm ml-2">
                                    <ListTree className="w-3 h-3" />
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
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete Option"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Expanded Option Content */}
                            {isOptExpanded && (
                            <div className="p-4 space-y-4 bg-white/50 rounded-br-xl">
                              <div className="pr-1">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Option Label</label>
                                <DebouncedInput
                                  type="text"
                                  value={opt.label}
                                  onChange={(val) => updateChoiceOption(choice.id, idx, { ...opt, label: val })}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                  placeholder="e.g. Yes, I accept..."
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                {/* Left: Requirements and Next */}
                                <div className="space-y-4">
                                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Next Destination</label>
                                    <SearchableDropdown
                                      value={opt.next || null}
                                      onChange={(val) => updateChoiceOption(choice.id, idx, { ...opt, next: val || null })}
                                      options={dropdownOptions}
                                      placeholder="Current Choice (Loop)"
                                      showFilters={true}
                                    />
                                  </div>

                                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <ConditionEditor
                                      conditions={opt.requires || []}
                                      onChange={(newReqs) => updateChoiceOption(choice.id, idx, { ...opt, requires: newReqs })}
                                    />
                                  </div>
                                </div>

                                {/* Right: Flags and Status Set */}
                                <div className="space-y-4">
                                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <FlagsSetEditor
                                      flagsSet={opt.flags_set || []}
                                      onChange={(newFlagsSet) => updateChoiceOption(choice.id, idx, { ...opt, flags_set: newFlagsSet })}
                                      availableFlags={Object.values(flags)}
                                    />
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
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
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">Flags Set (On Select)</label>
      </div>
      
      {availableFlags.length === 0 ? (
        <div className="text-sm py-3 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          No flags available to set.
        </div>
      ) : (
        <div className="space-y-2">
          {flagsSet.map((flagId, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 p-2 border border-indigo-100 rounded-lg">
               <SearchableDropdown
                 value={flagId}
                 onChange={(val) => updateFlagMod(idx, val)}
                 options={availableFlags}
                 placeholder="Select Flag..."
                 showFilters={true}
                 className="flex-1 min-w-[150px]"
                 buttonClass="border-indigo-200 focus:ring-indigo-400"
               />
               <button onClick={() => removeFlagMod(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="pt-1">
             <button onClick={() => addFlagMod(availableFlags[0]?.id || '')} disabled={availableFlags.length===0} className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors w-full justify-center">
                <Plus className="w-3 h-3" /> Add Flag
             </button>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
        * Select flags to flip to "true" when chosen.
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
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">Status Modifiers</label>
      </div>
      
      {availableStatus.length === 0 ? (
        <div className="text-sm py-3 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          No status points available.
        </div>
      ) : (
        <div className="space-y-2">
          {statusSet.map((mod, idx) => (
            <div key={idx} className="flex flex-col gap-2 bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg">
               <div className="flex items-center gap-2">
                 <SearchableDropdown
                   value={mod.status}
                   onChange={val => updateStatusMod(idx, { status: val })}
                   options={availableStatus}
                   placeholder="Select Status..."
                   showFilters={false}
                   className="flex-1 min-w-0"
                   buttonClass="border-emerald-200 focus:ring-emerald-400"
                 />
                 <button onClick={() => removeStatusMod(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
               </div>
               <div className="flex items-center gap-2 pl-1">
                 <span className="text-xs text-gray-500 font-bold uppercase">Amount:</span>
                 <input type="number" value={mod.amount} onChange={e => updateStatusMod(idx, { amount: parseInt(e.target.value,10)||0 })} className="w-16 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400" />
               </div>
            </div>
          ))}
          <div className="pt-1">
             <button onClick={() => addStatusMod(availableStatus[0]?.id || '')} disabled={availableStatus.length===0} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors w-full justify-center">
                <Plus className="w-3 h-3" /> Add Modifier
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
