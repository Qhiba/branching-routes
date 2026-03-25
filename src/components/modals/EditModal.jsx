import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import SceneModalForm from './SceneModalForm';
import ChoiceModalForm from './ChoiceModalForm';
import EndingModalForm from './EndingModalForm';

/**
 * EditModal — Generic modal shell for editing/creating entities.
 *
 * Props:
 *   open           – boolean
 *   entityType     – 'scene' | 'choice' | 'ending'
 *   entityId       – string | null  (null = create mode)
 *   onClose        – () => void  (called after save or cancel)
 */
export default function EditModal({ open, entityType, entityId, initialPosition, onClose }) {
  const isCreate = !entityId;

  // Escape key handler
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

  const titleMap = {
    scene: isCreate ? 'New Scene' : 'Edit Scene',
    choice: isCreate ? 'New Choice' : 'Edit Choice',
    ending: isCreate ? 'New Ending' : 'Edit Ending',
  };

  const FormComponent = {
    scene: SceneModalForm,
    choice: ChoiceModalForm,
    ending: EndingModalForm,
  }[entityType];

  if (!FormComponent) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto flex flex-col rounded-[10px] shadow-2xl"
          style={{
            width: 600,
            maxHeight: '85vh',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-ghost)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--color-border-ghost)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                {titleMap[entityType]}
              </span>
              {entityId && (
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', background: 'var(--color-surface-card-low)', padding: '2px 6px', borderRadius: 4 }}>
                  {entityId}
                </span>
              )}
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

          {/* ── Body (scrollable) + Footer are inside the form component ── */}
          <FormComponent entityId={entityId} initialPosition={initialPosition} onClose={onClose} />
        </div>
      </div>
    </>
  );
}
