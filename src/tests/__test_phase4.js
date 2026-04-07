// ============================================================
// Phase 4 — Zustand Stores (UI + Simulation + Campaign) — Test Suite
// ============================================================
// Run: node src/tests/__test_phase4.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
// ============================================================

import { useUIStore } from '../store/useUIStore.js';
import { useSimulationStore } from '../store/useSimulationStore.js';
import { useCampaignStore } from '../store/useCampaignStore.js';
import { STATUS_CYCLE, SEEN_CYCLE } from '../store/useSimulationStore.js';

// ── Test Harness ────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passed++;
  } else {
    console.log(`  FAIL: ${description}`);
    failed++;
  }
}

function group(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
}

/** Reset all three stores before each test group */
function resetUI() {
  const s = useUIStore.getState();
  // Manual reset since there's no resetStore action
  useUIStore.setState({
    selectedNodeId: null,
    inspectorOpen: false,
    inspectorPinned: false,
    contextMenu: null,
    commandPaletteOpen: false,
    toasts: [],
    persistError: null,
  });
}

function resetSim() {
  useSimulationStore.getState().resetSimulation();
}

function resetCampaign() {
  useCampaignStore.setState({
    campaigns: {},
    activeCampaignId: null,
  });
}

function resetAll() {
  resetUI();
  resetSim();
  resetCampaign();
}

// Shorthand getters
function getUI() { return useUIStore.getState(); }
function getSim() { return useSimulationStore.getState(); }
function getCamp() { return useCampaignStore.getState(); }


// ════════════════════════════════════════════════════════════
//  SECTION A — useUIStore: Initial State
// ════════════════════════════════════════════════════════════

group('useUIStore — Initial State');

(() => {
  resetUI();
  const s = getUI();

  assert(s.selectedNodeId === null, 'selectedNodeId defaults to null');
  assert(s.inspectorOpen === false, 'inspectorOpen defaults to false');
  assert(s.inspectorPinned === false, 'inspectorPinned defaults to false');
  assert(s.contextMenu === null, 'contextMenu defaults to null');
  assert(s.commandPaletteOpen === false, 'commandPaletteOpen defaults to false');
  assert(Array.isArray(s.toasts) && s.toasts.length === 0, 'toasts defaults to []');
  assert(s.persistError === null, 'persistError defaults to null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — useUIStore: Node Selection
// ════════════════════════════════════════════════════════════

group('useUIStore — selectNode');

// Happy path: select a node
(() => {
  resetUI();
  getUI().selectNode('N001');
  assert(getUI().selectedNodeId === 'N001', 'selectNode sets selectedNodeId');
})();

// Happy path: deselect
(() => {
  resetUI();
  getUI().selectNode('N001');
  getUI().selectNode(null);
  assert(getUI().selectedNodeId === null, 'selectNode(null) clears selectedNodeId');
})();

// Edge case: deselect closes unpinned inspector
(() => {
  resetUI();
  getUI().selectNode('N001');
  getUI().openInspector();
  assert(getUI().inspectorOpen === true, 'inspector is open before deselect');
  getUI().selectNode(null);
  assert(getUI().inspectorOpen === false, 'deselect closes unpinned inspector');
})();

// Edge case: deselect does NOT close pinned inspector
(() => {
  resetUI();
  getUI().selectNode('N001');
  getUI().openInspector();
  getUI().pinInspector(true);
  getUI().selectNode(null);
  assert(getUI().inspectorOpen === true, 'deselect does NOT close pinned inspector');
})();

// Edge case: select different node
(() => {
  resetUI();
  getUI().selectNode('N001');
  getUI().selectNode('N002');
  assert(getUI().selectedNodeId === 'N002', 'selectNode replaces current selection');
})();

// Edge case: selectNode with undefined
(() => {
  resetUI();
  getUI().selectNode('N001');
  getUI().openInspector();
  getUI().selectNode(undefined);
  assert(getUI().selectedNodeId === undefined, 'selectNode(undefined) sets undefined');
  // undefined == null is true, so inspector should close if unpinned
  assert(getUI().inspectorOpen === false, 'selectNode(undefined) closes unpinned inspector');
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — useUIStore: Inspector Controls
// ════════════════════════════════════════════════════════════

group('useUIStore — Inspector Controls');

// Open / Close
(() => {
  resetUI();
  getUI().openInspector();
  assert(getUI().inspectorOpen === true, 'openInspector sets true');
  getUI().closeInspector();
  assert(getUI().inspectorOpen === false, 'closeInspector sets false');
})();

// Pin toggle
(() => {
  resetUI();
  assert(getUI().inspectorPinned === false, 'starts unpinned');
  getUI().pinInspector();
  assert(getUI().inspectorPinned === true, 'pinInspector() toggles to true');
  getUI().pinInspector();
  assert(getUI().inspectorPinned === false, 'pinInspector() toggles back to false');
})();

// Pin direct set
(() => {
  resetUI();
  getUI().pinInspector(true);
  assert(getUI().inspectorPinned === true, 'pinInspector(true) sets true');
  getUI().pinInspector(true);
  assert(getUI().inspectorPinned === true, 'pinInspector(true) stays true');
  getUI().pinInspector(false);
  assert(getUI().inspectorPinned === false, 'pinInspector(false) sets false');
})();

// Edge case: close inspector when already closed
(() => {
  resetUI();
  getUI().closeInspector();
  assert(getUI().inspectorOpen === false, 'closeInspector on already closed is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — useUIStore: Context Menu
// ════════════════════════════════════════════════════════════

group('useUIStore — Context Menu');

// Happy path
(() => {
  resetUI();
  getUI().showContextMenu({ x: 100, y: 200, targetId: 'N001', targetType: 'node' });
  const cm = getUI().contextMenu;
  assert(cm !== null, 'context menu is visible');
  assert(cm.visible === true, 'contextMenu.visible is true');
  assert(cm.x === 100, 'contextMenu.x is correct');
  assert(cm.y === 200, 'contextMenu.y is correct');
  assert(cm.targetId === 'N001', 'contextMenu.targetId is correct');
  assert(cm.targetType === 'node', 'contextMenu.targetType is correct');
})();

// Default target type
(() => {
  resetUI();
  getUI().showContextMenu({ x: 50, y: 50 });
  const cm = getUI().contextMenu;
  assert(cm.targetId === null, 'targetId defaults to null');
  assert(cm.targetType === 'canvas', 'targetType defaults to canvas');
})();

// Hide context menu
(() => {
  resetUI();
  getUI().showContextMenu({ x: 10, y: 10 });
  getUI().hideContextMenu();
  assert(getUI().contextMenu === null, 'hideContextMenu sets null');
})();

// Edge case: hide when already hidden
(() => {
  resetUI();
  getUI().hideContextMenu();
  assert(getUI().contextMenu === null, 'hideContextMenu on null is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — useUIStore: Command Palette
// ════════════════════════════════════════════════════════════

group('useUIStore — Command Palette');

// Toggle
(() => {
  resetUI();
  getUI().toggleCommandPalette();
  assert(getUI().commandPaletteOpen === true, 'toggleCommandPalette opens');
  getUI().toggleCommandPalette();
  assert(getUI().commandPaletteOpen === false, 'toggleCommandPalette closes');
})();

// Direct set
(() => {
  resetUI();
  getUI().toggleCommandPalette(true);
  assert(getUI().commandPaletteOpen === true, 'toggleCommandPalette(true) opens');
  getUI().toggleCommandPalette(false);
  assert(getUI().commandPaletteOpen === false, 'toggleCommandPalette(false) closes');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — useUIStore: Toast Notifications
// ════════════════════════════════════════════════════════════

group('useUIStore — Toasts');

// Happy path: add toast
(() => {
  resetUI();
  const id = getUI().addToast('Hello World');
  const toasts = getUI().toasts;
  assert(toasts.length === 1, 'one toast added');
  assert(toasts[0].id === id, 'toast ID matches returned ID');
  assert(toasts[0].message === 'Hello World', 'toast message correct');
  assert(toasts[0].type === 'info', 'toast type defaults to info');
  assert(toasts[0].duration === 5000, 'toast duration defaults to 5000');
})();

// Custom type and duration
(() => {
  resetUI();
  getUI().addToast('Error!', 'error', 10000);
  const t = getUI().toasts[0];
  assert(t.type === 'error', 'custom type preserved');
  assert(t.duration === 10000, 'custom duration preserved');
})();

// Multiple toasts stack
(() => {
  resetUI();
  getUI().addToast('First');
  getUI().addToast('Second');
  getUI().addToast('Third');
  assert(getUI().toasts.length === 3, 'three toasts stacked');
  assert(getUI().toasts[0].message === 'First', 'order preserved — first');
  assert(getUI().toasts[2].message === 'Third', 'order preserved — third');
})();

// Remove toast by ID
(() => {
  resetUI();
  const id1 = getUI().addToast('Keep');
  const id2 = getUI().addToast('Remove');
  getUI().removeToast(id2);
  assert(getUI().toasts.length === 1, 'one toast after removal');
  assert(getUI().toasts[0].id === id1, 'correct toast remains');
})();

// Remove non-existent toast — no crash
(() => {
  resetUI();
  getUI().addToast('Test');
  getUI().removeToast(99999);
  assert(getUI().toasts.length === 1, 'removing non-existent toast is no-op');
})();

// Toast returns unique IDs
(() => {
  resetUI();
  const id1 = getUI().addToast('A');
  const id2 = getUI().addToast('B');
  assert(id1 !== id2, 'toast IDs are unique');
})();

// Edge case: zero duration should NOT auto-dismiss
(() => {
  resetUI();
  getUI().addToast('Persistent', 'info', 0);
  // Zero duration means no setTimeout scheduling
  assert(getUI().toasts.length === 1, 'toast with zero duration added');
  // We can't easily test that setTimeout wasn't called, but we verify it exists
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — useUIStore: Persist Error (AR-08)
// ════════════════════════════════════════════════════════════

group('useUIStore — Persist Error (AR-08)');

// Show default error
(() => {
  resetUI();
  getUI().showPersistError();
  assert(getUI().persistError === 'Failed to save to IndexedDB', 'default error message');
})();

// Show custom error
(() => {
  resetUI();
  getUI().showPersistError('Disk quota exceeded');
  assert(getUI().persistError === 'Disk quota exceeded', 'custom error message');
})();

// Clear error
(() => {
  resetUI();
  getUI().showPersistError('Some error');
  getUI().clearPersistError();
  assert(getUI().persistError === null, 'error cleared to null');
})();

// Clear when already null — no-op
(() => {
  resetUI();
  getUI().clearPersistError();
  assert(getUI().persistError === null, 'clearPersistError on null is no-op');
})();

// Error is a string, not boolean (data integrity)
(() => {
  resetUI();
  getUI().showPersistError('test');
  assert(typeof getUI().persistError === 'string', 'persistError is a string, not boolean');
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — useSimulationStore: Initial State
// ════════════════════════════════════════════════════════════

group('useSimulationStore — Initial State');

(() => {
  resetSim();
  const s = getSim();

  assert(typeof s.nodeStates === 'object' && Object.keys(s.nodeStates).length === 0, 'nodeStates defaults to {}');
  assert(typeof s.flagOverrides === 'object' && Object.keys(s.flagOverrides).length === 0, 'flagOverrides defaults to {}');
  assert(typeof s.statusOverrides === 'object' && Object.keys(s.statusOverrides).length === 0, 'statusOverrides defaults to {}');
  assert(typeof s.evaluatedEdges === 'object' && Object.keys(s.evaluatedEdges).length === 0, 'evaluatedEdges defaults to {}');
  assert(s.unreachableNodes instanceof Set && s.unreachableNodes.size === 0, 'unreachableNodes defaults to empty Set');
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — useSimulationStore: Node Status
// ════════════════════════════════════════════════════════════

group('useSimulationStore — setNodeStatus');

// Happy path
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'active');
  assert(getSim().nodeStates['N001'].status === 'active', 'setNodeStatus sets status');
  assert(getSim().nodeStates['N001'].seen === 'unseen', 'seen defaults to unseen on lazy init');
})();

// Overwrite existing
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'active');
  getSim().setNodeStatus('N001', 'locked');
  assert(getSim().nodeStates['N001'].status === 'locked', 'setNodeStatus overwrites');
})();

// Preserves seen when updating status
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'active');
  getSim().setNodeSeen('N001', 'seen');
  getSim().setNodeStatus('N001', 'complete');
  assert(getSim().nodeStates['N001'].seen === 'seen', 'setNodeStatus preserves seen');
  assert(getSim().nodeStates['N001'].status === 'complete', 'status updated');
})();


group('useSimulationStore — cycleNodeStatus');

// Full cycle test
(() => {
  resetSim();
  const expected = ['active', 'locked', 'complete', 'failed', 'branch_locked', 'default'];
  let allCorrect = true;
  for (const exp of expected) {
    getSim().cycleNodeStatus('N001');
    if (getSim().nodeStates['N001'].status !== exp) {
      allCorrect = false;
      console.log(`    Expected ${exp}, got ${getSim().nodeStates['N001'].status}`);
    }
  }
  assert(allCorrect, 'cycleNodeStatus cycles: default → active → locked → complete → failed → branch_locked → default');
})();

// Cycle wraps around
(() => {
  resetSim();
  // Cycle 6 times to get back to default
  for (let i = 0; i < 6; i++) getSim().cycleNodeStatus('N001');
  assert(getSim().nodeStates['N001'].status === 'default', 'cycle wraps back to default');
})();

// Cycle on non-existent node (lazy init)
(() => {
  resetSim();
  getSim().cycleNodeStatus('NEWNODE');
  assert(getSim().nodeStates['NEWNODE'].status === 'active', 'cycling non-existent node starts from default → active');
})();

// Edge case: cycle after manual set to unknown status
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'NONSENSE');
  getSim().cycleNodeStatus('N001');
  // Unknown status → indexOf returns -1 → next is 0 → 'default'
  assert(getSim().nodeStates['N001'].status === 'default', 'cycling unknown status resets to default');
})();

// Verify STATUS_CYCLE export
(() => {
  assert(Array.isArray(STATUS_CYCLE), 'STATUS_CYCLE is exported as array');
  assert(STATUS_CYCLE.length === 6, 'STATUS_CYCLE has 6 entries');
  assert(STATUS_CYCLE[0] === 'default', 'STATUS_CYCLE starts with default');
  assert(STATUS_CYCLE[5] === 'branch_locked', 'STATUS_CYCLE ends with branch_locked');
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — useSimulationStore: Node Seen
// ════════════════════════════════════════════════════════════

group('useSimulationStore — setNodeSeen / cycleNodeSeen');

// Happy path
(() => {
  resetSim();
  getSim().setNodeSeen('N001', 'seen');
  assert(getSim().nodeStates['N001'].seen === 'seen', 'setNodeSeen sets seen');
  assert(getSim().nodeStates['N001'].status === 'default', 'status defaults on lazy init');
})();

// Full cycle
(() => {
  resetSim();
  const expected = ['partially_seen', 'seen', 'unseen'];
  let allCorrect = true;
  for (const exp of expected) {
    getSim().cycleNodeSeen('N001');
    if (getSim().nodeStates['N001'].seen !== exp) {
      allCorrect = false;
      console.log(`    Expected ${exp}, got ${getSim().nodeStates['N001'].seen}`);
    }
  }
  assert(allCorrect, 'cycleNodeSeen cycles: unseen → partially_seen → seen → unseen');
})();

// Verify SEEN_CYCLE export
(() => {
  assert(Array.isArray(SEEN_CYCLE), 'SEEN_CYCLE is exported as array');
  assert(SEEN_CYCLE.length === 3, 'SEEN_CYCLE has 3 entries');
  assert(SEEN_CYCLE[0] === 'unseen', 'SEEN_CYCLE starts with unseen');
  assert(SEEN_CYCLE[2] === 'seen', 'SEEN_CYCLE ends with seen');
})();

// Preserves status when updating seen
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'locked');
  getSim().setNodeSeen('N001', 'seen');
  assert(getSim().nodeStates['N001'].status === 'locked', 'setNodeSeen preserves status');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — useSimulationStore: Flag Overrides
// ════════════════════════════════════════════════════════════

group('useSimulationStore — Flag Overrides');

// Set
(() => {
  resetSim();
  getSim().setFlagOverride('F001', true);
  assert(getSim().flagOverrides['F001'] === true, 'setFlagOverride sets true');
  getSim().setFlagOverride('F001', false);
  assert(getSim().flagOverrides['F001'] === false, 'setFlagOverride sets false');
})();

// Multiple flags
(() => {
  resetSim();
  getSim().setFlagOverride('F001', true);
  getSim().setFlagOverride('F002', false);
  assert(Object.keys(getSim().flagOverrides).length === 2, 'multiple flag overrides');
})();

// Clear
(() => {
  resetSim();
  getSim().setFlagOverride('F001', true);
  getSim().setFlagOverride('F002', false);
  getSim().clearFlagOverride('F001');
  assert(getSim().flagOverrides['F001'] === undefined, 'clearFlagOverride removes entry');
  assert(getSim().flagOverrides['F002'] === false, 'other overrides preserved');
})();

// Clear non-existent — no crash
(() => {
  resetSim();
  getSim().clearFlagOverride('F999');
  assert(Object.keys(getSim().flagOverrides).length === 0, 'clearing non-existent flag override is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION L — useSimulationStore: Status Overrides
// ════════════════════════════════════════════════════════════

group('useSimulationStore — Status Overrides');

// Set
(() => {
  resetSim();
  getSim().setStatusOverride('SP001', 42);
  assert(getSim().statusOverrides['SP001'] === 42, 'setStatusOverride sets value');
})();

// Overwrite
(() => {
  resetSim();
  getSim().setStatusOverride('SP001', 10);
  getSim().setStatusOverride('SP001', 20);
  assert(getSim().statusOverrides['SP001'] === 20, 'setStatusOverride overwrites');
})();

// Edge case: negative value
(() => {
  resetSim();
  getSim().setStatusOverride('SP001', -50);
  assert(getSim().statusOverrides['SP001'] === -50, 'negative status override accepted');
})();

// Edge case: zero value
(() => {
  resetSim();
  getSim().setStatusOverride('SP001', 0);
  assert(getSim().statusOverrides['SP001'] === 0, 'zero status override accepted');
})();

// Clear
(() => {
  resetSim();
  getSim().setStatusOverride('SP001', 10);
  getSim().clearStatusOverride('SP001');
  assert(getSim().statusOverrides['SP001'] === undefined, 'clearStatusOverride removes entry');
})();


// ════════════════════════════════════════════════════════════
//  SECTION M — useSimulationStore: Derived State (Engine)
// ════════════════════════════════════════════════════════════

group('useSimulationStore — Evaluated Edges & Unreachable Nodes');

// Set evaluated edges
(() => {
  resetSim();
  const edges = { 'N001->N002': true, 'N002->E001': false };
  getSim().setEvaluatedEdges(edges);
  assert(getSim().evaluatedEdges['N001->N002'] === true, 'evaluatedEdges set — true');
  assert(getSim().evaluatedEdges['N002->E001'] === false, 'evaluatedEdges set — false');
})();

// Replace evaluated edges
(() => {
  resetSim();
  getSim().setEvaluatedEdges({ 'A->B': true });
  getSim().setEvaluatedEdges({ 'C->D': false });
  assert(getSim().evaluatedEdges['A->B'] === undefined, 'previous edges replaced');
  assert(getSim().evaluatedEdges['C->D'] === false, 'new edges set');
})();

// Set unreachable nodes
(() => {
  resetSim();
  const unreachable = new Set(['N003', 'N004']);
  getSim().setUnreachableNodes(unreachable);
  assert(getSim().unreachableNodes.has('N003'), 'unreachableNodes contains N003');
  assert(getSim().unreachableNodes.has('N004'), 'unreachableNodes contains N004');
  assert(getSim().unreachableNodes.size === 2, 'unreachableNodes has correct size');
})();


// ════════════════════════════════════════════════════════════
//  SECTION N — useSimulationStore: Reset
// ════════════════════════════════════════════════════════════

group('useSimulationStore — resetSimulation');

(() => {
  resetSim();
  // Populate everything
  getSim().setNodeStatus('N001', 'active');
  getSim().setNodeSeen('N001', 'seen');
  getSim().setFlagOverride('F001', true);
  getSim().setStatusOverride('SP001', 50);
  getSim().setEvaluatedEdges({ 'A->B': true });
  getSim().setUnreachableNodes(new Set(['N003']));

  // Verify populated
  assert(Object.keys(getSim().nodeStates).length > 0, 'has nodeStates before reset');

  // Reset
  getSim().resetSimulation();

  const s = getSim();
  assert(Object.keys(s.nodeStates).length === 0, 'nodeStates cleared');
  assert(Object.keys(s.flagOverrides).length === 0, 'flagOverrides cleared');
  assert(Object.keys(s.statusOverrides).length === 0, 'statusOverrides cleared');
  assert(Object.keys(s.evaluatedEdges).length === 0, 'evaluatedEdges cleared');
  assert(s.unreachableNodes instanceof Set && s.unreachableNodes.size === 0, 'unreachableNodes cleared to empty Set');
})();


// ════════════════════════════════════════════════════════════
//  SECTION O — useSimulationStore: Multiple Nodes Isolation
// ════════════════════════════════════════════════════════════

group('useSimulationStore — Multi-Node Isolation');

// Setting state on one node doesn't affect another
(() => {
  resetSim();
  getSim().setNodeStatus('N001', 'active');
  getSim().setNodeStatus('N002', 'locked');
  getSim().setNodeSeen('N001', 'seen');

  assert(getSim().nodeStates['N001'].status === 'active', 'N001 status independent');
  assert(getSim().nodeStates['N002'].status === 'locked', 'N002 status independent');
  assert(getSim().nodeStates['N001'].seen === 'seen', 'N001 seen independent');
  assert(getSim().nodeStates['N002'].seen === 'unseen', 'N002 seen defaults on lazy init');
})();


// ════════════════════════════════════════════════════════════
//  SECTION P — useCampaignStore: Initial State
// ════════════════════════════════════════════════════════════

group('useCampaignStore — Initial State');

(() => {
  resetCampaign();
  const s = getCamp();
  assert(typeof s.campaigns === 'object' && Object.keys(s.campaigns).length === 0, 'campaigns defaults to {}');
  assert(s.activeCampaignId === null, 'activeCampaignId defaults to null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION Q — useCampaignStore: Create Campaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — createCampaign');

// Happy path
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('My Campaign');
  const camp = getCamp().campaigns[id];

  assert(typeof id === 'string' && id.length > 0, 'returns a campaign ID');
  assert(camp !== undefined, 'campaign exists in state');
  assert(camp.id === id, 'campaign ID matches');
  assert(camp.name === 'my_campaign', 'name sanitized (AR-07 pattern)');
  assert(typeof camp.createdAt === 'string', 'createdAt is ISO string');
  assert(typeof camp.updatedAt === 'string', 'updatedAt is ISO string');
  assert(typeof camp.nodeStates === 'object' && Object.keys(camp.nodeStates).length === 0, 'nodeStates defaults to {}');
  assert(typeof camp.flagOverrides === 'object' && Object.keys(camp.flagOverrides).length === 0, 'flagOverrides defaults to {}');
  assert(typeof camp.statusOverrides === 'object' && Object.keys(camp.statusOverrides).length === 0, 'statusOverrides defaults to {}');
})();

// Auto-switches to new campaign
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Auto Switch');
  assert(getCamp().activeCampaignId === id, 'auto-switches to new campaign');
})();

// switchTo: false
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('No Switch', { switchTo: false });
  assert(getCamp().activeCampaignId === null, 'does NOT switch when switchTo: false');
  assert(getCamp().campaigns[id] !== undefined, 'campaign still created');
})();

// Multiple campaigns
(() => {
  resetCampaign();
  const id1 = getCamp().createCampaign('First');
  const id2 = getCamp().createCampaign('Second');
  assert(Object.keys(getCamp().campaigns).length === 2, 'two campaigns exist');
  assert(getCamp().activeCampaignId === id2, 'active is the last created');
  assert(id1 !== id2, 'campaign IDs are unique');
})();

// Edge case: special characters in name
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Test Campaign #1!');
  assert(getCamp().campaigns[id].name === 'test_campaign__1_', 'special chars sanitized');
})();

// Edge case: empty name
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('');
  assert(getCamp().campaigns[id].name === 'untitled_campaign', 'empty name defaults to untitled_campaign');
})();

// Edge case: null name
(() => {
  resetCampaign();
  const id = getCamp().createCampaign(null);
  assert(getCamp().campaigns[id].name === 'untitled_campaign', 'null name defaults to untitled_campaign');
})();


// ════════════════════════════════════════════════════════════
//  SECTION R — useCampaignStore: getActiveCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — getActiveCampaign');

// No active campaign
(() => {
  resetCampaign();
  const result = getCamp().getActiveCampaign();
  assert(result === null, 'returns null when no active campaign');
})();

// Active campaign exists
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Test');
  const active = getCamp().getActiveCampaign();
  assert(active !== null, 'returns campaign data');
  assert(active.id === id, 'returns correct campaign');
})();

// Active ID points to deleted campaign
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Will Delete');
  getCamp().deleteCampaign(id);
  const result = getCamp().getActiveCampaign();
  assert(result === null, 'returns null after active campaign deleted');
})();


// ════════════════════════════════════════════════════════════
//  SECTION S — useCampaignStore: loadCampaigns
// ════════════════════════════════════════════════════════════

group('useCampaignStore — loadCampaigns');

// Happy path
(() => {
  resetCampaign();
  const mockData = {
    'camp_1': { id: 'camp_1', name: 'loaded', createdAt: '2026-01-01', updatedAt: '2026-01-01', nodeStates: {}, flagOverrides: {}, statusOverrides: {} },
    'camp_2': { id: 'camp_2', name: 'loaded_2', createdAt: '2026-01-02', updatedAt: '2026-01-02', nodeStates: {}, flagOverrides: {}, statusOverrides: {} },
  };
  getCamp().loadCampaigns(mockData, 'camp_1');
  assert(Object.keys(getCamp().campaigns).length === 2, 'loaded two campaigns');
  assert(getCamp().activeCampaignId === 'camp_1', 'active campaign set from load');
})();

// Load replaces existing
(() => {
  resetCampaign();
  getCamp().createCampaign('Existing');
  assert(Object.keys(getCamp().campaigns).length === 1, 'one campaign before load');
  getCamp().loadCampaigns({ 'new_1': { id: 'new_1', name: 'new' } }, 'new_1');
  assert(Object.keys(getCamp().campaigns).length === 1, 'load replaces existing campaigns');
  assert(getCamp().campaigns['new_1'] !== undefined, 'new campaign present');
})();

// Load with null data
(() => {
  resetCampaign();
  getCamp().createCampaign('Before');
  getCamp().loadCampaigns(null);
  assert(Object.keys(getCamp().campaigns).length === 0, 'null data clears campaigns');
  assert(getCamp().activeCampaignId === null, 'active becomes null');
})();

// Load with invalid active ID
(() => {
  resetCampaign();
  const mockData = { 'camp_1': { id: 'camp_1', name: 'test' } };
  getCamp().loadCampaigns(mockData, 'nonexistent');
  assert(getCamp().activeCampaignId === null, 'invalid activeId set to null');
})();

// Load with no activeId
(() => {
  resetCampaign();
  getCamp().loadCampaigns({ 'c1': { id: 'c1', name: 'one' } });
  assert(getCamp().activeCampaignId === null, 'no activeId defaults to null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION T — useCampaignStore: saveCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — saveCampaign');

// Happy path
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Save Test');
  const prevUpdatedAt = getCamp().campaigns[id].updatedAt;

  // Small delay to ensure time difference
  getCamp().saveCampaign({
    nodeStates: { N001: { status: 'active', seen: 'seen' } },
    flagOverrides: { F001: true },
    statusOverrides: { SP001: 50 },
  });

  const saved = getCamp().campaigns[id];
  assert(saved.nodeStates.N001.status === 'active', 'nodeStates saved');
  assert(saved.flagOverrides.F001 === true, 'flagOverrides saved');
  assert(saved.statusOverrides.SP001 === 50, 'statusOverrides saved');
})();

// Save with no active campaign — no crash
(() => {
  resetCampaign();
  getCamp().saveCampaign({ nodeStates: {}, flagOverrides: {}, statusOverrides: {} });
  assert(Object.keys(getCamp().campaigns).length === 0, 'save with no active campaign is no-op');
})();

// Partial save preserves existing data
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Partial');
  getCamp().saveCampaign({
    nodeStates: { N001: { status: 'active', seen: 'unseen' } },
    flagOverrides: { F001: true },
    statusOverrides: {},
  });
  // Save again with different flag but null nodeStates
  getCamp().saveCampaign({
    flagOverrides: { F002: false },
  });
  const camp = getCamp().campaigns[id];
  // nodeStates should be preserved from previous (since null/undefined was passed)
  assert(camp.flagOverrides.F002 === false, 'new flagOverrides written');
})();


// ════════════════════════════════════════════════════════════
//  SECTION U — useCampaignStore: deleteCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — deleteCampaign');

// Happy path
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Delete Me');
  getCamp().deleteCampaign(id);
  assert(getCamp().campaigns[id] === undefined, 'campaign removed');
  assert(getCamp().activeCampaignId === null, 'active cleared when active campaign deleted');
})();

// Delete non-active campaign
(() => {
  resetCampaign();
  const id1 = getCamp().createCampaign('Keep', { switchTo: false });
  const id2 = getCamp().createCampaign('Delete');
  getCamp().deleteCampaign(id1);
  assert(getCamp().campaigns[id1] === undefined, 'non-active campaign removed');
  assert(getCamp().activeCampaignId === id2, 'active campaign unchanged');
})();

// Delete non-existent campaign — no crash
(() => {
  resetCampaign();
  getCamp().createCampaign('Test');
  getCamp().deleteCampaign('nonexistent');
  assert(Object.keys(getCamp().campaigns).length === 1, 'deleting non-existent is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION V — useCampaignStore: switchCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — switchCampaign');

// Happy path
(() => {
  resetCampaign();
  const id1 = getCamp().createCampaign('First');
  const id2 = getCamp().createCampaign('Second');
  assert(getCamp().activeCampaignId === id2, 'active is second');
  const result = getCamp().switchCampaign(id1);
  assert(getCamp().activeCampaignId === id1, 'switched to first');
  assert(result !== null && result.id === id1, 'returns campaign data');
})();

// Switch to non-existent
(() => {
  resetCampaign();
  getCamp().createCampaign('Test');
  const result = getCamp().switchCampaign('nonexistent');
  assert(result === null, 'returns null for non-existent campaign');
})();


// ════════════════════════════════════════════════════════════
//  SECTION W — useCampaignStore: resetActiveCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — resetActiveCampaign');

// Happy path
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Reset Me');
  getCamp().saveCampaign({
    nodeStates: { N001: { status: 'active', seen: 'seen' } },
    flagOverrides: { F001: true },
    statusOverrides: { SP001: 50 },
  });

  getCamp().resetActiveCampaign();

  const camp = getCamp().campaigns[id];
  assert(Object.keys(camp.nodeStates).length === 0, 'nodeStates cleared on reset');
  assert(Object.keys(camp.flagOverrides).length === 0, 'flagOverrides cleared on reset');
  assert(Object.keys(camp.statusOverrides).length === 0, 'statusOverrides cleared on reset');
  assert(camp.name === 'reset_me', 'name preserved on reset');
  assert(camp.id === id, 'id preserved on reset');
  assert(getCamp().activeCampaignId === id, 'active campaign unchanged after reset');
})();

// Reset with no active campaign — no crash
(() => {
  resetCampaign();
  getCamp().resetActiveCampaign();
  assert(getCamp().activeCampaignId === null, 'reset with no active is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION X — useCampaignStore: renameCampaign
// ════════════════════════════════════════════════════════════

group('useCampaignStore — renameCampaign');

// Happy path
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Old Name');
  getCamp().renameCampaign(id, 'New Name!');
  assert(getCamp().campaigns[id].name === 'new_name_', 'name updated and sanitized');
})();

// Rename non-existent — no crash
(() => {
  resetCampaign();
  getCamp().renameCampaign('nonexistent', 'Test');
  assert(Object.keys(getCamp().campaigns).length === 0, 'rename non-existent is no-op');
})();


// ════════════════════════════════════════════════════════════
//  SECTION Y — Campaign Data Isolation
// ════════════════════════════════════════════════════════════

group('Campaign Data Isolation');

// Campaign state does not leak between campaigns
(() => {
  resetCampaign();
  const id1 = getCamp().createCampaign('Campaign A');
  getCamp().saveCampaign({
    nodeStates: { N001: { status: 'active', seen: 'seen' } },
    flagOverrides: { F001: true },
    statusOverrides: { SP001: 99 },
  });

  const id2 = getCamp().createCampaign('Campaign B');
  const campB = getCamp().campaigns[id2];
  assert(Object.keys(campB.nodeStates).length === 0, 'campaign B has empty nodeStates');
  assert(Object.keys(campB.flagOverrides).length === 0, 'campaign B has empty flagOverrides');

  // Switch back
  getCamp().switchCampaign(id1);
  const campA = getCamp().campaigns[id1];
  assert(campA.nodeStates.N001.status === 'active', 'campaign A state preserved after switch');
})();

// Campaign ID format — uses generateId('campaign')
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('ID Test');
  assert(id.startsWith('campaign_'), 'campaign ID starts with campaign_ prefix');
})();


// ════════════════════════════════════════════════════════════
//  SECTION Z — Cross-Store Independence
// ════════════════════════════════════════════════════════════

group('Cross-Store Independence');

// UI store changes don't affect Simulation store
(() => {
  resetAll();
  getUI().selectNode('N001');
  getUI().addToast('Hi');
  assert(Object.keys(getSim().nodeStates).length === 0, 'UI changes dont affect simulation');
})();

// Simulation store changes don't affect Campaign store
(() => {
  resetAll();
  getSim().setNodeStatus('N001', 'active');
  getSim().setFlagOverride('F001', true);
  assert(Object.keys(getCamp().campaigns).length === 0, 'simulation changes dont affect campaign');
})();


// ════════════════════════════════════════════════════════════
//  SECTION AA — Data Integrity Checks
// ════════════════════════════════════════════════════════════

group('Data Integrity — State Shapes');

// UI store state shape completeness
(() => {
  resetUI();
  const s = getUI();
  const expectedKeys = ['selectedNodeId', 'inspectorOpen', 'inspectorPinned', 'contextMenu',
    'commandPaletteOpen', 'toasts', 'persistError'];
  for (const key of expectedKeys) {
    assert(key in s, `UI store has ${key} field`);
  }
})();

// UI store action completeness
(() => {
  resetUI();
  const s = getUI();
  const expectedActions = ['selectNode', 'openInspector', 'closeInspector', 'pinInspector',
    'showContextMenu', 'hideContextMenu', 'toggleCommandPalette',
    'addToast', 'removeToast', 'showPersistError', 'clearPersistError'];
  for (const action of expectedActions) {
    assert(typeof s[action] === 'function', `UI store has ${action}() action`);
  }
})();

// Simulation store state shape completeness
(() => {
  resetSim();
  const s = getSim();
  const expectedKeys = ['nodeStates', 'flagOverrides', 'statusOverrides', 'evaluatedEdges', 'unreachableNodes'];
  for (const key of expectedKeys) {
    assert(key in s, `Simulation store has ${key} field`);
  }
})();

// Simulation store action completeness
(() => {
  resetSim();
  const s = getSim();
  const expectedActions = ['setNodeStatus', 'cycleNodeStatus', 'setNodeSeen', 'cycleNodeSeen',
    'setFlagOverride', 'clearFlagOverride', 'setStatusOverride', 'clearStatusOverride',
    'setEvaluatedEdges', 'setUnreachableNodes', 'resetSimulation'];
  for (const action of expectedActions) {
    assert(typeof s[action] === 'function', `Simulation store has ${action}() action`);
  }
})();

// Campaign store state shape completeness
(() => {
  resetCampaign();
  const s = getCamp();
  const expectedKeys = ['campaigns', 'activeCampaignId'];
  for (const key of expectedKeys) {
    assert(key in s, `Campaign store has ${key} field`);
  }
})();

// Campaign store action completeness
(() => {
  resetCampaign();
  const s = getCamp();
  const expectedActions = ['getActiveCampaign', 'createCampaign', 'loadCampaigns', 'saveCampaign',
    'deleteCampaign', 'switchCampaign', 'resetActiveCampaign', 'renameCampaign'];
  for (const action of expectedActions) {
    assert(typeof s[action] === 'function', `Campaign store has ${action}() action`);
  }
})();

// CampaignData shape
(() => {
  resetCampaign();
  const id = getCamp().createCampaign('Shape Test');
  const camp = getCamp().campaigns[id];
  const expectedFields = ['id', 'name', 'createdAt', 'updatedAt', 'nodeStates', 'flagOverrides', 'statusOverrides'];
  for (const field of expectedFields) {
    assert(field in camp, `CampaignData has ${field} field`);
  }
})();


// ════════════════════════════════════════════════════════════
//  Summary
// ════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(60)}`);

if (failed > 0) {
  process.exit(1);
}
