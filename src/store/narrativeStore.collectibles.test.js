// ADDED (Redesign Step 2): Collectible CRUD, cascade and persistence round-trip
import { describe, it, expect, beforeEach } from 'vitest';
import { useNarrativeStore } from './narrativeStore.js';
import { migrateGraph } from '../utils/fileSystem.js';

const store = () => useNarrativeStore.getState();

describe('narrativeStore collectibles', () => {
  beforeEach(() => store().newGraph());

  it('creates categories and collectibles and assigns them to Common nodes', () => {
    const catId = store().addCollectibleCategory('CG');
    const colId = store().addCollectible('  CG 01  ', catId);
    const nodeId = store().addNode({ x: 0, y: 0 }, 'common');

    expect(store().collectibleCategory[catId]).toEqual({ id: catId, name: 'CG' });
    expect(store().collectible[colId]).toEqual({ id: colId, name: 'CG 01', categoryId: catId });

    store().toggleNodeCollectible(nodeId, colId);
    expect(store().common[nodeId].data.collectibleIds).toEqual([colId]);
    store().toggleNodeCollectible(nodeId, colId);
    expect(store().common[nodeId].data.collectibleIds).toEqual([]);
  });

  it('rejects empty names and ignores unknown categories', () => {
    expect(() => store().addCollectible('   ')).toThrow();
    expect(() => store().addCollectibleCategory('')).toThrow();
    const colId = store().addCollectible('Potion', 'cc-does-not-exist');
    expect(store().collectible[colId].categoryId).toBeNull();
  });

  it('only Common nodes can hold collectibles', () => {
    const colId = store().addCollectible('Item');
    const hubId = store().addNode({ x: 0, y: 0 }, 'hub');
    const choiceId = store().addNode({ x: 0, y: 0 }, 'choice');
    store().toggleNodeCollectible(hubId, colId);
    store().toggleNodeCollectible(choiceId, colId);
    expect(store().common[hubId].data.collectibleIds).toBeUndefined();
    expect(store().choice[choiceId].data.collectibleIds).toBeUndefined();
  });

  it('blocks deleting a granted collectible unless forced, then cascades', () => {
    const colId = store().addCollectible('CG 01');
    const nodeId = store().addNode({ x: 0, y: 0 }, 'common');
    store().toggleNodeCollectible(nodeId, colId);

    const blocked = store().deleteCollectible(colId);
    expect(blocked.blocked).toBe(true);
    expect(blocked.references).toEqual([`node_collectible:${nodeId}`]);
    expect(store().collectible[colId]).toBeDefined();

    expect(store().deleteCollectible(colId, true).blocked).toBe(false);
    expect(store().collectible[colId]).toBeUndefined();
    expect(store().common[nodeId].data.collectibleIds).toEqual([]);
  });

  it('blocks deleting a non-empty category unless forced, then removes its items everywhere', () => {
    const catId = store().addCollectibleCategory('CG');
    const keepId = store().addCollectible('Loose item');
    const colId = store().addCollectible('CG 01', catId);
    const nodeId = store().addNode({ x: 0, y: 0 }, 'common');
    store().toggleNodeCollectible(nodeId, colId);
    store().toggleNodeCollectible(nodeId, keepId);

    expect(store().deleteCollectibleCategory(catId).blocked).toBe(true);
    store().deleteCollectibleCategory(catId, true);
    expect(store().collectibleCategory[catId]).toBeUndefined();
    expect(store().collectible[colId]).toBeUndefined();
    expect(store().collectible[keepId]).toBeDefined();
    expect(store().common[nodeId].data.collectibleIds).toEqual([keepId]);
  });

  it('exports schema v5 and round-trips through migrateGraph + loadGraph', () => {
    const catId = store().addCollectibleCategory('CG');
    const colId = store().addCollectible('CG 01', catId);
    const nodeId = store().addNode({ x: 0, y: 0 }, 'common');
    store().toggleNodeCollectible(nodeId, colId);

    const exported = JSON.parse(JSON.stringify(store().exportGraph()));
    expect(exported.schemaVersion).toBe(5);

    store().newGraph();
    store().loadGraph(migrateGraph(exported));
    expect(store().collectible[colId].categoryId).toBe(catId);
    expect(store().common[nodeId].data.collectibleIds).toEqual([colId]);
    expect(typeof store().common[nodeId].createdAt).toBe('number');
  });
});
