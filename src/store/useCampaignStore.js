// ============================================================
// useCampaignStore.js — Zustand store for campaign management
// ============================================================
// Manages named campaign "sheets" — saved simulation states that
// allow designers to test different narrative scenarios. Each
// campaign holds a snapshot of node states, flag overrides, and
// status overrides, isolated from the narrative data model.
//
// State shape:
//   campaigns          — { [campaignId]: CampaignData }
//   activeCampaignId   — string or null
//
// CampaignData:
//   { id, name, createdAt, updatedAt, nodeStates, flagOverrides, statusOverrides }
//
// Architecture rules enforced:
//   AR-02: campaign state lives here, not in components
//   AR-10: campaign state is metadata, separate from narrative data
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { generateId } from '../utils/generateId.js';
import { sanitizeName } from '../utils/sanitizeName.js';

// ── Default campaign state ───────────────────────────────────

function createDefaultCampaignState(name, overrides = {}) {
  const now = new Date().toISOString();
  const id = overrides.id ?? generateId('campaign');
  return {
    id,
    name: sanitizeName(name || 'untitled_campaign'),
    createdAt: overrides.createdAt ?? now,
    updatedAt: now,
    nodeStates: overrides.nodeStates ?? {},
    flagOverrides: overrides.flagOverrides ?? {},
    statusOverrides: overrides.statusOverrides ?? {},
  };
}

// ── Helpers ──────────────────────────────────────────────────

function nowISO() {
  return new Date().toISOString();
}

// ── Store ────────────────────────────────────────────────────

export const useCampaignStore = create(
  subscribeWithSelector((set, get) => ({
    // ── State shape ─────────────────────────────────────────

    campaigns: {},
    activeCampaignId: null,

    // ── Derived getter ──────────────────────────────────────

    /**
     * Get the currently active campaign data, or null.
     * @returns {CampaignData|null}
     */
    getActiveCampaign: () => {
      const state = get();
      if (!state.activeCampaignId) return null;
      return state.campaigns[state.activeCampaignId] ?? null;
    },

    // ── Create ──────────────────────────────────────────────

    /**
     * Create a new campaign with a given name and optionally switch to it.
     * @param {string} name — Campaign name (will be sanitized)
     * @param {object} [options]
     * @param {boolean} [options.switchTo=true] — Switch to the new campaign after creation
     * @returns {string} New campaign ID
     */
    createCampaign: (name, { switchTo = true } = {}) => {
      const campaign = createDefaultCampaignState(name);
      set((state) => ({
        campaigns: { ...state.campaigns, [campaign.id]: campaign },
        ...(switchTo ? { activeCampaignId: campaign.id } : {}),
      }));
      return campaign.id;
    },

    // ── Load (from persisted data) ──────────────────────────

    /**
     * Load a full set of campaigns from persisted data.
     * Replaces the current campaigns map entirely.
     * @param {{ [id: string]: CampaignData }} campaignsData
     * @param {string|null} [activeId] — ID of the campaign to set as active
     */
    loadCampaigns: (campaignsData, activeId = null) => {
      set({
        campaigns: campaignsData ?? {},
        activeCampaignId:
          activeId && campaignsData?.[activeId] ? activeId : null,
      });
    },

    // ── Save (update active campaign from simulation state) ─

    /**
     * Save the current simulation state into the active campaign.
     * @param {{ nodeStates: object, flagOverrides: object, statusOverrides: object }} simulationState
     */
    saveCampaign: (simulationState) => {
      set((state) => {
        const activeId = state.activeCampaignId;
        if (!activeId || !state.campaigns[activeId]) return {};
        const existing = state.campaigns[activeId];
        return {
          campaigns: {
            ...state.campaigns,
            [activeId]: {
              ...existing,
              updatedAt: nowISO(),
              nodeStates: simulationState.nodeStates ?? existing.nodeStates,
              flagOverrides:
                simulationState.flagOverrides ?? existing.flagOverrides,
              statusOverrides:
                simulationState.statusOverrides ?? existing.statusOverrides,
            },
          },
        };
      });
    },

    // ── Delete ──────────────────────────────────────────────

    /**
     * Delete a campaign by ID. If it's the active campaign,
     * the active campaign is set to null.
     * @param {string} campaignId
     */
    deleteCampaign: (campaignId) => {
      set((state) => {
        const { [campaignId]: _removed, ...remaining } = state.campaigns;
        return {
          campaigns: remaining,
          ...(state.activeCampaignId === campaignId
            ? { activeCampaignId: null }
            : {}),
        };
      });
    },

    // ── Switch ──────────────────────────────────────────────

    /**
     * Switch to a different campaign by ID.
     * Returns the campaign data, or null if not found.
     * @param {string} campaignId
     * @returns {CampaignData|null}
     */
    switchCampaign: (campaignId) => {
      const state = get();
      const campaign = state.campaigns[campaignId];
      if (!campaign) return null;
      set({ activeCampaignId: campaignId });
      return campaign;
    },

    // ── Reset active campaign ───────────────────────────────

    /**
     * Reset the active campaign's state to defaults
     * (empty nodeStates, flagOverrides, statusOverrides).
     * Does not delete the campaign.
     */
    resetActiveCampaign: () => {
      set((state) => {
        const activeId = state.activeCampaignId;
        if (!activeId || !state.campaigns[activeId]) return {};
        const existing = state.campaigns[activeId];
        return {
          campaigns: {
            ...state.campaigns,
            [activeId]: {
              ...existing,
              updatedAt: nowISO(),
              nodeStates: {},
              flagOverrides: {},
              statusOverrides: {},
            },
          },
        };
      });
    },

    // ── Update campaign name ────────────────────────────────

    /**
     * Rename a campaign.
     * @param {string} campaignId
     * @param {string} newName
     */
    renameCampaign: (campaignId, newName) => {
      set((state) => {
        const existing = state.campaigns[campaignId];
        if (!existing) return {};
        return {
          campaigns: {
            ...state.campaigns,
            [campaignId]: {
              ...existing,
              name: sanitizeName(newName),
              updatedAt: nowISO(),
            },
          },
        };
      });
    },
  }))
);
