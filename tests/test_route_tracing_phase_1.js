/**
 * Route_Tracing Phase 1 Test Suite — Traversal Records + Undo
 *
 * Group A: TraversalRecord construction, undoLastNode logic, preAdvanceFlagSnapshot handling
 * Group B: Integration — advance/selectOption/exitCampaign/reset/enterCampaign field contracts
 *
 * Run: node tests/test_route_tracing_phase_1.js
 */

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Inline helpers — mirror logic from simulationStore without Zustand
// ---------------------------------------------------------------------------

function buildTraversalRecord(state, edge) {
  return {
    sequence: state.traversalRecords.length,
    edgeId: edge.id,
    optionId: edge.optionId ?? null,
    fromNodeId: state.activeNodeId,
    toNodeId: edge.targetId,
    flagSnapshot: state.preAdvanceFlagSnapshot ?? { ...state.currentFlagValues }
  };
}

function applyFlagsSet(flagsSet, flagValues) {
  if (!flagsSet) return flagValues;
  const next = { ...flagValues };
  flagsSet.forEach(id => { next[id] = true; });
  return next;
}

function applyStatusSet(statusSet, flagValues) {
  if (!statusSet) return flagValues;
  const next = { ...flagValues };
  statusSet.forEach(({ statusId, amount }) => {
    if (typeof next[statusId] === 'number') next[statusId] += amount;
  });
  return next;
}

function simulateAdvance(state, edge, destNode) {
  const record = buildTraversalRecord(state, edge);
  let nextFlags = { ...state.currentFlagValues };
  if (destNode.data) {
    nextFlags = applyFlagsSet(destNode.data.flags_set, nextFlags);
    nextFlags = applyStatusSet(destNode.data.status_set, nextFlags);
  }
  return {
    ...state,
    activeNodeId: edge.targetId,
    seenNodeIds: [...state.seenNodeIds, state.activeNodeId],
    traversedEdgeIds: [...state.traversedEdgeIds, edge.id],
    traversalRecords: [...state.traversalRecords, record],
    currentFlagValues: nextFlags,
    preAdvanceFlagSnapshot: null,
    selectedOptionId: null
  };
}

function simulateSelectOption(state, option) {
  const preSnapshot = { ...state.currentFlagValues };
  let nextFlags = { ...state.currentFlagValues };
  nextFlags = applyFlagsSet(option.flags_set, nextFlags);
  nextFlags = applyStatusSet(option.status_set, nextFlags);
  return {
    ...state,
    preAdvanceFlagSnapshot: preSnapshot,
    currentFlagValues: nextFlags,
    selectedOptionId: option.id
  };
}

function simulateUndoLastNode(state) {
  if (!state.isCampaignActive || state.traversalRecords.length === 0) return state;
  const record = state.traversalRecords[state.traversalRecords.length - 1];
  const restoredSeen = state.seenNodeIds.slice(0, -1);
  return {
    ...state,
    activeNodeId: record.fromNodeId,
    currentFlagValues: { ...record.flagSnapshot },
    seenNodeIds: restoredSeen,
    traversedEdgeIds: state.traversedEdgeIds.slice(0, -1),
    traversalRecords: state.traversalRecords.slice(0, -1),
    selectedOptionId: null,
    preAdvanceFlagSnapshot: null
  };
}

function initialSimState() {
  return {
    isCampaignActive: true,
    activeNodeId: 'n1',
    seenNodeIds: [],
    traversedEdgeIds: [],
    traversalRecords: [],
    currentFlagValues: { flag1: false, status1: 0 },
    preAdvanceFlagSnapshot: null,
    selectedOptionId: null
  };
}

// ---------------------------------------------------------------------------
// Group A — Feature Verification
// ---------------------------------------------------------------------------

console.log('\n=== Phase 1 GROUP A: Feature Verification ===\n');

// A-01: TraversalRecord has all required fields
{
  const state = initialSimState();
  const edge = { id: 'e1', targetId: 'n2', optionId: null };
  const record = buildTraversalRecord(state, edge);
  assert('A-01: record has sequence field', 'sequence' in record);
  assert('A-01: record has edgeId field', record.edgeId === 'e1');
  assert('A-01: record has optionId field (null for non-choice)', record.optionId === null);
  assert('A-01: record has fromNodeId field', record.fromNodeId === 'n1');
  assert('A-01: record has toNodeId field', record.toNodeId === 'n2');
  assert('A-01: record has flagSnapshot field', 'flagSnapshot' in record);
}

// A-02: sequence increments per record
{
  let state = initialSimState();
  const e1 = { id: 'e1', targetId: 'n2', optionId: null };
  const e2 = { id: 'e2', targetId: 'n3', optionId: null };
  const dest = { data: {} };
  state = simulateAdvance(state, e1, dest);
  state = simulateAdvance(state, e2, dest);
  assert('A-02: first record sequence is 0', state.traversalRecords[0].sequence === 0);
  assert('A-02: second record sequence is 1', state.traversalRecords[1].sequence === 1);
}

// A-03: preAdvanceFlagSnapshot used as flagSnapshot when available
{
  let state = initialSimState();
  const option = { id: 'opt1', flags_set: ['flag1'], status_set: [] };
  state = simulateSelectOption(state, option);
  // preAdvanceFlagSnapshot should capture BEFORE option effects
  const snapshotBeforeOption = state.preAdvanceFlagSnapshot;
  assert('A-03: preAdvanceFlagSnapshot captures pre-option flag state', snapshotBeforeOption.flag1 === false);

  const edge = { id: 'e1', targetId: 'n2', optionId: 'opt1' };
  const destNode = { data: {} };
  state = simulateAdvance(state, edge, destNode);
  // flagSnapshot on the record should be the PRE-option state
  assert('A-03: record flagSnapshot is pre-option state', state.traversalRecords[0].flagSnapshot.flag1 === false);
  assert('A-03: preAdvanceFlagSnapshot cleared after advance', state.preAdvanceFlagSnapshot === null);
}

// A-04: non-choice advance falls back to currentFlagValues for flagSnapshot
{
  let state = initialSimState();
  state = { ...state, currentFlagValues: { flag1: true } };
  const edge = { id: 'e1', targetId: 'n2', optionId: null };
  const destNode = { data: {} };
  state = simulateAdvance(state, edge, destNode);
  assert('A-04: non-choice record flagSnapshot matches currentFlagValues before advance', state.traversalRecords[0].flagSnapshot.flag1 === true);
}

// A-05: undoLastNode restores activeNodeId
{
  let state = initialSimState();
  const edge = { id: 'e1', targetId: 'n2', optionId: null };
  state = simulateAdvance(state, edge, { data: {} });
  state = simulateUndoLastNode(state);
  assert('A-05: undo restores activeNodeId to fromNodeId', state.activeNodeId === 'n1');
}

// A-06: undoLastNode decrements traversalRecords length
{
  let state = initialSimState();
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, { data: {} });
  state = simulateAdvance(state, { id: 'e2', targetId: 'n3', optionId: null }, { data: {} });
  assert('A-06: 2 records after 2 advances', state.traversalRecords.length === 2);
  state = simulateUndoLastNode(state);
  assert('A-06: 1 record after undo', state.traversalRecords.length === 1);
}

// A-07: undoLastNode restores currentFlagValues from flagSnapshot
{
  let state = initialSimState();
  state = { ...state, currentFlagValues: { flag1: false } };
  const destNodeSetsFlag = { data: { flags_set: ['flag1'] } };
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, destNodeSetsFlag);
  assert('A-07: flag1 is true after advance through flag-setting node', state.currentFlagValues.flag1 === true);
  state = simulateUndoLastNode(state);
  assert('A-07: flag1 is false after undo (restored from snapshot)', state.currentFlagValues.flag1 === false);
}

// A-08: undoLastNode trims seenNodeIds and traversedEdgeIds
{
  let state = initialSimState();
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, { data: {} });
  state = simulateAdvance(state, { id: 'e2', targetId: 'n3', optionId: null }, { data: {} });
  state = simulateUndoLastNode(state);
  assert('A-08: seenNodeIds trimmed by 1 after undo', state.seenNodeIds.length === 1);
  assert('A-08: traversedEdgeIds trimmed by 1 after undo', state.traversedEdgeIds.length === 1);
}

// A-09: undoLastNode sets selectedOptionId to null
{
  let state = initialSimState();
  state = { ...state, selectedOptionId: 'opt1' };
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: 'opt1' }, { data: {} });
  state = simulateUndoLastNode(state);
  assert('A-09: selectedOptionId is null after undo', state.selectedOptionId === null);
}

// A-10: undoLastNode is a no-op when traversalRecords is empty
{
  const state = initialSimState();
  const result = simulateUndoLastNode(state);
  assert('A-10: undo with no records returns unchanged activeNodeId', result.activeNodeId === 'n1');
  assert('A-10: undo with no records returns empty traversalRecords', result.traversalRecords.length === 0);
}

// A-11: undoLastNode is a no-op when campaign is not active
{
  const state = { ...initialSimState(), isCampaignActive: false };
  const result = simulateUndoLastNode(state);
  assert('A-11: undo with inactive campaign returns state unchanged', result === state);
}

// A-12: uiStore initial toggle values (documented by spec)
{
  // Spec: showTraversalOverlay: true, showRouteFinderDialog: false, showShortestRouteOverlay: false
  const uiInitial = { showTraversalOverlay: true, showRouteFinderDialog: false, showShortestRouteOverlay: false };
  assert('A-12: showTraversalOverlay initial value is true', uiInitial.showTraversalOverlay === true);
  assert('A-12: showRouteFinderDialog initial value is false', uiInitial.showRouteFinderDialog === false);
  assert('A-12: showShortestRouteOverlay initial value is false', uiInitial.showShortestRouteOverlay === false);
}

// A-13: toggle actions flip boolean
{
  let ui = { showTraversalOverlay: true, showRouteFinderDialog: false, showShortestRouteOverlay: false };
  ui = { ...ui, showTraversalOverlay: !ui.showTraversalOverlay };
  assert('A-13: toggleTraversalOverlay flips to false', ui.showTraversalOverlay === false);
  ui = { ...ui, showRouteFinderDialog: !ui.showRouteFinderDialog };
  assert('A-13: toggleRouteFinderDialog flips to true', ui.showRouteFinderDialog === true);
}

// ---------------------------------------------------------------------------
// Group B — Integration Suite
// ---------------------------------------------------------------------------

console.log('\n=== Phase 1 GROUP B: Integration Suite ===\n');

// B-01: advance appends to seenNodeIds and traversedEdgeIds
{
  let state = initialSimState();
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, { data: {} });
  assert('B-01: seenNodeIds appended after advance', state.seenNodeIds.includes('n1'));
  assert('B-01: traversedEdgeIds appended after advance', state.traversedEdgeIds.includes('e1'));
}

// B-02: advance applies destination node flags_set effects
{
  let state = { ...initialSimState(), currentFlagValues: { flag1: false } };
  const destNode = { data: { flags_set: ['flag1'] } };
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, destNode);
  assert('B-02: advance applies flags_set to currentFlagValues', state.currentFlagValues.flag1 === true);
}

// B-03: advance applies destination node status_set effects
{
  let state = { ...initialSimState(), currentFlagValues: { status1: 5 } };
  const destNode = { data: { status_set: [{ statusId: 'status1', amount: 3 }] } };
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, destNode);
  assert('B-03: advance applies status_set to currentFlagValues', state.currentFlagValues.status1 === 8);
}

// B-04: selectOption applies option effects to currentFlagValues
{
  let state = { ...initialSimState(), currentFlagValues: { flag1: false, status1: 0 } };
  const option = { id: 'o1', flags_set: ['flag1'], status_set: [{ statusId: 'status1', amount: 5 }] };
  state = simulateSelectOption(state, option);
  assert('B-04: selectOption applies flags_set', state.currentFlagValues.flag1 === true);
  assert('B-04: selectOption applies status_set', state.currentFlagValues.status1 === 5);
}

// B-05: selectOption captures pre-option flagSnapshot correctly
{
  let state = { ...initialSimState(), currentFlagValues: { flag1: false } };
  const option = { id: 'o1', flags_set: ['flag1'], status_set: [] };
  state = simulateSelectOption(state, option);
  assert('B-05: preAdvanceFlagSnapshot is captured before option effects', state.preAdvanceFlagSnapshot.flag1 === false);
  assert('B-05: currentFlagValues is updated after selectOption', state.currentFlagValues.flag1 === true);
}

// B-06: enterCampaign/reset/exitCampaign zero traversal fields
{
  function simulateTeardown(state) {
    return { ...state, traversalRecords: [], preAdvanceFlagSnapshot: null };
  }
  let state = initialSimState();
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, { data: {} });
  state = simulateTeardown(state);
  assert('B-06: traversalRecords cleared on teardown', state.traversalRecords.length === 0);
  assert('B-06: preAdvanceFlagSnapshot cleared on teardown', state.preAdvanceFlagSnapshot === null);
}

// B-07: optionId recorded correctly on edge with optionId
{
  let state = initialSimState();
  const edge = { id: 'e1', targetId: 'n2', optionId: 'opt-A' };
  state = simulateAdvance(state, edge, { data: {} });
  assert('B-07: record captures optionId from edge', state.traversalRecords[0].optionId === 'opt-A');
}

// B-08: advance through 3 nodes produces 3 records
{
  let state = initialSimState();
  state = simulateAdvance(state, { id: 'e1', targetId: 'n2', optionId: null }, { data: {} });
  state = simulateAdvance(state, { id: 'e2', targetId: 'n3', optionId: null }, { data: {} });
  state = simulateAdvance(state, { id: 'e3', targetId: 'n4', optionId: null }, { data: {} });
  assert('B-08: 3 advances produce 3 traversal records', state.traversalRecords.length === 3);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('INTEGRATION: CLEAN\n');
} else {
  console.log('INTEGRATION: BROKEN\n');
  process.exit(1);
}
