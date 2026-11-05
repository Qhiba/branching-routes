// ADDED (Redesign Step 7): pick several entities (flags, tags, collectibles…) — selected ones show as removable
// chips, the rest are offered in an "Add…" select (grouped with <optgroup> when options carry a `group`).
// Design-system primitives only (AR-37). Purely presentational: the caller owns the data and the store action.
import React from 'react';
import { X } from 'lucide-react';
import './fields.css';

/**
 * @param {string} id               base id for label association
 * @param {string} label
 * @param {Array<{id: string, name: string, group?: string}>} options
 * @param {string[]} selectedIds
 * @param {(id: string) => void} onToggle   add or remove one id
 * @param {string} [emptyText]       shown when nothing is selected
 * @param {string} [noOptionsText]   shown when there is nothing to pick from at all
 * @param {string} [route]           optional data-route for a route dot on each chip
 * @param {boolean} [disabled]
 */
export default function ChipsField({ id, label, options, selectedIds, onToggle, emptyText = 'None', noOptionsText, route, disabled = false }) {
    const byId = Object.fromEntries(options.map(o => [o.id, o]));
    const selected = (selectedIds || []).filter(sid => byId[sid]);
    const available = options.filter(o => !selected.includes(o.id));
    const groups = [...new Set(available.map(o => o.group || ''))];

    return (
        <div className="br-field">
            <label className="br-field__label" htmlFor={`${id}-add`}>{label}</label>
            {options.length === 0 ? (
                <span className="br-field__hint">{noOptionsText || 'Nothing to choose from yet.'}</span>
            ) : (
                <>
                    <div className="br-chipsfield__chips">
                        {selected.length === 0 && <span className="br-field__hint">{emptyText}</span>}
                        {selected.map(sid => (
                            <span key={sid} className="br-chip br-chipsfield__chip" data-route={route}>
                                {route && <span className="br-route" />}
                                <span className="br-chipsfield__name">{byId[sid].name}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        className="br-chipsfield__remove"
                                        aria-label={`Remove ${byId[sid].name}`}
                                        onClick={() => onToggle(sid)}
                                    >
                                        <X size={11} />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                    {!disabled && available.length > 0 && (
                        <select
                            id={`${id}-add`}
                            className="br-select br-chipsfield__add"
                            value=""
                            onChange={e => { if (e.target.value) onToggle(e.target.value); }}
                        >
                            <option value="">Add…</option>
                            {groups.length > 1 || groups[0]
                                ? groups.map(g => (
                                    <optgroup key={g || '_'} label={g || 'Other'}>
                                        {available.filter(o => (o.group || '') === g).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </optgroup>
                                ))
                                : available.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    )}
                </>
            )}
        </div>
    );
}
