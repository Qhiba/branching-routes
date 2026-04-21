export { generateId } from './uuid.js';
export { evaluateCondition, evaluateClause } from './conditionEvaluator.js';
export { exportProject, importProject, saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, saveCampaignsToIndexedDB, loadCampaignsFromIndexedDB, clearCampaignsIndexedDB } from './fileSystem.js';
// ADDED: Phase 3 — Route tracing utility exports
// MODIFIED: Phase 4 — add computeShortestPaths export
export { detectDeadEnds, computeForwardReachable, computeShortestPaths } from './routeTracer.js';
