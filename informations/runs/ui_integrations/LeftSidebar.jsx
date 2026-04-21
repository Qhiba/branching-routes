import React from 'react';
import {
    Flag,
    Activity,
    FolderTree,
    BookOpen,
    Search,
    Plus,
    Pencil,
    Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// LeftNameplateTab — vertical tab on the 42px gutter
// ---------------------------------------------------------------------------

/**
 * LeftNameplateTab
 *
 * A single vertical nameplate tab button on the left gutter.
 * Each tab can toggle the panel open/closed.
 *
 * Props:
 *  id       {string}   Tab identifier: 'Flags' | 'Status' | 'Chapter' | 'Paths'
 *  label    {string}   Rotated vertical label text.
 *  isActive {boolean}  Whether this tab is currently expanded.
 *  onClick  {Function} Called with the tab id when clicked.
 */
function LeftNameplateTab({ id, label, isActive, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-[42px] py-6 border-y border-r rounded-r-lg transition-all flex items-center justify-center shadow-[2px_0_10px_rgba(0,0,0,0.2)] -ml-px ${isActive
                    ? 'bg-slate-900 border-slate-800 text-indigo-400 z-20 -translate-x-px'
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900 hover:translate-x-1 z-10'
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
// EntityListView — search bar + scrollable item list for a single entity type
// ---------------------------------------------------------------------------

/**
 * EntityListView
 *
 * Renders a search input and a scrollable list of entity rows.
 * Each row has a name label with icon, and hover-reveal edit/delete buttons.
 *
 * Props:
 *  type      {string}    Entity type label (used as search placeholder).
 *  items     {Array}     List of { id: string, name: string }.
 *  icon      {Component} Lucide icon component.
 *  iconColor {string}    Tailwind text color class for the icon.
 *  onAdd     {Function}  Called when the "+" button is clicked.
 *  onEdit    {Function}  Called with (id) on edit.
 *  onDelete  {Function}  Called with (id) on delete.
 */
function EntityListView({ type, items, icon: Icon, iconColor, onAdd, onEdit, onDelete }) {
    return (
        <div className="p-4 flex flex-col h-full gap-4">
            {/* Search + Add */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder={`Search ${type.toLowerCase()}...`}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1.5 pl-8 outline-none text-slate-300 text-xs transition-colors"
                    />
                </div>
                <button
                    onClick={onAdd}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors shadow-md shrink-0"
                    title={`Create new ${type}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Entity rows */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group flex items-center justify-between bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded p-2 transition-all text-xs cursor-pointer"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                            <span className="font-medium text-slate-300 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                                onClick={() => onEdit(item.id)}
                                className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="p-1 hover:text-red-400 text-slate-400 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// LeftSidebar — public API
// ---------------------------------------------------------------------------

/**
 * LeftSidebar
 *
 * Left-side data management panel.
 * A 42px gutter shows vertical nameplate tabs (Flags / Status / Chapter / Paths).
 * Clicking a tab slides out a 320px content panel showing the matching entity list.
 * Clicking the active tab collapses the panel.
 *
 * The entire sidebar dims and becomes non-interactive during campaign mode.
 *
 * Props:
 *  activePanel    {string|null}  Currently open panel id, or null if collapsed.
 *  onPanelChange  {Function}     Called with the new panel id (or null to collapse).
 *  campaignMode   {boolean}      Dims the sidebar when true.
 *  flags          {Array}        [{ id, name }] flag entities.
 *  statuses       {Array}        [{ id, name }] status entities.
 *  chapters       {Array}        [{ id, name }] chapter entities.
 *  paths          {Array}        [{ id, name }] path entities.
 *  onCreateEntity {Function}     Called with the entity type string ('Flags'|'Status'|...).
 *  onEditEntity   {Function}     Called with (type, id) to open rename modal.
 *  onDeleteEntity {Function}     Called with (type, id) to delete with guard check.
 *
 * Real-app wiring:
 *  activePanel    ← local useState in parent (or uiStore if persisted)
 *  onPanelChange  → setState
 *  campaignMode   ← useSimulationStore(s => s.isCampaignActive)
 *  flags          ← useNarrativeStore(s => Object.values(s.flag))
 *  statuses       ← useNarrativeStore(s => Object.values(s.status))
 *  chapters       ← useNarrativeStore(s => Object.values(s.chapter))
 *  paths          ← useNarrativeStore(s => Object.values(s.path))
 *  onCreateEntity → dispatch canvas-open-name-modal DOM event (AR-19)
 *                   OR open CreationModal state (for richer Flag/Status form)
 *  onEditEntity   → open NameModal pre-filled with current name
 *  onDeleteEntity → narrativeStore.deleteFlag(id) / deleteStatus / etc.
 */
export default function LeftSidebar({
    activePanel = null,
    onPanelChange = () => { },
    campaignMode = false,
    flags = [],
    statuses = [],
    chapters = [],
    paths = [],
    onCreateEntity = () => { },
    onEditEntity = () => { },
    onDeleteEntity = () => { },
}) {
    const handleTabClick = (id) => {
        onPanelChange(activePanel === id ? null : id);
    };

    const TABS = [
        { id: 'Flags', label: 'Flags' },
        { id: 'Status', label: 'Status' },
        { id: 'Chapter', label: 'Chapter' },
        { id: 'Paths', label: 'Paths' },
    ];

    const entityData = {
        Flags: { items: flags, icon: Flag, iconColor: 'text-purple-400' },
        Status: { items: statuses, icon: Activity, iconColor: 'text-rose-400' },
        Chapter: { items: chapters, icon: BookOpen, iconColor: 'text-indigo-400' },
        Paths: { items: paths, icon: FolderTree, iconColor: 'text-cyan-400' },
    };

    return (
        <div className={`h-full flex z-20 ${campaignMode ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''}`}>

            {/* Gutter — nameplate tabs */}
            <div className="w-[42px] bg-[#070A11] border-r border-slate-800/50 flex flex-col py-6 gap-2 shrink-0 h-full">
                {TABS.map((tab) => (
                    <LeftNameplateTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        isActive={activePanel === tab.id}
                        onClick={handleTabClick}
                    />
                ))}
            </div>

            {/* Sliding content panel */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden flex shadow-[10px_0_20px_-10px_rgba(0,0,0,0.5)] ${activePanel ? 'w-[320px] opacity-100' : 'w-0 opacity-0'
                    }`}
            >
                <div className="w-[320px] shrink-0 bg-slate-900 border-r border-slate-800 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {activePanel && entityData[activePanel] && (
                            <EntityListView
                                type={activePanel}
                                items={entityData[activePanel].items}
                                icon={entityData[activePanel].icon}
                                iconColor={entityData[activePanel].iconColor}
                                onAdd={() => onCreateEntity(activePanel)}
                                onEdit={(id) => onEditEntity(activePanel, id)}
                                onDelete={(id) => onDeleteEntity(activePanel, id)}
                            />
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
