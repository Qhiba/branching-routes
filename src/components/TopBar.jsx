import React, { useState, useEffect } from 'react';
import {
  Network, Wand2, LayoutGrid, BoxSelect, FilePlus, Upload, Download,
  GitCommit, GitPullRequest, LogIn, LogOut, GitMerge, ChevronDown, Play
} from 'lucide-react';
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

  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const enterCampaign = useSimulationStore(s => s.enterCampaign);
  const exitCampaign = useSimulationStore(s => s.exitCampaign);

  const newGraph = useNarrativeStore(s => s.newGraph);
  const loadGraph = useNarrativeStore(s => s.loadGraph);
  const exportGraph = useNarrativeStore(s => s.exportGraph);

  const campaignsMap = useCampaignStore(s => s.campaigns);
  const setActiveCampaign = useCampaignStore(s => s.setActiveCampaign);
  const clearCampaignsStore = useCampaignStore(s => s.clearCampaigns);
  const loadCampaignsFromObject = useCampaignStore(s => s.loadCampaignsFromObject);

  const campaignsList = Object.values(campaignsMap);
  const firstCampaignId = campaignsList.length > 0 ? campaignsList[0].id : '';

  const [selectedId, setSelectedId] = useState(firstCampaignId);
  const [exportStatus, setExportStatus] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  useEffect(() => {
    if (campaignsList.length > 0 && !campaignsMap[selectedId]) {
      setSelectedId(campaignsList[0].id);
    }
  }, [campaignsMap, selectedId, campaignsList]);

  const handleCreateNode = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
  };

  const handleStartCampaign = () => {
    if (selectedId) {
      const camp = campaignsMap[selectedId];
      if (camp) {
        setActiveCampaign(selectedId);
        enterCampaign(camp);
      }
    }
  };

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
      } else if (err.message === 'invalid_project_structure') {
        alert("The selected file is structurally invalid or missing required node/edge data.");
      } else {
        alert("Failed to import project file: " + err.message);
      }
    }
  };

  const handleExport = async () => {
    try {
      const graphData = exportGraph();
      await exportProject(graphData, campaignsMap, meta?.title || 'branching_routes_project');
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
      <div className="br-topbar">
        {/* Left Side: Logo | Project Name */}
        <div className="br-topbar__section-left">
          <div className="br-topbar__brand">
            <Network className="w-5 h-5" />
            <span>Branching Routes</span>
          </div>

          <div className="br-topbar__divider"></div>

          <div>
            <input
              type="text"
              value={meta?.title || ''}
              onChange={handleTitleChange}
              disabled={isCampaignActive}
              onFocus={(e) => {
                if (e.target.value === 'Untitled Graph') {
                  e.target.select();
                }
              }}
              placeholder="Project Title"
              className="br-topbar__input"
            />
          </div>
        </div>

        {/* Middle Side: Quick Create Nodes | Campaign Selector & Start */}
        <div className="br-topbar__section-center">
          <div className="br-topbar__nodes">
            <button
              onClick={() => handleCreateNode('common')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--common"
              title="Common Node"
              aria-label="Create Common Node"
            >
              <GitCommit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNode('choice')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--choice"
              title="Choice Node"
              aria-label="Create Choice Node"
            >
              <GitPullRequest className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNode('ending')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--ending"
              title="Ending Node"
              aria-label="Create Ending Node"
            >
              <BoxSelect className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNode('warp_entrance')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--warp-entrance"
              title="Warp Entrance"
              aria-label="Create Warp Entrance"
            >
              <LogIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNode('warp_exit')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--warp-exit"
              title="Warp Exit"
              aria-label="Create Warp Exit"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCreateNode('hub')}
              disabled={isCampaignActive}
              className="br-topbar__node-btn br-topbar__node-btn--hub"
              title="Hub Node"
              aria-label="Create Hub Node"
            >
              <GitMerge className="w-4 h-4" />
            </button>
          </div>

          <div className="br-topbar__divider"></div>

          <div className="br-topbar__campaign-start">
            <div className="br-topbar__select-wrap">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="br-topbar__select"
                disabled={isCampaignActive || campaignsList.length === 0}
              >
                {campaignsList.length === 0 && <option value="">No Campaigns</option>}
                {campaignsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 br-topbar__select-icon" />
            </div>
            <button
              onClick={handleStartCampaign}
              className="br-topbar__btn-start"
              disabled={isCampaignActive || campaignsList.length === 0}
            >
              <Play className="br-topbar__play-icon" /> Start
            </button>
          </div>
        </div>

        {/* Right Side: New | Import | Export */}
        <div className="br-topbar__section-right">
          <div className="br-topbar__file-ops">
            <button
              className="br-topbar__file-btn"
              disabled={isCampaignActive}
              onClick={handleNew}
            >
              <FilePlus className="w-3.5 h-3.5" /> New
            </button>
            <button
              className="br-topbar__file-btn"
              disabled={isCampaignActive}
              onClick={handleImport}
            >
              <Download className="w-3.5 h-3.5" /> Import
            </button>
            <button
              className="br-topbar__file-btn"
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
