import React, { useState, useMemo } from 'react';
import { useNarrativeStore, useSimulationStore, useCampaignStore } from 'store';
import { computeShortestPaths } from 'utils';
import { ChevronRight, Trash2, Pencil, Route, X } from 'lucide-react';
import NameModal from './NameModal';

export default function RightSidebar() {
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Nodes');
  const [nodeGroupTab, setNodeGroupTab] = useState('Common');
  const [searchQuery, setSearchQuery] = useState('');
  const [renameCampaign, setRenameCampaign] = useState(null); // { id, name }
  const [targetNodeId, setTargetNodeId] = useState('');
  const [pathCap, setPathCap] = useState(5);
  const [isTracing, setIsTracing] = useState(false);

  // AR-23: per-slice selectors
  const commonObj = useNarrativeStore(s => s.common);
  const choiceObj = useNarrativeStore(s => s.choice);
  const endingObj = useNarrativeStore(s => s.ending);
  const deleteNode = useNarrativeStore(s => s.deleteNode);

  const campaignDict = useCampaignStore(s => s.campaigns);
  const addCampaign = useCampaignStore(s => s.addCampaign);
  const deleteCampaign = useCampaignStore(s => s.deleteCampaign);
  const updateCampaign = useCampaignStore(s => s.updateCampaign);

  const shortestRouteResults = useSimulationStore(s => s.shortestRouteResults);
  const computeRoutes = useSimulationStore(s => s.computeRoutes);
  const setShortestRouteResults = useSimulationStore(s => s.setShortestRouteResults);
  const clearRouteResults = useSimulationStore(s => s.clearRouteResults);

  const campaigns = Object.values(campaignDict);

  // Flat node list for both the Nodes tab and the route target dropdown
  const allNodes = useMemo(() => [
    ...Object.values(commonObj).map(n => ({ id: n.id, name: n.data?.label || 'Untitled', type: 'Common' })),
    ...Object.values(choiceObj).map(n => ({ id: n.id, name: n.data?.label || 'Untitled', type: 'Choice' })),
    ...Object.values(endingObj).map(n => ({ id: n.id, name: n.data?.label || 'Untitled', type: 'Ending' })),
  ], [commonObj, choiceObj, endingObj]);

  const filteredNodes = useMemo(() => {
    const byType = allNodes.filter(n => n.type === nodeGroupTab);
    if (!searchQuery.trim()) return byType;
    return byType.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allNodes, nodeGroupTab, searchQuery]);

  const handleTabClick = (tabId) => {
    if (activeTab === tabId && isOpen) {
      setIsOpen(false);
    } else {
      setActiveTab(tabId);
      setIsOpen(true);
    }
  };

  // AR-19: dispatch canvas-open-node-modal; nodeId signals edit vs. create
  const handleEditNode = (id, type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', {
      detail: { nodeType: type.toLowerCase(), nodeId: id }
    }));
  };

  // AR-24: use correct writer based on campaign mode
  const handleRunTrace = async () => {
    if (!targetNodeId) return;
    setIsTracing(true);
    const cap = Math.min(pathCap || 5, 50);
    if (isCampaignActive) {
      computeRoutes(targetNodeId, [], cap);
    } else {
      const graphState = useNarrativeStore.getState();
      const allStoreNodes = [
        ...Object.values(graphState.common || {}),
        ...Object.values(graphState.choice || {}),
        ...Object.values(graphState.ending || {}),
      ];
      const startNode = allStoreNodes.find(n => n.data?.isStartNode);
      if (startNode) {
        const currentFlagValues = {};
        Object.values(graphState.flag || {}).forEach(f => { currentFlagValues[f.id] = f.state; });
        Object.values(graphState.status || {}).forEach(s => { currentFlagValues[s.id] = s.value; });
        const result = computeShortestPaths(startNode.id, targetNodeId, graphState, currentFlagValues, [], cap);
        setShortestRouteResults(result.paths);
      }
    }
    setIsTracing(false);
  };

  const nodeAccentColor = (type) => {
    if (type === 'Choice') return 'var(--color-node-choice)';
    if (type === 'Ending') return 'var(--color-node-ending)';
    return 'var(--color-node-common)';
  };

  const tabs = [
    { id: 'Nodes', label: 'Nodes' },
    { id: 'Route Tracing', label: 'Route\nTracing' },
    { id: 'Campaign List', label: 'Campaign\nList' },
  ];

  return (
    <>
      <div
        className="sidebar-container sidebar-container--right"
        style={{
          width: isOpen ? '362px' : '42px',
          opacity: isCampaignActive ? 0.5 : 1,
          pointerEvents: isCampaignActive ? 'none' : 'auto',
        }}
      >
        {/* Panel first — reversed order so rail stays pinned at right edge as container expands left */}
        <div className="sidebar-panel">
          <div className="sidebar-panel__header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="sidebar-panel__title">{activeTab}</h3>
              <button
                className="topbar__control-btn"
                style={{ padding: '4px' }}
                onClick={() => setIsOpen(false)}
              >
                <ChevronRight className="topbar__control-icon" />
              </button>
            </div>
          </div>

          <div className="sidebar-panel__content" style={{ padding: 0 }}>

              {/* ── Nodes tab ── */}
              {activeTab === 'Nodes' && (
                <>
                  <div className="node-group-tabs">
                    {['Common', 'Choice', 'Ending'].map(group => (
                      <button
                        key={group}
                        className={`node-group-tab ${nodeGroupTab === group ? 'node-group-tab--active' : ''}`}
                        onClick={() => setNodeGroupTab(group)}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: '12px 16px 0' }}>
                    <input
                      type="text"
                      placeholder={`Search ${nodeGroupTab} nodes...`}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="sidebar-panel__search"
                    />
                  </div>
                  <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                    {filteredNodes.map(node => (
                      <div
                        key={node.id}
                        className="entity-list-card"
                        style={{ borderLeft: `3px solid ${nodeAccentColor(node.type)}` }}
                      >
                        <div className="entity-list-card__info">
                          <div className="entity-list-card__name">{node.name}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {node.type}
                          </div>
                        </div>
                        <div className="entity-list-card__actions">
                          <button
                            className="entity-list-card__action-btn"
                            onClick={() => handleEditNode(node.id, node.type)}
                            title="Edit"
                          >
                            <Pencil style={{ width: '12px', height: '12px' }} />
                          </button>
                          <button
                            className="entity-list-card__action-btn entity-list-card__action-btn--danger"
                            onClick={() => deleteNode(node.id)}
                            title="Delete"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredNodes.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', padding: '24px 0' }}>
                        No {nodeGroupTab} nodes
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Route Tracing tab ── */}
              {activeTab === 'Route Tracing' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {shortestRouteResults ? (
                    <>
                      <button
                        onClick={clearRouteResults}
                        className="topbar__action-btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <X style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                        Clear Results
                      </button>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Paths Found ({shortestRouteResults.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                        {shortestRouteResults.map((path, i) => (
                          <div key={i} className="entity-list-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <div className="entity-list-card__name">Path {i + 1}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                              {path.length} step{path.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                          Target Node
                        </label>
                        <select
                          value={targetNodeId}
                          onChange={e => setTargetNodeId(e.target.value)}
                          className="sidebar-panel__search"
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="">Select a node...</option>
                          {allNodes.map(n => (
                            <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                          Path Cap <span style={{ fontWeight: 'normal', textTransform: 'none', opacity: 0.7 }}>(max 50)</span>
                        </label>
                        <input
                          type="number"
                          value={pathCap}
                          min={1}
                          max={50}
                          onChange={e => setPathCap(Number(e.target.value))}
                          className="sidebar-panel__search"
                        />
                      </div>
                      <button
                        onClick={handleRunTrace}
                        disabled={!targetNodeId || isTracing}
                        className="topbar__action-btn"
                        style={{
                          background: 'var(--color-accent)',
                          color: '#fff',
                          width: '100%',
                          justifyContent: 'center',
                          border: 'none',
                          opacity: (!targetNodeId || isTracing) ? 0.5 : 1,
                          cursor: (!targetNodeId || isTracing) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Route style={{ width: '13px', height: '13px', marginRight: '6px' }} />
                        {isTracing ? 'Tracing...' : 'Run Trace'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Campaign List tab ── */}
              {activeTab === 'Campaign List' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <CampaignAddRow onAdd={addCampaign} />
                  <div style={{ height: '1px', background: 'var(--color-border)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                    {campaigns.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', padding: '24px 0' }}>
                        No campaigns yet
                      </div>
                    )}
                    {campaigns.map(camp => (
                      <div key={camp.id} className="entity-list-card">
                        <div className="entity-list-card__info">
                          <div className="entity-list-card__name">{camp.name}</div>
                        </div>
                        <div className="entity-list-card__actions">
                          <button
                            className="entity-list-card__action-btn"
                            onClick={() => setRenameCampaign({ id: camp.id, name: camp.name })}
                            title="Rename"
                          >
                            <Pencil style={{ width: '12px', height: '12px' }} />
                          </button>
                          <button
                            className="entity-list-card__action-btn entity-list-card__action-btn--danger"
                            onClick={() => deleteCampaign(camp.id)}
                            title="Delete"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        {/* Rail — after panel so it stays pinned at the right edge */}
        <div className="sidebar-rail">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`nameplate-tab ${activeTab === tab.id && isOpen ? 'nameplate-tab--active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.id}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {renameCampaign && (
        <NameModal
          entityType="campaign"
          editItem={{ name: renameCampaign.name }}
          onClose={() => setRenameCampaign(null)}
          onConfirm={(newName) => {
            updateCampaign(renameCampaign.id, { name: newName });
            setRenameCampaign(null);
          }}
        />
      )}
    </>
  );
}

function CampaignAddRow({ onAdd }) {
  const [newName, setNewName] = useState('');
  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
  };
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        placeholder="New campaign name..."
        value={newName}
        onChange={e => setNewName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        className="sidebar-panel__search"
        style={{ flex: 1 }}
      />
      <button
        onClick={handleAdd}
        style={{ padding: '6px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}
      >
        +
      </button>
    </div>
  );
}
