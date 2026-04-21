import { useMemo, useState, useEffect, useRef } from 'react';
import {
  TopBar,
  LeftSidebar,
  GraphCanvas,
  RightSidebar,
  Toast,
  CommandPalette,
  RouteFinderDialog,
  GlobalStatusStrip,
  NodeConfigModal,
} from 'components';
import { useNarrativeStore, useSimulationStore, useUIStore } from 'store';
import { detectDeadEnds } from 'utils';
import './App.css';

// AR-14 / AR-23 — all selectors are per-slice primitives; no whole-store destructuring.

export default function App() {
  // ── Narrative counts (AR-14: Object.keys(...).length keeps selector stable) ──
  const commonCount = useNarrativeStore(s => Object.keys(s.common).length);
  const choiceCount = useNarrativeStore(s => Object.keys(s.choice).length);
  const endingCount = useNarrativeStore(s => Object.keys(s.ending).length);
  const flagCount = useNarrativeStore(s => Object.keys(s.flag).length);
  const statusCount = useNarrativeStore(s => Object.keys(s.status).length);
  const pathCount = useNarrativeStore(s => Object.keys(s.path).length);
  const chapterCount = useNarrativeStore(s => Object.keys(s.chapter).length);

  // ── Campaign mode ──
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

  // ── Campaign stats ──
  const seenCount = useSimulationStore(s => s.seenNodeIds.length);
  const traversedCount = useSimulationStore(s => s.traversedEdgeIds.length);
  const activeNodeId = useSimulationStore(s => s.activeNodeId);
  const seenNodeIds = useSimulationStore(s => s.seenNodeIds);

  // Sub-collections for derivations + NodeConfigModal dropdown lists
  const common = useNarrativeStore(s => s.common);
  const choice = useNarrativeStore(s => s.choice);
  const ending = useNarrativeStore(s => s.ending);
  const edges = useNarrativeStore(s => s.edges);

  // Per-slice entity lists for NodeConfigModal dropdowns (AR-23)
  const chapterObj = useNarrativeStore(s => s.chapter);
  const pathObj = useNarrativeStore(s => s.path);
  const flagObj = useNarrativeStore(s => s.flag);
  const statusObj = useNarrativeStore(s => s.status);

  // ── Overlay ──
  const overlayOn = useUIStore(s => s.showTraversalOverlay);
  const toggleOverlay = useUIStore(s => s.toggleTraversalOverlay);

  // ── NodeConfigModal state ──
  // nodeConfig holds { type, nodeId, pendingPosition } when opening for a new node
  // or { type, nodeId, pendingPosition: null } when editing an existing node.
  const [nodeConfig, setNodeConfig] = useState(null);


  // Ref so the DOM event listener always sees the latest isCampaignActive without
  // recreating the listener on every campaign-mode change (avoids stale closure)
  const campaignRef = useRef(isCampaignActive);
  useEffect(() => { campaignRef.current = isCampaignActive; }, [isCampaignActive]);

  // Listen for canvas-open-node-modal DOM events (fired by keyboard, CreationBar,
  // context menu, double-click-pane, CommandPalette). AR-19 compliant — event bus
  // used because GraphCanvas lives inside ReactFlowProvider and cannot call App state.
  useEffect(() => {
    const handleOpenNodeModal = (e) => {
      if (campaignRef.current) return; // guard: no creation during campaign
      const { nodeType, nodeId = null, screenX, screenY } = e.detail;
      // Capitalise first letter: 'common' -> 'Common', etc.
      const displayType = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
      setNodeConfig({
        type: displayType,
        nodeId,                 // null = new node, string = edit existing
        pendingPosition: (!nodeId && screenX !== undefined && screenY !== undefined)
          ? { screenX, screenY }
          : null,
      });
    };
    window.addEventListener('canvas-open-node-modal', handleOpenNodeModal);
    return () => window.removeEventListener('canvas-open-node-modal', handleOpenNodeModal);
  }, []); // stable — campaignRef handles live value

  // ── Derived campaign stats ──
  const totalNodes = useMemo(
    () => Object.keys(common).length + Object.keys(choice).length + Object.keys(ending).length,
    [common, choice, ending]
  );

  const endingsReached = useMemo(() => {
    const seenEndings = seenNodeIds.filter(id => !!ending[id]).length;
    const activeIsEnding = isCampaignActive && !!ending[activeNodeId];
    return seenEndings + (activeIsEnding ? 1 : 0);
  }, [seenNodeIds, ending, isCampaignActive, activeNodeId]);

  const deadEnds = useMemo(
    () => detectDeadEnds({ common, choice, ending, edges }).length,
    [common, choice, ending, edges]
  );

  const campaignStats = isCampaignActive
    ? {
      visitedNodes: seenCount + 1,
      totalNodes,
      endingsReached,
      totalEndings: endingCount,
      edgesTraversed: traversedCount,
      totalEdges: edges.length,
      deadEnds,
    }
    : null;

  const counts = {
    common: commonCount,
    choice: choiceCount,
    ending: endingCount,
    flags: flagCount,
    statuses: statusCount,
    paths: pathCount,
    chapters: chapterCount,
  };

  // ── initialData: for new nodes = null (empty form); for existing = look up from store ──
  // FIX: Only derive initialData from an explicit nodeId set in nodeConfig (edit flow).
  // Previously this fell back to selectedNodeId, which caused new-node creation to
  // accidentally pre-fill and overwrite whatever node was selected on the canvas.
  const editNodeId = nodeConfig?.nodeId ?? null;
  const existingNode = editNodeId
    ? (common[editNodeId] || choice[editNodeId] || ending[editNodeId])
    : null;

  const initialData = existingNode
    ? {
      label: existingNode.data?.label ?? '',
      description: existingNode.data?.content ?? '',
      chapterId: existingNode.data?.chapterId ?? null,
      pathId: existingNode.data?.pathId ?? null,
      isStartNode: existingNode.data?.isStartNode ?? false,
    }
    : null;

  // ── onSave: create node (new) or update (existing) ──
  const handleNodeConfigSave = (id, data) => {
    const store = useNarrativeStore.getState();
    const { selectNode } = useUIStore.getState();

    if (!id) {
      // NEW node flow — add to store at the pending position.
      // Position resolution: if we have screen coords dispatch back into the canvas
      // event bus so GraphCanvas can screenToFlowPosition(); otherwise use canvas center.
      const lowerType = nodeConfig?.type?.toLowerCase() ?? 'common';
      const pendingPos = nodeConfig?.pendingPosition;

      // Dispatch node-add event with position info the canvas can resolve
      const addEvent = new CustomEvent('canvas-add-node-from-modal', {
        detail: {
          nodeType: lowerType,
          screenX: pendingPos?.screenX,
          screenY: pendingPos?.screenY,
          label: data.label || undefined,
          chapterId: data.chapterId || null,
          pathId: data.pathId || null,
          isStartNode: !!data.isStartNode,
          description: data.description || '',
        }
      });
      window.dispatchEvent(addEvent);
    } else {
      // EDIT existing node
      store.updateNode(id, {
        data: {
          label: data.label,
          content: data.description,
          chapterId: data.chapterId,
          pathId: data.pathId,
        }
      });
      if (data.isStartNode && !existingNode?.data?.isStartNode) {
        store.setStartNode(id);
      }
    }
  };

  // Determine the active node type for the modal when config is set
  const activeNodeType = nodeConfig?.type ?? null;

  return (
    <div className="app">
      <header className="app__topbar">
        <TopBar />
      </header>

      <LeftSidebar />

      <main className="app__canvas">
        <GraphCanvas />
      </main>
      <RightSidebar />
      <footer className="app__statusbar">
        <GlobalStatusStrip
          counts={counts}
          campaignMode={isCampaignActive}
          campaignStats={campaignStats}
          overlayOn={overlayOn}
          onToggleOverlay={toggleOverlay}
        />
      </footer>

      {/* NodeConfigModal — intercepts all canvas-open-node-modal events.
          New nodes are not committed to the store until the user clicks Save.
          Key forces a clean remount so useState picks up fresh initialData. */}
      <NodeConfigModal
        key={nodeConfig ? `ncm-${nodeConfig.nodeId || 'new'}-${nodeConfig.type}` : 'ncm-closed'}
        nodeType={activeNodeType}
        nodeId={nodeConfig?.nodeId ?? null}
        onClose={() => setNodeConfig(null)}
        onSave={handleNodeConfigSave}
        chapters={Object.values(chapterObj)}
        paths={Object.values(pathObj)}
        flags={Object.values(flagObj)}
        statuses={Object.values(statusObj)}
        initialData={initialData}
      />

      <Toast />
      <CommandPalette />
      <RouteFinderDialog />
    </div>
  );
}
