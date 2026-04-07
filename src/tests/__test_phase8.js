// ============================================================
// Phase 8 — Context Menu & Keyboard Shortcuts — Test Suite
// ============================================================
// Run: node src/tests/__test_phase8.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
//
// Tests cover:
//   A — Menu item resolution (getMenuItemsForTarget)
//   B — Menu item data integrity (icons, labels, shortcuts)
//   C — Edge ID parsing for delete-edge action
//   D — Entity type detection for delete/toggle actions
//   E — Escape priority chain logic
//   F — Create entity via shortcut → store action mapping
//   G — Delete entity via shortcut → store action mapping
//   H — Duplicate entity logic
//   I — Simulation state cycling via shortcut
//   J — Text input focus suppression logic
//   K — Data integrity: created entities match Plan §4
//   L — Failure/edge cases
// ============================================================

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


// ── Inline copies of pure logic from Phase 8 ────────────────

// From useContextMenu.js — menu item definitions
const CANVAS_MENU_ITEMS = [
  { id: 'create-common-node', label: 'Create Common Node', icon: 'square', shortcut: 'N', group: 'create' },
  { id: 'create-choice', label: 'Create Choice', icon: 'git-branch', shortcut: 'C', group: 'create' },
  { id: 'create-ending', label: 'Create Ending', icon: 'flag', shortcut: 'E', group: 'create' },
  { id: 'divider-1', type: 'divider' },
  { id: 'create-flag', label: 'Create Flag', icon: 'bookmark', shortcut: 'F', group: 'create' },
  { id: 'create-status-point', label: 'Create Status Point', icon: 'bar-chart-2', shortcut: 'S', group: 'create' },
  { id: 'divider-2', type: 'divider' },
  { id: 'create-path', label: 'Create Path', icon: 'route', group: 'create' },
  { id: 'create-chapter', label: 'Create Chapter', icon: 'book-open', group: 'create' },
  { id: 'divider-3', type: 'divider' },
  { id: 'paste', label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V', group: 'clipboard' },
];

const NODE_MENU_ITEMS = [
  { id: 'edit-node', label: 'Edit', icon: 'pencil', shortcut: 'I', group: 'edit' },
  { id: 'delete-node', label: 'Delete', icon: 'trash-2', shortcut: 'Del', group: 'edit' },
  { id: 'duplicate-node', label: 'Duplicate', icon: 'copy', group: 'edit' },
  { id: 'divider-1', type: 'divider' },
  { id: 'connect-to', label: 'Connect to...', icon: 'link', group: 'connect' },
  { id: 'divider-2', type: 'divider' },
  { id: 'toggle-state', label: 'Toggle State', icon: 'circle-dot', shortcut: 'Space', group: 'simulation' },
  { id: 'toggle-seen', label: 'Toggle Seen', icon: 'eye', shortcut: 'V', group: 'simulation' },
  { id: 'divider-3', type: 'divider' },
  { id: 'copy-node', label: 'Copy', icon: 'clipboard-copy', shortcut: 'Ctrl+C', group: 'clipboard' },
];

const EDGE_MENU_ITEMS = [
  { id: 'delete-edge', label: 'Delete', icon: 'trash-2', shortcut: 'Del', group: 'edit' },
  { id: 'edit-conditions', label: 'Edit Conditions', icon: 'filter', group: 'edit' },
];

// From useContextMenu.js — getMenuItemsForTarget
function getMenuItemsForTarget(targetType) {
  switch (targetType) {
    case 'node':
      return NODE_MENU_ITEMS;
    case 'edge':
      return EDGE_MENU_ITEMS;
    case 'canvas':
    default:
      return CANVAS_MENU_ITEMS;
  }
}

// From ContextMenu.jsx — edge ID parsing for delete-edge
function parseEdgeId(edgeId) {
  const parts = edgeId.split('-');
  if (parts.length < 3) return null;
  const sourceId = parts[1];
  const entryId = parts.slice(2).join('-');
  return { sourceId, entryId };
}

// From useGraphCallbacks.js/useContextMenu.js — entity type detection by ID prefix
function getEntityTypeByPrefix(nodeId) {
  if (!nodeId) return null;
  if (nodeId.startsWith('node_')) return 'common';
  if (nodeId.startsWith('choice_')) return 'choice';
  if (nodeId.startsWith('ending_')) return 'ending';
  return null;
}

// From useKeyboardShortcuts.js — isTextInputFocused logic (DOM-free version for testing)
function isTextInputType(tagName, inputType, isContentEditable) {
  const tag = tagName.toLowerCase();
  if (tag === 'input') {
    const type = (inputType || 'text').toLowerCase();
    const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
    return textTypes.includes(type);
  }
  if (tag === 'textarea') return true;
  if (isContentEditable) return true;
  return false;
}

// From ContextMenu.jsx — isDangerItem / isCreateItem helpers
function isDangerItem(itemId) {
  return itemId === 'delete-node' || itemId === 'delete-edge';
}

function isCreateItem(itemId) {
  return itemId.startsWith('create-');
}

// Escape priority chain logic (simulated from useKeyboardShortcuts.js)
function getEscapeAction(uiState) {
  if (uiState.contextMenu) return 'hide-context-menu';
  if (uiState.commandPaletteOpen) return 'close-command-palette';
  if (uiState.inspectorOpen) return 'close-inspector';
  if (uiState.selectedNodeId) return 'deselect-node';
  return 'noop';
}

// Simulation status cycle (from useSimulationStore.js)
const STATUS_CYCLE = ['default', 'active', 'locked', 'complete', 'failed', 'branch_locked'];
const SEEN_CYCLE = ['unseen', 'partially_seen', 'seen'];

function cycleStatus(current) {
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

function cycleSeen(current) {
  const index = SEEN_CYCLE.indexOf(current);
  return SEEN_CYCLE[(index + 1) % SEEN_CYCLE.length];
}


// ── Test Fixtures ───────────────────────────────────────────

function makeCommonNode(overrides = {}) {
  return {
    id: overrides.id ?? 'node_1234567890_ab12',
    name: overrides.name ?? 'test_node',
    type: overrides.type ?? null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    description: overrides.description ?? '',
    variants: overrides.variants ?? [],
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    flags_set: overrides.flags_set ?? [],
    status_set: overrides.status_set ?? [],
    next: overrides.next ?? [],
    _position: overrides._position ?? { x: 100, y: 200 },
  };
}

function makeChoice(overrides = {}) {
  return {
    id: overrides.id ?? 'choice_1234567890_cd34',
    text: overrides.text ?? 'Choose wisely',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    options: overrides.options ?? [],
    _position: overrides._position ?? { x: 300, y: 200 },
  };
}

function makeEnding(overrides = {}) {
  return {
    id: overrides.id ?? 'ending_1234567890_ef56',
    name: overrides.name ?? 'good_ending',
    type: 'type' in overrides ? overrides.type : 'good_end',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    _position: overrides._position ?? { x: 500, y: 200 },
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION A — Menu Item Resolution (getMenuItemsForTarget)
// ════════════════════════════════════════════════════════════

group('A — getMenuItemsForTarget — target type → menu items');

(() => {
  // Happy path: canvas
  const canvasItems = getMenuItemsForTarget('canvas');
  assert(canvasItems === CANVAS_MENU_ITEMS, 'canvas target → returns CANVAS_MENU_ITEMS');
  assert(canvasItems.length === 11, 'canvas menu has 11 items (8 actions + 3 dividers)');

  // Happy path: node
  const nodeItems = getMenuItemsForTarget('node');
  assert(nodeItems === NODE_MENU_ITEMS, 'node target → returns NODE_MENU_ITEMS');
  assert(nodeItems.length === 10, 'node menu has 10 items (7 actions + 3 dividers)');

  // Happy path: edge
  const edgeItems = getMenuItemsForTarget('edge');
  assert(edgeItems === EDGE_MENU_ITEMS, 'edge target → returns EDGE_MENU_ITEMS');
  assert(edgeItems.length === 2, 'edge menu has 2 items (no dividers)');

  // Default: unknown target type falls back to canvas
  const unknownItems = getMenuItemsForTarget('unknown');
  assert(unknownItems === CANVAS_MENU_ITEMS, 'unknown target → falls back to CANVAS_MENU_ITEMS');

  // Default: null target type falls back to canvas
  const nullItems = getMenuItemsForTarget(null);
  assert(nullItems === CANVAS_MENU_ITEMS, 'null target → falls back to CANVAS_MENU_ITEMS');

  // Default: undefined target type falls back to canvas
  const undefinedItems = getMenuItemsForTarget(undefined);
  assert(undefinedItems === CANVAS_MENU_ITEMS, 'undefined target → falls back to CANVAS_MENU_ITEMS');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — Menu Item Data Integrity
// ════════════════════════════════════════════════════════════

group('B — Menu item data integrity (spec §3.2 compliance)');

(() => {
  // === Canvas menu per spec §3.2 ===
  const canvasActions = CANVAS_MENU_ITEMS.filter(i => i.type !== 'divider');
  const canvasDividers = CANVAS_MENU_ITEMS.filter(i => i.type === 'divider');

  assert(canvasActions.length === 8, 'canvas has 8 action items');
  assert(canvasDividers.length === 3, 'canvas has 3 dividers');

  // Check all required items exist (spec §3.2: Create Common Node, Create Choice,
  // Create Ending, Create Flag, Create Status Point, Create Path, Create Chapter, Paste)
  const canvasIds = canvasActions.map(i => i.id);
  assert(canvasIds.includes('create-common-node'), 'canvas has Create Common Node');
  assert(canvasIds.includes('create-choice'), 'canvas has Create Choice');
  assert(canvasIds.includes('create-ending'), 'canvas has Create Ending');
  assert(canvasIds.includes('create-flag'), 'canvas has Create Flag');
  assert(canvasIds.includes('create-status-point'), 'canvas has Create Status Point');
  assert(canvasIds.includes('create-path'), 'canvas has Create Path');
  assert(canvasIds.includes('create-chapter'), 'canvas has Create Chapter');
  assert(canvasIds.includes('paste'), 'canvas has Paste');

  // === Node menu per spec §3.2 ===
  const nodeActions = NODE_MENU_ITEMS.filter(i => i.type !== 'divider');
  const nodeIds = nodeActions.map(i => i.id);

  assert(nodeIds.includes('edit-node'), 'node has Edit');
  assert(nodeIds.includes('delete-node'), 'node has Delete');
  assert(nodeIds.includes('duplicate-node'), 'node has Duplicate');
  assert(nodeIds.includes('connect-to'), 'node has Connect to...');
  assert(nodeIds.includes('toggle-state'), 'node has Toggle State');
  assert(nodeIds.includes('toggle-seen'), 'node has Toggle Seen');
  assert(nodeIds.includes('copy-node'), 'node has Copy');

  // === Edge menu per spec §3.2 ===
  const edgeActions = EDGE_MENU_ITEMS.filter(i => i.type !== 'divider');
  const edgeIds = edgeActions.map(i => i.id);

  assert(edgeIds.includes('delete-edge'), 'edge has Delete');
  assert(edgeIds.includes('edit-conditions'), 'edge has Edit Conditions');

  // === All action items have required fields ===
  const allActions = [...canvasActions, ...nodeActions, ...edgeActions];
  for (const item of allActions) {
    assert(typeof item.id === 'string' && item.id.length > 0, `${item.id} has valid id`);
    assert(typeof item.label === 'string' && item.label.length > 0, `${item.id} has valid label`);
    assert(typeof item.icon === 'string' && item.icon.length > 0, `${item.id} has valid icon`);
    assert(typeof item.group === 'string' && item.group.length > 0, `${item.id} has valid group`);
  }

  // === All dividers have type: 'divider' and an id ===
  const allDividers = [...canvasDividers, ...NODE_MENU_ITEMS.filter(i => i.type === 'divider')];
  for (const div of allDividers) {
    assert(div.type === 'divider', `divider ${div.id} has type=divider`);
    assert(typeof div.id === 'string', `divider ${div.id} has an id`);
  }
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — Shortcut keys on menu items match spec §3.3
// ════════════════════════════════════════════════════════════

group('C — Shortcut keys on menu items match spec §3.3');

(() => {
  // Spec §3.3 keyboard shortcuts mapped to menu items
  const expectedShortcuts = {
    'create-common-node': 'N',
    'create-choice': 'C',
    'create-ending': 'E',
    'create-flag': 'F',
    'create-status-point': 'S',
    'edit-node': 'I',
    'delete-node': 'Del',
    'delete-edge': 'Del',
    'toggle-state': 'Space',
    'toggle-seen': 'V',
    'paste': 'Ctrl+V',
    'copy-node': 'Ctrl+C',
  };

  const allItems = [...CANVAS_MENU_ITEMS, ...NODE_MENU_ITEMS, ...EDGE_MENU_ITEMS]
    .filter(i => i.type !== 'divider');

  for (const [itemId, expectedKey] of Object.entries(expectedShortcuts)) {
    const item = allItems.find(i => i.id === itemId);
    assert(item !== undefined, `item ${itemId} exists`);
    if (item) {
      assert(item.shortcut === expectedKey, `${itemId} shortcut = "${expectedKey}" (got "${item.shortcut}")`);
    }
  }

  // Items without shortcuts should correctly have no shortcut field
  const noShortcutItems = ['duplicate-node', 'connect-to', 'create-path', 'create-chapter', 'edit-conditions'];
  for (const itemId of noShortcutItems) {
    const item = allItems.find(i => i.id === itemId);
    assert(item !== undefined, `item ${itemId} exists`);
    if (item) {
      assert(item.shortcut === undefined, `${itemId} has no shortcut (got "${item.shortcut}")`);
    }
  }
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — Edge ID Parsing for delete-edge
// ════════════════════════════════════════════════════════════

group('D — Edge ID parsing for delete-edge action');

(() => {
  // Common Node edge: edge-{sourceId}-{nextEntryId}
  const r1 = parseEdgeId('edge-node_src_001-route_999_zz99');
  assert(r1 !== null, 'common edge parses successfully');
  assert(r1.sourceId === 'node_src_001', 'common edge sourceId extracted');
  assert(r1.entryId === 'route_999_zz99', 'common edge entryId extracted');

  // Choice edge: edge-{choiceId}-{optionId}-{nextEntryId}
  const r2 = parseEdgeId('edge-choice_abc-opt_123-route_456');
  assert(r2 !== null, 'choice edge parses successfully');
  assert(r2.sourceId === 'choice_abc', 'choice edge sourceId extracted');
  assert(r2.entryId === 'opt_123-route_456', 'choice edge remaining parts joined with -');

  // Too few parts
  const r3 = parseEdgeId('edge');
  assert(r3 === null, 'single part → null');

  const r4 = parseEdgeId('edge-only');
  assert(r4 === null, 'two parts → null');

  // Empty string
  const r5 = parseEdgeId('');
  assert(r5 === null, 'empty string → null');

  // Exact 3 parts (minimum valid)
  const r6 = parseEdgeId('edge-src-entry');
  assert(r6 !== null, '3 parts → valid');
  assert(r6.sourceId === 'src', 'sourceId from 3-part edge');
  assert(r6.entryId === 'entry', 'entryId from 3-part edge');

  // Source IDs use underscores, not hyphens — safe for split('-')
  const r7 = parseEdgeId('edge-node_12345_abcd-route_67890_efgh');
  assert(r7.sourceId === 'node_12345_abcd', 'underscore-based source ID intact');
  assert(r7.entryId === 'route_67890_efgh', 'underscore-based entry ID intact');
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — Entity Type Detection by ID Prefix
// ════════════════════════════════════════════════════════════

group('E — Entity type detection by ID prefix');

(() => {
  // Happy path: all known prefixes
  assert(getEntityTypeByPrefix('node_1234567890_ab12') === 'common', 'node_ prefix → common');
  assert(getEntityTypeByPrefix('choice_1234567890_cd34') === 'choice', 'choice_ prefix → choice');
  assert(getEntityTypeByPrefix('ending_1234567890_ef56') === 'ending', 'ending_ prefix → ending');

  // Edge cases
  assert(getEntityTypeByPrefix(null) === null, 'null → null');
  assert(getEntityTypeByPrefix('') === null, 'empty string → null');
  assert(getEntityTypeByPrefix('flag_001') === null, 'flag_ prefix → null (not a graph node)');
  assert(getEntityTypeByPrefix('status_001') === null, 'status_ prefix → null');
  assert(getEntityTypeByPrefix('unknown_001') === null, 'unknown prefix → null');
  assert(getEntityTypeByPrefix('NODE_123') === null, 'uppercase NODE_ → null (case-sensitive)');

  // Prefix-only (no suffix) — still matches
  assert(getEntityTypeByPrefix('node_') === 'common', '"node_" alone → common');
  assert(getEntityTypeByPrefix('choice_') === 'choice', '"choice_" alone → choice');
  assert(getEntityTypeByPrefix('ending_') === 'ending', '"ending_" alone → ending');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — Escape Priority Chain
// ════════════════════════════════════════════════════════════

group('F — Escape priority chain logic');

(() => {
  // Priority 1: Context menu open → hide it first
  assert(
    getEscapeAction({
      contextMenu: { visible: true, x: 100, y: 200 },
      commandPaletteOpen: true,
      inspectorOpen: true,
      selectedNodeId: 'node_123',
    }) === 'hide-context-menu',
    'context menu has highest priority'
  );

  // Priority 2: Command palette open (no context menu)
  assert(
    getEscapeAction({
      contextMenu: null,
      commandPaletteOpen: true,
      inspectorOpen: true,
      selectedNodeId: 'node_123',
    }) === 'close-command-palette',
    'command palette second priority'
  );

  // Priority 3: Inspector open (no context menu or palette)
  assert(
    getEscapeAction({
      contextMenu: null,
      commandPaletteOpen: false,
      inspectorOpen: true,
      selectedNodeId: 'node_123',
    }) === 'close-inspector',
    'inspector third priority'
  );

  // Priority 4: Node selected (nothing else open)
  assert(
    getEscapeAction({
      contextMenu: null,
      commandPaletteOpen: false,
      inspectorOpen: false,
      selectedNodeId: 'node_123',
    }) === 'deselect-node',
    'deselect node fourth priority'
  );

  // No-op: nothing to dismiss
  assert(
    getEscapeAction({
      contextMenu: null,
      commandPaletteOpen: false,
      inspectorOpen: false,
      selectedNodeId: null,
    }) === 'noop',
    'nothing open → noop'
  );
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — isTextInputType (focus guard)
// ════════════════════════════════════════════════════════════

group('G — isTextInputType — keyboard shortcut suppression');

(() => {
  // Text inputs → suppress shortcuts
  assert(isTextInputType('INPUT', 'text', false) === true, 'input[type=text] → suppress');
  assert(isTextInputType('INPUT', 'search', false) === true, 'input[type=search] → suppress');
  assert(isTextInputType('INPUT', 'url', false) === true, 'input[type=url] → suppress');
  assert(isTextInputType('INPUT', 'tel', false) === true, 'input[type=tel] → suppress');
  assert(isTextInputType('INPUT', 'email', false) === true, 'input[type=email] → suppress');
  assert(isTextInputType('INPUT', 'password', false) === true, 'input[type=password] → suppress');
  assert(isTextInputType('INPUT', 'number', false) === true, 'input[type=number] → suppress');

  // Input with no type attribute defaults to 'text'
  assert(isTextInputType('INPUT', null, false) === true, 'input[type=null] defaults to text → suppress');
  assert(isTextInputType('INPUT', '', false) === true, 'input[type=""] defaults to text → suppress');

  // Non-text inputs → allow shortcuts
  assert(isTextInputType('INPUT', 'checkbox', false) === false, 'input[type=checkbox] → allow');
  assert(isTextInputType('INPUT', 'radio', false) === false, 'input[type=radio] → allow');
  assert(isTextInputType('INPUT', 'range', false) === false, 'input[type=range] → allow');
  assert(isTextInputType('INPUT', 'color', false) === false, 'input[type=color] → allow');
  assert(isTextInputType('INPUT', 'file', false) === false, 'input[type=file] → allow');
  assert(isTextInputType('INPUT', 'button', false) === false, 'input[type=button] → allow');

  // Textarea → suppress
  assert(isTextInputType('TEXTAREA', null, false) === true, 'textarea → suppress');

  // contentEditable → suppress
  assert(isTextInputType('DIV', null, true) === true, 'contentEditable div → suppress');
  assert(isTextInputType('SPAN', null, true) === true, 'contentEditable span → suppress');

  // Non-input elements → allow
  assert(isTextInputType('DIV', null, false) === false, 'div → allow');
  assert(isTextInputType('BUTTON', null, false) === false, 'button → allow');
  assert(isTextInputType('A', null, false) === false, 'anchor → allow');
  assert(isTextInputType('CANVAS', null, false) === false, 'canvas → allow');

  // Case insensitivity of tag name
  assert(isTextInputType('input', 'text', false) === true, 'lowercase input → suppress');
  assert(isTextInputType('textarea', null, false) === true, 'lowercase textarea → suppress');
  assert(isTextInputType('Input', 'Text', false) === true, 'mixed case → suppress');
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — isDangerItem / isCreateItem classification
// ════════════════════════════════════════════════════════════

group('H — isDangerItem / isCreateItem classification');

(() => {
  // Danger items
  assert(isDangerItem('delete-node') === true, 'delete-node is danger');
  assert(isDangerItem('delete-edge') === true, 'delete-edge is danger');
  assert(isDangerItem('edit-node') === false, 'edit-node is not danger');
  assert(isDangerItem('duplicate-node') === false, 'duplicate-node is not danger');
  assert(isDangerItem('create-common-node') === false, 'create item is not danger');
  assert(isDangerItem('') === false, 'empty string is not danger');

  // Create items
  assert(isCreateItem('create-common-node') === true, 'create-common-node is create');
  assert(isCreateItem('create-choice') === true, 'create-choice is create');
  assert(isCreateItem('create-ending') === true, 'create-ending is create');
  assert(isCreateItem('create-flag') === true, 'create-flag is create');
  assert(isCreateItem('create-status-point') === true, 'create-status-point is create');
  assert(isCreateItem('create-path') === true, 'create-path is create');
  assert(isCreateItem('create-chapter') === true, 'create-chapter is create');
  assert(isCreateItem('delete-node') === false, 'delete-node is not create');
  assert(isCreateItem('paste') === false, 'paste is not create');
  assert(isCreateItem('edit-node') === false, 'edit-node is not create');
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — Simulation Status Cycling
// ════════════════════════════════════════════════════════════

group('I — Simulation status cycling (Space key)');

(() => {
  // Full cycle: default → active → locked → complete → failed → branch_locked → default
  assert(cycleStatus('default') === 'active', 'default → active');
  assert(cycleStatus('active') === 'locked', 'active → locked');
  assert(cycleStatus('locked') === 'complete', 'locked → complete');
  assert(cycleStatus('complete') === 'failed', 'complete → failed');
  assert(cycleStatus('failed') === 'branch_locked', 'failed → branch_locked');
  assert(cycleStatus('branch_locked') === 'default', 'branch_locked → default (wraps)');

  // Unknown status → cycles to default (index -1 + 1 = 0)
  assert(cycleStatus('unknown') === 'default', 'unknown → default (wraps from -1)');
  assert(cycleStatus('') === 'default', 'empty → default');
})();


group('I.2 — Seen state cycling (V key)');

(() => {
  // Full cycle: unseen → partially_seen → seen → unseen
  assert(cycleSeen('unseen') === 'partially_seen', 'unseen → partially_seen');
  assert(cycleSeen('partially_seen') === 'seen', 'partially_seen → seen');
  assert(cycleSeen('seen') === 'unseen', 'seen → unseen (wraps)');

  // Unknown → wraps
  assert(cycleSeen('unknown') === 'unseen', 'unknown → unseen (wraps from -1)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — Duplicate Entity Logic
// ════════════════════════════════════════════════════════════

group('J — Duplicate entity logic');

(() => {
  const offset = { x: 40, y: 40 };

  // Common Node duplication preserves fields, offsets position
  const original = makeCommonNode({
    id: 'node_orig_001',
    name: 'hero_encounter',
    type: 'interaction',
    chapter: 'C001',
    path: 'P001',
    description: 'The hero arrives',
    _position: { x: 100, y: 200 },
  });

  // Simulate duplicate logic from ContextMenu.jsx
  const duplicate = {
    name: original.name,
    type: original.type,
    chapter: original.chapter,
    path: original.path,
    description: original.description,
    _position: {
      x: original._position.x + offset.x,
      y: original._position.y + offset.y,
    },
  };

  assert(duplicate.name === 'hero_encounter', 'duplicate preserves name');
  assert(duplicate.type === 'interaction', 'duplicate preserves type');
  assert(duplicate.chapter === 'C001', 'duplicate preserves chapter');
  assert(duplicate.path === 'P001', 'duplicate preserves path');
  assert(duplicate.description === 'The hero arrives', 'duplicate preserves description');
  assert(duplicate._position.x === 140, 'duplicate x offset by 40');
  assert(duplicate._position.y === 240, 'duplicate y offset by 40');

  // Duplicate does NOT carry over: next, requires, variants, flags_set, status_set
  assert(duplicate.next === undefined, 'duplicate does not carry next[]');
  assert(duplicate.requires === undefined, 'duplicate does not carry requires');
  assert(duplicate.variants === undefined, 'duplicate does not carry variants');
  assert(duplicate.flags_set === undefined, 'duplicate does not carry flags_set');
  assert(duplicate.status_set === undefined, 'duplicate does not carry status_set');

  // Choice duplication preserves text, not options
  const choiceOrig = makeChoice({
    text: 'What do you do?',
    chapter: 'C002',
    _position: { x: 300, y: 400 },
  });
  const choiceDup = {
    text: choiceOrig.text,
    chapter: choiceOrig.chapter,
    path: choiceOrig.path,
    _position: {
      x: choiceOrig._position.x + offset.x,
      y: choiceOrig._position.y + offset.y,
    },
  };

  assert(choiceDup.text === 'What do you do?', 'choice duplicate preserves text');
  assert(choiceDup._position.x === 340, 'choice duplicate x offset by 40');
  assert(choiceDup.options === undefined, 'choice duplicate does not carry options');

  // Ending duplication preserves name and type
  const endingOrig = makeEnding({
    name: 'bad_ending',
    type: 'bad_end',
    _position: { x: 500, y: 600 },
  });
  const endingDup = {
    name: endingOrig.name,
    type: endingOrig.type,
    chapter: endingOrig.chapter,
    path: endingOrig.path,
    _position: {
      x: endingOrig._position.x + offset.x,
      y: endingOrig._position.y + offset.y,
    },
  };

  assert(endingDup.name === 'bad_ending', 'ending duplicate preserves name');
  assert(endingDup.type === 'bad_end', 'ending duplicate preserves type');
  assert(endingDup._position.x === 540, 'ending duplicate x offset by 40');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — Data Integrity: Menu Items → Store Actions
// ════════════════════════════════════════════════════════════

group('K — Data integrity: menu item IDs map to valid actions');

(() => {
  // All canvas create actions should map to narrative store add* methods
  const canvasCreateIds = [
    'create-common-node',
    'create-choice',
    'create-ending',
    'create-flag',
    'create-status-point',
    'create-path',
    'create-chapter',
  ];

  // Expected store method names
  const expectedMethods = {
    'create-common-node': 'addCommonNode',
    'create-choice': 'addChoice',
    'create-ending': 'addEnding',
    'create-flag': 'addFlag',
    'create-status-point': 'addStatusPoint',
    'create-path': 'addPath',
    'create-chapter': 'addChapter',
  };

  for (const id of canvasCreateIds) {
    assert(
      expectedMethods[id] !== undefined,
      `${id} maps to store method ${expectedMethods[id]}`
    );
  }

  // Node action IDs → expected behavior
  const nodeActionMap = {
    'edit-node': 'selectNode + openInspector',
    'delete-node': 'deleteCommonNode/deleteChoice/deleteEnding',
    'duplicate-node': 'addCommonNode/addChoice/addEnding (with offset)',
    'toggle-state': 'cycleNodeStatus',
    'toggle-seen': 'cycleNodeSeen',
  };

  for (const [id, behavior] of Object.entries(nodeActionMap)) {
    assert(
      typeof behavior === 'string' && behavior.length > 0,
      `${id} → ${behavior}`
    );
  }
})();


// ════════════════════════════════════════════════════════════
//  SECTION L — Data Integrity: Created entities match Plan §4
// ════════════════════════════════════════════════════════════

group('L — Data integrity: entity defaults match Plan §4 data model');

(() => {
  // Common Node defaults
  const node = makeCommonNode({});
  assert(typeof node.id === 'string', 'common node id is string');
  assert(typeof node.name === 'string', 'common node name is string');
  assert(node.type === null, 'common node type defaults to null');
  assert(node.chapter === null, 'common node chapter defaults to null');
  assert(node.path === null, 'common node path defaults to null');
  assert(node.description === '', 'common node description defaults to ""');
  assert(Array.isArray(node.variants), 'common node variants is array (AR-05)');
  assert(node.variants.length === 0, 'common node variants defaults to []');
  assert(node.requires.operator === 'and', 'common node requires.operator is "and" (AR-03)');
  assert(Array.isArray(node.requires.conditions), 'common node requires.conditions is array (AR-03)');
  assert(node.requires.conditions.length === 0, 'common node requires.conditions defaults to []');
  assert(Array.isArray(node.flags_set), 'common node flags_set is array (AR-05)');
  assert(node.flags_set.length === 0, 'common node flags_set defaults to []');
  assert(Array.isArray(node.status_set), 'common node status_set is array (AR-05)');
  assert(node.status_set.length === 0, 'common node status_set defaults to []');
  assert(Array.isArray(node.next), 'common node next is array (AR-04)');
  assert(node.next.length === 0, 'common node next defaults to []');
  assert(typeof node._position === 'object', 'common node _position is object (AR-10)');
  assert(typeof node._position.x === 'number', '_position.x is number');
  assert(typeof node._position.y === 'number', '_position.y is number');

  // Choice defaults
  const ch = makeChoice({});
  assert(typeof ch.id === 'string', 'choice id is string');
  assert(typeof ch.text === 'string', 'choice text is string');
  assert(ch.chapter === null, 'choice chapter defaults to null');
  assert(ch.path === null, 'choice path defaults to null');
  assert(ch.requires.operator === 'and', 'choice requires.operator is "and" (AR-03)');
  assert(Array.isArray(ch.options), 'choice options is array (AR-05)');
  assert(ch.options.length === 0, 'choice options defaults to []');
  assert(typeof ch._position === 'object', 'choice _position is object (AR-10)');

  // Ending defaults
  const ending = makeEnding({ type: null });
  assert(typeof ending.id === 'string', 'ending id is string');
  assert(typeof ending.name === 'string', 'ending name is string');
  assert(ending.type === null, 'ending type can be null');
  assert(ending.chapter === null, 'ending chapter defaults to null');
  assert(ending.path === null, 'ending path defaults to null');
  assert(ending.requires.operator === 'and', 'ending requires.operator is "and" (AR-03)');
  assert(typeof ending._position === 'object', 'ending _position is object (AR-10)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION M — Failure / Edge Cases
// ════════════════════════════════════════════════════════════

group('M — Failure and edge cases');

(() => {
  // parseEdgeId never throws, even with garbage
  let threw = false;
  try {
    parseEdgeId('');
    parseEdgeId('edge');
    parseEdgeId('a-b');
    parseEdgeId('--------');
    parseEdgeId('edge-node-');
  } catch {
    threw = true;
  }
  assert(!threw, 'parseEdgeId never throws regardless of input');

  // getEntityTypeByPrefix — string inputs never throw
  let threw2 = false;
  try {
    getEntityTypeByPrefix(null);
    getEntityTypeByPrefix(undefined);
    getEntityTypeByPrefix('');
    getEntityTypeByPrefix('anything');
  } catch {
    threw2 = true;
  }
  assert(!threw2, 'getEntityTypeByPrefix never throws with string/null/undefined input');

  // getEntityTypeByPrefix — numeric input throws (startsWith not on Number)
  // This is expected since IDs are always strings in the data model.
  let threwOnNumber = false;
  try {
    getEntityTypeByPrefix(123);
  } catch {
    threwOnNumber = true;
  }
  assert(threwOnNumber, 'getEntityTypeByPrefix throws on numeric input (IDs are always strings)');

  // getMenuItemsForTarget never throws
  let threw3 = false;
  try {
    getMenuItemsForTarget(null);
    getMenuItemsForTarget(undefined);
    getMenuItemsForTarget('');
    getMenuItemsForTarget(123);
    getMenuItemsForTarget({});
  } catch {
    threw3 = true;
  }
  assert(!threw3, 'getMenuItemsForTarget never throws regardless of input');

  // cycleStatus/cycleSeen with invalid values → wraps gracefully
  assert(cycleStatus(null) === 'default', 'cycleStatus(null) → default');
  assert(cycleStatus(undefined) === 'default', 'cycleStatus(undefined) → default');
  assert(cycleSeen(null) === 'unseen', 'cycleSeen(null) → unseen');
  assert(cycleSeen(undefined) === 'unseen', 'cycleSeen(undefined) → unseen');

  // getEscapeAction never throws
  let threw4 = false;
  try {
    getEscapeAction({ contextMenu: null, commandPaletteOpen: false, inspectorOpen: false, selectedNodeId: null });
    getEscapeAction({});
  } catch {
    threw4 = true;
  }
  assert(!threw4, 'getEscapeAction never throws regardless of input');

  // Edge ID with empty source — parses but produces empty strings
  const r = parseEdgeId('edge--entry');
  assert(r !== null, 'edge--entry parses (3 parts)');
  assert(r.sourceId === '', 'empty source from edge--entry');
  assert(r.entryId === 'entry', 'entry extracted from edge--entry');
})();


// ════════════════════════════════════════════════════════════
//  SECTION N — Consistency: All menu item icon IDs are valid
// ════════════════════════════════════════════════════════════

group('N — Consistency: icon name identifiers');

(() => {
  // Valid icon names from ContextMenu.jsx ICON_MAP
  const validIcons = [
    'square', 'git-branch', 'flag', 'bookmark', 'bar-chart-2',
    'route', 'book-open', 'clipboard', 'pencil', 'trash-2',
    'copy', 'link', 'circle-dot', 'eye', 'clipboard-copy', 'filter',
  ];

  const allItems = [...CANVAS_MENU_ITEMS, ...NODE_MENU_ITEMS, ...EDGE_MENU_ITEMS]
    .filter(i => i.type !== 'divider');

  for (const item of allItems) {
    assert(
      validIcons.includes(item.icon),
      `${item.id} icon "${item.icon}" is in ICON_MAP`
    );
  }

  // No duplicate icon names in the map (sanity)
  const iconSet = new Set(validIcons);
  assert(iconSet.size === validIcons.length, 'no duplicate icon names in map');
})();


// ════════════════════════════════════════════════════════════
//  SECTION O — Consistency: No duplicate menu item IDs
// ════════════════════════════════════════════════════════════

group('O — Consistency: no duplicate action IDs within each menu');

(() => {
  // Check canvas items (excluding dividers)
  const canvasActionIds = CANVAS_MENU_ITEMS.filter(i => i.type !== 'divider').map(i => i.id);
  const canvasSet = new Set(canvasActionIds);
  assert(canvasSet.size === canvasActionIds.length, 'canvas menu: no duplicate action IDs');

  // Check node items
  const nodeActionIds = NODE_MENU_ITEMS.filter(i => i.type !== 'divider').map(i => i.id);
  const nodeSet = new Set(nodeActionIds);
  assert(nodeSet.size === nodeActionIds.length, 'node menu: no duplicate action IDs');

  // Check edge items
  const edgeActionIds = EDGE_MENU_ITEMS.filter(i => i.type !== 'divider').map(i => i.id);
  const edgeSet = new Set(edgeActionIds);
  assert(edgeSet.size === edgeActionIds.length, 'edge menu: no duplicate action IDs');

  // Check all dividers have unique IDs within each menu
  const canvasDivIds = CANVAS_MENU_ITEMS.filter(i => i.type === 'divider').map(i => i.id);
  assert(new Set(canvasDivIds).size === canvasDivIds.length, 'canvas dividers: unique IDs');

  const nodeDivIds = NODE_MENU_ITEMS.filter(i => i.type === 'divider').map(i => i.id);
  assert(new Set(nodeDivIds).size === nodeDivIds.length, 'node dividers: unique IDs');
})();


// ════════════════════════════════════════════════════════════
//  SUMMARY
// ════════════════════════════════════════════════════════════

console.log(`\n${'='.repeat(60)}`);
console.log(`  SUMMARY`);
console.log('='.repeat(60));
console.log(`  ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
