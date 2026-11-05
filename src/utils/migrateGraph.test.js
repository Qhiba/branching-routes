// ADDED (Redesign Step 2): migrateGraph — v4 → v5 (variants removed, collectibles added) + sanitization
import { describe, it, expect } from 'vitest';
import { migrateGraph, CURRENT_SCHEMA_VERSION } from './fileSystem.js';

const v4Graph = () => ({
  schemaVersion: 4,
  meta: { title: 'Test' },
  common: {
    'n-a': {
      id: 'n-a', type: 'common', position: { x: 0, y: 0 }, createdAt: 111,
      data: { label: 'A', variants: [{ id: 'v-1', label: 'V', text: 't', requires: null }], tagIds: ['t-1'] }
    },
    'n-hub': { id: 'n-hub', type: 'hub', position: { x: 5, y: 5 }, data: { label: 'Hub', collectibleIds: ['col-x'] } }
  },
  choice: {
    'n-b': { id: 'n-b', type: 'choice', position: { x: 1, y: 1 }, createdAt: 222, data: { label: 'B', options: [] } }
  },
  ending: {},
  edges: [{ id: 'e-1', sourceId: 'n-a', targetId: 'n-b', optionId: null, condition: null }],
  flag: {}, status: {}, path: {}, chapter: {}, tag: { 't-1': { id: 't-1', name: 'Tag' } },
  commonType: {}, endingType: {},
  editorSeenNodeIds: ['n-a'], editorSeenOptionIds: []
});

describe('migrateGraph', () => {
  it('upgrades v4 to v5 and drops narrative variants', () => {
    const out = migrateGraph(v4Graph());
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(CURRENT_SCHEMA_VERSION).toBe(5);
    expect(out.common['n-a'].data.variants).toBeUndefined();
    expect(out.common['n-a'].data.label).toBe('A');
    expect(out.common['n-a'].data.tagIds).toEqual(['t-1']);
  });

  it('adds empty collectible dictionaries and collectibleIds on Common nodes only', () => {
    const out = migrateGraph(v4Graph());
    expect(out.collectibleCategory).toEqual({});
    expect(out.collectible).toEqual({});
    expect(out.common['n-a'].data.collectibleIds).toEqual([]);
    expect(out.common['n-hub'].data.collectibleIds).toBeUndefined();
    expect(out.choice['n-b'].data.collectibleIds).toBeUndefined();
  });

  it('preserves createdAt (z-order) and the rest of the graph', () => {
    const out = migrateGraph(v4Graph());
    expect(out.common['n-a'].createdAt).toBe(111);
    expect(out.choice['n-b'].createdAt).toBe(222);
    expect(out.edges).toHaveLength(1);
    expect(out.editorSeenNodeIds).toEqual(['n-a']);
  });

  it('keeps v5 collectibles and drops dangling collectible references', () => {
    const g = v4Graph();
    g.schemaVersion = 5;
    g.collectibleCategory = { 'cc-1': { id: 'cc-1', name: 'CG' } };
    g.collectible = { 'col-1': { id: 'col-1', name: 'CG 01', categoryId: 'cc-1' } };
    g.common['n-a'].data.collectibleIds = ['col-1', 'col-missing'];
    delete g.common['n-a'].data.variants;
    const out = migrateGraph(g);
    expect(out.collectible['col-1'].name).toBe('CG 01');
    expect(out.collectibleCategory['cc-1'].name).toBe('CG');
    expect(out.common['n-a'].data.collectibleIds).toEqual(['col-1']);
  });

  it('rejects unknown schema versions and malformed graphs', () => {
    expect(() => migrateGraph({ schemaVersion: 99, edges: [] })).toThrow('unsupported_schema_version');
    expect(() => migrateGraph({ schemaVersion: 5, edges: [] })).toThrow('invalid_project_structure');
  });
});
