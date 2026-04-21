import React from 'react';
import {
    Play,
    Undo,
    RotateCcw,
    X,
    GitCommit,
    GitPullRequest,
    BoxSelect,
    ChevronDown,
    Zap,
} from 'lucide-react';

/**
 * FloatingMiddleBar
 *
 * A floating pill bar horizontally centred over the canvas (absolute positioned).
 * Renders in two distinct modes:
 *
 *   Edit mode   — Node-type quick-add icons | campaign selector | Start button
 *   Campaign mode — Active campaign indicator | Undo | Reset | Exit
 *
 * The parent component must position this using `absolute top-6 left-1/2 -translate-x-1/2`
 * or similar on a `relative` canvas container.
 *
 * Props:
 *  campaignMode        {boolean}   True when a campaign is running.
 *  activeCampaignName  {string}    Name of the currently running campaign.
 *  campaigns           {Array}     Array of { id: string, name: string }.
 *  selectedCampaignId  {string}    Currently selected campaign ID (edit mode).
 *  onCampaignSelect    {Function}  Called with campaign ID when dropdown changes.
 *  onStartCampaign     {Function}  Enters campaign mode with the selected campaign.
 *  onExitCampaign      {Function}  Exits campaign mode (clears simulation state).
 *  onUndo              {Function}  Undoes the last node advance (campaign only).
 *  onReset             {Function}  Resets the campaign to the start node.
 *  onAddCommonNode     {Function}  Adds a Common node at viewport centre.
 *  onAddChoiceNode     {Function}  Adds a Choice node at viewport centre.
 *  onAddEndingNode     {Function}  Adds an Ending node at viewport centre.
 *
 * Real-app wiring:
 *  campaignMode        ← useSimulationStore(s => s.isCampaignActive)
 *  activeCampaignName  ← derived: useCampaignStore(s => s.campaigns[s.activeCampaignId]?.name)
 *  campaigns           ← useCampaignStore(s => Object.values(s.campaigns))
 *  selectedCampaignId  ← local useState in CampaignSelector.jsx (already handled)
 *  onStartCampaign     → campaignStore.setActiveCampaign() + simulationStore.enterCampaign()
 *  onExitCampaign      → simulationStore.exitCampaign()
 *  onUndo              → simulationStore.undoLastNode()
 *  onReset             → simulationStore.reset()
 *  onAddCommonNode     → window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'common' } }))
 *  onAddChoiceNode     → window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'choice' } }))
 *  onAddEndingNode     → window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type: 'ending' } }))
 *
 * Note: Node-add dispatches must use the canvas DOM event pattern (AR-19) because this
 * component renders outside the ReactFlowProvider subtree.
 */
export default function FloatingMiddleBar({
    campaignMode = false,
    activeCampaignName = '',
    campaigns = [],
    selectedCampaignId = '',
    onCampaignSelect = () => { },
    onStartCampaign = () => { },
    onExitCampaign = () => { },
    onUndo = () => { },
    onReset = () => { },
    onAddCommonNode = () => { },
    onAddChoiceNode = () => { },
    onAddEndingNode = () => { },
}) {
    if (campaignMode) {
        return (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/50 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] rounded-full px-2 py-1.5 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                {/* Active campaign indicator */}
                <div className="flex items-center gap-2 px-3 border-r border-indigo-800/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs font-bold text-white tracking-wide">{activeCampaignName}</span>
                </div>

                <button
                    onClick={onUndo}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 text-indigo-100 transition-colors text-xs font-medium"
                >
                    <Undo className="w-3.5 h-3.5" /> Undo
                </button>

                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 text-indigo-100 transition-colors text-xs font-medium"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                <div className="w-px h-4 bg-indigo-800/50 mx-1" />

                <button
                    onClick={onExitCampaign}
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
                    onClick={onAddCommonNode}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-emerald-400 transition-colors"
                    title="Add Common Node"
                >
                    <GitCommit className="w-4 h-4" />
                </button>
                <button
                    onClick={onAddChoiceNode}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-blue-400 transition-colors"
                    title="Add Choice Node"
                >
                    <GitPullRequest className="w-4 h-4" />
                </button>
                <button
                    onClick={onAddEndingNode}
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
                        onChange={(e) => onCampaignSelect(e.target.value)}
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
                    onClick={onStartCampaign}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-md shadow-indigo-900/50 transition-all active:scale-95"
                >
                    <Play className="w-3.5 h-3.5 fill-current" /> Start
                </button>
            </div>
        </div>
    );
}
