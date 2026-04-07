// ============================================================
// TopBar.jsx — Thin single-line top bar
// ============================================================
// Renders a fixed top bar with:
//   - Editable project name
//   - Handle orientation toggle (horizontal/vertical)
//   - Settings, reset simulation, import/export buttons
//   - Persistent IndexedDB error banner (AR-08)
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/chrome/
//   AR-02: state from Zustand stores
//   AR-08: persist error banner
//   AR-09: styles consume tokens via TopBar.css
// ============================================================

import { useCallback, useRef, useState } from 'react';
import {
  GitBranch,
  Settings,
  RotateCcw,
  Upload,
  Download,
  FileUp,
  FileDown,
  X,
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpDown,
} from 'lucide-react';

import { useNarrativeStore } from '@/store/useNarrativeStore.js';
import { useUIStore } from '@/store/useUIStore.js';
import { useSimulationStore } from '@/store/useSimulationStore.js';
import {
  exportAndDownloadJSON,
  exportAndDownloadZIP,
  importJSON,
  importZIP,
} from '@/services/importExport.js';

import './TopBar.css';

/**
 * TopBar — Thin single-line application bar.
 *
 * @param {object} props
 * @param {string} props.handleOrientation — 'horizontal' | 'vertical'
 * @param {function} props.onToggleHandleOrientation — Callback to toggle handle orientation
 */
function TopBar({ handleOrientation = 'vertical', onToggleHandleOrientation }) {
  const projectName = useNarrativeStore(
    (s) => s.metadata.projectName ?? 'Untitled Project'
  );
  const persistError = useUIStore((s) => s.persistError);
  const addToast = useUIStore((s) => s.addToast);

  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState(null); // 'json' | 'zip'

  // ── Project name editing ──────────────────────────────────

  const handleNameChange = useCallback(
    (e) => {
      useNarrativeStore.getState().updateMetadata({ projectName: e.target.value });
    },
    []
  );

  const handleNameBlur = useCallback(
    (e) => {
      const value = e.target.value.trim();
      if (!value) {
        useNarrativeStore.getState().updateMetadata({ projectName: 'Untitled Project' });
      }
    },
    []
  );

  const handleNameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }, []);

  // ── Reset simulation ──────────────────────────────────────

  const handleResetSimulation = useCallback(() => {
    useSimulationStore.getState().resetSimulation();
    addToast('Simulation reset', 'info', 3000);
  }, [addToast]);

  // ── Import/Export ─────────────────────────────────────────

  const handleExportJSON = useCallback(async () => {
    try {
      exportAndDownloadJSON();
      addToast('Exported as JSON', 'success', 3000);
    } catch (err) {
      addToast(`Export failed: ${err.message}`, 'error', 5000);
    }
  }, [addToast]);

  const handleExportZIP = useCallback(async () => {
    try {
      await exportAndDownloadZIP();
      addToast('Exported as ZIP', 'success', 3000);
    } catch (err) {
      addToast(`Export failed: ${err.message}`, 'error', 5000);
    }
  }, [addToast]);

  const handleImportJSONClick = useCallback(() => {
    setImportMode('json');
    fileInputRef.current.accept = '.json';
    fileInputRef.current.click();
  }, []);

  const handleImportZIPClick = useCallback(() => {
    setImportMode('zip');
    fileInputRef.current.accept = '.zip';
    fileInputRef.current.click();
  }, []);

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        if (importMode === 'zip') {
          await importZIP(file);
          addToast('Project imported from ZIP', 'success', 3000);
        } else {
          await importJSON(file);
          addToast('Data model imported from JSON', 'success', 3000);
        }
      } catch (err) {
        addToast(`Import failed: ${err.message}`, 'error', 5000);
      }

      // Reset the file input so the same file can be imported again
      e.target.value = '';
      setImportMode(null);
    },
    [importMode, addToast]
  );

  // ── Persist error dismiss ─────────────────────────────────

  const handleDismissError = useCallback(() => {
    useUIStore.getState().clearPersistError();
  }, []);

  // ── Handle orientation toggle ─────────────────────────────

  const isHorizontal = handleOrientation === 'horizontal';

  return (
    <>
      <header className="top-bar" id="top-bar">
        {/* Left: Logo + Project Name */}
        <div className="top-bar__left">
          <div className="top-bar__logo">
            <GitBranch className="top-bar__logo-icon" />
            <span>BR</span>
          </div>
          <div className="top-bar__divider" />
          <input
            id="top-bar-project-name"
            className="top-bar__project-name"
            type="text"
            value={projectName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            spellCheck={false}
            aria-label="Project name"
          />
        </div>

        {/* Center: Handle Orientation Toggle */}
        <div className="top-bar__center">
          <button
            id="top-bar-handle-toggle"
            className={`top-bar__handle-toggle ${
              isHorizontal ? 'top-bar__handle-toggle--active' : ''
            }`}
            onClick={onToggleHandleOrientation}
            title={`Handles: ${isHorizontal ? 'Horizontal' : 'Vertical'}`}
          >
            {isHorizontal ? (
              <ArrowRightLeft className="top-bar__handle-toggle-icon" />
            ) : (
              <ArrowUpDown className="top-bar__handle-toggle-icon" />
            )}
            <span>{isHorizontal ? 'H' : 'V'}</span>
          </button>
        </div>

        {/* Right: Action Buttons */}
        <div className="top-bar__right">
          {/* Settings — for later phases */}
          <button
            id="top-bar-settings"
            className="top-bar__btn"
            title="Settings"
            // AMBIGUOUS: Settings modal not specified in plan, add placeholder
            onClick={() => addToast('Settings not yet available', 'info', 3000)}
          >
            <Settings className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Settings</span>
          </button>

          <div className="top-bar__divider" />

          {/* Reset Simulation */}
          <button
            id="top-bar-reset"
            className="top-bar__btn top-bar__btn--danger"
            title="Reset Simulation"
            onClick={handleResetSimulation}
          >
            <RotateCcw className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Reset</span>
          </button>

          <div className="top-bar__divider" />

          {/* Import JSON */}
          <button
            id="top-bar-import-json"
            className="top-bar__btn"
            title="Import JSON"
            onClick={handleImportJSONClick}
          >
            <FileUp className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Import JSON</span>
          </button>

          {/* Import ZIP */}
          <button
            id="top-bar-import-zip"
            className="top-bar__btn"
            title="Import ZIP"
            onClick={handleImportZIPClick}
          >
            <Upload className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Import ZIP</span>
          </button>

          <div className="top-bar__divider" />

          {/* Export JSON */}
          <button
            id="top-bar-export-json"
            className="top-bar__btn"
            title="Export JSON"
            onClick={handleExportJSON}
          >
            <FileDown className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Export JSON</span>
          </button>

          {/* Export ZIP */}
          <button
            id="top-bar-export-zip"
            className="top-bar__btn"
            title="Export ZIP"
            onClick={handleExportZIP}
          >
            <Download className="top-bar__btn-icon" />
            <span className="top-bar__btn-label">Export ZIP</span>
          </button>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          className="top-bar__file-input"
          type="file"
          onChange={handleFileChange}
          tabIndex={-1}
        />
      </header>

      {/* AR-08: Persistent IndexedDB error banner */}
      {persistError && (
        <div className="top-bar__persist-error" id="persist-error-banner">
          <span>
            <AlertTriangle
              style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}
            />
            {persistError}
          </span>
          <button
            className="top-bar__persist-error-dismiss"
            onClick={handleDismissError}
            aria-label="Dismiss error"
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}
    </>
  );
}

export default TopBar;
