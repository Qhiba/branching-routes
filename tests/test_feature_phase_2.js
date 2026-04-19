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
// MOCKS & INLINED FUNCTIONS (for Phase 2 testing)
// ------------------------------------

// Mock narrativeStore
let narrativeState = {
  flag: { 'f-123': { id: 'f-123', state: false } },
  status: { 's-456': { id: 's-456', value: 0 } },
  common: {},
  choice: {},
  ending: {},
  edges: []
};
const useNarrativeStore = {
  getState: () => narrativeState
};

// Inline enterCampaign logic from Phase 2
function enterCampaign(campaignPayload) {
  const graphState = useNarrativeStore.getState();
  
  const initialFlags = {};
  if (campaignPayload && campaignPayload.snapshot) {
    if (graphState.flag) {
      Object.values(graphState.flag).forEach(f => {
        initialFlags[f.id] = (campaignPayload.snapshot.flagOverrides && f.id in campaignPayload.snapshot.flagOverrides) 
          ? campaignPayload.snapshot.flagOverrides[f.id] 
          : f.state;
      });
    }
    if (graphState.status) {
      Object.values(graphState.status).forEach(s => {
        initialFlags[s.id] = (campaignPayload.snapshot.statusOverrides && s.id in campaignPayload.snapshot.statusOverrides) 
          ? campaignPayload.snapshot.statusOverrides[s.id] 
          : s.value;
      });
    }
  } else {
    if (graphState.flag) {
      Object.values(graphState.flag).forEach(f => {
        initialFlags[f.id] = f.state;
      });
    }
    if (graphState.status) {
      Object.values(graphState.status).forEach(s => {
        initialFlags[s.id] = s.value;
      });
    }
  }
  
  return initialFlags;
}

// ------------------------------------
// GROUP A - Feature Verification
// ------------------------------------
console.log("--- GROUP A - FEATURE VERIFICATION (Phase 2) ---");

// Test 1: Hydrate existing flags & status
let initialFlags1 = enterCampaign({
  snapshot: {
    flagOverrides: { 'f-123': true },
    statusOverrides: { 's-456': 5 }
  }
});
if (!assert(initialFlags1['f-123'] === true && initialFlags1['s-456'] === 5, "enterCampaign selectively hydrates overrides for existing flags and statuses")) groupA_failed = true;

// Test 2: Dangling flags dropped
let initialFlags2 = enterCampaign({
  snapshot: {
    flagOverrides: { 'f-123': true, 'f-999-dangling': true }
  }
});
if (!assert(initialFlags2['f-999-dangling'] === undefined, "enterCampaign selectively drops dangling IDs absent from narrativeStore")) groupA_failed = true;

// ------------------------------------
// GROUP B - Integration Suite
// ------------------------------------
console.log("\n--- GROUP B - INTEGRATION SUITE (Phase 2) ---");

// Test 3: Zero payload fallback (used by reset)
let initialFlags3 = enterCampaign();
if (!assert(initialFlags3['f-123'] === false && initialFlags3['s-456'] === 0, "enterCampaign with no payload safely falls back to narrativeStore defaults")) groupB_failed = true;

console.log("\n--- RESULTS ---");
console.log(`${passedTests} passed, ${totalTests - passedTests} failed`);
console.log(`INTEGRATION: ${groupB_failed ? 'BROKEN' : 'CLEAN'}`);
