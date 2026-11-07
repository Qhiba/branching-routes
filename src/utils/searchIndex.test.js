// ADDED (Redesign Step 6)
import { describe, it, expect } from 'vitest';
import { searchGraph, nodeMatchesFilters, nodeRouteType, describeCondition, countActiveFilters } from './searchIndex.js';

const graph = {
  flag: { f1: { id: 'f1', name: 'met_alice' }, f2: { id: 'f2', name: 'has_key' } },
  status: { s1: { id: 's1', name: 'affection' } },
  collectible: { c1: { id: 'c1', name: 'Rooftop CG', categoryId: 'cat-cg' } },
  common: {
    a: { id: 'a', type: 'common', data: { label: 'Gift scene', flags_set: ['f1'], status_set: [{ statusId: 's1', amount: 3, mode: 'add' }], collectibleIds: ['c1'], chapterId: 'ch1', tagIds: ['t1', 't2'] } },
    hub: { id: 'hub', type: 'hub', data: { label: 'After school' } },
    w: { id: 'w', type: 'warp_exit', data: { label: 'To chapter 3' } },
  },
  choice: {
    b: {
      id: 'b', type: 'choice',
      data: {
        label: 'Alice at the café',
        options: [
          { id: 'o1', label: 'Compliment her', status_set: [{ statusId: 's1', amount: 2, mode: 'add' }] },
          { id: 'o2', label: 'Ignore her', status_set: [{ statusId: 's1', amount: -1 }], requires: { operator: 'and', conditions: [{ flag: 'f2', state: true }] } },
        ],
      },
    },
  },
  ending: { e: { id: 'e', type: 'ending', data: { label: 'Rooftop ending' } } },
  edges: [
    { id: 'e1', sourceId: 'b', targetId: 'e', condition: { operator: 'and', conditions: [{ status: 's1', min: 5 }] } },
  ],
};

describe('searchGraph', () => {
  it('returns every node with no match lines for an empty query', () => {
    const r = searchGraph('', graph);
    expect(r.map(x => x.nodeId)).toEqual(['a', 'hub', 'w', 'b', 'e']);
    expect(r.every(x => x.matches.length === 0)).toBe(true);
  });

  it('finds where a status is set and required, grouped under the node', () => {
    const r = searchGraph('affection', graph);
    const byId = Object.fromEntries(r.map(x => [x.nodeId, x.matches.map(m => m.text)]));
    expect(byId.a).toEqual(['On enter: affection +3']);
    expect(byId.b).toEqual([
      'Option "Compliment her": affection +2',
      'Option "Ignore her": affection −1',
      '→ Rooftop ending requires affection ≥ 5',
    ]);
  });

  it('can leave edge conditions out', () => {
    const r = searchGraph('affection', graph, { includeEdges: false });
    expect(r.find(x => x.nodeId === 'b').matches.some(m => m.kind === 'edge')).toBe(false);
  });

  it('matches labels, collectibles, flags and option requirements', () => {
    // edge lines only match on the condition's flag/status names, not the target label
    expect(searchGraph('rooftop', graph).map(x => [x.nodeId, x.matches[0].text])).toEqual([
      ['a', 'Grants Rooftop CG'],
      ['e', 'Rooftop ending'],
    ]);
    expect(searchGraph('met_alice', graph)[0].matches[0].text).toBe('On enter: met_alice = true');
    expect(searchGraph('has_key', graph)[0].matches[0].text).toBe('Option "Ignore her" requires has_key is true');
  });

  it('is case-insensitive and skips nodes without matches', () => {
    expect(searchGraph('ALICE', graph).map(x => x.nodeId)).toEqual(['a', 'b']);
    expect(searchGraph('zzz', graph)).toEqual([]);
  });
});

describe('describeCondition', () => {
  it('writes ranges, equality and nested groups in plain words', () => {
    const dicts = { flag: graph.flag, status: graph.status };
    expect(describeCondition({ operator: 'or', conditions: [
      { status: 's1', min: 2, max: 8 },
      { status: 's1', min: 4, max: 4 },
      { operator: 'and', conditions: [{ flag: 'f1', state: false }, { status: 's1', max: 1 }] },
    ] }, dicts)).toBe('2 ≤ affection ≤ 8 or affection = 4 or (met_alice is false and affection ≤ 1)');
  });
});

describe('filters', () => {
  it('derives route types', () => {
    expect(nodeRouteType(graph.common.hub, 'common')).toBe('hub');
    expect(nodeRouteType(graph.common.w, 'common')).toBe('warp');
    expect(nodeRouteType(graph.choice.b, 'choice')).toBe('choice');
  });

  it('applies type, chapter, tags (AND/OR) and collectible category', () => {
    const a = graph.common.a;
    expect(nodeMatchesFilters(a, 'common', {}, graph.collectible)).toBe(true);
    expect(nodeMatchesFilters(a, 'common', { nodeType: 'choice' }, graph.collectible)).toBe(false);
    expect(nodeMatchesFilters(a, 'common', { chapterId: 'ch1' }, graph.collectible)).toBe(true);
    expect(nodeMatchesFilters(a, 'common', { tagIds: ['t1', 'tX'], tagsLogic: 'or' }, graph.collectible)).toBe(true);
    expect(nodeMatchesFilters(a, 'common', { tagIds: ['t1', 'tX'], tagsLogic: 'and' }, graph.collectible)).toBe(false);
    expect(nodeMatchesFilters(a, 'common', { collectibleCategoryId: 'cat-cg' }, graph.collectible)).toBe(true);
    expect(nodeMatchesFilters(graph.choice.b, 'choice', { collectibleCategoryId: 'cat-cg' }, graph.collectible)).toBe(false);
  });

  it('counts active filters', () => {
    expect(countActiveFilters({ nodeType: 'hub', tagIds: ['t1', 't2'], chapterId: null })).toBe(2);
  });
});

// ADDED (2026-11-06): one status wording for edges, Choice option chips, Browse and Inspector
import { formatStatusClause } from './searchIndex.js';

describe('formatStatusClause', () => {
  it('writes ranges with both ends included, equal ends as "=", and open ends as ≥ / ≤', () => {
    expect(formatStatusClause('saori_bathroom', { min: 1, max: 10 })).toBe('1 ≤ saori_bathroom ≤ 10');
    expect(formatStatusClause('saori_bathroom', { min: 1, max: 1 })).toBe('saori_bathroom = 1');
    expect(formatStatusClause('affection', { min: 5 })).toBe('affection ≥ 5');
    expect(formatStatusClause('affection', { max: 5 })).toBe('affection ≤ 5');
    expect(formatStatusClause('affection', { min: null, max: '' })).toBe('affection (any value)');
  });
});
