import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNarrativeStore, useUIStore } from 'store';
import { X } from 'lucide-react';

export default function NameModal({ entityType, initialData, onClose, onConfirm }) {
  const [inputValue, setInputValue] = useState(initialData?.name || '');
  const [flagState, setFlagState] = useState(initialData?.state ?? false);
  const [statusValue, setStatusValue] = useState(initialData?.value ?? 0);
  const [statusMin, setStatusMin] = useState(initialData?.minValue ?? undefined);
  const [statusMax, setStatusMax] = useState(initialData?.maxValue ?? undefined);
  const inputRef = useRef(null);

  // Sequential batch mode (only for new flags)
  const [seqMode, setSeqMode] = useState(false);
  const seqStart = useUIStore(s => s.seqStart);
  const seqEnd = useUIStore(s => s.seqEnd);
  const seqPad = useUIStore(s => s.seqPad);
  const setSeqStart = useUIStore(s => s.setSeqStart);
  const setSeqEnd = useUIStore(s => s.setSeqEnd);
  const setSeqPad = useUIStore(s => s.setSeqPad);

  const seqNames = useMemo(() => {
    const base = inputValue.trim();
    const count = seqEnd - seqStart + 1;
    if (!base || count < 1) return [];
    return Array.from({ length: count }, (_, i) => {
      const num = String(seqStart + i).padStart(seqPad, '0');
      return `${base}_${num}`;
    });
  }, [inputValue, seqStart, seqEnd, seqPad]);

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
          if (seqMode && seqNames.length > 0) {
            seqNames.forEach(name => { try { store.addFlag(name, flagState); } catch (_) {} });
          } else {
            store.addFlag(trimmed, flagState);
          }
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

  const isConfirmDisabled = inputValue.trim() === '' || (seqMode && !initialData && entityType === 'flag' && seqNames.length === 0);

  return (
    <div className="br-name-modal__backdrop" onClick={onClose}>
      <div className="br-name-modal" onClick={e => e.stopPropagation()}>
        <div className="br-name-modal__header">
          <span>{titleMap[entityType] || 'New Entity'}</span>
          <button className="br-name-modal__close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="br-name-modal__body">
          <div className="br-name-modal__field">
            <label className="br-name-modal__label">Name</label>
            <input
              type="text"
              ref={inputRef}
              className="br-name-modal__input"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${entityType} name...`}
            />
          </div>

          {entityType === 'flag' && (
            <div className="br-name-modal__field">
              <label className="br-name-modal__label">Initial State</label>
              <div className="br-name-modal__toggle-row">
                <div className="br-name-modal__toggle-slider" style={{ transform: flagState ? 'translateX(0)' : 'translateX(100%)' }}></div>
                <div className={`br-name-modal__toggle-option ${flagState ? 'br-name-modal__toggle-option--active' : 'br-name-modal__toggle-option--inactive'}`} onClick={() => setFlagState(true)}>True</div>
                <div className={`br-name-modal__toggle-option ${!flagState ? 'br-name-modal__toggle-option--active' : 'br-name-modal__toggle-option--inactive'}`} onClick={() => setFlagState(false)}>False</div>
              </div>
            </div>
          )}

          {entityType === 'flag' && !initialData && (
            <>
              <div className="br-name-modal__seq-toggle">
                <span className="br-name-modal__label">Sequential Mode</span>
                <button
                  type="button"
                  className={`br-name-modal__seq-pill ${seqMode ? 'br-name-modal__seq-pill--on' : ''}`}
                  onClick={() => setSeqMode(v => !v)}
                >
                  {seqMode ? 'On' : 'Off'}
                </button>
              </div>

              {seqMode && (
                <>
                  <div className="br-name-modal__row">
                    <div className="br-name-modal__field">
                      <label className="br-name-modal__label">Start at</label>
                      <input
                        type="number"
                        className="br-name-modal__input br-name-modal__input--mono"
                        min={0}
                        value={seqStart}
                        onChange={e => setSeqStart(Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="br-name-modal__field">
                      <label className="br-name-modal__label">Ends at</label>
                      <input
                        type="number"
                        className="br-name-modal__input br-name-modal__input--mono"
                        min={seqStart}
                        value={seqEnd}
                        onChange={e => setSeqEnd(Math.max(seqStart, Number(e.target.value)))}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="br-name-modal__field">
                      <label className="br-name-modal__label">Padding</label>
                      <input
                        type="number"
                        className="br-name-modal__input br-name-modal__input--mono"
                        min={1}
                        max={6}
                        value={seqPad}
                        onChange={e => setSeqPad(Math.max(1, Math.min(6, Number(e.target.value))))}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>

                  {seqNames.length > 0 && (
                    <div className="br-name-modal__field">
                      <label className="br-name-modal__label">Preview — {seqNames.length} flag{seqNames.length > 1 ? 's' : ''}</label>
                      <div className="br-name-modal__seq-preview">
                        {seqNames.map(n => (
                          <span key={n} className="br-name-modal__seq-chip">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {entityType === 'status' && (
            <>
              <div className="br-name-modal__field">
                <label className="br-name-modal__label">Initial Value</label>
                <input
                  type="number"
                  className="br-name-modal__input br-name-modal__input--mono"
                  value={statusValue}
                  onChange={e => setStatusValue(Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="br-name-modal__row">
                <div className="br-name-modal__field">
                  <label className="br-name-modal__label">Min (optional)</label>
                  <input
                    type="number"
                    className="br-name-modal__input br-name-modal__input--mono"
                    value={statusMin ?? ''}
                    placeholder="None"
                    onChange={e => setStatusMin(e.target.value === '' ? undefined : Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="br-name-modal__field">
                  <label className="br-name-modal__label">Max (optional)</label>
                  <input
                    type="number"
                    className="br-name-modal__input br-name-modal__input--mono"
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
        <div className="br-name-modal__footer">
          <button className="button br-name-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="button button--primary br-name-modal__btn-confirm"
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
