// ============================================================
// InspectorPanel.jsx — Draggable floating editor panel
// ============================================================
// A Figma-style floating inspector panel that renders
// context-sensitive field editors based on the selected entity
// type. Supports dragging, dismissal, and pinning.
//
// Field ordering follows the spec §2.1:
//   identity → classification → content → prerequisites →
//   side effects → routing
//
// Entity types supported:
//   - Common Node (N###)
//   - Choice (CH###)
//   - Ending (E###)
//   - Flag (F###)
//   - Status Point (SP###)
//   - Path (P###)
//   - Chapter (C###)
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/
//   AR-02: all state from useUIStore / useNarrativeStore
//   AR-07: name sanitization happens in the store, not here
//   AR-09: styles via InspectorPanel.css with tokens
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '@/store/useUIStore.js';
import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import {
  X,
  Pin,
  PinOff,
  Square,
  GitBranch,
  Flag as FlagIcon,
  Bookmark,
  BarChart2,
  Route,
  BookOpen,
} from 'lucide-react';

// ── Field components ─────────────────────────────────────────
import TextField from './fields/TextField.jsx';
import SelectField from './fields/SelectField.jsx';
import ConditionEditor from './fields/ConditionEditor.jsx';
import NextEditor from './fields/NextEditor.jsx';
import VariantEditor from './fields/VariantEditor.jsx';
import OptionEditor from './fields/OptionEditor.jsx';
import FlagSetEditor from './fields/FlagSetEditor.jsx';
import StatusSetEditor from './fields/StatusSetEditor.jsx';

import './InspectorPanel.css';

// ── Entity type detection ────────────────────────────────────

/**
 * Determine the entity type and collection key from a selected node ID.
 * Returns { type, collection, entity } or null if not found.
 */
function resolveEntity(nodeId, narrativeState) {
  if (!nodeId) return null;

  if (narrativeState.common[nodeId]) {
    return { type: 'common', collection: 'common', entity: narrativeState.common[nodeId] };
  }
  if (narrativeState.choice[nodeId]) {
    return { type: 'choice', collection: 'choice', entity: narrativeState.choice[nodeId] };
  }
  if (narrativeState.ending[nodeId]) {
    return { type: 'ending', collection: 'ending', entity: narrativeState.ending[nodeId] };
  }
  if (narrativeState.flag[nodeId]) {
    return { type: 'flag', collection: 'flag', entity: narrativeState.flag[nodeId] };
  }
  if (narrativeState.status[nodeId]) {
    return { type: 'status', collection: 'status', entity: narrativeState.status[nodeId] };
  }
  if (narrativeState.path[nodeId]) {
    return { type: 'path', collection: 'path', entity: narrativeState.path[nodeId] };
  }
  if (narrativeState.chapter[nodeId]) {
    return { type: 'chapter', collection: 'chapter', entity: narrativeState.chapter[nodeId] };
  }

  return null;
}

// ── Type label / icon mapping ────────────────────────────────

const TYPE_CONFIG = {
  common: { label: 'Common Node', icon: Square, accent: 'common' },
  choice: { label: 'Choice', icon: GitBranch, accent: 'choice' },
  ending: { label: 'Ending', icon: Bookmark, accent: 'ending' },
  flag: { label: 'Flag', icon: FlagIcon, accent: 'flag' },
  status: { label: 'Status Point', icon: BarChart2, accent: 'status' },
  path: { label: 'Path', icon: Route, accent: 'path' },
  chapter: { label: 'Chapter', icon: BookOpen, accent: 'chapter' },
};

// ── InspectorPanel component ─────────────────────────────────

function InspectorPanel() {
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const inspectorPinned = useUIStore((s) => s.inspectorPinned);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const closeInspector = useUIStore((s) => s.closeInspector);
  const pinInspector = useUIStore((s) => s.pinInspector);

  // Read the full narrative state to find the selected entity.
  // useShallow prevents infinite re-renders from new object references.
  const narrativeState = useNarrativeStore(useShallow((s) => ({
    metadata: s.metadata,
    common: s.common,
    choice: s.choice,
    ending: s.ending,
    flag: s.flag,
    status: s.status,
    path: s.path,
    chapter: s.chapter,
  })));

  // Store update actions
  const updateCommonNode = useNarrativeStore((s) => s.updateCommonNode);
  const updateChoice = useNarrativeStore((s) => s.updateChoice);
  const updateEnding = useNarrativeStore((s) => s.updateEnding);
  const updateFlag = useNarrativeStore((s) => s.updateFlag);
  const updateStatusPoint = useNarrativeStore((s) => s.updateStatusPoint);
  const updatePath = useNarrativeStore((s) => s.updatePath);
  const updateChapter = useNarrativeStore((s) => s.updateChapter);

  // ── Dragging state ─────────────────────────────────────────
  const panelRef = useRef(null);
  const [position, setPosition] = useState({ x: 16, y: 56 });
  const dragStartRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    // Only drag from the header area
    if (e.target.closest('.inspector-panel__body')) return;
    e.preventDefault();
    dragStartRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };

    const handleDragMove = (moveEvent) => {
      if (!dragStartRef.current) return;
      const newX = moveEvent.clientX - dragStartRef.current.startX;
      const newY = moveEvent.clientY - dragStartRef.current.startY;
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - 100)),
        y: Math.max(0, Math.min(newY, window.innerHeight - 100)),
      });
    };

    const handleDragEnd = () => {
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [position]);

  // ── Close handler ──────────────────────────────────────────
  const handleClose = useCallback(() => {
    // AP8: dismissal path — could check dirty state here in the future
    closeInspector();
  }, [closeInspector]);

  // ── Pin handler ────────────────────────────────────────────
  const handleTogglePin = useCallback(() => {
    pinInspector();
  }, [pinInspector]);

  // ── Early return if not open ───────────────────────────────
  if (!inspectorOpen) return null;

  // ── Resolve entity ─────────────────────────────────────────
  const resolved = resolveEntity(selectedNodeId, narrativeState);

  if (!resolved && !inspectorPinned) {
    return null;
  }

  // When pinned but no entity selected, show empty state
  if (!resolved) {
    return (
      <div
        className="inspector-panel"
        ref={panelRef}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleDragStart}
        id="inspector-panel"
      >
        <div className="inspector-panel__header">
          <span className="inspector-panel__title">Inspector</span>
          <div className="inspector-panel__header-actions">
            <button
              className={`inspector-panel__pin-btn ${inspectorPinned ? 'inspector-panel__pin-btn--active' : ''}`}
              onClick={handleTogglePin}
              title={inspectorPinned ? 'Unpin' : 'Pin'}
              type="button"
            >
              {inspectorPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              className="inspector-panel__close-btn"
              onClick={handleClose}
              title="Close (Esc)"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="inspector-panel__body">
          <div className="inspector-panel__empty">
            No entity selected
          </div>
        </div>
      </div>
    );
  }

  const { type, entity } = resolved;
  const config = TYPE_CONFIG[type];
  const IconComponent = config.icon;

  // ── Generic update helper ──────────────────────────────────
  const updateEntity = (updates) => {
    switch (type) {
      case 'common':
        updateCommonNode(entity.id, updates);
        break;
      case 'choice':
        updateChoice(entity.id, updates);
        break;
      case 'ending':
        updateEnding(entity.id, updates);
        break;
      case 'flag':
        updateFlag(entity.id, updates);
        break;
      case 'status':
        updateStatusPoint(entity.id, updates);
        break;
      case 'path':
        updatePath(entity.id, updates);
        break;
      case 'chapter':
        updateChapter(entity.id, updates);
        break;
    }
  };

  // ── Build options for chapter/path selectors ───────────────
  const chapterOptions = Object.values(narrativeState.chapter).map((ch) => ({
    value: ch.id,
    label: ch.name || ch.id,
  }));

  const pathOptions = Object.values(narrativeState.path).map((p) => ({
    value: p.id,
    label: p.name || p.id,
  }));

  const commonNodeTypeOptions = (narrativeState.metadata.common_node_types || []).map((t) => ({
    value: t,
    label: t,
  }));

  const endingTypeOptions = (narrativeState.metadata.ending_types || []).map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <div
      className={`inspector-panel inspector-panel--${config.accent}`}
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleDragStart}
      id="inspector-panel"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="inspector-panel__header">
        <div className="inspector-panel__title-row">
          <IconComponent size={14} className="inspector-panel__type-icon" />
          <span className="inspector-panel__title">{config.label}</span>
          <span className="inspector-panel__id">{entity.id}</span>
        </div>
        <div className="inspector-panel__header-actions">
          <button
            className={`inspector-panel__pin-btn ${inspectorPinned ? 'inspector-panel__pin-btn--active' : ''}`}
            onClick={handleTogglePin}
            title={inspectorPinned ? 'Unpin' : 'Pin'}
            type="button"
          >
            {inspectorPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            className="inspector-panel__close-btn"
            onClick={handleClose}
            title="Close (Esc)"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body: field sections ─────────────────────────────── */}
      <div className="inspector-panel__body">
        {/* ── COMMON NODE FIELDS ────────────────────────────── */}
        {type === 'common' && (
          <>
            {/* Identity */}
            <InspectorSection title="Identity">
              <TextField
                label="Name"
                value={entity.name}
                onChange={(v) => updateEntity({ name: v })}
                placeholder="node_name"
                id={`inspector-name-${entity.id}`}
              />
            </InspectorSection>

            {/* Classification */}
            <InspectorSection title="Classification">
              <SelectField
                label="Type"
                value={entity.type}
                onChange={(v) => updateEntity({ type: v })}
                options={commonNodeTypeOptions}
              />
              <SelectField
                label="Chapter"
                value={entity.chapter}
                onChange={(v) => updateEntity({ chapter: v })}
                options={chapterOptions}
                placeholder="— No chapter —"
              />
              <SelectField
                label="Path"
                value={entity.path}
                onChange={(v) => updateEntity({ path: v })}
                options={pathOptions}
                placeholder="— No path —"
              />
            </InspectorSection>

            {/* Content */}
            <InspectorSection title="Content">
              <TextField
                label="Description"
                value={entity.description}
                onChange={(v) => updateEntity({ description: v })}
                placeholder="Narrative description..."
                multiline
                id={`inspector-description-${entity.id}`}
              />
              <VariantEditor
                value={entity.variants}
                onChange={(v) => updateEntity({ variants: v })}
              />
            </InspectorSection>

            {/* Prerequisites */}
            <InspectorSection title="Prerequisites">
              <ConditionEditor
                label="Requires"
                value={entity.requires}
                onChange={(v) => updateEntity({ requires: v })}
              />
            </InspectorSection>

            {/* Side Effects */}
            <InspectorSection title="Side Effects">
              <FlagSetEditor
                value={entity.flags_set}
                onChange={(v) => updateEntity({ flags_set: v })}
              />
              <StatusSetEditor
                value={entity.status_set}
                onChange={(v) => updateEntity({ status_set: v })}
              />
            </InspectorSection>

            {/* Routing */}
            <InspectorSection title="Routing">
              <NextEditor
                value={entity.next}
                onChange={(v) => updateEntity({ next: v })}
              />
            </InspectorSection>
          </>
        )}

        {/* ── CHOICE FIELDS ─────────────────────────────────── */}
        {type === 'choice' && (
          <>
            {/* Identity */}
            <InspectorSection title="Identity">
              <TextField
                label="Text"
                value={entity.text}
                onChange={(v) => updateEntity({ text: v })}
                placeholder="Choice prompt text..."
                multiline
                id={`inspector-text-${entity.id}`}
              />
            </InspectorSection>

            {/* Classification */}
            <InspectorSection title="Classification">
              <SelectField
                label="Chapter"
                value={entity.chapter}
                onChange={(v) => updateEntity({ chapter: v })}
                options={chapterOptions}
                placeholder="— No chapter —"
              />
              <SelectField
                label="Path"
                value={entity.path}
                onChange={(v) => updateEntity({ path: v })}
                options={pathOptions}
                placeholder="— No path —"
              />
            </InspectorSection>

            {/* Prerequisites */}
            <InspectorSection title="Prerequisites">
              <ConditionEditor
                label="Requires"
                value={entity.requires}
                onChange={(v) => updateEntity({ requires: v })}
              />
            </InspectorSection>

            {/* Options (routing + side effects combined) */}
            <InspectorSection title="Options">
              <OptionEditor
                value={entity.options}
                onChange={(v) => updateEntity({ options: v })}
              />
            </InspectorSection>
          </>
        )}

        {/* ── ENDING FIELDS ─────────────────────────────────── */}
        {type === 'ending' && (
          <>
            {/* Identity */}
            <InspectorSection title="Identity">
              <TextField
                label="Name"
                value={entity.name}
                onChange={(v) => updateEntity({ name: v })}
                placeholder="ending_name"
                id={`inspector-name-${entity.id}`}
              />
            </InspectorSection>

            {/* Classification */}
            <InspectorSection title="Classification">
              <SelectField
                label="Type"
                value={entity.type}
                onChange={(v) => updateEntity({ type: v })}
                options={endingTypeOptions}
              />
              <SelectField
                label="Chapter"
                value={entity.chapter}
                onChange={(v) => updateEntity({ chapter: v })}
                options={chapterOptions}
                placeholder="— No chapter —"
              />
              <SelectField
                label="Path"
                value={entity.path}
                onChange={(v) => updateEntity({ path: v })}
                options={pathOptions}
                placeholder="— No path —"
              />
            </InspectorSection>

            {/* Prerequisites */}
            <InspectorSection title="Prerequisites">
              <ConditionEditor
                label="Requires"
                value={entity.requires}
                onChange={(v) => updateEntity({ requires: v })}
              />
            </InspectorSection>
          </>
        )}

        {/* ── FLAG FIELDS ───────────────────────────────────── */}
        {type === 'flag' && (
          <>
            <InspectorSection title="Identity">
              <TextField
                label="Name"
                value={entity.name}
                onChange={(v) => updateEntity({ name: v })}
                placeholder="flag_name"
                id={`inspector-name-${entity.id}`}
              />
            </InspectorSection>

            <InspectorSection title="Classification">
              <SelectField
                label="Chapter"
                value={entity.chapter}
                onChange={(v) => updateEntity({ chapter: v })}
                options={chapterOptions}
                placeholder="— No chapter —"
              />
              <SelectField
                label="Path"
                value={entity.path}
                onChange={(v) => updateEntity({ path: v })}
                options={pathOptions}
                placeholder="— No path —"
              />
            </InspectorSection>
          </>
        )}

        {/* ── STATUS POINT FIELDS ───────────────────────────── */}
        {type === 'status' && (
          <>
            <InspectorSection title="Identity">
              <TextField
                label="Name"
                value={entity.name}
                onChange={(v) => updateEntity({ name: v })}
                placeholder="status_name"
                id={`inspector-name-${entity.id}`}
              />
            </InspectorSection>

            <InspectorSection title="Configuration">
              <TextField
                label="Default Value"
                value={String(entity.value ?? 0)}
                onChange={(v) => updateEntity({ value: Number(v) || 0 })}
                id={`inspector-value-${entity.id}`}
              />
              <TextField
                label="Min Value"
                value={entity.minValue != null ? String(entity.minValue) : ''}
                onChange={(v) => updateEntity({ minValue: v === '' ? null : Number(v) })}
                placeholder="No minimum"
                id={`inspector-min-${entity.id}`}
              />
              <TextField
                label="Max Value"
                value={entity.maxValue != null ? String(entity.maxValue) : ''}
                onChange={(v) => updateEntity({ maxValue: v === '' ? null : Number(v) })}
                placeholder="No maximum"
                id={`inspector-max-${entity.id}`}
              />
            </InspectorSection>

            <InspectorSection title="Classification">
              <SelectField
                label="Chapter"
                value={entity.chapter}
                onChange={(v) => updateEntity({ chapter: v })}
                options={chapterOptions}
                placeholder="— No chapter —"
              />
              <SelectField
                label="Path"
                value={entity.path}
                onChange={(v) => updateEntity({ path: v })}
                options={pathOptions}
                placeholder="— No path —"
              />
            </InspectorSection>
          </>
        )}

        {/* ── PATH FIELDS ───────────────────────────────────── */}
        {type === 'path' && (
          <InspectorSection title="Identity">
            <TextField
              label="Name"
              value={entity.name}
              onChange={(v) => updateEntity({ name: v })}
              placeholder="path_name"
              id={`inspector-name-${entity.id}`}
            />
          </InspectorSection>
        )}

        {/* ── CHAPTER FIELDS ────────────────────────────────── */}
        {type === 'chapter' && (
          <InspectorSection title="Identity">
            <TextField
              label="Name"
              value={entity.name}
              onChange={(v) => updateEntity({ name: v })}
              placeholder="chapter_name"
              id={`inspector-name-${entity.id}`}
            />
          </InspectorSection>
        )}
      </div>
    </div>
  );
}

// ── Section sub-component ────────────────────────────────────

/**
 * Collapsible section within the inspector panel.
 */
function InspectorSection({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`inspector-section ${collapsed ? 'inspector-section--collapsed' : ''}`}>
      <button
        className="inspector-section__header"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <span className="inspector-section__title">{title}</span>
        <span className="inspector-section__chevron">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>
      {!collapsed && (
        <div className="inspector-section__content">
          {children}
        </div>
      )}
    </div>
  );
}

export default InspectorPanel;
