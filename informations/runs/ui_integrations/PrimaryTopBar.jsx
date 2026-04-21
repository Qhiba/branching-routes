import React from 'react';
import {
    Network,
    Wand2,
    LayoutGrid,
    BoxSelect,
    FilePlus,
    Upload,
    Download,
} from 'lucide-react';

/**
 * PrimaryTopBar
 *
 * The fixed 56 px header bar at the very top of the app shell.
 * Responsible for: branding, project name editing, canvas controls
 * (Tidy Layout / Snap / Clusters), and file action buttons (New / Import / Export).
 *
 * All state is lifted — this component is fully controlled.
 *
 * Props:
 *  projectName        {string}   Editable project title value.
 *  onProjectNameChange{Function} Called with the new string on every keystroke.
 *  onTidyLayout       {Function} Fires Dagre auto-layout.
 *  snapEnabled        {boolean}  Whether snap-to-grid is currently ON.
 *  onSnapToggle       {Function} Toggles snap-to-grid.
 *  clustersEnabled    {boolean}  Whether cluster overlay is currently ON.
 *  onClustersToggle   {Function} Cycles cluster mode.
 *  onNew              {Function} Creates a new blank project.
 *  onImport           {Function} Opens the import file dialog.
 *  onExport           {Function} Exports the current project.
 *
 * Real-app wiring (from TopBar.jsx / uiStore / narrativeStore):
 *  projectName        ← useNarrativeStore(s => s.meta.title)
 *  onProjectNameChange→ narrativeStore.updateMeta({ title })
 *  snapEnabled        ← useUIStore(s => s.snapToGrid)
 *  onSnapToggle       → uiStore.toggleSnapToGrid()
 *  clustersEnabled    ← useUIStore(s => s.clusterMode !== 'off')
 *  onClustersToggle   → uiStore.cycleClusterMode()
 *  onTidyLayout       → dispatches 'canvas-layout-tidy' DOM event (AR-19)
 *  onNew / onImport / onExport → fileSystem utility handlers in TopBar.jsx
 */
export default function PrimaryTopBar({
    projectName = '',
    onProjectNameChange = () => { },
    onTidyLayout = () => { },
    snapEnabled = true,
    onSnapToggle = () => { },
    clustersEnabled = false,
    onClustersToggle = () => { },
    onNew = () => { },
    onImport = () => { },
    onExport = () => { },
}) {
    return (
        <div
            className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-6 text-slate-300 text-sm z-40 shrink-0 w-full overflow-x-auto shadow-md"
            style={{ scrollbarWidth: 'none' }}
        >
            {/* Branding */}
            <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wide shrink-0">
                <Network className="w-5 h-5" />
                <span>Branching Routes</span>
            </div>

            <div className="h-6 w-px bg-slate-800 shrink-0" />

            {/* Project Name Input */}
            <div className="shrink-0">
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    className="bg-slate-950/50 hover:bg-slate-800 focus:bg-slate-950 border border-slate-700/50 focus:border-indigo-500 rounded px-3 py-1.5 outline-none text-slate-200 transition-colors w-48 font-medium"
                />
            </div>

            <div className="h-6 w-px bg-slate-800 shrink-0" />

            {/* Canvas Controls */}
            <div className="flex items-center bg-slate-950 rounded-md p-1 border border-slate-800 shrink-0">
                <button
                    onClick={onTidyLayout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium"
                >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Tidy Layout</span>
                </button>

                <button
                    onClick={onSnapToggle}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-xs font-medium shadow-sm ${snapEnabled
                            ? 'bg-slate-800 text-slate-200'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Snap: {snapEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                    onClick={onClustersToggle}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-xs font-medium ${clustersEnabled
                            ? 'bg-slate-800 text-slate-200'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <BoxSelect className="w-3.5 h-3.5" />
                    <span>Clusters: {clustersEnabled ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            <div className="h-6 w-px bg-slate-800 shrink-0" />

            {/* File Actions */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    onClick={onNew}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700"
                >
                    <FilePlus className="w-3.5 h-3.5" /> New
                </button>
                <button
                    onClick={onImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700"
                >
                    <Upload className="w-3.5 h-3.5" /> Import
                </button>
                <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium border border-transparent hover:border-slate-700"
                >
                    <Download className="w-3.5 h-3.5" /> Export
                </button>
            </div>
        </div>
    );
}
