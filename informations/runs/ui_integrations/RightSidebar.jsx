import React, { useState } from 'react';
import {
    Search,
    Pencil,
    Trash2,
    Play,
    Plus,
    X,
    Route,
    ChevronRight,
    Check,
    Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// NameplateTab — vertical tab on the 42px right gutter
// ---------------------------------------------------------------------------

/**
 * NameplateTab
 *
 * A single vertical nameplate tab button on the right gutter.
 *
 * Props:
 *  id       {string}   Tab id: 'Nodes' | 'RouteTracing' | 'CampaignList'
 *  label    {string}   Rotated vertical label text.
 *  isActive {boolean}  Whether this tab panel is expanded.
 *  onClick  {Function} Called with id on click.
 */
function NameplateTab({ id, label, isActive, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-[42px] py-6 border-y border-l rounded-l-lg transition-all flex items-center justify-center shadow-[-2px_0_10px_rgba(0,0,0,0.2)] -mr-px ${isActive
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 z-20 translate-x-px'
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900 hover:-translate-x-1 z-10'
                }`}
        >
            <span
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                className="rotate-180 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap"
            >
                {label}
            </span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// NodesPanel — filterable node list
// ---------------------------------------------------------------------------

function NodesPanel({ nodes, activeNodeTab, onNodeTabChange, onEditNode, onDeleteNode }) {
    const getBorderColor = (type) => {
        switch (type) {
            case 'Choice': return 'border-l-blue-500';
            case 'Ending': return 'border-l-amber-500';
            default: return 'border-l-emerald-500';
        }
    };

    const filtered = nodes.filter((n) => n.type === activeNodeTab);

    return (
        <>
            {/* Tab switcher */}
            <div className="flex w-full bg-slate-950 rounded-md p-1 border border-slate-800">
                {['Common', 'Choice', 'Ending'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onNodeTabChange(tab)}
                        className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${activeNodeTab === tab
                                ? 'bg-slate-800 text-indigo-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder={`Search ${activeNodeTab} nodes...`}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 pl-8 outline-none text-slate-300 text-xs"
                />
            </div>

            {/* Node rows */}
            <div className="flex-1 space-y-2">
                {filtered.map((node) => (
                    <div
                        key={node.id}
                        className={`group p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-md cursor-pointer transition-colors border-l-2 ${getBorderColor(node.type)} flex justify-between items-center`}
                    >
                        <div>
                            <div className="text-xs font-semibold text-slate-200">{node.name}</div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                                {node.type} Node
                            </div>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button
                                onClick={() => onEditNode(node.id)}
                                className="p-1.5 hover:bg-indigo-600 hover:text-white rounded text-slate-400 transition-colors bg-slate-900 shadow-sm"
                                title="Edit"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => onDeleteNode(node.id)}
                                className="p-1.5 hover:bg-red-500 hover:text-white rounded text-slate-400 transition-colors bg-slate-900 shadow-sm"
                                title="Delete"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// ---------------------------------------------------------------------------
// RouteTracingPanel — target node, priorities, run trace, results
// ---------------------------------------------------------------------------

/**
 * Route Tracing Panel.
 *
 * Displays either a configuration form or route results.
 * The `isTracing` loading state is local (UI-only), consistent with AR-03.
 *
 * Props:
 *  onRunTrace    {Function}          Called when the user clicks "Run Trace".
 *                                    Should return a Promise or call onResults.
 *  routeResults  {Array|null}        Results array or null (no results yet).
 *  onClearTrace  {Function}          Clears the results and resets to config view.
 */
function RouteTracingPanel({ onRunTrace, routeResults, onClearTrace }) {
    const [isTracing, setIsTracing] = useState(false);

    const handleRunTrace = async () => {
        setIsTracing(true);
        await onRunTrace();
        setIsTracing(false);
    };

    if (routeResults) {
        return (
            <div className="flex flex-col gap-4 h-full animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClearTrace}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-700"
                >
                    <X className="w-4 h-4" /> Stop Route Tracing
                </button>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Paths Found ({routeResults.length})
                    </h4>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                    {routeResults.map((res) => (
                        <div
                            key={res.id}
                            className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded p-3 cursor-pointer transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                    {res.name}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    {res.steps} steps
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                Start Node
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                                ...
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                                Target
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Target Node */}
            <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                    Target Node
                </label>
                <div className="bg-emerald-500/10 border border-emerald-500/30 border-l-4 border-l-emerald-500 p-2.5 rounded text-sm text-slate-200 cursor-pointer hover:bg-emerald-500/20 transition-colors">
                    <div className="font-bold">Crystal Chamber</div>
                    <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider mt-0.5">
                        Chapter 2 • Ending Node
                    </div>
                </div>
            </div>

            {/* Tie-Breaking Priorities */}
            <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                    Tie-Breaking Priorities{' '}
                    <span className="normal-case opacity-60 font-medium">(Optional)</span>
                </label>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">
                            FLAG
                        </span>
                        <select className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                            <option>has_lantern</option>
                        </select>
                        <select className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                            <option>True</option>
                            <option>False</option>
                        </select>
                        <button className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs py-1.5 rounded transition-colors border border-dashed border-slate-600 mt-1">
                        <Plus className="w-3 h-3" /> Add Priority
                    </button>
                </div>
            </div>

            {/* Path Cap */}
            <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                    Path Cap <span className="normal-case opacity-60 font-medium">(Max 50)</span>
                </label>
                <input
                    type="number"
                    defaultValue={5}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-3 py-2 outline-none text-slate-300 text-xs shadow-inner"
                />
            </div>

            <button
                onClick={handleRunTrace}
                disabled={isTracing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-xs py-2.5 rounded-md transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 active:scale-95"
            >
                {isTracing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
                {isTracing ? 'Tracing Routes...' : 'Run Trace'}
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// CampaignListPanel — CRUD for named campaigns
// ---------------------------------------------------------------------------

function CampaignListPanel({ campaigns, onAddCampaign, onEditCampaignName, onDeleteCampaign }) {
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        onAddCampaign(newName.trim());
        setNewName('');
    };

    return (
        <div className="flex flex-col gap-5 h-full">
            {/* Context header */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-md p-3">
                <h4 className="text-xs font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-current" /> Campaign Scenarios
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    Create discrete starting points and test distinct branches of your narrative simulation.
                </p>
            </div>

            {/* Create new */}
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Name new campaign..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-2 pl-3 pr-10 outline-none text-slate-200 text-xs transition-colors shadow-inner"
                />
                <button
                    onClick={handleAdd}
                    className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="h-px w-full bg-slate-800/60" />

            {/* Campaign rows */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Available Campaigns
                </span>
                {campaigns.map((camp) => (
                    <div
                        key={camp.id}
                        className="group flex flex-col bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-md transition-all overflow-hidden shadow-sm"
                    >
                        <div className="flex items-center justify-between p-3 cursor-pointer">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-colors" />
                                <span className="font-semibold text-slate-200 text-xs">{camp.name}</span>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <button
                                    onClick={() => onEditCampaignName(camp.id)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                                    title="Edit Name"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onDeleteCampaign(camp.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// RightSidebar — public API
// ---------------------------------------------------------------------------

/**
 * RightSidebar
 *
 * Right-side panel with three nameplate tabs:
 *   Nodes — filterable node list with edit/delete
 *   Route Tracing — target configuration + run + results
 *   Campaign List — campaign CRUD
 *
 * The entire sidebar dims and becomes non-interactive during campaign mode.
 *
 * Props:
 *  activePanel      {string|null}  Currently open panel id, or null.
 *  onPanelChange    {Function}     Called with new panel id (or null to collapse).
 *  campaignMode     {boolean}      Dims sidebar when true.
 *  --- Nodes tab ---
 *  nodes            {Array}        [{ id, name, type: 'Common'|'Choice'|'Ending' }]
 *  activeNodeTab    {string}       'Common' | 'Choice' | 'Ending'
 *  onNodeTabChange  {Function}     Called with the new tab string.
 *  onEditNode       {Function}     Called with nodeId — opens NodeConfigModal.
 *  onDeleteNode     {Function}     Called with nodeId — with guard check.
 *  --- RouteTracing tab ---
 *  routeResults     {Array|null}   Route results or null.
 *  onRunTrace       {Function}     Async function that resolves when trace finishes.
 *  onClearTrace     {Function}     Clears results back to config view.
 *  --- CampaignList tab ---
 *  campaigns        {Array}        [{ id, name }]
 *  onAddCampaign    {Function}     Called with name string.
 *  onDeleteCampaign {Function}     Called with campaign id.
 *  onEditCampaignName {Function}   Called with campaign id.
 *
 * Real-app wiring:
 *  activePanel      ← local useState or uiStore field
 *  campaignMode     ← useSimulationStore(s => s.isCampaignActive)
 *  nodes            ← derived from useNarrativeStore common/choice/ending sub-collections
 *  activeNodeTab    ← local useState
 *  onEditNode       → uiStore.selectNode(id) + open NodeConfigModal
 *  onDeleteNode     → narrativeStore.deleteNode(id) with referential guard
 *  routeResults     ← useSimulationStore(s => s.shortestRouteResults)
 *  onRunTrace       → simulationStore.computeRoutes() / setShortestRouteResults()
 *  onClearTrace     → simulationStore.clearRouteResults()
 *  campaigns        ← useCampaignStore(s => Object.values(s.campaigns))
 *  onAddCampaign    → campaignStore.addCampaign(name)
 *  onDeleteCampaign → campaignStore.deleteCampaign(id)
 *  onEditCampaignName → open rename modal + campaignStore.updateCampaign(id, { name })
 */
export default function RightSidebar({
    activePanel = null,
    onPanelChange = () => { },
    campaignMode = false,
    // Nodes
    nodes = [],
    activeNodeTab = 'Common',
    onNodeTabChange = () => { },
    onEditNode = () => { },
    onDeleteNode = () => { },
    // RouteTracing
    routeResults = null,
    onRunTrace = async () => { },
    onClearTrace = () => { },
    // CampaignList
    campaigns = [],
    onAddCampaign = () => { },
    onDeleteCampaign = () => { },
    onEditCampaignName = () => { },
}) {
    const handleTabClick = (id) => {
        onPanelChange(activePanel === id ? null : id);
    };

    const TABS = [
        { id: 'Nodes', label: 'Nodes' },
        { id: 'RouteTracing', label: 'Route Tracing' },
        { id: 'CampaignList', label: 'Campaign List' },
    ];

    return (
        <div className={`h-full flex z-20 ${campaignMode ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''}`}>

            {/* Sliding content panel */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden flex shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)] ${activePanel ? 'w-[320px] opacity-100' : 'w-0 opacity-0'
                    }`}
            >
                <div className="w-[320px] shrink-0 bg-slate-900 border-l border-slate-800 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                        {activePanel === 'Nodes' && (
                            <NodesPanel
                                nodes={nodes}
                                activeNodeTab={activeNodeTab}
                                onNodeTabChange={onNodeTabChange}
                                onEditNode={onEditNode}
                                onDeleteNode={onDeleteNode}
                            />
                        )}

                        {activePanel === 'RouteTracing' && (
                            <RouteTracingPanel
                                onRunTrace={onRunTrace}
                                routeResults={routeResults}
                                onClearTrace={onClearTrace}
                            />
                        )}

                        {activePanel === 'CampaignList' && (
                            <CampaignListPanel
                                campaigns={campaigns}
                                onAddCampaign={onAddCampaign}
                                onEditCampaignName={onEditCampaignName}
                                onDeleteCampaign={onDeleteCampaign}
                            />
                        )}

                    </div>
                </div>
            </div>

            {/* Gutter — nameplate tabs */}
            <div className="w-[42px] bg-[#070A11] border-l border-slate-800/50 flex flex-col py-6 gap-2 shrink-0 h-full">
                {TABS.map((tab) => (
                    <NameplateTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        isActive={activePanel === tab.id}
                        onClick={handleTabClick}
                    />
                ))}
            </div>

        </div>
    );
}
