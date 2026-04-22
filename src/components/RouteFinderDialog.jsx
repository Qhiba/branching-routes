import React, { useState, useEffect, useMemo } from 'react';
import { useNarrativeStore, useUIStore, useSimulationStore } from 'store';

export default function RouteFinderDialog() {
  const showRouteFinderDialog = useUIStore(s => s.showRouteFinderDialog);
  const toggleRouteFinderDialog = useUIStore(s => s.toggleRouteFinderDialog);
  const toggleShortestRouteOverlay = useUIStore(s => s.toggleShortestRouteOverlay);
  const showShortestRouteOverlay = useUIStore(s => s.showShortestRouteOverlay);
  const selectedNodeId = useUIStore(s => s.selectedNodeId);

  const computeRoutesFromStart = useSimulationStore(s => s.computeRoutesFromStart);

  const common = useNarrativeStore(s => s.common || {});
  const choice = useNarrativeStore(s => s.choice || {});
  const ending = useNarrativeStore(s => s.ending || {});
  const flag = useNarrativeStore(s => s.flag || {});
  const status = useNarrativeStore(s => s.status || {});
  const chapter = useNarrativeStore(s => s.chapter || {});
  const path = useNarrativeStore(s => s.path || {});
  const edges = useNarrativeStore(s => s.edges || []);

  const [priorities, setPriorities] = useState([]);
  const [pathCap, setPathCap] = useState(5);

  const handleClose = () => {
    toggleRouteFinderDialog();
    setPriorities([]);
    setPathCap(5);
  };

  useEffect(() => {
    if (!showRouteFinderDialog) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showRouteFinderDialog]);

  const allNodes = useMemo(() => [
    ...Object.values(common),
    ...Object.values(choice),
    ...Object.values(ending)
  ], [common, choice, ending]);

  const startNode = useMemo(() =>
    allNodes.find(n => n.data?.isStartNode),
    [allNodes]
  );

  const targetNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return common[selectedNodeId] || choice[selectedNodeId] || ending[selectedNodeId] || null;
  }, [selectedNodeId, common, choice, ending]);

  const targetNodeContext = useMemo(() => {
    if (!targetNode) return null;
    const chapterName = targetNode.data?.chapterId && chapter[targetNode.data.chapterId] ? chapter[targetNode.data.chapterId].name : null;
    const pathName = targetNode.data?.pathId && path[targetNode.data.pathId] ? path[targetNode.data.pathId].name : null;
    return { chapterName, pathName };
  }, [targetNode, chapter, path]);

  const availablePriorities = useMemo(() => {
    const items = [];
    Object.entries(flag).forEach(([id, data]) => {
      items.push({ id, name: data.name || 'Unnamed', type: 'flag', preferredValue: true });
    });
    Object.entries(status).forEach(([id, data]) => {
      items.push({ id, name: data.name || 'Unnamed', type: 'status', preferredValue: 0 });
    });
    return items;
  }, [flag, status]);

  const handleRun = () => {
    if (!selectedNodeId || !startNode) return;
    const cappedLimit = Math.min(parseInt(pathCap) || 5, 50);

    computeRoutesFromStart(startNode.id, selectedNodeId, priorities, cappedLimit);

    if (!showShortestRouteOverlay) {
      toggleShortestRouteOverlay();
    }

    handleClose();
  };

  const handleAddPriority = (priorityItem) => {
    if (priorities.some(p => p.id === priorityItem.id)) return;
    setPriorities([...priorities, { id: priorityItem.id, preferredValue: priorityItem.preferredValue }]);
  };

  const handleRemovePriority = (id) => {
    setPriorities(priorities.filter(p => p.id !== id));
  };

  const handleUpdatePriorityValue = (id, newValue) => {
    setPriorities(priorities.map(p => p.id === id ? { ...p, preferredValue: newValue } : p));
  };

  if (!showRouteFinderDialog) return null;

  if (!selectedNodeId || !targetNode) {
    return (
      <div className="route-finder-dialog__backdrop">
        <div className="route-finder-dialog">
          <div className="route-finder-dialog__header">
            <h3>Route Finder</h3>
            <button className="route-finder-dialog__close" onClick={handleClose}>✕</button>
          </div>
          <div className="route-finder-dialog__body">
            <div className="route-finder-dialog__stale-banner">
              Select a target node on the canvas first
            </div>
          </div>
          <div className="route-finder-dialog__footer">
            <button
              className="route-finder-dialog__button route-finder-dialog__button--secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="route-finder-dialog__backdrop">
      <div className="route-finder-dialog">
        <div className="route-finder-dialog__header">
          <h3>Route Finder</h3>
          <button className="route-finder-dialog__close" onClick={handleClose}>✕</button>
        </div>

        <div className="route-finder-dialog__body">
          <div className="route-finder-dialog__section">
            <label className="route-finder-dialog__label">Target Node</label>
            <div className="route-finder-dialog__selected-target">
              <div className="route-finder-dialog__result-label">{targetNode.data.label || 'Unnamed'}</div>
              <div className="route-finder-dialog__result-context">
                {targetNodeContext?.chapterName && <span>{targetNodeContext.chapterName}</span>}
                {targetNodeContext?.pathName && <span>{targetNodeContext.pathName}</span>}
              </div>
            </div>
          </div>

          <div className="route-finder-dialog__section">
            <label className="route-finder-dialog__label">Tie-breaking Priorities (Optional)</label>
            <div className="route-finder-dialog__priority-list">
              {priorities.map(priority => {
                const item = availablePriorities.find(p => p.id === priority.id);
                if (!item) return null;
                return (
                  <div key={priority.id} className="route-finder-dialog__priority-item">
                    <span className="route-finder-dialog__priority-name">{item.name}</span>
                    {item.type === 'flag' ? (
                      <select
                        value={priority.preferredValue}
                        onChange={(e) => handleUpdatePriorityValue(priority.id, e.target.value === 'true')}
                        className="route-finder-dialog__priority-select"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={priority.preferredValue}
                        onChange={(e) => handleUpdatePriorityValue(priority.id, parseInt(e.target.value) || 0)}
                        className="route-finder-dialog__priority-input"
                      />
                    )}
                    <button
                      onClick={() => handleRemovePriority(priority.id)}
                      className="route-finder-dialog__priority-remove"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            {availablePriorities.length > priorities.length && (
              <div className="route-finder-dialog__add-priority">
                <select
                  onChange={(e) => {
                    const item = availablePriorities.find(p => p.id === e.target.value);
                    if (item) handleAddPriority(item);
                    e.target.value = '';
                  }}
                  className="route-finder-dialog__add-priority-select"
                >
                  <option value="">+ Add Priority</option>
                  {availablePriorities
                    .filter(p => !priorities.some(pr => pr.id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="route-finder-dialog__section">
            <label className="route-finder-dialog__label">Path Cap (max 50)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={pathCap}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 5;
                val = Math.min(val, 50);
                val = Math.max(val, 1);
                setPathCap(val);
              }}
              className="route-finder-dialog__cap-input"
            />
          </div>
        </div>

        <div className="route-finder-dialog__footer">
          <button
            className="route-finder-dialog__button route-finder-dialog__button--secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="route-finder-dialog__button route-finder-dialog__button--primary"
            onClick={handleRun}
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
