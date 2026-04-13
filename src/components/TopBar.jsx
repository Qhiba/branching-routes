import React, { useState } from 'react';
import { useGraphStore, useSimulationStore, useUIStore } from 'store';
import { exportProject, importProject } from 'utils';
import dagre from 'dagre';

export default function TopBar() {
  const meta = useGraphStore(s => s.meta);
  const updateMeta = useGraphStore(s => s.updateMeta);
  const snapToGrid = useUIStore(s => s.snapToGrid);
  const toggleSnapToGrid = useUIStore(s => s.toggleSnapToGrid);
  const nodes = useGraphStore(s => s.nodes);
  
  const isRunning = useSimulationStore(s => s.isRunning);
  const startSimulation = useSimulationStore(s => s.start);
  const resetSimulation = useSimulationStore(s => s.reset);
  const newGraph = useGraphStore(s => s.newGraph);
  const loadGraph = useGraphStore(s => s.loadGraph);
  const exportGraph = useGraphStore(s => s.exportGraph);

  const [simError, setSimError] = useState(null);
  const [exportStatus, setExportStatus] = useState(false);

  const handleTitleChange = (e) => {
    if (updateMeta) {
      updateMeta({ title: e.target.value });
    }
  };

  const handleStartSimulation = () => {
    try {
      setSimError(null);
      startSimulation();
    } catch (err) {
      setSimError("Set a Start Node first. Select a node and mark as start node.");
      setTimeout(() => setSimError(null), 4000);
    }
  };

  const handleStopSimulation = () => {
    resetSimulation();
  };

  const handleTidyLayout = () => {
    const storeNodes = useGraphStore.getState().nodes;
    const edges = useGraphStore.getState().edges;
    const updateNode = useGraphStore.getState().updateNode;

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

  const handleNew = () => {
    if (window.confirm("Start a new project? Unsaved changes will be lost.")) {
      // NOTE: unrelated issue — not touching in refactor [Violation] 'click' handler took 1682ms
      newGraph();
      resetSimulation();
    }
  };

  const handleImport = async () => {
    try {
      const data = await importProject();
      if (data) {
        loadGraph(data);
        resetSimulation();
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
      await exportProject(graphData, meta?.title || 'branching_routes_project');
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
        {simError && <span style={{ color: 'red', marginLeft: '1rem', fontSize: '0.85rem' }}>{simError}</span>}
      </div>
      <div className="topbar__right">
        {isRunning && (
          <span style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'orange', marginRight: 6 }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Simulation Active</span>
          </span>
        )}
        <button onClick={handleTidyLayout} disabled={isRunning} className="topbar__btn">
          Tidy Layout
        </button>
        <button onClick={toggleSnapToGrid} className="topbar__btn" disabled={isRunning}>
          Snap: {snapToGrid ? 'ON' : 'OFF'}
        </button>
        <button className="topbar__btn" disabled={isRunning} onClick={handleNew}>New</button>
        <button className="topbar__btn" disabled={isRunning} onClick={handleImport}>Import</button>
        <button className="topbar__btn" disabled={isRunning} onClick={handleExport}>
          {exportStatus ? "Exported ✓" : "Export"}
        </button>
        
        {isRunning ? (
          <button onClick={handleStopSimulation} className="topbar__btn topbar__btn--primary">
            Stop Simulation
          </button>
        ) : (
          <button 
            onClick={handleStartSimulation} 
            className="topbar__btn topbar__btn--primary" 
            disabled={nodes.length === 0}
          >
            Start Simulation
          </button>
        )}
      </div>
    </div>
  );
}
