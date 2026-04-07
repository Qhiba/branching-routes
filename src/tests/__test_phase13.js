// ============================================================
// __test_phase13.js — Phase 13: Chrome (TopBar, StatusStrip,
//                     CommandPalette, Toast) Tests
// ============================================================
// Tests for:
//   A. useUIStore — handleOrientation + toggleHandleOrientation
//   B. useUIStore — addToast / removeToast (toast management)
//   C. useUIStore — showPersistError / clearPersistError (AR-08)
//   D. useUIStore — toggleCommandPalette
//   E. useUIStore — toast auto-dismiss timing
//   F. useUIStore — toast stacking + ordering
//   G. StatusStrip computed stats logic (inline replica)
//   H. CommandPalette search/filter logic (inline replica)
//   I. CommandPalette entity grouping logic
//   J. Handle orientation integration — store shape validation
//
// Run: node --import ./src/tests/_register.mjs src/tests/__test_phase13.js
//
// Approach: manual browser testing per project conventions.
// ============================================================

import { useUIStore } from '../store/useUIStore.js';
import { useSimulationStore } from '../store/useSimulationStore.js';

// ── Test infrastructure ─────────────────────────────────────

let _passed = 0;
let _failed = 0;

function assert(condition, label) {
  if (condition) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label}`);
  }
}

function assertEq(actual, expected, label) {
  const pass = actual === expected;
  if (pass) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
}

function assertDeepEq(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (pass) {
    _passed++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    _failed++;
    console.error(`  ❌ FAIL — ${label} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
}

function group(name) {
  console.log(`\n══ ${name} ══`);
}

function summary() {
  console.log(`\n════════════════════════════════════════`);
  console.log(`  Results: ${_passed} passed, ${_failed} failed`);
  console.log(`════════════════════════════════════════`);
  if (_failed === 0) {
    console.log('  🎉 ALL TESTS PASSED');
  } else {
    console.error(`  ⚠️  ${_failed} TEST(S) FAILED`);
  }
}

// ── Store reset helper ──────────────────────────────────────

function resetUIStore() {
  useUIStore.setState({
    selectedNodeId: null,
    inspectorOpen: false,
    inspectorPinned: false,
    contextMenu: null,
    commandPaletteOpen: false,
    toasts: [],
    persistError: null,
    handleOrientation: 'vertical',
  });
}

function resetSimStore() {
  useSimulationStore.setState({
    nodeStates: {},
    flagOverrides: {},
    statusOverrides: {},
    evaluatedEdges: {},
    unreachableNodes: new Set(),
  });
}

function resetAll() {
  resetUIStore();
  resetSimStore();
}

// ── Inline replicas of component logic for testing ──────────

/**
 * Replica of StatusStrip computed-stats logic.
 * Computes: totalNodes, activeNodeCount, activeFlagCount, warningCount
 */
function computeStatusStripStats({
  common = {},
  choice = {},
  ending = {},
  nodeStates = {},
  flags = {},
  flagOverrides = {},
  statusPoints = {},
  statusOverrides = {},
  unreachableNodes = new Set(),
}) {
  // Total nodes
  const totalNodes =
    Object.keys(common).length +
    Object.keys(choice).length +
    Object.keys(ending).length;

  // Active nodes (status !== 'default')
  let activeNodeCount = 0;
  for (const nodeState of Object.values(nodeStates)) {
    if (nodeState.status && nodeState.status !== 'default') {
      activeNodeCount++;
    }
  }

  // Active flags (effective value is true)
  const activeFlagsList = [];
  for (const [flagId, flag] of Object.entries(flags)) {
    const overrideValue = flagOverrides[flagId];
    const effectiveValue = overrideValue ?? flag.state;
    activeFlagsList.push({
      id: flagId,
      name: flag.name || flagId,
      value: effectiveValue,
      isOverridden: overrideValue != null,
    });
  }
  const activeFlagCount = activeFlagsList.filter((f) => f.value).length;

  // Status values (with overrides)
  const statusValuesList = [];
  for (const [spId, sp] of Object.entries(statusPoints)) {
    const overrideValue = statusOverrides[spId];
    const effectiveValue = overrideValue ?? sp.value;
    statusValuesList.push({
      id: spId,
      name: sp.name || spId,
      value: effectiveValue,
      isOverridden: overrideValue != null,
    });
  }

  // Warnings (unreachable nodes)
  const warningCount = unreachableNodes instanceof Set ? unreachableNodes.size : 0;

  return {
    totalNodes,
    activeNodeCount,
    activeFlagCount,
    activeFlagsList,
    statusValuesList,
    warningCount,
  };
}

/**
 * Replica of CommandPalette search/filter logic.
 * Builds searchable items from entity maps and filters by query.
 */
function buildSearchableItems({ common = {}, choice = {}, ending = {}, flag = {}, status = {}, path = {}, chapter = {} }) {
  const items = [];

  for (const node of Object.values(common)) {
    items.push({
      id: node.id,
      name: node.name || node.id,
      desc: `Common Node · ${node.id}`,
      icon: 'common',
      group: 'Entities',
      entityId: node.id,
    });
  }
  for (const ch of Object.values(choice)) {
    items.push({
      id: ch.id,
      name: ch.text || ch.id,
      desc: `Choice · ${ch.id}`,
      icon: 'choice',
      group: 'Entities',
      entityId: ch.id,
    });
  }
  for (const end of Object.values(ending)) {
    items.push({
      id: end.id,
      name: end.name || end.id,
      desc: `Ending · ${end.id}`,
      icon: 'ending',
      group: 'Entities',
      entityId: end.id,
    });
  }
  for (const f of Object.values(flag)) {
    items.push({
      id: f.id,
      name: f.name || f.id,
      desc: `Flag · ${f.id}`,
      icon: 'flag',
      group: 'Flags & Status',
      entityId: f.id,
    });
  }
  for (const sp of Object.values(status)) {
    items.push({
      id: sp.id,
      name: sp.name || sp.id,
      desc: `Status Point · ${sp.id}`,
      icon: 'status',
      group: 'Flags & Status',
      entityId: sp.id,
    });
  }
  for (const p of Object.values(path)) {
    items.push({
      id: p.id,
      name: p.name || p.id,
      desc: `Path · ${p.id}`,
      icon: 'path',
      group: 'Organization',
      entityId: p.id,
    });
  }
  for (const c of Object.values(chapter)) {
    items.push({
      id: c.id,
      name: c.name || c.id,
      desc: `Chapter · ${c.id}`,
      icon: 'chapter',
      group: 'Organization',
      entityId: c.id,
    });
  }

  return items;
}

function filterItems(items, query) {
  if (!query.trim()) return items;
  const lower = query.toLowerCase().trim();
  return items.filter((item) => {
    const nameMatch = (item.name || '').toLowerCase().includes(lower);
    const descMatch = (item.desc || '').toLowerCase().includes(lower);
    const idMatch = (item.id || '').toLowerCase().includes(lower);
    return nameMatch || descMatch || idMatch;
  });
}

function groupItems(items) {
  const groups = {};
  for (const item of items) {
    const group = item.group || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  }
  return groups;
}

// ── Fixtures ────────────────────────────────────────────────

function sampleNarrative() {
  return {
    common: {
      N001: { id: 'N001', name: 'start', type: 'interaction', chapter: 'C001', path: 'P001', flags_set: ['F001'], status_set: [{ status: 'SP001', amount: 5 }], next: [{ id: 'nx1', target: 'CH001', requires: { operator: 'and', conditions: [] } }] },
      N002: { id: 'N002', name: 'middle', type: null, chapter: null, path: null, flags_set: [], status_set: [], next: [] },
    },
    choice: {
      CH001: { id: 'CH001', text: 'what do you do?', chapter: null, path: 'P001', options: [] },
    },
    ending: {
      E001: { id: 'E001', name: 'good_ending', type: 'good_end', chapter: 'C001', path: null },
    },
    flag: {
      F001: { id: 'F001', name: 'key_found', state: false },
      F002: { id: 'F002', name: 'door_open', state: true },
    },
    status: {
      SP001: { id: 'SP001', name: 'health', value: 10, minValue: 0, maxValue: 100 },
      SP002: { id: 'SP002', name: 'mana', value: 5, minValue: null, maxValue: null },
    },
    path: {
      P001: { id: 'P001', name: 'main_route' },
    },
    chapter: {
      C001: { id: 'C001', name: 'chapter_one' },
    },
  };
}


// ════════════════════════════════════════════════════════════
// SECTION A — useUIStore: handleOrientation + toggle
// ════════════════════════════════════════════════════════════

function testHandleOrientation() {
  group('useUIStore — handleOrientation + toggleHandleOrientation');
  resetAll();

  // A.1 Default is 'vertical'
  {
    assertEq(useUIStore.getState().handleOrientation, 'vertical', 'A.1 Default handleOrientation = vertical');
  }

  // A.2 Toggle from vertical → horizontal
  {
    useUIStore.getState().toggleHandleOrientation();
    assertEq(useUIStore.getState().handleOrientation, 'horizontal', 'A.2 Toggle vertical → horizontal');
  }

  // A.3 Toggle from horizontal → vertical
  {
    useUIStore.getState().toggleHandleOrientation();
    assertEq(useUIStore.getState().handleOrientation, 'vertical', 'A.3 Toggle horizontal → vertical');
  }

  // A.4 Set directly to 'horizontal'
  {
    resetUIStore();
    useUIStore.getState().toggleHandleOrientation('horizontal');
    assertEq(useUIStore.getState().handleOrientation, 'horizontal', 'A.4 Direct set to horizontal');
  }

  // A.5 Set directly to 'vertical'
  {
    useUIStore.getState().toggleHandleOrientation('vertical');
    assertEq(useUIStore.getState().handleOrientation, 'vertical', 'A.5 Direct set to vertical');
  }

  // A.6 Multiple rapid toggles
  {
    resetUIStore();
    for (let i = 0; i < 10; i++) {
      useUIStore.getState().toggleHandleOrientation();
    }
    // Even number of toggles → back to initial (vertical)
    assertEq(useUIStore.getState().handleOrientation, 'vertical', 'A.6 10 toggles returns to vertical');
  }

  // A.7 Odd number of toggles
  {
    resetUIStore();
    for (let i = 0; i < 7; i++) {
      useUIStore.getState().toggleHandleOrientation();
    }
    assertEq(useUIStore.getState().handleOrientation, 'horizontal', 'A.7 7 toggles results in horizontal');
  }

  // A.8 Setting same value twice is idempotent
  {
    resetUIStore();
    useUIStore.getState().toggleHandleOrientation('horizontal');
    useUIStore.getState().toggleHandleOrientation('horizontal');
    assertEq(useUIStore.getState().handleOrientation, 'horizontal', 'A.8 Double set horizontal is idempotent');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION B — useUIStore: addToast / removeToast
// ════════════════════════════════════════════════════════════

function testToastManagement() {
  group('useUIStore — addToast / removeToast');
  resetAll();

  // B.1 Add a toast — returns numeric ID
  {
    const id = useUIStore.getState().addToast('Hello', 'info', 0);
    assert(typeof id === 'number', 'B.1 addToast returns a number ID');
    assertEq(useUIStore.getState().toasts.length, 1, 'B.2 One toast in store');
  }

  // B.3 Toast has correct fields
  {
    const toast = useUIStore.getState().toasts[0];
    assertEq(toast.message, 'Hello', 'B.3 Toast message = Hello');
    assertEq(toast.type, 'info', 'B.4 Toast type = info');
    assertEq(toast.duration, 0, 'B.5 Toast duration = 0 (no auto-dismiss)');
    assert(typeof toast.id === 'number', 'B.6 Toast ID is a number');
  }

  // B.7 Add multiple toasts → stack
  {
    resetUIStore();
    useUIStore.getState().addToast('First', 'info', 0);
    useUIStore.getState().addToast('Second', 'success', 0);
    useUIStore.getState().addToast('Third', 'error', 0);
    assertEq(useUIStore.getState().toasts.length, 3, 'B.7 Three toasts stacked');
  }

  // B.8 Toast ordering — first added is first in array
  {
    const toasts = useUIStore.getState().toasts;
    assertEq(toasts[0].message, 'First', 'B.8 First toast is first in array');
    assertEq(toasts[1].message, 'Second', 'B.9 Second toast is second');
    assertEq(toasts[2].message, 'Third', 'B.10 Third toast is third');
  }

  // B.11 Remove a toast by ID
  {
    const toasts = useUIStore.getState().toasts;
    const secondId = toasts[1].id;
    useUIStore.getState().removeToast(secondId);
    assertEq(useUIStore.getState().toasts.length, 2, 'B.11 Two toasts after removing second');
    assertEq(useUIStore.getState().toasts[0].message, 'First', 'B.12 First still present');
    assertEq(useUIStore.getState().toasts[1].message, 'Third', 'B.13 Third still present');
  }

  // B.14 Remove nonexistent toast — no-op
  {
    const countBefore = useUIStore.getState().toasts.length;
    useUIStore.getState().removeToast(999999);
    assertEq(useUIStore.getState().toasts.length, countBefore, 'B.14 Remove nonexistent toast → no-op');
  }

  // B.15 Toast type defaults to 'info'
  {
    resetUIStore();
    useUIStore.getState().addToast('DefaultType', undefined, 0);
    assertEq(useUIStore.getState().toasts[0].type, 'info', 'B.15 Default toast type is info');
  }

  // B.16 All toast types supported
  {
    resetUIStore();
    useUIStore.getState().addToast('Info', 'info', 0);
    useUIStore.getState().addToast('Success', 'success', 0);
    useUIStore.getState().addToast('Warning', 'warning', 0);
    useUIStore.getState().addToast('Error', 'error', 0);
    const types = useUIStore.getState().toasts.map((t) => t.type);
    assertDeepEq(types, ['info', 'success', 'warning', 'error'], 'B.16 All four toast types supported');
  }

  // B.17 Toast IDs are unique
  {
    resetUIStore();
    const ids = [];
    for (let i = 0; i < 20; i++) {
      ids.push(useUIStore.getState().addToast(`toast_${i}`, 'info', 0));
    }
    const unique = new Set(ids);
    assertEq(unique.size, 20, 'B.17 20 toasts have 20 unique IDs');
  }

  // B.18 Remove all toasts
  {
    const allIds = useUIStore.getState().toasts.map((t) => t.id);
    for (const id of allIds) {
      useUIStore.getState().removeToast(id);
    }
    assertEq(useUIStore.getState().toasts.length, 0, 'B.18 All toasts removed → empty array');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION C — useUIStore: showPersistError / clearPersistError
// ════════════════════════════════════════════════════════════

function testPersistError() {
  group('useUIStore — showPersistError / clearPersistError (AR-08)');
  resetAll();

  // C.1 Default is null
  {
    assertEq(useUIStore.getState().persistError, null, 'C.1 Default persistError = null');
  }

  // C.2 Show persist error with custom message
  {
    useUIStore.getState().showPersistError('IndexedDB write failed');
    assertEq(useUIStore.getState().persistError, 'IndexedDB write failed', 'C.2 Custom error message set');
  }

  // C.3 Show persist error with default message
  {
    resetUIStore();
    useUIStore.getState().showPersistError();
    assertEq(useUIStore.getState().persistError, 'Failed to save to IndexedDB', 'C.3 Default error message');
  }

  // C.4 Clear persist error
  {
    useUIStore.getState().clearPersistError();
    assertEq(useUIStore.getState().persistError, null, 'C.4 Error cleared → null');
  }

  // C.5 Clear when already null → no-op
  {
    useUIStore.getState().clearPersistError();
    assertEq(useUIStore.getState().persistError, null, 'C.5 Clear null → still null');
  }

  // C.6 Overwrite existing error
  {
    useUIStore.getState().showPersistError('Error 1');
    useUIStore.getState().showPersistError('Error 2');
    assertEq(useUIStore.getState().persistError, 'Error 2', 'C.6 Second error overwrites first');
  }

  // C.7 persistError is a string, not truthy/falsy
  {
    resetUIStore();
    useUIStore.getState().showPersistError('');
    assertEq(useUIStore.getState().persistError, '', 'C.7 Empty string is stored as-is');
    assertEq(typeof useUIStore.getState().persistError, 'string', 'C.8 Type is string');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION D — useUIStore: toggleCommandPalette
// ════════════════════════════════════════════════════════════

function testCommandPaletteToggle() {
  group('useUIStore — toggleCommandPalette');
  resetAll();

  // D.1 Default is false
  {
    assertEq(useUIStore.getState().commandPaletteOpen, false, 'D.1 Default commandPaletteOpen = false');
  }

  // D.2 Toggle open
  {
    useUIStore.getState().toggleCommandPalette();
    assertEq(useUIStore.getState().commandPaletteOpen, true, 'D.2 Toggle → true');
  }

  // D.3 Toggle closed
  {
    useUIStore.getState().toggleCommandPalette();
    assertEq(useUIStore.getState().commandPaletteOpen, false, 'D.3 Toggle → false');
  }

  // D.4 Set directly to true
  {
    useUIStore.getState().toggleCommandPalette(true);
    assertEq(useUIStore.getState().commandPaletteOpen, true, 'D.4 Direct set true');
  }

  // D.5 Set directly to false
  {
    useUIStore.getState().toggleCommandPalette(false);
    assertEq(useUIStore.getState().commandPaletteOpen, false, 'D.5 Direct set false');
  }

  // D.6 Set false when already false → no-op
  {
    useUIStore.getState().toggleCommandPalette(false);
    assertEq(useUIStore.getState().commandPaletteOpen, false, 'D.6 Double false → still false');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION E — useUIStore: toast auto-dismiss timing
// ════════════════════════════════════════════════════════════

async function testToastAutoDismiss() {
  group('useUIStore — toast auto-dismiss timing');
  resetAll();

  // E.1 Toast with duration=0 does NOT auto-dismiss
  {
    const id = useUIStore.getState().addToast('Persistent', 'info', 0);
    await sleep(100);
    assert(useUIStore.getState().toasts.some((t) => t.id === id), 'E.1 duration=0 toast persists after 100ms');
    useUIStore.getState().removeToast(id); // cleanup
  }

  // E.2 Toast with short duration auto-dismisses
  {
    resetUIStore();
    const id = useUIStore.getState().addToast('ShortLived', 'info', 100);
    assert(useUIStore.getState().toasts.some((t) => t.id === id), 'E.2 Toast present immediately');
    await sleep(200);
    assert(!useUIStore.getState().toasts.some((t) => t.id === id), 'E.3 Toast auto-dismissed after 200ms');
  }

  // E.4 Multiple timed toasts dismiss independently
  {
    resetUIStore();
    const id1 = useUIStore.getState().addToast('Fast', 'info', 80);
    const id2 = useUIStore.getState().addToast('Slow', 'info', 300);
    assertEq(useUIStore.getState().toasts.length, 2, 'E.4 Two timed toasts');

    await sleep(150);
    assert(!useUIStore.getState().toasts.some((t) => t.id === id1), 'E.5 Fast toast dismissed');
    assert(useUIStore.getState().toasts.some((t) => t.id === id2), 'E.6 Slow toast still present');

    await sleep(250);
    assert(!useUIStore.getState().toasts.some((t) => t.id === id2), 'E.7 Slow toast eventually dismissed');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION F — useUIStore: toast stacking + edge cases
// ════════════════════════════════════════════════════════════

function testToastEdgeCases() {
  group('useUIStore — toast edge cases');
  resetAll();

  // F.1 Add toast with empty message
  {
    const id = useUIStore.getState().addToast('', 'info', 0);
    const toast = useUIStore.getState().toasts.find((t) => t.id === id);
    assertEq(toast.message, '', 'F.1 Empty message stored as-is');
    useUIStore.getState().removeToast(id);
  }

  // F.2 Add toast with very long message
  {
    resetUIStore();
    const longMsg = 'A'.repeat(1000);
    const id = useUIStore.getState().addToast(longMsg, 'error', 0);
    const toast = useUIStore.getState().toasts.find((t) => t.id === id);
    assertEq(toast.message.length, 1000, 'F.2 Long message stored fully');
    useUIStore.getState().removeToast(id);
  }

  // F.3 Remove toast that was already removed — no crash
  {
    resetUIStore();
    const id = useUIStore.getState().addToast('RemoveMe', 'info', 0);
    useUIStore.getState().removeToast(id);
    useUIStore.getState().removeToast(id); // double remove
    assertEq(useUIStore.getState().toasts.length, 0, 'F.3 Double remove → no crash, zero toasts');
  }

  // F.4 High volume of toasts
  {
    resetUIStore();
    for (let i = 0; i < 100; i++) {
      useUIStore.getState().addToast(`Toast #${i}`, 'info', 0);
    }
    assertEq(useUIStore.getState().toasts.length, 100, 'F.4 100 toasts stacked');
    // Clean up
    resetUIStore();
  }
}


// ════════════════════════════════════════════════════════════
// SECTION G — StatusStrip computed stats logic
// ════════════════════════════════════════════════════════════

function testStatusStripStats() {
  group('StatusStrip — computed stats logic');

  const narrative = sampleNarrative();

  // G.1 Total nodes = common + choice + ending
  {
    const stats = computeStatusStripStats({
      common: narrative.common,
      choice: narrative.choice,
      ending: narrative.ending,
    });
    assertEq(stats.totalNodes, 4, 'G.1 Total nodes = 2 common + 1 choice + 1 ending = 4');
  }

  // G.2 Active nodes — no sim state → 0
  {
    const stats = computeStatusStripStats({
      common: narrative.common,
      choice: narrative.choice,
      ending: narrative.ending,
      nodeStates: {},
    });
    assertEq(stats.activeNodeCount, 0, 'G.2 No sim state → 0 active nodes');
  }

  // G.3 Active nodes — mixed states
  {
    const stats = computeStatusStripStats({
      common: narrative.common,
      choice: narrative.choice,
      ending: narrative.ending,
      nodeStates: {
        N001: { status: 'active', seen: 'unseen' },
        N002: { status: 'default', seen: 'unseen' },
        CH001: { status: 'locked', seen: 'unseen' },
        E001: { status: 'complete', seen: 'seen' },
      },
    });
    assertEq(stats.activeNodeCount, 3, 'G.3 3 non-default states = 3 active');
  }

  // G.4 Active nodes — default status ignored
  {
    const stats = computeStatusStripStats({
      common: narrative.common,
      nodeStates: {
        N001: { status: 'default', seen: 'unseen' },
        N002: { status: 'default', seen: 'seen' },
      },
    });
    assertEq(stats.activeNodeCount, 0, 'G.4 All default → 0 active');
  }

  // G.5 Active flags — no overrides
  {
    const stats = computeStatusStripStats({
      flags: narrative.flag,
      flagOverrides: {},
    });
    // F001 state=false, F002 state=true → 1 active
    assertEq(stats.activeFlagCount, 1, 'G.5 F002 is true → 1 active flag');
  }

  // G.6 Active flags — override makes false → true
  {
    const stats = computeStatusStripStats({
      flags: narrative.flag,
      flagOverrides: { F001: true },
    });
    // F001 overridden to true, F002 base state true → 2 active
    assertEq(stats.activeFlagCount, 2, 'G.6 F001 overridden to true → 2 active flags');
  }

  // G.7 Active flags — override makes true → false
  {
    const stats = computeStatusStripStats({
      flags: narrative.flag,
      flagOverrides: { F002: false },
    });
    // F001 base false, F002 overridden to false → 0 active
    assertEq(stats.activeFlagCount, 0, 'G.7 F002 overridden to false → 0 active flags');
  }

  // G.8 Active flags — isOverridden flag set correctly
  {
    const stats = computeStatusStripStats({
      flags: narrative.flag,
      flagOverrides: { F001: true },
    });
    const f001 = stats.activeFlagsList.find((f) => f.id === 'F001');
    const f002 = stats.activeFlagsList.find((f) => f.id === 'F002');
    assert(f001.isOverridden === true, 'G.8 F001 marked as overridden');
    assert(f002.isOverridden === false, 'G.9 F002 not overridden');
  }

  // G.10 Status values — no overrides
  {
    const stats = computeStatusStripStats({
      statusPoints: narrative.status,
      statusOverrides: {},
    });
    assertEq(stats.statusValuesList.length, 2, 'G.10 Two status points');
    const health = stats.statusValuesList.find((s) => s.id === 'SP001');
    const mana = stats.statusValuesList.find((s) => s.id === 'SP002');
    assertEq(health.value, 10, 'G.11 Health base value = 10');
    assertEq(mana.value, 5, 'G.12 Mana base value = 5');
  }

  // G.13 Status values — with overrides
  {
    const stats = computeStatusStripStats({
      statusPoints: narrative.status,
      statusOverrides: { SP001: 99 },
    });
    const health = stats.statusValuesList.find((s) => s.id === 'SP001');
    assertEq(health.value, 99, 'G.13 Health overridden to 99');
    assert(health.isOverridden === true, 'G.14 Health marked as overridden');
  }

  // G.15 Warnings — no unreachable nodes
  {
    const stats = computeStatusStripStats({
      unreachableNodes: new Set(),
    });
    assertEq(stats.warningCount, 0, 'G.15 No unreachable → 0 warnings');
  }

  // G.16 Warnings — some unreachable nodes
  {
    const stats = computeStatusStripStats({
      unreachableNodes: new Set(['N002', 'E001']),
    });
    assertEq(stats.warningCount, 2, 'G.16 Two unreachable → 2 warnings');
  }

  // G.17 Empty narrative → zero everything
  {
    const stats = computeStatusStripStats({});
    assertEq(stats.totalNodes, 0, 'G.17 Empty → 0 total nodes');
    assertEq(stats.activeNodeCount, 0, 'G.18 Empty → 0 active nodes');
    assertEq(stats.activeFlagCount, 0, 'G.19 Empty → 0 active flags');
    assertEq(stats.warningCount, 0, 'G.20 Empty → 0 warnings');
  }

  // G.21 Non-Set unreachableNodes → warningCount = 0
  {
    const stats = computeStatusStripStats({
      unreachableNodes: [],
    });
    assertEq(stats.warningCount, 0, 'G.21 Non-Set unreachableNodes → 0 warnings');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION H — CommandPalette search/filter logic
// ════════════════════════════════════════════════════════════

function testCommandPaletteSearch() {
  group('CommandPalette — search/filter logic');

  const narrative = sampleNarrative();
  const items = buildSearchableItems(narrative);

  // H.1 All entities are indexed
  {
    // 2 common + 1 choice + 1 ending + 2 flags + 2 status + 1 path + 1 chapter = 10
    assertEq(items.length, 10, 'H.1 All 10 entities indexed');
  }

  // H.2 Empty query returns all items
  {
    const result = filterItems(items, '');
    assertEq(result.length, items.length, 'H.2 Empty query → all items');
  }

  // H.3 Whitespace-only query returns all items
  {
    const result = filterItems(items, '   ');
    assertEq(result.length, items.length, 'H.3 Whitespace query → all items');
  }

  // H.4 Search by name — exact
  {
    const result = filterItems(items, 'start');
    assert(result.some((i) => i.id === 'N001'), 'H.4 Found N001 by name "start"');
  }

  // H.5 Search by name — partial
  {
    const result = filterItems(items, 'sta');
    assert(result.some((i) => i.id === 'N001'), 'H.5 Found N001 by partial "sta"');
  }

  // H.6 Search by ID
  {
    const result = filterItems(items, 'CH001');
    assert(result.some((i) => i.id === 'CH001'), 'H.6 Found CH001 by ID');
    assertEq(result.length, 1, 'H.7 Only CH001 matches');
  }

  // H.8 Search by ID — case insensitive
  {
    const result = filterItems(items, 'ch001');
    assert(result.some((i) => i.id === 'CH001'), 'H.8 Case-insensitive ID search');
  }

  // H.9 Search by description
  {
    const result = filterItems(items, 'Common Node');
    assert(result.length >= 2, 'H.9 "Common Node" matches at least 2 items');
    assert(result.every((i) => i.desc.includes('Common Node')), 'H.10 All results are common nodes');
  }

  // H.11 Search by flag name
  {
    const result = filterItems(items, 'key_found');
    assert(result.some((i) => i.id === 'F001'), 'H.11 Found F001 by name "key_found"');
  }

  // H.12 No results
  {
    const result = filterItems(items, 'zzzznonexistent');
    assertEq(result.length, 0, 'H.12 Nonsense query → 0 results');
  }

  // H.13 Entity with no name → uses ID as name
  {
    const items2 = buildSearchableItems({
      common: { N099: { id: 'N099', name: '' } },
    });
    assertEq(items2[0].name, 'N099', 'H.13 Empty name → uses ID as name');
  }

  // H.14 Choice uses text as name, not id
  {
    const chItem = items.find((i) => i.id === 'CH001');
    assertEq(chItem.name, 'what do you do?', 'H.14 Choice uses text field as name');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION I — CommandPalette entity grouping logic
// ════════════════════════════════════════════════════════════

function testCommandPaletteGrouping() {
  group('CommandPalette — entity grouping');

  const narrative = sampleNarrative();
  const items = buildSearchableItems(narrative);
  const groups = groupItems(items);

  // I.1 Three groups: Entities, Flags & Status, Organization
  {
    const groupNames = Object.keys(groups);
    assert(groupNames.includes('Entities'), 'I.1 Has "Entities" group');
    assert(groupNames.includes('Flags & Status'), 'I.2 Has "Flags & Status" group');
    assert(groupNames.includes('Organization'), 'I.3 Has "Organization" group');
  }

  // I.4 Entities group contains common, choice, ending
  {
    const entityIds = groups['Entities'].map((i) => i.id);
    assert(entityIds.includes('N001'), 'I.4 N001 in Entities');
    assert(entityIds.includes('N002'), 'I.5 N002 in Entities');
    assert(entityIds.includes('CH001'), 'I.6 CH001 in Entities');
    assert(entityIds.includes('E001'), 'I.7 E001 in Entities');
    assertEq(groups['Entities'].length, 4, 'I.8 4 items in Entities');
  }

  // I.9 Flags & Status group
  {
    const fsIds = groups['Flags & Status'].map((i) => i.id);
    assert(fsIds.includes('F001'), 'I.9 F001 in Flags & Status');
    assert(fsIds.includes('F002'), 'I.10 F002 in Flags & Status');
    assert(fsIds.includes('SP001'), 'I.11 SP001 in Flags & Status');
    assert(fsIds.includes('SP002'), 'I.12 SP002 in Flags & Status');
    assertEq(groups['Flags & Status'].length, 4, 'I.13 4 items in Flags & Status');
  }

  // I.14 Organization group
  {
    const orgIds = groups['Organization'].map((i) => i.id);
    assert(orgIds.includes('P001'), 'I.14 P001 in Organization');
    assert(orgIds.includes('C001'), 'I.15 C001 in Organization');
    assertEq(groups['Organization'].length, 2, 'I.16 2 items in Organization');
  }

  // I.17 Icon types are correct
  {
    const n001 = items.find((i) => i.id === 'N001');
    const ch001 = items.find((i) => i.id === 'CH001');
    const e001 = items.find((i) => i.id === 'E001');
    const f001 = items.find((i) => i.id === 'F001');
    const sp001 = items.find((i) => i.id === 'SP001');
    const p001 = items.find((i) => i.id === 'P001');
    const c001 = items.find((i) => i.id === 'C001');
    assertEq(n001.icon, 'common', 'I.17 N001 icon = common');
    assertEq(ch001.icon, 'choice', 'I.18 CH001 icon = choice');
    assertEq(e001.icon, 'ending', 'I.19 E001 icon = ending');
    assertEq(f001.icon, 'flag', 'I.20 F001 icon = flag');
    assertEq(sp001.icon, 'status', 'I.21 SP001 icon = status');
    assertEq(p001.icon, 'path', 'I.22 P001 icon = path');
    assertEq(c001.icon, 'chapter', 'I.23 C001 icon = chapter');
  }

  // I.24 Empty narrative → no groups
  {
    const emptyItems = buildSearchableItems({});
    const emptyGroups = groupItems(emptyItems);
    assertEq(Object.keys(emptyGroups).length, 0, 'I.24 Empty narrative → no groups');
  }
}


// ════════════════════════════════════════════════════════════
// SECTION J — Handle orientation integration validation
// ════════════════════════════════════════════════════════════

function testHandleOrientationIntegration() {
  group('Handle orientation — store shape validation');
  resetAll();

  // J.1 handleOrientation is part of initial store state
  {
    const state = useUIStore.getState();
    assert('handleOrientation' in state, 'J.1 handleOrientation exists in store state');
  }

  // J.2 toggleHandleOrientation is a function
  {
    const state = useUIStore.getState();
    assertEq(typeof state.toggleHandleOrientation, 'function', 'J.2 toggleHandleOrientation is a function');
  }

  // J.3 handleOrientation is only 'vertical' or 'horizontal'
  {
    resetUIStore();
    const valid1 = useUIStore.getState().handleOrientation;
    assert(valid1 === 'vertical' || valid1 === 'horizontal', 'J.3 Initial value is valid');

    useUIStore.getState().toggleHandleOrientation();
    const valid2 = useUIStore.getState().handleOrientation;
    assert(valid2 === 'vertical' || valid2 === 'horizontal', 'J.4 After toggle, value is valid');
  }

  // J.5 handleOrientation does not affect other state
  {
    resetUIStore();
    useUIStore.getState().selectNode('N001');
    useUIStore.getState().openInspector();
    useUIStore.getState().addToast('Test', 'info', 0);

    const before = {
      selectedNodeId: useUIStore.getState().selectedNodeId,
      inspectorOpen: useUIStore.getState().inspectorOpen,
      toastCount: useUIStore.getState().toasts.length,
    };

    useUIStore.getState().toggleHandleOrientation();

    const after = {
      selectedNodeId: useUIStore.getState().selectedNodeId,
      inspectorOpen: useUIStore.getState().inspectorOpen,
      toastCount: useUIStore.getState().toasts.length,
    };

    assertEq(after.selectedNodeId, before.selectedNodeId, 'J.5 selectedNodeId unchanged');
    assertEq(after.inspectorOpen, before.inspectorOpen, 'J.6 inspectorOpen unchanged');
    assertEq(after.toastCount, before.toastCount, 'J.7 toast count unchanged');
  }
}


// ── Utility ─────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// ════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ════════════════════════════════════════════════════════════

async function runAll() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Phase 13: Chrome System Tests         ║');
  console.log('╚════════════════════════════════════════╝');

  testHandleOrientation();
  testToastManagement();
  testPersistError();
  testCommandPaletteToggle();
  await testToastAutoDismiss();
  testToastEdgeCases();
  testStatusStripStats();
  testCommandPaletteSearch();
  testCommandPaletteGrouping();
  testHandleOrientationIntegration();

  summary();
}

runAll();
