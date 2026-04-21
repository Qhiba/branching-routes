import React, { useState, useEffect } from 'react';
import {
  Play,
  Undo,
  RotateCcw,
  X,
  GitCommit,
  GitPullRequest,
  BoxSelect,
  ChevronDown,
} from 'lucide-react';
import { useNarrativeStore, useSimulationStore, useCampaignStore } from 'store';

/**
 * FloatingMiddleBar — Phase 4 Integration
 *
 * Floating pill bar centred over the canvas (absolute positioned).
 * Renders in two distinct modes:
 *
 *   Edit mode   — Node-type quick-add icons | campaign selector | Start button
 *   Campaign mode — Active campaign indicator | Undo | Reset | Exit
 *
 * Parent (GraphCanvas) must position this using `absolute top-6 left-1/2 -translate-x-1/2 z-40`
 * on a `position: relative` canvas container.
 *
 * Wiring (AR-19 compliant):
 *  campaignMode        ← useSimulationStore(s => s.isCampaignActive)
 *  activeCampaignName  ← useCampaignStore (derived)
 *  campaigns           ← useCampaignStore(s => Object.values(s.campaigns))
 *  selectedCampaignId  ← local useState
 *  onStartCampaign     → campaignStore.setActiveCampaign() + simulationStore.enterCampaign()
 *  onExitCampaign      → simulationStore.exitCampaign()
 *  onUndo              → simulationStore.undoLastNode() (disabled when traversalRecords is empty)
 *  onReset             → simulationStore.reset()
 *  onAddCommonNode     → window.dispatchEvent(canvas-add-node with type: 'common')
 *  onAddChoiceNode     → window.dispatchEvent(canvas-add-node with type: 'choice')
 *  onAddEndingNode     → window.dispatchEvent(canvas-add-node with type: 'ending')
 */
export default function FloatingMiddleBar() {
  // AR-23: Per-slice selectors, never whole-store destructuring
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const traversalRecords = useSimulationStore(s => s.traversalRecords);
  const undoLastNode = useSimulationStore(s => s.undoLastNode);
  const reset = useSimulationStore(s => s.reset);
  const exitCampaign = useSimulationStore(s => s.exitCampaign);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);

  // AR-14: Selectors must return stable references (never create new arrays/objects)
  const campaignDict = useCampaignStore(s => s.campaigns);
  const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);
  const activeCampaignName = useCampaignStore(
    s => s.activeCampaignId && s.campaigns[s.activeCampaignId]?.name ? s.campaigns[s.activeCampaignId].name : ''
  );

  // Derive campaigns array from stable selector (avoid creating new array in selector)
  const campaigns = Object.values(campaignDict);

  // Local state for dropdown selection (not persisted, resets on exit)
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    campaigns.length > 0 ? campaigns[0].id : ''
  );

  // Sync dropdown when campaigns list changes (ensure valid selection)
  useEffect(() => {
    if (campaigns.length > 0) {
      setSelectedCampaignId(prev =>
        campaigns.find(c => c.id === prev) ? prev : campaigns[0].id
      );
    }
  }, [campaigns]);

  // AR-19: Dispatch DOM events for node creation (GraphCanvas owns the listener)
  const handleAddNode = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-add-node', {
      detail: { type }
    }));
  };

  // Campaign lifecycle handlers
  const handleStartCampaign = () => {
    setActiveCampaign(selectedCampaignId);
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    enterCampaign(campaign);
  };

  const handleExitCampaign = () => {
    exitCampaign();
  };

  const handleUndo = () => {
    undoLastNode();
  };

  const handleReset = () => {
    reset();
  };

  // Undo disabled state: AR-14 primitive selector for traversalRecords.length
  const undoDisabled = traversalRecords.length === 0;

  if (isCampaignActive) {
    return (
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/50 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] rounded-full px-2 py-1.5 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
        {/* Active campaign indicator */}
        <div className="flex items-center gap-2 px-3 border-r border-indigo-800/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-bold text-white tracking-wide">{activeCampaignName}</span>
        </div>

        <button
          onClick={handleUndo}
          disabled={undoDisabled}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-100 transition-colors text-xs font-medium"
        >
          <Undo className="w-3.5 h-3.5" /> Undo
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 text-indigo-100 transition-colors text-xs font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>

        <div className="w-px h-4 bg-indigo-800/50 mx-1" />

        <button
          onClick={handleExitCampaign}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors text-xs font-bold"
        >
          <X className="w-3.5 h-3.5" /> Exit
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] rounded-full px-2 py-1.5 flex items-center gap-3">
      {/* Node-type quick-add icons */}
      <div className="flex items-center gap-1 px-1">
        <button
          onClick={() => handleAddNode('common')}
          className="p-1.5 rounded-full hover:bg-slate-800 text-emerald-400 transition-colors"
          title="Add Common Node"
        >
          <GitCommit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAddNode('choice')}
          className="p-1.5 rounded-full hover:bg-slate-800 text-blue-400 transition-colors"
          title="Add Choice Node"
        >
          <GitPullRequest className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAddNode('ending')}
          className="p-1.5 rounded-full hover:bg-slate-800 text-amber-500 transition-colors"
          title="Add Ending Node"
        >
          <BoxSelect className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-700" />

      {/* Campaign selector + Start */}
      <div className="flex items-center gap-2 pr-1">
        <div className="relative">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs rounded-full pl-3 pr-8 py-1.5 outline-none focus:border-indigo-500 transition-colors font-medium w-36 cursor-pointer"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={handleStartCampaign}
          disabled={campaigns.length === 0}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-md shadow-indigo-900/50 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Start
        </button>
      </div>
    </div>
  );
}
