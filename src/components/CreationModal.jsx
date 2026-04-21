import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * CreationModal
 *
 * A small (360px) centred modal for creating new named narrative entities.
 * Adapts its body based on entityType:
 *
 *   'Flags'           — Name input + True/False initial-state segmented control
 *   'Status'          — Name input + Initial value + optional Min/Max numeric inputs
 *   'Chapter'|'Paths' — Name input only
 *   null              — Renders nothing (hidden)
 *
 * Local state (AR-03 compliant — purely transient UI state):
 *   nameInput     : draft name being typed
 *   flagState     : boolean toggle for Flag initial value
 *   statusInitial : number for Status initial value
 *   statusMin/Max : optional bounds
 *
 * Props:
 *   entityType  {'Flags'|'Status'|'Chapter'|'Paths'|null}  Controls visibility and form variant.
 *   onClose     {() => void}     Cancel / close without creating.
 *   onConfirm   {(data) => void} Called with final values on confirm:
 *                                  Flags:  { name, initialState: boolean }
 *                                  Status: { name, initialValue, min, max }
 *                                  others: { name }
 *
 * Real-app wiring (invoked from LeftSidebar):
 *   entityType → local useState in parent (e.g. App or LeftSidebar consumer)
 *   onClose    → set entityType to null
 *   onConfirm for Flags  → narrativeStore.addFlag(name, initialState)
 *   onConfirm for Status → narrativeStore.addStatus(name, initialValue, min, max)
 *   onConfirm for Chapter→ narrativeStore.addChapter(name)
 *   onConfirm for Paths  → narrativeStore.addPath(name)
 */
export default function CreationModal({
    entityType = null,
    onClose = () => { },
    onConfirm = () => { },
}) {
    const [nameInput, setNameInput] = useState('');
    const [flagState, setFlagState] = useState(true);
    const [statusInitial, setStatusInitial] = useState(0);
    const [statusMin, setStatusMin] = useState('');
    const [statusMax, setStatusMax] = useState('');

    if (!entityType) return null;

    const isFlag = entityType === 'Flags';
    const isStatus = entityType === 'Status';
    // Singular display label: "Flags" → "Flag", "Paths" → "Path", "Status" → "Status"
    const entityLabel = entityType.replace(/s$/, '');

    const handleConfirm = () => {
        if (!nameInput.trim()) return;
        if (isFlag) {
            onConfirm({ name: nameInput.trim(), initialState: flagState });
        } else if (isStatus) {
            onConfirm({
                name: nameInput.trim(),
                initialValue: statusInitial,
                min: statusMin !== '' ? Number(statusMin) : null,
                max: statusMax !== '' ? Number(statusMax) : null,
            });
        } else {
            onConfirm({ name: nameInput.trim() });
        }
        // Reset transient state (AR-03)
        setNameInput('');
        setFlagState(true);
        setStatusInitial(0);
        setStatusMin('');
        setStatusMax('');
        onClose();
    };

    const handleKeyDown = (e) => {
        e.stopPropagation(); // PROTECTED: mirrors NameModal — prevents global escape clearing selection
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') handleConfirm();
    };

    return (
        <div className="creation-modal__backdrop" onClick={onClose}>
            <div className="creation-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="creation-modal__header">
                    <h3 className="creation-modal__title">New {entityLabel}</h3>
                    <button onClick={onClose} className="creation-modal__close-btn" title="Close">
                        <X className="creation-modal__close-icon" />
                    </button>
                </div>

                {/* Body */}
                <div className="creation-modal__body">

                    {/* Name field — always shown */}
                    <div className="creation-modal__field">
                        <label className="creation-modal__label">Name</label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Enter ${entityLabel.toLowerCase()} name...`}
                            className="creation-modal__input"
                            autoFocus
                        />
                    </div>

                    {/* Flag-specific: True / False segmented toggle */}
                    {isFlag && (
                        <div className="creation-modal__field">
                            <label className="creation-modal__label">Initial State</label>
                            <div className="creation-modal__toggle-track">
                                <div
                                    className={`creation-modal__toggle-thumb ${flagState ? 'creation-modal__toggle-thumb--left' : 'creation-modal__toggle-thumb--right'}`}
                                />
                                <button
                                    onClick={() => setFlagState(true)}
                                    className={`creation-modal__toggle-option ${flagState ? 'creation-modal__toggle-option--active' : ''}`}
                                >
                                    True
                                </button>
                                <button
                                    onClick={() => setFlagState(false)}
                                    className={`creation-modal__toggle-option ${!flagState ? 'creation-modal__toggle-option--active' : ''}`}
                                >
                                    False
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status-specific: initial value + optional min/max */}
                    {isStatus && (
                        <>
                            <div className="creation-modal__field">
                                <label className="creation-modal__label">Initial Value</label>
                                <input
                                    type="number"
                                    value={statusInitial}
                                    onChange={e => setStatusInitial(Number(e.target.value))}
                                    onKeyDown={handleKeyDown}
                                    className="creation-modal__input creation-modal__input--mono"
                                />
                            </div>
                            <div className="creation-modal__row">
                                <div className="creation-modal__field">
                                    <label className="creation-modal__label">
                                        Min <span className="creation-modal__label-hint">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={statusMin}
                                        onChange={e => setStatusMin(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="None"
                                        className="creation-modal__input creation-modal__input--mono"
                                    />
                                </div>
                                <div className="creation-modal__field">
                                    <label className="creation-modal__label">
                                        Max <span className="creation-modal__label-hint">(optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={statusMax}
                                        onChange={e => setStatusMax(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="None"
                                        className="creation-modal__input creation-modal__input--mono"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="creation-modal__footer">
                    <button onClick={onClose} className="button">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        className="button button--primary"
                        disabled={!nameInput.trim()}
                    >
                        Confirm
                    </button>
                </div>

            </div>
        </div>
    );
}
