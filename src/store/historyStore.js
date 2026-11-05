// ADDED (Redesign Step 5): undo / redo for the authored graph (narrativeStore).
//
// How it works
// - `initHistory()` (called once at boot from main.jsx, AR-17) subscribes to narrativeStore. Every change to a
//   tracked slice pushes the PREVIOUS snapshot onto `past` and clears `future`.
// - Snapshots are cheap: the store is immutable, so a snapshot is just the tracked slice references.
// - Bursts: changes within BURST_MS of each other form one undo step (typing, a multi-node drag, arrow nudges).
// - Groups: `beginGroup()` / `endGroup()` make everything in between one step (a whole modal editing session).
//   `cancelGroup()` drops the group's step entirely (used when a newly created node is cancelled).
// - Not tracked: editor Seen marks (campaign annotations) and meta.updatedAt. A loadGraph/newGraph (detected via
//   narrativeStore.graphRevision) resets history so you can never "undo" into the previous project.
// - Undo/redo are inert while a campaign runs (AR-08: the graph is read-only then).
import { create } from 'zustand';
import { useNarrativeStore } from './narrativeStore.js';
import { useSimulationStore } from './simulationStore.js';
import { useUIStore } from './uiStore.js';

export const HISTORY_LIMIT = 100;
export const BURST_MS = 600;

export const TRACKED_SLICES = [
  'common', 'choice', 'ending', 'edges', 'flag', 'status', 'path', 'chapter', 'tag',
  'commonType', 'endingType', 'collectibleCategory', 'collectible',
];

// Reactive flags for UI (TopBar buttons). Per-slice selectors only (AR-23).
export const useHistoryStore = create(() => ({ canUndo: false, canRedo: false }));

let past = [];
let future = [];
let current = null;          // snapshot matching the store right now
let applying = false;        // true while undo/redo writes to the store
let burstTimer = null;       // active burst → further changes don't push
let group = null;            // { depth, pushed, markLength }
let lastRevision = null;
let unsubscribe = null;

function snapshot(state) {
  const snap = { metaTitle: state.meta?.title };
  TRACKED_SLICES.forEach(k => { snap[k] = state[k]; });
  return snap;
}

function sameSnapshot(a, b) {
  if (!a || !b) return false;
  if (a.metaTitle !== b.metaTitle) return false;
  return TRACKED_SLICES.every(k => a[k] === b[k]);
}

function publish() {
  useHistoryStore.setState({ canUndo: past.length > 0, canRedo: future.length > 0 });
}

function endBurst() {
  if (burstTimer) { clearTimeout(burstTimer); burstTimer = null; }
}

function startBurst() {
  endBurst();
  burstTimer = setTimeout(() => { burstTimer = null; }, BURST_MS);
}

function onStoreChange(state) {
  if (applying) return;

  if (state.graphRevision !== lastRevision) {
    // A whole new graph was loaded / created: start a fresh history.
    lastRevision = state.graphRevision;
    resetHistory(state);
    return;
  }

  const next = snapshot(state);
  if (sameSnapshot(next, current)) return; // only untracked fields changed (seen marks, updatedAt)

  const inGroupAlreadyPushed = group && group.pushed;
  if (!inGroupAlreadyPushed && !burstTimer) {
    past.push(current);
    if (past.length > HISTORY_LIMIT) past.shift();
    future = [];
    if (group) group.pushed = true;
  }
  if (!group) startBurst();
  current = next;
  publish();
}

function apply(snap) {
  applying = true;
  try {
    const state = useNarrativeStore.getState();
    const patch = { meta: { ...state.meta, title: snap.metaTitle, updatedAt: Date.now() } };
    TRACKED_SLICES.forEach(k => { patch[k] = snap[k]; });
    useNarrativeStore.setState(patch);
  } finally {
    applying = false;
  }
  current = snap;
  // Selection may point at nodes/edges that no longer exist.
  useUIStore.getState().clearSelection();
}

/** Subscribe to narrativeStore. Safe to call more than once (re-initialises). */
export function initHistory() {
  if (unsubscribe) unsubscribe();
  const state = useNarrativeStore.getState();
  lastRevision = state.graphRevision;
  resetHistory(state);
  unsubscribe = useNarrativeStore.subscribe(onStoreChange);
  return unsubscribe;
}

export function resetHistory(state = useNarrativeStore.getState()) {
  past = [];
  future = [];
  group = null;
  endBurst();
  current = snapshot(state);
  publish();
}

export function undo() {
  if (useSimulationStore.getState().isCampaignActive || past.length === 0) return false;
  endBurst();
  group = null;
  future.push(current);
  apply(past.pop());
  publish();
  return true;
}

export function redo() {
  if (useSimulationStore.getState().isCampaignActive || future.length === 0) return false;
  endBurst();
  group = null;
  past.push(current);
  apply(future.pop());
  publish();
  return true;
}

/** Everything until the matching endGroup() becomes a single undo step. Groups nest. */
export function beginGroup() {
  endBurst();
  if (group) { group.depth += 1; return; }
  group = { depth: 1, pushed: false, markLength: past.length };
}

export function endGroup() {
  if (!group) return;
  group.depth -= 1;
  if (group.depth <= 0) group = null;
}

/**
 * Drop the group's undo step without touching the store (the caller has already reverted the change, e.g. by
 * deleting the node it just created). Afterwards the cancelled work is neither undoable nor redoable.
 */
export function cancelGroup() {
  if (!group) return;
  past.length = Math.min(past.length, group.markLength);
  future = [];
  group = null;
  endBurst();
  current = snapshot(useNarrativeStore.getState());
  publish();
}

// Test hooks
export const __testing = {
  sizes: () => ({ past: past.length, future: future.length }),
  endBurst,
};
