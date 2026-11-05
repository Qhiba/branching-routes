// ADDED (Redesign Step 4): create / rename dialog for collectibles and collectible categories.
// Built on design-system primitives (AR-37), rendered through ModalPortal, Enter confirms, Esc cancels (AR-35).
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNarrativeStore, useToastStore } from 'store';
import useFocusTrap from 'hooks/useFocusTrap';
import ModalPortal from './ModalPortal';
import { isConfirmEnter } from 'utils';

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

    const isCategory = kind === 'category';
    const isEdit = !!initialData;
    const title = isCategory
        ? (isEdit ? 'Rename category' : 'New category')
        : (isEdit ? 'Edit collectible' : 'New collectible');
    const confirmLabel = isEdit ? 'Save' : (isCategory ? 'Create category' : 'Create collectible');
    const canConfirm = name.trim().length > 0;

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
