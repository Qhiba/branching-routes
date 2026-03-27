import React, { useEffect, useCallback, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export default function SettingsModal({ open, onClose }) {
  const { sceneTypes, addSceneType, removeSceneType, scenes } = useEditor();
  const [newTypeName, setNewTypeName] = useState('');

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleAddType = () => {
    if (newTypeName.trim()) {
      addSceneType(newTypeName.trim());
      setNewTypeName('');
    }
  };

  const handleRemoveType = (name) => {
    const scenesWithType = Object.values(scenes).filter(s => s.type === name);
    if (scenesWithType.length > 0) {
      if (confirm(`"${name}" is used by ${scenesWithType.length} scene(s). Removing it will clear the type from those scenes. Continue?`)) {
        removeSceneType(name);
      }
    } else {
      removeSceneType(name);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto flex flex-col rounded-[10px] shadow-2xl"
          style={{
            width: 480,
            maxHeight: '85vh',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-ghost)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--color-border-ghost)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                Settings
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-surface-card)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5" style={{ padding: 20 }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Scene Types
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Define categories to label your scenes (e.g., "intro", "combat", "dialogue").
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddType(); }}
                  placeholder="Enter type name..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid var(--color-border-ghost)',
                    background: 'var(--color-surface-card)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddType}
                  disabled={!newTypeName.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: 'none',
                    background: newTypeName.trim() ? 'var(--color-accent)' : 'var(--color-surface-card)',
                    color: newTypeName.trim() ? 'white' : 'var(--color-text-muted)',
                    cursor: newTypeName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {sceneTypes.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No scene types defined yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {sceneTypes.map(type => {
                    const count = Object.values(scenes).filter(s => s.type === type).length;
                    return (
                      <div
                        key={type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          fontSize: 12,
                          borderRadius: 6,
                          background: 'var(--color-surface-card)',
                          border: '1px solid var(--color-border-ghost)',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{type}</span>
                        {count > 0 && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>({count})</span>
                        )}
                        <button
                          onClick={() => handleRemoveType(type)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-danger)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
