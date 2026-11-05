export { generateId } from './uuid.js';
export { evaluateCondition, evaluateClause } from './conditionEvaluator.js';
export { exportProject, importProject, saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, saveCampaignsToIndexedDB, loadCampaignsFromIndexedDB, clearCampaignsIndexedDB, migrateGraph, CURRENT_SCHEMA_VERSION } from './fileSystem.js';
// ADDED: Phase 3 — Route tracing utility exports
// MODIFIED: Phase 4 & Phase 8 — add computeShortestPaths, computeShortestPathsAsync, cancelRouteWorker exports
export { detectDeadEnds, computeForwardReachable, computeShortestPaths, computeShortestPathsAsync, cancelRouteWorker, simulateFlagStateAlongPath, findMergeGroups, buildRouteSnapshot } from './routeTracer.js';
// ADDED: Snap Assist — pure snap math utilities
export { computeSnapGuides, getSnappedPosition, getActiveGuides, applyAxisLock } from './snapGuides.js';
// ADDED (Redesign Step 4): dialog Enter-to-confirm rule; route colours for JS-painted canvas elements
export { isConfirmEnter } from './dialogKeys.js';
export { ROUTE_MARK_COLORS, EDGE_COLOR, miniMapNodeColor } from './nodeColors.js';
// ADDED (Redesign Step 5): align / distribute math for multi-selection
export { computeAlignment, ALIGN_MODES } from './alignNodes.js';
// ADDED (Redesign Step 6): unified search + shared canvas filter predicate
export { searchGraph, nodeMatchesFilters, nodeRouteType, listNodes, describeClause, describeCondition, countActiveFilters, ROUTE_TYPE_LABELS } from './searchIndex.js';
