import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import FormFooter from './FormFooter';
import ConditionEditor from '../../shared/ConditionEditor';
import SearchableDropdown from '../../shared/SearchableDropdown';

function FlagsSetEditor({ flagsSet, onChange, availableFlags }) {
  const addFlagMod = (flagId) => {
    if (!flagsSet.includes(flagId)) onChange([...flagsSet, flagId]);
  };
  const updateFlagMod = (idx, flagId) => {
    const next = [...flagsSet];
    next[idx] = flagId;
    onChange(next);
  };
  const removeFlagMod = (idx) => onChange(flagsSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {availableFlags.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No flags available.</div>
      ) : (
        <>
          {flagsSet.map((flagId, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
               <SearchableDropdown
                 value={flagId}
                 onChange={(val) => updateFlagMod(idx, val)}
                 options={availableFlags}
                 placeholder="Select Flag..."
                 showFilters={true}
                 className="flex-1 min-w-[140px]"
               />
               <button onClick={() => removeFlagMod(idx)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)] transition-colors">
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          ))}
          <button onClick={() => addFlagMod(availableFlags[0]?.id || '')} disabled={availableFlags.length===0}
            style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
          >
            + Set flag
          </button>
        </>
      )}
    </div>
  );
}

function StatusSetEditor({ statusSet, onChange, availableStatus }) {
  const addStatusMod = (statusId) => onChange([...statusSet, { status: statusId, amount: 0 }]);
  const updateStatusMod = (idx, updates) => {
    const next = [...statusSet];
    next[idx] = { ...next[idx], ...updates };
    onChange(next);
  };
  const removeStatusMod = (idx) => onChange(statusSet.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {availableStatus.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No statuses available.</div>
      ) : (
        <>
          {statusSet.map((mod, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
               <SearchableDropdown
                 value={mod.status}
                 onChange={val => updateStatusMod(idx, { status: val })}
                 options={availableStatus}
                 placeholder="Select Status..."
                 showFilters={false}
                 className="flex-1 min-w-0"
               />
               <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                 <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>±</span>
                 <input type="number" value={mod.amount} onChange={e => updateStatusMod(idx, { amount: parseInt(e.target.value,10)||0 })}
                   className="w-12 bg-transparent focus:outline-none text-right"
                   style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
                 />
               </div>
               <button onClick={() => removeStatusMod(idx)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)] transition-colors">
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
            </div>
          ))}
          <button onClick={() => addStatusMod(availableStatus[0]?.id || '')} disabled={availableStatus.length===0}
            style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer', width: '100%', textAlign: 'center' }}
          >
            + Modify status
          </button>
        </>
      )}
    </div>
  );
}

export default function ChoiceForm({ entityId, onSave, onCancel }) {
  const { flags, statusPoints, paths, chapters, choices, scenes, endings, entryNode, setEntryNode, addChoice, updateChoice, deleteChoice } = useEditor();
  const isNew = !entityId;
  const existingChoice = isNew ? null : choices[entityId];

  const [draft, setDraft] = useState({ text: '', path: null, chapter: null, requires: [], options: [] });
  const [expandedOptions, setExpandedOptions] = useState(new Set());

  useEffect(() => {
    if (existingChoice) {
      setDraft({ 
        text: existingChoice.text || '', 
        path: existingChoice.path || null, 
        chapter: existingChoice.chapter || null, 
        requires: existingChoice.requires || [], 
        options: existingChoice.options || [] 
      });
    } else {
      setDraft({ text: '', path: null, chapter: null, requires: [], options: [] });
    }
  }, [existingChoice, entityId]);

  const dropdownOptions = useMemo(() => [
    { id: null, name: "Current Choice (Loop)" },
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const handleSave = () => {
    if (isNew) {
      const newId = addChoice(draft.text);
      updateChoice(newId, draft);
    } else {
      updateChoice(entityId, draft);
    }
    onSave();
  };

  const handleDelete = () => {
    if (isNew) return;
    const referencingScenes = Object.values(scenes).filter(s => s.next && s.next.some(r => r.target === entityId)).map(s => s.id);
    const referencingChoices = Object.values(choices).filter(c => c.options && c.options.some(opt => opt.next === entityId)).map(c => c.id);
    
    if (referencingScenes.length > 0 || referencingChoices.length > 0) {
      alert(`${entityId} is referenced as a next target in: ${[...referencingScenes, ...referencingChoices].join(', ')}. Remove those references first.`);
      return;
    }

    if (window.confirm("Delete this choice?")) {
      deleteChoice(entityId);
      onCancel();
    }
  };

  const toggleOption = (id) => {
    setExpandedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const internalAddOption = () => {
    const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setDraft({
      ...draft,
      options: [...draft.options, { id: optId, label: 'New Option', requires: [], flags_set: [], status_set: [], next: null }]
    });
  };

  const internalUpdateOption = (idx, newOpt) => {
    const newOptions = [...draft.options];
    newOptions[idx] = newOpt;
    setDraft({ ...draft, options: newOptions });
  };

  const internalDeleteOption = (idx) => {
    const newOptions = draft.options.filter((_, i) => i !== idx);
    setDraft({ ...draft, options: newOptions });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            {isNew ? 'New Choice Prompt' : 'Choice Prompt Text'}
          </label>
          <input
            type="text"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            className="w-full px-3 py-2 rounded-md focus:outline-none transition-colors"
            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-ui)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
            placeholder="Choice prompt text..."
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Path</label>
                <select value={draft.path || ''} onChange={(e) => setDraft({ ...draft, path: e.target.value || null })}
                  className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                >
                  <option value="">No Path</option>
                  {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Chapter</label>
                <select value={draft.chapter || ''} onChange={(e) => setDraft({ ...draft, chapter: e.target.value || null })}
                  className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                >
                  <option value="">No Chapter</option>
                  {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Requires</label>
              <ConditionEditor
                conditions={draft.requires}
                onChange={(newReqs) => setDraft({ ...draft, requires: newReqs })}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
              <div className="flex items-center justify-between mb-3">
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Options</label>
                <button
                  onClick={internalAddOption}
                  style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                >
                  + Add option
                </button>
              </div>

              {(!draft.options || draft.options.length === 0) ? (
                <div className="py-4 text-center" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No options added.</div>
              ) : (
                <div className="space-y-2">
                  {draft.options.map((opt, idx) => {
                    const optKey = opt.id || `draft-opt-${idx}`;
                    const isOptExpanded = expandedOptions.has(optKey);

                    return (
                    <div key={optKey} className="rounded-md overflow-hidden" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                      <div
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                        onClick={() => toggleOption(optKey)}
                      >
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {isOptExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: opt.label ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                          {opt.label || `Option ${idx + 1}`}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); internalDeleteOption(idx); }}
                          className="p-1 rounded transition-colors ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isOptExpanded && (
                      <div className="px-3 pb-3 space-y-4" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                        <div className="pt-3">
                          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Option label</label>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => internalUpdateOption(idx, { ...opt, label: e.target.value })}
                            className="w-full rounded-md px-2.5 py-1.5 focus:outline-none transition-colors"
                            style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-primary)', fontSize: 13 }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-border-active)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border-row)'}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Requires</label>
                          <ConditionEditor
                            conditions={opt.requires || []}
                            onChange={(newReqs) => internalUpdateOption(idx, { ...opt, requires: newReqs })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Flags set</label>
                          <FlagsSetEditor
                            flagsSet={opt.flags_set || []}
                            onChange={(newFlagsSet) => internalUpdateOption(idx, { ...opt, flags_set: newFlagsSet })}
                            availableFlags={Object.values(flags)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Status set</label>
                          <StatusSetEditor
                            statusSet={opt.status_set || []}
                            onChange={(newStatusSet) => internalUpdateOption(idx, { ...opt, status_set: newStatusSet })}
                            availableStatus={Object.values(statusPoints)}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Next →</label>
                          <SearchableDropdown
                            value={opt.next || null}
                            onChange={(val) => internalUpdateOption(idx, { ...opt, next: val || null })}
                            options={dropdownOptions.filter(o => o.id !== entityId)}
                            placeholder="Loop (disable this option)"
                            showFilters={true}
                          />
                        </div>
                      </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {!isNew && (
              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
                 <button
                   onClick={() => setEntryNode(entityId)}
                   className="w-full px-2 py-1.5 rounded-md transition-colors"
                   style={{
                     fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                     background: entryNode === entityId ? 'rgba(0,209,255,0.08)' : 'transparent',
                     border: entryNode === entityId ? '1px solid rgba(0,209,255,0.2)' : '1px solid var(--color-border-ghost)',
                     color: entryNode === entityId ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                   }}
                 >
                   {entryNode === entityId ? '✓ Entry Node' : 'Set Entry Node'}
                 </button>
              </div>
            )}

            {!isNew && (
              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-ghost)' }}>
                <div className="flex justify-between items-center">
                   <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>ID: {entityId}</span>
                   <button onClick={handleDelete} className="p-1.5 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]" title="Delete Choice">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            )}
      </div>
      <FormFooter onSave={handleSave} onCancel={onCancel} saveDisabled={!draft.text.trim()} />
    </div>
  );
}
