/**
 * useSimulator — reusable hook for simulation logic.
 *
 * Extracted from Simulator.jsx so both the standalone Simulator tab
 * and the integrated RouteViewer panel can share the same engine.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useEditorData } from '../context/EditorContext';
import { evaluateGroup } from '../utils/conditionUtils';

export default function useSimulator() {
  const { flags, choices, scenes, endings, statusPoints, entryNode } = useEditorData();

  const [historyStack, setHistoryStack] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [startingNodeId, setStartingNodeId] = useState(null);

  const snapshotsRef = useRef({});

  // Clear snapshots if flag/status definitions change
  useEffect(() => {
    snapshotsRef.current = {};
  }, [flags, statusPoints]);

  // Derive active state from history stack (with snapshot caching)
  const activeState = useMemo(() => {
    let baseline = null;
    let startIndex = 0;

    for (let i = historyStack.length - 1; i >= 0; i--) {
      if (snapshotsRef.current[i]) {
        baseline = {
          flags: { ...snapshotsRef.current[i].flags },
          status: { ...snapshotsRef.current[i].status },
        };
        startIndex = i + 1;
        break;
      }
    }

    if (!baseline) {
      baseline = { flags: {}, status: {} };
      Object.keys(flags).forEach((f) => (baseline.flags[f] = false));
      Object.values(statusPoints || {}).forEach(
        (sp) => (baseline.status[sp.id] = Number(sp.value))
      );
    }

    for (let i = startIndex; i < historyStack.length; i++) {
      const step = historyStack[i];
      (step.flagsPushed || []).forEach((fId) => {
        baseline.flags[fId] = true;
      });
      (step.statusPushed || []).forEach((sm) => {
        const spDef = statusPoints && statusPoints[sm.status];
        const minVal = spDef && spDef.minValue !== undefined ? spDef.minValue : -999999;
        baseline.status[sm.status] = Math.max(
          minVal,
          (baseline.status[sm.status] || 0) + sm.amount
        );
      });

      if (i > 0 && i % 50 === 0 && !snapshotsRef.current[i]) {
        snapshotsRef.current[i] = {
          flags: { ...baseline.flags },
          status: { ...baseline.status },
        };
      }
    }

    return baseline;
  }, [flags, statusPoints, historyStack]);

  const passesRequires = useCallback(
    (requires) => {
      return evaluateGroup(requires, activeState);
    },
    [activeState]
  );

  const traverseNext = useCallback(
    (targetId, flagsToPush = [], statusToPush = [], optIndex = null) => {
      if (!targetId) {
        setHistoryStack((prev) => [
          ...prev,
          {
            nodeId: currentNodeId,
            type: 'loop',
            flagsPushed: flagsToPush,
            statusPushed: statusToPush,
            optionIndex: optIndex,
          },
        ]);
        return;
      }

      const type = scenes[targetId]
        ? 'scene'
        : choices[targetId]
          ? 'choice'
          : endings[targetId]
            ? 'ending'
            : 'unknown';
      if (type === 'unknown') {
        alert(`Target ID not found: ${targetId}`);
        return;
      }

      setCurrentNodeId(targetId);
      setHistoryStack((prev) => [
        ...prev,
        { nodeId: targetId, type, flagsPushed: flagsToPush, statusPushed: statusToPush },
      ]);
    },
    [currentNodeId, scenes, choices, endings]
  );

  const handleStart = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      const type = scenes[nodeId]
        ? 'scene'
        : choices[nodeId]
          ? 'choice'
          : endings[nodeId]
            ? 'ending'
            : 'unknown';
      setCurrentNodeId(nodeId);
      setHistoryStack([{ nodeId, type, flagsPushed: [], statusPushed: [] }]);
      setStartingNodeId(nodeId);
    },
    [scenes, choices, endings]
  );

  const handleOptionSelect = useCallback(
    (choiceObj, optIndex) => {
      const opt = choiceObj.options[optIndex];
      if (!passesRequires(opt.requires)) return;

      const nextArr = Array.isArray(opt.next)
        ? opt.next
        : opt.next
          ? [{ requires: [], target: opt.next }]
          : [];

      const validRoute = nextArr.find(entry => passesRequires(entry.requires || []));
      const target = validRoute ? validRoute.target : null;

      traverseNext(
        target || null,
        opt.flags_set || [],
        opt.status_set || [],
        optIndex
      );
    },
    [passesRequires, traverseNext]
  );

  const handleSceneContinue = useCallback(
    (sceneObj) => {
      const nextArr = sceneObj.next || [];
      if (nextArr.length === 0) {
        alert('End of the line. No routes defined for this Scene.');
        return;
      }
      const validRoute = nextArr.find((route) => passesRequires(route.requires));
      if (validRoute) {
        traverseNext(
          validRoute.target,
          sceneObj.flags_set || [],
          sceneObj.status_set || []
        );
      } else {
        alert('Dead End: No available routes pass the current flag conditions.');
      }
    },
    [passesRequires, traverseNext]
  );

  const handleUndo = useCallback(() => {
    if (historyStack.length <= 1) {
      handleStop();
      return;
    }
    const newStack = historyStack.slice(0, -1);
    const lastNode = [...newStack].reverse().find((step) => step.type !== 'loop');
    setHistoryStack(newStack);
    setCurrentNodeId(lastNode ? lastNode.nodeId : null);
  }, [historyStack]);

  const handleStop = useCallback(() => {
    setHistoryStack([]);
    setCurrentNodeId(null);
    setStartingNodeId(null);
  }, []);

  const handleRevive = useCallback(() => {
    if (startingNodeId) {
      const type = scenes[startingNodeId]
        ? 'scene'
        : choices[startingNodeId]
          ? 'choice'
          : endings[startingNodeId]
            ? 'ending'
            : 'unknown';
      setCurrentNodeId(startingNodeId);
      setHistoryStack([{ nodeId: startingNodeId, type, flagsPushed: [], statusPushed: [] }]);
    }
  }, [startingNodeId, scenes, choices, endings]);

  // Derived: visited node IDs (unique non-loop entries)
  const visitedNodeIds = useMemo(() => {
    const set = new Set();
    for (const step of historyStack) {
      if (step.type !== 'loop') set.add(step.nodeId);
    }
    return set;
  }, [historyStack]);

  // Derived: taken edge IDs
  const takenEdgeIds = useMemo(() => {
    const set = new Set();
    for (let i = 0; i < historyStack.length - 1; i++) {
      const from = historyStack[i];
      const to = historyStack[i + 1];
      if (from.type === 'loop' || to.type === 'loop') continue;
      // Scene edges: sourceId-next-routeIdx
      if (from.type === 'scene' && scenes[from.nodeId]) {
        const scene = scenes[from.nodeId];
        if (scene.next) {
          const routeIdx = scene.next.findIndex((r) => r.target === to.nodeId);
          if (routeIdx >= 0) {
            const route = scene.next[routeIdx];
            const routeIdPart = route?._id || routeIdx;
            set.add(`${from.nodeId}-next-${routeIdPart}`);
          }
        }
      }
      // Choice edges: sourceId-opt-optIdx
      if (from.type === 'choice' && choices[from.nodeId]) {
        const choice = choices[from.nodeId];
        if (choice.options) {
          for (let optIdx = 0; optIdx < choice.options.length; optIdx++) {
            const opt = choice.options[optIdx];
            const nextArr = Array.isArray(opt.next)
              ? opt.next
              : opt.next
                ? [{ requires: [], target: opt.next }]
                : [];
            const matchIdx = nextArr.findIndex(entry => entry.target === to.nodeId);
            if (matchIdx >= 0) {
              const optIdPart = opt?.id || optIdx;
              set.add(`${choice.id}-opt-${optIdPart}`);
              break;
            }
          }
        }
      }
    }
    return set;
  }, [historyStack, scenes, choices]);

  const isRunning = historyStack.length > 0;

  return {
    // State
    currentNodeId,
    startingNodeId,
    historyStack,
    activeState,
    isRunning,
    visitedNodeIds,
    takenEdgeIds,
    // Data refs
    flags,
    choices,
    scenes,
    endings,
    statusPoints,
    entryNode,
    // Actions
    passesRequires,
    handleStart,
    handleOptionSelect,
    handleSceneContinue,
    handleUndo,
    handleStop,
    handleRevive,
  };
}
