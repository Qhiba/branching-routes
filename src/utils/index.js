export { generateId } from './uuid.js';
export { evaluateCondition, evaluateClause } from './conditionEvaluator.js';
export { exportProject, importProject, saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, saveCampaignsToIndexedDB, loadCampaignsFromIndexedDB, clearCampaignsIndexedDB } from './fileSystem.js';
// ADDED: Phase 3 — Route tracing utility exports
// MODIFIED: Phase 4 & Phase 8 — add computeShortestPaths, computeShortestPathsAsync, cancelRouteWorker exports
export { detectDeadEnds, computeForwardReachable, computeShortestPaths, computeShortestPathsAsync, cancelRouteWorker, simulateFlagStateAlongPath, findMergeGroups, buildRouteSnapshot } from './routeTracer.js';
