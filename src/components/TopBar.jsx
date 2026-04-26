import React, { useState } from 'react';
import { Network, Wand2, LayoutGrid, BoxSelect, FilePlus, Upload, Download } from 'lucide-react';
import { useNarrativeStore, useUIStore, useSimulationStore, useCampaignStore } from 'store';
import { exportProject, importProject, clearIndexedDB, clearCampaignsIndexedDB } from 'utils';
import dagre from 'dagre';
import ConfirmModal from './ConfirmModal.jsx';
import './TopBar.css';

export default function TopBar() {
  const meta = useNarrativeStore(s => s.meta);
  const updateMeta = useNarrativeStore(s => s.updateMeta);

  const snapToGrid = useUIStore(s => s.snapToGrid);
  const toggleSnapToGrid = useUIStore(s => s.toggleSnapToGrid);

  const clusterMode = useUIStore(s => s.clusterMode);
  const cycleClusterMode = useUIStore(s => s.cycleClusterMode);

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const newGraph = useNarrativeStore(s => s.newGraph);
  const loadGraph = useNarrativeStore(s => s.loadGraph);
  const exportGraph = useNarrativeStore(s => s.exportGraph);

  const exitCampaign = useSimulationStore(s => s.exitCampaign);

  const campaigns = useCampaignStore(s => s.campaigns);
  const clearCampaignsStore = useCampaignStore(s => s.clearCampaigns);
  const loadCampaignsFromObject = useCampaignStore(s => s.loadCampaignsFromObject);

  const [exportStatus, setExportStatus] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  const handleTitleChange = (e) => {
    if (updateMeta) {
      updateMeta({ title: e.target.value });
    }
  };

  const handleTidyLayout = () => {
    const graphState = useNarrativeStore.getState();
    const storeNodes = [
      ...Object.values(graphState.common || {}),
      ...Object.values(graphState.choice || {}),
      ...Object.values(graphState.ending || {})
    ];
    const edges = graphState.edges;
    const updateNode = graphState.updateNode;

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR' });
    g.setDefaultEdgeLabel(() => ({}));

    storeNodes.forEach(node => {
      g.setNode(node.id, { width: 250, height: 150 });
    });

    edges.forEach(edge => {
      g.setEdge(edge.sourceId, edge.targetId);
    });

    dagre.layout(g);

    g.nodes().forEach(nodeId => {
      const nodeWithPos = g.node(nodeId);
      updateNode(nodeId, { position: { x: nodeWithPos.x - 125, y: nodeWithPos.y - 75 } });
    });

    window.dispatchEvent(new Event('graph-layout-tidy'));
  };

  const handleNew = async () => {
    setShowNewConfirm(true);
  };

  const handleNewConfirmed = async () => {
    setShowNewConfirm(false);
    // NOTE: unrelated issue — not touching in refactor [Violation] 'click' handler took 1682ms
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
        // PRESERVED: Teardown logic requires that loading a graph resets UI selection and explicitly exits Campaign Mode
        exitCampaign();
        clearCampaignsStore();
        if (data.campaigns) {
          loadCampaignsFromObject(data.campaigns);
        }
        if (data.graphData) {
          loadGraph(data.graphData);
        } else {
          // fallback for older returned structure just in case
          loadGraph(data);
        }
      }
    } catch (err) {
      if (err.message === 'unsupported_schema_version') {
        alert("This file uses an unsupported format version. Please open a valid Branching Routes file.");
      }
    }
  };

  const handleExport = async () => {
    try {
      const graphData = exportGraph();
      await exportProject(graphData, campaigns, meta?.title || 'branching_routes_project');
      setExportStatus(true);
      setTimeout(() => setExportStatus(false), 2000);
    } catch (err) {
      alert("Export failed. Check browser permissions for file access.");
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showNewConfirm}
        title="Start a new project?"
        message="All unsaved changes will be lost. This action cannot be undone."
        confirmLabel="New Project"
        danger
        onConfirm={handleNewConfirmed}
        onCancel={() => setShowNewConfirm(false)}
      />
      <div className="ui-v2-topbar">
        {/* Left Side: Logo | Project Name */}
        <div className="ui-v2-topbar-section-left">
          <div className="ui-v2-topbar-brand">
            <Network className="w-5 h-5" />
            <span>Branching Routes</span>
          </div>

          <div className="ui-v2-topbar-divider"></div>

          <div>
            <input
              type="text"
              value={meta?.title || ''}
              onChange={handleTitleChange}
              onFocus={(e) => {
                if (e.target.value === 'Untitled Graph') {
                  e.target.select();
                }
              }}
              placeholder="Project Title"
              className="ui-v2-topbar-input"
            />
          </div>
        </div>

        {/* Middle Side: Tidy Layout | Snap On | Clusters */}
        <div className="ui-v2-topbar-section-center">
          <div className="ui-v2-topbar-group">
            <button
              onClick={handleTidyLayout}
              disabled={isCampaignActive}
              className="ui-v2-topbar-btn"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tidy Layout</span>
            </button>

            <button
              onClick={toggleSnapToGrid}
              disabled={isCampaignActive}
              className={`ui-v2-topbar-btn ${snapToGrid ? 'ui-v2-topbar-btn--active' : ''}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={cycleClusterMode}
              className={`ui-v2-topbar-btn ${clusterMode !== 'off' ? 'ui-v2-topbar-btn--active' : ''}`}
            >
              <BoxSelect className="w-3.5 h-3.5" />
              <span>Clusters: {clusterMode.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Right Side: New | Import | Export */}
        <div className="ui-v2-topbar-section-right">
          <div className="ui-v2-topbar-file-ops">
            <button
              className="ui-v2-topbar-file-btn"
              disabled={isCampaignActive}
              onClick={handleNew}
            >
              <FilePlus className="w-3.5 h-3.5" /> New
            </button>
            <button
              className="ui-v2-topbar-file-btn"
              disabled={isCampaignActive}
              onClick={handleImport}
            >
              <Download className="w-3.5 h-3.5" /> Import
            </button>
            <button
              className="ui-v2-topbar-file-btn"
              disabled={isCampaignActive}
              onClick={handleExport}
            >
              <Upload className="w-3.5 h-3.5" /> {exportStatus ? "Exported ✓" : "Export"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
