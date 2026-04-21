import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * CreationModal
 *
 * A small (360px) centred modal for creating new named narrative entities.
 * Adapts its body based on entityType:
 *
 *   'Flags'  — Name input + True/False initial-state segmented control
 *   'Status' — Name input + Initial value + optional Min/Max numeric inputs
 *   'Chapter'| 'Paths' — Name input only
 *   null     — Renders nothing (hidden)
 *
 * Local state:
 *  - nameInput      : the text the user is typing (always reset on mount)
 *  - flagState      : boolean toggle for Flag initial value (UI-only)
 *  - statusInitial  : number for Status initial value (UI-only)
 *  - statusMin/Max  : optional bounds (UI-only)
 *
 * All state above is purely transient UI state (AR-03 compliant). The parent
 * receives final values only through `onConfirm`.
 *
 * Props:
 *  entityType {string|null}  'Flags' | 'Status' | 'Chapter' | 'Paths' | null
 *  onClose    {Function}     Called when the modal should close without action.
 *  onConfirm  {Function}     Called with a data object on confirm:
 *                             - Flags:  { name, initialState: boolean }
 *                             - Status: { name, initialValue, min, max }
 *                             - others: { name }
 *
 * Real-app wiring:
 *  entityType  ← uiStore field or local state in the parent (e.g. LeftSidebar)
 *  onClose     → set entityType to null
 *  onConfirm   → narrativeStore.addFlag({ name, defaultValue })
 *                narrativeStore.addStatus({ name, defaultValue, min, max })
 *                narrativeStore.addChapter({ name }) / addPath({ name })
 *
 * Note: The existing NameModal.jsx handles text-only entity creation for
 * Chapter and Paths via keyboard shortcuts. This component is the richer
 * UI-integrated equivalent used from LeftSidebar's "+" button.
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
    // Singular display label: "Flags" → "Flag", "Status" → "Status", "Paths" → "Path"
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
        // Reset transient state
        setNameInput('');
        setFlagState(true);
        setStatusInitial(0);
        setStatusMin('');
        setStatusMax('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl w-[360px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200">New {entityLabel}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-5">
                    {/* Name */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                            Name
                        </label>
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            placeholder={`Enter ${entityLabel.toLowerCase()} name...`}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner"
                            autoFocus
                        />
                    </div>

                    {/* Flag-specific: initial state toggle */}
                    {isFlag && (
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                Initial State
                            </label>
                            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 relative">
                                <div
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-md transition-all duration-200 ease-out ${flagState ? 'left-1' : 'left-[calc(50%+2px)]'
                                        }`}
                                />
                                <button
                                    onClick={() => setFlagState(true)}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md z-10 transition-colors ${flagState ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    True
                                </button>
                                <button
                                    onClick={() => setFlagState(false)}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md z-10 transition-colors ${!flagState ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    False
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status-specific: initial value + optional min/max */}
                    {isStatus && (
                        <>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                    Initial Value
                                </label>
                                <input
                                    type="number"
                                    value={statusInitial}
                                    onChange={(e) => setStatusInitial(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                        Min{' '}
                                        <span className="normal-case font-medium opacity-60">
                                            (Optional)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={statusMin}
                                        onChange={(e) => setStatusMin(e.target.value)}
                                        placeholder="None"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono placeholder:font-sans"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">
                                        Max{' '}
                                        <span className="normal-case font-medium opacity-60">
                                            (Optional)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        value={statusMax}
                                        onChange={(e) => setStatusMax(e.target.value)}
                                        placeholder="None"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-md px-3 py-2 outline-none text-slate-200 text-sm transition-colors shadow-inner font-mono placeholder:font-sans"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-md shadow-indigo-900/20 transition-all active:scale-95"
                    >
                        Confirm
                    </button>
                </div>

            </div>
        </div>
    );
}
