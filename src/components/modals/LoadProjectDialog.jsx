import React, { useEffect } from 'react';
import { X, FileJson, FolderOpen } from 'lucide-react';
import useFocusTrap from 'hooks/useFocusTrap';
import ModalPortal from '../ModalPortal';

// ADDED (Save/Load): lists the files in the project's /saves folder (served by the dev server, see vite.config.js).
// Props: files [{ name, size, modified }], onPick(name), onBrowse() (any other file), onClose().
function formatWhen(ms) {
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function LoadProjectDialog({ files, onPick, onBrowse, onClose }) {
  const containerRef = useFocusTrap(true);

  useEffect(() => {
    // Capture phase so canvas shortcuts do not also fire.
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="br-dialog-backdrop" onClick={onClose}>
        <div
          ref={containerRef}
          className="br-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="br-load-dialog-title"
          onClick={e => e.stopPropagation()}
        >
          <div className="br-dialog__header">
            <h2 id="br-load-dialog-title" className="br-dialog__title">Load project</h2>
            <button className="br-btn br-btn--ghost br-btn--icon" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </div>
          <div className="br-dialog__body">
            {files.length === 0 ? (
              <div className="br-empty">
                <p className="br-empty__title">No saved projects yet</p>
                <p className="br-empty__text">Press Ctrl+S to save the current project into the saves folder.</p>
              </div>
            ) : (
              files.map(f => (
                <button key={f.name} className="br-row" onClick={() => onPick(f.name)}>
                  <FileJson aria-hidden="true" />
                  <span className="br-row__main">{f.name}</span>
                  <span className="br-row__meta">{formatSize(f.size)} · {formatWhen(f.modified)}</span>
                </button>
              ))
            )}
          </div>
          <div className="br-dialog__footer">
            <button className="br-btn" onClick={onBrowse}><FolderOpen />Browse other file…</button>
            <button className="br-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
