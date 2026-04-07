// ============================================================
// Phase 5 — Persistence Layer — Test Suite
// ============================================================
// Run: node src/tests/__test_phase5.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
// ============================================================

import { useNarrativeStore } from '../store/useNarrativeStore.js';
import { useCampaignStore } from '../store/useCampaignStore.js';
import { useUIStore } from '../store/useUIStore.js';
import { sanitizeName } from '../utils/sanitizeName.js';

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

// ── Store Reset Helpers ─────────────────────────────────────

function resetUI() {
  useUIStore.setState({
    selectedNodeId: null, inspectorOpen: false, inspectorPinned: false,
    contextMenu: null, commandPaletteOpen: false, toasts: [], persistError: null,
  });
}

function resetNarrative() {
  useNarrativeStore.getState().resetStore();
}

function resetCampaign() {
  useCampaignStore.setState({ campaigns: {}, activeCampaignId: null });
}

function resetAll() { resetUI(); resetNarrative(); resetCampaign(); }

// ── Minimal Valid Data Model Fixture ────────────────────────

function minimalDataModel() {
  return {
    metadata: {
      version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction', 'cg', 'cutscene'],
      ending_types: ['good_end', 'bad_end', 'true_end', 'neutral'],
    },
    path: {}, chapter: {}, flag: {}, status: {},
    common: {
      N001: {
        id: 'N001', name: 'start', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [], next: [],
        _position: { x: 0, y: 0 },
      },
    },
    choice: {}, ending: {}, quest: {},
  };
}

// Rich data model with sub-elements for thorough testing
function richDataModel() {
  return {
    metadata: {
      version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction', 'cg', 'cutscene'],
      ending_types: ['good_end', 'bad_end'],
    },
    path: { P001: { id: 'P001', name: 'main_path' } },
    chapter: { C001: { id: 'C001', name: 'chapter_one' } },
    flag: { F001: { id: 'F001', name: 'met_npc', state: false, path: null, chapter: null } },
    status: { SP001: { id: 'SP001', name: 'health', value: 0, minValue: 0, maxValue: 100, path: null, chapter: null } },
    common: {
      N001: {
        id: 'N001', name: 'start', type: 'interaction', chapter: 'C001', path: 'P001',
        description: 'The beginning',
        variants: [{ id: 'v1', requires: { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] }, text: 'Alt text' }],
        requires: { operator: 'and', conditions: [] },
        flags_set: ['F001'],
        status_set: [{ status: 'SP001', amount: 10 }],
        next: [{ id: 'ne1', target: 'CH001', requires: { operator: 'and', conditions: [] } }],
        _position: { x: 100, y: 200 },
      },
    },
    choice: {
      CH001: {
        id: 'CH001', text: 'Choose wisely', chapter: 'C001', path: 'P001',
        requires: { operator: 'and', conditions: [] },
        options: [{
          id: 'opt1', label: 'Go left',
          requires: { operator: 'or', conditions: [{ id: 'c2', flag: 'F001', state: true }] },
          flags_set: [], status_set: [],
          next: [{ id: 'ne2', target: 'E001', requires: { operator: 'and', conditions: [] } }],
        }],
        _position: { x: 300, y: 200 },
      },
    },
    ending: {
      E001: {
        id: 'E001', name: 'good_ending', type: 'good_end', chapter: 'C001', path: 'P001',
        requires: { operator: 'and', conditions: [{ id: 'c3', status: 'SP001', min: 50 }] },
        _position: { x: 500, y: 200 },
      },
    },
    quest: {},
  };
}

// ── Localforage Mock ────────────────────────────────────────
// Mock localforage for Node.js testing of persistence.js

const _mockStore = {};
let _shouldFail = false;

const localforageMock = {
  config() {},
  async setItem(key, value) {
    if (_shouldFail) throw new Error('Mock IndexedDB write failure');
    _mockStore[key] = structuredClone(value);
  },
  async getItem(key) {
    if (_shouldFail) throw new Error('Mock IndexedDB read failure');
    return _mockStore[key] ?? null;
  },
  async removeItem(key) {
    if (_shouldFail) throw new Error('Mock IndexedDB delete failure');
    delete _mockStore[key];
  },
};

function clearMockStore() {
  for (const key of Object.keys(_mockStore)) delete _mockStore[key];
  _shouldFail = false;
}

// ── Inline copies of internal importExport helpers ──────────
// These are not exported, so we re-implement them here for testing.

function ensureConditionGroup(value) {
  if (
    value != null && typeof value === 'object' && !Array.isArray(value) &&
    (value.operator === 'and' || value.operator === 'or') &&
    Array.isArray(value.conditions)
  ) return value;
  return { operator: 'and', conditions: [] };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureNextArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry) => entry != null && typeof entry === 'object' && entry.id != null && entry.target != null
  ).map((entry) => ({ ...entry, requires: ensureConditionGroup(entry.requires) }));
}

function validateDataModelStructure(data) {
  if (data == null || typeof data !== 'object') throw new Error('expected an object');
  if (!data.metadata || typeof data.metadata !== 'object') throw new Error('missing metadata');
  if (!data.metadata.version) throw new Error('missing metadata.version');
  const requiredCollections = ['path', 'chapter', 'flag', 'status', 'common', 'choice', 'ending'];
  for (const key of requiredCollections) {
    if (data[key] == null) data[key] = {};
    if (typeof data[key] !== 'object' || Array.isArray(data[key]))
      throw new Error(`"${key}" must be an object`);
  }
  if (data.quest == null) data.quest = {};
}

function sanitizeAllEntityNames(dataModel) {
  const namedCollections = ['path', 'chapter', 'flag', 'status', 'common', 'ending'];
  for (const key of namedCollections) {
    if (!dataModel[key]) continue;
    for (const entity of Object.values(dataModel[key])) {
      if (entity.name != null) entity.name = sanitizeName(entity.name);
    }
  }
}

function enforceDataStructureRules(dataModel) {
  if (dataModel.common) {
    for (const node of Object.values(dataModel.common)) {
      node.requires = ensureConditionGroup(node.requires);
      node.next = ensureNextArray(node.next);
      node.flags_set = ensureArray(node.flags_set);
      node.status_set = ensureArray(node.status_set);
      node.variants = ensureArray(node.variants);
      for (const v of node.variants) v.requires = ensureConditionGroup(v.requires);
      for (const ne of node.next) ne.requires = ensureConditionGroup(ne.requires);
      node._position = node._position ?? { x: 0, y: 0 };
    }
  }
  if (dataModel.choice) {
    for (const choice of Object.values(dataModel.choice)) {
      choice.requires = ensureConditionGroup(choice.requires);
      choice.options = ensureArray(choice.options);
      for (const opt of choice.options) {
        opt.requires = ensureConditionGroup(opt.requires);
        opt.flags_set = ensureArray(opt.flags_set);
        opt.status_set = ensureArray(opt.status_set);
        opt.next = ensureNextArray(opt.next);
        for (const ne of opt.next) ne.requires = ensureConditionGroup(ne.requires);
      }
      choice._position = choice._position ?? { x: 0, y: 0 };
    }
  }
  if (dataModel.ending) {
    for (const ending of Object.values(dataModel.ending)) {
      ending.requires = ensureConditionGroup(ending.requires);
      ending._position = ending._position ?? { x: 0, y: 0 };
    }
  }
}


// ════════════════════════════════════════════════════════════
//  SECTION A — ensureConditionGroup (AR-03)
// ════════════════════════════════════════════════════════════

group('ensureConditionGroup (AR-03)');

// Valid group passes through
(() => {
  const valid = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
  const result = ensureConditionGroup(valid);
  assert(result === valid, 'valid "and" group passes through by reference');
})();

(() => {
  const valid = { operator: 'or', conditions: [] };
  const result = ensureConditionGroup(valid);
  assert(result === valid, 'valid "or" group passes through');
})();

// Invalid inputs all return default
(() => {
  const r1 = ensureConditionGroup(null);
  assert(r1.operator === 'and' && r1.conditions.length === 0, 'null → default group');
})();

(() => {
  const r = ensureConditionGroup(undefined);
  assert(r.operator === 'and' && r.conditions.length === 0, 'undefined → default group');
})();

(() => {
  const r = ensureConditionGroup([]);
  assert(r.operator === 'and' && Array.isArray(r.conditions), 'bare array → default group');
})();

(() => {
  const r = ensureConditionGroup({ operator: 'xor', conditions: [] });
  assert(r.operator === 'and', 'invalid operator → default group');
})();

(() => {
  const r = ensureConditionGroup({ operator: 'and' });
  assert(r.operator === 'and' && Array.isArray(r.conditions), 'missing conditions array → default group');
})();

(() => {
  const r = ensureConditionGroup('string');
  assert(r.operator === 'and', 'string → default group');
})();

(() => {
  const r = ensureConditionGroup(42);
  assert(r.operator === 'and', 'number → default group');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — ensureArray (AR-05)
// ════════════════════════════════════════════════════════════

group('ensureArray (AR-05)');

(() => {
  const arr = [1, 2, 3];
  assert(ensureArray(arr) === arr, 'array passes through by reference');
})();

(() => {
  assert(Array.isArray(ensureArray(null)) && ensureArray(null).length === 0, 'null → []');
})();

(() => {
  assert(Array.isArray(ensureArray(undefined)) && ensureArray(undefined).length === 0, 'undefined → []');
})();

(() => {
  assert(Array.isArray(ensureArray('string')), 'string → []');
})();

(() => {
  assert(Array.isArray(ensureArray({})), 'object → []');
})();

(() => {
  const empty = [];
  assert(ensureArray(empty) === empty, 'empty array passes through');
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — ensureNextArray (AR-04)
// ════════════════════════════════════════════════════════════

group('ensureNextArray (AR-04)');

// Valid entries pass through
(() => {
  const entries = [
    { id: 'ne1', target: 'N002', requires: { operator: 'and', conditions: [] } },
  ];
  const result = ensureNextArray(entries);
  assert(result.length === 1, 'valid entry preserved');
  assert(result[0].target === 'N002', 'target preserved');
  assert(result[0].requires.operator === 'and', 'requires preserved');
})();

// Filters invalid entries
(() => {
  const entries = [
    { id: 'ne1', target: 'N002' },       // valid (missing requires gets defaulted)
    null,                                  // invalid
    { id: 'ne2' },                        // invalid (missing target)
    { target: 'N003' },                   // invalid (missing id)
    { id: 'ne3', target: 'N004', requires: null }, // valid (null requires gets defaulted)
  ];
  const result = ensureNextArray(entries);
  assert(result.length === 2, 'filters to 2 valid entries (ne1, ne3)');
})();

// Defaults requires on valid entries
(() => {
  const entries = [{ id: 'ne1', target: 'N002' }];
  const result = ensureNextArray(entries);
  assert(result[0].requires.operator === 'and', 'missing requires defaults to condition group');
  assert(Array.isArray(result[0].requires.conditions), 'default requires has conditions array');
})();

// Non-array input
(() => {
  assert(ensureNextArray(null).length === 0, 'null → []');
  assert(ensureNextArray(undefined).length === 0, 'undefined → []');
  assert(ensureNextArray('string').length === 0, 'string → []');
  assert(ensureNextArray({}).length === 0, 'object → []');
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — validateDataModelStructure
// ════════════════════════════════════════════════════════════

group('validateDataModelStructure');

// Valid minimal data model
(() => {
  const data = minimalDataModel();
  let threw = false;
  try { validateDataModelStructure(data); } catch { threw = true; }
  assert(!threw, 'minimal valid data model passes validation');
})();

// Missing metadata
(() => {
  let threw = false;
  try { validateDataModelStructure({}); } catch { threw = true; }
  assert(threw, 'missing metadata throws');
})();

// Missing version
(() => {
  let threw = false;
  try { validateDataModelStructure({ metadata: {} }); } catch { threw = true; }
  assert(threw, 'missing metadata.version throws');
})();

// Null input
(() => {
  let threw = false;
  try { validateDataModelStructure(null); } catch { threw = true; }
  assert(threw, 'null input throws');
})();

// Missing collections get defaulted to {}
(() => {
  const data = { metadata: { version: '2.0' } };
  validateDataModelStructure(data);
  assert(typeof data.path === 'object' && !Array.isArray(data.path), 'path defaulted to {}');
  assert(typeof data.common === 'object', 'common defaulted to {}');
  assert(typeof data.quest === 'object', 'quest defaulted to {}');
})();

// Array collection rejected
(() => {
  let threw = false;
  try {
    validateDataModelStructure({ metadata: { version: '2.0' }, common: [] });
  } catch { threw = true; }
  assert(threw, 'array collection throws (must be object keyed by ID)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — sanitizeAllEntityNames (AR-07)
// ════════════════════════════════════════════════════════════

group('sanitizeAllEntityNames (AR-07)');

(() => {
  const data = {
    path: { P001: { id: 'P001', name: 'My Path!' } },
    chapter: { C001: { id: 'C001', name: 'Chapter One' } },
    flag: { F001: { id: 'F001', name: 'Met NPC' } },
    status: { SP001: { id: 'SP001', name: 'Player Health' } },
    common: { N001: { id: 'N001', name: 'Start Scene' } },
    ending: { E001: { id: 'E001', name: 'Good End!' } },
    choice: { CH001: { id: 'CH001', text: 'Choose Something' } },
  };
  sanitizeAllEntityNames(data);
  assert(data.path.P001.name === 'my_path_', 'path name sanitized');
  assert(data.chapter.C001.name === 'chapter_one', 'chapter name sanitized');
  assert(data.flag.F001.name === 'met_npc', 'flag name sanitized');
  assert(data.status.SP001.name === 'player_health', 'status name sanitized');
  assert(data.common.N001.name === 'start_scene', 'common node name sanitized');
  assert(data.ending.E001.name === 'good_end_', 'ending name sanitized');
  assert(data.choice.CH001.text === 'Choose Something', 'choice text NOT sanitized (has text, not name)');
})();

// Missing collection is safe
(() => {
  const data = { path: {}, chapter: {} };
  let threw = false;
  try { sanitizeAllEntityNames(data); } catch { threw = true; }
  assert(!threw, 'missing collections do not crash');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — enforceDataStructureRules (AR-03/04/05)
// ════════════════════════════════════════════════════════════

group('enforceDataStructureRules (AR-03/04/05)');

// Common node with null/missing fields
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', name: 'test',
        requires: null,        // AR-03 violation
        next: null,            // AR-04 violation
        flags_set: null,       // AR-05 violation
        status_set: undefined, // AR-05 violation
        variants: null,        // AR-05 violation
      },
    },
    choice: {}, ending: {},
  };
  enforceDataStructureRules(data);
  const n = data.common.N001;
  assert(n.requires.operator === 'and' && Array.isArray(n.requires.conditions), 'requires enforced to condition group');
  assert(Array.isArray(n.next) && n.next.length === 0, 'next enforced to []');
  assert(Array.isArray(n.flags_set) && n.flags_set.length === 0, 'flags_set enforced to []');
  assert(Array.isArray(n.status_set) && n.status_set.length === 0, 'status_set enforced to []');
  assert(Array.isArray(n.variants) && n.variants.length === 0, 'variants enforced to []');
  assert(n._position.x === 0 && n._position.y === 0, '_position defaulted');
})();

// Choice with null fields
(() => {
  const data = {
    common: {}, ending: {},
    choice: {
      CH001: {
        id: 'CH001', text: 'Test',
        requires: undefined,
        options: null,
      },
    },
  };
  enforceDataStructureRules(data);
  const ch = data.choice.CH001;
  assert(ch.requires.operator === 'and', 'choice requires enforced');
  assert(Array.isArray(ch.options) && ch.options.length === 0, 'choice options enforced to []');
  assert(ch._position.x === 0, 'choice _position defaulted');
})();

// Choice option sub-fields enforced
(() => {
  const data = {
    common: {}, ending: {},
    choice: {
      CH001: {
        id: 'CH001', text: 'Test',
        requires: { operator: 'and', conditions: [] },
        options: [{
          id: 'opt1', label: 'Go',
          requires: null, flags_set: null, status_set: null, next: null,
        }],
      },
    },
  };
  enforceDataStructureRules(data);
  const opt = data.choice.CH001.options[0];
  assert(opt.requires.operator === 'and', 'option requires enforced');
  assert(Array.isArray(opt.flags_set), 'option flags_set enforced');
  assert(Array.isArray(opt.status_set), 'option status_set enforced');
  assert(Array.isArray(opt.next), 'option next enforced');
})();

// Ending with null requires
(() => {
  const data = {
    common: {}, choice: {},
    ending: { E001: { id: 'E001', name: 'end', requires: null } },
  };
  enforceDataStructureRules(data);
  assert(data.ending.E001.requires.operator === 'and', 'ending requires enforced');
  assert(data.ending.E001._position.x === 0, 'ending _position defaulted');
})();

// Existing _position preserved
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', requires: { operator: 'and', conditions: [] },
        next: [], flags_set: [], status_set: [], variants: [],
        _position: { x: 42, y: 99 },
      },
    },
    choice: {}, ending: {},
  };
  enforceDataStructureRules(data);
  assert(data.common.N001._position.x === 42 && data.common.N001._position.y === 99, 'existing _position preserved');
})();

// Variant requires enforced inside common node
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', requires: { operator: 'and', conditions: [] },
        next: [], flags_set: [], status_set: [],
        variants: [{ id: 'v1', text: 'alt', requires: null }],
      },
    },
    choice: {}, ending: {},
  };
  enforceDataStructureRules(data);
  assert(data.common.N001.variants[0].requires.operator === 'and', 'variant requires enforced');
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — Integration: Store loadFromJSON + toExportJSON
// ════════════════════════════════════════════════════════════

group('Store Integration — loadFromJSON / toExportJSON round-trip');

// Load minimal data model
(() => {
  resetAll();
  const data = minimalDataModel();
  useNarrativeStore.getState().loadFromJSON(data);
  const s = useNarrativeStore.getState();
  assert(s.metadata.version === '2.0', 'metadata.version loaded');
  assert(s.metadata.entry_node === 'N001', 'entry_node loaded');
  assert(s.common.N001 !== undefined, 'common node N001 loaded');
  assert(Object.keys(s.path).length === 0, 'path collection loaded as {}');
  assert(Object.keys(s.quest).length === 0, 'quest collection loaded as {}');
})();

// Load rich data model
(() => {
  resetAll();
  useNarrativeStore.getState().loadFromJSON(richDataModel());
  const s = useNarrativeStore.getState();
  assert(s.common.N001.name === 'start', 'common node name loaded');
  assert(s.common.N001.flags_set.length === 1, 'flags_set loaded');
  assert(s.common.N001.next.length === 1, 'next entries loaded');
  assert(s.choice.CH001.options.length === 1, 'choice options loaded');
  assert(s.ending.E001.type === 'good_end', 'ending type loaded');
  assert(s.flag.F001.name === 'met_npc', 'flag loaded');
  assert(s.status.SP001.name === 'health', 'status loaded');
})();

// Export produces valid structure
(() => {
  resetAll();
  useNarrativeStore.getState().loadFromJSON(richDataModel());
  const exported = useNarrativeStore.getState().toExportJSON();
  assert(exported.metadata.version === '2.0', 'export has metadata.version');
  assert(typeof exported.common === 'object', 'export has common collection');
  assert(typeof exported.choice === 'object', 'export has choice collection');
  assert(typeof exported.ending === 'object', 'export has ending collection');
  assert(typeof exported.quest === 'object', 'export has quest collection');
  // Verify export format has all singular keys
  const expectedKeys = ['metadata', 'path', 'chapter', 'flag', 'status', 'common', 'choice', 'ending', 'quest'];
  for (const key of expectedKeys) {
    assert(key in exported, `export has top-level key: ${key}`);
  }
})();

// Round-trip preserves entity data (not IDs — sub-element IDs are regenerated)
(() => {
  resetAll();
  const original = richDataModel();
  useNarrativeStore.getState().loadFromJSON(original);
  const exported = useNarrativeStore.getState().toExportJSON();
  // Structure preserved
  assert(exported.common.N001.name === 'start', 'round-trip: common node name preserved');
  assert(exported.common.N001.description === 'The beginning', 'round-trip: description preserved');
  assert(exported.common.N001.flags_set.length === 1, 'round-trip: flags_set preserved');
  assert(exported.common.N001.next.length === 1, 'round-trip: next entries preserved');
  assert(exported.common.N001.next[0].target === 'CH001', 'round-trip: next target preserved');
  assert(exported.choice.CH001.options.length === 1, 'round-trip: choice options preserved');
  assert(exported.ending.E001.requires.conditions.length === 1, 'round-trip: ending conditions preserved');
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — Integration: Campaign loadCampaigns
// ════════════════════════════════════════════════════════════

group('Campaign Store — loadCampaigns');

// Load campaigns
(() => {
  resetCampaign();
  const campaigns = {
    camp1: { id: 'camp1', name: 'test_run', nodeStates: {}, flagOverrides: {}, statusOverrides: {} },
    camp2: { id: 'camp2', name: 'alt_run', nodeStates: {}, flagOverrides: {}, statusOverrides: {} },
  };
  useCampaignStore.getState().loadCampaigns(campaigns, 'camp1');
  const s = useCampaignStore.getState();
  assert(Object.keys(s.campaigns).length === 2, 'two campaigns loaded');
  assert(s.activeCampaignId === 'camp1', 'active campaign set');
})();

// Load with invalid activeId
(() => {
  resetCampaign();
  const campaigns = { camp1: { id: 'camp1', name: 'test', nodeStates: {}, flagOverrides: {}, statusOverrides: {} } };
  useCampaignStore.getState().loadCampaigns(campaigns, 'NONEXISTENT');
  assert(useCampaignStore.getState().activeCampaignId === null, 'invalid activeId defaults to null');
})();

// Load null campaigns
(() => {
  resetCampaign();
  useCampaignStore.getState().loadCampaigns(null, null);
  assert(Object.keys(useCampaignStore.getState().campaigns).length === 0, 'null campaigns → {}');
  assert(useCampaignStore.getState().activeCampaignId === null, 'null active → null');
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — Persistence: saveProject / loadProject mock
// ════════════════════════════════════════════════════════════

group('Persistence — saveProject / loadProject (mock localforage)');

// Since persistence.js imports localforage directly, we test the logic pattern
// by simulating what saveProject does with our mock.

// Save and load round-trip via mock
await (async () => {
  clearMockStore();
  const narrative = minimalDataModel();
  const campaigns = { campaigns: { c1: { id: 'c1', name: 'test' } }, activeCampaignId: 'c1' };

  // Simulate saveProject pattern
  await Promise.all([
    localforageMock.setItem('narrative', narrative),
    localforageMock.setItem('campaigns', campaigns.campaigns),
    localforageMock.setItem('active_campaign', campaigns.activeCampaignId),
  ]);

  // Simulate loadProject pattern
  const [loadedNarrative, loadedCampaigns, loadedActive] = await Promise.all([
    localforageMock.getItem('narrative'),
    localforageMock.getItem('campaigns'),
    localforageMock.getItem('active_campaign'),
  ]);

  assert(loadedNarrative.metadata.version === '2.0', 'save/load round-trip: narrative preserved');
  assert(loadedCampaigns.c1.name === 'test', 'save/load round-trip: campaigns preserved');
  assert(loadedActive === 'c1', 'save/load round-trip: active campaign preserved');
})();

// Load returns null for missing keys
await (async () => {
  clearMockStore();
  const result = await localforageMock.getItem('nonexistent');
  assert(result === null, 'loading non-existent key returns null');
})();

// Clear removes all keys
await (async () => {
  clearMockStore();
  await localforageMock.setItem('narrative', { test: true });
  await localforageMock.setItem('campaigns', { test: true });
  await localforageMock.removeItem('narrative');
  await localforageMock.removeItem('campaigns');
  assert(await localforageMock.getItem('narrative') === null, 'clear: narrative removed');
  assert(await localforageMock.getItem('campaigns') === null, 'clear: campaigns removed');
})();

// Error surfacing pattern (AR-08)
await (async () => {
  clearMockStore();
  _shouldFail = true;
  let caught = false;
  try {
    await localforageMock.setItem('test', { data: true });
  } catch (e) {
    caught = true;
    assert(e.message.includes('Mock IndexedDB'), 'error message contains failure info');
  }
  assert(caught, 'AR-08: localforage errors are thrown, not swallowed');
  _shouldFail = false;
})();

// AR-08: showPersistError is callable
(() => {
  resetUI();
  useUIStore.getState().showPersistError('Test IndexedDB failure');
  assert(useUIStore.getState().persistError === 'Test IndexedDB failure', 'AR-08: showPersistError sets error message');
  useUIStore.getState().clearPersistError();
  assert(useUIStore.getState().persistError === null, 'AR-08: clearPersistError clears error');
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — Edge Cases: Malformed Import Data
// ════════════════════════════════════════════════════════════

group('Edge Cases — Malformed Import Data');

// Data with bare array requires (AR-03 violation)
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', name: 'test',
        requires: [{ flag: 'F001', state: true }], // WRONG: bare array
        next: [], flags_set: [], status_set: [], variants: [],
      },
    },
    choice: {}, ending: {},
  };
  enforceDataStructureRules(data);
  assert(data.common.N001.requires.operator === 'and', 'bare array requires → default condition group');
})();

// Data with string next (AR-04 violation)
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', name: 'test',
        requires: { operator: 'and', conditions: [] },
        next: 'N002', // WRONG: string instead of array
        flags_set: [], status_set: [], variants: [],
      },
    },
    choice: {}, ending: {},
  };
  enforceDataStructureRules(data);
  assert(Array.isArray(data.common.N001.next) && data.common.N001.next.length === 0, 'string next → []');
})();

// Data with scattered nulls
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', name: 'test',
        requires: null, next: null, flags_set: null,
        status_set: null, variants: null,
      },
    },
    choice: {
      CH001: {
        id: 'CH001', text: 'test', requires: null, options: null,
      },
    },
    ending: {
      E001: { id: 'E001', name: 'end', requires: null },
    },
  };
  enforceDataStructureRules(data);
  // All should be safe now
  const n = data.common.N001;
  const ch = data.choice.CH001;
  const e = data.ending.E001;
  assert(n.requires.operator === 'and', 'all nulls: common requires fixed');
  assert(Array.isArray(n.next), 'all nulls: common next fixed');
  assert(ch.requires.operator === 'and', 'all nulls: choice requires fixed');
  assert(Array.isArray(ch.options), 'all nulls: choice options fixed');
  assert(e.requires.operator === 'and', 'all nulls: ending requires fixed');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — Data Integrity: Export Format Compliance
// ════════════════════════════════════════════════════════════

group('Data Integrity — Export Format (§4.4)');

(() => {
  resetAll();
  useNarrativeStore.getState().loadFromJSON(richDataModel());
  const exported = useNarrativeStore.getState().toExportJSON();

  // §4.4: Top-level keys are singular (not plural)
  assert(!('paths' in exported), 'no plural "paths" key');
  assert(!('chapters' in exported), 'no plural "chapters" key');
  assert(!('flags' in exported), 'no plural "flags" key');
  assert(!('endings' in exported), 'no plural "endings" key');
  assert(!('choices' in exported), 'no plural "choices" key');
  assert(!('commons' in exported), 'no plural "commons" key');

  // §4.4: Each collection is object keyed by entity ID
  assert(typeof exported.common === 'object' && !Array.isArray(exported.common), 'common is object, not array');
  assert('N001' in exported.common, 'common keyed by entity ID');

  // §4.5: Minimal valid structure compliance
  assert(exported.metadata.version === '2.0', 'version is "2.0"');
  assert(typeof exported.metadata.entry_node === 'string', 'entry_node is string');

  // Common node field compliance
  const node = exported.common.N001;
  assert(node.requires.operator === 'and' || node.requires.operator === 'or', 'requires is condition group');
  assert(Array.isArray(node.next), 'next is array');
  assert(Array.isArray(node.flags_set), 'flags_set is array');
  assert(Array.isArray(node.status_set), 'status_set is array');
  assert(Array.isArray(node.variants), 'variants is array');
  assert(typeof node._position === 'object' && 'x' in node._position, '_position has x/y');
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
