import React, { useState, useEffect, useRef } from 'react';
import { useNarrativeStore } from 'store';
import { X } from 'lucide-react';

export default function NameModal({ entityType, initialData, onClose, onConfirm }) {
  const [inputValue, setInputValue] = useState(initialData?.name || '');
  const [flagState, setFlagState] = useState(initialData?.state ?? false);
  const [statusValue, setStatusValue] = useState(initialData?.value ?? 0);
  const [statusMin, setStatusMin] = useState(initialData?.minValue ?? undefined);
  const [statusMax, setStatusMax] = useState(initialData?.maxValue ?? undefined);
  const inputRef = useRef(null);

  const titleMap = {
    flag: initialData ? 'Edit Flag' : 'New Flag',
    status: initialData ? 'Edit Status' : 'New Status',
    path: initialData ? 'Edit Path' : 'New Path',
    chapter: initialData ? 'Edit Chapter' : 'New Chapter',
    commonType: initialData ? 'Edit Common Type' : 'New Common Type',
    endingType: initialData ? 'Edit Ending Type' : 'New Ending Type',
    common: 'New Common Node',
    choice: 'New Choice Node',
    ending: 'New Ending Node',
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (onConfirm) {
      onConfirm(trimmed, { flagState, statusValue, statusMin, statusMax });
      onClose();
      return;
    }

    const store = useNarrativeStore.getState();
    if (initialData) {
      // update mode
      switch (entityType) {
        case 'flag':
          store.updateFlag(initialData.id, { name: trimmed, state: flagState });
          break;
        case 'status':
          store.updateStatus(initialData.id, { name: trimmed, value: statusValue, minValue: statusMin, maxValue: statusMax });
          break;
        case 'path':
          store.updatePath(initialData.id, { name: trimmed });
          break;
        case 'chapter':
          store.updateChapter(initialData.id, { name: trimmed });
          break;
        case 'commonType':
          store.updateCommonType(initialData.id, { name: trimmed });
          break;
        case 'endingType':
          store.updateEndingType(initialData.id, { name: trimmed });
          break;
        default: break;
      }
    } else {
      // create mode
      switch (entityType) {
        case 'flag':
          store.addFlag(trimmed, flagState);
          break;
        case 'status':
          store.addStatus(trimmed, statusValue, statusMin, statusMax);
          break;
        case 'path':
          store.addPath(trimmed);
          break;
        case 'chapter':
          store.addChapter(trimmed);
          break;
        case 'commonType':
          store.addCommonType(trimmed);
          break;
        case 'endingType':
          store.addEndingType(trimmed);
          break;
        default: break;
      }
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  const isConfirmDisabled = inputValue.trim() === '';

  return (
    <div className="name-modal__backdrop" onClick={onClose}>
      <div className="name-modal" onClick={e => e.stopPropagation()}>
        <div className="name-modal__header">
          <span>{titleMap[entityType] || 'New Entity'}</span>
          <button className="name-modal__close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="name-modal__body">
          <div className="name-modal__field">
            <label className="name-modal__label">Name</label>
            <input
              type="text"
              ref={inputRef}
              className="name-modal__input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${entityType} name...`}
            />
          </div>

          {entityType === 'flag' && (
            <div className="name-modal__field">
              <label className="name-modal__label">Initial State</label>
              <div className="name-modal__toggle-row">
                <div className="name-modal__toggle-slider" style={{ transform: flagState ? 'translateX(0)' : 'translateX(100%)' }}></div>
                <div className="name-modal__toggle-option" onClick={() => setFlagState(true)} style={{ color: flagState ? 'white' : 'var(--color-text-secondary)' }}>True</div>
                <div className="name-modal__toggle-option" onClick={() => setFlagState(false)} style={{ color: !flagState ? 'white' : 'var(--color-text-secondary)' }}>False</div>
              </div>
            </div>
          )}

          {entityType === 'status' && (
            <>
              <div className="name-modal__field">
                <label className="name-modal__label">Initial Value</label>
                <input
                  type="number"
                  className="name-modal__input"
                  style={{ fontFamily: 'monospace' }}
                  value={statusValue}
                  onChange={e => setStatusValue(Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="name-modal__row">
                <div className="name-modal__field">
                  <label className="name-modal__label">Min (optional)</label>
                  <input
                    type="number"
                    className="name-modal__input"
                    style={{ fontFamily: 'monospace' }}
                    value={statusMin ?? ''}
                    placeholder="None"
                    onChange={e => setStatusMin(e.target.value === '' ? undefined : Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="name-modal__field">
                  <label className="name-modal__label">Max (optional)</label>
                  <input
                    type="number"
                    className="name-modal__input"
                    style={{ fontFamily: 'monospace' }}
                    value={statusMax ?? ''}
                    placeholder="None"
                    onChange={e => setStatusMax(e.target.value === '' ? undefined : Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="name-modal__footer">
          <button className="button" style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', boxShadow: 'none' }} onClick={onClose}>Cancel</button>
          <button
            className="button button--primary"
            style={{ padding: '8px 24px', borderRadius: '6px' }}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
