// ============================================================
// CampaignSelector.jsx — Campaign CRUD dropdown/modal
// ============================================================
// Floating panel anchored bottom-left, collapsible, containing:
//   1. Campaign selector dropdown (create, switch, delete, reset)
//   2. Flag override panel (accordion section)
//   3. Status override panel (accordion section)
//
// On campaign switch, loads saved campaign state into simulation
// store. On campaign save, captures simulation state back into
// the campaign store.
//
// Stale reference pruning: when switching campaigns, scans for
// references to deleted entities and prunes them with a toast
// notification (R-03 mitigation).
//
// Dependencies: useCampaignStore, useSimulationStore, useNarrativeStore, useUIStore
// Architecture: AR-02, AR-09, AR-10
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCampaignStore } from '@/store/useCampaignStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Scroll,
} from 'lucide-react';
import FlagOverridePanel from './FlagOverridePanel.jsx';
import StatusOverridePanel from './StatusOverridePanel.jsx';
import './CampaignSelector.css';

// ── Stale reference pruning (R-03) ──────────────────────────

/**
 * Scan a campaign's state and remove references to entities
 * that no longer exist in the narrative store.
 *
 * @param {object} campaign — CampaignData
 * @param {object} narrativeState — narrative store state
 * @returns {{ pruned: object, count: number }} Pruned campaign state + count of removed refs
 */
function pruneStaleCampaignRefs(campaign, narrativeState) {
  let count = 0;

  // Prune nodeStates referencing deleted nodes
  const validNodeIds = new Set([
    ...Object.keys(narrativeState.common),
    ...Object.keys(narrativeState.choice),
    ...Object.keys(narrativeState.ending),
  ]);
  const prunedNodeStates = {};
  for (const [nodeId, state] of Object.entries(campaign.nodeStates || {})) {
    if (validNodeIds.has(nodeId)) {
      prunedNodeStates[nodeId] = state;
    } else {
      count++;
    }
  }

  // Prune flagOverrides referencing deleted flags
  const validFlagIds = new Set(Object.keys(narrativeState.flag));
  const prunedFlagOverrides = {};
  for (const [flagId, value] of Object.entries(campaign.flagOverrides || {})) {
    if (validFlagIds.has(flagId)) {
      prunedFlagOverrides[flagId] = value;
    } else {
      count++;
    }
  }

  // Prune statusOverrides referencing deleted status points
  const validStatusIds = new Set(Object.keys(narrativeState.status));
  const prunedStatusOverrides = {};
  for (const [statusId, value] of Object.entries(campaign.statusOverrides || {})) {
    if (validStatusIds.has(statusId)) {
      prunedStatusOverrides[statusId] = value;
    } else {
      count++;
    }
  }

  return {
    pruned: {
      nodeStates: prunedNodeStates,
      flagOverrides: prunedFlagOverrides,
      statusOverrides: prunedStatusOverrides,
    },
    count,
  };
}

// ── Component ───────────────────────────────────────────────

export default function CampaignSelector() {
  // ── Local UI state (not shared across components → useState OK) ──
  const [collapsed, setCollapsed] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [openSections, setOpenSections] = useState({
    flags: true,
    status: true,
  });

  const createInputRef = useRef(null);

  // ── Store selectors ───────────────────────────────────────
  const campaigns = useCampaignStore((s) => s.campaigns);
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const createCampaign = useCampaignStore((s) => s.createCampaign);
  const switchCampaign = useCampaignStore((s) => s.switchCampaign);
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign);
  const resetActiveCampaign = useCampaignStore((s) => s.resetActiveCampaign);
  const saveCampaign = useCampaignStore((s) => s.saveCampaign);

  const simNodeStates = useSimulationStore((s) => s.nodeStates);
  const simFlagOverrides = useSimulationStore((s) => s.flagOverrides);
  const simStatusOverrides = useSimulationStore((s) => s.statusOverrides);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);

  const addToast = useUIStore((s) => s.addToast);

  // We read narrative state for stale reference pruning
  // Using getState() to avoid re-render on every narrative change
  const getNarrativeState = useCallback(() => useNarrativeStore.getState(), []);

  const flagCount = Object.keys(
    useNarrativeStore((s) => s.flag)
  ).length;
  const statusCount = Object.keys(
    useNarrativeStore((s) => s.status)
  ).length;

  // ── Campaign list sorted by name ──────────────────────────
  const campaignList = Object.values(campaigns).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // ── Focus create input when shown ─────────────────────────
  useEffect(() => {
    if (showCreate && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreate]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCampaign(trimmed);
    setNewName('');
    setShowCreate(false);
    addToast(`Campaign "${trimmed}" created`, 'success');
  }, [newName, createCampaign, addToast]);

  const handleSwitch = useCallback(
    (e) => {
      const targetId = e.target.value;
      if (targetId === '') {
        // Deselect — save current campaign first
        if (activeCampaignId) {
          saveCampaign({
            nodeStates: simNodeStates,
            flagOverrides: simFlagOverrides,
            statusOverrides: simStatusOverrides,
          });
        }
        resetSimulation();
        // Clear active campaign by switching to a non-existent ID won't work.
        // Instead we need to modify activeCampaignId directly — use store action
        useCampaignStore.setState({ activeCampaignId: null });
        return;
      }

      // Save current campaign state before switching
      if (activeCampaignId) {
        saveCampaign({
          nodeStates: simNodeStates,
          flagOverrides: simFlagOverrides,
          statusOverrides: simStatusOverrides,
        });
      }

      const campaign = switchCampaign(targetId);
      if (!campaign) return;

      // Prune stale references (R-03)
      const narrativeState = getNarrativeState();
      const { pruned, count } = pruneStaleCampaignRefs(campaign, narrativeState);
      if (count > 0) {
        // Update the campaign with pruned data
        saveCampaign(pruned);
        addToast(
          `Campaign cleaned: removed ${count} stale reference${count !== 1 ? 's' : ''}.`,
          'warning'
        );
      }

      // Load the (possibly pruned) campaign state into simulation store
      const finalState = count > 0 ? pruned : campaign;
      useSimulationStore.setState({
        nodeStates: finalState.nodeStates || {},
        flagOverrides: finalState.flagOverrides || {},
        statusOverrides: finalState.statusOverrides || {},
      });
    },
    [
      activeCampaignId,
      saveCampaign,
      switchCampaign,
      simNodeStates,
      simFlagOverrides,
      simStatusOverrides,
      resetSimulation,
      getNarrativeState,
      addToast,
    ]
  );

  const handleDelete = useCallback(() => {
    if (!activeCampaignId) return;
    const name = campaigns[activeCampaignId]?.name ?? 'campaign';
    deleteCampaign(activeCampaignId);
    resetSimulation();
    addToast(`Campaign "${name}" deleted`, 'info');
  }, [activeCampaignId, campaigns, deleteCampaign, resetSimulation, addToast]);

  const handleReset = useCallback(() => {
    if (!activeCampaignId) return;
    resetActiveCampaign();
    // Also reset simulation store to match
    useSimulationStore.setState({
      nodeStates: {},
      flagOverrides: {},
      statusOverrides: {},
    });
    addToast('Campaign state reset', 'info');
  }, [activeCampaignId, resetActiveCampaign, addToast]);

  const handleSave = useCallback(() => {
    if (!activeCampaignId) return;
    saveCampaign({
      nodeStates: simNodeStates,
      flagOverrides: simFlagOverrides,
      statusOverrides: simStatusOverrides,
    });
    addToast('Campaign saved', 'success');
  }, [activeCampaignId, saveCampaign, simNodeStates, simFlagOverrides, simStatusOverrides, addToast]);

  const toggleSection = useCallback((section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={`campaign-panel${collapsed ? ' campaign-panel--collapsed' : ''}`}>
      {/* Toggle header */}
      <button
        className="campaign-panel__toggle"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span
          className={`campaign-panel__toggle-icon${
            collapsed ? '' : ' campaign-panel__toggle-icon--expanded'
          }`}
        >
          <Scroll size={14} />
        </span>
        <span className="campaign-panel__toggle-label">Campaigns</span>
        <span className="campaign-panel__toggle-badge">
          {campaignList.length}
        </span>
        <span
          className={`campaign-panel__toggle-icon${
            collapsed ? '' : ' campaign-panel__toggle-icon--expanded'
          }`}
        >
          <ChevronDown size={14} />
        </span>
      </button>

      {/* Body (hidden when collapsed) */}
      {!collapsed && (
        <div className="campaign-panel__body">
          {/* ── Campaign selector row ─────────────────────── */}
          <div className="campaign-selector">
            <div className="campaign-selector__row">
              <select
                className="campaign-selector__select"
                value={activeCampaignId ?? ''}
                onChange={handleSwitch}
              >
                <option value="">— none —</option>
                {campaignList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                className="campaign-selector__btn campaign-selector__btn--create"
                title="Create new campaign"
                onClick={() => setShowCreate((s) => !s)}
              >
                <Plus size={14} />
              </button>

              <button
                className="campaign-selector__btn"
                title="Save current state to campaign"
                disabled={!activeCampaignId}
                onClick={handleSave}
              >
                <Save size={14} />
              </button>

              <button
                className="campaign-selector__btn"
                title="Reset campaign state"
                disabled={!activeCampaignId}
                onClick={handleReset}
              >
                <RotateCcw size={14} />
              </button>

              <button
                className="campaign-selector__btn campaign-selector__btn--danger"
                title="Delete campaign"
                disabled={!activeCampaignId}
                onClick={handleDelete}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Create input */}
            {showCreate && (
              <div className="campaign-selector__create-row">
                <input
                  ref={createInputRef}
                  className="campaign-selector__input"
                  type="text"
                  placeholder="Campaign name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setShowCreate(false);
                      setNewName('');
                    }
                  }}
                />
                <button
                  className="campaign-selector__btn campaign-selector__btn--create"
                  title="Confirm create"
                  disabled={!newName.trim()}
                  onClick={handleCreate}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Content — requires active campaign ────────── */}
          {!activeCampaignId ? (
            <div className="campaign-panel__empty">
              Select or create a campaign to begin simulation.
            </div>
          ) : (
            <>
              {/* ── Flag overrides section ─────────────────── */}
              <div className="campaign-panel__section">
                <button
                  className="campaign-panel__section-header"
                  onClick={() => toggleSection('flags')}
                >
                  <span
                    className={`campaign-panel__section-chevron${
                      openSections.flags ? ' campaign-panel__section-chevron--open' : ''
                    }`}
                  >
                    <ChevronRight size={12} />
                  </span>
                  Flags
                  <span className="campaign-panel__section-count">
                    {flagCount}
                  </span>
                </button>
                {openSections.flags && (
                  <div className="campaign-panel__section-content">
                    <FlagOverridePanel />
                  </div>
                )}
              </div>

              {/* ── Status overrides section ───────────────── */}
              <div className="campaign-panel__section">
                <button
                  className="campaign-panel__section-header"
                  onClick={() => toggleSection('status')}
                >
                  <span
                    className={`campaign-panel__section-chevron${
                      openSections.status ? ' campaign-panel__section-chevron--open' : ''
                    }`}
                  >
                    <ChevronRight size={12} />
                  </span>
                  Status Points
                  <span className="campaign-panel__section-count">
                    {statusCount}
                  </span>
                </button>
                {openSections.status && (
                  <div className="campaign-panel__section-content">
                    <StatusOverridePanel />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
