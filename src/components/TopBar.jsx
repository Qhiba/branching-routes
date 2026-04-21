import React, { useState } from 'react';
import { useNarrativeStore, useSimulationStore, useUIStore, useCampaignStore } from 'store';
import { exportProject, importProject, clearIndexedDB, clearCampaignsIndexedDB } from 'utils';
import dagre from 'dagre';
import CampaignSelector from './CampaignSelector.jsx';
import CreationBar from './CreationBar.jsx'; // ADDED: Phase 4

export default function TopBar() {
  const meta = useNarrativeStore(s => s.meta);
  const updateMeta = useNarrativeStore(s => s.updateMeta);
  const snapToGrid = useUIStore(s => s.snapToGrid);
  const toggleSnapToGrid = useUIStore(s => s.toggleSnapToGrid);
  // ADDED: Phase 3 — cluster mode and cycle action
  const clusterMode = useUIStore(s => s.clusterMode);
  const cycleClusterMode = useUIStore(s => s.cycleClusterMode);
  // ADDED: Phase 4 — route finder dialog toggle (edit-mode only authoring tool)
  const toggleRouteFinderDialog = useUIStore(s => s.toggleRouteFinderDialog);

  const common = useNarrativeStore(s => s.common);
  const choice = useNarrativeStore(s => s.choice);
  const endingNodes = useNarrativeStore(s => s.ending);
  const hasNodes = Object.keys(common).length + Object.keys(choice).length + Object.keys(endingNodes).length > 0;

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const exitCampaign = useSimulationStore(s => s.exitCampaign);
  const resetSimulation = useSimulationStore(s => s.reset);
  // ADDED: Phase 1 — undo button support (AR-14: number primitive, not array reference)
  const traversalRecordsLength = useSimulationStore(s => s.traversalRecords.length);
  const undoLastNode = useSimulationStore(s => s.undoLastNode);
  const newGraph = useNarrativeStore(s => s.newGraph);
  const loadGraph = useNarrativeStore(s => s.loadGraph);
  const exportGraph = useNarrativeStore(s => s.exportGraph);

  const activeCampaignId = useCampaignStore(s => s.activeCampaignId);
  const campaigns = useCampaignStore(s => s.campaigns);
  const clearCampaignsStore = useCampaignStore(s => s.clearCampaigns);
  const loadCampaignsFromObject = useCampaignStore(s => s.loadCampaignsFromObject);
  const activeCampaignName = activeCampaignId && campaigns[activeCampaignId] ? campaigns[activeCampaignId].name : '';

  const [exportStatus, setExportStatus] = useState(false);

  const handleTitleChange = (e) => {
    if (updateMeta) {
      updateMeta({ title: e.target.value });
    }
  };


  const handleExitCampaign = () => {
    exitCampaign();
  };

  const handleResetSimulation = () => {
    resetSimulation();
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
        // NOTE: unrelated issue — not touching in refactor [Violation] 'click' handler took 1682ms
        await clearCampaignsIndexedDB();
        await clearIndexedDB();
        clearCampaignsStore();
        newGraph();
        exitCampaign();
      }
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
    <div className="topbar-content">
      <div className="topbar__left">
        <strong>Branching Routes</strong>
      </div>
      <div className="topbar__center">
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
          className="topbar__title-input"
        />
      </div>
      {/* ADDED: Phase 4 proxy to disable authoring inputs during simulation */}
      <CreationBar disabled={isCampaignActive} />
      {/* PROTECTED: TopBar existing controls and layout preserved */}
      <div className="topbar__right">
        {isCampaignActive && (
          <span style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'orange', marginRight: 6 }}></span>
            {/* MODIFIED: Inject active campaign name label next to Campaign Active */}
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Campaign Active {activeCampaignName ? `— ${activeCampaignName}` : ''}</span>
          </span>
        )}
        <button onClick={handleTidyLayout} disabled={isCampaignActive} className="topbar__btn">
          Tidy Layout
        </button>
        <button onClick={toggleSnapToGrid} className="topbar__btn" disabled={isCampaignActive}>
          Snap: {snapToGrid ? 'ON' : 'OFF'}
        </button>
        {/* ADDED: Phase 3 — cluster mode cycle button (view-only, enabled during campaign) */}
        <button onClick={cycleClusterMode} className="topbar__btn">
          Clusters: {clusterMode.toUpperCase()}
        </button>
        <button className="topbar__btn" disabled={isCampaignActive} onClick={handleNew}>New</button>
        <button className="topbar__btn" disabled={isCampaignActive} onClick={handleImport}>Import</button>
        <button className="topbar__btn" disabled={isCampaignActive} onClick={handleExport}>
          {exportStatus ? "Exported ✓" : "Export"}
        </button>

        {isCampaignActive ? (
          <>
            {/* ADDED: Phase 1 — undo button */}
            <button onClick={undoLastNode} disabled={traversalRecordsLength === 0} className="topbar__btn">
              Undo Step
            </button>
            <button onClick={handleResetSimulation} className="topbar__btn topbar__btn--secondary">
              Reset Simulation
            </button>
            <button onClick={handleExitCampaign} className="topbar__btn topbar__btn--primary">
              Exit Campaign Mode
            </button>
          </>
        ) : (
          <>
            {/* ADDED: Phase 4 — route finder button (edit-mode only authoring tool) */}
            <button onClick={toggleRouteFinderDialog} className="topbar__btn" disabled={!hasNodes}>
              Route Finder
            </button>
            <CampaignSelector />
          </>
        )}
      </div>
    </div>
  );
}
