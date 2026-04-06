// ============================================================
// Phase 3 — Narrative Store — Manual Test Suite
// ============================================================
// Run: node src/tests/__test_phase3.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
// ============================================================

import { useNarrativeStore } from '../store/useNarrativeStore.js';
import { deepEqual } from '../utils/deepEqual.js';

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

/** Reset store to clean state before each test group */
function resetStore() {
  useNarrativeStore.getState().resetStore();
}

/** Shorthand for accessing current state */
function getState() {
  return useNarrativeStore.getState();
}

// ── Fixtures ────────────────────────────────────────────────

const MINIMAL_VALID_JSON = {
  metadata: {
    version: '2.0',
    created_at: '2026-04-04',
    updated_at: '2026-04-04',
    entry_node: 'N001',
    common_node_types: ['interaction', 'cg', 'cutscene'],
    ending_types: ['good_end', 'bad_end', 'true_end', 'neutral'],
  },
  path: {},
  chapter: {},
  flag: {},
  status: {},
  common: {
    N001: {
      id: 'N001',
      name: 'start',
      type: null,
      chapter: null,
      path: null,
      description: '',
      variants: [],
      requires: { operator: 'and', conditions: [] },
      flags_set: [],
      status_set: [],
      next: [],
      _position: { x: 0, y: 0 },
    },
  },
  choice: {},
  ending: {},
  quest: {},
};

const FULL_DATA_JSON = {
  metadata: {
    version: '2.0',
    created_at: '2026-04-04',
    updated_at: '2026-04-04',
    entry_node: 'N001',
    common_node_types: ['interaction', 'cg', 'cutscene'],
    ending_types: ['good_end', 'bad_end', 'true_end', 'neutral'],
  },
  path: {
    P001: { id: 'P001', name: 'main_route' },
  },
  chapter: {
    C001: { id: 'C001', name: 'prologue' },
  },
  flag: {
    F001: { id: 'F001', name: 'met_merchant', state: false, path: null, chapter: 'C001' },
    F002: { id: 'F002', name: 'found_key', state: false, path: 'P001', chapter: null },
  },
  status: {
    SP001: { id: 'SP001', name: 'reputation', value: 0, minValue: -100, maxValue: null, path: null, chapter: null },
  },
  common: {
    N001: {
      id: 'N001',
      name: 'opening_scene',
      type: 'interaction',
      chapter: 'C001',
      path: 'P001',
      description: 'The story begins...',
      variants: [
        {
          id: 'VAR_001',
          requires: { operator: 'and', conditions: [{ id: 'COND_V1', flag: 'F001', state: true }] },
          text: 'Alternate text',
        },
      ],
      requires: { operator: 'and', conditions: [{ id: 'COND_N1', flag: 'F001', state: true }] },
      flags_set: ['F001'],
      status_set: [{ status: 'SP001', amount: 5 }],
      next: [
        {
          id: 'NE_001',
          target: 'CH001',
          requires: { operator: 'and', conditions: [] },
        },
      ],
      _position: { x: 100, y: 200 },
    },
    N002: {
      id: 'N002',
      name: 'second_scene',
      type: null,
      chapter: 'C001',
      path: 'P001',
      description: '',
      variants: [],
      requires: { operator: 'and', conditions: [] },
      flags_set: ['F002'],
      status_set: [{ status: 'SP001', amount: -2 }],
      next: [
        {
          id: 'NE_002',
          target: 'E001',
          requires: { operator: 'and', conditions: [{ id: 'COND_NE2', status: 'SP001', min: 3 }] },
        },
      ],
      _position: { x: 200, y: 200 },
    },
  },
  choice: {
    CH001: {
      id: 'CH001',
      text: 'What do you do?',
      chapter: 'C001',
      path: 'P001',
      requires: { operator: 'and', conditions: [] },
      options: [
        {
          id: 'OPT_001',
          label: 'Fight',
          requires: { operator: 'and', conditions: [] },
          flags_set: ['F001'],
          status_set: [{ status: 'SP001', amount: -2 }],
          next: [
            {
              id: 'OPT_NE_001',
              target: 'N002',
              requires: { operator: 'and', conditions: [] },
            },
          ],
        },
      ],
      _position: { x: 300, y: 200 },
    },
  },
  ending: {
    E001: {
      id: 'E001',
      name: 'the_hero_falls',
      type: 'bad_end',
      chapter: 'C001',
      path: 'P001',
      requires: {
        operator: 'and',
        conditions: [
          { id: 'COND_E1', flag: 'F001', state: true },
          { id: 'COND_E2', status: 'SP001', min: 0, max: 10 },
        ],
      },
      _position: { x: 500, y: 200 },
    },
  },
  quest: {},
};

// ════════════════════════════════════════════════════════════
//  SECTION A — Initial State & Metadata
// ════════════════════════════════════════════════════════════

group('Initial State');

(() => {
  resetStore();
  const s = getState();

  assert(s.metadata.version === '2.0', 'metadata.version is "2.0"');
  assert(typeof s.metadata.created_at === 'string' && s.metadata.created_at.length > 0, 'metadata.created_at is ISO string');
  assert(typeof s.metadata.updated_at === 'string', 'metadata.updated_at exists');
  assert(s.metadata.entry_node === null, 'metadata.entry_node defaults to null');
  assert(Array.isArray(s.metadata.common_node_types) && s.metadata.common_node_types.length === 3, 'metadata.common_node_types has 3 defaults');
  assert(Array.isArray(s.metadata.ending_types) && s.metadata.ending_types.length === 4, 'metadata.ending_types has 4 defaults');

  // All collections are empty objects
  assert(deepEqual(s.path, {}), 'path starts empty');
  assert(deepEqual(s.chapter, {}), 'chapter starts empty');
  assert(deepEqual(s.flag, {}), 'flag starts empty');
  assert(deepEqual(s.status, {}), 'status starts empty');
  assert(deepEqual(s.common, {}), 'common starts empty');
  assert(deepEqual(s.choice, {}), 'choice starts empty');
  assert(deepEqual(s.ending, {}), 'ending starts empty');
  assert(deepEqual(s.quest, {}), 'quest starts empty');
})();

group('Metadata Actions');

(() => {
  resetStore();
  const { setEntryNode, updateMetadata } = getState();

  setEntryNode('N001');
  assert(getState().metadata.entry_node === 'N001', 'setEntryNode sets entry_node');

  updateMetadata({ common_node_types: ['a', 'b'] });
  assert(deepEqual(getState().metadata.common_node_types, ['a', 'b']), 'updateMetadata overwrites field');
  assert(getState().metadata.version === '2.0', 'updateMetadata preserves other fields');
})();

// ════════════════════════════════════════════════════════════
//  SECTION B — Common Node CRUD
// ════════════════════════════════════════════════════════════

group('addCommonNode');

(() => {
  resetStore();
  const id = getState().addCommonNode();

  const s = getState();
  const node = s.common[id];

  assert(typeof id === 'string' && id.length > 0, 'returns an ID');
  assert(node != null, 'node exists in state');
  assert(node.name === '', 'name defaults to ""');
  assert(node.type === null, 'type defaults to null');
  assert(node.chapter === null, 'chapter defaults to null');
  assert(node.path === null, 'path defaults to null');
  assert(node.description === '', 'description defaults to ""');
  assert(Array.isArray(node.variants) && node.variants.length === 0, 'variants defaults to []');
  assert(deepEqual(node.requires, { operator: 'and', conditions: [] }), 'requires defaults to ConditionGroup (AR-03)');
  assert(Array.isArray(node.flags_set) && node.flags_set.length === 0, 'flags_set defaults to [] (AR-05)');
  assert(Array.isArray(node.status_set) && node.status_set.length === 0, 'status_set defaults to [] (AR-05)');
  assert(Array.isArray(node.next) && node.next.length === 0, 'next defaults to [] (AR-04)');
  assert(deepEqual(node._position, { x: 0, y: 0 }), '_position defaults to {x:0,y:0} (AR-10)');
})();

(() => {
  resetStore();
  const id = getState().addCommonNode({ name: 'Hello World!', type: 'interaction' });
  const node = getState().common[id];
  assert(node.name === 'hello_world_', 'name is sanitized on creation (AR-07)');
  assert(node.type === 'interaction', 'type override accepted');
})();

group('updateCommonNode');

(() => {
  resetStore();
  const id = getState().addCommonNode();
  getState().updateCommonNode(id, { name: 'Updated Name!!', description: 'new desc' });
  const node = getState().common[id];
  assert(node.name === 'updated_name__', 'name sanitized on update (AR-07)');
  assert(node.description === 'new desc', 'description updated');
})();

(() => {
  resetStore();
  const id = getState().addCommonNode({ description: 'keep this' });
  getState().updateCommonNode(id, { type: 'cg' });
  const node = getState().common[id];
  assert(node.description === 'keep this', 'non-updated fields preserved');
  assert(node.type === 'cg', 'targeted field updated');
})();

(() => {
  resetStore();
  // Update non-existent node — should not throw
  getState().updateCommonNode('NONEXISTENT', { name: 'test' });
  assert(Object.keys(getState().common).length === 0, 'updating non-existent node is no-op');
})();

group('deleteCommonNode');

(() => {
  resetStore();
  const id = getState().addCommonNode();
  getState().deleteCommonNode(id);
  assert(getState().common[id] === undefined, 'node removed from state');
})();

(() => {
  resetStore();
  const id = getState().addCommonNode();
  getState().setEntryNode(id);
  assert(getState().metadata.entry_node === id, 'entry_node set');
  getState().deleteCommonNode(id);
  assert(getState().metadata.entry_node === null, 'entry_node cleared when node deleted');
})();

// ════════════════════════════════════════════════════════════
//  SECTION C — Choice CRUD
// ════════════════════════════════════════════════════════════

group('addChoice');

(() => {
  resetStore();
  const id = getState().addChoice();
  const choice = getState().choice[id];

  assert(typeof id === 'string' && id.length > 0, 'returns an ID');
  assert(choice != null, 'choice exists in state');
  assert(choice.text === '', 'text defaults to ""');
  assert(choice.chapter === null, 'chapter defaults to null');
  assert(choice.path === null, 'path defaults to null');
  assert(deepEqual(choice.requires, { operator: 'and', conditions: [] }), 'requires defaults to ConditionGroup (AR-03)');
  assert(Array.isArray(choice.options) && choice.options.length === 0, 'options defaults to []');
  assert(deepEqual(choice._position, { x: 0, y: 0 }), '_position defaults to {x:0,y:0}');
  assert(!('name' in choice), 'Choice has no name field');
  assert(!('next' in choice), 'Choice has no top-level next field');
})();

group('updateChoice');

(() => {
  resetStore();
  const id = getState().addChoice();
  getState().updateChoice(id, { text: 'Do you fight or flee?' });
  assert(getState().choice[id].text === 'Do you fight or flee?', 'text updated');
})();

group('deleteChoice');

(() => {
  resetStore();
  const chId = getState().addChoice();
  const nId = getState().addCommonNode();
  // Wire common node's next to choice
  getState().addNextEntry(nId, chId);
  assert(getState().common[nId].next.length === 1, 'next entry added');
  assert(getState().common[nId].next[0].target === chId, 'next targets choice');

  // Delete choice — next entry should be removed
  getState().deleteChoice(chId);
  assert(getState().choice[chId] === undefined, 'choice removed');
  assert(getState().common[nId].next.length === 0, 'next entry referencing deleted choice cleaned up');
})();

// ════════════════════════════════════════════════════════════
//  SECTION D — Ending CRUD
// ════════════════════════════════════════════════════════════

group('addEnding');

(() => {
  resetStore();
  const id = getState().addEnding({ name: 'Bad End!' });
  const ending = getState().ending[id];
  assert(ending.name === 'bad_end_', 'name sanitized (AR-07)');
  assert(ending.type === null, 'type defaults to null');
  assert(deepEqual(ending.requires, { operator: 'and', conditions: [] }), 'requires defaults AR-03');
  assert(deepEqual(ending._position, { x: 0, y: 0 }), '_position defaults');
})();

group('updateEnding');

(() => {
  resetStore();
  const id = getState().addEnding();
  getState().updateEnding(id, { name: 'Good End!', type: 'good_end' });
  assert(getState().ending[id].name === 'good_end_', 'name sanitized on update (AR-07)');
  assert(getState().ending[id].type === 'good_end', 'type updated');
})();

group('deleteEnding');

(() => {
  resetStore();
  const eId = getState().addEnding();
  const nId = getState().addCommonNode();
  getState().addNextEntry(nId, eId);
  getState().deleteEnding(eId);
  assert(getState().ending[eId] === undefined, 'ending removed');
  assert(getState().common[nId].next.length === 0, 'next entry referencing deleted ending cleaned up');
})();

// ════════════════════════════════════════════════════════════
//  SECTION E — Flag CRUD
// ════════════════════════════════════════════════════════════

group('addFlag');

(() => {
  resetStore();
  const id = getState().addFlag({ name: 'Met Merchant!' });
  const flag = getState().flag[id];
  assert(flag.name === 'met_merchant_', 'name sanitized (AR-07)');
  assert(flag.state === false, 'state defaults to false');
  assert(flag.path === null, 'path defaults to null');
  assert(flag.chapter === null, 'chapter defaults to null');
})();

group('updateFlag');

(() => {
  resetStore();
  const id = getState().addFlag();
  getState().updateFlag(id, { name: 'New Name!' });
  assert(getState().flag[id].name === 'new_name_', 'name sanitized on update');
})();

group('deleteFlag — cascade cleanup');

(() => {
  resetStore();
  // Setup: create flag, node referencing it in flags_set and requires
  const fId = getState().addFlag({ name: 'test_flag' });
  const nId = getState().addCommonNode({ flags_set: [fId] });

  // Add condition referencing this flag
  getState().addCondition('common', nId, { flag: fId, state: true });

  // Verify setup
  assert(getState().common[nId].flags_set.includes(fId), 'flag in flags_set before delete');
  assert(getState().common[nId].requires.conditions.length === 1, 'condition exists before delete');

  // Delete flag
  getState().deleteFlag(fId);

  // Verify cascade
  assert(getState().flag[fId] === undefined, 'flag removed from state');
  assert(!getState().common[nId].flags_set.includes(fId), 'flag removed from flags_set');
  assert(getState().common[nId].requires.conditions.length === 0, 'condition referencing flag removed');
})();

// Flag cascade: choice option flags_set
(() => {
  resetStore();
  const fId = getState().addFlag({ name: 'opt_flag' });
  const chId = getState().addChoice();
  const optId = getState().addOption(chId, { flags_set: [fId] });

  // Add condition referencing flag to choice requires
  getState().addCondition('choice', chId, { flag: fId, state: true });

  assert(getState().choice[chId].options[0].flags_set.includes(fId), 'flag in option flags_set');
  assert(getState().choice[chId].requires.conditions.length === 1, 'condition on choice');

  getState().deleteFlag(fId);

  assert(!getState().choice[chId].options[0].flags_set.includes(fId), 'flag purged from option flags_set');
  assert(getState().choice[chId].requires.conditions.length === 0, 'condition on choice purged');
})();

// Flag cascade: ending requires
(() => {
  resetStore();
  const fId = getState().addFlag({ name: 'ending_flag' });
  const eId = getState().addEnding();
  getState().addCondition('ending', eId, { flag: fId, state: true });

  assert(getState().ending[eId].requires.conditions.length === 1, 'condition on ending');
  getState().deleteFlag(fId);
  assert(getState().ending[eId].requires.conditions.length === 0, 'condition on ending purged');
})();

// ════════════════════════════════════════════════════════════
//  SECTION F — Status Point CRUD
// ════════════════════════════════════════════════════════════

group('addStatusPoint');

(() => {
  resetStore();
  const id = getState().addStatusPoint({ name: 'Reputation!' });
  const sp = getState().status[id];
  assert(sp.name === 'reputation_', 'name sanitized (AR-07)');
  assert(sp.value === 0, 'value defaults to 0');
  assert(sp.minValue === null, 'minValue defaults to null');
  assert(sp.maxValue === null, 'maxValue defaults to null');
})();

group('deleteStatusPoint — cascade cleanup');

(() => {
  resetStore();
  const spId = getState().addStatusPoint({ name: 'rep' });
  const nId = getState().addCommonNode({ status_set: [{ status: spId, amount: 5 }] });

  // Add condition referencing this status
  getState().addCondition('common', nId, { status: spId, min: 0 });

  assert(getState().common[nId].status_set.length === 1, 'status_set has entry');
  assert(getState().common[nId].requires.conditions.length === 1, 'condition exists');

  getState().deleteStatusPoint(spId);

  assert(getState().status[spId] === undefined, 'status removed');
  assert(getState().common[nId].status_set.length === 0, 'status_set entry purged');
  assert(getState().common[nId].requires.conditions.length === 0, 'condition purged');
})();

// Status cascade: choice option status_set
(() => {
  resetStore();
  const spId = getState().addStatusPoint({ name: 'str' });
  const chId = getState().addChoice();
  const optId = getState().addOption(chId, { status_set: [{ status: spId, amount: 3 }] });

  getState().addCondition('choice', chId, { status: spId, min: 1 });

  getState().deleteStatusPoint(spId);

  assert(getState().choice[chId].options[0].status_set.length === 0, 'status_set purged from option');
  assert(getState().choice[chId].requires.conditions.length === 0, 'condition purged from choice');
})();

// ════════════════════════════════════════════════════════════
//  SECTION G — Path CRUD
// ════════════════════════════════════════════════════════════

group('addPath');

(() => {
  resetStore();
  const id = getState().addPath({ name: 'Main Route!' });
  assert(getState().path[id].name === 'main_route_', 'name sanitized (AR-07)');
})();

group('deletePath — nulls references');

(() => {
  resetStore();
  const pId = getState().addPath({ name: 'route' });
  const nId = getState().addCommonNode({ path: pId });
  const chId = getState().addChoice({ path: pId });
  const eId = getState().addEnding({ path: pId });
  const fId = getState().addFlag({ path: pId });
  const spId = getState().addStatusPoint({ path: pId });

  // Verify setup
  assert(getState().common[nId].path === pId, 'common node has path ref');
  assert(getState().choice[chId].path === pId, 'choice has path ref');
  assert(getState().ending[eId].path === pId, 'ending has path ref');
  assert(getState().flag[fId].path === pId, 'flag has path ref');
  assert(getState().status[spId].path === pId, 'status has path ref');

  getState().deletePath(pId);

  assert(getState().path[pId] === undefined, 'path removed');
  assert(getState().common[nId].path === null, 'common node path nulled');
  assert(getState().choice[chId].path === null, 'choice path nulled');
  assert(getState().ending[eId].path === null, 'ending path nulled');
  assert(getState().flag[fId].path === null, 'flag path nulled');
  assert(getState().status[spId].path === null, 'status path nulled');
})();

// ════════════════════════════════════════════════════════════
//  SECTION H — Chapter CRUD
// ════════════════════════════════════════════════════════════

group('addChapter');

(() => {
  resetStore();
  const id = getState().addChapter({ name: 'Prologue!' });
  assert(getState().chapter[id].name === 'prologue_', 'name sanitized (AR-07)');
})();

group('deleteChapter — nulls references');

(() => {
  resetStore();
  const cId = getState().addChapter({ name: 'ch1' });
  const nId = getState().addCommonNode({ chapter: cId });
  const chId = getState().addChoice({ chapter: cId });
  const eId = getState().addEnding({ chapter: cId });
  const fId = getState().addFlag({ chapter: cId });
  const spId = getState().addStatusPoint({ chapter: cId });

  getState().deleteChapter(cId);

  assert(getState().chapter[cId] === undefined, 'chapter removed');
  assert(getState().common[nId].chapter === null, 'common node chapter nulled');
  assert(getState().choice[chId].chapter === null, 'choice chapter nulled');
  assert(getState().ending[eId].chapter === null, 'ending chapter nulled');
  assert(getState().flag[fId].chapter === null, 'flag chapter nulled');
  assert(getState().status[spId].chapter === null, 'status chapter nulled');
})();

// ════════════════════════════════════════════════════════════
//  SECTION I — Next Entry Sub-Element CRUD
// ════════════════════════════════════════════════════════════

group('addNextEntry / removeNextEntry / updateNextEntry');

(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const targetId = getState().addCommonNode();
  const neId = getState().addNextEntry(nId, targetId);

  const node = getState().common[nId];
  assert(node.next.length === 1, 'next has 1 entry');
  assert(node.next[0].id === neId, 'next entry has correct ID');
  assert(node.next[0].target === targetId, 'next entry has correct target');
  assert(deepEqual(node.next[0].requires, { operator: 'and', conditions: [] }), 'next entry has default requires (AR-03, AR-04)');
})();

// Update next entry
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const t1 = getState().addCommonNode();
  const t2 = getState().addEnding();
  const neId = getState().addNextEntry(nId, t1);

  getState().updateNextEntry(nId, neId, { target: t2 });
  assert(getState().common[nId].next[0].target === t2, 'next entry target updated');
})();

// Remove next entry
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const tId = getState().addCommonNode();
  const neId = getState().addNextEntry(nId, tId);
  
  getState().removeNextEntry(nId, neId);
  assert(getState().common[nId].next.length === 0, 'next entry removed');
})();

// Multiple next entries
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const t1 = getState().addCommonNode();
  const t2 = getState().addEnding();
  const ne1 = getState().addNextEntry(nId, t1);
  const ne2 = getState().addNextEntry(nId, t2);

  assert(getState().common[nId].next.length === 2, 'two next entries');

  getState().removeNextEntry(nId, ne1);
  assert(getState().common[nId].next.length === 1, 'one next entry after removal');
  assert(getState().common[nId].next[0].id === ne2, 'correct entry remains');
})();

// Delete target node removes next entry
(() => {
  resetStore();
  const n1 = getState().addCommonNode();
  const n2 = getState().addCommonNode();
  getState().addNextEntry(n1, n2);

  assert(getState().common[n1].next.length === 1, 'next entry exists');
  getState().deleteCommonNode(n2);
  assert(getState().common[n1].next.length === 0, 'next entry removed when target deleted');
})();

// ════════════════════════════════════════════════════════════
//  SECTION J — Option Sub-Element CRUD
// ════════════════════════════════════════════════════════════

group('addOption / updateOption / removeOption');

(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);

  const opt = getState().choice[chId].options[0];
  assert(opt.id === optId, 'option has correct ID');
  assert(opt.label === '', 'label defaults to ""');
  assert(deepEqual(opt.requires, { operator: 'and', conditions: [] }), 'requires defaults to ConditionGroup (AR-03)');
  assert(Array.isArray(opt.flags_set) && opt.flags_set.length === 0, 'flags_set defaults to [] (AR-05)');
  assert(Array.isArray(opt.status_set) && opt.status_set.length === 0, 'status_set defaults to [] (AR-05)');
  assert(Array.isArray(opt.next) && opt.next.length === 0, 'next defaults to [] (AR-04)');
})();

// Update option
(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  getState().updateOption(chId, optId, { label: 'Fight the dragon' });
  assert(getState().choice[chId].options[0].label === 'Fight the dragon', 'option label updated');
})();

// Remove option
(() => {
  resetStore();
  const chId = getState().addChoice();
  const opt1 = getState().addOption(chId, { label: 'first' });
  const opt2 = getState().addOption(chId, { label: 'second' });
  
  getState().removeOption(chId, opt1);
  assert(getState().choice[chId].options.length === 1, 'one option after removal');
  assert(getState().choice[chId].options[0].id === opt2, 'correct option remains');
})();

// ════════════════════════════════════════════════════════════
//  SECTION K — Option Next Entry CRUD
// ════════════════════════════════════════════════════════════

group('addOptionNextEntry / removeOptionNextEntry');

(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  const tId = getState().addCommonNode();
  const neId = getState().addOptionNextEntry(chId, optId, tId);

  const opt = getState().choice[chId].options[0];
  assert(opt.next.length === 1, 'option has 1 next entry');
  assert(opt.next[0].id === neId, 'next entry ID matches');
  assert(opt.next[0].target === tId, 'next entry target correct');
  assert(deepEqual(opt.next[0].requires, { operator: 'and', conditions: [] }), 'next entry has default requires (AR-03)');
})();

// Remove option next entry
(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  const tId = getState().addCommonNode();
  const neId = getState().addOptionNextEntry(chId, optId, tId);

  getState().removeOptionNextEntry(chId, optId, neId);
  assert(getState().choice[chId].options[0].next.length === 0, 'option next entry removed');
})();

// Delete target cleans up option next entries
(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  const tId = getState().addCommonNode();
  getState().addOptionNextEntry(chId, optId, tId);

  assert(getState().choice[chId].options[0].next.length === 1, 'option next entry exists');
  getState().deleteCommonNode(tId);
  assert(getState().choice[chId].options[0].next.length === 0, 'option next entry cleaned up when target deleted');
})();

// ════════════════════════════════════════════════════════════
//  SECTION L — Variant Sub-Element CRUD
// ════════════════════════════════════════════════════════════

group('addVariant / updateVariant / removeVariant');

(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const vId = getState().addVariant(nId);

  const variant = getState().common[nId].variants[0];
  assert(variant.id === vId, 'variant has correct ID');
  assert(variant.text === '', 'text defaults to ""');
  assert(deepEqual(variant.requires, { operator: 'and', conditions: [] }), 'requires defaults to ConditionGroup (AR-03)');
})();

// Update variant
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const vId = getState().addVariant(nId);
  getState().updateVariant(nId, vId, { text: 'Alternate scene text' });
  assert(getState().common[nId].variants[0].text === 'Alternate scene text', 'variant text updated');
})();

// Remove variant
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const v1 = getState().addVariant(nId, { text: 'first' });
  const v2 = getState().addVariant(nId, { text: 'second' });

  getState().removeVariant(nId, v1);
  assert(getState().common[nId].variants.length === 1, 'one variant after removal');
  assert(getState().common[nId].variants[0].id === v2, 'correct variant remains');
})();

// ════════════════════════════════════════════════════════════
//  SECTION M — Condition Sub-Element CRUD
// ════════════════════════════════════════════════════════════

group('addCondition / removeCondition');

// Add flag condition to entity root requires
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const condId = getState().addCondition('common', nId, { flag: 'F001', state: true });

  const conds = getState().common[nId].requires.conditions;
  assert(conds.length === 1, 'one condition added');
  assert(conds[0].id === condId, 'condition has correct ID');
  assert(conds[0].flag === 'F001', 'flag reference correct');
  assert(conds[0].state === true, 'state correct');
})();

// Add status condition
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const condId = getState().addCondition('common', nId, { status: 'SP001', min: 5 });

  const conds = getState().common[nId].requires.conditions;
  assert(conds.length === 1, 'status condition added');
  assert(conds[0].status === 'SP001', 'status reference correct');
  assert(conds[0].min === 5, 'min correct');
})();

// Add nested condition group
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const result = getState().addCondition('common', nId, { operator: 'or', conditions: [] });

  assert(result === null, 'nested group returns null (not a leaf ID)');
  const conds = getState().common[nId].requires.conditions;
  assert(conds.length === 1, 'group added');
  assert(conds[0].operator === 'or', 'group operator correct');
  assert(Array.isArray(conds[0].conditions), 'group has conditions array');
})();

// Remove condition
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const c1 = getState().addCondition('common', nId, { flag: 'F001', state: true });
  const c2 = getState().addCondition('common', nId, { status: 'SP001', min: 0 });

  assert(getState().common[nId].requires.conditions.length === 2, 'two conditions');
  getState().removeCondition('common', nId, c1);
  assert(getState().common[nId].requires.conditions.length === 1, 'one condition after removal');
  assert(getState().common[nId].requires.conditions[0].id === c2, 'correct condition remains');
})();

// Add condition via targetPath — variant requires
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const vId = getState().addVariant(nId);
  const condId = getState().addCondition('common', nId, { flag: 'F001', state: true }, `variants.${vId}.requires`);

  assert(getState().common[nId].variants[0].requires.conditions.length === 1, 'condition added to variant');
  assert(getState().common[nId].variants[0].requires.conditions[0].id === condId, 'correct condition ID');
})();

// Add condition via targetPath — next entry requires
(() => {
  resetStore();
  const nId = getState().addCommonNode();
  const tId = getState().addCommonNode();
  const neId = getState().addNextEntry(nId, tId);
  const condId = getState().addCondition('common', nId, { flag: 'F001', state: true }, `next.${neId}.requires`);

  assert(getState().common[nId].next[0].requires.conditions.length === 1, 'condition added to next entry');
})();

// Add condition via targetPath — option requires
(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  const condId = getState().addCondition('choice', chId, { flag: 'F001', state: true }, `options.${optId}.requires`);

  assert(getState().choice[chId].options[0].requires.conditions.length === 1, 'condition added to option');
})();

// Add condition via deep path — option next entry requires
(() => {
  resetStore();
  const chId = getState().addChoice();
  const optId = getState().addOption(chId);
  const tId = getState().addCommonNode();
  const neId = getState().addOptionNextEntry(chId, optId, tId);

  const condId = getState().addCondition('choice', chId, { flag: 'F001', state: true }, `options.${optId}.next.${neId}.requires`);
  assert(getState().choice[chId].options[0].next[0].requires.conditions.length === 1, 'condition added to option next entry');
})();

// Invalid entity type — no crash
(() => {
  resetStore();
  const result = getState().addCondition('invalid', 'NONE', { flag: 'F001', state: true });
  assert(typeof result === 'string', 'returns condId even for invalid entityType (no crash)');
})();

// ════════════════════════════════════════════════════════════
//  SECTION N — Import / Export
// ════════════════════════════════════════════════════════════

group('loadFromJSON');

// Load minimal valid JSON
(() => {
  resetStore();
  getState().loadFromJSON(structuredClone(MINIMAL_VALID_JSON));

  const s = getState();
  assert(s.metadata.version === '2.0', 'metadata loaded');
  assert(s.metadata.entry_node === 'N001', 'entry_node loaded');
  assert(s.common['N001'] != null, 'common node N001 exists');
  assert(s.common['N001'].name === 'start', 'node name loaded');
  assert(deepEqual(s.common['N001'].requires, { operator: 'and', conditions: [] }), 'requires preserved (AR-03)');
  assert(Array.isArray(s.common['N001'].next), 'next is array (AR-04)');
  assert(deepEqual(s.quest, {}), 'quest loaded as empty');
})();

// Load full JSON — names sanitized
(() => {
  resetStore();
  // Create a copy with unsanitized names
  const data = structuredClone(FULL_DATA_JSON);
  data.path.P001.name = 'Main Route!';
  data.flag.F001.name = 'Met Merchant!';

  getState().loadFromJSON(data);

  assert(getState().path['P001'].name === 'main_route_', 'path name sanitized on import (AR-07)');
  assert(getState().flag['F001'].name === 'met_merchant_', 'flag name sanitized on import (AR-07)');
})();

// Load full JSON — sub-element IDs are replaced with runtime IDs
(() => {
  resetStore();
  getState().loadFromJSON(structuredClone(FULL_DATA_JSON));

  const node = getState().common['N001'];
  // The original had 'VAR_001' — after import with toRuntimeIds it should be different
  assert(node.variants[0].id !== 'VAR_001', 'variant ID replaced with runtime ID (AR-06)');
  assert(node.variants[0].id.startsWith('variant_'), 'variant ID has correct prefix');

  assert(node.next[0].id !== 'NE_001', 'next entry ID replaced with runtime ID (AR-06)');
  assert(node.next[0].id.startsWith('route_'), 'next entry ID has correct prefix');

  // Conditions inside requires should also be replaced
  assert(node.requires.conditions[0].id !== 'COND_N1', 'condition ID replaced');
  assert(node.requires.conditions[0].id.startsWith('cond_'), 'condition ID has correct prefix');

  // Choice option IDs should be replaced
  const choice = getState().choice['CH001'];
  assert(choice.options[0].id !== 'OPT_001', 'option ID replaced');
  assert(choice.options[0].id.startsWith('opt_'), 'option ID has correct prefix');
})();

group('toExportJSON');

// Export produces valid structure
(() => {
  resetStore();
  getState().loadFromJSON(structuredClone(MINIMAL_VALID_JSON));

  const exported = getState().toExportJSON();

  assert(exported.metadata != null, 'export has metadata');
  assert(typeof exported.metadata.updated_at === 'string', 'export updates updated_at');
  assert(exported.common != null, 'export has common');
  assert(exported.common['N001'] != null, 'export has N001');
  assert(exported.choice != null, 'export has choice');
  assert(exported.ending != null, 'export has ending');
  assert(exported.quest != null, 'export has quest');
  assert(exported.path != null, 'export has path');
  assert(exported.chapter != null, 'export has chapter');
  assert(exported.flag != null, 'export has flag');
  assert(exported.status != null, 'export has status');
})();

// Export applies hierarchical IDs to sub-elements
(() => {
  resetStore();
  getState().loadFromJSON(structuredClone(FULL_DATA_JSON));

  const exported = getState().toExportJSON();
  const node = exported.common['N001'];

  // Next entries should have hierarchical IDs
  assert(node.next[0].id === 'N001_NE001', 'next entry has hierarchical ID');

  // Variants should have hierarchical IDs
  assert(node.variants[0].id === 'N001_VAR001', 'variant has hierarchical ID');

  // Choice options should have hierarchical IDs
  const choice = exported.choice['CH001'];
  assert(choice.options[0].id === 'CH001_OPT001', 'option has hierarchical ID');

  // Option next entries
  assert(choice.options[0].next[0].id === 'CH001_OPT001_NE001', 'option next entry has hierarchical ID');
})();

// Round-trip: export → import produces equivalent data
(() => {
  resetStore();
  getState().loadFromJSON(structuredClone(FULL_DATA_JSON));

  // Capture state after load
  const stateAfterLoad = structuredClone({
    metadata: getState().metadata,
    common: getState().common,
    choice: getState().choice,
    ending: getState().ending,
    flag: getState().flag,
    status: getState().status,
    path: getState().path,
    chapter: getState().chapter,
  });

  // Export
  const exported = getState().toExportJSON();

  // Re-import
  resetStore();
  getState().loadFromJSON(exported);

  const stateAfterReimport = getState();

  // Data should be structurally equivalent (IDs will differ due to runtime regeneration)
  assert(stateAfterReimport.metadata.version === stateAfterLoad.metadata.version, 'round-trip: version preserved');
  assert(stateAfterReimport.metadata.entry_node === stateAfterLoad.metadata.entry_node, 'round-trip: entry_node preserved');
  assert(Object.keys(stateAfterReimport.common).length === Object.keys(stateAfterLoad.common).length, 'round-trip: same number of common nodes');
  assert(Object.keys(stateAfterReimport.choice).length === Object.keys(stateAfterLoad.choice).length, 'round-trip: same number of choices');
  assert(Object.keys(stateAfterReimport.ending).length === Object.keys(stateAfterLoad.ending).length, 'round-trip: same number of endings');
  assert(Object.keys(stateAfterReimport.flag).length === Object.keys(stateAfterLoad.flag).length, 'round-trip: same number of flags');
  assert(Object.keys(stateAfterReimport.status).length === Object.keys(stateAfterLoad.status).length, 'round-trip: same number of status points');

  // Content preserved (not IDs, since they're regenerated)
  const reimportedN001 = stateAfterReimport.common['N001'];
  assert(reimportedN001.name === stateAfterLoad.common['N001'].name, 'round-trip: node name preserved');
  assert(reimportedN001.description === stateAfterLoad.common['N001'].description, 'round-trip: description preserved');
  assert(reimportedN001.type === stateAfterLoad.common['N001'].type, 'round-trip: type preserved');
  assert(reimportedN001.next.length === stateAfterLoad.common['N001'].next.length, 'round-trip: next count preserved');
  assert(reimportedN001.variants.length === stateAfterLoad.common['N001'].variants.length, 'round-trip: variant count preserved');
})();

// ════════════════════════════════════════════════════════════
//  SECTION O — resetStore
// ════════════════════════════════════════════════════════════

group('resetStore');

(() => {
  // Add a bunch of entities
  const nId = getState().addCommonNode({ name: 'test' });
  getState().addChoice();
  getState().addEnding();
  getState().addFlag();
  getState().addStatusPoint();
  getState().addPath();
  getState().addChapter();
  getState().setEntryNode(nId);

  // Reset
  getState().resetStore();
  const s = getState();

  assert(deepEqual(s.common, {}), 'common cleared');
  assert(deepEqual(s.choice, {}), 'choice cleared');
  assert(deepEqual(s.ending, {}), 'ending cleared');
  assert(deepEqual(s.flag, {}), 'flag cleared');
  assert(deepEqual(s.status, {}), 'status cleared');
  assert(deepEqual(s.path, {}), 'path cleared');
  assert(deepEqual(s.chapter, {}), 'chapter cleared');
  assert(deepEqual(s.quest, {}), 'quest cleared');
  assert(s.metadata.entry_node === null, 'entry_node cleared');
  assert(s.metadata.version === '2.0', 'version reset to 2.0');
})();

// ════════════════════════════════════════════════════════════
//  SECTION P — Edge Cases & Failure Modes
// ════════════════════════════════════════════════════════════

group('Edge Cases — Non-Existent Entities');

// All operations on non-existent IDs should be no-ops, no crashes
(() => {
  resetStore();
  getState().updateCommonNode('NONEXISTENT', { name: 'x' });
  getState().deleteCommonNode('NONEXISTENT');
  getState().updateChoice('NONEXISTENT', { text: 'x' });
  getState().deleteChoice('NONEXISTENT');
  getState().updateEnding('NONEXISTENT', { name: 'x' });
  getState().deleteEnding('NONEXISTENT');
  getState().updateFlag('NONEXISTENT', { name: 'x' });
  getState().deleteFlag('NONEXISTENT');
  getState().updateStatusPoint('NONEXISTENT', { name: 'x' });
  getState().deleteStatusPoint('NONEXISTENT');
  getState().updatePath('NONEXISTENT', { name: 'x' });
  getState().deletePath('NONEXISTENT');
  getState().updateChapter('NONEXISTENT', { name: 'x' });
  getState().deleteChapter('NONEXISTENT');
  getState().addNextEntry('NONEXISTENT', 'target');
  getState().removeNextEntry('NONEXISTENT', 'ne');
  getState().addVariant('NONEXISTENT');
  getState().removeVariant('NONEXISTENT', 'v');
  getState().addOption('NONEXISTENT');
  getState().removeOption('NONEXISTENT', 'o');
  getState().addCondition('common', 'NONEXISTENT', { flag: 'F1', state: true });
  getState().removeCondition('common', 'NONEXISTENT', 'c');
  assert(true, 'all operations on non-existent entities are no-ops (no crash)');
})();

group('Edge Cases — Multiple Entities');

// Multiple common nodes
(() => {
  resetStore();
  const n1 = getState().addCommonNode({ name: 'first' });
  const n2 = getState().addCommonNode({ name: 'second' });
  const n3 = getState().addCommonNode({ name: 'third' });

  assert(Object.keys(getState().common).length === 3, 'three common nodes exist');
  assert(n1 !== n2 && n2 !== n3 && n1 !== n3, 'all IDs unique');

  getState().deleteCommonNode(n2);
  assert(Object.keys(getState().common).length === 2, 'one removed');
  assert(getState().common[n1] != null, 'n1 still exists');
  assert(getState().common[n3] != null, 'n3 still exists');
  assert(getState().common[n2] === undefined, 'n2 gone');
})();

group('Edge Cases — updated_at timestamp');

// Every mutation should update metadata.updated_at
(() => {
  resetStore();
  const initial = getState().metadata.updated_at;

  // Small delay to ensure timestamp changes
  const nId = getState().addCommonNode();
  const afterAdd = getState().metadata.updated_at;
  // Updated_at should be set (may or may not differ from initial depending on timing)
  assert(typeof afterAdd === 'string' && afterAdd.length > 0, 'updated_at is valid ISO string after add');

  getState().updateCommonNode(nId, { name: 'test' });
  const afterUpdate = getState().metadata.updated_at;
  assert(typeof afterUpdate === 'string' && afterUpdate.length > 0, 'updated_at is valid ISO string after update');

  getState().deleteCommonNode(nId);
  const afterDelete = getState().metadata.updated_at;
  assert(typeof afterDelete === 'string' && afterDelete.length > 0, 'updated_at is valid ISO string after delete');
})();

group('Data Integrity — AR-03/04/05 invariants after mutations');

// After multiple add/delete cycles, invariants should hold
(() => {
  resetStore();
  const n1 = getState().addCommonNode();
  const n2 = getState().addCommonNode();
  getState().addNextEntry(n1, n2);
  getState().addVariant(n1, { text: 'v1' });
  getState().addCondition('common', n1, { flag: 'F001', state: true });

  // Delete n2 (should clean next entries)
  getState().deleteCommonNode(n2);

  const node = getState().common[n1];
  // AR-03: requires is still a ConditionGroup
  assert(node.requires.operator === 'and' || node.requires.operator === 'or', 'AR-03: requires has operator after mutations');
  assert(Array.isArray(node.requires.conditions), 'AR-03: requires.conditions is array');
  // AR-04: next is still an array
  assert(Array.isArray(node.next), 'AR-04: next is array after target deleted');
  // AR-05: array fields are arrays
  assert(Array.isArray(node.flags_set), 'AR-05: flags_set is array');
  assert(Array.isArray(node.status_set), 'AR-05: status_set is array');
  assert(Array.isArray(node.variants), 'AR-05: variants is array');
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
