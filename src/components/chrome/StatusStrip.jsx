// ============================================================
// StatusStrip.jsx — Bottom status bar
// ============================================================
// Renders a fixed bottom bar showing:
//   - Active node count (nodes with status !== 'default')
//   - Active flags summary
//   - Status point values
//   - Simulation warnings count (unreachable nodes)
//
// Clicking a status strip item opens a detail popover.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/chrome/
//   AR-02: state from Zustand stores
//   AR-09: styles consume tokens via StatusStrip.css
// ============================================================

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Activity,
  Flag,
  BarChart3,
  AlertTriangle,
  Boxes,
  GitFork,
  Hexagon,
} from 'lucide-react';

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';

import './StatusStrip.css';

/**
 * StatusStrip — Bottom status bar.
 */
function StatusStrip() {
  const common = useNarrativeStore((s) => s.common);
  const choice = useNarrativeStore((s) => s.choice);
  const ending = useNarrativeStore((s) => s.ending);
  const flags = useNarrativeStore((s) => s.flag);
  const statusPoints = useNarrativeStore((s) => s.status);
  const nodeStates = useSimulationStore((s) => s.nodeStates);
  const flagOverrides = useSimulationStore((s) => s.flagOverrides);
  const statusOverrides = useSimulationStore((s) => s.statusOverrides);
  const unreachableNodes = useSimulationStore((s) => s.unreachableNodes);

  const [activeDetail, setActiveDetail] = useState(null);
  const detailRef = useRef(null);

  // ── Computed stats ────────────────────────────────────────

  const totalNodes = useMemo(
    () =>
      Object.keys(common).length +
      Object.keys(choice).length +
      Object.keys(ending).length,
    [common, choice, ending]
  );

  const activeNodeCount = useMemo(() => {
    let count = 0;
    for (const nodeState of Object.values(nodeStates)) {
      if (nodeState.status && nodeState.status !== 'default') {
        count++;
      }
    }
    return count;
  }, [nodeStates]);

  const activeFlagsList = useMemo(() => {
    const result = [];
    for (const [flagId, flag] of Object.entries(flags)) {
      const overrideValue = flagOverrides[flagId];
      const effectiveValue = overrideValue ?? flag.state;
      result.push({
        id: flagId,
        name: flag.name || flagId,
        value: effectiveValue,
        isOverridden: overrideValue != null,
      });
    }
    return result;
  }, [flags, flagOverrides]);

  const activeFlagCount = useMemo(
    () => activeFlagsList.filter((f) => f.value).length,
    [activeFlagsList]
  );

  const statusValuesList = useMemo(() => {
    const result = [];
    for (const [spId, sp] of Object.entries(statusPoints)) {
      const overrideValue = statusOverrides[spId];
      const effectiveValue = overrideValue ?? sp.value;
      result.push({
        id: spId,
        name: sp.name || spId,
        value: effectiveValue,
        isOverridden: overrideValue != null,
      });
    }
    return result;
  }, [statusPoints, statusOverrides]);

  const warningCount = useMemo(() => {
    if (unreachableNodes instanceof Set) return unreachableNodes.size;
    return 0;
  }, [unreachableNodes]);

  // ── Detail popover toggle ─────────────────────────────────

  const toggleDetail = useCallback(
    (detailType) => {
      setActiveDetail((prev) => (prev === detailType ? null : detailType));
    },
    []
  );

  // Close detail on click outside
  useEffect(() => {
    if (!activeDetail) return;

    const handleClick = (e) => {
      if (detailRef.current && !detailRef.current.contains(e.target)) {
        // Check if clicked on a status strip item
        const stripItem = e.target.closest('.status-strip__item');
        if (!stripItem) {
          setActiveDetail(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeDetail]);

  // ── Render detail popover ─────────────────────────────────

  function renderDetail() {
    if (!activeDetail) return null;

    let content;
    let title;
    let position = 'left: var(--space-3)';

    switch (activeDetail) {
      case 'nodes':
        title = 'Node Summary';
        content = (
          <ul className="status-strip__detail-list">
            <li className="status-strip__detail-row">
              <span className="status-strip__detail-name">Common Nodes</span>
              <span className="status-strip__detail-value">
                {Object.keys(common).length}
              </span>
            </li>
            <li className="status-strip__detail-row">
              <span className="status-strip__detail-name">Choices</span>
              <span className="status-strip__detail-value">
                {Object.keys(choice).length}
              </span>
            </li>
            <li className="status-strip__detail-row">
              <span className="status-strip__detail-name">Endings</span>
              <span className="status-strip__detail-value">
                {Object.keys(ending).length}
              </span>
            </li>
            <li className="status-strip__detail-row">
              <span className="status-strip__detail-name">Active</span>
              <span className="status-strip__detail-value">{activeNodeCount}</span>
            </li>
          </ul>
        );
        break;

      case 'flags':
        title = `Flags (${activeFlagCount} active)`;
        content =
          activeFlagsList.length === 0 ? (
            <div className="status-strip__detail-empty">No flags defined</div>
          ) : (
            <ul className="status-strip__detail-list">
              {activeFlagsList.map((f) => (
                <li key={f.id} className="status-strip__detail-row">
                  <span className="status-strip__detail-name">{f.name}</span>
                  <span
                    className={`status-strip__detail-value ${
                      f.value
                        ? 'status-strip__detail-value--true'
                        : 'status-strip__detail-value--false'
                    }`}
                  >
                    {f.value ? 'TRUE' : 'FALSE'}
                    {f.isOverridden ? ' ⚡' : ''}
                  </span>
                </li>
              ))}
            </ul>
          );
        break;

      case 'status':
        title = 'Status Points';
        content =
          statusValuesList.length === 0 ? (
            <div className="status-strip__detail-empty">No status points defined</div>
          ) : (
            <ul className="status-strip__detail-list">
              {statusValuesList.map((s) => (
                <li key={s.id} className="status-strip__detail-row">
                  <span className="status-strip__detail-name">{s.name}</span>
                  <span className="status-strip__detail-value">
                    {s.value}
                    {s.isOverridden ? ' ⚡' : ''}
                  </span>
                </li>
              ))}
            </ul>
          );
        break;

      case 'warnings':
        title = `Warnings (${warningCount})`;
        content =
          warningCount === 0 ? (
            <div className="status-strip__detail-empty">No warnings</div>
          ) : (
            <ul className="status-strip__detail-list">
              {[...(unreachableNodes instanceof Set ? unreachableNodes : [])].map(
                (nodeId) => (
                  <li key={nodeId} className="status-strip__detail-row">
                    <span className="status-strip__detail-name">{nodeId}</span>
                    <span className="status-strip__detail-value">Unreachable</span>
                  </li>
                )
              )}
            </ul>
          );
        position = 'right: var(--space-3)';
        break;

      default:
        return null;
    }

    return (
      <div
        ref={detailRef}
        className="status-strip__detail"
        style={{ [position.split(':')[0].trim()]: position.split(':')[1].trim() }}
      >
        <div className="status-strip__detail-title">{title}</div>
        {content}
      </div>
    );
  }

  return (
    <>
      <footer className="status-strip" id="status-strip">
        {/* Node count */}
        <div
          className="status-strip__item"
          id="status-strip-nodes"
          onClick={() => toggleDetail('nodes')}
          title="Total nodes / Active nodes"
        >
          <Boxes className="status-strip__item-icon" />
          <span>
            <span className="status-strip__item-value">{totalNodes}</span> nodes
          </span>
          {activeNodeCount > 0 && (
            <>
              <span>·</span>
              <span className="status-strip__item-value">{activeNodeCount}</span>
              <span>active</span>
            </>
          )}
        </div>

        <div className="status-strip__divider" />

        {/* Flags summary */}
        <div
          className="status-strip__item status-strip__item--accent"
          id="status-strip-flags"
          onClick={() => toggleDetail('flags')}
          title="Active flags"
        >
          <Flag className="status-strip__item-icon" />
          <span>
            <span className="status-strip__item-value">{activeFlagCount}</span>
            /{Object.keys(flags).length} flags
          </span>
        </div>

        <div className="status-strip__divider" />

        {/* Status points */}
        <div
          className="status-strip__item"
          id="status-strip-status"
          onClick={() => toggleDetail('status')}
          title="Status points"
        >
          <BarChart3 className="status-strip__item-icon" />
          <span>
            <span className="status-strip__item-value">
              {Object.keys(statusPoints).length}
            </span>{' '}
            status
          </span>
        </div>

        <div className="status-strip__spacer" />

        {/* Simulation warnings */}
        {warningCount > 0 && (
          <>
            <div className="status-strip__divider" />
            <div
              className="status-strip__item status-strip__item--warning"
              id="status-strip-warnings"
              onClick={() => toggleDetail('warnings')}
              title="Simulation warnings"
            >
              <AlertTriangle className="status-strip__item-icon" />
              <span>
                <span className="status-strip__item-value">{warningCount}</span>{' '}
                warning{warningCount !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </footer>

      {/* Detail popover */}
      {renderDetail()}
    </>
  );
}

export default StatusStrip;
