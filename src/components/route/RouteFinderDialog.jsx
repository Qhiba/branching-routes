// ============================================================
// RouteFinderDialog.jsx — Modal for source/target selection + filters
// ============================================================
// Provides a modal UI for selecting a route tracing mode,
// source/target nodes, and optional filters. Dispatches
// route tracing calls and shows results via toast + overlay.
//
// Modes:
//   1. All Paths — find all paths from source to target
//   2. Shortest Path — fewest-node path
//   3. How to reach? (Mode A) — path from entry to target
//   4. What do I need? (Mode B) — required flags/statuses
//
// Dependencies: routeTracer, pathAnnotator, useNarrativeStore, useUIStore
// Architecture: AR-01 (PascalCase.jsx), AR-02 (Zustand state), AR-09 (tokens)
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { X, Route, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import {
  findAllPaths,
  findShortestPath,
  findPathToGoal,
  findRequirementsForGoal,
  filterPaths,
} from '@/engine/routeTracer.js';
import { annotatePath } from '@/engine/pathAnnotator.js';

import './RouteFinderDialog.css';

// ── Trace modes ─────────────────────────────────────────────

const MODES = [
  { id: 'all', label: 'All Paths' },
  { id: 'shortest', label: 'Shortest' },
  { id: 'mode_a', label: 'How to reach?' },
  { id: 'mode_b', label: 'What do I need?' },
];

// ── Component ───────────────────────────────────────────────

/**
 * RouteFinderDialog — modal for selecting source/target nodes,
 * trace mode, and optional filters for route analysis.
 *
 * @param {object} props
 * @param {boolean} props.isOpen — whether the dialog is visible
 * @param {function} props.onClose — called to close the dialog
 * @param {function} props.onResult — called with { mode, paths, annotatedPaths, requirements, path }
 */
function RouteFinderDialog({ isOpen, onClose, onResult }) {
  const [mode, setMode] = useState('shortest');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPathId, setFilterPathId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [filterFlagId, setFilterFlagId] = useState('');
  const [filterStatusId, setFilterStatusId] = useState('');
  const [result, setResult] = useState(null);

  // Store selectors
  const common = useNarrativeStore((s) => s.common);
  const choice = useNarrativeStore((s) => s.choice);
  const ending = useNarrativeStore((s) => s.ending);
  const flag = useNarrativeStore((s) => s.flag);
  const status = useNarrativeStore((s) => s.status);
  const pathEntities = useNarrativeStore((s) => s.path);
  const chapterEntities = useNarrativeStore((s) => s.chapter);
  const metadata = useNarrativeStore((s) => s.metadata);
  const addToast = useUIStore((s) => s.addToast);
  const flagOverrides = useSimulationStore((s) => s.flagOverrides);
  const statusOverrides = useSimulationStore((s) => s.statusOverrides);

  // Build node list for dropdowns
  const nodeOptions = useMemo(() => {
    const options = [];
    for (const node of Object.values(common)) {
      options.push({ id: node.id, label: `${node.id} — ${node.name || '(unnamed)'}`, type: 'common' });
    }
    for (const ch of Object.values(choice)) {
      options.push({ id: ch.id, label: `${ch.id} — ${ch.text || '(unnamed)'}`, type: 'choice' });
    }
    for (const e of Object.values(ending)) {
      options.push({ id: e.id, label: `${e.id} — ${e.name || '(unnamed)'}`, type: 'ending' });
    }
    return options.sort((a, b) => a.id.localeCompare(b.id));
  }, [common, choice, ending]);

  // Build flag/status/path/chapter options for filter dropdowns
  const flagOptions = useMemo(() =>
    Object.values(flag).map((f) => ({ id: f.id, label: `${f.id} — ${f.name || f.id}` })),
    [flag]
  );
  const statusOptions = useMemo(() =>
    Object.values(status).map((s) => ({ id: s.id, label: `${s.id} — ${s.name || s.id}` })),
    [status]
  );
  const pathOptions = useMemo(() =>
    Object.values(pathEntities).map((p) => ({ id: p.id, label: `${p.id} — ${p.name || p.id}` })),
    [pathEntities]
  );
  const chapterOptions = useMemo(() =>
    Object.values(chapterEntities).map((c) => ({ id: c.id, label: `${c.id} — ${c.name || c.id}` })),
    [chapterEntities]
  );

  // Build merged flag/status maps (same logic as simulationEngine)
  const buildFlagMap = useCallback(() => {
    const map = {};
    for (const [id, f] of Object.entries(flag)) {
      map[id] = flagOverrides[id] ?? f.state ?? false;
    }
    for (const [id, value] of Object.entries(flagOverrides)) {
      if (!(id in map)) map[id] = value;
    }
    return map;
  }, [flag, flagOverrides]);

  const buildStatusMap = useCallback(() => {
    const map = {};
    for (const [id, sp] of Object.entries(status)) {
      map[id] = statusOverrides[id] ?? sp.value ?? 0;
    }
    for (const [id, value] of Object.entries(statusOverrides)) {
      if (!(id in map)) map[id] = value;
    }
    return map;
  }, [status, statusOverrides]);

  // Get full narrative data
  const getNarrativeData = useCallback(() => {
    return useNarrativeStore.getState();
  }, []);

  // Can we run the trace?
  const canRun = useMemo(() => {
    if (mode === 'mode_a' || mode === 'mode_b') {
      return targetId !== '';
    }
    return sourceId !== '' && targetId !== '';
  }, [mode, sourceId, targetId]);

  // ── Run trace ─────────────────────────────────────────────

  const handleTrace = useCallback(() => {
    const narrativeData = getNarrativeData();
    const flagMap = buildFlagMap();
    const statusMap = buildStatusMap();
    const entryNode = metadata.entry_node;

    setResult(null);

    try {
      if (mode === 'all') {
        let paths = findAllPaths(narrativeData, sourceId, targetId, flagMap, statusMap);

        // Apply filters
        const filters = {};
        if (filterPathId) filters.pathId = filterPathId;
        if (filterChapterId) filters.chapterId = filterChapterId;
        if (filterFlagId) filters.flagId = filterFlagId;
        if (filterStatusId) filters.statusId = filterStatusId;
        paths = filterPaths(paths, filters, narrativeData);

        const annotatedPaths = paths.map((p) => annotatePath(p, narrativeData));

        if (paths.length === 0) {
          setResult({ type: 'error', message: 'No paths found between these nodes' });
          addToast('No paths found', 'warning');
        } else {
          setResult({ type: 'success', message: `Found ${paths.length} path(s)` });
          addToast(`Found ${paths.length} path(s) from ${sourceId} to ${targetId}`, 'success');
          onResult?.({ mode, paths, annotatedPaths });
        }

      } else if (mode === 'shortest') {
        const path = findShortestPath(narrativeData, sourceId, targetId, flagMap, statusMap);

        if (!path) {
          setResult({ type: 'error', message: 'No path found between these nodes' });
          addToast('No path found', 'warning');
        } else {
          const annotated = annotatePath(path, narrativeData);
          setResult({ type: 'success', message: `Shortest path: ${annotated.summary}` });
          addToast(`Shortest path: ${annotated.summary}`, 'success');
          onResult?.({ mode, paths: [path], annotatedPaths: [annotated] });
        }

      } else if (mode === 'mode_a') {
        const source = entryNode || sourceId;
        if (!source) {
          setResult({ type: 'error', message: 'No entry node set and no source selected' });
          return;
        }

        const { path, failedConditions } = findPathToGoal(narrativeData, source, targetId, flagMap, statusMap);

        if (!path) {
          const reason = failedConditions[0]?.reason || 'Unknown reason';
          setResult({ type: 'error', message: `Cannot reach target: ${reason}` });
          addToast(`Cannot reach ${targetId}: ${reason}`, 'warning');
        } else if (failedConditions.length > 0) {
          const annotated = annotatePath(path, narrativeData);
          setResult({
            type: 'warning',
            message: `Path exists but ${failedConditions.length} condition(s) fail`,
            failedConditions,
          });
          addToast(`Path to ${targetId} found but ${failedConditions.length} conditions fail`, 'warning');
          onResult?.({ mode, paths: [path], annotatedPaths: [annotated], failedConditions });
        } else {
          const annotated = annotatePath(path, narrativeData);
          setResult({ type: 'success', message: `Path found: ${annotated.summary}` });
          addToast(`Path to ${targetId}: ${annotated.summary}`, 'success');
          onResult?.({ mode, paths: [path], annotatedPaths: [annotated] });
        }

      } else if (mode === 'mode_b') {
        const source = entryNode || sourceId;
        if (!source) {
          setResult({ type: 'error', message: 'No entry node set and no source selected' });
          return;
        }

        const requirements = findRequirementsForGoal(narrativeData, source, targetId);

        if (requirements.timedOut) {
          setResult({ type: 'warning', message: 'Analysis timed out (graph too complex)', timedOut: true });
          addToast('Route analysis timed out — graph too complex', 'warning');
        } else if (!requirements.reachable) {
          setResult({ type: 'error', message: 'Target is not reachable from entry node' });
          addToast(`${targetId} is not reachable`, 'warning');
        } else {
          setResult({ type: 'success', message: 'Requirements analyzed', requirements });

          // Build toast message
          const flagCount = requirements.requiredFlags.length;
          const statusCount = requirements.requiredStatuses.length;
          let msg = `Requirements for ${targetId}: `;
          if (flagCount === 0 && statusCount === 0) {
            msg += 'none (unconditional path exists)';
          } else {
            const parts = [];
            if (flagCount > 0) parts.push(`${flagCount} flag(s)`);
            if (statusCount > 0) parts.push(`${statusCount} status condition(s)`);
            msg += parts.join(', ');
          }
          addToast(msg, 'info');
          onResult?.({ mode, requirements });
        }
      }
    } catch (err) {
      setResult({ type: 'error', message: `Trace error: ${err.message}` });
      addToast(`Route trace failed: ${err.message}`, 'error');
    }
  }, [
    mode, sourceId, targetId, filterPathId, filterChapterId,
    filterFlagId, filterStatusId, getNarrativeData, buildFlagMap,
    buildStatusMap, metadata.entry_node, addToast, onResult,
  ]);

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────

  const needsSource = mode === 'all' || mode === 'shortest';

  return (
    <div className="route-finder-backdrop" onClick={onClose} id="route-finder-backdrop">
      <div className="route-finder-dialog" onClick={(e) => e.stopPropagation()} id="route-finder-dialog">
        {/* Header */}
        <div className="route-finder-header">
          <h2><Route size={18} /> Route Finder</h2>
          <button className="route-finder-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="route-finder-body">
          {/* Mode selector */}
          <div className="route-finder-modes" id="route-finder-modes">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`route-finder-mode-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => { setMode(m.id); setResult(null); }}
                id={`route-mode-${m.id}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Source node (only for All Paths and Shortest) */}
          {needsSource && (
            <div className="route-finder-field" id="route-field-source">
              <label htmlFor="route-source">Source Node</label>
              <select
                id="route-source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">— Select source —</option>
                {nodeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mode A/B hint */}
          {(mode === 'mode_a' || mode === 'mode_b') && (
            <div className="route-finder-status">
              <AlertCircle size={14} />
              Source: entry node ({metadata.entry_node || 'not set'})
            </div>
          )}

          {/* Target node */}
          <div className="route-finder-field" id="route-field-target">
            <label htmlFor="route-target">Target Node</label>
            <select
              id="route-target"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">— Select target —</option>
              {nodeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filters (collapsible, only for All Paths) */}
          {mode === 'all' && (
            <div className="route-finder-filters">
              <button
                className="route-finder-filters-toggle"
                onClick={() => setShowFilters((p) => !p)}
                id="route-filters-toggle"
              >
                {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Filters
              </button>

              {showFilters && (
                <div className="route-finder-filters-content">
                  {/* Filter by Path */}
                  <div className="route-finder-field">
                    <label htmlFor="route-filter-path">Path</label>
                    <select id="route-filter-path" value={filterPathId} onChange={(e) => setFilterPathId(e.target.value)}>
                      <option value="">Any</option>
                      {pathOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Chapter */}
                  <div className="route-finder-field">
                    <label htmlFor="route-filter-chapter">Chapter</label>
                    <select id="route-filter-chapter" value={filterChapterId} onChange={(e) => setFilterChapterId(e.target.value)}>
                      <option value="">Any</option>
                      {chapterOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Flag */}
                  <div className="route-finder-field">
                    <label htmlFor="route-filter-flag">Sets Flag</label>
                    <select id="route-filter-flag" value={filterFlagId} onChange={(e) => setFilterFlagId(e.target.value)}>
                      <option value="">Any</option>
                      {flagOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <div className="route-finder-field">
                    <label htmlFor="route-filter-status">Modifies Status</label>
                    <select id="route-filter-status" value={filterStatusId} onChange={(e) => setFilterStatusId(e.target.value)}>
                      <option value="">Any</option>
                      {statusOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result status */}
          {result && (
            <div className={`route-finder-status route-finder-status--${result.type}`} id="route-result-status">
              {result.type === 'error' && <AlertCircle size={14} />}
              {result.type === 'success' && <CheckCircle2 size={14} />}
              {result.type === 'warning' && <AlertTriangle size={14} />}
              {result.message}
            </div>
          )}

          {/* Requirements (Mode B results) */}
          {result?.requirements && (
            <div className="route-finder-requirements" id="route-requirements">
              <h4>Required Flags</h4>
              {result.requirements.requiredFlags.length === 0 && (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  None
                </span>
              )}
              {result.requirements.requiredFlags.map((fid) => (
                <div key={fid} className="route-finder-req-item">
                  <span className="req-badge req-badge--flag">FLAG</span>
                  {flag[fid]?.name || fid} = true
                </div>
              ))}

              <h4>Required Statuses</h4>
              {result.requirements.requiredStatuses.length === 0 && (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  None
                </span>
              )}
              {result.requirements.requiredStatuses.map((s, i) => (
                <div key={i} className="route-finder-req-item">
                  <span className="req-badge req-badge--status">STATUS</span>
                  {status[s.statusId]?.name || s.statusId}
                  {s.min != null && ` ≥ ${s.min}`}
                  {s.min != null && s.max != null && ' and'}
                  {s.max != null && ` ≤ ${s.max}`}
                </div>
              ))}

              {result.timedOut && (
                <div className="route-finder-status route-finder-status--warning">
                  <Timer size={14} /> Analysis timed out — results may be incomplete
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="route-finder-footer">
          <button
            className="route-finder-btn route-finder-btn--secondary"
            onClick={onClose}
            id="route-cancel-btn"
          >
            Cancel
          </button>
          <button
            className="route-finder-btn route-finder-btn--primary"
            onClick={handleTrace}
            disabled={!canRun}
            id="route-trace-btn"
          >
            <Route size={14} /> Trace Route
          </button>
        </div>
      </div>
    </div>
  );
}

export default RouteFinderDialog;
