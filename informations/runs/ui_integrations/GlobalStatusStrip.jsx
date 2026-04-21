import React from 'react';
import {
    GitCommit,
    GitPullRequest,
    BoxSelect,
    Flag,
    Activity,
    FolderTree,
    BookOpen,
} from 'lucide-react';

/**
 * GlobalStatusStrip
 *
 * The fixed 28px bottom bar that shows graph coverage counters.
 *
 * In edit mode it displays a read-only summary of all entity counts.
 * In campaign mode it additionally shows live traversal stats and an
 * Overlay toggle button (all via the `campaignStats` prop).
 *
 * This component is a pure display component — it holds no local state.
 *
 * Props:
 *  counts           {object}  Entity counts from narrativeStore:
 *    .common          {number}  — Common nodes
 *    .choice          {number}  — Choice nodes
 *    .ending          {number}  — Ending nodes
 *    .flags           {number}  — Flag entities
 *    .statuses        {number}  — Status entities
 *    .paths           {number}  — Path entities
 *    .chapters        {number}  — Chapter entities
 *  campaignMode     {boolean} True when a campaign is running.
 *  campaignStats    {object|null}  Live campaign coverage (only when campaignMode):
 *    .visitedNodes    {number}
 *    .totalNodes      {number}
 *    .endingsReached  {number}
 *    .totalEndings    {number}
 *    .edgesTraversed  {number}
 *    .totalEdges      {number}
 *    .deadEnds        {number}
 *  overlayOn        {boolean} Whether the traversal/route overlay is active.
 *  onToggleOverlay  {Function} Toggles the traversal overlay.
 *
 * Real-app wiring (replacing / complementing StatusStrip.jsx):
 *  counts.common    ← Object.keys(useNarrativeStore(s => s.common)).length
 *  counts.choice    ← Object.keys(useNarrativeStore(s => s.choice)).length
 *  counts.ending    ← Object.keys(useNarrativeStore(s => s.ending)).length
 *  counts.flags     ← Object.keys(useNarrativeStore(s => s.flag)).length
 *  counts.statuses  ← Object.keys(useNarrativeStore(s => s.status)).length
 *  counts.paths     ← Object.keys(useNarrativeStore(s => s.path)).length
 *  counts.chapters  ← Object.keys(useNarrativeStore(s => s.chapter)).length
 *  campaignMode     ← useSimulationStore(s => s.isCampaignActive)
 *  campaignStats    ← computed from useSimulationStore coverage selectors
 *  overlayOn        ← useUIStore(s => s.showTraversalOverlay)
 *  onToggleOverlay  → uiStore.toggleTraversalOverlay()
 */
export default function GlobalStatusStrip({
    counts = {
        common: 0,
        choice: 0,
        ending: 0,
        flags: 0,
        statuses: 0,
        paths: 0,
        chapters: 0,
    },
    campaignMode = false,
    campaignStats = null,
    overlayOn = true,
    onToggleOverlay = () => { },
}) {
    return (
        <div className="h-7 bg-[#1E2333] border-t border-slate-800 flex items-center justify-between px-4 text-[11px] text-slate-400 shrink-0 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">

            {/* Left: static entity counters */}
            <div
                className="flex items-center gap-6 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Node type counts */}
                <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5" title="Common Nodes">
                        <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                        <strong className="text-slate-200">{counts.common}</strong>
                    </span>
                    <span className="flex items-center gap-1.5" title="Choice Nodes">
                        <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
                        <strong className="text-slate-200">{counts.choice}</strong>
                    </span>
                    <span className="flex items-center gap-1.5" title="Ending Nodes">
                        <BoxSelect className="w-3.5 h-3.5 text-amber-500" />
                        <strong className="text-slate-200">{counts.ending}</strong>
                    </span>
                </div>

                <div className="w-px h-3 bg-slate-700 shrink-0" />

                {/* Metadata entity counts */}
                <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5" title="Flags">
                        <Flag className="w-3.5 h-3.5 text-purple-400" />
                        Flags: <strong className="text-slate-200">{counts.flags}</strong>
                    </span>
                    <span className="flex items-center gap-1.5" title="Statuses">
                        <Activity className="w-3.5 h-3.5 text-rose-400" />
                        Statuses: <strong className="text-slate-200">{counts.statuses}</strong>
                    </span>
                    <span className="flex items-center gap-1.5" title="Paths">
                        <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                        Paths: <strong className="text-slate-200">{counts.paths}</strong>
                    </span>
                    <span className="flex items-center gap-1.5" title="Chapters">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Chapters: <strong className="text-slate-200">{counts.chapters}</strong>
                    </span>
                </div>
            </div>

            {/* Right: live campaign stats (campaign mode only) */}
            {campaignMode && campaignStats && (
                <div className="flex items-center gap-4 shrink-0 pl-4 border-l border-slate-700 ml-4 animate-in fade-in duration-300">
                    <span className="text-slate-400">
                        Nodes:{' '}
                        <strong className="text-amber-400">
                            {campaignStats.visitedNodes} / {campaignStats.totalNodes}
                        </strong>
                    </span>
                    <span className="text-slate-400">
                        Endings:{' '}
                        <strong className="text-emerald-400">
                            {campaignStats.endingsReached} / {campaignStats.totalEndings}
                        </strong>
                    </span>
                    <span className="text-slate-400">
                        Edges:{' '}
                        <strong className="text-indigo-400">
                            {campaignStats.edgesTraversed} / {campaignStats.totalEdges}
                        </strong>
                    </span>
                    <span className="text-slate-400">
                        Dead-ends:{' '}
                        <strong className="text-rose-400">{campaignStats.deadEnds}</strong>
                    </span>
                    <button
                        onClick={onToggleOverlay}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2 py-0.5 text-slate-200 transition-colors shadow-sm ml-2"
                    >
                        Overlay: {overlayOn ? 'ON' : 'OFF'}
                    </button>
                </div>
            )}

        </div>
    );
}
