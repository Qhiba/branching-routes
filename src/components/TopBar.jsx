import React, { useState, useEffect, useRef } from 'react';
import { Network, Play, Settings, ChevronDown, FilePlus, FolderOpen, Download, Undo2, Redo2 } from 'lucide-react';
import { useNarrativeStore, useUIStore, useSimulationStore, useCampaignStore, useToastStore, useHistoryStore, undo, redo } from 'store';
import { exportProject, importProject, clearIndexedDB, clearCampaignsIndexedDB } from 'utils';
import ConfirmModal from './ConfirmModal.jsx';
import './TopBar.css';

// CHANGED (Redesign Step 4): rebuilt on design-system primitives (AR-37).
//   Left:   brand + project title
//   Centre: "Add node" group — one labelled button per node type, marked with its route colour
//   Right:  campaign selector + Start (only when the Campaign feature is on, AR-36), File menu, Settings
// Center (0,0) moved to the canvas controls. Snap Assist moved to Settings (Step 1).
// The unused Dagre auto-layout handler was removed (L stays "fit view"). Import/export feedback uses toasts instead of alert().

const NODE_BUTTONS = [
  { type: 'common', route: 'common', label: 'Common', hint: 'Add a Common node (N)' },
  { type: 'choice', route: 'choice', label: 'Choice', hint: 'Add a Choice node (C)' },
  { type: 'ending', route: 'ending', label: 'Ending', hint: 'Add an Ending node (E)' },
  { type: 'hub', route: 'hub', label: 'Hub', hint: 'Add a Hub: routes one input to several conditional edges' },
  { type: 'warp_entrance', route: 'warp', label: 'Warp in', hint: 'Add a Warp entrance (W)' },
  { type: 'warp_exit', route: 'warp', label: 'Warp out', hint: 'Add a Warp exit (Ctrl+W)' },
];

function FileMenu({ disabled, onNew, onImport, onExport }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const firstItemRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();
    const onPointer = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...wrapRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
        const i = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const run = (fn) => () => { setOpen(false); fn(); };

  return (
    <div className="br-topbar__menu-wrap" ref={wrapRef}>
      <button
        className="br-btn br-btn--ghost"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
      >
        File <ChevronDown />
      </button>
      {open && (
        <div className="br-menu br-topbar__menu" role="menu" aria-label="File">
          <button ref={firstItemRef} className="br-menu__item" role="menuitem" onClick={run(onNew)}>
            <FilePlus />New project
          </button>
          <button className="br-menu__item" role="menuitem" onClick={run(onImport)}>
            <FolderOpen />Open project…
          </button>
          <hr className="br-menu__divider" />
          <button className="br-menu__item" role="menuitem" onClick={run(onExport)}>
            <Download />Export project…
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  const meta = useNarrativeStore(s => s.meta);
  const updateMeta = useNarrativeStore(s => s.updateMeta);
  const newGraph = useNarrativeStore(s => s.newGraph);
  const loadGraph = useNarrativeStore(s => s.loadGraph);
  const exportGraph = useNarrativeStore(s => s.exportGraph);

  // ADDED (Redesign Step 1): campaign selector gated by the Campaign feature switch
  const featureCampaign = useUIStore(s => s.featureCampaign);
  const setShowSettings = useUIStore(s => s.setShowSettings);

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  // ADDED (Redesign Step 5): undo / redo availability
  const canUndo = useHistoryStore(s => s.canUndo);
  const canRedo = useHistoryStore(s => s.canRedo);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);
  const exitCampaign = useSimulationStore(s => s.exitCampaign);

  const campaignsMap = useCampaignStore(s => s.campaigns);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);
  const clearCampaignsStore = useCampaignStore(s => s.clearCampaigns);
  const loadCampaignsFromObject = useCampaignStore(s => s.loadCampaignsFromObject);

  const campaignsList = Object.values(campaignsMap);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  // Derive a valid selection instead of syncing it in an effect: fall back to the first campaign.
  const selectedId = campaignsMap[selectedCampaignId] ? selectedCampaignId : (campaignsList[0]?.id || '');
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  const toast = (msg, variant) => useToastStore.getState().addToast(msg, variant);

  const handleCreateNode = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
  };

  const handleStartCampaign = () => {
    const camp = campaignsMap[selectedId];
    if (camp) {
      setActiveCampaign(selectedId);
      enterCampaign(camp);
    }
  };

  const handleNewConfirmed = async () => {
    setShowNewConfirm(false);
    await clearCampaignsIndexedDB();
    await clearIndexedDB();
    clearCampaignsStore();
    newGraph();
    exitCampaign();
  };

  const handleImport = async () => {
    try {
      const data = await importProject();
      if (data) {
        exitCampaign();
        clearCampaignsStore();
        if (data.campaigns) loadCampaignsFromObject(data.campaigns);
        loadGraph(data.graphData || data);
        toast(`Opened "${data.graphData?.meta?.title || 'project'}"`, 'success');
      }
    } catch (err) {
      if (err.message === 'unsupported_schema_version') {
        toast("This file was made by a newer or unknown version of Branching Routes, so it can't be opened.", 'error');
      } else if (err.message === 'invalid_project_structure') {
        toast("This file isn't a Branching Routes project: its nodes or edges are missing.", 'error');
      } else {
        toast(`Couldn't open the file: ${err.message}`, 'error');
      }
    }
  };

  const handleExport = async () => {
    try {
      await exportProject(exportGraph(), campaignsMap, meta?.title || 'branching_routes_project');
      toast('Project exported', 'success');
    } catch {
      toast("Couldn't export. Check that the browser may save files here.", 'error');
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showNewConfirm}
        title="Start a new project?"
        message="Everything in the current project is cleared. Export it first if you want to keep it."
        confirmLabel="Start new project"
        danger
        onConfirm={handleNewConfirmed}
        onCancel={() => setShowNewConfirm(false)}
      />
      <div className="br-topbar">
        <div className="br-topbar__left">
          <div className="br-topbar__brand" aria-label="Branching Routes">
            <Network aria-hidden="true" />
            <span className="br-topbar__brand-name">Branching Routes</span>
          </div>
          <input
            type="text"
            className="br-topbar__title"
            value={meta?.title || ''}
            onChange={(e) => updateMeta?.({ title: e.target.value })}
            disabled={isCampaignActive}
            onFocus={(e) => { if (e.target.value === 'Untitled Graph') e.target.select(); }}
            placeholder="Untitled project"
            aria-label="Project title"
          />
        </div>

        <div className="br-topbar__center" role="group" aria-label="Add node">
          {NODE_BUTTONS.map(b => (
            <button
              key={b.type}
              className="br-btn br-btn--ghost br-btn--sm br-topbar__node-btn"
              data-route={b.route}
              onClick={() => handleCreateNode(b.type)}
              disabled={isCampaignActive}
              title={b.hint}
              aria-label={b.hint}
            >
              <span className="br-route" aria-hidden="true" />
              <span className="br-topbar__node-label">{b.label}</span>
            </button>
          ))}
        </div>

        <div className="br-topbar__right">
          {featureCampaign && (
            <div className="br-topbar__campaign">
              <select
                className="br-select br-topbar__campaign-select"
                value={selectedId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={isCampaignActive || campaignsList.length === 0}
                aria-label="Campaign to play"
              >
                {campaignsList.length === 0 && <option value="">No campaigns</option>}
                {campaignsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                className="br-btn br-btn--sm"
                onClick={handleStartCampaign}
                disabled={isCampaignActive || campaignsList.length === 0}
              >
                <Play />Start
              </button>
            </div>
          )}
          <div className="br-topbar__history" role="group" aria-label="History">
            <button
              className="br-btn br-btn--ghost br-btn--icon"
              onClick={() => undo()}
              disabled={isCampaignActive || !canUndo}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 />
            </button>
            <button
              className="br-btn br-btn--ghost br-btn--icon"
              onClick={() => redo()}
              disabled={isCampaignActive || !canRedo}
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              <Redo2 />
            </button>
          </div>
          <FileMenu
            disabled={isCampaignActive}
            onNew={() => setShowNewConfirm(true)}
            onImport={handleImport}
            onExport={handleExport}
          />
          <button
            className="br-btn br-btn--ghost br-btn--icon"
            onClick={() => setShowSettings(true)}
            title="Settings"
            aria-label="Open Settings"
          >
            <Settings />
          </button>
        </div>
      </div>
    </>
  );
}
