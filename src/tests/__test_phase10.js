// ============================================================
// __test_phase10.js — Phase 10: Simulation Engine Tests
// ============================================================
// Tests for:
//   1. simulationEngine.recalculate()
//   2. reachability.findUnreachableNodes()
//   3. conditionEval.evaluateCondition() (used by engine)
//
// Run: import this file from the browser console or via a
//      <script type="module"> tag pointing at this file.
//
// Approach: manual browser testing per project conventions.
// ============================================================

import { recalculate } from '../engine/simulationEngine.js';
import { findUnreachableNodes } from '../engine/reachability.js';
import { evaluateCondition } from '../utils/conditionEval.js';

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

// ── Fixtures ────────────────────────────────────────────────

/** Minimal valid narrative data — one entry node, no edges */
function minimalNarrative() {
  return {
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
        id: 'N001', name: 'start', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [], next: [],
        _position: { x: 0, y: 0 },
      },
    },
    choice: {},
    ending: {},
  };
}

/** Linear chain: N001 → N002 → E001 */
function linearChainNarrative() {
  return {
    metadata: {
      version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction'], ending_types: ['good_end'],
    },
    path: {}, chapter: {},
    flag: {
      F001: { id: 'F001', name: 'key_found', state: false, path: null, chapter: null },
    },
    status: {
      SP001: { id: 'SP001', name: 'health', value: 10, minValue: 0, maxValue: 100, path: null, chapter: null },
    },
    common: {
      N001: {
        id: 'N001', name: 'start', type: 'interaction', chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: ['F001'], status_set: [],
        next: [
          { id: 'route_001', target: 'N002', requires: { operator: 'and', conditions: [] } },
        ],
        _position: { x: 0, y: 0 },
      },
      N002: {
        id: 'N002', name: 'middle', type: 'interaction', chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [],
        next: [
          { id: 'route_002', target: 'E001', requires: { operator: 'and', conditions: [] } },
        ],
        _position: { x: 0, y: 100 },
      },
    },
    choice: {},
    ending: {
      E001: {
        id: 'E001', name: 'good_ending', type: 'good_end', chapter: null, path: null,
        requires: { operator: 'and', conditions: [] },
        _position: { x: 0, y: 200 },
      },
    },
  };
}

/** Branching with conditions: N001 → N002 (requires F001=true) or N001 → N003 (unconditional) */
function branchingWithConditionsNarrative() {
  return {
    metadata: {
      version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction'], ending_types: ['good_end', 'bad_end'],
    },
    path: {}, chapter: {},
    flag: {
      F001: { id: 'F001', name: 'key_found', state: false, path: null, chapter: null },
    },
    status: {
      SP001: { id: 'SP001', name: 'health', value: 10, minValue: 0, maxValue: 100, path: null, chapter: null },
    },
    common: {
      N001: {
        id: 'N001', name: 'start', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [],
        next: [
          {
            id: 'route_cond',
            target: 'N002',
            requires: {
              operator: 'and',
              conditions: [
                { id: 'c1', flag: 'F001', state: true },
              ],
            },
          },
          {
            id: 'route_free',
            target: 'N003',
            requires: { operator: 'and', conditions: [] },
          },
        ],
        _position: { x: 0, y: 0 },
      },
      N002: {
        id: 'N002', name: 'locked_room', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [], next: [],
        _position: { x: -100, y: 100 },
      },
      N003: {
        id: 'N003', name: 'open_door', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [], next: [],
        _position: { x: 100, y: 100 },
      },
    },
    choice: {},
    ending: {},
  };
}

/** Choice node with options and next entries */
function choiceWithOptionsNarrative() {
  return {
    metadata: {
      version: '2.0', created_at: '2026-04-04', updated_at: '2026-04-04',
      entry_node: 'N001',
      common_node_types: ['interaction'], ending_types: ['good_end', 'bad_end'],
    },
    path: {}, chapter: {},
    flag: {
      F001: { id: 'F001', name: 'brave', state: false, path: null, chapter: null },
    },
    status: {},
    common: {
      N001: {
        id: 'N001', name: 'start', type: null, chapter: null, path: null,
        description: '', variants: [],
        requires: { operator: 'and', conditions: [] },
        flags_set: [], status_set: [],
        next: [
          { id: 'route_to_ch', target: 'CH001', requires: { operator: 'and', conditions: [] } },
        ],
        _position: { x: 0, y: 0 },
      },
    },
    choice: {
      CH001: {
        id: 'CH001', text: 'What do you do?', chapter: null, path: null,
        requires: { operator: 'and', conditions: [] },
        options: [
          {
            id: 'opt_fight',
            label: 'Fight',
            requires: {
              operator: 'and',
              conditions: [{ id: 'c1', flag: 'F001', state: true }],
            },
            flags_set: [], status_set: [],
            next: [
              { id: 'opt_fight_next', target: 'E001', requires: { operator: 'and', conditions: [] } },
            ],
          },
          {
            id: 'opt_flee',
            label: 'Flee',
            requires: { operator: 'and', conditions: [] },
            flags_set: [], status_set: [],
            next: [
              { id: 'opt_flee_next', target: 'E002', requires: { operator: 'and', conditions: [] } },
            ],
          },
        ],
        _position: { x: 0, y: 100 },
      },
    },
    ending: {
      E001: {
        id: 'E001', name: 'victory', type: 'good_end', chapter: null, path: null,
        requires: { operator: 'and', conditions: [] },
        _position: { x: -100, y: 200 },
      },
      E002: {
        id: 'E002', name: 'defeat', type: 'bad_end', chapter: null, path: null,
        requires: { operator: 'and', conditions: [] },
        _position: { x: 100, y: 200 },
      },
    },
  };
}

/** Default campaign state — no overrides */
function defaultCampaignState() {
  return { nodeStates: {}, flagOverrides: {}, statusOverrides: {} };
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 1: recalculate() — Happy Paths
// ════════════════════════════════════════════════════════════

function testRecalculateHappyPaths() {
  group('recalculate() — Happy Paths');

  // 1.1 Minimal narrative — no edges, only entry node
  {
    const data = minimalNarrative();
    const result = recalculate(data, defaultCampaignState());
    assert(
      typeof result.evaluatedEdges === 'object' && Object.keys(result.evaluatedEdges).length === 0,
      '1.1 Minimal narrative: evaluatedEdges is empty object'
    );
    assert(
      result.unreachableNodes instanceof Set && result.unreachableNodes.size === 0,
      '1.2 Minimal narrative: no unreachable nodes (only entry node exists)'
    );
    assert(
      Array.isArray(result.autoLockSuggestions) && result.autoLockSuggestions.length === 0,
      '1.3 Minimal narrative: no auto-lock suggestions'
    );
  }

  // 1.2 Linear chain — all edges unconditional → all pass
  {
    const data = linearChainNarrative();
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_001'] === true,
      '1.4 Linear chain: edge N001→N002 passes (unconditional)'
    );
    assert(
      result.evaluatedEdges['edge-N002-route_002'] === true,
      '1.5 Linear chain: edge N002→E001 passes (unconditional)'
    );
    assert(
      result.unreachableNodes.size === 0,
      '1.6 Linear chain: all nodes reachable from entry'
    );
  }

  // 1.3 Branching with conditions — F001 default false
  {
    const data = branchingWithConditionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === false,
      '1.7 Branching: conditional edge fails (F001=false, requires F001=true)'
    );
    assert(
      result.evaluatedEdges['edge-N001-route_free'] === true,
      '1.8 Branching: unconditional edge passes'
    );
    assert(
      result.unreachableNodes.has('N002'),
      '1.9 Branching: N002 unreachable (only edge to it fails)'
    );
    assert(
      !result.unreachableNodes.has('N003'),
      '1.10 Branching: N003 reachable (unconditional edge)'
    );
    assert(
      !result.unreachableNodes.has('N001'),
      '1.11 Branching: N001 (entry) always reachable'
    );
  }

  // 1.4 Branching — override F001=true
  {
    const data = branchingWithConditionsNarrative();
    const campaign = { nodeStates: {}, flagOverrides: { F001: true }, statusOverrides: {} };
    const result = recalculate(data, campaign);
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '1.12 Branching with override: conditional edge passes (F001=true override)'
    );
    assert(
      !result.unreachableNodes.has('N002'),
      '1.13 Branching with override: N002 now reachable'
    );
  }

  // 1.5 Choice with options
  {
    const data = choiceWithOptionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    // N001 → CH001 = unconditional
    assert(
      result.evaluatedEdges['edge-N001-route_to_ch'] === true,
      '1.14 Choice: N001→CH001 edge passes (unconditional)'
    );
    // CH001 opt_fight → E001 requires F001=true (F001 default false)
    assert(
      result.evaluatedEdges['edge-CH001-opt_fight-opt_fight_next'] === false,
      '1.15 Choice: fight option edge fails (F001=false, option requires F001=true)'
    );
    // CH001 opt_flee → E002 unconditional
    assert(
      result.evaluatedEdges['edge-CH001-opt_flee-opt_flee_next'] === true,
      '1.16 Choice: flee option edge passes (unconditional)'
    );
    // E001 unreachable (only edge to it fails), E002 reachable
    assert(
      result.unreachableNodes.has('E001'),
      '1.17 Choice: E001 unreachable (fight edge fails)'
    );
    assert(
      !result.unreachableNodes.has('E002'),
      '1.18 Choice: E002 reachable (flee edge passes)'
    );
  }
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 2: recalculate() — Edge Cases
// ════════════════════════════════════════════════════════════

function testRecalculateEdgeCases() {
  group('recalculate() — Edge Cases');

  // 2.1 Empty narrative data
  {
    const data = {
      metadata: {}, flag: {}, status: {},
      common: {}, choice: {}, ending: {},
    };
    const result = recalculate(data, defaultCampaignState());
    assert(
      Object.keys(result.evaluatedEdges).length === 0,
      '2.1 Empty narrative: no evaluated edges'
    );
    assert(
      result.unreachableNodes.size === 0,
      '2.2 Empty narrative: no unreachable nodes (no nodes exist)'
    );
  }

  // 2.2 Entry node doesn't exist in graph
  {
    const data = minimalNarrative();
    data.metadata.entry_node = 'NONEXISTENT';
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.unreachableNodes.has('N001'),
      '2.3 Missing entry node: all nodes become unreachable'
    );
    assert(
      result.unreachableNodes.size === 1,
      '2.4 Missing entry node: unreachable count = total nodes'
    );
  }

  // 2.3 Null entry node
  {
    const data = minimalNarrative();
    data.metadata.entry_node = null;
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.unreachableNodes.has('N001'),
      '2.5 Null entry node: all nodes unreachable'
    );
  }

  // 2.4 Status condition — range check
  {
    const data = branchingWithConditionsNarrative();
    // Replace the F001 condition with a status range condition
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        { id: 'sc1', status: 'SP001', min: 5, max: 15 },
      ],
    };
    // Default SP001 value is 10, range is 5–15 → should pass
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.6 Status range: edge passes when value (10) is within range [5, 15]'
    );
  }

  // 2.5 Status condition — value below min
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        { id: 'sc1', status: 'SP001', min: 20 },
      ],
    };
    // SP001 default = 10, min=20 → should fail
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === false,
      '2.7 Status min: edge fails when value (10) < min (20)'
    );
  }

  // 2.6 Status override changes result
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        { id: 'sc1', status: 'SP001', min: 20 },
      ],
    };
    const campaign = { nodeStates: {}, flagOverrides: {}, statusOverrides: { SP001: 25 } };
    const result = recalculate(data, campaign);
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.8 Status override: edge passes when override (25) >= min (20)'
    );
  }

  // 2.7 Source node requires also checked
  {
    const data = linearChainNarrative();
    // Make N001 itself have a failing condition
    data.common.N001.requires = {
      operator: 'and',
      conditions: [{ id: 'c1', flag: 'F001', state: true }],
    };
    // F001 default = false → N001.requires fails → its edges should fail
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_001'] === false,
      '2.9 Source requires: edge fails when source node requires fails'
    );
  }

  // 2.8 OR operator in conditions
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'or',
      conditions: [
        { id: 'c1', flag: 'F001', state: true },  // false
        { id: 'c2', status: 'SP001', min: 5 },     // 10 >= 5 = true
      ],
    };
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.10 OR operator: edge passes when at least one condition passes'
    );
  }

  // 2.9 Nested condition groups
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        {
          operator: 'or',
          conditions: [
            { id: 'c1', flag: 'F001', state: true },  // false
            { id: 'c2', flag: 'F001', state: false },  // true
          ],
        },
      ],
    };
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.11 Nested groups: AND(OR(false, true)) = true'
    );
  }

  // 2.10 Missing flag reference → defaults to false
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        { id: 'c1', flag: 'NONEXISTENT', state: false },
      ],
    };
    // NONEXISTENT flag defaults to false, require state=false → passes
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.12 Missing flag: defaults to false, condition state=false → passes'
    );
  }

  // 2.11 Missing status reference → defaults to 0
  {
    const data = branchingWithConditionsNarrative();
    data.common.N001.next[0].requires = {
      operator: 'and',
      conditions: [
        { id: 'sc1', status: 'NONEXISTENT', min: 0 },
      ],
    };
    // NONEXISTENT status defaults to 0, min=0 → passes
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.evaluatedEdges['edge-N001-route_cond'] === true,
      '2.13 Missing status: defaults to 0, min=0 → passes'
    );
  }
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 3: recalculate() — Auto-Lock Suggestions
// ════════════════════════════════════════════════════════════

function testAutoLockSuggestions() {
  group('recalculate() — Auto-Lock Suggestions');

  // 3.1 Unreachable node with default status → suggested
  {
    const data = branchingWithConditionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    assert(
      result.autoLockSuggestions.includes('N002'),
      '3.1 Unreachable + default status → auto-lock suggested'
    );
  }

  // 3.2 Unreachable node already locked → NOT suggested
  {
    const data = branchingWithConditionsNarrative();
    const campaign = {
      nodeStates: { N002: { status: 'locked', seen: 'unseen' } },
      flagOverrides: {},
      statusOverrides: {},
    };
    const result = recalculate(data, campaign);
    assert(
      !result.autoLockSuggestions.includes('N002'),
      '3.2 Unreachable + locked → NOT suggested'
    );
  }

  // 3.3 Unreachable node already branch_locked → NOT suggested
  {
    const data = branchingWithConditionsNarrative();
    const campaign = {
      nodeStates: { N002: { status: 'branch_locked', seen: 'unseen' } },
      flagOverrides: {},
      statusOverrides: {},
    };
    const result = recalculate(data, campaign);
    assert(
      !result.autoLockSuggestions.includes('N002'),
      '3.3 Unreachable + branch_locked → NOT suggested'
    );
  }

  // 3.4 Unreachable node complete → NOT suggested
  {
    const data = branchingWithConditionsNarrative();
    const campaign = {
      nodeStates: { N002: { status: 'complete', seen: 'seen' } },
      flagOverrides: {},
      statusOverrides: {},
    };
    const result = recalculate(data, campaign);
    assert(
      !result.autoLockSuggestions.includes('N002'),
      '3.4 Unreachable + complete → NOT suggested'
    );
  }

  // 3.5 Unreachable node failed → NOT suggested
  {
    const data = branchingWithConditionsNarrative();
    const campaign = {
      nodeStates: { N002: { status: 'failed', seen: 'unseen' } },
      flagOverrides: {},
      statusOverrides: {},
    };
    const result = recalculate(data, campaign);
    assert(
      !result.autoLockSuggestions.includes('N002'),
      '3.5 Unreachable + failed → NOT suggested'
    );
  }

  // 3.6 Unreachable node active → suggested (active is not terminal)
  {
    const data = branchingWithConditionsNarrative();
    const campaign = {
      nodeStates: { N002: { status: 'active', seen: 'unseen' } },
      flagOverrides: {},
      statusOverrides: {},
    };
    const result = recalculate(data, campaign);
    assert(
      result.autoLockSuggestions.includes('N002'),
      '3.6 Unreachable + active → suggested (active is non-terminal)'
    );
  }
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 4: findUnreachableNodes() — Direct Tests
// ════════════════════════════════════════════════════════════

function testFindUnreachableNodes() {
  group('findUnreachableNodes() — Direct Tests');

  // 4.1 All edges pass → all connected nodes reachable
  {
    const data = linearChainNarrative();
    const evalEdges = {
      'edge-N001-route_001': true,
      'edge-N002-route_002': true,
    };
    const unreachable = findUnreachableNodes(data, evalEdges, 'N001');
    assert(
      unreachable.size === 0,
      '4.1 All edges pass: no unreachable nodes'
    );
  }

  // 4.2 First edge fails → downstream nodes unreachable
  {
    const data = linearChainNarrative();
    const evalEdges = {
      'edge-N001-route_001': false,
      'edge-N002-route_002': true,
    };
    const unreachable = findUnreachableNodes(data, evalEdges, 'N001');
    assert(
      unreachable.has('N002') && unreachable.has('E001'),
      '4.2 First edge fails: N002 and E001 unreachable'
    );
    assert(
      !unreachable.has('N001'),
      '4.3 First edge fails: N001 (entry) still reachable'
    );
  }

  // 4.3 Undefined evaluation → treated as passable
  {
    const data = linearChainNarrative();
    const evalEdges = {}; // No evaluation data
    const unreachable = findUnreachableNodes(data, evalEdges, 'N001');
    assert(
      unreachable.size === 0,
      '4.4 Undefined evaluation: all nodes reachable (undefined ≠ false)'
    );
  }

  // 4.4 No entry node → all unreachable
  {
    const data = linearChainNarrative();
    const unreachable = findUnreachableNodes(data, {}, null);
    assert(
      unreachable.size === 3,
      '4.5 No entry node: all 3 nodes unreachable'
    );
  }

  // 4.5 Entry node doesn't exist → all unreachable
  {
    const data = linearChainNarrative();
    const unreachable = findUnreachableNodes(data, {}, 'NONEXISTENT');
    assert(
      unreachable.size === 3,
      '4.6 Nonexistent entry: all 3 nodes unreachable'
    );
  }

  // 4.6 Disconnected island — node not connected to any edge
  {
    const data = linearChainNarrative();
    data.common.N_ISLAND = {
      id: 'N_ISLAND', name: 'island', type: null, chapter: null, path: null,
      description: '', variants: [],
      requires: { operator: 'and', conditions: [] },
      flags_set: [], status_set: [], next: [],
      _position: { x: 500, y: 0 },
    };
    const evalEdges = {
      'edge-N001-route_001': true,
      'edge-N002-route_002': true,
    };
    const unreachable = findUnreachableNodes(data, evalEdges, 'N001');
    assert(
      unreachable.has('N_ISLAND'),
      '4.7 Disconnected island: N_ISLAND unreachable'
    );
    assert(
      unreachable.size === 1,
      '4.8 Disconnected island: only 1 unreachable (the island)'
    );
  }

  // 4.7 Cycle in graph → BFS handles correctly (no infinite loop)
  {
    const data = minimalNarrative();
    data.common.N001.next = [
      { id: 'route_loop', target: 'N002', requires: { operator: 'and', conditions: [] } },
    ];
    data.common.N002 = {
      id: 'N002', name: 'loop_back', type: null, chapter: null, path: null,
      description: '', variants: [],
      requires: { operator: 'and', conditions: [] },
      flags_set: [], status_set: [],
      next: [
        { id: 'route_back', target: 'N001', requires: { operator: 'and', conditions: [] } },
      ],
      _position: { x: 0, y: 100 },
    };
    const evalEdges = {
      'edge-N001-route_loop': true,
      'edge-N002-route_back': true,
    };
    const unreachable = findUnreachableNodes(data, evalEdges, 'N001');
    assert(
      unreachable.size === 0,
      '4.9 Cycle: BFS handles cycle without infinite loop, all reachable'
    );
  }
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 5: evaluateCondition() — Direct Tests
// ════════════════════════════════════════════════════════════

function testEvaluateCondition() {
  group('evaluateCondition() — Direct Tests');

  // 5.1 Empty conditions → passes
  {
    const result = evaluateCondition({ operator: 'and', conditions: [] }, {}, {});
    assert(result === true, '5.1 Empty AND group → passes');
  }

  // 5.2 Null/undefined group → passes
  {
    assert(evaluateCondition(null, {}, {}) === true, '5.2 null group → passes');
    assert(evaluateCondition(undefined, {}, {}) === true, '5.3 undefined group → passes');
  }

  // 5.3 Single flag condition — match
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
    assert(evaluateCondition(group, { F001: true }, {}) === true, '5.4 Flag true match → passes');
  }

  // 5.4 Single flag condition — mismatch
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
    assert(evaluateCondition(group, { F001: false }, {}) === false, '5.5 Flag mismatch → fails');
  }

  // 5.5 Status condition — min only
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 5 }] };
    assert(evaluateCondition(group, {}, { SP001: 10 }) === true, '5.6 Status min: 10 >= 5 → passes');
    assert(evaluateCondition(group, {}, { SP001: 3 }) === false, '5.7 Status min: 3 < 5 → fails');
  }

  // 5.6 Status condition — max only
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', max: 10 }] };
    assert(evaluateCondition(group, {}, { SP001: 8 }) === true, '5.8 Status max: 8 <= 10 → passes');
    assert(evaluateCondition(group, {}, { SP001: 15 }) === false, '5.9 Status max: 15 > 10 → fails');
  }

  // 5.7 Status condition — min + max range
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', status: 'SP001', min: 5, max: 15 }] };
    assert(evaluateCondition(group, {}, { SP001: 10 }) === true, '5.10 Status range: 10 in [5,15] → passes');
    assert(evaluateCondition(group, {}, { SP001: 3 }) === false, '5.11 Status range: 3 < 5 → fails');
    assert(evaluateCondition(group, {}, { SP001: 20 }) === false, '5.12 Status range: 20 > 15 → fails');
    assert(evaluateCondition(group, {}, { SP001: 5 }) === true, '5.13 Status range: 5 (boundary) → passes');
    assert(evaluateCondition(group, {}, { SP001: 15 }) === true, '5.14 Status range: 15 (boundary) → passes');
  }

  // 5.8 Empty flag ID → fails
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', flag: '', state: true }] };
    assert(evaluateCondition(group, {}, {}) === false, '5.15 Empty flag ID → fails');
  }

  // 5.9 Empty status ID → fails
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', status: '', min: 0 }] };
    assert(evaluateCondition(group, {}, {}) === false, '5.16 Empty status ID → fails');
  }

  // 5.10 Status with no min/max → malformed, fails
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', status: 'SP001' }] };
    assert(evaluateCondition(group, {}, { SP001: 10 }) === false, '5.17 Status no min/max → fails');
  }

  // 5.11 Unknown operator → fails
  {
    const group = { operator: 'xor', conditions: [{ id: 'c1', flag: 'F001', state: true }] };
    assert(evaluateCondition(group, { F001: true }, {}) === false, '5.18 Unknown operator "xor" → fails');
  }

  // 5.12 Unknown condition type → fails
  {
    const group = { operator: 'and', conditions: [{ id: 'c1', quest: 'Q001' }] };
    assert(evaluateCondition(group, {}, {}) === false, '5.19 Unknown condition type → fails');
  }
}

// ════════════════════════════════════════════════════════════
// TEST GROUP 6: recalculate() — Data Model Integrity
// ════════════════════════════════════════════════════════════

function testDataModelIntegrity() {
  group('recalculate() — Data Model Integrity');

  // 6.1 Return shape
  {
    const data = minimalNarrative();
    const result = recalculate(data, defaultCampaignState());
    assert(
      'evaluatedEdges' in result && 'unreachableNodes' in result && 'autoLockSuggestions' in result,
      '6.1 Return shape: has evaluatedEdges, unreachableNodes, autoLockSuggestions'
    );
    assert(
      typeof result.evaluatedEdges === 'object' && !(result.evaluatedEdges instanceof Set),
      '6.2 evaluatedEdges is a plain object (not a Set)'
    );
    assert(
      result.unreachableNodes instanceof Set,
      '6.3 unreachableNodes is a Set'
    );
    assert(
      Array.isArray(result.autoLockSuggestions),
      '6.4 autoLockSuggestions is an array'
    );
  }

  // 6.2 Edge IDs match expected format
  {
    const data = linearChainNarrative();
    const result = recalculate(data, defaultCampaignState());
    const edgeIds = Object.keys(result.evaluatedEdges);
    assert(
      edgeIds.every(id => id.startsWith('edge-')),
      '6.5 All edge IDs start with "edge-"'
    );
    assert(
      edgeIds.includes('edge-N001-route_001'),
      '6.6 Common edge ID format: "edge-{sourceId}-{nextEntryId}"'
    );
  }

  // 6.3 Choice edge IDs include option ID
  {
    const data = choiceWithOptionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    const edgeIds = Object.keys(result.evaluatedEdges);
    assert(
      edgeIds.includes('edge-CH001-opt_fight-opt_fight_next'),
      '6.7 Choice edge ID format: "edge-{choiceId}-{optionId}-{nextEntryId}"'
    );
  }

  // 6.4 evaluatedEdges values are all booleans
  {
    const data = choiceWithOptionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    const allBooleans = Object.values(result.evaluatedEdges).every(v => typeof v === 'boolean');
    assert(allBooleans, '6.8 All evaluatedEdges values are booleans');
  }

  // 6.5 unreachable set only contains valid node IDs
  {
    const data = branchingWithConditionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    const allNodeIds = new Set([
      ...Object.keys(data.common),
      ...Object.keys(data.choice),
      ...Object.keys(data.ending),
    ]);
    for (const id of result.unreachableNodes) {
      assert(allNodeIds.has(id), `6.9 Unreachable ID "${id}" exists in graph`);
    }
  }

  // 6.6 autoLockSuggestions only contains strings
  {
    const data = branchingWithConditionsNarrative();
    const result = recalculate(data, defaultCampaignState());
    const allStrings = result.autoLockSuggestions.every(s => typeof s === 'string');
    assert(allStrings, '6.10 autoLockSuggestions entries are all strings');
  }
}

// ════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ════════════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════╗');
console.log('║  Phase 10 — Simulation Engine Tests    ║');
console.log('╚════════════════════════════════════════╝');

testRecalculateHappyPaths();
testRecalculateEdgeCases();
testAutoLockSuggestions();
testFindUnreachableNodes();
testEvaluateCondition();
testDataModelIntegrity();

summary();
