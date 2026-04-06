// ============================================================
// Phase 2 — Utility Layer — Manual Test Suite
// ============================================================
// Run: node src/utils/__test_phase2.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
// ============================================================

import { generateId } from '../utils/generateId.js';
import { sanitizeName } from '../utils/sanitizeName.js';
import { deepEqual } from '../utils/deepEqual.js';
import { evaluateCondition } from '../utils/conditionEval.js';
import {
  createCommonNode,
  createChoice,
  createEnding,
  createFlag,
  createStatusPoint,
  createPath,
  createChapter,
} from '../utils/entityDefaults.js';
import { toHierarchicalIds, toRuntimeIds } from '../utils/idTransform.js';

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

// ── Fixtures ────────────────────────────────────────────────

const FIXTURE_FLAG_MAP = { F001: true, F002: false, F003: true };
const FIXTURE_STATUS_MAP = { SP001: 5, SP002: -3, SP003: 0 };

const FIXTURE_FULL_DATA_MODEL = {
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
          id: 'variant_abc_1234',
          requires: {
            operator: 'and',
            conditions: [
              { id: 'cond_v1_aaaa', flag: 'F001', state: true },
            ],
          },
          text: 'Alternate text',
        },
      ],
      requires: {
        operator: 'and',
        conditions: [
          { id: 'cond_n1_bbbb', flag: 'F001', state: true },
        ],
      },
      flags_set: ['F001'],
      status_set: [{ status: 'SP001', amount: 5 }],
      next: [
        {
          id: 'route_n1_cccc',
          target: 'CH001',
          requires: { operator: 'and', conditions: [] },
        },
      ],
      _position: { x: 100, y: 200 },
    },
  },
  choice: {
    CH001: {
      id: 'CH001',
      text: 'What do you do?',
      chapter: 'C001',
      path: 'P001',
      requires: {
        operator: 'and',
        conditions: [
          { id: 'cond_ch1_dddd', flag: 'F001', state: true },
          {
            operator: 'or',
            conditions: [
              { id: 'cond_ch1_eeee', status: 'SP001', min: 0 },
              { id: 'cond_ch1_ffff', flag: 'F002', state: true },
            ],
          },
        ],
      },
      options: [
        {
          id: 'opt_ch1_gggg',
          label: 'Fight the dragon',
          requires: { operator: 'and', conditions: [] },
          flags_set: ['F001'],
          status_set: [{ status: 'SP001', amount: -2 }],
          next: [
            {
              id: 'route_ch1_hhhh',
              target: 'N002',
              requires: {
                operator: 'and',
                conditions: [
                  { id: 'cond_ch1_iiii', flag: 'F001', state: true },
                ],
              },
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
          { id: 'cond_e1_jjjj', flag: 'F001', state: true },
          { id: 'cond_e1_kkkk', status: 'SP001', min: 0, max: 10 },
        ],
      },
      _position: { x: 500, y: 200 },
    },
  },
  quest: {},
};

// ════════════════════════════════════════════════════════════
//  generateId
// ════════════════════════════════════════════════════════════

group('generateId');

// Happy path
(() => {
  const id = generateId('cond');
  assert(typeof id === 'string', 'returns a string');
  assert(id.startsWith('cond_'), 'starts with prefix + underscore');

  const parts = id.split('_');
  assert(parts.length === 3, 'has 3 parts: prefix, timestamp, random');
  assert(!isNaN(Number(parts[1])), 'second part is a numeric timestamp');
  assert(parts[2].length === 4, 'third part is 4 characters');
})();

// Uniqueness
(() => {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(generateId('test'));
  }
  assert(ids.size === 100, '100 calls produce 100 unique IDs');
})();

// Different prefixes
(() => {
  const a = generateId('opt');
  const b = generateId('variant');
  const c = generateId('route');
  assert(a.startsWith('opt_'), 'opt prefix works');
  assert(b.startsWith('variant_'), 'variant prefix works');
  assert(c.startsWith('route_'), 'route prefix works');
})();

// Edge: empty prefix
(() => {
  const id = generateId('');
  assert(id.startsWith('_'), 'empty prefix produces leading underscore');
})();

// No module-level state (AR-06) — tested by uniqueness above

// ════════════════════════════════════════════════════════════
//  sanitizeName
// ════════════════════════════════════════════════════════════

group('sanitizeName');

// Happy path
assert(sanitizeName('My Scene Name!') === 'my_scene_name_', '"My Scene Name!" → "my_scene_name_"');
assert(sanitizeName('hello-world 123') === 'hello_world_123', '"hello-world 123" → "hello_world_123"');
assert(sanitizeName('UPPER_case') === 'upper_case', '"UPPER_case" → "upper_case"');
assert(sanitizeName('already_valid') === 'already_valid', '"already_valid" unchanged');
assert(sanitizeName('abc123') === 'abc123', '"abc123" unchanged');

// Edge cases
assert(sanitizeName('') === '', 'empty string → empty string');
assert(sanitizeName('a') === 'a', 'single char → lowercase');
assert(sanitizeName('A') === 'a', 'single uppercase → lowercase');
assert(sanitizeName('!!!') === '___', '"!!!" → "___"');
assert(sanitizeName('a--b') === 'a__b', '"a--b" → "a__b" (no collapse)');
assert(sanitizeName('café') === 'caf_', '"café" → "caf_" (non-ascii)');
assert(sanitizeName('hello world') === 'hello_world', '"hello world" → "hello_world"');

// Failure cases: non-string input
assert(sanitizeName(null) === '', 'null → empty string');
assert(sanitizeName(undefined) === '', 'undefined → empty string');
assert(sanitizeName(123) === '', 'number → empty string');
assert(sanitizeName({}) === '', 'object → empty string');

// ════════════════════════════════════════════════════════════
//  deepEqual
// ════════════════════════════════════════════════════════════

group('deepEqual');

// Happy path — primitives
assert(deepEqual(1, 1) === true, 'equal numbers');
assert(deepEqual('a', 'a') === true, 'equal strings');
assert(deepEqual(true, true) === true, 'equal booleans');
assert(deepEqual(null, null) === true, 'null === null');
assert(deepEqual(undefined, undefined) === true, 'undefined === undefined');

// Happy path — objects
assert(deepEqual({ a: 1 }, { a: 1 }) === true, 'equal simple objects');
assert(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }) === true, 'object key order insensitive');
assert(deepEqual({ a: { b: 1 } }, { a: { b: 1 } }) === true, 'nested objects');

// Happy path — arrays
assert(deepEqual([1, 2, 3], [1, 2, 3]) === true, 'equal arrays');
assert(deepEqual([{ a: 1 }], [{ a: 1 }]) === true, 'array of objects');

// Inequality
assert(deepEqual(1, 2) === false, 'different numbers');
assert(deepEqual('a', 'b') === false, 'different strings');
assert(deepEqual(true, false) === false, 'different booleans');
assert(deepEqual({ a: 1 }, { a: 2 }) === false, 'different object values');
assert(deepEqual({ a: 1 }, { a: 1, b: 2 }) === false, 'extra key');
assert(deepEqual({ a: 1, b: 2 }, { a: 1 }) === false, 'missing key');
assert(deepEqual([1, 2], [2, 1]) === false, 'array order matters');
assert(deepEqual([1, 2], [1, 2, 3]) === false, 'different array length');

// Edge cases
assert(deepEqual(null, undefined) === false, 'null !== undefined');
assert(deepEqual(0, false) === false, '0 !== false');
assert(deepEqual('', false) === false, '"" !== false');
assert(deepEqual([], {}) === false, 'array !== object');
assert(deepEqual(null, {}) === false, 'null !== object');
assert(deepEqual({}, null) === false, 'object !== null');
assert(deepEqual([], []) === true, 'empty arrays are equal');
assert(deepEqual({}, {}) === true, 'empty objects are equal');

// Data model relevant: condition group comparison
assert(
  deepEqual(
    { operator: 'and', conditions: [] },
    { operator: 'and', conditions: [] }
  ) === true,
  'empty condition groups are equal'
);
assert(
  deepEqual(
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] }
  ) === true,
  'condition groups with same conditions are equal'
);
assert(
  deepEqual(
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    { operator: 'or', conditions: [{ id: 'c1', flag: 'F001', state: true }] }
  ) === false,
  'different operators make groups unequal'
);

// ════════════════════════════════════════════════════════════
//  evaluateCondition
// ════════════════════════════════════════════════════════════

group('evaluateCondition');

// Happy path — empty group passes
assert(
  evaluateCondition({ operator: 'and', conditions: [] }, {}, {}) === true,
  'empty AND group passes'
);
assert(
  evaluateCondition({ operator: 'or', conditions: [] }, {}, {}) === true,
  'empty OR group passes'
);

// Happy path — flag conditions
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    { F001: true }, {}
  ) === true,
  'flag F001=true when F001 is true → PASS'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    { F001: false }, {}
  ) === false,
  'flag F001=true when F001 is false → FAIL'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    {}, {}
  ) === false,
  'flag F001=true when F001 missing → FAIL (defaults to false)'
);

// Happy path — status conditions
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 0 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 >= 0 when SP001=5 → PASS'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 10 }] },
    {}, { SP001: 5 }
  ) === false,
  'status SP001 >= 10 when SP001=5 → FAIL'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', max: 10 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 <= 10 when SP001=5 → PASS'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', max: 3 }] },
    {}, { SP001: 5 }
  ) === false,
  'status SP001 <= 3 when SP001=5 → FAIL'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 0, max: 10 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 in [0,10] when SP001=5 → PASS'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 6, max: 10 }] },
    {}, { SP001: 5 }
  ) === false,
  'status SP001 in [6,10] when SP001=5 → FAIL'
);

// Boundary values
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 5 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 >= 5 when SP001=5 → PASS (boundary)'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', max: 5 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 <= 5 when SP001=5 → PASS (boundary)'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 5, max: 5 }] },
    {}, { SP001: 5 }
  ) === true,
  'status SP001 in [5,5] when SP001=5 → PASS (boundary, exact)'
);

// Negative values
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP002', min: -5, max: 5 }] },
    {}, { SP002: -3 }
  ) === true,
  'status SP002 in [-5,5] when SP002=-3 → PASS'
);

// AND logic
assert(
  evaluateCondition(
    {
      operator: 'and',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },
        { id: 'c2', flag: 'F003', state: true },
      ],
    },
    FIXTURE_FLAG_MAP, {}
  ) === true,
  'AND: both flags true → PASS'
);
assert(
  evaluateCondition(
    {
      operator: 'and',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },
        { id: 'c2', flag: 'F002', state: true },
      ],
    },
    FIXTURE_FLAG_MAP, {}
  ) === false,
  'AND: one flag false → FAIL'
);

// OR logic
assert(
  evaluateCondition(
    {
      operator: 'or',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },
        { id: 'c2', flag: 'F002', state: true },
      ],
    },
    FIXTURE_FLAG_MAP, {}
  ) === true,
  'OR: one flag true → PASS'
);
assert(
  evaluateCondition(
    {
      operator: 'or',
      conditions: [
        { id: 'c1', flag: 'F002', state: true },
        { id: 'c2', flag: 'F001', state: false },
      ],
    },
    FIXTURE_FLAG_MAP, {}
  ) === false,
  'OR: both conditions false → FAIL'
);

// Nested groups — complex real-world condition
assert(
  evaluateCondition(
    {
      operator: 'and',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },
        { id: 'c2', status: 'SP001', min: 0 },
        {
          operator: 'or',
          conditions: [
            { id: 'c3', flag: 'F002', state: true },
            { id: 'c4', status: 'SP002', min: -5, max: 5 },
          ],
        },
      ],
    },
    FIXTURE_FLAG_MAP, FIXTURE_STATUS_MAP
  ) === true,
  'nested: AND(flag=T, status>=0, OR(flag=F→F, status_range→T)) → PASS'
);

assert(
  evaluateCondition(
    {
      operator: 'and',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },
        {
          operator: 'or',
          conditions: [
            { id: 'c2', flag: 'F002', state: true },
            { id: 'c3', flag: 'F001', state: false },
          ],
        },
      ],
    },
    FIXTURE_FLAG_MAP, {}
  ) === false,
  'nested: AND(flag=T, OR(F→F, F→F)) → FAIL'
);

// Edge cases
assert(
  evaluateCondition(null, {}, {}) === true,
  'null conditionGroup → PASS'
);
assert(
  evaluateCondition(undefined, {}, {}) === true,
  'undefined conditionGroup → PASS'
);
assert(
  evaluateCondition({}, {}, {}) === true,
  'empty object conditionGroup → PASS'
);
assert(
  evaluateCondition({ operator: 'and' }, {}, {}) === true,
  'missing conditions array → PASS'
);

// Failure cases — invalid data
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', flag: '', state: true }] },
    { '': true }, {}
  ) === false,
  'empty flag ID → FAIL (invalid data)'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: '', min: 0 }] },
    {}, { '': 5 }
  ) === false,
  'empty status ID → FAIL (invalid data)'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP001' }] },
    {}, { SP001: 5 }
  ) === false,
  'status condition with no min/max → FAIL (malformed)'
);
assert(
  evaluateCondition(
    { operator: 'invalid', conditions: [{ id: 'c1', flag: 'F001', state: true }] },
    { F001: true }, {}
  ) === false,
  'unknown operator → FAIL'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', unknown: 'field' }] },
    {}, {}
  ) === false,
  'unknown condition type → FAIL'
);

// Missing status defaults to 0
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP_MISSING', min: 0 }] },
    {}, {}
  ) === true,
  'missing status defaults to 0, min=0 → PASS'
);
assert(
  evaluateCondition(
    { operator: 'and', conditions: [{ id: 'c1', status: 'SP_MISSING', min: 1 }] },
    {}, {}
  ) === false,
  'missing status defaults to 0, min=1 → FAIL'
);

// ════════════════════════════════════════════════════════════
//  Entity Factories — createCommonNode
// ════════════════════════════════════════════════════════════

group('createCommonNode');

(() => {
  const node = createCommonNode();

  // Data model field presence
  assert(typeof node.id === 'string' && node.id.length > 0, 'has id (auto-generated)');
  assert(node.name === '', 'name defaults to ""');
  assert(node.type === null, 'type defaults to null');
  assert(node.chapter === null, 'chapter defaults to null');
  assert(node.path === null, 'path defaults to null');
  assert(node.description === '', 'description defaults to ""');
  assert(Array.isArray(node.variants) && node.variants.length === 0, 'variants defaults to []');
  assert(
    deepEqual(node.requires, { operator: 'and', conditions: [] }),
    'requires defaults to { operator: "and", conditions: [] } (AR-03)'
  );
  assert(Array.isArray(node.flags_set) && node.flags_set.length === 0, 'flags_set defaults to [] (AR-05)');
  assert(Array.isArray(node.status_set) && node.status_set.length === 0, 'status_set defaults to [] (AR-05)');
  assert(Array.isArray(node.next) && node.next.length === 0, 'next defaults to [] (AR-04, AR-05)');
  assert(deepEqual(node._position, { x: 0, y: 0 }), '_position defaults to { x: 0, y: 0 } (AR-10)');

  // Field ordering
  const keys = Object.keys(node);
  const expected = ['id', 'name', 'type', 'chapter', 'path', 'description', 'variants', 'requires', 'flags_set', 'status_set', 'next', '_position'];
  assert(deepEqual(keys, expected), 'field order matches data model (Identity→Classification→Content→Prerequisites→SideEffects→Routing→Metadata)');

  // No extra fields
  assert(keys.length === 12, 'exactly 12 fields, no extras');
})();

// With overrides
(() => {
  const node = createCommonNode({
    id: 'N001',
    name: 'Test Scene!',
    type: 'interaction',
    chapter: 'C001',
    path: 'P001',
  });
  assert(node.id === 'N001', 'id override accepted');
  assert(node.name === 'test_scene_', 'name is sanitized (AR-07)');
  assert(node.type === 'interaction', 'type override accepted');
  assert(node.chapter === 'C001', 'chapter override accepted');
  assert(node.path === 'P001', 'path override accepted');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createChoice
// ════════════════════════════════════════════════════════════

group('createChoice');

(() => {
  const choice = createChoice();

  assert(typeof choice.id === 'string' && choice.id.length > 0, 'has id (auto-generated)');
  assert(choice.text === '', 'text defaults to ""');
  assert(choice.chapter === null, 'chapter defaults to null');
  assert(choice.path === null, 'path defaults to null');
  assert(
    deepEqual(choice.requires, { operator: 'and', conditions: [] }),
    'requires defaults to { operator: "and", conditions: [] } (AR-03)'
  );
  assert(Array.isArray(choice.options) && choice.options.length === 0, 'options defaults to [] (AR-05)');
  assert(deepEqual(choice._position, { x: 0, y: 0 }), '_position defaults to { x: 0, y: 0 }');

  // No name field on Choice (data model says "text" not "name")
  assert(!('name' in choice), 'Choice has no "name" field (uses "text" instead)');

  // No next field on Choice (routing is through options)
  assert(!('next' in choice), 'Choice has no top-level "next" field');

  // No flags_set or status_set on Choice (those are on options)
  assert(!('flags_set' in choice), 'Choice has no top-level "flags_set" field');
  assert(!('status_set' in choice), 'Choice has no top-level "status_set" field');

  const keys = Object.keys(choice);
  const expected = ['id', 'text', 'chapter', 'path', 'requires', 'options', '_position'];
  assert(deepEqual(keys, expected), 'field order matches data model');
  assert(keys.length === 7, 'exactly 7 fields, no extras');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createEnding
// ════════════════════════════════════════════════════════════

group('createEnding');

(() => {
  const ending = createEnding();

  assert(typeof ending.id === 'string' && ending.id.length > 0, 'has id (auto-generated)');
  assert(ending.name === '', 'name defaults to ""');
  assert(ending.type === null, 'type defaults to null');
  assert(ending.chapter === null, 'chapter defaults to null');
  assert(ending.path === null, 'path defaults to null');
  assert(
    deepEqual(ending.requires, { operator: 'and', conditions: [] }),
    'requires defaults to { operator: "and", conditions: [] } (AR-03)'
  );
  assert(deepEqual(ending._position, { x: 0, y: 0 }), '_position defaults to { x: 0, y: 0 }');

  // No routing fields
  assert(!('next' in ending), 'Ending has no "next" field');
  assert(!('flags_set' in ending), 'Ending has no "flags_set" field');
  assert(!('status_set' in ending), 'Ending has no "status_set" field');
  assert(!('variants' in ending), 'Ending has no "variants" field');

  const keys = Object.keys(ending);
  const expected = ['id', 'name', 'type', 'chapter', 'path', 'requires', '_position'];
  assert(deepEqual(keys, expected), 'field order matches data model');
  assert(keys.length === 7, 'exactly 7 fields, no extras');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createFlag
// ════════════════════════════════════════════════════════════

group('createFlag');

(() => {
  const flag = createFlag();

  assert(typeof flag.id === 'string' && flag.id.length > 0, 'has id (auto-generated)');
  assert(flag.name === '', 'name defaults to ""');
  assert(flag.state === false, 'state defaults to false');
  assert(flag.path === null, 'path defaults to null');
  assert(flag.chapter === null, 'chapter defaults to null');

  // No extra fields
  const keys = Object.keys(flag);
  const expected = ['id', 'name', 'state', 'path', 'chapter'];
  assert(deepEqual(keys, expected), 'field order matches data model');
  assert(keys.length === 5, 'exactly 5 fields, no extras');

  // No _position (flags are not graph nodes)
  assert(!('_position' in flag), 'Flag has no _position');
  // No requires (flags are state, not conditioned entities)
  assert(!('requires' in flag), 'Flag has no requires');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createStatusPoint
// ════════════════════════════════════════════════════════════

group('createStatusPoint');

(() => {
  const sp = createStatusPoint();

  assert(typeof sp.id === 'string' && sp.id.length > 0, 'has id (auto-generated)');
  assert(sp.name === '', 'name defaults to ""');
  assert(sp.value === 0, 'value defaults to 0');
  assert(sp.minValue === null, 'minValue defaults to null');
  assert(sp.maxValue === null, 'maxValue defaults to null');
  assert(sp.path === null, 'path defaults to null');
  assert(sp.chapter === null, 'chapter defaults to null');

  const keys = Object.keys(sp);
  const expected = ['id', 'name', 'value', 'minValue', 'maxValue', 'path', 'chapter'];
  assert(deepEqual(keys, expected), 'field order matches data model');
  assert(keys.length === 7, 'exactly 7 fields, no extras');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createPath
// ════════════════════════════════════════════════════════════

group('createPath');

(() => {
  const p = createPath();
  assert(typeof p.id === 'string' && p.id.length > 0, 'has id');
  assert(p.name === '', 'name defaults to ""');

  const keys = Object.keys(p);
  assert(deepEqual(keys, ['id', 'name']), 'only id and name fields');
  assert(keys.length === 2, 'exactly 2 fields');
})();

(() => {
  const p = createPath({ name: 'Main Route!' });
  assert(p.name === 'main_route_', 'name sanitized (AR-07)');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — createChapter
// ════════════════════════════════════════════════════════════

group('createChapter');

(() => {
  const c = createChapter();
  assert(typeof c.id === 'string' && c.id.length > 0, 'has id');
  assert(c.name === '', 'name defaults to ""');

  const keys = Object.keys(c);
  assert(deepEqual(keys, ['id', 'name']), 'only id and name fields');
  assert(keys.length === 2, 'exactly 2 fields');
})();

(() => {
  const c = createChapter({ name: 'Chapter One!!' });
  assert(c.name === 'chapter_one__', 'name sanitized (AR-07)');
})();

// ════════════════════════════════════════════════════════════
//  Entity Factories — independence
// ════════════════════════════════════════════════════════════

group('Entity Factories — independence');

// Two calls produce independent objects (no shared references)
(() => {
  const a = createCommonNode();
  const b = createCommonNode();
  assert(a !== b, 'different object references');
  assert(a.id !== b.id, 'different auto-generated IDs');
  assert(a.variants !== b.variants, 'different array references (variants)');
  assert(a.requires !== b.requires, 'different object references (requires)');
  assert(a._position !== b._position, 'different object references (_position)');

  // Mutating one should not affect the other
  a.flags_set.push('F001');
  assert(b.flags_set.length === 0, 'mutation of one does not affect another');
})();

// ════════════════════════════════════════════════════════════
//  toHierarchicalIds (export)
// ════════════════════════════════════════════════════════════

group('toHierarchicalIds');

(() => {
  const exported = toHierarchicalIds(FIXTURE_FULL_DATA_MODEL);

  // Does not mutate original
  assert(
    FIXTURE_FULL_DATA_MODEL.common.N001.requires.conditions[0].id === 'cond_n1_bbbb',
    'original data not mutated (deep clone)'
  );

  // Top-level IDs preserved
  assert(exported.common.N001.id === 'N001', 'N001 top-level ID preserved');
  assert(exported.choice.CH001.id === 'CH001', 'CH001 top-level ID preserved');
  assert(exported.ending.E001.id === 'E001', 'E001 top-level ID preserved');

  // Common Node conditions
  assert(
    exported.common.N001.requires.conditions[0].id === 'N001_COND001',
    'N001 condition 1 → N001_COND001'
  );

  // Common Node variants
  assert(
    exported.common.N001.variants[0].id === 'N001_VAR001',
    'N001 variant 1 → N001_VAR001'
  );
  assert(
    exported.common.N001.variants[0].requires.conditions[0].id === 'N001_VAR001_COND001',
    'N001 variant 1 condition → N001_VAR001_COND001'
  );

  // Common Node next entries
  assert(
    exported.common.N001.next[0].id === 'N001_NE001',
    'N001 next entry 1 → N001_NE001'
  );

  // Choice conditions — includes nested OR group
  const choiceConds = exported.choice.CH001.requires.conditions;
  assert(choiceConds[0].id === 'CH001_COND001', 'CH001 top-level condition 1 → CH001_COND001');
  // The OR group itself has no ID
  assert(choiceConds[1].operator === 'or', 'CH001 nested group is still an OR group');
  assert(!('id' in choiceConds[1]), 'OR group has no id field');
  // Conditions inside OR group continue the flat counter
  assert(choiceConds[1].conditions[0].id === 'CH001_COND002', 'CH001 nested cond 1 → CH001_COND002');
  assert(choiceConds[1].conditions[1].id === 'CH001_COND003', 'CH001 nested cond 2 → CH001_COND003');

  // Choice options
  assert(
    exported.choice.CH001.options[0].id === 'CH001_OPT001',
    'CH001 option 1 → CH001_OPT001'
  );

  // Choice option next entries
  assert(
    exported.choice.CH001.options[0].next[0].id === 'CH001_OPT001_NE001',
    'CH001 option 1 next 1 → CH001_OPT001_NE001'
  );

  // Choice option next entry conditions (4 levels deep)
  assert(
    exported.choice.CH001.options[0].next[0].requires.conditions[0].id === 'CH001_OPT001_NE001_COND001',
    'CH001 option 1 next 1 cond 1 → CH001_OPT001_NE001_COND001 (4 levels)'
  );

  // Ending conditions
  assert(
    exported.ending.E001.requires.conditions[0].id === 'E001_COND001',
    'E001 condition 1 → E001_COND001'
  );
  assert(
    exported.ending.E001.requires.conditions[1].id === 'E001_COND002',
    'E001 condition 2 → E001_COND002'
  );

  // Non-ID fields preserved
  assert(exported.common.N001.name === 'opening_scene', 'name preserved');
  assert(exported.common.N001.description === 'The story begins...', 'description preserved');
  assert(exported.common.N001.flags_set[0] === 'F001', 'flags_set preserved');
  assert(exported.common.N001.next[0].target === 'CH001', 'next target preserved');
  assert(exported.ending.E001.type === 'bad_end', 'ending type preserved');

  // Metadata, path, chapter, flag, status, quest untouched
  assert(exported.metadata.version === '2.0', 'metadata preserved');
  assert(exported.path.P001.name === 'main_route', 'path preserved');
  assert(exported.chapter.C001.name === 'prologue', 'chapter preserved');
  assert(exported.flag.F001.name === 'met_merchant', 'flag preserved');
  assert(exported.status.SP001.name === 'reputation', 'status preserved');
  assert(deepEqual(exported.quest, {}), 'quest preserved as empty object');
})();

// ════════════════════════════════════════════════════════════
//  toRuntimeIds (import)
// ════════════════════════════════════════════════════════════

group('toRuntimeIds');

(() => {
  // First export to get hierarchical IDs, then import to get fresh random IDs
  const exported = toHierarchicalIds(FIXTURE_FULL_DATA_MODEL);
  const imported = toRuntimeIds(exported);

  // Does not mutate exported
  assert(
    exported.common.N001.requires.conditions[0].id === 'N001_COND001',
    'exported data not mutated'
  );

  // Top-level IDs preserved
  assert(imported.common.N001.id === 'N001', 'N001 top-level ID preserved on import');
  assert(imported.choice.CH001.id === 'CH001', 'CH001 top-level ID preserved on import');
  assert(imported.ending.E001.id === 'E001', 'E001 top-level ID preserved on import');

  // Sub-element IDs are now random (not hierarchical)
  const nodeCond = imported.common.N001.requires.conditions[0].id;
  assert(nodeCond !== 'N001_COND001', 'N001 condition ID replaced (no longer hierarchical)');
  assert(nodeCond.startsWith('cond_'), 'N001 condition ID has "cond_" prefix');

  const variant = imported.common.N001.variants[0].id;
  assert(variant !== 'N001_VAR001', 'variant ID replaced');
  assert(variant.startsWith('variant_'), 'variant ID has "variant_" prefix');

  const variantCond = imported.common.N001.variants[0].requires.conditions[0].id;
  assert(variantCond.startsWith('cond_'), 'variant condition has "cond_" prefix');

  const nextEntry = imported.common.N001.next[0].id;
  assert(nextEntry !== 'N001_NE001', 'next entry ID replaced');
  assert(nextEntry.startsWith('route_'), 'next entry ID has "route_" prefix');

  const optionId = imported.choice.CH001.options[0].id;
  assert(optionId !== 'CH001_OPT001', 'option ID replaced');
  assert(optionId.startsWith('opt_'), 'option ID has "opt_" prefix');

  const optNextId = imported.choice.CH001.options[0].next[0].id;
  assert(optNextId.startsWith('route_'), 'option next entry has "route_" prefix');

  const optNextCond = imported.choice.CH001.options[0].next[0].requires.conditions[0].id;
  assert(optNextCond.startsWith('cond_'), 'option next entry condition has "cond_" prefix');

  const endingCond = imported.ending.E001.requires.conditions[0].id;
  assert(endingCond.startsWith('cond_'), 'ending condition has "cond_" prefix');

  // Non-ID fields preserved through round-trip
  assert(imported.common.N001.name === 'opening_scene', 'name preserved through round-trip');
  assert(imported.common.N001.description === 'The story begins...', 'description preserved');
  assert(imported.common.N001.flags_set[0] === 'F001', 'flags_set preserved');
  assert(imported.common.N001.next[0].target === 'CH001', 'next target preserved');
  assert(imported.choice.CH001.text === 'What do you do?', 'choice text preserved');
  assert(imported.choice.CH001.options[0].label === 'Fight the dragon', 'option label preserved');
  assert(imported.ending.E001.type === 'bad_end', 'ending type preserved');
  assert(imported.ending.E001.requires.conditions[1].min === 0, 'status condition min preserved');
  assert(imported.ending.E001.requires.conditions[1].max === 10, 'status condition max preserved');
})();

// ════════════════════════════════════════════════════════════
//  Round-trip: toHierarchical → toRuntime → data integrity
// ════════════════════════════════════════════════════════════

group('Round-trip data integrity');

(() => {
  const exported = toHierarchicalIds(FIXTURE_FULL_DATA_MODEL);
  const imported = toRuntimeIds(exported);

  // All collection keys present
  assert('metadata' in imported, 'metadata collection present');
  assert('path' in imported, 'path collection present');
  assert('chapter' in imported, 'chapter collection present');
  assert('flag' in imported, 'flag collection present');
  assert('status' in imported, 'status collection present');
  assert('common' in imported, 'common collection present');
  assert('choice' in imported, 'choice collection present');
  assert('ending' in imported, 'ending collection present');
  assert('quest' in imported, 'quest collection present');

  // Entity counts preserved
  assert(Object.keys(imported.common).length === 1, 'common node count preserved');
  assert(Object.keys(imported.choice).length === 1, 'choice count preserved');
  assert(Object.keys(imported.ending).length === 1, 'ending count preserved');
  assert(Object.keys(imported.path).length === 1, 'path count preserved');
  assert(Object.keys(imported.chapter).length === 1, 'chapter count preserved');
  assert(Object.keys(imported.flag).length === 1, 'flag count preserved');
  assert(Object.keys(imported.status).length === 1, 'status count preserved');

  // Common Node field count preserved
  const nodeKeys = Object.keys(imported.common.N001);
  assert(nodeKeys.length === 12, 'common node has all 12 fields after round-trip');

  // Choice field count preserved
  const choiceKeys = Object.keys(imported.choice.CH001);
  assert(choiceKeys.length === 7, 'choice has all 7 fields after round-trip');

  // Ending field count preserved
  const endingKeys = Object.keys(imported.ending.E001);
  assert(endingKeys.length === 7, 'ending has all 7 fields after round-trip');

  // Sub-element counts preserved
  assert(imported.common.N001.variants.length === 1, 'variant count preserved');
  assert(imported.common.N001.next.length === 1, 'next entry count preserved');
  assert(imported.common.N001.requires.conditions.length === 1, 'common node condition count preserved');
  assert(imported.choice.CH001.options.length === 1, 'option count preserved');
  assert(imported.choice.CH001.requires.conditions.length === 2, 'choice condition count preserved (flat + nested group)');
  assert(imported.ending.E001.requires.conditions.length === 2, 'ending condition count preserved');

  // Nested group structure preserved
  const nestedGroup = imported.choice.CH001.requires.conditions[1];
  assert(nestedGroup.operator === 'or', 'nested group operator preserved');
  assert(nestedGroup.conditions.length === 2, 'nested group condition count preserved');
})();

// ════════════════════════════════════════════════════════════
//  Edge case: empty data model
// ════════════════════════════════════════════════════════════

group('Edge cases — empty/minimal data');

(() => {
  const minimal = {
    metadata: { version: '2.0', entry_node: 'N001' },
    path: {},
    chapter: {},
    flag: {},
    status: {},
    common: {},
    choice: {},
    ending: {},
    quest: {},
  };

  const exported = toHierarchicalIds(minimal);
  assert(deepEqual(exported.common, {}), 'empty common survives export');
  assert(deepEqual(exported.choice, {}), 'empty choice survives export');
  assert(deepEqual(exported.ending, {}), 'empty ending survives export');

  const imported = toRuntimeIds(exported);
  assert(deepEqual(imported.common, {}), 'empty common survives import');
  assert(deepEqual(imported.choice, {}), 'empty choice survives import');
  assert(deepEqual(imported.ending, {}), 'empty ending survives import');
})();

// Entity with no sub-elements
(() => {
  const data = {
    common: {
      N001: {
        id: 'N001', name: 'test', type: null, chapter: null, path: null,
        description: '', variants: [], requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [], next: [], _position: { x: 0, y: 0 },
      },
    },
    choice: {},
    ending: {},
  };

  const exported = toHierarchicalIds(data);
  assert(exported.common.N001.variants.length === 0, 'empty variants survive export');
  assert(exported.common.N001.next.length === 0, 'empty next survive export');
  assert(exported.common.N001.requires.conditions.length === 0, 'empty conditions survive export');
})();

// ════════════════════════════════════════════════════════════
//  Summary
// ════════════════════════════════════════════════════════════

console.log(`\n${'='.repeat(60)}`);
console.log(`  SUMMARY`);
console.log('='.repeat(60));
console.log(`  ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
