// ============================================================
// CommandPalette.jsx — Ctrl+K search & action modal
// ============================================================
// A global command palette that:
//   - Searches nodes, flags, and status points by name or ID
//   - Executes actions: Create Node, Export, Reset, Find path...
//   - Navigates to entities on the canvas
//
// Opened via Ctrl+K or useUIStore.commandPaletteOpen.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/chrome/
//   AR-02: state from Zustand stores
//   AR-09: styles consume tokens via CommandPalette.css
// ============================================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  CircleDot,
  GitFork,
  OctagonX,
  Flag,
  BarChart3,
  Plus,
  Download,
  RotateCcw,
  Route,
  Command,
  Hexagon,
  Folder,
  BookOpen,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import { exportAndDownloadJSON } from '@/services/importExport.js';

import './CommandPalette.css';

// ── Action definitions ──────────────────────────────────────

function getActions(reactFlowInstance) {
  return [
    {
      id: 'action-create-common',
      name: 'Create Common Node',
      desc: 'Add a new Common Node at viewport center',
      icon: 'action',
      shortcut: 'N',
      execute: () => {
        const pos = getViewportCenter(reactFlowInstance);
        const id = useNarrativeStore.getState().addCommonNode({ _position: pos });
        useUIStore.getState().selectNode(id);
        useUIStore.getState().addToast('Common Node created', 'success', 3000);
      },
    },
    {
      id: 'action-create-choice',
      name: 'Create Choice',
      desc: 'Add a new Choice at viewport center',
      icon: 'action',
      shortcut: 'C',
      execute: () => {
        const pos = getViewportCenter(reactFlowInstance);
        const id = useNarrativeStore.getState().addChoice({ _position: pos });
        useUIStore.getState().selectNode(id);
        useUIStore.getState().addToast('Choice created', 'success', 3000);
      },
    },
    {
      id: 'action-create-ending',
      name: 'Create Ending',
      desc: 'Add a new Ending at viewport center',
      icon: 'action',
      shortcut: 'E',
      execute: () => {
        const pos = getViewportCenter(reactFlowInstance);
        const id = useNarrativeStore.getState().addEnding({ _position: pos });
        useUIStore.getState().selectNode(id);
        useUIStore.getState().addToast('Ending created', 'success', 3000);
      },
    },
    {
      id: 'action-create-flag',
      name: 'Create Flag',
      desc: 'Add a new Flag',
      icon: 'action',
      shortcut: 'F',
      execute: () => {
        const id = useNarrativeStore.getState().addFlag();
        useUIStore.getState().addToast(`Flag created: ${id}`, 'success', 3000);
      },
    },
    {
      id: 'action-create-status',
      name: 'Create Status Point',
      desc: 'Add a new Status Point',
      icon: 'action',
      shortcut: 'S',
      execute: () => {
        const id = useNarrativeStore.getState().addStatusPoint();
        useUIStore.getState().addToast(`Status Point created: ${id}`, 'success', 3000);
      },
    },
    {
      id: 'action-create-path',
      name: 'Create Path',
      desc: 'Add a new Path',
      icon: 'action',
      execute: () => {
        const id = useNarrativeStore.getState().addPath();
        useUIStore.getState().addToast(`Path created: ${id}`, 'success', 3000);
      },
    },
    {
      id: 'action-create-chapter',
      name: 'Create Chapter',
      desc: 'Add a new Chapter',
      icon: 'action',
      execute: () => {
        const id = useNarrativeStore.getState().addChapter();
        useUIStore.getState().addToast(`Chapter created: ${id}`, 'success', 3000);
      },
    },
    {
      id: 'action-export',
      name: 'Export JSON',
      desc: 'Download the data model as a .json file',
      icon: 'action',
      execute: () => {
        try {
          exportAndDownloadJSON();
          useUIStore.getState().addToast('Exported as JSON', 'success', 3000);
        } catch (err) {
          useUIStore.getState().addToast(`Export failed: ${err.message}`, 'error', 5000);
        }
      },
    },
    {
      id: 'action-reset',
      name: 'Reset Simulation',
      desc: 'Clear all simulation states and overrides',
      icon: 'action',
      shortcut: 'R',
      execute: () => {
        useSimulationStore.getState().resetSimulation();
        useUIStore.getState().addToast('Simulation reset', 'info', 3000);
      },
    },
  ];
}

/**
 * Get viewport center as flow coordinates.
 */
function getViewportCenter(reactFlowInstance) {
  try {
    const pos = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    return { x: Math.round(pos.x), y: Math.round(pos.y) };
  } catch {
    return { x: 0, y: 0 };
  }
}

/**
 * Map entity/icon type to the JSX icon element.
 */
function getIconComponent(iconType) {
  switch (iconType) {
    case 'common':
      return <CircleDot className="command-palette__item-icon command-palette__item-icon--common" />;
    case 'choice':
      return <GitFork className="command-palette__item-icon command-palette__item-icon--choice" />;
    case 'ending':
      return <OctagonX className="command-palette__item-icon command-palette__item-icon--ending" />;
    case 'flag':
      return <Flag className="command-palette__item-icon command-palette__item-icon--flag" />;
    case 'status':
      return <BarChart3 className="command-palette__item-icon command-palette__item-icon--status" />;
    case 'path':
      return <Folder className="command-palette__item-icon command-palette__item-icon--status" />;
    case 'chapter':
      return <BookOpen className="command-palette__item-icon command-palette__item-icon--status" />;
    case 'action':
      return <Command className="command-palette__item-icon command-palette__item-icon--action" />;
    default:
      return <Hexagon className="command-palette__item-icon" />;
  }
}

/**
 * CommandPalette — Ctrl+K search & action modal.
 */
function CommandPalette() {
  const isOpen = useUIStore((s) => s.commandPaletteOpen);
  const common = useNarrativeStore((s) => s.common);
  const choices = useNarrativeStore((s) => s.choice);
  const endings = useNarrativeStore((s) => s.ending);
  const flags = useNarrativeStore((s) => s.flag);
  const statusPoints = useNarrativeStore((s) => s.status);
  const paths = useNarrativeStore((s) => s.path);
  const chapters = useNarrativeStore((s) => s.chapter);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  let reactFlowInstance;
  try {
    reactFlowInstance = useReactFlow();
  } catch {
    reactFlowInstance = null;
  }

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Focus the input after render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Build searchable items ────────────────────────────────

  const allItems = useMemo(() => {
    const items = [];

    // Entities
    for (const node of Object.values(common)) {
      items.push({
        id: node.id,
        name: node.name || node.id,
        desc: `Common Node · ${node.id}`,
        icon: 'common',
        group: 'Entities',
        entityId: node.id,
      });
    }
    for (const ch of Object.values(choices)) {
      items.push({
        id: ch.id,
        name: ch.text || ch.id,
        desc: `Choice · ${ch.id}`,
        icon: 'choice',
        group: 'Entities',
        entityId: ch.id,
      });
    }
    for (const end of Object.values(endings)) {
      items.push({
        id: end.id,
        name: end.name || end.id,
        desc: `Ending · ${end.id}`,
        icon: 'ending',
        group: 'Entities',
        entityId: end.id,
      });
    }
    for (const f of Object.values(flags)) {
      items.push({
        id: f.id,
        name: f.name || f.id,
        desc: `Flag · ${f.id}`,
        icon: 'flag',
        group: 'Flags & Status',
        entityId: f.id,
      });
    }
    for (const sp of Object.values(statusPoints)) {
      items.push({
        id: sp.id,
        name: sp.name || sp.id,
        desc: `Status Point · ${sp.id}`,
        icon: 'status',
        group: 'Flags & Status',
        entityId: sp.id,
      });
    }
    for (const p of Object.values(paths)) {
      items.push({
        id: p.id,
        name: p.name || p.id,
        desc: `Path · ${p.id}`,
        icon: 'path',
        group: 'Organization',
        entityId: p.id,
      });
    }
    for (const c of Object.values(chapters)) {
      items.push({
        id: c.id,
        name: c.name || c.id,
        desc: `Chapter · ${c.id}`,
        icon: 'chapter',
        group: 'Organization',
        entityId: c.id,
      });
    }

    // Actions
    const actions = getActions(reactFlowInstance);
    for (const action of actions) {
      items.push({
        ...action,
        group: 'Actions',
      });
    }

    return items;
  }, [common, choices, endings, flags, statusPoints, paths, chapters, reactFlowInstance]);

  // ── Filter items by query ─────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;

    const lower = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const nameMatch = (item.name || '').toLowerCase().includes(lower);
      const descMatch = (item.desc || '').toLowerCase().includes(lower);
      const idMatch = (item.id || '').toLowerCase().includes(lower);
      return nameMatch || descMatch || idMatch;
    });
  }, [allItems, query]);

  // ── Group items for display ───────────────────────────────

  const groupedItems = useMemo(() => {
    const groups = {};
    for (const item of filteredItems) {
      const group = item.group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredItems.length]);

  // ── Execute item ──────────────────────────────────────────

  const executeItem = useCallback(
    (item) => {
      useUIStore.getState().toggleCommandPalette(false);

      if (item.execute) {
        item.execute();
        return;
      }

      // Navigate to entity
      if (item.entityId) {
        // Select the node if it's a graph entity
        const narrative = useNarrativeStore.getState();
        const isGraphEntity =
          narrative.common[item.entityId] ||
          narrative.choice[item.entityId] ||
          narrative.ending[item.entityId];

        if (isGraphEntity && reactFlowInstance) {
          useUIStore.getState().selectNode(item.entityId);
          useUIStore.getState().openInspector();

          // Center the viewport on the entity
          try {
            reactFlowInstance.fitView({
              nodes: [{ id: item.entityId }],
              duration: 400,
              padding: 0.5,
            });
          } catch {
            // Ignore fitView errors
          }
        } else {
          // Non-graph entity (flag, status, path, chapter) — show toast
          useUIStore
            .getState()
            .addToast(`Navigated to ${item.desc}`, 'info', 3000);
        }
      }
    },
    [reactFlowInstance]
  );

  // ── Keyboard navigation ───────────────────────────────────

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[activeIndex];
        if (item) executeItem(item);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette(false);
      }
    },
    [filteredItems, activeIndex, executeItem]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const activeEl = resultsRef.current.querySelector('.command-palette__item--active');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  // ── Close on backdrop click ───────────────────────────────

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      useUIStore.getState().toggleCommandPalette(false);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      className="command-palette-backdrop"
      id="command-palette-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="command-palette" id="command-palette">
        {/* Search input */}
        <div className="command-palette__search">
          <Search className="command-palette__search-icon" />
          <input
            ref={inputRef}
            className="command-palette__input"
            type="text"
            placeholder="Search entities, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="command-palette__shortcut-hint">Esc</span>
        </div>

        {/* Results */}
        <div className="command-palette__results" ref={resultsRef}>
          {filteredItems.length === 0 ? (
            <div className="command-palette__empty">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groupedItems).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="command-palette__group-label">{groupName}</div>
                {items.map((item) => {
                  const itemIndex = flatIndex++;
                  const isActive = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      className={`command-palette__item ${
                        isActive ? 'command-palette__item--active' : ''
                      }`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                    >
                      {getIconComponent(item.icon)}
                      <div className="command-palette__item-content">
                        <div className="command-palette__item-name">{item.name}</div>
                        {item.desc && (
                          <div className="command-palette__item-desc">{item.desc}</div>
                        )}
                      </div>
                      {item.shortcut && (
                        <span className="command-palette__item-shortcut">
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="command-palette__footer">
          <span className="command-palette__footer-key">↑↓</span> navigate
          <span className="command-palette__footer-key">↵</span> select
          <span className="command-palette__footer-key">Esc</span> close
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
