// ADDED (Redesign Step 4): create / rename dialog for collectibles and collectible categories.
// Built on design-system primitives (AR-37), rendered through ModalPortal, Enter confirms, Esc cancels (AR-35).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNarrativeStore, useUIStore, useToastStore, beginGroup, endGroup } from 'store';
import useFocusTrap from 'hooks/useFocusTrap';
import ModalPortal from './ModalPortal';
import { isConfirmEnter } from 'utils';

// CHANGED (2026-11-05): new collectibles can be created in a batch ("Sequential mode", same start / end / padding
// settings as sequential flags, shared through uiStore): "CG" with 1-3 and padding 2 -> "CG 01", "CG 02", "CG 03".
const MAX_BATCH = 200;

/**
 * @param {'collectible'|'category'} kind
 * @param {object|null} initialData existing entity when editing, null when creating
 * @param {string|null} [defaultCategoryId] preselected category for a new collectible
 */
export default function CollectibleDialog({ kind, initialData, defaultCategoryId = null, onClose }) {
    const containerRef = useFocusTrap(true);
    const inputRef = useRef(null);
    const categories = useNarrativeStore(s => s.collectibleCategory);
    const [name, setName] = useState(initialData?.name || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? defaultCategoryId ?? '');

    // Sequential batch mode (new collectibles only)
    const [seqMode, setSeqMode] = useState(false);
    const seqStart = useUIStore(s => s.seqStart);
    const seqEnd = useUIStore(s => s.seqEnd);
    const seqPad = useUIStore(s => s.seqPad);
    const setSeqStart = useUIStore(s => s.setSeqStart);
    const setSeqEnd = useUIStore(s => s.setSeqEnd);
    const setSeqPad = useUIStore(s => s.setSeqPad);

    const isCategory = kind === 'category';
    const isEdit = !!initialData;
    const title = isCategory
        ? (isEdit ? 'Rename category' : 'New category')
        : (isEdit ? 'Edit collectible' : 'New collectible');
    const confirmLabel = isEdit ? 'Save' : (isCategory ? 'Create category' : (seqMode ? 'Create collectibles' : 'Create collectible'));
    const canBatch = !isCategory && !isEdit;
    const batchOn = canBatch && seqMode;
    const batchCount = seqEnd - seqStart + 1;
    const seqNames = useMemo(() => {
        const base = name.trim();
        if (!base || batchCount < 1 || batchCount > MAX_BATCH) return [];
        return Array.from({ length: batchCount }, (_, i) => `${base} ${String(seqStart + i).padStart(seqPad, '0')}`);
    }, [name, seqStart, batchCount, seqPad]);
    const canConfirm = name.trim().length > 0 && (!batchOn || seqNames.length > 0);

    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

    const confirm = () => {
        if (!canConfirm) return;
        const store = useNarrativeStore.getState();
        try {
            if (isCategory) {
                if (isEdit) store.updateCollectibleCategory(initialData.id, { name: name.trim() });
                else store.addCollectibleCategory(name);
            } else if (isEdit) {
                store.updateCollectible(initialData.id, { name: name.trim(), categoryId: categoryId || null });
            } else if (batchOn) {
                beginGroup(); // one undo step for the whole batch (AR-39)
                try { seqNames.forEach(n => store.addCollectible(n, categoryId || null)); } finally { endGroup(); }
            } else {
                store.addCollectible(name, categoryId || null);
            }
            onClose();
        } catch (err) {
            useToastStore.getState().addToast(err.message, 'error');
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
        if (isConfirmEnter(e)) { e.preventDefault(); confirm(); }
        e.stopPropagation(); // keep single-key canvas shortcuts from firing while typing
    };

    return (
        <ModalPortal>
            <div className="br-dialog-backdrop" onClick={onClose}>
                <div
                    ref={containerRef}
                    className="br-dialog br-dialog--sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="br-collectible-dialog-title"
                    onClick={e => e.stopPropagation()}
                    onKeyDown={onKeyDown}
                >
                    <div className="br-dialog__header">
                        <h2 id="br-collectible-dialog-title" className="br-dialog__title">{title}</h2>
                        <button className="br-btn br-btn--ghost br-btn--icon" onClick={onClose} aria-label="Close">
                            <X />
                        </button>
                    </div>
                    <div className="br-dialog__body br-dialog__body--form">
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="br-collectible-name">Name</label>
                            <input
                                id="br-collectible-name"
                                ref={inputRef}
                                className="br-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={isCategory ? 'CG, Live2D, Items, Achievements…' : 'Rooftop confession CG'}
                            />
                        </div>
                        {!isCategory && (
                            <div className="br-field">
                                <label className="br-field__label" htmlFor="br-collectible-category">Category</label>
                                <select
                                    id="br-collectible-category"
                                    className="br-select"
                                    value={categoryId || ''}
                                    onChange={e => setCategoryId(e.target.value)}
                                >
                                    <option value="">No category</option>
                                    {Object.values(categories).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {canBatch && (
                            <>
                                <div className="br-setting">
                                    <div className="br-setting__text">
                                        <label htmlFor="br-collectible-seq" className="br-setting__label">Sequential mode</label>
                                        <p className="br-setting__hint">Create several numbered collectibles at once.</p>
                                    </div>
                                    <button
                                        id="br-collectible-seq"
                                        type="button"
                                        role="switch"
                                        aria-checked={seqMode}
                                        onClick={() => setSeqMode(v => !v)}
                                        className="br-switch"
                                    >
                                        <span className="br-switch__thumb" />
                                    </button>
                                </div>
                                {seqMode && (
                                    <>
                                        <div className="br-collectible-seq">
                                            <div className="br-field">
                                                <label className="br-field__label" htmlFor="br-collectible-seq-start">Start at</label>
                                                <input id="br-collectible-seq-start" type="number" className="br-input" min={0}
                                                    value={seqStart} onChange={e => setSeqStart(Number(e.target.value))} />
                                            </div>
                                            <div className="br-field">
                                                <label className="br-field__label" htmlFor="br-collectible-seq-end">Ends at</label>
                                                <input id="br-collectible-seq-end" type="number" className="br-input" min={seqStart}
                                                    value={seqEnd} onChange={e => setSeqEnd(Math.max(seqStart, Number(e.target.value)))} />
                                            </div>
                                            <div className="br-field">
                                                <label className="br-field__label" htmlFor="br-collectible-seq-pad">Padding</label>
                                                <input id="br-collectible-seq-pad" type="number" className="br-input" min={1} max={6}
                                                    value={seqPad} onChange={e => setSeqPad(Math.max(1, Math.min(6, Number(e.target.value))))} />
                                            </div>
                                        </div>
                                        {batchCount > MAX_BATCH && (
                                            <span className="br-field__hint">That is more than {MAX_BATCH} collectibles. Use a smaller range.</span>
                                        )}
                                        {seqNames.length > 0 && (
                                            <div className="br-field">
                                                <span className="br-field__label">Preview: {seqNames.length} collectible{seqNames.length > 1 ? 's' : ''}</span>
                                                <div className="br-collectible-seq__preview">
                                                    {seqNames.map(n => <span key={n} className="br-chip">{n}</span>)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="br-dialog__footer">
                        <button className="br-btn" onClick={onClose}>Cancel</button>
                        <button className="br-btn br-btn--primary" onClick={confirm} disabled={!canConfirm}>{confirmLabel}</button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    );
}
