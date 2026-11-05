import React, { useEffect } from 'react';
import useFocusTrap from '../hooks/useFocusTrap';
import ModalPortal from './ModalPortal';

/**
 * A custom confirmation modal replacing browser window.confirm().
 * CHANGED (Redesign Step 4): rendered through ModalPortal (never inside a sidebar), built on design-system
 * primitives (.br-dialog, .br-btn — AR-37; ConfirmModal.css removed), Enter confirms and Esc cancels.
 * Props:
 *   isOpen    — boolean, controls visibility
 *   title     — string, modal heading
 *   message   — string, body text
 *   onConfirm — () => void, called when user clicks "Confirm" or presses Enter
 *   onCancel  — () => void, called when user clicks "Cancel", the backdrop, or presses Esc
 *   confirmLabel — string, optional button label (default "Confirm")
 *   danger    — boolean, makes the confirm button red
 */
export default function ConfirmModal({
    isOpen,
    title = 'Are you sure?',
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    danger = false,
}) {
    const containerRef = useFocusTrap(isOpen);

    useEffect(() => {
        if (!isOpen) return;
        // Capture phase so canvas shortcuts (Delete, single keys, Esc-clears-selection) don't also fire.
        const handler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.();
            } else if (e.key === 'Enter' && !e.isComposing && e.target?.tagName !== 'BUTTON') {
                // Buttons keep native Enter (so focusing "Cancel" + Enter cancels).
                e.preventDefault();
                e.stopPropagation();
                onConfirm?.();
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, onCancel, onConfirm]);

    if (!isOpen) return null;

    return (
        <ModalPortal>
            <div className="br-dialog-backdrop br-dialog-backdrop--top" onClick={onCancel}>
                <div
                    ref={containerRef}
                    className="br-dialog br-dialog--sm"
                    onClick={e => e.stopPropagation()}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="br-confirm-modal-title"
                    aria-describedby={message ? 'br-confirm-modal-message' : undefined}
                >
                    <div className="br-dialog__header">
                        <h2 id="br-confirm-modal-title" className="br-dialog__title">{title}</h2>
                    </div>
                    {message && (
                        <div className="br-dialog__body">
                            <p id="br-confirm-modal-message" className="br-confirm__message">{message}</p>
                        </div>
                    )}
                    <div className="br-dialog__footer">
                        <button className="br-btn" onClick={onCancel}>Cancel</button>
                        <button
                            className={`br-btn ${danger ? 'br-btn--danger-solid' : 'br-btn--primary'}`}
                            onClick={onConfirm}
                            autoFocus
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
