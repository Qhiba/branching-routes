import { create } from 'zustand';
import { generateId, saveCampaignsToIndexedDB as utilsSave, loadCampaignsFromIndexedDB as utilsLoad } from '../utils';

export const useCampaignStore = create((set, get) => ({
  campaigns: {},
  activeCampaignId: null,

  addCampaign: (name) => {
    const id = generateId('camp');
    const now = new Date().toISOString();
    const campaign = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      campaignSchemaVersion: 1,
      snapshot: {
        activeNodeId: null,
        seenNodeIds: [],
        traversedEdgeIds: [],
        flagOverrides: {},
        statusOverrides: {},
      }
    };
    set((state) => ({
      campaigns: { ...state.campaigns, [id]: campaign }
    }));
    return id;
  },

  updateCampaign: (campaignId, patch) => {
    set((state) => {
      const campaign = state.campaigns[campaignId];
      if (!campaign) return state;
      return {
        campaigns: {
          ...state.campaigns,
          [campaignId]: {
            ...campaign,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        }
      };
    });
  },

  deleteCampaign: (campaignId) => {
    set((state) => {
      const { [campaignId]: deleted, ...rest } = state.campaigns;
      return {
        campaigns: rest,
        activeCampaignId: state.activeCampaignId === campaignId ? null : state.activeCampaignId
      };
    });
  },

  setActiveCampaign: (campaignId) => {
    set({ activeCampaignId: campaignId });
  },

  clearCampaigns: () => {
    set({ campaigns: {}, activeCampaignId: null });
  },

  saveCampaignsToIndexedDB: async () => {
    await utilsSave({ campaigns: get().campaigns });
  },

  loadCampaignsFromIndexedDB: async () => {
    const record = await utilsLoad();
    if (record && record.campaigns) {
      set({ campaigns: record.campaigns });
    }
    set({ activeCampaignId: null });
  },

  loadCampaignsFromObject: (campaignsDict) => {
    set({ 
      campaigns: campaignsDict || {}, 
      activeCampaignId: null 
    });
  },



}));
