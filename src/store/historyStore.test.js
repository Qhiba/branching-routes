// ADDED (Redesign Step 5): undo / redo history
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNarrativeStore } from './narrativeStore.js';
import { useSimulationStore } from './simulationStore.js';
import {
  initHistory, undo, redo, beginGroup, endGroup, cancelGroup, useHistoryStore, BURST_MS, HISTORY_LIMIT,
} from './historyStore.js';

const store = () => useNarrativeStore.getState();
const flagNames = () => Object.values(store().flag).map(f => f.name).sort();

describe('historyStore', () => {
  let unsub;
  beforeEach(() => {
    vi.useFakeTimers();
    store().newGraph();
    unsub = initHistory();
  });
  afterEach(() => {
    unsub?.();
    vi.useRealTimers();
  });

  it('undoes and redoes separate edits', () => {
    store().addFlag('a', false);
    vi.advanceTimersByTime(BURST_MS + 1);
    store().addFlag('b', false);
    vi.advanceTimersByTime(BURST_MS + 1);
    expect(flagNames()).toEqual(['a', 'b']);

    expect(undo()).toBe(true);
    expect(flagNames()).toEqual(['a']);
    expect(undo()).toBe(true);
    expect(flagNames()).toEqual([]);
    expect(useHistoryStore.getState().canUndo).toBe(false);

    expect(redo()).toBe(true);
    expect(flagNames()).toEqual(['a']);
    expect(useHistoryStore.getState().canRedo).toBe(true);
  });

  it('groups rapid changes (typing, drags) into one step', () => {
    const id = store().addNode({ x: 0, y: 0 }, 'common');
    vi.advanceTimersByTime(BURST_MS + 1);
    store().updateNode(id, { data: { label: 'H' } });
    store().updateNode(id, { data: { label: 'He' } });
    store().updateNode(id, { data: { label: 'Hey' } });
    vi.advanceTimersByTime(BURST_MS + 1);
    undo();
    expect(store().common[id].data.label).toBe('Common Node');
  });

  it('a new edit clears the redo stack', () => {
    store().addFlag('a', false);
    vi.advanceTimersByTime(BURST_MS + 1);
    undo();
    store().addFlag('b', false);
    expect(useHistoryStore.getState().canRedo).toBe(false);
    expect(redo()).toBe(false);
  });

  it('treats a group as one step and cancelGroup leaves no trace', () => {
    beginGroup();
    const id = store().addNode({ x: 0, y: 0 }, 'common');
    vi.advanceTimersByTime(BURST_MS * 3);
    store().updateNode(id, { data: { label: 'Edited' } });
    endGroup();
    undo();
    expect(store().common[id]).toBeUndefined();
    redo();
    expect(store().common[id].data.label).toBe('Edited');

    // cancelled creation: add + delete inside a group is not undoable at all
    vi.advanceTimersByTime(BURST_MS + 1);
    const before = useHistoryStore.getState().canUndo;
    beginGroup();
    const temp = store().addNode({ x: 5, y: 5 }, 'choice');
    store().deleteNode(temp);
    cancelGroup();
    undo(); // undoes the earlier group, not the cancelled one
    expect(store().common[id]).toBeUndefined();
    expect(before).toBe(true);
  });

  it('ignores Seen marks and resets on loadGraph / newGraph', () => {
    const id = store().addNode({ x: 0, y: 0 }, 'common');
    vi.advanceTimersByTime(BURST_MS + 1);
    store().toggleNodeSeen(id);
    undo();
    expect(store().common[id]).toBeUndefined(); // the seen toggle was not its own step

    store().addFlag('x', false);
    store().newGraph();
    expect(useHistoryStore.getState().canUndo).toBe(false);
  });

  it('is inert during a campaign', () => {
    store().addFlag('a', false);
    vi.advanceTimersByTime(BURST_MS + 1);
    useSimulationStore.setState({ isCampaignActive: true });
    expect(undo()).toBe(false);
    useSimulationStore.setState({ isCampaignActive: false });
    expect(undo()).toBe(true);
  });

  it(`keeps at most ${HISTORY_LIMIT} steps`, () => {
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      store().addFlag(`f${i}`, false);
      vi.advanceTimersByTime(BURST_MS + 1);
    }
    let steps = 0;
    while (undo()) steps++;
    expect(steps).toBe(HISTORY_LIMIT);
  });
});
