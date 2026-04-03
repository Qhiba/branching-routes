import React, { useMemo, useCallback, useEffect, useState } from 'react';
import RouteViewer from './components/routeviewer/RouteViewer';
import { useEditor } from './context/EditorContext';
import useSimulator from './hooks/useSimulator';
import ErrorBoundary from './components/shared/ErrorBoundary';
import NavBar from './components/layout/NavBar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import EditModal from './components/modals/EditModal';
import SettingsModal from './components/modals/SettingsModal';
import { buildDependencyGraph } from './utils/dependencyGraph';
import { traceRoute } from './utils/routeTracer';

function App() {
   const { flags, choices, scenes, paths, chapters, statusPoints, quests, endings, entryNode, sceneTypes, setEntryNode, loadData, clearData } = useEditor();
  const sim = useSimulator();
  const [activeNavItem, setActiveNavItem] = React.useState(null);
  const [activeEditId, setActiveEditId] = React.useState(null);
  const [backtrackTargetId, setBacktrackTargetId] = React.useState(null);
  const [tracedPath, setTracedPath] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Route trace computation ──
  const routeTraceResult = useMemo(() => {
    if (!backtrackTargetId || !entryNode) return null;
    const graph = buildDependencyGraph(flags, statusPoints, choices, scenes, endings);
    return traceRoute(backtrackTargetId, entryNode, graph.adjacency, choices, scenes, endings, flags, statusPoints);
  }, [backtrackTargetId, entryNode, flags, statusPoints, choices, scenes, endings]);

  const handleHighlightPath = useCallback((rawPath) => {
    setTracedPath(rawPath);
  }, []);

  const handleClearBacktrack = useCallback(() => {
    setBacktrackTargetId(null);
    setTracedPath(null);
  }, []);

  // ── Modal state (Part 3) ──
  const [editModal, setEditModal] = React.useState({ open: false, entityType: null, entityId: null, initialPosition: null });
  const routeViewerRef = React.useRef(null);

  const openModal = useCallback((entityType, entityId, initialPosition = null) => {
    let pos = initialPosition;
    // If we're creating a new node and no position was specified,
    // grab the current viewport center from the canvas.
    if (!entityId && !pos && routeViewerRef.current?.getViewportCenter) {
      pos = routeViewerRef.current.getViewportCenter();
    }
    setEditModal({ open: true, entityType, entityId, initialPosition: pos });
  }, []);

  const closeModal = useCallback(() => {
    setEditModal({ open: false, entityType: null, entityId: null, initialPosition: null });
  }, []);

  const handleNavChange = (item) => {
    setActiveNavItem(item);
    setActiveEditId(null);
  };

  const handleNodeEdit = (id, type) => {
    const navMap = { 'scene': 'scenes', 'choice': 'choices', 'ending': 'endings' };
    setActiveNavItem(navMap[type.toLowerCase()] || 'scenes');
    setActiveEditId(id);
  };

  // ── E key shortcut: open modal for the currently selected node ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input/textarea/select
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (editModal.open) return; // already showing a modal

      if (e.key === 'e' || e.key === 'E') {
        if (!activeEditId) return;
        // Determine entity type from activeNavItem
        const typeMap = { scenes: 'scene', choices: 'choice', endings: 'ending' };
        const entityType = typeMap[activeNavItem];
        if (entityType) {
          e.preventDefault();
          openModal(entityType, activeEditId);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeEditId, activeNavItem, editModal.open, openModal]);

  const handleExport = () => {
    if (!entryNode) {
      alert("Validation Error: No entry point set. Please select an entry point before exporting.");
      return;
    }

    const data = {
      metadata: {
        version: "1.0",
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        entry_node: entryNode,
        scene_types: sceneTypes,
        common_node_types: sceneTypes  // BRIDGE: added alongside scene_types for new format
      },
      path: paths,
      chapter: chapters,
      flags,
      choices,
      scenes,  // BRIDGE: kept for backward-compat, will be replaced in later phase
      common: scenes,  // BRIDGE: added new key with current S###-keyed data
      status: statusPoints,
      quests,
      endings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branching-routes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object') {
          alert("Invalid file: root must be a JSON object.");
          return;
        }

        const sliceKeys = ['flags', 'choices', 'path', 'chapter', 'status', 'quests', 'endings'];
        const scenesData = data.common || data.scenes || {};
        for (const key of sliceKeys) {
          if (data[key] !== undefined && (typeof data[key] !== 'object' || data[key] === null || Array.isArray(data[key]))) {
            alert(`Invalid file: "${key}" must be a plain object, got ${Array.isArray(data[key]) ? 'array' : typeof data[key]}.`);
            return;
          }
        }
        if (scenesData && (typeof scenesData !== 'object' || scenesData === null || Array.isArray(scenesData))) {
          alert(`Invalid file: "scenes" must be a plain object, got ${Array.isArray(scenesData) ? 'array' : typeof scenesData}.`);
          return;
        }

        if (!sliceKeys.some(k => data[k] && Object.keys(data[k]).length > 0) && !scenesData || Object.keys(scenesData).length === 0) {
          alert("Invalid file structure. No valid data found.");
          return;
        }

        const validateEntities = (obj, label) => {
          const bad = [];
          for (const [key, val] of Object.entries(obj || {})) {
            if (!val || typeof val !== 'object' || !val.id) bad.push(key);
          }
          if (bad.length > 0) {
            alert(`Invalid ${label}: entries [${bad.join(', ')}] are missing required "id" field.`);
            return false;
          }
          return true;
        };
        if (!validateEntities(data.flags, 'flags')) return;
        if (!validateEntities(data.choices, 'choices')) return;
        if (!validateEntities(scenesData, 'scenes')) return;
        if (!validateEntities(data.path, 'paths')) return;
        if (!validateEntities(data.chapter, 'chapters')) return;
        if (!validateEntities(data.status, 'status points')) return;
        if (!validateEntities(data.quests, 'quests')) return;
        if (!validateEntities(data.endings, 'endings')) return;

        const collisions = [];
        const checkCollisions = (incoming, existing, label) => {
          if (!incoming) return;
          const overlapping = Object.keys(incoming).filter(id => existing[id]);
          if (overlapping.length > 0) collisions.push(`${label}: ${overlapping.join(', ')}`);
        };
        checkCollisions(data.flags, flags, 'Flags');
        checkCollisions(data.choices, choices, 'Choices');
        checkCollisions(scenesData, scenes, 'Scenes');
        checkCollisions(data.path, paths, 'Paths');
        checkCollisions(data.chapter, chapters, 'Chapters');
        checkCollisions(data.status, statusPoints, 'Status');
        checkCollisions(data.quests, quests, 'Quests');
        checkCollisions(data.endings, endings, 'Endings');

        if (collisions.length > 0) {
          const proceed = window.confirm(
            `Warning: The following IDs already exist and will be OVERWRITTEN:\n\n${collisions.join('\n')}\n\nProceed with import?`
          );
          if (!proceed) return;
        }

        loadData({
          metadata: {
            ...data.metadata,
            scene_types: data.metadata?.common_node_types || data.metadata?.scene_types
          },
          flags: data.flags || {},
          choices: data.choices || {},
          scenes: scenesData,
          paths: data.path || {},
          chapters: data.chapter || {},
          status: data.status || {},
          quests: data.quests || {},
          endings: data.endings || {}
        });
      } catch (err) {
        alert("Failed to parse JSON file. Check that it is valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Compute entry node options for dropdown
  const entryPointOptions = React.useMemo(() => [
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' }))
  ], [scenes, choices]);

  const entryNodeType = React.useMemo(() => {
    if (!entryNode) return null;
    if (scenes[entryNode]) return 'Scene';
    if (choices[entryNode]) return 'Choice';
    return null;
  }, [entryNode, scenes, choices]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-ui)" }}>
      {/* ═══ TOPBAR — 40px ═══ */}
      <header className="h-10 flex-shrink-0 flex items-center px-3.5 gap-2.5" style={{ background: 'var(--color-surface-panel)', borderBottom: '1px solid var(--color-border-panel)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--color-accent-primary-dim)', letterSpacing: '0.02em' }}>
          BRANCHING ROUTES
        </span>
        <div className="w-px h-4" style={{ background: 'var(--color-border-ghost)' }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          branching-routes.json
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,209,255,0.12)', color: 'var(--color-accent-primary-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Phase 5
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={clearData}
            style={{
              background: 'none',
              border: '1px solid var(--color-border-ghost)',
              borderRadius: 6,
              color: 'var(--color-text-secondary)',
              fontSize: 11,
              fontWeight: 500,
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)';
              e.currentTarget.style.color = 'var(--color-accent-error)';
              e.currentTarget.style.background = 'rgba(255,107,107,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-ghost)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.background = 'none';
            }}
          >
            Reset Project
          </button>
          <label className="cursor-pointer" style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', transition: 'border-color 0.15s, color 0.15s' }}>
            Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '4px 10px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-ghost)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Settings
          </button>
          <button
            onClick={handleExport}
            disabled={!entryNode}
            className="signature-gradient"
            style={{ color: '#0a1a1f', border: 'none', borderRadius: 24, padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: entryNode ? 'pointer' : 'not-allowed', opacity: entryNode ? 1 : 0.5 }}
            title={!entryNode ? 'Set an entry node to enable export' : 'Export JSON'}
          >
            Export JSON
          </button>
        </div>
      </header>

      {/* ═══ NAV BAR — 36px ═══ */}
      <NavBar
        activeNavItem={activeNavItem}
        onNavChange={handleNavChange}
        entryNode={entryNode}
        setEntryNode={setEntryNode}
        entryPointOptions={entryPointOptions}
        entryNodeType={entryNodeType}
      />

      {/* ═══ BODY ROW (3-COLUMN LAYOUT) ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <LeftSidebar
          activeNavItem={activeNavItem}
          onNavChange={handleNavChange}
          activeEditId={activeEditId}
          onSetEditId={setActiveEditId}
          onClearEdit={() => setActiveEditId(null)}
          sim={sim}
          onOpenModal={openModal}
          backtrackTargetId={backtrackTargetId}
          onClearBacktrack={handleClearBacktrack}
          routeTraceResult={routeTraceResult}
          onHighlightPath={handleHighlightPath}
          tracedPath={tracedPath}
        />

        {/* Center Canvas */}
        <main className="flex-1 overflow-auto relative w-full h-full" style={{ background: 'var(--color-surface-workspace)' }}>
          <ErrorBoundary>
             <RouteViewer onNodeEdit={handleNodeEdit} sim={sim} routeViewerRef={routeViewerRef} tracedPath={tracedPath} routeTraceResult={routeTraceResult} />
          </ErrorBoundary>
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          sim={sim}
          activeEditId={activeEditId}
          isSimulating={sim?.isRunning || false}
          onBacktrack={setBacktrackTargetId}
          backtrackTargetId={backtrackTargetId}
          onClearBacktrack={handleClearBacktrack}
          routeTraceResult={routeTraceResult}
          onHighlightPath={handleHighlightPath}
          tracedPath={tracedPath}
          entryNode={entryNode}
          handleStart={sim?.handleStart}
        />

      </div>

      {/* ═══ Edit Modal ═══ */}
      <EditModal
        open={editModal.open}
        entityType={editModal.entityType}
        entityId={editModal.entityId}
        initialPosition={editModal.initialPosition}
        onClose={closeModal}
      />

      {/* ═══ Settings Modal ═══ */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
