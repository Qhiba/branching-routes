import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';

export default function ChoiceEditor() {
  const { flags, statusPoints, paths, chapters, choices, scenes, addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice } = useEditor();

  const handleAddChoice = () => {
    addChoice("New branching choice...");
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Choice Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Design the decisions and their outcomes.</p>
        </div>
        <button
          onClick={handleAddChoice}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-5 h-5" />
          Add Choice
        </button>
      </div>

      {Object.values(choices).length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No choices created yet.<br/> <span className="text-sm mt-2 block">A choice is the moment a player makes a decision.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(choices)
            .sort((a, b) => parseInt(b.id.replace('CH', '')) - parseInt(a.id.replace('CH', ''))) // newest first
            .map(choice => (
            <div key={choice.id} id={choice.id} className="scroll-mt-8 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Header */}
              <div className="flex bg-gray-50 border-b border-gray-100 p-4 flex-col gap-2">
                <div className="flex items-start gap-4 w-full">
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded mt-1">
                    {choice.id}
                  </span>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(choice.id, { text: e.target.value })}
                      className="w-full font-semibold text-gray-800 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 px-1 transition-colors text-lg"
                      placeholder="Choice prompt text..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
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
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this choice?")) {
                        deleteChoice(choice.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Choice"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-center justify-between">
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
                    {choice.options.map((opt, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => deleteChoiceOption(choice.id, idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mb-4 pr-10">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Option Label</label>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => updateChoiceOption(choice.id, idx, { ...opt, label: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Yes, I accept..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Requirements and Next */}
                          <div className="space-y-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Next Destination</label>
                              <select
                                value={opt.next || ''}
                                onChange={(e) => updateChoiceOption(choice.id, idx, { ...opt, next: e.target.value || null })}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Current Choice (Loop)</option>
                                <optgroup label="Scenes">
                                  {Object.values(scenes).map(s => (
                                    <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Choices">
                                  {Object.values(choices).map(c => (
                                    <option key={c.id} value={c.id}>{c.id} - {c.text.substring(0, 30)}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <ConditionEditor
                                conditions={opt.requires || []}
                                onChange={(newReqs) => updateChoiceOption(choice.id, idx, { ...opt, requires: newReqs })}
                              />
                            </div>
                          </div>

                          {/* Right: Flags and Status Set */}
                          <div className="space-y-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <FlagsSetEditor
                                flagsSet={opt.flags_set || []}
                                onChange={(newFlagsSet) => updateChoiceOption(choice.id, idx, { ...opt, flags_set: newFlagsSet })}
                                availableFlags={Object.values(flags)}
                              />
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                              <StatusSetEditor
                                statusSet={opt.status_set || []}
                                onChange={(newStatusSet) => updateChoiceOption(choice.id, idx, { ...opt, status_set: newStatusSet })}
                                availableStatus={Object.values(statusPoints)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      <QuickNav items={Object.values(choices).sort((a,b) => parseInt(b.id.replace('CH','')) - parseInt(a.id.replace('CH','')))} title="Choices" renderLabel={c => c.text ? (c.text.length > 25 ? c.text.substring(0, 25) + '...' : c.text) : '...'} />
    </div>
  );
}

function FlagsSetEditor({ flagsSet, onChange, availableFlags }) {
  const handleToggle = (flagId) => {
    if (flagsSet.includes(flagId)) {
      onChange(flagsSet.filter(id => id !== flagId));
    } else {
      onChange([...flagsSet, flagId]);
    }
  };

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
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {availableFlags.map(flag => {
            const isSet = flagsSet.includes(flag.id);
            return (
              <label key={flag.id} className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-md cursor-pointer group">
                <button
                  type="button"
                  onClick={() => handleToggle(flag.id)}
                  className={`flex items-center justify-center w-5 h-5 rounded ${isSet ? 'bg-indigo-600 text-white' : 'border-2 border-gray-300 text-transparent group-hover:border-indigo-400'}`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800 leading-none">{flag.name}</span>
                  <span className="text-xs text-gray-400 font-mono mt-0.5">{flag.id}</span>
                </div>
              </label>
            );
          })}
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
  const updateStatusMod = (idx, amount) => {
    const next = [...statusSet];
    next[idx] = { ...next[idx], amount };
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
            <div key={idx} className="flex items-center gap-2 bg-emerald-50/50 p-2 border border-emerald-100 rounded-lg">
               <select value={mod.status} onChange={e => {
                  const next = [...statusSet];
                  next[idx] = { ...next[idx], status: e.target.value };
                  onChange(next);
               }} className="flex-1 min-w-0 bg-white border border-emerald-200 rounded px-2 py-1 text-xs">
                 {availableStatus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <input type="number" value={mod.amount} onChange={e => updateStatusMod(idx, parseInt(e.target.value,10)||0)} className="w-14 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400" />
               <button onClick={() => removeStatusMod(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
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
