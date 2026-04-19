let totalTests = 0;
let passedTests = 0;
let groupA_failed = false;
let groupB_failed = false;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    const err = new Error();
    console.error(err.stack);
    return false;
  }
  return true;
}

// ------------------------------------
// MOCKS & INLINED FUNCTIONS (Phase 1)
// ------------------------------------
function generateId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100)}`; }

let state = { campaigns: {}, activeCampaignId: null };
const set = (updater) => {
  if (typeof updater === 'function') {
    state = { ...state, ...updater(state) };
  } else {
    state = { ...state, ...updater };
  }
};
const get = () => state;

const campaignStore = {
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
  }
};

// ------------------------------------
// GROUP A - Feature Verification
// ------------------------------------
console.log("--- GROUP A - FEATURE VERIFICATION (Phase 1) ---");

// Test 1: addCampaign generates correct schema
campaignStore.addCampaign("Run 1");
const campaignIds = Object.keys(state.campaigns);
const campId = campaignIds[0];
const camp = state.campaigns[campId];
if (!assert(camp && camp.id.startsWith("camp-") && camp.campaignSchemaVersion === 1, "addCampaign assigns correct ID prefix and schema version")) groupA_failed = true;
if (!assert(camp.snapshot && camp.snapshot.seenNodeIds.length === 0, "addCampaign instantiates empty simulation snapshot structure")) groupA_failed = true;

// Test 2: updateCampaign updates properties and updatedAt
const oldTime = camp.updatedAt;
setTimeout(() => {}, 10);
campaignStore.updateCampaign(campId, { name: "Renamed Run", snapshot: { activeNodeId: "n-1" } });
const updatedCamp = state.campaigns[campId];
if (!assert(updatedCamp.name === "Renamed Run" && updatedCamp.snapshot.activeNodeId === "n-1", "updateCampaign correctly merges patches")) groupA_failed = true;
if (!assert(updatedCamp.updatedAt !== oldTime, "updateCampaign updates the timestamp")) groupA_failed = true;

// ------------------------------------
// GROUP B - Integration Suite
// ------------------------------------
console.log("\n--- GROUP B - INTEGRATION SUITE (Phase 1) ---");

// Test 3: deleteCampaign resets activeCampaignId if the deleted one was active
state.activeCampaignId = campId;
campaignStore.deleteCampaign(campId);
if (!assert(state.activeCampaignId === null && !state.campaigns[campId], "deleteCampaign resets activeCampaignId to null when active campaign is deleted")) groupB_failed = true;

// Test 4: clearCampaigns works cleanly
campaignStore.addCampaign("Run 2");
campaignStore.setActiveCampaign(Object.keys(state.campaigns)[0]);
campaignStore.clearCampaigns();
if (!assert(Object.keys(state.campaigns).length === 0 && state.activeCampaignId === null, "clearCampaigns removes all campaigns and nullifies active focus")) groupB_failed = true;

console.log("\n--- RESULTS ---");
console.log(`${passedTests} passed, ${totalTests - passedTests} failed`);
console.log(`INTEGRATION: ${groupB_failed ? 'BROKEN' : 'CLEAN'}`);
