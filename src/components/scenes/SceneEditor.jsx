import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2 } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';

export default function SceneEditor() {
  const { flags, statusPoints, paths, chapters, scenes, choices, addScene, updateScene, deleteScene } = useEditor();

  const handleAddScene = () => {
    addScene("New Scene", "Description here...");
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Scene Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Create narrative beats and define when they appear.</p>
        </div>
        <button
          onClick={handleAddScene}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-5 h-5" />
          Add Scene
        </button>
      </div>

      {Object.values(scenes).length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No scenes created yet.<br/> <span className="text-sm mt-2 block">Scenes are narrative chunks that appear when logic conditions are met.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(scenes)
            .sort((a, b) => parseInt(b.id.replace('S', '')) - parseInt(a.id.replace('S', ''))) // newest first
            .map(scene => {
              
            // Preview evaluation based on current manual flag toggles and status points
            const passesConditions = scene.requires && scene.requires.length > 0 
              ? scene.requires.every(req => {
                  if (req.flag) {
                    const flagObj = flags[req.flag];
                    return flagObj && flagObj.state === req.state;
                  }
                  if (req.status) {
                    const spObj = statusPoints[req.status];
                    if (!spObj) return false;
                    const val = spObj.value;
                    if (req.min !== undefined && val < req.min) return false;
                    if (req.max !== undefined && val > req.max) return false;
                    return true;
                  }
                  return true;
                })
              : true;

            const hasConditions = scene.requires && scene.requires.length > 0;

            return (
            <div key={scene.id} id={scene.id} className={`scroll-mt-8 border ${passesConditions ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : 'border-gray-200 shadow-sm opacity-80'} rounded-xl overflow-hidden bg-white transition-all`}>
              {/* Header */}
              <div className="flex bg-gray-50 border-b border-gray-100 p-4 items-start gap-4">
                <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded mt-1">
                  {scene.id}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={scene.name}
                    onChange={(e) => updateScene(scene.id, { name: e.target.value })}
                    className="w-full font-bold text-gray-800 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 px-1 transition-colors text-lg"
                    placeholder="Scene Name"
                  />
                  <textarea
                    value={scene.description}
                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                    className="w-full text-sm text-gray-600 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 px-1 transition-colors resize-y min-h-[60px]"
                    placeholder="Scene text or description..."
                  />

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Story Chapter</label>
                      <select value={scene.chapter || ''} onChange={(e) => updateScene(scene.id, { chapter: e.target.value || null })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">No Chapter</option>
                          {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Story Path</label>
                      <select value={scene.path || ''} onChange={(e) => updateScene(scene.id, { path: e.target.value || null })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">No Path</option>
                          {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this scene?")) {
                        deleteScene(scene.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {hasConditions && (
                    <span className={`text-xs px-2.5 py-1 rounded font-medium border ${passesConditions ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {passesConditions ? "PREVIEW: Visible" : "PREVIEW: Hidden"}
                    </span>
                  )}
                </div>
              </div>

              {/* Requirements and Routing */}
              <div className="p-5 bg-white space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Visibility Conditions</h4>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <ConditionEditor
                      conditions={scene.requires || []}
                      onChange={(newReqs) => updateScene(scene.id, { requires: newReqs })}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                       <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Scene Routing (Next)</h4>
                       <p className="text-xs text-gray-500 italic mt-1">* Ensure your final route acts as a fallback (no conditions) to avoid dead ends.</p>
                     </div>
                     <button
                       onClick={() => updateScene(scene.id, { next: [...(scene.next || []), { target: '', requires: [] }] })}
                       className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                     >
                       <Plus className="w-4 h-4" /> Add Route
                     </button>
                  </div>

                  {(!scene.next || scene.next.length === 0) ? (
                    <div className="text-sm text-center py-4 text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                      No routes added. Game will stop or loop here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scene.next.map((route, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative group">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                const newNext = scene.next.filter((_, i) => i !== idx);
                                updateScene(scene.id, { next: newNext });
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                             {/* Left: Target Destination */}
                             <div className="bg-white p-3 rounded-lg border border-gray-200">
                               <label className="block text-sm font-semibold text-gray-700 mb-2">Target Destination</label>
                               <select
                                 value={route.target || ''}
                                 onChange={(e) => {
                                    const newNext = [...scene.next];
                                    newNext[idx] = { ...route, target: e.target.value };
                                    updateScene(scene.id, { next: newNext });
                                 }}
                                 className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                               >
                                  <option value="">Select Destination...</option>
                                  <optgroup label="Scenes">
                                    {Object.values(scenes).filter(s => s.id !== scene.id).map(s => (
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

                             {/* Right: Conditions */}
                             <div className="bg-white p-3 rounded-lg border border-gray-200">
                               <ConditionEditor
                                 conditions={route.requires || []}
                                 onChange={(newReqs) => {
                                    const newNext = [...scene.next];
                                    newNext[idx] = { ...route, requires: newReqs };
                                    updateScene(scene.id, { next: newNext });
                                 }}
                               />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
      </div>
      <QuickNav items={Object.values(scenes).sort((a,b) => parseInt(b.id.replace('S','')) - parseInt(a.id.replace('S','')))} title="Scenes" renderLabel={s => s.name || 'Unnamed Scene'} />
    </div>
  );
}
