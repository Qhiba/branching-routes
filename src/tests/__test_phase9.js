// ============================================================
// Phase 9 — Floating Inspector Panel — Test Suite
// ============================================================
// Run: node src/tests/__test_phase9.js
// Each test prints PASS or FAIL with a description.
// Final summary: X passed, Y failed.
//
// Tests cover:
//   A — resolveEntity: entity type detection from narrative state
//   B — TYPE_CONFIG: label/icon/accent mapping integrity
//   C — Field section ordering per spec §2.1
//   D — ConditionEditor: guard for empty/invalid input (AR-03)
//   E — ConditionEditor: add flag condition logic
//   F — ConditionEditor: add status condition logic
//   G — ConditionEditor: add nested group logic
//   H — ConditionEditor: remove condition by index
//   I — ConditionEditor: toggle operator (AND ↔ OR)
//   J — NextEditor: add/remove/update entry logic
//   K — VariantEditor: add/remove/update variant logic
//   L — OptionEditor: add new option defaults (Plan §4.2)
//   M — FlagSetEditor: toggle flag in/out of flags_set[]
//   N — StatusSetEditor: add/remove/update delta logic
//   O — SelectField: null sentinel value (__null__) mapping
//   P — TextField: null-safe value rendering
//   Q — Data integrity: entity defaults vs Plan §4
//   R — Failure / edge cases
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


// ── Inline copies of pure logic from Phase 9 ────────────────

// From InspectorPanel.jsx — resolveEntity()
function resolveEntity(nodeId, narrativeState) {
  if (!nodeId) return null;

  if (narrativeState.common[nodeId]) {
    return { type: 'common', collection: 'common', entity: narrativeState.common[nodeId] };
  }
  if (narrativeState.choice[nodeId]) {
    return { type: 'choice', collection: 'choice', entity: narrativeState.choice[nodeId] };
  }
  if (narrativeState.ending[nodeId]) {
    return { type: 'ending', collection: 'ending', entity: narrativeState.ending[nodeId] };
  }
  if (narrativeState.flag[nodeId]) {
    return { type: 'flag', collection: 'flag', entity: narrativeState.flag[nodeId] };
  }
  if (narrativeState.status[nodeId]) {
    return { type: 'status', collection: 'status', entity: narrativeState.status[nodeId] };
  }
  if (narrativeState.path[nodeId]) {
    return { type: 'path', collection: 'path', entity: narrativeState.path[nodeId] };
  }
  if (narrativeState.chapter[nodeId]) {
    return { type: 'chapter', collection: 'chapter', entity: narrativeState.chapter[nodeId] };
  }

  return null;
}

// From InspectorPanel.jsx — TYPE_CONFIG
const TYPE_CONFIG = {
  common:  { label: 'Common Node',   icon: 'Square',     accent: 'common'  },
  choice:  { label: 'Choice',        icon: 'GitBranch',  accent: 'choice'  },
  ending:  { label: 'Ending',        icon: 'Bookmark',   accent: 'ending'  },
  flag:    { label: 'Flag',          icon: 'FlagIcon',   accent: 'flag'    },
  status:  { label: 'Status Point',  icon: 'BarChart2',  accent: 'status'  },
  path:    { label: 'Path',          icon: 'Route',      accent: 'path'    },
  chapter: { label: 'Chapter',       icon: 'BookOpen',   accent: 'chapter' },
};

// Spec §2.1 field ordering per entity type
const SECTION_ORDER = {
  common:  ['Identity', 'Classification', 'Content', 'Prerequisites', 'Side Effects', 'Routing'],
  choice:  ['Identity', 'Classification', 'Prerequisites', 'Options'],
  ending:  ['Identity', 'Classification', 'Prerequisites'],
  flag:    ['Identity', 'Classification'],
  status:  ['Identity', 'Configuration', 'Classification'],
  path:    ['Identity'],
  chapter: ['Identity'],
};

// From ConditionEditor.jsx — guard logic (line 357–359)
function ensureConditionGroup(value) {
  return value && value.operator
    ? value
    : { operator: 'and', conditions: [] };
}

// From ConditionEditor.jsx — ConditionGroup handlers (inline)
function toggleOperator(group) {
  const operator = group?.operator || 'and';
  return {
    ...group,
    operator: operator === 'and' ? 'or' : 'and',
  };
}

function addFlagCondition(group, flags) {
  const operator = group?.operator || 'and';
  const conditions = group?.conditions || [];
  const defaultFlagId = flags.length > 0 ? flags[0].id : '';
  const newCondition = {
    id: `cond_${Date.now()}_test`,
    flag: defaultFlagId,
    state: true,
  };
  return {
    ...group,
    operator,
    conditions: [...conditions, newCondition],
  };
}

function addStatusCondition(group, statusPoints) {
  const operator = group?.operator || 'and';
  const conditions = group?.conditions || [];
  const defaultStatusId = statusPoints.length > 0 ? statusPoints[0].id : '';
  const newCondition = {
    id: `cond_${Date.now()}_test`,
    status: defaultStatusId,
    min: 0,
  };
  return {
    ...group,
    operator,
    conditions: [...conditions, newCondition],
  };
}

function addNestedGroup(group) {
  const conditions = group?.conditions || [];
  const nestedGroup = {
    operator: 'and',
    conditions: [],
  };
  return {
    ...group,
    conditions: [...conditions, nestedGroup],
  };
}

function removeConditionAtIndex(group, index) {
  const conditions = [...(group?.conditions || [])];
  conditions.splice(index, 1);
  return { ...group, conditions };
}

function updateConditionAtIndex(group, index, updatedCond) {
  const conditions = [...(group?.conditions || [])];
  conditions[index] = updatedCond;
  return { ...group, conditions };
}

// Condition type detection (from ConditionGroup render logic)
function getConditionKind(cond) {
  if (cond.operator != null) return 'group';
  if (cond.flag != null) return 'flag';
  if (cond.status != null) return 'status';
  return 'unknown';
}

// From NextEditor.jsx — add entry logic
function createNextEntry(targetOptions) {
  return {
    id: `route_${Date.now()}_test`,
    target: targetOptions.length > 0 ? targetOptions[0].value : '',
    requires: { operator: 'and', conditions: [] },
  };
}

// From NextEditor.jsx — remove entry
function removeNextEntry(value, index) {
  const updated = [...(value || [])];
  updated.splice(index, 1);
  return updated;
}

// From NextEditor.jsx — update target
function updateNextTarget(value, index, target) {
  const updated = [...(value || [])];
  updated[index] = { ...updated[index], target };
  return updated;
}

// From NextEditor.jsx — update requires
function updateNextRequires(value, index, requires) {
  const updated = [...(value || [])];
  updated[index] = { ...updated[index], requires };
  return updated;
}

// From VariantEditor.jsx — add variant logic
function createVariant() {
  return {
    id: `variant_${Date.now()}_test`,
    text: '',
    requires: { operator: 'and', conditions: [] },
  };
}

// From VariantEditor.jsx — remove variant
function removeVariant(value, index) {
  const updated = [...(value || [])];
  updated.splice(index, 1);
  return updated;
}

// From VariantEditor.jsx — update text
function updateVariantText(value, index, text) {
  const updated = [...(value || [])];
  updated[index] = { ...updated[index], text };
  return updated;
}

// From OptionEditor.jsx — add option logic
function createOption() {
  return {
    id: `opt_${Date.now()}_test`,
    label: '',
    requires: { operator: 'and', conditions: [] },
    flags_set: [],
    status_set: [],
    next: [],
  };
}

// From OptionEditor.jsx — remove option
function removeOption(value, index) {
  const updated = [...(value || [])];
  updated.splice(index, 1);
  return updated;
}

// From OptionEditor.jsx — update field
function updateOptionField(value, index, field, newValue) {
  const updated = [...(value || [])];
  updated[index] = { ...updated[index], [field]: newValue };
  return updated;
}

// From FlagSetEditor.jsx — toggle logic
function toggleFlagInSet(flagId, currentSet) {
  const current = currentSet || [];
  if (current.includes(flagId)) {
    return current.filter((id) => id !== flagId);
  } else {
    return [...current, flagId];
  }
}

// From StatusSetEditor.jsx — add logic
function addStatusDelta(statusList, currentValue) {
  if (statusList.length === 0) return currentValue || [];
  const usedIds = (currentValue || []).map((d) => d.status);
  const available = statusList.find((sp) => !usedIds.includes(sp.id));
  const targetId = available ? available.id : statusList[0].id;
  return [...(currentValue || []), { status: targetId, amount: 0 }];
}

// From StatusSetEditor.jsx — remove logic
function removeStatusDelta(value, index) {
  const updated = [...(value || [])];
  updated.splice(index, 1);
  return updated;
}

// From StatusSetEditor.jsx — update logic
function updateStatusDelta(value, index, field, newVal) {
  const updated = [...(value || [])];
  updated[index] = {
    ...updated[index],
    [field]: field === 'amount' ? Number(newVal) || 0 : newVal,
  };
  return updated;
}

// From SelectField.jsx — null sentinel mapping
function selectFieldValue(rawValue) {
  return rawValue ?? '__null__';
}

function selectFieldOnChange(selectedValue) {
  return selectedValue === '__null__' ? null : selectedValue;
}

// From TextField.jsx — null-safe value
function textFieldValue(value) {
  return value ?? '';
}

// From TextField.jsx — ID generation
function textFieldId(id, label) {
  return id || `field-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'text'}`;
}


// ── Test Fixtures ───────────────────────────────────────────

function makeNarrativeState(overrides = {}) {
  return {
    metadata: overrides.metadata ?? {
      version: '2.0',
      created_at: '2026-04-04',
      updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction', 'cg', 'cutscene'],
      ending_types: ['good_end', 'bad_end', 'true_end', 'neutral'],
    },
    common:  overrides.common  ?? {},
    choice:  overrides.choice  ?? {},
    ending:  overrides.ending  ?? {},
    flag:    overrides.flag    ?? {},
    status:  overrides.status  ?? {},
    path:    overrides.path    ?? {},
    chapter: overrides.chapter ?? {},
  };
}

function makeCommonNode(overrides = {}) {
  return {
    id: overrides.id ?? 'N001',
    name: overrides.name ?? 'start',
    type: overrides.type ?? null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    description: overrides.description ?? '',
    variants: overrides.variants ?? [],
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    flags_set: overrides.flags_set ?? [],
    status_set: overrides.status_set ?? [],
    next: overrides.next ?? [],
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

function makeChoice(overrides = {}) {
  return {
    id: overrides.id ?? 'CH001',
    text: overrides.text ?? '',
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    options: overrides.options ?? [],
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

function makeEnding(overrides = {}) {
  return {
    id: overrides.id ?? 'E001',
    name: overrides.name ?? '',
    type: 'type' in overrides ? overrides.type : null,
    chapter: overrides.chapter ?? null,
    path: overrides.path ?? null,
    requires: overrides.requires ?? { operator: 'and', conditions: [] },
    _position: overrides._position ?? { x: 0, y: 0 },
  };
}

function makeFlag(overrides = {}) {
  return {
    id: overrides.id ?? 'F001',
    name: overrides.name ?? '',
    state: overrides.state ?? false,
    path: overrides.path ?? null,
    chapter: overrides.chapter ?? null,
  };
}

function makeStatusPoint(overrides = {}) {
  return {
    id: overrides.id ?? 'SP001',
    name: overrides.name ?? '',
    value: overrides.value ?? 0,
    minValue: overrides.minValue ?? null,
    maxValue: overrides.maxValue ?? null,
    path: overrides.path ?? null,
    chapter: overrides.chapter ?? null,
  };
}

function makePath(overrides = {}) {
  return {
    id: overrides.id ?? 'P001',
    name: overrides.name ?? '',
  };
}

function makeChapter(overrides = {}) {
  return {
    id: overrides.id ?? 'C001',
    name: overrides.name ?? '',
  };
}


// ════════════════════════════════════════════════════════════
//  SECTION A — resolveEntity: entity type detection
// ════════════════════════════════════════════════════════════

group('A — resolveEntity — entity type detection from narrative state');

(() => {
  const node = makeCommonNode({ id: 'N001', name: 'start' });
  const ch = makeChoice({ id: 'CH001' });
  const end = makeEnding({ id: 'E001' });
  const fl = makeFlag({ id: 'F001' });
  const sp = makeStatusPoint({ id: 'SP001' });
  const pt = makePath({ id: 'P001' });
  const cp = makeChapter({ id: 'C001' });

  const state = makeNarrativeState({
    common:  { N001: node },
    choice:  { CH001: ch },
    ending:  { E001: end },
    flag:    { F001: fl },
    status:  { SP001: sp },
    path:    { P001: pt },
    chapter: { C001: cp },
  });

  // Happy path — each entity type resolves correctly
  const r1 = resolveEntity('N001', state);
  assert(r1 !== null, 'resolves common node N001');
  assert(r1.type === 'common', 'N001 → type common');
  assert(r1.collection === 'common', 'N001 → collection common');
  assert(r1.entity.id === 'N001', 'N001 → entity.id matches');

  const r2 = resolveEntity('CH001', state);
  assert(r2 !== null, 'resolves choice CH001');
  assert(r2.type === 'choice', 'CH001 → type choice');
  assert(r2.entity.id === 'CH001', 'CH001 → entity.id matches');

  const r3 = resolveEntity('E001', state);
  assert(r3 !== null, 'resolves ending E001');
  assert(r3.type === 'ending', 'E001 → type ending');

  const r4 = resolveEntity('F001', state);
  assert(r4 !== null, 'resolves flag F001');
  assert(r4.type === 'flag', 'F001 → type flag');

  const r5 = resolveEntity('SP001', state);
  assert(r5 !== null, 'resolves status point SP001');
  assert(r5.type === 'status', 'SP001 → type status');

  const r6 = resolveEntity('P001', state);
  assert(r6 !== null, 'resolves path P001');
  assert(r6.type === 'path', 'P001 → type path');

  const r7 = resolveEntity('C001', state);
  assert(r7 !== null, 'resolves chapter C001');
  assert(r7.type === 'chapter', 'C001 → type chapter');

  // Edge cases — not found
  assert(resolveEntity('MISSING', state) === null, 'non-existent ID → null');
  assert(resolveEntity(null, state) === null, 'null ID → null');
  assert(resolveEntity(undefined, state) === null, 'undefined ID → null');
  assert(resolveEntity('', state) === null, 'empty string ID → null');

  // Resolution order: common first, path and chapter last
  // An entity in common should win over same ID in path (impossible in practice due to prefix collision)
  const ambiguousState = makeNarrativeState({
    common: { X001: makeCommonNode({ id: 'X001' }) },
    path: { X001: makePath({ id: 'X001' }) },
  });
  const rA = resolveEntity('X001', ambiguousState);
  assert(rA.type === 'common', 'ambiguous ID resolves to common (detected first)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION B — TYPE_CONFIG integrity
// ════════════════════════════════════════════════════════════

group('B — TYPE_CONFIG — label, icon, accent mapping');

(() => {
  const expectedTypes = ['common', 'choice', 'ending', 'flag', 'status', 'path', 'chapter'];

  for (const type of expectedTypes) {
    const config = TYPE_CONFIG[type];
    assert(config !== undefined, `TYPE_CONFIG has entry for "${type}"`);
    assert(typeof config.label === 'string' && config.label.length > 0, `${type} has non-empty label`);
    assert(typeof config.icon === 'string' && config.icon.length > 0, `${type} has non-empty icon name`);
    assert(config.accent === type, `${type} accent matches type key for CSS class`);
  }

  // No extra entries
  const keys = Object.keys(TYPE_CONFIG);
  assert(keys.length === 7, `TYPE_CONFIG has exactly 7 entries (got ${keys.length})`);

  // Specific label checks
  assert(TYPE_CONFIG.common.label === 'Common Node', 'common label is "Common Node"');
  assert(TYPE_CONFIG.choice.label === 'Choice', 'choice label is "Choice"');
  assert(TYPE_CONFIG.ending.label === 'Ending', 'ending label is "Ending"');
  assert(TYPE_CONFIG.flag.label === 'Flag', 'flag label is "Flag"');
  assert(TYPE_CONFIG.status.label === 'Status Point', 'status label is "Status Point"');
  assert(TYPE_CONFIG.path.label === 'Path', 'path label is "Path"');
  assert(TYPE_CONFIG.chapter.label === 'Chapter', 'chapter label is "Chapter"');
})();


// ════════════════════════════════════════════════════════════
//  SECTION C — Field section ordering per spec §2.1
// ════════════════════════════════════════════════════════════

group('C — Field section ordering per spec §2.1');

(() => {
  // The order from the spec: identity → classification → content → prerequisites → side effects → routing

  // Common Node has all 6 sections
  const commonSections = SECTION_ORDER.common;
  assert(commonSections[0] === 'Identity', 'common: Identity is first');
  assert(commonSections[1] === 'Classification', 'common: Classification is second');
  assert(commonSections[2] === 'Content', 'common: Content is third');
  assert(commonSections[3] === 'Prerequisites', 'common: Prerequisites is fourth');
  assert(commonSections[4] === 'Side Effects', 'common: Side Effects is fifth');
  assert(commonSections[5] === 'Routing', 'common: Routing is sixth/last');
  assert(commonSections.length === 6, 'common: exactly 6 sections');

  // Choice: Identity → Classification → Prerequisites → Options
  const choiceSections = SECTION_ORDER.choice;
  assert(choiceSections[0] === 'Identity', 'choice: Identity is first');
  assert(choiceSections[1] === 'Classification', 'choice: Classification is second');
  assert(choiceSections[2] === 'Prerequisites', 'choice: Prerequisites is third');
  assert(choiceSections[3] === 'Options', 'choice: Options is fourth/last');
  assert(choiceSections.length === 4, 'choice: exactly 4 sections');

  // Ending: Identity → Classification → Prerequisites
  const endingSections = SECTION_ORDER.ending;
  assert(endingSections[0] === 'Identity', 'ending: Identity is first');
  assert(endingSections.length === 3, 'ending: exactly 3 sections');

  // Flag: Identity → Classification
  assert(SECTION_ORDER.flag.length === 2, 'flag: exactly 2 sections');

  // Status Point: Identity → Configuration → Classification
  assert(SECTION_ORDER.status[0] === 'Identity', 'status: Identity is first');
  assert(SECTION_ORDER.status[1] === 'Configuration', 'status: Configuration is second');
  assert(SECTION_ORDER.status[2] === 'Classification', 'status: Classification is third');
  assert(SECTION_ORDER.status.length === 3, 'status: exactly 3 sections');

  // Path and Chapter: Identity only
  assert(SECTION_ORDER.path.length === 1, 'path: exactly 1 section');
  assert(SECTION_ORDER.chapter.length === 1, 'chapter: exactly 1 section');
  assert(SECTION_ORDER.path[0] === 'Identity', 'path: only Identity');
  assert(SECTION_ORDER.chapter[0] === 'Identity', 'chapter: only Identity');
})();


// ════════════════════════════════════════════════════════════
//  SECTION D — ConditionEditor guard (AR-03)
// ════════════════════════════════════════════════════════════

group('D — ConditionEditor — guard for empty/invalid input (AR-03)');

(() => {
  // Valid group passes through
  const valid = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
  const r1 = ensureConditionGroup(valid);
  assert(r1 === valid, 'valid condition group passes through unchanged');
  assert(r1.operator === 'and', 'valid group operator preserved');
  assert(r1.conditions.length === 1, 'valid group conditions preserved');

  // OR operator passes through
  const orGroup = { operator: 'or', conditions: [] };
  assert(ensureConditionGroup(orGroup) === orGroup, 'OR group passes through');

  // null → default empty AND group
  const r2 = ensureConditionGroup(null);
  assert(r2.operator === 'and', 'null → default AND operator');
  assert(Array.isArray(r2.conditions), 'null → conditions is array');
  assert(r2.conditions.length === 0, 'null → empty conditions');

  // undefined → default empty AND group
  const r3 = ensureConditionGroup(undefined);
  assert(r3.operator === 'and', 'undefined → default AND operator');
  assert(r3.conditions.length === 0, 'undefined → empty conditions');

  // Object without operator → default
  const r4 = ensureConditionGroup({ conditions: [] });
  assert(r4.operator === 'and', 'object without operator → default AND');

  // Empty object → default
  const r5 = ensureConditionGroup({});
  assert(r5.operator === 'and', 'empty object → default AND');

  // False-y values → default
  assert(ensureConditionGroup(0).operator === 'and', '0 → default');
  assert(ensureConditionGroup('').operator === 'and', 'empty string → default');
  assert(ensureConditionGroup(false).operator === 'and', 'false → default');
})();


// ════════════════════════════════════════════════════════════
//  SECTION E — ConditionEditor: add flag condition
// ════════════════════════════════════════════════════════════

group('E — ConditionEditor — add flag condition logic');

(() => {
  const flags = [
    { id: 'F001', name: 'has_key' },
    { id: 'F002', name: 'met_queen' },
  ];
  const emptyGroup = { operator: 'and', conditions: [] };

  // Add a flag condition to empty group
  const r1 = addFlagCondition(emptyGroup, flags);
  assert(r1.conditions.length === 1, 'adding to empty group → 1 condition');
  assert(r1.conditions[0].flag === 'F001', 'defaults to first flag ID');
  assert(r1.conditions[0].state === true, 'defaults state to true');
  assert(typeof r1.conditions[0].id === 'string', 'condition has a string ID');
  assert(r1.operator === 'and', 'preserves operator');

  // Add second condition
  const r2 = addFlagCondition(r1, flags);
  assert(r2.conditions.length === 2, 'second add → 2 conditions');

  // With no flags → defaults to empty string
  const r3 = addFlagCondition(emptyGroup, []);
  assert(r3.conditions[0].flag === '', 'no flags → flag="" empty string');

  // Does not mutate original
  assert(emptyGroup.conditions.length === 0, 'original group not mutated');
})();


// ════════════════════════════════════════════════════════════
//  SECTION F — ConditionEditor: add status condition
// ════════════════════════════════════════════════════════════

group('F — ConditionEditor — add status condition logic');

(() => {
  const statusPoints = [
    { id: 'SP001', name: 'strength' },
    { id: 'SP002', name: 'agility' },
  ];
  const emptyGroup = { operator: 'or', conditions: [] };

  const r1 = addStatusCondition(emptyGroup, statusPoints);
  assert(r1.conditions.length === 1, 'adding to empty group → 1 condition');
  assert(r1.conditions[0].status === 'SP001', 'defaults to first status ID');
  assert(r1.conditions[0].min === 0, 'defaults min to 0');
  assert(r1.conditions[0].max === undefined, 'max is not set (optional per spec)');
  assert(typeof r1.conditions[0].id === 'string', 'condition has a string ID');
  assert(r1.operator === 'or', 'preserves OR operator');

  // With no status points → defaults to empty string
  const r2 = addStatusCondition(emptyGroup, []);
  assert(r2.conditions[0].status === '', 'no status points → status="" empty string');
})();


// ════════════════════════════════════════════════════════════
//  SECTION G — ConditionEditor: add nested group
// ════════════════════════════════════════════════════════════

group('G — ConditionEditor — add nested group logic');

(() => {
  const baseGroup = { operator: 'and', conditions: [] };

  const r1 = addNestedGroup(baseGroup);
  assert(r1.conditions.length === 1, 'one nested group added');
  assert(r1.conditions[0].operator === 'and', 'nested group defaults to AND');
  assert(Array.isArray(r1.conditions[0].conditions), 'nested group has conditions array');
  assert(r1.conditions[0].conditions.length === 0, 'nested group starts empty');

  // Detect nested group kind
  assert(getConditionKind(r1.conditions[0]) === 'group', 'nested group kind is "group"');

  // Multiple nesting
  const r2 = addNestedGroup(r1);
  assert(r2.conditions.length === 2, 'second nested group → 2 total');

  // Deep nesting (group inside group)
  const innerGroup = r1.conditions[0];
  const deep = addFlagCondition(innerGroup, [{ id: 'F001', name: 'key' }]);
  assert(deep.conditions.length === 1, 'inner group gets flag condition');
  assert(deep.conditions[0].flag === 'F001', 'inner condition references correct flag');
})();


// ════════════════════════════════════════════════════════════
//  SECTION H — ConditionEditor: remove condition by index
// ════════════════════════════════════════════════════════════

group('H — ConditionEditor — remove condition by index');

(() => {
  const group = {
    operator: 'and',
    conditions: [
      { id: 'c1', flag: 'F001', state: true },
      { id: 'c2', status: 'SP001', min: 0 },
      { operator: 'or', conditions: [] },
    ],
  };

  // Remove middle condition
  const r1 = removeConditionAtIndex(group, 1);
  assert(r1.conditions.length === 2, 'removing index 1 → 2 remaining');
  assert(r1.conditions[0].id === 'c1', 'first condition still at index 0');
  assert(r1.conditions[1].operator === 'or', 'nested group shifted to index 1');

  // Remove first condition
  const r2 = removeConditionAtIndex(group, 0);
  assert(r2.conditions.length === 2, 'removing index 0 → 2 remaining');
  assert(r2.conditions[0].id === 'c2', 'status condition is now first');

  // Remove last condition
  const r3 = removeConditionAtIndex(group, 2);
  assert(r3.conditions.length === 2, 'removing last → 2 remaining');

  // Original not mutated
  assert(group.conditions.length === 3, 'original group not mutated');

  // Remove from single-item group → empty conditions
  const singleGroup = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
  const r4 = removeConditionAtIndex(singleGroup, 0);
  assert(r4.conditions.length === 0, 'removing only condition → empty array');
  assert(r4.operator === 'and', 'operator preserved after removing all conditions');
})();


// ════════════════════════════════════════════════════════════
//  SECTION I — ConditionEditor: toggle operator
// ════════════════════════════════════════════════════════════

group('I — ConditionEditor — toggle operator (AND ↔ OR)');

(() => {
  const andGroup = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
  const r1 = toggleOperator(andGroup);
  assert(r1.operator === 'or', 'AND → OR');
  assert(r1.conditions.length === 1, 'conditions preserved');

  const r2 = toggleOperator(r1);
  assert(r2.operator === 'and', 'OR → AND');

  // Null/undefined group defaults to AND, toggles to OR
  const r3 = toggleOperator(null);
  assert(r3.operator === 'or', 'null group → toggles from default AND to OR');

  const r4 = toggleOperator(undefined);
  assert(r4.operator === 'or', 'undefined group → toggles from default AND to OR');
})();


// ════════════════════════════════════════════════════════════
//  SECTION J — NextEditor: add/remove/update entry logic
// ════════════════════════════════════════════════════════════

group('J — NextEditor — add/remove/update entries');

(() => {
  const targetOptions = [
    { value: 'N002', label: '[N] town_square' },
    { value: 'CH001', label: '[CH] decision' },
  ];

  // Add entry
  const entry = createNextEntry(targetOptions);
  assert(typeof entry.id === 'string', 'new entry has string ID');
  assert(entry.target === 'N002', 'defaults target to first option');
  assert(entry.requires.operator === 'and', 'defaults requires to AND (AR-03)');
  assert(entry.requires.conditions.length === 0, 'defaults requires.conditions to [] (AR-03)');

  // Add entry with no target options
  const emptyEntry = createNextEntry([]);
  assert(emptyEntry.target === '', 'no options → target=""');

  // Build an array and add to it
  const arr = [entry];
  const added = [...arr, createNextEntry(targetOptions)];
  assert(added.length === 2, 'array grows to 2 entries');

  // Remove entry
  const removed = removeNextEntry(added, 0);
  assert(removed.length === 1, 'remove index 0 → 1 remaining');

  // Remove from null value → []
  const removedNull = removeNextEntry(null, 0);
  assert(removedNull.length === 0, 'remove from null → empty array');

  // Update target
  const updated = updateNextTarget([entry], 0, 'E001');
  assert(updated[0].target === 'E001', 'target updated to E001');
  assert(updated[0].id === entry.id, 'entry ID preserved');
  assert(updated[0].requires.operator === 'and', 'requires preserved after target update');

  // Update requires
  const newRequires = { operator: 'or', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
  const updatedReq = updateNextRequires([entry], 0, newRequires);
  assert(updatedReq[0].requires.operator === 'or', 'requires updated to OR');
  assert(updatedReq[0].requires.conditions.length === 1, 'requires has 1 condition');
  assert(updatedReq[0].target === entry.target, 'target preserved after requires update');
})();


// ════════════════════════════════════════════════════════════
//  SECTION K — VariantEditor: add/remove/update logic
// ════════════════════════════════════════════════════════════

group('K — VariantEditor — add/remove/update variants');

(() => {
  // Create a variant
  const variant = createVariant();
  assert(typeof variant.id === 'string', 'variant has string ID');
  assert(variant.text === '', 'variant text defaults to ""');
  assert(variant.requires.operator === 'and', 'variant requires defaults to AND (AR-03)');
  assert(variant.requires.conditions.length === 0, 'variant requires.conditions defaults to []');

  // Add to array
  const arr = [variant];
  const added = [...arr, createVariant()];
  assert(added.length === 2, 'array grows to 2 variants');

  // Remove variant
  const removed = removeVariant(added, 0);
  assert(removed.length === 1, 'remove index 0 → 1 remaining');

  // Update text
  const updated = updateVariantText([variant], 0, 'Alternative scene');
  assert(updated[0].text === 'Alternative scene', 'text updated');
  assert(updated[0].id === variant.id, 'ID preserved');
  assert(updated[0].requires === variant.requires, 'requires preserved');

  // Remove from null
  const removedNull = removeVariant(null, 0);
  assert(removedNull.length === 0, 'remove from null → empty array');
})();


// ════════════════════════════════════════════════════════════
//  SECTION L — OptionEditor: add new option defaults (Plan §4.2)
// ════════════════════════════════════════════════════════════

group('L — OptionEditor — new option defaults match Plan §4.2');

(() => {
  const opt = createOption();

  // Validate all fields per Option spec §4.2
  assert(typeof opt.id === 'string' && opt.id.length > 0, 'option has non-empty string ID');
  assert(opt.label === '', 'option label defaults to ""');
  assert(opt.requires !== undefined, 'option has requires field');
  assert(opt.requires.operator === 'and', 'option requires.operator is "and" (AR-03)');
  assert(Array.isArray(opt.requires.conditions), 'option requires.conditions is array');
  assert(opt.requires.conditions.length === 0, 'option requires.conditions defaults to []');
  assert(Array.isArray(opt.flags_set), 'option flags_set is array (AR-05)');
  assert(opt.flags_set.length === 0, 'option flags_set defaults to []');
  assert(Array.isArray(opt.status_set), 'option status_set is array (AR-05)');
  assert(opt.status_set.length === 0, 'option status_set defaults to []');
  assert(Array.isArray(opt.next), 'option next is array (AR-04)');
  assert(opt.next.length === 0, 'option next defaults to []');

  // Remove option
  const arr = [opt, createOption()];
  const removed = removeOption(arr, 0);
  assert(removed.length === 1, 'remove option → 1 remaining');

  // Update field
  const updated = updateOptionField([opt], 0, 'label', 'Go east');
  assert(updated[0].label === 'Go east', 'label updated');
  assert(updated[0].id === opt.id, 'ID preserved');
  assert(updated[0].requires === opt.requires, 'requires preserved');
  assert(updated[0].flags_set === opt.flags_set, 'flags_set preserved');
})();


// ════════════════════════════════════════════════════════════
//  SECTION M — FlagSetEditor: toggle flag in/out of flags_set[]
// ════════════════════════════════════════════════════════════

group('M — FlagSetEditor — toggle flag logic');

(() => {
  // Toggle flag into empty set
  const r1 = toggleFlagInSet('F001', []);
  assert(r1.length === 1, 'toggle into empty → 1 flag');
  assert(r1[0] === 'F001', 'toggled flag is F001');

  // Toggle same flag out
  const r2 = toggleFlagInSet('F001', ['F001']);
  assert(r2.length === 0, 'toggle from [F001] → empty');
  assert(!r2.includes('F001'), 'F001 removed');

  // Toggle second flag in
  const r3 = toggleFlagInSet('F002', ['F001']);
  assert(r3.length === 2, 'toggle F002 into [F001] → 2 flags');
  assert(r3.includes('F001'), 'F001 still present');
  assert(r3.includes('F002'), 'F002 added');

  // Toggle from null value
  const r4 = toggleFlagInSet('F001', null);
  assert(r4.length === 1, 'toggle into null → treats as []');

  // Toggle from undefined value
  const r5 = toggleFlagInSet('F001', undefined);
  assert(r5.length === 1, 'toggle into undefined → treats as []');

  // Toggles are idempotent: toggle off, then off again = already empty
  const r6 = toggleFlagInSet('F001', []);
  const r7 = toggleFlagInSet('F001', r6);
  assert(r7.length === 0, 'toggle on then off → back to empty');

  // Does not mutate original
  const original = ['F001', 'F002'];
  toggleFlagInSet('F003', original);
  assert(original.length === 2, 'original array not mutated');
})();


// ════════════════════════════════════════════════════════════
//  SECTION N — StatusSetEditor: add/remove/update delta logic
// ════════════════════════════════════════════════════════════

group('N — StatusSetEditor — add/remove/update delta logic');

(() => {
  const statusList = [
    { id: 'SP001', name: 'strength' },
    { id: 'SP002', name: 'agility' },
    { id: 'SP003', name: 'charisma' },
  ];

  // Add delta to empty
  const r1 = addStatusDelta(statusList, []);
  assert(r1.length === 1, 'add to empty → 1 delta');
  assert(r1[0].status === 'SP001', 'defaults to first available status');
  assert(r1[0].amount === 0, 'defaults amount to 0');

  // Add second delta → picks unused status
  const r2 = addStatusDelta(statusList, r1);
  assert(r2.length === 2, 'add again → 2 deltas');
  assert(r2[1].status === 'SP002', 'skips already-used SP001, picks SP002');

  // Add third delta → picks SP003
  const r3 = addStatusDelta(statusList, r2);
  assert(r3.length === 3, 'add again → 3 deltas');
  assert(r3[2].status === 'SP003', 'picks SP003');

  // When all used → falls back to first status
  const r4 = addStatusDelta(statusList, r3);
  assert(r4.length === 4, 'add when all used → 4 deltas');
  assert(r4[3].status === 'SP001', 'falls back to first status when all used');

  // Add with empty status list → no-op
  const r5 = addStatusDelta([], []);
  assert(r5.length === 0, 'no status points → no-op (stays empty)');

  // Add with null value
  const r6 = addStatusDelta(statusList, null);
  assert(r6.length === 1, 'null value → treats as [] and adds');

  // Remove delta
  const removed = removeStatusDelta(r1, 0);
  assert(removed.length === 0, 'remove index 0 → empty');

  // Update status field
  const updated = updateStatusDelta(r1, 0, 'status', 'SP003');
  assert(updated[0].status === 'SP003', 'status updated to SP003');
  assert(updated[0].amount === 0, 'amount preserved');

  // Update amount field — converts to number
  const updated2 = updateStatusDelta(r1, 0, 'amount', '5');
  assert(updated2[0].amount === 5, 'amount "5" → 5 (number)');

  // Update amount with non-numeric → 0
  const updated3 = updateStatusDelta(r1, 0, 'amount', 'abc');
  assert(updated3[0].amount === 0, 'amount "abc" → 0 (NaN fallback)');

  // Update amount with negative
  const updated4 = updateStatusDelta(r1, 0, 'amount', '-10');
  assert(updated4[0].amount === -10, 'amount "-10" → -10 (negative works)');
})();


// ════════════════════════════════════════════════════════════
//  SECTION O — SelectField: null sentinel mapping (__null__)
// ════════════════════════════════════════════════════════════

group('O — SelectField — null sentinel value (__null__) mapping');

(() => {
  // Value display: null → __null__ sentinel
  assert(selectFieldValue(null) === '__null__', 'null → __null__ sentinel for select');
  assert(selectFieldValue(undefined) === '__null__', 'undefined → __null__');
  assert(selectFieldValue('P001') === 'P001', 'P001 passes through');
  assert(selectFieldValue('') === '', 'empty string passes through (not null)');

  // onChange: __null__ sentinel → null
  assert(selectFieldOnChange('__null__') === null, '__null__ → null');
  assert(selectFieldOnChange('P001') === 'P001', 'P001 passes through');
  assert(selectFieldOnChange('') === '', 'empty string passes through');
  assert(selectFieldOnChange('C001') === 'C001', 'C001 passes through');
})();


// ════════════════════════════════════════════════════════════
//  SECTION P — TextField: null-safe value and ID generation
// ════════════════════════════════════════════════════════════

group('P — TextField — null-safe value rendering and ID generation');

(() => {
  // Null-safe value
  assert(textFieldValue(null) === '', 'null → ""');
  assert(textFieldValue(undefined) === '', 'undefined → ""');
  assert(textFieldValue('hello') === 'hello', '"hello" passes through');
  assert(textFieldValue('') === '', 'empty string passes through');
  assert(textFieldValue(0) === 0, '0 passes through (not null/undefined)');

  // ID generation
  assert(textFieldId('my-id', 'Name') === 'my-id', 'custom ID takes priority');
  assert(textFieldId(undefined, 'Name') === 'field-name', 'no ID → generates from label');
  assert(textFieldId(null, 'Name') === 'field-name', 'null ID → generates from label');
  assert(textFieldId(undefined, 'My Field') === 'field-my-field', 'spaces replaced with hyphens');
  assert(textFieldId(undefined, 'Description') === 'field-description', 'single word lowercased');
  assert(textFieldId(undefined, null) === 'field-text', 'null label → fallback "text"');
  assert(textFieldId(undefined, undefined) === 'field-text', 'undefined label → fallback "text"');
  assert(textFieldId('', 'Name') === 'field-name', 'empty string ID is falsy → generates from label');
})();


// ════════════════════════════════════════════════════════════
//  SECTION Q — Data integrity: entity defaults vs Plan §4
// ════════════════════════════════════════════════════════════

group('Q — Data integrity: entity defaults match Plan §4 data model');

(() => {
  // ── Common Node (§4.1) ─────────────────────────────────
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
  assert(Array.isArray(node.requires.conditions), 'common node requires.conditions is array');
  assert(node.requires.conditions.length === 0, 'common node requires.conditions defaults to []');
  assert(Array.isArray(node.flags_set), 'common node flags_set is array (AR-05)');
  assert(node.flags_set.length === 0, 'common node flags_set defaults to []');
  assert(Array.isArray(node.status_set), 'common node status_set is array (AR-05)');
  assert(node.status_set.length === 0, 'common node status_set defaults to []');
  assert(Array.isArray(node.next), 'common node next is array (AR-04)');
  assert(node.next.length === 0, 'common node next defaults to []');
  assert(typeof node._position === 'object', 'common node _position is object');
  assert(typeof node._position.x === 'number', '_position.x is number');
  assert(typeof node._position.y === 'number', '_position.y is number');

  // ── Choice (§4.1) ──────────────────────────────────────
  const ch = makeChoice({});
  assert(typeof ch.id === 'string', 'choice id is string');
  assert(typeof ch.text === 'string', 'choice text is string');
  assert(ch.text === '', 'choice text defaults to ""');
  assert(ch.chapter === null, 'choice chapter defaults to null');
  assert(ch.path === null, 'choice path defaults to null');
  assert(ch.requires.operator === 'and', 'choice requires.operator is "and" (AR-03)');
  assert(Array.isArray(ch.options), 'choice options is array (AR-05)');
  assert(ch.options.length === 0, 'choice options defaults to []');
  assert(typeof ch._position === 'object', 'choice _position is object');

  // ── Ending (§4.1) ──────────────────────────────────────
  const ending = makeEnding({});
  assert(typeof ending.id === 'string', 'ending id is string');
  assert(typeof ending.name === 'string', 'ending name is string ');
  assert(ending.name === '', 'ending name defaults to ""');
  assert(ending.type === null, 'ending type defaults to null');
  assert(ending.chapter === null, 'ending chapter defaults to null');
  assert(ending.path === null, 'ending path defaults to null');
  assert(ending.requires.operator === 'and', 'ending requires.operator is "and" (AR-03)');
  assert(typeof ending._position === 'object', 'ending _position is object');

  // ── Flag (§4.1) ────────────────────────────────────────
  const flag = makeFlag({});
  assert(typeof flag.id === 'string', 'flag id is string');
  assert(typeof flag.name === 'string', 'flag name is string');
  assert(flag.name === '', 'flag name defaults to ""');
  assert(flag.state === false, 'flag state defaults to false');
  assert(flag.path === null, 'flag path defaults to null');
  assert(flag.chapter === null, 'flag chapter defaults to null');

  // ── Status Point (§4.1) ────────────────────────────────
  const sp = makeStatusPoint({});
  assert(typeof sp.id === 'string', 'status point id is string');
  assert(typeof sp.name === 'string', 'status point name is string');
  assert(sp.name === '', 'status point name defaults to ""');
  assert(sp.value === 0, 'status point value defaults to 0');
  assert(sp.minValue === null, 'status point minValue defaults to null');
  assert(sp.maxValue === null, 'status point maxValue defaults to null');
  assert(sp.path === null, 'status point path defaults to null');
  assert(sp.chapter === null, 'status point chapter defaults to null');

  // ── Path (§4.1) ────────────────────────────────────────
  const path = makePath({});
  assert(typeof path.id === 'string', 'path id is string');
  assert(typeof path.name === 'string', 'path name is string');
  assert(path.name === '', 'path name defaults to ""');

  // ── Chapter (§4.1) ─────────────────────────────────────
  const chapter = makeChapter({});
  assert(typeof chapter.id === 'string', 'chapter id is string');
  assert(typeof chapter.name === 'string', 'chapter name is string');
  assert(chapter.name === '', 'chapter name defaults to ""');

  // ── Sub-elements (§4.2) ────────────────────────────────
  // NextEntry
  const nextEntry = createNextEntry([{ value: 'N002', label: 'N002' }]);
  assert(typeof nextEntry.id === 'string', 'NextEntry id is string');
  assert(typeof nextEntry.target === 'string', 'NextEntry target is string');
  assert(nextEntry.requires.operator === 'and', 'NextEntry requires has AND operator');
  assert(Array.isArray(nextEntry.requires.conditions), 'NextEntry requires.conditions is array');

  // Variant
  const variant = createVariant();
  assert(typeof variant.id === 'string', 'Variant id is string');
  assert(variant.text === '', 'Variant text defaults to ""');
  assert(variant.requires.operator === 'and', 'Variant requires has AND operator');

  // Option
  const option = createOption();
  assert(typeof option.id === 'string', 'Option id is string');
  assert(option.label === '', 'Option label defaults to ""');
  assert(option.requires.operator === 'and', 'Option requires has AND operator');
  assert(Array.isArray(option.flags_set), 'Option flags_set is array');
  assert(Array.isArray(option.status_set), 'Option status_set is array');
  assert(Array.isArray(option.next), 'Option next is array');
})();


// ════════════════════════════════════════════════════════════
//  SECTION R — Failure / edge cases
// ════════════════════════════════════════════════════════════

group('R — Failure and edge cases');

(() => {
  // ── resolveEntity with empty state ─────────────────────
  const emptyState = makeNarrativeState({});
  assert(resolveEntity('N001', emptyState) === null, 'resolveEntity on empty state → null');
  assert(resolveEntity('X', emptyState) === null, 'resolveEntity arbitrary ID on empty state → null');

  // ── resolveEntity never throws ─────────────────────────
  let threw = false;
  try {
    resolveEntity(null, emptyState);
    resolveEntity(undefined, emptyState);
    resolveEntity('', emptyState);
    resolveEntity(123, emptyState);
    resolveEntity(true, emptyState);
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'resolveEntity never throws on garbage input');

  // ── Condition operations on empty/null groups ──────────
  threw = false;
  try {
    const r1 = addFlagCondition(null, []);
    assert(r1.conditions.length === 1, 'add flag to null group → 1 condition');

    const r2 = addStatusCondition(undefined, []);
    assert(r2.conditions.length === 1, 'add status to undefined group → 1 condition');

    const r3 = addNestedGroup(null);
    assert(r3.conditions.length === 1, 'add nested to null group → 1 group');

    const r4 = removeConditionAtIndex(null, 0);
    assert(r4.conditions.length === 0, 'remove from null group → empty');

    const r5 = toggleOperator(null);
    assert(r5.operator === 'or', 'toggle null group → or');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'condition operations never throw on null/undefined groups');

  // ── NextEditor with null/undefined values ──────────────
  threw = false;
  try {
    const r1 = removeNextEntry(null, 0);
    assert(r1.length === 0, 'removeNextEntry(null) → []');

    const r2 = removeNextEntry(undefined, 0);
    assert(r2.length === 0, 'removeNextEntry(undefined) → []');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'NextEditor operations never throw on null/undefined');

  // ── VariantEditor with null/undefined values ───────────
  threw = false;
  try {
    const r1 = removeVariant(null, 0);
    assert(r1.length === 0, 'removeVariant(null) → []');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'VariantEditor operations never throw on null/undefined');

  // ── OptionEditor with null/undefined values ────────────
  threw = false;
  try {
    const r1 = removeOption(null, 0);
    assert(r1.length === 0, 'removeOption(null) → []');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'OptionEditor operations never throw on null/undefined');

  // ── StatusSetEditor with null value ────────────────────
  threw = false;
  try {
    const r1 = removeStatusDelta(null, 0);
    assert(r1.length === 0, 'removeStatusDelta(null) → []');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'StatusSetEditor operations never throw on null');

  // ── SelectField handles edge-case values ───────────────
  assert(selectFieldOnChange(null) === null, 'selectFieldOnChange(null) → null');
  assert(selectFieldOnChange(undefined) === undefined, 'selectFieldOnChange(undefined) → undefined');

  // ── Condition kind detection for unknown shape ─────────
  assert(getConditionKind({}) === 'unknown', 'empty object → unknown condition kind');
  assert(getConditionKind({ id: 'c1' }) === 'unknown', 'object with only id → unknown');
  assert(getConditionKind({ id: 'c1', flag: 'F001', state: true }) === 'flag', 'flag condition detected');
  assert(getConditionKind({ id: 'c1', status: 'SP001', min: 0 }) === 'status', 'status condition detected');
  assert(getConditionKind({ operator: 'and', conditions: [] }) === 'group', 'group detected');

  // ── updateConditionAtIndex preserves other conditions ──
  const group = {
    operator: 'and',
    conditions: [
      { id: 'c1', flag: 'F001', state: true },
      { id: 'c2', flag: 'F002', state: false },
    ],
  };
  const updated = updateConditionAtIndex(group, 0, { id: 'c1', flag: 'F001', state: false });
  assert(updated.conditions[0].state === false, 'updated condition at index 0');
  assert(updated.conditions[1].id === 'c2', 'condition at index 1 unchanged');
  assert(updated.conditions.length === 2, 'total conditions unchanged');

  // ── TextField empty string ID ──────────────────────────
  // Empty string is falsy, so it generates from label
  assert(textFieldId('', 'Description') === 'field-description', 'empty string ID is falsy → generates from label');
})();


// ════════════════════════════════════════════════════════════
//  SUMMARY
// ════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));
if (failed > 0) {
  console.log('  ⚠ Some tests FAILED — review output above.');
  process.exit(1);
} else {
  console.log('  ✅ All tests passed.');
}
