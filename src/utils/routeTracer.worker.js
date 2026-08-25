import { computeShortestPaths } from './routeTracer.js';

// Web Worker for offloading CPU-heavy route tracing (RISK-AUD-08 Fix)
self.onmessage = (e) => {
  const { id, startNodeId, targetNodeId, graphState, seedFlagValues, priorities, limit, maxDepth } = e.data;
  try {
    const result = computeShortestPaths(
      startNodeId,
      targetNodeId,
      graphState,
      seedFlagValues,
      priorities,
      limit,
      maxDepth
    );
    self.postMessage({ id, success: true, result });
  } catch (err) {
    self.postMessage({ id, success: false, error: err?.message || String(err) });
  }
};
