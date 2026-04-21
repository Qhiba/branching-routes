import React, { useState } from 'react';
import {
    X,
    AlignLeft,
    Route,
    Zap,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Check,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// SectionTitle — reusable section header inside the modal
// ---------------------------------------------------------------------------

function SectionTitle({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h4>
        </div>
    );
}

// ---------------------------------------------------------------------------
// NodeConfigModal — public API
// ---------------------------------------------------------------------------

/**
 * NodeConfigModal
 *
 * Advanced node configuration modal. Opens at 860px (2-column) for Common/Choice
 * nodes and collapses to 420px (1-column) for Ending nodes.
 *
 * Left column  — Narrative Content (label, description) + Routing (chapter,
 *                path) + start-node toggle.
 * Right column — On-Enter Modifiers (flags set, status modifiers) + Branching
 *                Options (Choice) or Narrative Variants (Common). Hidden for Endings.
 *
 * Local state (all AR-03 compliant — purely transient UI state):
 *  isStartNode  : boolean toggle – whether this node is the campaign start.
 *  logicMode    : 'AND' | 'OR' — condition logic for the inline variant builder.
 *
 * Props:
 *  nodeType     {string|null}  'Common' | 'Choice' | 'Ending' | null (null = closed).
 *  onClose      {Function}     Closes without saving.
 *  onSave       {Function}     Called with node data object on save.
 *  chapters     {Array}        [{ id, name }] for the Chapter dropdown.
 *  paths        {Array}        [{ id, name }] for the Path dropdown.
 *  flags        {Array}        [{ id, name }] for the flag selector.
 *  statuses     {Array}        [{ id, name }] for the status modifier selector.
 *  initialData  {object|null}  Pre-filled node values when editing an existing node.
 *    .label       {string}
 *    .description {string}
 *    .chapterId   {string|null}
 *    .pathId      {string|null}
 *    .isStartNode {boolean}
 *
 * Real-app wiring:
 *  nodeType     ← local useState driven by onEditNode callback (RightSidebar) OR
 *                 FloatingMiddleBar quick-add icons
 *  onClose      → set nodeType to null
 *  onSave       → narrativeStore.updateNode(id, data) or addNode + updateNode
 *  chapters     ← useNarrativeStore(s => Object.values(s.chapter))
 *  paths        ← useNarrativeStore(s => Object.values(s.path))
 *  flags        ← useNarrativeStore(s => Object.values(s.flag))
 *  statuses     ← useNarrativeStore(s => Object.values(s.status))
 *  initialData  ← look up node from narrativeStore by selectedNodeId
 *
 * Note: Sub-arrays (variants, options) are managed via dedicated store actions
 * per AR-13. This modal's onSave should call addVariant/updateVariant/addOption
 * etc. rather than patching the entire data object.
 */
export default function NodeConfigModal({
    nodeType = null,
    onClose = () => { },
    onSave = () => { },
    chapters = [],
    paths = [],
    flags = [],
    statuses = [],
    initialData = null,
}) {
    // Local UI-only state (AR-03)
    const [isStartNode, setIsStartNode] = useState(initialData?.isStartNode ?? false);
    const [logicMode, setLogicMode] = useState('AND');

    if (!nodeType) return null;

    const isEnding = nodeType === 'Ending';
    const isChoice = nodeType === 'Choice';

    // Dynamic theming based on node type
    const themeColor = isChoice
        ? 'text-blue-400'
        : isEnding
            ? 'text-amber-500'
            : 'text-emerald-400';

    const themeBg = isChoice
        ? 'bg-blue-500/10 border-blue-500/20'
        : isEnding
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20';

    const defaultLabel = isChoice ? 'Crossroads' : 'Forest Entrance';
    const defaultDescription = isChoice
        ? 'The path splits ahead. You can hear distant sounds in both directions.'
        : 'You stand at the edge of a dense forest...';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 p-6">
            <div
                className={`bg-slate-900 border border-slate-700 shadow-2xl rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-all max-h-full ${isEnding ? 'w-[420px]' : 'w-[860px]'
                    }`}
            >
                {/* ---- Header ---- */}
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${themeBg} ${themeColor}`}
                        >
                            {nodeType} Node
                        </div>
                        <h3 className="text-sm font-bold text-slate-200">Configure Node</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ---- Body ---- */}
                <div className="flex flex-1 overflow-hidden min-h-[400px]">

                    {/* LEFT COLUMN: Narrative & Routing */}
                    <div
                        className={`p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar ${isEnding ? 'w-full' : 'w-1/2 border-r border-slate-800'
                            }`}
                    >
                        <SectionTitle icon={AlignLeft} title="Narrative Content" />

                        {/* Label */}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                Node Label
                            </label>
                            <input
                                type="text"
                                defaultValue={initialData?.label ?? defaultLabel}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex-1 flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                Description / Text
                            </label>
                            <textarea
                                defaultValue={initialData?.description ?? defaultDescription}
                                className="w-full flex-1 min-h-[120px] bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner resize-none leading-relaxed"
                            />
                        </div>

                        <SectionTitle icon={Route} title="Routing & Placement" />

                        {/* Chapter + Path dropdowns */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                    Chapter
                                </label>
                                <div className="relative">
                                    <select
                                        defaultValue={initialData?.chapterId ?? ''}
                                        className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md pl-3 pr-8 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {chapters.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                    Path
                                </label>
                                <div className="relative">
                                    <select
                                        defaultValue={initialData?.pathId ?? ''}
                                        className="w-full appearance-none bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md pl-3 pr-8 py-2 outline-none text-slate-300 text-sm transition-colors shadow-inner cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {paths.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Start Node toggle */}
                        <div className="bg-slate-950 border border-slate-800 rounded-md p-3 flex items-center justify-between mt-2">
                            <div>
                                <div className="text-sm font-semibold text-slate-200">Set as Start Node</div>
                                <div className="text-[10px] text-slate-500">Campaigns begin execution here.</div>
                            </div>
                            <button
                                onClick={() => setIsStartNode(!isStartNode)}
                                className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${isStartNode ? 'bg-indigo-600' : 'bg-slate-700'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${isStartNode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Logic & Effects (hidden for Endings) */}
                    {!isEnding && (
                        <div className="w-1/2 bg-[#0B0F19] p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                            {/* On-Enter Modifiers */}
                            <div>
                                <SectionTitle icon={Zap} title="On-Enter Modifiers" />
                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-3 shadow-sm">

                                    {/* Set Flags */}
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">
                                            Set Flags (True)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                                                has_lantern{' '}
                                                <button className="hover:text-white">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                            <button className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded transition-colors border border-dashed border-slate-600">
                                                <Plus className="w-3 h-3" /> Add Flag
                                            </button>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-slate-800/60" />

                                    {/* Status Modifiers */}
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">
                                            Status Modifiers
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <select className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none">
                                                    {statuses.length > 0
                                                        ? statuses.map((s) => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))
                                                        : <option>courage</option>
                                                    }
                                                </select>
                                                <select className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none">
                                                    <option>+=</option>
                                                    <option>-=</option>
                                                    <option>=</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    defaultValue={1}
                                                    className="w-16 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none font-mono text-center"
                                                />
                                                <button className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
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
                                <SectionTitle
                                    icon={SlidersHorizontal}
                                    title={isChoice ? 'Branching Options' : 'Narrative Variants'}
                                />
                                <div className="flex flex-col gap-3">

                                    {/* Example expandable card */}
                                    <div className="bg-slate-900 border border-indigo-500/30 rounded-lg overflow-hidden shadow-md">
                                        {/* Card Header */}
                                        <div className="bg-slate-800/50 px-3 py-2 flex items-center justify-between border-b border-slate-800 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <ChevronUp className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-200">
                                                    {isChoice ? 'Option 1' : 'Variant 1'}
                                                </span>
                                            </div>
                                            <button className="text-slate-500 hover:text-red-400 transition-colors p-1">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-3 flex flex-col gap-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder={
                                                        isChoice
                                                            ? "Option text (e.g., 'Open the door')"
                                                            : 'Internal variant name'
                                                    }
                                                    defaultValue={
                                                        isChoice ? 'Head north to the glow' : 'Has Lantern Variant'
                                                    }
                                                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-1.5 outline-none text-slate-300 text-xs shadow-inner"
                                                />
                                            </div>

                                            {/* Conditions builder */}
                                            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500">
                                                        Requires Condition
                                                    </span>
                                                    {/* AND/OR segmented control */}
                                                    <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5 relative text-[10px] font-bold w-24">
                                                        <div
                                                            className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-slate-700 rounded-sm transition-all duration-200 ease-out ${logicMode === 'AND' ? 'left-0.5' : 'left-[calc(50%+1px)]'
                                                                }`}
                                                        />
                                                        <button
                                                            onClick={() => setLogicMode('AND')}
                                                            className={`flex-1 py-0.5 z-10 transition-colors ${logicMode === 'AND' ? 'text-white' : 'text-slate-500'
                                                                }`}
                                                        >
                                                            AND
                                                        </button>
                                                        <button
                                                            onClick={() => setLogicMode('OR')}
                                                            className={`flex-1 py-0.5 z-10 transition-colors ${logicMode === 'OR' ? 'text-white' : 'text-slate-500'
                                                                }`}
                                                        >
                                                            OR
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded text-xs">
                                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">
                                                            FLAG
                                                        </span>
                                                        <span className="text-slate-300 flex-1">has_lantern</span>
                                                        <span className="text-emerald-400 font-bold px-2 text-[10px]">
                                                            TRUE
                                                        </span>
                                                        <button className="text-slate-500 hover:text-red-400">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2 mt-1">
                                                        <button className="flex-1 py-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">
                                                            + Flag Clause
                                                        </button>
                                                        <button className="flex-1 py-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">
                                                            + Status Clause
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Choice-only: on-select modifiers */}
                                            {isChoice && (
                                                <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">
                                                        On-Select Modifiers
                                                    </span>
                                                    <button className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded border border-dashed border-slate-700 transition-colors">
                                                        + Add Specific Modifier
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add variant/option button */}
                                    <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm font-semibold transition-colors shadow-sm">
                                        <Plus className="w-4 h-4" /> Add {isChoice ? 'Option' : 'Variant'}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* ---- Footer ---- */}
                <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onSave({ isStartNode }); onClose(); }}
                        className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" /> Save Node
                    </button>
                </div>

            </div>
        </div>
    );
}
