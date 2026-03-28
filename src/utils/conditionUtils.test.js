import { normalizeRequires, isConditionGroup, isLeafCondition, isFallbackGroup, hasConditions, flattenConditions, evaluateGroup, filterConditions, conditionsSummary } from './conditionUtils.js';

let passed = 0, failed = 0;
function assert(condition, message) {
  if (condition) { passed++; return; }
  failed++;
  console.error(`FAIL: ${message}`);
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; return; }
  failed++;
  console.error(`FAIL: ${message}`);
  console.error(`  Expected: ${JSON.stringify(expected)}`);
  console.error(`  Actual:   ${JSON.stringify(actual)}`);
}

// normalizeRequires
assertEqual(normalizeRequires(null), { operator: 'and', conditions: [] }, 'null → empty group');
assertEqual(normalizeRequires(undefined), { operator: 'and', conditions: [] }, 'undefined → empty group');
assertEqual(normalizeRequires([]), { operator: 'and', conditions: [] }, 'empty array → empty group');
assertEqual(normalizeRequires([{ flag: 'has_key', state: true }]), { operator: 'and', conditions: [{ flag: 'has_key', state: true }] }, 'flat array wrapped');
assertEqual(normalizeRequires({ operator: 'or', conditions: [] }), { operator: 'or', conditions: [] }, 'group returned as-is');
assertEqual(normalizeRequires('string'), { operator: 'and', conditions: [] }, 'invalid string → empty group');

// isConditionGroup
assert(isConditionGroup({ operator: 'and', conditions: [] }) === true, 'valid AND group');
assert(isConditionGroup({ operator: 'or', conditions: [] }) === true, 'valid OR group');
assert(isConditionGroup({ flag: 'a', state: true }) === false, 'flag leaf is not group');
assert(isConditionGroup({ status: 'x', min: 5 }) === false, 'status leaf is not group');
assert(isConditionGroup([]) === false, 'array is not group');
assert(isConditionGroup(null) === false, 'null is not group');

// isLeafCondition
assert(isLeafCondition({ flag: 'a', state: true }) === true, 'flag is leaf');
assert(isLeafCondition({ status: 'x', min: 0 }) === true, 'status is leaf');
assert(isLeafCondition({ operator: 'and', conditions: [] }) === false, 'group is not leaf');

// isFallbackGroup
assert(isFallbackGroup({ operator: 'and', conditions: [] }) === true, 'empty AND is fallback');
assert(isFallbackGroup({ operator: 'and', conditions: [{ flag: 'a', state: true }] }) === false, 'AND with leaf is not fallback');
assert(isFallbackGroup({ operator: 'or', conditions: [] }) === false, 'empty OR is not fallback');
assert(isFallbackGroup([]) === true, 'legacy empty array is fallback');

// hasConditions
assert(hasConditions({ operator: 'and', conditions: [] }) === false, 'empty has no conditions');
assert(hasConditions({ operator: 'and', conditions: [{ flag: 'a', state: true }] }) === true, 'AND with leaf has conditions');
assert(hasConditions({ operator: 'or', conditions: [{ operator: 'and', conditions: [] }] }) === false, 'OR with empty AND has no conditions');
assert(hasConditions({ operator: 'or', conditions: [{ operator: 'and', conditions: [{ flag: 'a', state: true }] }] }) === true, 'OR with non-empty AND has conditions');

// flattenConditions
assertEqual(flattenConditions({ operator: 'and', conditions: [] }), [], 'flatten empty');
assertEqual(flattenConditions([{ flag: 'a', state: true }]), [{ flag: 'a', state: true }], 'flatten legacy array');
const nested = { operator: 'or', conditions: [{ operator: 'and', conditions: [{ flag: 'a', state: true }] }, { status: 'x', min: 5 }] };
const flat = flattenConditions(nested);
assert(flat.length === 2, 'flatten nested → 2 items');
assert(flat.some(r => r.flag === 'a' && r.state === true), 'flatten includes flag leaf');
assert(flat.some(r => r.status === 'x'), 'flatten includes status leaf');

// evaluateGroup
const state = { flags: { has_key: true, has_sword: false }, status: { strength: 10 } };
assert(evaluateGroup({ operator: 'and', conditions: [] }, state) === true, 'empty AND passes');
assert(evaluateGroup({ operator: 'or', conditions: [] }, state) === true, 'empty OR passes');
assert(evaluateGroup([{ flag: 'has_key', state: true }], state) === true, 'legacy flat array evaluates');
assert(evaluateGroup([{ flag: 'has_key', state: true }, { flag: 'has_sword', state: false }], state) === true, 'AND of matching conditions passes');
assert(evaluateGroup([{ flag: 'has_sword', state: true }], state) === false, 'AND of non-matching fails');
assert(evaluateGroup({ operator: 'or', conditions: [{ flag: 'has_sword', state: true }, { flag: 'has_key', state: true }] }, state) === true, 'OR with one match passes');
assert(evaluateGroup({ operator: 'or', conditions: [{ flag: 'has_sword', state: true }] }, state) === false, 'OR with no matches fails');
assert(evaluateGroup([{ status: 'strength', min: 5 }], state) === true, 'status min satisfied');
assert(evaluateGroup([{ status: 'strength', min: 15 }], state) === false, 'status min unsatisfied');
assert(evaluateGroup([{ status: 'strength', max: 15 }], state) === true, 'status max satisfied');
assert(evaluateGroup([{ status: 'strength', max: 5 }], state) === false, 'status max unsatisfied');

// filterConditions — predicate returns true to REMOVE the item
const filterGroup = { operator: 'and', conditions: [{ flag: 'a', state: true }, { flag: 'b', state: true }] };
assertEqual(flattenConditions(filterConditions(filterGroup, r => r.flag === 'a')).length, 1, 'filter removes matching flag (predicate=true)');
assertEqual(flattenConditions(filterConditions(filterGroup, r => r.flag === 'b')).length, 1, 'filter keeps non-matching (predicate=false)');
assertEqual(flattenConditions(filterConditions(filterGroup, r => true)).length, 0, 'filter removes all when predicate always true');
const nestedFilter = { operator: 'and', conditions: [{ flag: 'a', state: true }, { operator: 'or', conditions: [] }] };
assertEqual(filterConditions(nestedFilter, r => true).conditions.length, 0, 'filter prunes empty sub-groups');
assertEqual(filterConditions([{ flag: 'a', state: true }], r => r.flag === 'a').conditions.length, 0, 'filter legacy array removes matching');

// conditionsSummary
assertEqual(conditionsSummary({ operator: 'and', conditions: [] }), '', 'empty summary = empty string');
assertEqual(conditionsSummary({ operator: 'and', conditions: [{ flag: 'has_key', state: true }] }), 'has_key=true', 'single flag summary');
assertEqual(conditionsSummary({ operator: 'and', conditions: [{ status: 'rep', min: 5 }] }), 'rep ≥5', 'single status summary');
assertEqual(conditionsSummary({ operator: 'and', conditions: [{ flag: 'a', state: true }, { flag: 'b', state: false }] }), 'a=true · b=false', 'AND uses dot separator');
assertEqual(conditionsSummary({ operator: 'or', conditions: [{ flag: 'a', state: true }, { flag: 'b', state: true }] }), 'a=true ∨ b=true', 'OR uses OR separator');
const nestedSummary = { operator: 'or', conditions: [{ operator: 'and', conditions: [{ flag: 'a', state: true }, { flag: 'b', state: true }] }, { flag: 'c', state: true }] };
assertEqual(conditionsSummary(nestedSummary), 'a=true · b=true ∨ c=true', 'nested group summary');
assertEqual(conditionsSummary([{ flag: 'x', state: true }]), 'x=true', 'legacy flat array summary');
const longGroup = { operator: 'and', conditions: [{ flag: 'a', state: true }, { flag: 'b', state: true }, { flag: 'c', state: true }] };
assertEqual(conditionsSummary(longGroup, 2), 'a=true · b=true · +1', 'maxItems works');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
