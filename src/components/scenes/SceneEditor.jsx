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
    <div className="flex gap-8 items-start relative pb-24 h-full bg-background text-on-surface">
      <div className="flex-1 w-full min-w-0 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">Scene Editor</h2>
            <p className="text-sm text-zinc-400 mt-1">Create narrative beats and define when they appear.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={collapseAll} className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="Collapse All">
               <FoldVertical className="w-5 h-5" />
            </button>
            <button onClick={expandAll} className="p-2 text-zinc-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="Expand All">
               <UnfoldVertical className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddScene}
              className="signature-gradient text-on-primary px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_15px_rgba(0,209,255,0.3)] text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Scene
            </button>
          </div>
        </div>

      {Object.values(scenes).length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-surface-container-low rounded-2xl border border-dashed border-white/10">
          No scenes created yet.<br/> <span className="text-sm mt-2 block">Scenes are narrative chunks that appear when logic conditions are met.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(scenes)
            .sort((a, b) => parseInt(b.id.replace('S', '')) - parseInt(a.id.replace('S', ''))) // newest first
            .map(scene => {
              
            const isExpanded = expandedScenes.has(scene.id);

            return (
            <div key={scene.id} id={scene.id} className={`scroll-mt-8 border ${isExpanded ? 'border-primary/30 shadow-2xl ring-1 ring-primary/20' : 'border-white/5 shadow-lg hover:border-white/10'} rounded-2xl bg-surface-container-high transition-all overflow-hidden`}>
              {/* Accordion Header */}
              <div 
                className={`flex ${isExpanded ? 'bg-primary/5 border-b border-primary/20' : 'bg-transparent'} p-4 items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none`}
                onClick={() => toggleScene(scene.id)}
              >
                <div className="text-zinc-500">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
                
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                  {scene.id}
                </span>

                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <span className={`font-headline text-lg font-bold truncate ${scene.name ? 'text-on-surface' : 'text-zinc-600 italic'}`}>
                    {scene.name || 'Unnamed Scene'}
                  </span>
                  
                  {!isExpanded && (
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                      {scene.chapter && <span className="bg-secondary-container/10 text-secondary-container px-2 py-0.5 rounded border border-secondary-container/20 truncate max-w-[120px]">CH: {chapters[scene.chapter]?.name || scene.chapter}</span>}
                      {scene.path && <span className="bg-tertiary-container/10 text-tertiary-container px-2 py-0.5 rounded border border-tertiary-container/20 truncate max-w-[120px]">PTH: {paths[scene.path]?.name || scene.path}</span>}
                      
                      <span className="bg-surface-container-lowest text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                        OUT: {scene.next?.length || 0}
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
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors border ${entryNode === scene.id ? 'bg-secondary-container/20 text-secondary-container border-secondary-container shadow-[0_0_10px_rgba(171,249,0,0.2)]' : 'bg-surface-container-lowest text-zinc-500 border-white/5 hover:bg-secondary-container/10 hover:text-secondary-container hover:border-secondary-container/30'}`}
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
                    className="p-1.5 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors"
                    title="Delete Scene"
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
                    value={scene.name}
                    onChange={(val) => updateScene(scene.id, { name: val })}
                    className="w-full font-headline font-bold text-on-surface focus:outline-none focus:border-b-2 focus:border-primary bg-transparent pb-1 transition-colors text-xl placeholder-zinc-600"
                    placeholder="Scene Name"
                  />
                  <DebouncedTextarea
                    value={scene.description}
                    onChange={(val) => updateScene(scene.id, { description: val })}
                    className="w-full text-sm text-zinc-300 focus:outline-none bg-black/20 rounded-xl border border-white/5 focus:border-primary focus:ring-1 focus:ring-primary p-4 transition-colors resize-y min-h-[80px] placeholder-zinc-600 leading-relaxed"
                    placeholder="Scene text or description..."
                  />

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 shadow-inner">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Story Chapter</label>
                      <select value={scene.chapter || ''} onChange={(e) => updateScene(scene.id, { chapter: e.target.value || null })} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary">
                          <option value="">No Chapter</option>
                          {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 shadow-inner">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Story Path</label>
                      <select value={scene.path || ''} onChange={(e) => updateScene(scene.id, { path: e.target.value || null })} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary">
                          <option value="">No Path</option>
                          {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Requirements and Routing */}
                <div className="space-y-6 pt-2">
                  <div>
                    <h4 className="font-label text-xs font-bold text-primary uppercase tracking-widest mb-3">Visibility Conditions</h4>
                    <div className="bg-surface-container-low p-5 rounded-xl border border-white/5 shadow-inner">
                      <ConditionEditor
                        conditions={scene.requires || []}
                        onChange={(newReqs) => updateScene(scene.id, { requires: newReqs })}
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                       <div>
                         <h4 className="font-label text-xs font-bold text-secondary-container uppercase tracking-widest">Scene Routing (Out)</h4>
                         <p className="text-[10px] text-zinc-500 font-mono mt-1">* Final route must act as fallback (no conditions).</p>
                       </div>
                       <button
                         onClick={() => updateScene(scene.id, { next: [...(scene.next || []), { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, target: '', requires: [] }] })}
                         className="text-[10px] flex items-center gap-1.5 text-secondary-container hover:text-secondary-fixed font-bold tracking-widest uppercase px-3 py-2 bg-secondary-container/10 border border-secondary-container/20 hover:border-secondary-container hover:bg-secondary-container/20 rounded-lg transition-colors shadow-sm"
                       >
                         <Plus className="w-3 h-3" /> Add Route
                       </button>
                    </div>

                    {(!scene.next || scene.next.length === 0) ? (
                      <div className="text-xs text-center py-6 text-error/80 bg-error/10 rounded-xl border border-error/20 font-mono uppercase tracking-widest shadow-inner">
                        No routes defined. Flow terminates here.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scene.next.map((route, idx) => {
                          const routeKey = route._id || `route-fallback-${idx}`;
                          return (
                          <div key={routeKey} className="border border-white/5 rounded-xl p-5 bg-surface-container-lowest relative group shadow-lg">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  const newNext = scene.next.filter((_, i) => i !== idx);
                                  updateScene(scene.id, { next: newNext });
                                }}
                                className="p-1.5 text-zinc-500 hover:text-error hover:bg-error/10 rounded border border-transparent hover:border-error/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                               {/* Left: Target Destination */}
                               <div className="space-y-2 pr-4 border-r border-white/5">
                                 <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Target Destination</label>
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
                                   buttonClass="border-white/10 bg-black/20 text-on-surface"
                                 />
                               </div>

                               {/* Right: Conditions */}
                               <div className="space-y-2">
                                 <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Route Conditions</label>
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
                          <div className="mt-4 p-4 rounded-xl border border-error/30 bg-error/10 flex gap-3 shadow-[0_0_15px_rgba(255,180,171,0.1)] animate-in fade-in slide-in-from-top-2">
                             <AlertTriangle className="w-5 h-5 shrink-0 text-error" />
                             <div>
                               <p className="font-bold text-xs uppercase tracking-widest text-error">Missing Fallback Route</p>
                               <p className="text-[11px] text-error/80 mt-1 leading-relaxed">The final route has conditions attached. You must provide an unconditional fallback route (with no conditions) to prevent players from getting stuck in a dead end if they don't meet any conditions.</p>
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
