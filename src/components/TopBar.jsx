import React, { useState } from 'react';
import { useNarrativeStore, useSimulationStore, useUIStore, useCampaignStore } from 'store';
import { exportProject, importProject, clearIndexedDB, clearCampaignsIndexedDB } from 'utils';
import dagre from 'dagre';
import {
  Network,
  Wand2,
  LayoutGrid,
  BoxSelect,
  FilePlus,
  Upload,
  Download,
  Check
} from 'lucide-react';

export default function TopBar() {
  const meta = useNarrativeStore(s => s.meta);
  const updateMeta = useNarrativeStore(s => s.updateMeta);
  const newGraph = useNarrativeStore(s => s.newGraph);
  const loadGraph = useNarrativeStore(s => s.loadGraph);
  const exportGraph = useNarrativeStore(s => s.exportGraph);

  const snapToGrid = useUIStore(s => s.snapToGrid);
  const toggleSnapToGrid = useUIStore(s => s.toggleSnapToGrid);
  const clusterMode = useUIStore(s => s.clusterMode);
  const cycleClusterMode = useUIStore(s => s.cycleClusterMode);

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

  const campaigns = useCampaignStore(s => s.campaigns);
  const clearCampaignsStore = useCampaignStore(s => s.clearCampaigns);
  const loadCampaignsFromObject = useCampaignStore(s => s.loadCampaignsFromObject);

  const [exportStatus, setExportStatus] = useState(false);

  const clustersEnabled = clusterMode !== 'off';

  const handleTitleChange = (e) => {
    updateMeta({ title: e.target.value });
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
    if (window.confirm("Start a new project? Unsaved changes will be lost.")) {
      await clearCampaignsIndexedDB();
      await clearIndexedDB();
      clearCampaignsStore();
      newGraph();
      useSimulationStore.getState().exitCampaign();
    }
  };

  const handleImport = async () => {
    try {
      const data = await importProject();
      if (data) {
        useSimulationStore.getState().exitCampaign();
        clearCampaignsStore();
        if (data.campaigns) {
          loadCampaignsFromObject(data.campaigns);
        }
        if (data.graphData) {
          loadGraph(data.graphData);
        } else {
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
    <div className="topbar-content">
      {/* SECTION 1: BRAND + TITLE */}
      <div className="topbar__section topbar__section--left">
        <div className="topbar__brand">
          <Network className="topbar__brand-icon" />
          <span>Branching Routes</span>
        </div>

        <div className="topbar__divider" />

        <div className="topbar__center">
          <input
            type="text"
            value={meta?.title || ''}
            onChange={handleTitleChange}
            onFocus={(e) => {
              if (e.target.value === 'Untitled Graph') e.target.select();
            }}
            placeholder="Project Title"
            className="topbar__title-input"
          />
        </div>
      </div>

      {/* SECTION 2: VIEW CONTROLS */}
      <div className="topbar__section topbar__section--center">
        <div className="topbar__controls-group">
          <button
            onClick={handleTidyLayout}
            disabled={isCampaignActive}
            className="topbar__control-btn"
            title="Tidy Layout (Dagre)"
          >
            <Wand2 className="topbar__control-icon" />
            <span>Tidy</span>
          </button>
          <button
            onClick={toggleSnapToGrid}
            disabled={isCampaignActive}
            className={`topbar__control-btn ${snapToGrid ? 'topbar__control-btn--active' : ''}`}
            title="Toggle Grid Snapping"
          >
            <LayoutGrid className="topbar__control-icon" />
            <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={cycleClusterMode}
            className={`topbar__control-btn ${clustersEnabled ? 'topbar__control-btn--active' : ''}`}
            title="Cycle Cluster Visualization"
          >
            <BoxSelect className="topbar__control-icon" />
            <span>Clusters: {clusterMode.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: FILE ACTIONS */}
      <div className="topbar__section topbar__section--right">
        <div className="topbar__actions-group">
          <button onClick={handleNew} disabled={isCampaignActive} className="topbar__action-btn">
            <FilePlus className="topbar__control-icon" />
            <span>New</span>
          </button>
          <button onClick={handleImport} disabled={isCampaignActive} className="topbar__action-btn">
            <Upload className="topbar__control-icon" />
            <span>Import</span>
          </button>
          <button onClick={handleExport} disabled={isCampaignActive} className="topbar__action-btn">
            {exportStatus ? <Check className="topbar__control-icon" /> : <Download className="topbar__control-icon" />}
            <span>{exportStatus ? 'Exported' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
