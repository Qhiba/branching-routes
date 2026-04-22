import React from 'react';
import './ConfirmModal.css';

/**
 * A custom confirmation modal replacing browser window.confirm().
 * Props:
 *   isOpen    — boolean, controls visibility
 *   title     — string, modal heading
 *   message   — string, body text
 *   onConfirm — () => void, called when user clicks "Confirm"
 *   onCancel  — () => void, called when user clicks "Cancel" or backdrop
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
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-backdrop" onClick={onCancel}>
            <div
                className="confirm-modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
            >
                <div className="confirm-modal__header">
                    <h3 id="confirm-modal-title" className="confirm-modal__title">{title}</h3>
                </div>
                {message && (
                    <div className="confirm-modal__body">
                        <p className="confirm-modal__message">{message}</p>
                    </div>
                )}
                <div className="confirm-modal__footer">
                    <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className={`confirm-modal__btn ${danger ? 'confirm-modal__btn--danger' : 'confirm-modal__btn--confirm'}`}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
