import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical, AlertTriangle } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';
import SearchableDropdown from '../shared/SearchableDropdown';
import DebouncedInput from '../shared/DebouncedInput';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function SceneEditor() {
  const { flags, statusPoints, paths, chapters, scenes, choices, endings, entryNode, setEntryNode, addScene, updateScene, deleteScene } = useEditor();
  const [expandedScenes, setExpandedScenes] = useState(new Set());

  const toggleScene = (id) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedScenes(new Set(Object.keys(scenes)));
  const collapseAll = () => setExpandedScenes(new Set());

  // Memoize dropdown options to avoid reconstructing on every render (#8)
  const routeOptions = useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const handleAddScene = () => {
    addScene("", "");
  };

  return (
    <div className="flex gap-8 items-start relative pb-24 h-full">
      <div className="flex-1 w-full min-w-0 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 h-fit">
        <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Scene Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Create narrative beats and define when they appear.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={collapseAll} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Collapse All">
             <FoldVertical className="w-5 h-5" />
          </button>
          <button onClick={expandAll} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Expand All">
             <UnfoldVertical className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddScene}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            Add Scene
          </button>
        </div>
      </div>

      {Object.values(scenes).length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No scenes created yet.<br/> <span className="text-sm mt-2 block">Scenes are narrative chunks that appear when logic conditions are met.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(scenes)
            .sort((a, b) => parseInt(b.id.replace('S', '')) - parseInt(a.id.replace('S', ''))) // newest first
            .map(scene => {
              
            const isExpanded = expandedScenes.has(scene.id);

            return (
            <div key={scene.id} id={scene.id} className={`scroll-mt-8 border ${isExpanded ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100' : 'border-gray-200 shadow-sm hover:border-gray-300'} rounded-xl bg-white transition-all`}>
              {/* Accordion Header */}
              <div 
                className={`flex ${isExpanded ? 'bg-indigo-50/50 border-b border-indigo-100 rounded-t-xl' : 'bg-gray-50 rounded-xl'} p-3 sm:p-4 items-center gap-3 sm:gap-4 cursor-pointer hover:bg-gray-100 transition-colors select-none`}
                onClick={() => toggleScene(scene.id)}
              >
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
                
                <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                  {scene.id}
                </span>

                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <span className={`font-bold truncate text-base ${scene.name ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                    {scene.name || 'Unnamed Scene'}
                  </span>
                  
                  {!isExpanded && (
                    <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs">
                      {scene.chapter && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[120px]">Ch: {chapters[scene.chapter]?.name || scene.chapter}</span>}
                      {scene.path && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 truncate max-w-[120px]">Path: {paths[scene.path]?.name || scene.path}</span>}
                      
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                        Routes: {scene.next?.length || 0}
                      </span>
                      
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEntryNode(scene.id);
                    }}
                    className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors border ${entryNode === scene.id ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm'}`}
                    title={entryNode === scene.id ? "Current Entry Node" : "Set as Entry Point"}
                  >
                    {entryNode === scene.id ? 'Entry Node' : 'Set Entry Point'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this scene?")) {
                        deleteScene(scene.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Scene"
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
                    value={scene.name}
                    onChange={(val) => updateScene(scene.id, { name: val })}
                    className="w-full font-bold text-gray-800 focus:outline-none focus:border-b-2 focus:border-indigo-500 bg-transparent py-1 px-1 transition-colors text-lg"
                    placeholder="Scene Name"
                  />
                  <DebouncedTextarea
                    value={scene.description}
                    onChange={(val) => updateScene(scene.id, { description: val })}
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

                {/* Requirements and Routing */}
                <div className="space-y-5">
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
                         onClick={() => updateScene(scene.id, { next: [...(scene.next || []), { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, target: '', requires: [] }] })}
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
                        {scene.next.map((route, idx) => {
                          const routeKey = route._id || `route-fallback-${idx}`;
                          return (
                          <div key={routeKey} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative group">
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
                                 <SearchableDropdown
                                   value={route.target || null}
                                   onChange={(val) => {
                                      const newNext = [...scene.next];
                                      newNext[idx] = { ...route, target: val || '' };
                                      updateScene(scene.id, { next: newNext });
                                   }}
                                   options={routeOptions.filter(o => o.id !== scene.id)}
                                   placeholder="Select Destination..."
                                   showFilters={true}
                                 />
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
                          );
                        })}
                        {scene.next.length > 0 && scene.next[scene.next.length - 1].requires && scene.next[scene.next.length - 1].requires.length > 0 && (
                          <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-3 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                             <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                             <div>
                               <p className="font-bold text-sm">Missing Fallback Route</p>
                               <p className="text-xs mt-0.5 opacity-90">The final route has conditions attached. You must provide an unconditional fallback route (with no conditions) to prevent players from getting stuck in a dead end if they don't meet any conditions.</p>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          )})}
        </div>
      )}
      </div>
      <QuickNav items={Object.values(scenes).sort((a,b) => parseInt(b.id.replace('S','')) - parseInt(a.id.replace('S','')))} title="Scenes" renderLabel={s => s.name || 'Unnamed Scene'} />
    </div>
  );
}
