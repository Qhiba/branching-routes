// ADDED (Redesign Step 7): edit a node's status effects ({ statusId, amount, mode: 'add' | 'set' }).
// Presentational; the caller writes the new array through a store action (AR-04).
import React from 'react';
import { Plus, X } from 'lucide-react';
import './fields.css';

export default function StatusEffectsField({ id, label = 'Statuses on enter', statuses, effects, onChange, disabled = false }) {
    const list = effects || [];
    const update = (idx, patch) => onChange(list.map((se, i) => (i === idx ? { ...se, ...patch } : se)));
    const remove = (idx) => onChange(list.filter((_, i) => i !== idx));
    const add = () => onChange([...list, { statusId: statuses[0]?.id || '', amount: 0, mode: 'add' }]);

    return (
        <div className="br-field">
            <span className="br-field__label" id={`${id}-label`}>{label}</span>
            {statuses.length === 0 ? (
                <span className="br-field__hint">No statuses yet. Create one in the Status panel on the left.</span>
            ) : (
                <div className="br-statusfx" role="group" aria-labelledby={`${id}-label`}>
                    {list.length === 0 && <span className="br-field__hint">None</span>}
                    {list.map((se, idx) => (
                        <div key={idx} className="br-statusfx__row">
                            <select
                                className="br-select"
                                aria-label="Status"
                                value={se.statusId}
                                disabled={disabled}
                                onChange={e => update(idx, { statusId: e.target.value })}
                            >
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <div className="br-segmented" role="radiogroup" aria-label="Change type">
                                <button type="button" className="br-segment" role="radio" disabled={disabled}
                                    aria-checked={(se.mode || 'add') === 'add'} title="Add to the current value"
                                    onClick={() => update(idx, { mode: 'add' })}>±</button>
                                <button type="button" className="br-segment" role="radio" disabled={disabled}
                                    aria-checked={se.mode === 'set'} title="Set to this value"
                                    onClick={() => update(idx, { mode: 'set' })}>=</button>
                            </div>
                            <input
                                className="br-input br-statusfx__amount"
                                type="number"
                                aria-label={se.mode === 'set' ? 'Value' : 'Amount'}
                                value={se.amount ?? 0}
                                disabled={disabled}
                                onChange={e => update(idx, { amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                            />
                            {!disabled && (
                                <button type="button" className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-label="Remove status change" onClick={() => remove(idx)}>
                                    <X />
                                </button>
                            )}
                        </div>
                    ))}
                    {!disabled && (
                        <button type="button" className="br-btn br-btn--ghost br-btn--sm br-statusfx__add" onClick={add}>
                            <Plus />Add status change
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
