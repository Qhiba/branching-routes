import React, { useState, useEffect, useMemo } from 'react';
import { useNarrativeStore, useSimulationStore } from 'store';

// ADDED: Phase 2 — Command palette overlay for keyboard-driven navigation and authoring
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { common, choice, ending, flag, status, path, chapter } = useNarrativeStore();
  const { isCampaignActive } = useSimulationStore();

  // ADDED: Phase 2 — Listen for palette-toggle DOM event
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
      if (isOpen) {
        setQuery('');
        setSelectedIndex(0);
      }
    };
    window.addEventListener('palette-toggle', handleToggle);
    return () => window.removeEventListener('palette-toggle', handleToggle);
  }, [isOpen]);

  // ADDED: Phase 2 — ESC handler (stopPropagation to prevent global ESC clearSelection) — RISK-CP-03 mitigation
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // ADDED: Phase 2 — Build search index from all entity collections
  // Rebuilds only when collections change (targeted selectors per AR-14)
  const searchIndex = useMemo(() => {
    const items = [];

    // Helper to resolve chapter/path IDs to names
    const resolveNodeContext = (node) => {
      const chapterName = node.data?.chapterId && chapter[node.data.chapterId] ? chapter[node.data.chapterId].name : null;
      const pathName = node.data?.pathId && path[node.data.pathId] ? path[node.data.pathId].name : null;
      return { chapterName, pathName };
    };

    // Node entities
    Object.values(common).forEach(node => {
      const { chapterName, pathName } = resolveNodeContext(node);
      items.push({
        id: node.id,
        label: node.data.label || 'Unnamed',
        type: 'Common Node',
        chapterName,
        pathName
      });
    });

    Object.values(choice).forEach(node => {
      const { chapterName, pathName } = resolveNodeContext(node);
      items.push({
        id: node.id,
        label: node.data.label || 'Unnamed',
        type: 'Choice Node',
        chapterName,
        pathName
      });
    });

    Object.values(ending).forEach(node => {
      const { chapterName, pathName } = resolveNodeContext(node);
      items.push({
        id: node.id,
        label: node.data.label || 'Unnamed',
        type: 'Ending Node',
        chapterName,
        pathName
      });
    });

    // Flag entities
    Object.entries(flag).forEach(([id, data]) => {
      items.push({
        id,
        label: data.name || 'Unnamed',
        type: 'Flag',
        chapterName: null,
        pathName: null
      });
    });

    // Status entities
    Object.entries(status).forEach(([id, data]) => {
      items.push({
        id,
        label: data.name || 'Unnamed',
        type: 'Status',
        chapterName: null,
        pathName: null
      });
    });

    // Path entities
    Object.entries(path).forEach(([id, data]) => {
      items.push({
        id,
        label: data.name || 'Unnamed',
        type: 'Path',
        chapterName: null,
        pathName: null
      });
    });

    // Chapter entities
    Object.entries(chapter).forEach(([id, data]) => {
      items.push({
        id,
        label: data.name || 'Unnamed',
        type: 'Chapter',
        chapterName: null,
        pathName: null
      });
    });

    return items;
  }, [common, choice, ending, flag, status, path, chapter]);

  // ADDED: Phase 2 — Filter results by query
  const filteredEntities = useMemo(() => {
    if (!query) return searchIndex;
    const lowerQuery = query.toLowerCase();
    return searchIndex.filter(item => item.label.toLowerCase().includes(lowerQuery));
  }, [searchIndex, query]);

  // ADDED: Phase 2 — Static action list (context strings for event dispatch)
  const actions = [
    { label: 'Create Common Node', type: 'action', eventType: 'canvas-open-node-modal', detail: { nodeType: 'common' } },
    { label: 'Create Choice Node', type: 'action', eventType: 'canvas-open-node-modal', detail: { nodeType: 'choice' } },
    { label: 'Create Ending Node', type: 'action', eventType: 'canvas-open-node-modal', detail: { nodeType: 'ending' } },
    { label: 'Create Flag', type: 'action', eventType: 'canvas-open-name-modal', detail: { entityType: 'flag' } },
    { label: 'Create Status', type: 'action', eventType: 'canvas-open-name-modal', detail: { entityType: 'status' } },
    { label: 'Create Path', type: 'action', eventType: 'canvas-open-name-modal', detail: { entityType: 'path' } },
    { label: 'Create Chapter', type: 'action', eventType: 'canvas-open-name-modal', detail: { entityType: 'chapter' } }
  ];

  // ADDED: Phase 2 — Combine and conditionally show actions
  const allItems = [...filteredEntities, ...(isCampaignActive ? [] : actions)];

  // ADDED: Phase 2 — Clamp selectedIndex to valid range
  useEffect(() => {
    if (selectedIndex >= allItems.length) {
      setSelectedIndex(Math.max(0, allItems.length - 1));
    }
  }, [allItems.length, selectedIndex]);

  // ADDED: Phase 2 — Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(allItems.length - 1, prev + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    }
  };

  // ADDED: Phase 2 — Handle entity or action selection
  const handleSelect = (item) => {
    if (!item) return;

    if (item.type === 'action') {
      // Dispatch action event
      window.dispatchEvent(new CustomEvent(item.eventType, { detail: item.detail }));
    } else {
      // Dispatch navigate event for entity
      window.dispatchEvent(new CustomEvent('canvas-navigate-to-node', { detail: { nodeId: item.id } }));
    }

    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="palette-panel" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          className="palette-search"
          placeholder="Search nodes, flags, paths..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <div className="palette-results">
          {/* ADDED: Phase 2 — Entities section */}
          {filteredEntities.length > 0 && (
            <>
              <div className="palette-section-label">Entities</div>
              {filteredEntities.map((item, idx) => (
                <div
                  key={item.id}
                  className={`palette-item ${idx === selectedIndex ? 'palette-item--selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <span className="palette-item__type-badge">{item.type}</span>
                  <span>{item.label}</span>
                  {(item.chapterName || item.pathName) && (
                    <span className="palette-item__context">
                      {item.chapterName}
                      {item.chapterName && item.pathName ? ' / ' : ''}
                      {item.pathName}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ADDED: Phase 2 — Actions section (hidden during campaign) */}
          {!isCampaignActive && actions.length > 0 && (
            <>
              <div className="palette-section-label">Actions</div>
              {actions.map((item, idx) => {
                const actualIdx = filteredEntities.length + idx;
                return (
                  <div
                    key={item.label}
                    className={`palette-item ${actualIdx === selectedIndex ? 'palette-item--selected' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </>
          )}

          {/* ADDED: Phase 2 — Empty state */}
          {allItems.length === 0 && (
            <div className="palette-empty">
              No results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
