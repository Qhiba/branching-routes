// ============================================================
// persistence.js — IndexedDB persistence via localforage
// ============================================================
// Provides save/load/clear for the full project state (narrative
// data + campaigns) and an auto-save subscription that debounces
// 500ms after the last store mutation.
//
// Architecture rules enforced:
//   AR-08: all IndexedDB errors surface via useUIStore.showPersistError()
//          — no .catch(() => {}) anywhere
// ============================================================

import localforage from 'localforage';
import { useNarrativeStore } from '../store/useNarrativeStore.js';
import { useCampaignStore } from '../store/useCampaignStore.js';
import { useUIStore } from '../store/useUIStore.js';

// ── Storage keys ────────────────────────────────────────────

const STORAGE_KEY_NARRATIVE = 'branching_routes_v2_narrative';
const STORAGE_KEY_CAMPAIGNS = 'branching_routes_v2_campaigns';
const STORAGE_KEY_ACTIVE_CAMPAIGN = 'branching_routes_v2_active_campaign';

// ── Configure localforage ───────────────────────────────────

localforage.config({
  name: 'BranchingRoutesV2',
  storeName: 'project_data',
  description: 'Branching Routes V2 project persistence',
});

// ── Save ────────────────────────────────────────────────────

/**
 * Save the full project state to IndexedDB.
 *
 * @param {object} narrativeData — The narrative store state snapshot
 *   (metadata, path, chapter, flag, status, common, choice, ending, quest)
 * @param {object} campaignData — The campaign store state snapshot
 *   { campaigns, activeCampaignId }
 * @throws {Error} Rethrows any localforage error after surfacing it via AR-08.
 */
export async function saveProject(narrativeData, campaignData) {
  try {
    await Promise.all([
      localforage.setItem(STORAGE_KEY_NARRATIVE, narrativeData),
      localforage.setItem(STORAGE_KEY_CAMPAIGNS, campaignData.campaigns),
      localforage.setItem(STORAGE_KEY_ACTIVE_CAMPAIGN, campaignData.activeCampaignId),
    ]);
    // Clear any previous persist error on successful save
    useUIStore.getState().clearPersistError();
  } catch (error) {
    // AR-08: surface the error to the user
    useUIStore.getState().showPersistError(
      `Failed to save to IndexedDB: ${error.message || 'Unknown error'}`
    );
    throw error;
  }
}

// ── Load ────────────────────────────────────────────────────

/**
 * Load the full project state from IndexedDB.
 *
 * @returns {{ narrativeData: object|null, campaigns: object|null, activeCampaignId: string|null }}
 *   Returns null for each field if nothing was stored.
 * @throws {Error} Rethrows any localforage error after surfacing it via AR-08.
 */
export async function loadProject() {
  try {
    const [narrativeData, campaigns, activeCampaignId] = await Promise.all([
      localforage.getItem(STORAGE_KEY_NARRATIVE),
      localforage.getItem(STORAGE_KEY_CAMPAIGNS),
      localforage.getItem(STORAGE_KEY_ACTIVE_CAMPAIGN),
    ]);
    return {
      narrativeData: narrativeData ?? null,
      campaigns: campaigns ?? null,
      activeCampaignId: activeCampaignId ?? null,
    };
  } catch (error) {
    // AR-08: surface the error to the user
    useUIStore.getState().showPersistError(
      `Failed to load from IndexedDB: ${error.message || 'Unknown error'}`
    );
    throw error;
  }
}

// ── Clear ───────────────────────────────────────────────────

/**
 * Wipe all stored project data from IndexedDB.
 *
 * @throws {Error} Rethrows any localforage error after surfacing it via AR-08.
 */
export async function clearProject() {
  try {
    await Promise.all([
      localforage.removeItem(STORAGE_KEY_NARRATIVE),
      localforage.removeItem(STORAGE_KEY_CAMPAIGNS),
      localforage.removeItem(STORAGE_KEY_ACTIVE_CAMPAIGN),
    ]);
  } catch (error) {
    // AR-08: surface the error to the user
    useUIStore.getState().showPersistError(
      `Failed to clear IndexedDB: ${error.message || 'Unknown error'}`
    );
    throw error;
  }
}

// ── Auto-save subscription ──────────────────────────────────

/**
 * Debounce timer reference for auto-save.
 * @type {ReturnType<typeof setTimeout> | null}
 */
let _autoSaveTimer = null;

/**
 * Subscription unsub functions stored for cleanup.
 * @type {Array<() => void>}
 */
let _unsubscribers = [];

/**
 * Collect the current narrative state snapshot for persistence.
 * @returns {object} Narrative data snapshot.
 */
function getNarrativeSnapshot() {
  const state = useNarrativeStore.getState();
  return {
    metadata: state.metadata,
    path: state.path,
    chapter: state.chapter,
    flag: state.flag,
    status: state.status,
    common: state.common,
    choice: state.choice,
    ending: state.ending,
    quest: state.quest,
  };
}

/**
 * Collect the current campaign state snapshot for persistence.
 * @returns {{ campaigns: object, activeCampaignId: string|null }}
 */
function getCampaignSnapshot() {
  const state = useCampaignStore.getState();
  return {
    campaigns: state.campaigns,
    activeCampaignId: state.activeCampaignId,
  };
}

/**
 * Schedule a debounced save. Resets the timer on every call
 * so that rapid mutations collapse into a single write.
 */
function scheduleSave() {
  if (_autoSaveTimer != null) {
    clearTimeout(_autoSaveTimer);
  }
  _autoSaveTimer = setTimeout(async () => {
    _autoSaveTimer = null;
    try {
      await saveProject(getNarrativeSnapshot(), getCampaignSnapshot());
    } catch (_error) {
      // Error already surfaced via AR-08 inside saveProject.
      // No silent swallowing — the error was thrown and the
      // persist banner is already shown. We catch here only
      // to prevent unhandled promise rejection in the timer.
    }
  }, 500);
}

/**
 * Initialize auto-save subscriptions on narrative and campaign stores.
 * Subscribes to any state mutation and triggers a debounced save.
 *
 * Call this once at app startup (e.g. in App.jsx or main.jsx).
 *
 * @returns {() => void} Cleanup function to unsubscribe all listeners.
 */
export function initAutoSave() {
  // Clean up any existing subscriptions
  stopAutoSave();

  // Subscribe to the narrative store — any state change triggers save
  const unsubNarrative = useNarrativeStore.subscribe(
    (state) => state.metadata.updated_at,
    () => {
      scheduleSave();
    }
  );

  // Subscribe to the campaign store — any campaign mutation triggers save
  const unsubCampaigns = useCampaignStore.subscribe(
    (state) => state.campaigns,
    () => {
      scheduleSave();
    }
  );

  // Also subscribe to active campaign ID changes
  const unsubActiveCampaign = useCampaignStore.subscribe(
    (state) => state.activeCampaignId,
    () => {
      scheduleSave();
    }
  );

  _unsubscribers = [unsubNarrative, unsubCampaigns, unsubActiveCampaign];

  return stopAutoSave;
}

/**
 * Stop all auto-save subscriptions and cancel any pending save.
 */
export function stopAutoSave() {
  if (_autoSaveTimer != null) {
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = null;
  }
  for (const unsub of _unsubscribers) {
    unsub();
  }
  _unsubscribers = [];
}
