import React, { useState, useEffect, useRef } from 'react';
import { useNarrativeStore } from 'store';

// ADDED: Phase 2 NameModal component for quickly creating named entities
// MODIFIED: Expanded to show entity-specific fields (boolean for flag, min/max for status)
// FIX: Added onConfirm prop for caller-controlled confirm (used by node creation modal flow)
export default function NameModal({ entityType, onClose, onConfirm }) {
  const [inputValue, setInputValue] = useState('');
  const [flagState, setFlagState] = useState(true);       // boolean for flags
  const [statusValue, setStatusValue] = useState(0);       // numeric for status
  const [statusMin, setStatusMin] = useState(undefined);
  const [statusMax, setStatusMax] = useState(undefined);
  const inputRef = useRef(null);
  
  const titleMap = {
    flag: 'New Flag',
    status: 'New Status',
    path: 'New Path',
    chapter: 'New Chapter',
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
      onConfirm(trimmed);
      onClose();
      return;
    }

    const store = useNarrativeStore.getState();
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
      default: break;
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    e.stopPropagation(); // PROTECTED: RISK-CMK-08 mitigation, prevents global escape from clearing selection
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
          {titleMap[entityType] || 'New Entity'}
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

          {/* ADDED: Flag-specific field: initial boolean state */}
          {entityType === 'flag' && (
            <div className="name-modal__field">
              <label className="name-modal__label">Initial State</label>
              <div className="name-modal__toggle-row">
                <label className="name-modal__toggle-option">
                  <input
                    type="radio"
                    name="flag-state"
                    checked={flagState === true}
                    onChange={() => setFlagState(true)}
                  />
                  <span>True</span>
                </label>
                <label className="name-modal__toggle-option">
                  <input
                    type="radio"
                    name="flag-state"
                    checked={flagState === false}
                    onChange={() => setFlagState(false)}
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* ADDED: Status-specific fields: initial value, min, max */}
          {entityType === 'status' && (
            <>
              <div className="name-modal__field">
                <label className="name-modal__label">Initial Value</label>
                <input
                  type="number"
                  className="name-modal__input"
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
          <button className="button" onClick={onClose}>Cancel</button>
          <button 
            className="button button--primary" 
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
