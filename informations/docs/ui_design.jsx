import React, { useState } from 'react';
import {
    Play,
    Settings,
    Save,
    Download,
    Upload,
    LayoutGrid,
    Network,
    Wand2,
    BoxSelect,
    Plus,
    GitCommit,
    GitPullRequest,
    Flag,
    Activity,
    FolderTree,
    BookOpen,
    Route,
    Menu,
    X,
    FilePlus,
    RotateCcw,
    Undo,
    Zap,
    ChevronRight,
    Trash2,
    Search,
    Pencil,
    TerminalSquare,
    ChevronDown,
    ChevronUp,
    Settings2,
    AlignLeft,
    SlidersHorizontal,
    Check,
    Loader2
} from 'lucide-react';

export default function AppShell() {
    const [projectName, setProjectName] = useState('The Enchanted Forest');

    // Modal States
    const [activeModal, setActiveModal] = useState(null); // 'Flags', 'Status', 'Chapter', 'Paths'
    const [activeNodeConfig, setActiveNodeConfig] = useState(null); // 'Common', 'Choice', 'Ending', or null
    const [flagState, setFlagState] = useState(true);

    // Sidebar States
    const [activeLeftPanel, setActiveLeftPanel] = useState('Flags');
    const [activeRightPanel, setActiveRightPanel] = useState('Nodes');
    const [activeNodeTab, setActiveNodeTab] = useState('Common');

    // Campaign State Simulation
    const [campaignMode, setCampaignMode] = useState(false);
    const [campaigns, setCampaigns] = useState([
        { id: '1', name: 'Default' },
        { id: '2', name: 'test 1' },
        { id: '3', name: 'test 2' }
    ]);
    const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
    const [activeCampaignId, setActiveCampaignId] = useState(null);

    const activeCampaignName = campaigns.find(c => c.id === activeCampaignId)?.name || '';

    const handleStartCampaign = () => {
        setActiveCampaignId(selectedCampaignId);
        setCampaignMode(true);
        setActiveRightPanel(null);
    };

    const handleExitCampaign = () => {
        setCampaignMode(false);
        setActiveCampaignId(null);
    };

    // --- TOP TIER 1: Primary Header ---
    const PrimaryTopBar = () => (
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-6 text-slate-300 text-sm z-40 shrink-0 w-full overflow-x-auto shadow-md" style={{ scrollbarWidth: 'none' }}>
            <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wide shrink-0">
                <Network className="w-5 h-5" />
                <span>Branching Routes</span>
            </div>
            <div className="h-6 w-px bg-slate-800 shrink-0"></div>
            <div className="shrink-0">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-slate-950/50 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/50 focus:border-indigo-500 rounded px-3 py-1.5 outline-none text-slate-200 transition-colors w-48 font-medium"
                />
            </div>
            <div className="h-6 w-px bg-slate-800 shrink-0"></div>
            <div className="flex items-center bg-slate-950 rounded-md p-1 border border-slate-800 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Tidy Layout</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 text-slate-200 transition-colors text-xs font-medium shadow-sm">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Snap: ON</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium">
                    <BoxSelect className="w-3.5 h-3.5" />
                    <span>Clusters: OFF</span>
                </button>
            </div>
            <div className="h-6 w-px bg-slate-800 shrink-0"></div>
            <div className="flex items-center gap-1 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700">
                    <FilePlus className="w-3.5 h-3.5" /> New
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700">
                    <Upload className="w-3.5 h-3.5" /> Import
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700">
                    <Download className="w-3.5 h-3.5" /> Export
                </button>
            </div>
        </div>
    );

    // --- FLOATING MIDDLE BAR ---
    const FloatingMiddleBar = () => {
        if (campaignMode) {
            return (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/50 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] rounded-full px-2 py-1.5 flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 px-3 border-r border-indigo-800/50">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <span className="text-xs font-bold text-white tracking-wide">{activeCampaignName}</span>
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 text-indigo-100 transition-colors text-xs font-medium">
                        <Undo className="w-3.5 h-3.5" /> Undo
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-indigo-900/80 text-indigo-100 transition-colors text-xs font-medium">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <div className="w-px h-4 bg-indigo-800/50 mx-1"></div>
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
                <div className="flex items-center gap-1 px-1">
                    <button onClick={() => setActiveNodeConfig('Common')} className="p-1.5 rounded-full hover:bg-slate-800 text-emerald-400 transition-colors group relative" title="Common Node">
                        <GitCommit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveNodeConfig('Choice')} className="p-1.5 rounded-full hover:bg-slate-800 text-blue-400 transition-colors group relative" title="Choice Node">
                        <GitPullRequest className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveNodeConfig('Ending')} className="p-1.5 rounded-full hover:bg-slate-800 text-amber-500 transition-colors group relative" title="Ending Node">
                        <BoxSelect className="w-4 h-4" />
                    </button>
                </div>
                <div className="w-px h-5 bg-slate-700"></div>
                <div className="flex items-center gap-2 pr-1">
                    <div className="relative">
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs rounded-full pl-3 pr-8 py-1.5 outline-none focus:border-indigo-500 transition-colors font-medium w-36 cursor-pointer"
                        >
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                        onClick={handleStartCampaign}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-md shadow-indigo-900/50 transition-all active:scale-95"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start
                    </button>
                </div>
            </div>
        );
    };

    // --- NEW: ADVANCED NODE CONFIGURATION MODAL ---
    const NodeConfigModal = () => {
        if (!activeNodeConfig) return null;

        const isEnding = activeNodeConfig === 'Ending';
        const isChoice = activeNodeConfig === 'Choice';
        const isCommon = activeNodeConfig === 'Common';

        // Local UI states for the mockup
        const [isStartNode, setIsStartNode] = useState(false);
        const [logicMode, setLogicMode] = useState('AND'); // AND / OR

        // Dynamic coloring based on node type
        const themeColor = isChoice ? 'text-blue-400' : isEnding ? 'text-amber-500' : 'text-emerald-400';
        const themeBg = isChoice ? 'bg-blue-500/10 border-blue-500/20' : isEnding ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

        // Components
        const SectionTitle = ({ icon: Icon, title }) => (
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h4>
            </div>
        );

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 p-6">
                {/* Dynamic Modal Container: Narrow for Ending, Wide 2-Column for others */}
                <div className={`bg-slate-900 border border-slate-700 shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-all max-h-full ${isEnding ? 'w-[420px]' : 'w-[860px]'}`}>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${themeBg} ${themeColor}`}>
                                {activeNodeConfig} Node
                            </div>
                            <h3 className="text-sm font-bold text-slate-200">Configure Node</h3>
                        </div>
                        <button onClick={() => setActiveNodeConfig(null)} className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-800 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden min-h-[400px]">

                        {/* LEFT COLUMN: Narrative & Routing */}
                        <div className={`p-6 flex flex-col gap-5 overflow-y-auto ${isEnding ? 'w-full' : 'w-1/2 border-r border-slate-800'} custom-scrollbar`}>
                            <SectionTitle icon={AlignLeft} title="Narrative Content" />

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Node Label</label>
                                <input
                                    type="text"
                                    defaultValue={isChoice ? "Crossroads" : "Forest Entrance"}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner"
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Description / Text</label>
                                <textarea
                                    defaultValue={isChoice ? "The path splits ahead. You can hear distant sounds in both directions." : "You stand at the edge of a dense forest..."}
                                    className="w-full flex-1 min-h-[120px] bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner resize-none leading-relaxed"
                                />
                            </div>

                            <SectionTitle icon={Route} title="Routing & Placement" />

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Chapter</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md pl-3 pr-8 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner cursor-pointer">
                                            <option>None</option>
                                            <option>Chapter 1</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Path</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md pl-3 pr-8 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner cursor-pointer">
                                            <option>None</option>
                                            <option>Main Story</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Toggle Switch for Start Node */}
                            <div className="bg-slate-950 border border-slate-800 rounded-md p-3 flex items-center justify-between mt-2">
                                <div>
                                    <div className="text-sm font-semibold text-slate-200">Set as Start Node</div>
                                    <div className="text-[10px] text-slate-500">Campaigns begin execution here.</div>
                                </div>
                                <button
                                    onClick={() => setIsStartNode(!isStartNode)}
                                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${isStartNode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${isStartNode ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Logic & Effects (Hidden for Endings) */}
                        {!isEnding && (
                            <div className="w-1/2 bg-[#0B0F19] p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                                {/* Global Entry Effects */}
                                <div>
                                    <SectionTitle icon={Zap} title="On-Enter Modifiers" />
                                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-3 shadow-sm">
                                        {/* Set Flags */}
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Set Flags (True)</label>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                                                    has_lantern <button className="hover:text-white"><X className="w-3 h-3" /></button>
                                                </span>
                                                <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded transition-colors border border-dashed border-slate-600">
                                                    <Plus className="w-3 h-3" /> Add Flag
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-slate-800/60"></div>

                                        {/* Status Modifiers */}
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Status Modifiers</label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <select className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none">
                                                        <option>courage</option>
                                                    </select>
                                                    <select className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none">
                                                        <option>+=</option>
                                                        <option>-=</option>
                                                        <option>=</option>
                                                    </select>
                                                    <input type="number" defaultValue={1} className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none font-mono text-center" />
                                                    <button className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <button className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs py-1.5 rounded transition-colors border border-dashed border-slate-600 mt-1">
                                                    <Plus className="w-3 h-3" /> Add Status Modifier
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Variants (Common) or Options (Choice) */}
                                <div>
                                    <SectionTitle icon={SlidersHorizontal} title={isChoice ? "Branching Options" : "Narrative Variants"} />

                                    <div className="flex flex-col gap-3">
                                        {/* Active Card Example */}
                                        <div className="bg-slate-900 border border-indigo-500/30 rounded-lg overflow-hidden shadow-md">
                                            {/* Card Header */}
                                            <div className="bg-slate-800/50 px-3 py-2 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-200">{isChoice ? "Option 1" : "Variant 1"}</span>
                                                </div>
                                                <button className="text-slate-500 hover:text-red-400 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-3 flex flex-col gap-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder={isChoice ? "Option text (e.g., 'Open the door')" : "Internal variant name"}
                                                        defaultValue={isChoice ? "Head north to the glow" : "Has Lantern Variant"}
                                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-1.5 outline-none text-slate-300 text-xs shadow-inner"
                                                    />
                                                </div>

                                                {/* Conditions Builder inside Card */}
                                                <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-500">Requires Condition</span>

                                                        {/* Segmented Control for AND/OR */}
                                                        <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5 relative text-[10px] font-bold w-24">
                                                            <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-slate-700 rounded-sm transition-all duration-200 ease-out ${logicMode === 'AND' ? 'left-0.5' : 'left-[calc(50%+1px)]'}`}></div>
                                                            <button onClick={() => setLogicMode('AND')} className={`flex-1 py-0.5 z-10 transition-colors ${logicMode === 'AND' ? 'text-white' : 'text-slate-500'}`}>AND</button>
                                                            <button onClick={() => setLogicMode('OR')} className={`flex-1 py-0.5 z-10 transition-colors ${logicMode === 'OR' ? 'text-white' : 'text-slate-500'}`}>OR</button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded text-xs">
                                                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">FLAG</span>
                                                            <span className="text-slate-300 flex-1">has_lantern</span>
                                                            <span className="text-emerald-400 font-bold px-2 text-[10px]">TRUE</span>
                                                            <button className="text-slate-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            <button className="flex-1 py-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">+ Flag Clause</button>
                                                            <button className="flex-1 py-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">+ Status Clause</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Choice Options also have Modifiers on selection */}
                                                {isChoice && (
                                                    <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                                                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">On-Select Modifiers</span>
                                                        <button className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">
                                                            + Add Specific Modifier
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add New Button */}
                                        <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm font-semibold transition-colors shadow-sm">
                                            <Plus className="w-4 h-4" /> Add {isChoice ? "Option" : "Variant"}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={() => setActiveNodeConfig(null)}
                            className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setActiveNodeConfig(null)}
                            className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Save Node
                        </button>
                    </div>

                </div>
            </div>
        );
    };

    // --- MINOR ENTITY CREATION MODAL (Flags, Status, etc) ---
    const CreationModal = () => {
        if (!activeModal) return null;
        const isFlag = activeModal === 'Flags';
        const isStatus = activeModal === 'Status';
        const entityName = activeModal.replace(/s$/, '');

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl w-[360px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200">New {entityName}</h3>
                        <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-5 flex flex-col gap-5">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Name</label>
                            <input type="text" placeholder={`Enter ${entityName.toLowerCase()} name...`} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner" autoFocus />
                        </div>
                        {isFlag && (
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Initial State</label>
                                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 relative">
                                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-md transition-all duration-200 ease-out ${flagState ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                                    <button onClick={() => setFlagState(true)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md z-10 transition-colors ${flagState ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>True</button>
                                    <button onClick={() => setFlagState(false)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md z-10 transition-colors ${!flagState ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>False</button>
                                </div>
                            </div>
                        )}
                        {isStatus && (
                            <>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Initial Value</label>
                                    <input type="number" defaultValue={0} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono" />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Min <span className="normal-case font-medium opacity-60">(Optional)</span></label>
                                        <input type="number" placeholder="None" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono placeholder:font-sans" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Max <span className="normal-case font-medium opacity-60">(Optional)</span></label>
                                        <input type="number" placeholder="None" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono placeholder:font-sans" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                        <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors">Cancel</button>
                        <button onClick={() => setActiveModal(null)} className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md shadow-indigo-900/20 transition-all active:scale-95">Confirm</button>
                    </div>
                </div>
            </div>
        );
    };

    // --- LEFT SIDEBAR: Data Management ---
    const EntityListView = ({ type, items, icon: Icon, iconColor }) => (
        <div className="p-4 flex flex-col h-full gap-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder={`Search ${type.toLowerCase()}...`} className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1.5 pl-8 outline-none text-slate-300 text-xs transition-colors" />
                </div>
                <button onClick={() => setActiveModal(type)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors shadow-md shrink-0" title={`Create new ${type}`}>
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {items.map(item => (
                    <div key={item.id} className="group flex items-center justify-between bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded p-2 transition-all text-xs cursor-pointer">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                            <span className="font-medium text-slate-300 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:text-red-400 text-slate-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const LeftNameplateTab = ({ id, label }) => {
        const isActive = activeLeftPanel === id;
        return (
            <button onClick={() => setActiveLeftPanel(isActive ? null : id)} className={`w-[42px] py-6 border-y border-r rounded-r-lg transition-all flex items-center justify-center shadow-[2px_0_10px_rgba(0,0,0,0.2)] -ml-px ${isActive ? 'bg-slate-900 border-slate-800 text-indigo-400 z-20 -translate-x-px' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900 hover:translate-x-1 z-10'}`}>
                <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="rotate-180 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">{label}</span>
            </button>
        );
    };

    const LeftSidebarPanel = () => {
        const mockData = {
            Flags: [{ id: 1, name: 'has_lantern' }, { id: 2, name: 'met_wizard' }, { id: 3, name: 'door_unlocked' }],
            Status: [{ id: 1, name: 'Health' }, { id: 2, name: 'Mana' }, { id: 3, name: 'Gold' }],
            Chapter: [{ id: 1, name: 'Chapter 1: The Ruins' }, { id: 2, name: 'Chapter 2: Deep Woods' }],
            Paths: [{ id: 1, name: 'True Ending Route' }, { id: 2, name: 'Bad Ending Route' }]
        };

        return (
            <div className={`h-full flex z-20 ${campaignMode ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''}`}>
                <div className="w-[42px] bg-[#070A11] border-r border-slate-800/50 flex flex-col py-6 gap-2 shrink-0 h-full">
                    <LeftNameplateTab id="Flags" label="Flags" />
                    <LeftNameplateTab id="Status" label="Status" />
                    <LeftNameplateTab id="Chapter" label="Chapter" />
                    <LeftNameplateTab id="Paths" label="Paths" />
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden flex shadow-[10px_0_20px_-10px_rgba(0,0,0,0.5)] ${activeLeftPanel ? 'w-[320px] opacity-100' : 'w-0 opacity-0'}`}>
                    <div className="w-[320px] shrink-0 bg-slate-900 border-r border-slate-800 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto flex flex-col">
                            {activeLeftPanel === 'Flags' && <EntityListView type="Flags" items={mockData.Flags} icon={Flag} iconColor="text-purple-400" />}
                            {activeLeftPanel === 'Status' && <EntityListView type="Status" items={mockData.Status} icon={Activity} iconColor="text-rose-400" />}
                            {activeLeftPanel === 'Chapter' && <EntityListView type="Chapter" items={mockData.Chapter} icon={BookOpen} iconColor="text-indigo-400" />}
                            {activeLeftPanel === 'Paths' && <EntityListView type="Paths" items={mockData.Paths} icon={FolderTree} iconColor="text-cyan-400" />}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- RIGHT SIDEBAR: Nameplate System ---
    const NameplateTab = ({ id, label }) => {
        const isActive = activeRightPanel === id;
        return (
            <button onClick={() => setActiveRightPanel(isActive ? null : id)} className={`w-[42px] py-6 border-y border-l rounded-l-lg transition-all flex items-center justify-center shadow-[-2px_0_10px_rgba(0,0,0,0.2)] -mr-px ${isActive ? 'bg-slate-900 border-slate-800 text-indigo-400 z-20 translate-x-px' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900 hover:-translate-x-1 z-10'}`}>
                <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="rotate-180 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">{label}</span>
            </button>
        );
    };

    const RightSidebarPanel = () => {
        const mockNodes = [
            { id: 1, name: 'Forest Entrance', type: 'Common' },
            { id: 2, name: 'Crossroads', type: 'Choice' },
            { id: 3, name: 'Crystal Chamber', type: 'Ending' }
        ];

        // Added states for Route Tracing Panel
        const [isTracing, setIsTracing] = useState(false);
        const [routeResults, setRouteResults] = useState(null);

        const handleRunTrace = () => {
            setIsTracing(true);
            setRouteResults(null);
            // Simulate route calculation
            setTimeout(() => {
                setIsTracing(false);
                setRouteResults([
                    { id: 1, steps: 5, name: 'Optimal Path (Direct)' },
                    { id: 2, steps: 8, name: 'Alternate Route (Safe)' },
                    { id: 3, steps: 12, name: 'Exploration Route' }
                ]);
            }, 1200);
        };

        const getBorderColor = (type) => {
            switch (type) {
                case 'Choice': return 'border-l-blue-500';
                case 'Ending': return 'border-l-amber-500';
                default: return 'border-l-emerald-500';
            }
        };

        return (
            <div className={`h-full flex z-20 ${campaignMode ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''}`}>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden flex shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.5)] ${activeRightPanel ? 'w-[320px] opacity-100' : 'w-0 opacity-0'}`}>
                    <div className="w-[320px] shrink-0 bg-slate-900 border-l border-slate-800 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {activeRightPanel === 'Nodes' && (
                                <>
                                    <div className="flex w-full bg-slate-950 rounded-md p-1 border border-slate-800">
                                        {['Common', 'Choice', 'Ending'].map(tab => (
                                            <button key={tab} onClick={() => setActiveNodeTab(tab)} className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${activeNodeTab === tab ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="text" placeholder={`Search ${activeNodeTab} nodes...`} className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 pl-8 outline-none text-slate-300 text-xs" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {mockNodes.filter(n => n.type === activeNodeTab).map(node => (
                                            <div key={node.id} className={`group p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-md cursor-pointer transition-colors border-l-2 ${getBorderColor(node.type)} flex justify-between items-center`}>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-200">{node.name}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{node.type} Node</div>
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                    <button onClick={() => setActiveNodeConfig(node.type)} className="p-1.5 hover:bg-indigo-600 hover:text-white rounded text-slate-400 transition-colors bg-slate-900 shadow-sm" title="Edit"><Pencil className="w-3 h-3" /></button>
                                                    <button className="p-1.5 hover:bg-red-500 hover:text-white rounded text-slate-400 transition-colors bg-slate-900 shadow-sm" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {activeRightPanel === 'RouteTracing' && (
                                <div className="flex flex-col gap-6 custom-scrollbar h-full">

                                    {routeResults ? (
                                        /* Results Section (Replaces config after tracing) */
                                        <div className="flex flex-col gap-4 h-full animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={() => setRouteResults(null)}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-700"
                                            >
                                                <X className="w-4 h-4" /> Stop Route Tracing
                                            </button>

                                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mt-2">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Paths Found ({routeResults.length})
                                                </h4>
                                            </div>

                                            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                                                {routeResults.map(res => (
                                                    <div key={res.id} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded p-3 cursor-pointer transition-colors group">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{res.name}</span>
                                                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">{res.steps} steps</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                                            Start Node <ChevronRight className="w-3 h-3 text-slate-600" /> ... <ChevronRight className="w-3 h-3 text-slate-600" /> Target
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Configuration Section */
                                        <div className="flex flex-col gap-5 animate-in fade-in duration-200">

                                            {/* Target Node */}
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Target Node</label>
                                                <div className="bg-emerald-500/10 border border-emerald-500/30 border-l-4 border-l-emerald-500 p-2.5 rounded text-sm text-slate-200 cursor-pointer hover:bg-emerald-500/20 transition-colors">
                                                    <div className="font-bold">Crystal Chamber</div>
                                                    <div className="text-[10px] text-emerald-400/70 uppercase tracking-wider mt-0.5">Chapter 2 • Ending Node</div>
                                                </div>
                                            </div>

                                            {/* Tie-Breaking Priorities */}
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                                    Tie-Breaking Priorities <span className="normal-case opacity-60 font-medium">(Optional)</span>
                                                </label>
                                                <div className="flex flex-col gap-2">
                                                    {/* Priority: Flag Example */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">FLAG</span>
                                                        <select className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                                                            <option>has_lantern</option>
                                                        </select>
                                                        <select className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                                                            <option>True</option>
                                                            <option>False</option>
                                                        </select>
                                                        <button className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>

                                                    {/* Priority: Status Example */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-bold">STAT</span>
                                                        <select className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                                                            <option>courage</option>
                                                        </select>
                                                        <input type="number" defaultValue={0} className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors text-center font-mono" />
                                                        <button className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                                    )}

                                </div>
                            )}
                            {activeRightPanel === 'CampaignList' && (
                                <div className="flex flex-col gap-5 custom-scrollbar h-full">

                                    {/* Context Header */}
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-md p-3">
                                        <h4 className="text-xs font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5">
                                            <Play className="w-3.5 h-3.5 fill-current" /> Campaign Scenarios
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Create discrete starting points and test distinct branches of your narrative simulation.
                                        </p>
                                    </div>

                                    {/* Create New Campaign */}
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Name new campaign..."
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md py-2 pl-3 pr-10 outline-none text-slate-200 text-xs transition-colors shadow-inner"
                                        />
                                        <button className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-sm">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="h-px w-full bg-slate-800/60"></div>

                                    {/* Campaign List */}
                                    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Available Campaigns</span>
                                        {campaigns.map(camp => (
                                            <div key={camp.id} className="group flex flex-col bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-md transition-all overflow-hidden shadow-sm">
                                                <div className="flex items-center justify-between p-3 cursor-pointer">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-colors"></div>
                                                        <span className="font-semibold text-slate-200 text-xs">{camp.name}</span>
                                                    </div>
                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                        <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors" title="Edit Name">
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-[42px] bg-[#070A11] border-l border-slate-800/50 flex flex-col py-6 gap-2 shrink-0 h-full">
                    <NameplateTab id="Nodes" label="Nodes" />
                    <NameplateTab id="RouteTracing" label="Route Tracing" />
                    <NameplateTab id="CampaignList" label="Campaign List" />
                </div>
            </div>
        );
    };

    // --- BOTTOM BAR ---
    const GlobalStatusStrip = () => {
        return (
            <div className="h-7 bg-[#1E2333] border-t border-slate-800 flex items-center justify-between px-4 text-[11px] text-slate-400 shrink-0 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex items-center gap-4 shrink-0">
                        <span className="flex items-center gap-1.5" title="Common Nodes"><GitCommit className="w-3.5 h-3.5 text-emerald-400" /> <strong className="text-slate-200">24</strong></span>
                        <span className="flex items-center gap-1.5" title="Choice Nodes"><GitPullRequest className="w-3.5 h-3.5 text-blue-400" /> <strong className="text-slate-200">12</strong></span>
                        <span className="flex items-center gap-1.5" title="Ending Nodes"><BoxSelect className="w-3.5 h-3.5 text-amber-500" /> <strong className="text-slate-200">3</strong></span>
                    </div>
                    <div className="w-px h-3 bg-slate-700 shrink-0"></div>
                    <div className="flex items-center gap-4 shrink-0">
                        <span className="flex items-center gap-1.5" title="Flags"><Flag className="w-3.5 h-3.5 text-purple-400" /> Flags: <strong className="text-slate-200">8</strong></span>
                        <span className="flex items-center gap-1.5" title="Statuses"><Activity className="w-3.5 h-3.5 text-rose-400" /> Statuses: <strong className="text-slate-200">4</strong></span>
                        <span className="flex items-center gap-1.5" title="Paths"><FolderTree className="w-3.5 h-3.5 text-cyan-400" /> Paths: <strong className="text-slate-200">2</strong></span>
                        <span className="flex items-center gap-1.5" title="Chapters"><BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Chapters: <strong className="text-slate-200">1</strong></span>
                    </div>
                </div>
                {campaignMode && (
                    <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-slate-700 ml-4 animate-in fade-in duration-300">
                        <span className="text-slate-400">Nodes: <strong className="text-amber-400">1 / 9</strong></span>
                        <span className="text-slate-400">Endings: <strong className="text-emerald-400">0 / 3</strong></span>
                        <span className="text-slate-400">Edges: <strong className="text-indigo-400">0 / 8</strong></span>
                        <span className="text-slate-400">Dead-ends: <strong className="text-rose-400">0</strong></span>
                        <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2 py-0.5 text-slate-200 transition-colors shadow-sm ml-2">Overlay: ON</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-200">
            <CreationModal />
            <NodeConfigModal />
            <PrimaryTopBar />

            <div className="flex-1 flex overflow-hidden relative">
                <LeftSidebarPanel />

                <div className="flex-1 relative overflow-hidden bg-[#070A11] flex">
                    <FloatingMiddleBar />
                    {campaignMode && (
                        <div className="absolute top-0 left-0 w-full h-8 bg-[#2A6EBB]/90 backdrop-blur border-b border-[#3b82f6] text-sky-100 text-xs font-medium flex items-center justify-center shadow-md z-30 animate-in slide-in-from-top-4">
                            <Zap className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" />
                            <span className="font-bold text-white mr-1">Campaign Active</span> — click a highlighted node to advance
                        </div>
                    )}
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>
                </div>

                <RightSidebarPanel />
            </div>

            <GlobalStatusStrip />
        </div>
    );
}