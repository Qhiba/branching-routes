import React, { useState, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, Trash2, ChevronDown, ChevronRight, FoldVertical, UnfoldVertical } from 'lucide-react';
import ConditionEditor from '../shared/ConditionEditor';
import QuickNav from '../shared/QuickNav';
import SearchableDropdown from '../shared/SearchableDropdown';
import DebouncedInput from '../shared/DebouncedInput';
import { hasConditions } from '../../utils/conditionUtils';

export default function ChoiceEditor() {
  const { flags, statusPoints, paths, chapters, choices, scenes, endings, entryNode, setEntryNode, addChoice, updateChoice, addChoiceOption, updateChoiceOption, deleteChoiceOption, deleteChoice } = useEditor();
  const [expandedChoices, setExpandedChoices] = useState(new Set());
  const [expandedOptions, setExpandedOptions] = useState(new Set());

  const dropdownOptions = useMemo(() => [
    { id: null, name: "Current Choice (Loop)" },
    ...Object.values(scenes).map(s => ({ ...s, name: `[Scene] ${s.name}`, type: 'Scene' })),
    ...Object.values(choices).map(c => ({ ...c, name: `[Choice] ${c.text}`, type: 'Choice' })),
    ...Object.values(endings).map(e => ({ ...e, name: `[Ending] ${e.name}`, type: 'Ending' }))
  ], [scenes, choices, endings]);

  const toggleChoice = (id) => {
    setExpandedChoices(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleOption = (id) => {
    setExpandedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedChoices(new Set(Object.keys(choices)));
  const collapseAll = () => setExpandedChoices(new Set());

  return (
    <div className="flex items-start relative h-full" style={{ background: 'var(--color-surface-workspace)' }}>
      <div className="flex-1 w-full min-w-0 p-6 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Choice Editor
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={collapseAll} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Collapse All"><FoldVertical className="w-4 h-4" /></button>
            <button onClick={expandAll} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }} title="Expand All"><UnfoldVertical className="w-4 h-4" /></button>
            <button
              onClick={() => addChoice("")}
              className="signature-gradient"
              style={{ color: '#0a1a1f', border: 'none', borderRadius: 24, padding: '5px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Add Choice
            </button>
          </div>
        </div>

        {Object.values(choices).length === 0 ? (
          <div className="py-10 text-center" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No choices created yet.</div>
        ) : (
          <div className="space-y-2">
            {Object.values(choices)
              .sort((a, b) => parseInt(b.id.replace('CH', '')) - parseInt(a.id.replace('CH', '')))
              .map(choice => {
              const isExpanded = expandedChoices.has(choice.id);
              const condCount = (choice.requires || []).length;
              const optCount = (choice.options || []).length;

              return (
              <div key={choice.id} id={choice.id} className="scroll-mt-4 rounded-lg overflow-hidden" style={{ background: 'var(--color-surface-card)', border: '1px solid var(--color-border-ghost)', borderLeft: '3px solid var(--color-accent-primary-dim)' }}>
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ background: isExpanded ? 'var(--color-surface-card-low)' : 'transparent' }}
                  onClick={() => toggleChoice(choice.id)}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{choice.id}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: choice.text ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    {choice.text || 'unnamed_choice'}
                  </span>

                  {!isExpanded && (
                    <div className="flex items-center gap-2 ml-auto" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {choice.path && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-card-low)' }}>{paths[choice.path]?.name || choice.path}</span>}
                      {choice.chapter && <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-card-low)' }}>{chapters[choice.chapter]?.name || choice.chapter}</span>}
                    </div>
                  )}

                  {!isExpanded && (
                    <span className="ml-2" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {condCount} conditions · {optCount} options
                    </span>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                <div className="px-4 py-4 space-y-5" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                  <DebouncedInput
                    type="text"
                    value={choice.text}
                    onChange={(val) => updateChoice(choice.id, { text: val })}
                    className="w-full bg-transparent focus:outline-none"
                    style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-row)', padding: '4px 0' }}
                    onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-border-active)'}
                    onBlur={(e) => e.target.style.borderBottomColor = 'var(--color-border-row)'}
                    placeholder="Choice prompt text..."
                  />

                  {/* Path/Chapter */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Path</label>
                      <select value={choice.path || ''} onChange={(e) => updateChoice(choice.id, { path: e.target.value || null })}
                        className="w-full rounded-md px-2.5 py-1.5 focus:outline-none"
                        style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                      >
                        <option value="">No Path</option>
                        {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Chapter</label>
                      <select value={choice.chapter || ''} onChange={(e) => updateChoice(choice.id, { chapter: e.target.value || null })}
                        className="w-full rounded-md px-2.5 py-1.5 focus:outline-none"
                        style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)', fontSize: 12 }}
                      >
                        <option value="">No Chapter</option>
                        {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Requires */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Requires</label>
                    <ConditionEditor
                      conditions={choice.requires || []}
                      onChange={(newReqs) => updateChoice(choice.id, { requires: newReqs })}
                    />
                  </div>

                  {/* Options */}
                  <div style={{ borderTop: '1px solid var(--color-border-ghost)', paddingTop: 16 }}>
                    <div className="flex items-center justify-between mb-3">
                      <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Options</label>
                      <button
                        onClick={() => addChoiceOption(choice.id)}
                        style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                      >
                        + Add option
                      </button>
                    </div>

                    {(!choice.options || choice.options.length === 0) ? (
                      <div className="py-4 text-center" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No options added.</div>
                    ) : (
                      <div className="space-y-2">
                        {choice.options.map((opt, idx) => {
                          const optKey = opt.id || `${choice.id}-opt-${idx}`;
                          const isOptExpanded = expandedOptions.has(optKey);

                          return (
                          <div key={optKey} className="rounded-md overflow-hidden" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                            {/* Option header */}
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
                              {!isOptExpanded && (() => {
                                const nextArr = Array.isArray(opt.next) ? opt.next : [];
                                const hasTargets = nextArr.some(e => e.target);
                                if (!hasTargets) return null;
                                return (
                                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                    → {nextArr.filter(e => e.target).length} target{nextArr.filter(e => e.target).length !== 1 ? 's' : ''}
                                  </span>
                                );
                              })()}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteChoiceOption(choice.id, idx); }}
                                className="p-1 rounded transition-colors ml-auto"
                                style={{ color: 'var(--color-text-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Option expanded */}
                            {isOptExpanded && (
                            <div className="px-3 pb-3 space-y-4" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                              <div className="pt-3">
                                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Option label</label>
                                <DebouncedInput
                                  type="text"
                                  value={opt.label}
                                  onChange={(val) => updateChoiceOption(choice.id, idx, { ...opt, label: val })}
                                  className="w-full rounded-md px-2.5 py-1.5 focus:outline-none"
                                  style={{ background: 'var(--color-surface-card-low)', border: '1px solid transparent', color: 'var(--color-text-primary)', fontSize: 13 }}
                                  placeholder="e.g. Yes, I accept..."
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Requires</label>
                                <ConditionEditor
                                  conditions={opt.requires || []}
                                  onChange={(newReqs) => updateChoiceOption(choice.id, idx, { ...opt, requires: newReqs })}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Flags set</label>
                                <FlagsSetEditor
                                  flagsSet={opt.flags_set || []}
                                  onChange={(newFlagsSet) => updateChoiceOption(choice.id, idx, { ...opt, flags_set: newFlagsSet })}
                                  availableFlags={Object.values(flags)}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Status set</label>
                                <StatusSetEditor
                                  statusSet={opt.status_set || []}
                                  onChange={(newStatusSet) => updateChoiceOption(choice.id, idx, { ...opt, status_set: newStatusSet })}
                                  availableStatus={Object.values(statusPoints)}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next targets</label>
                                  <button
                                    onClick={() => {
                                      const nextArr = Array.isArray(opt.next) ? opt.next : [];
                                      updateChoiceOption(choice.id, idx, { ...opt, next: [...nextArr, { _id: `route_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, requires: { operator: 'and', conditions: [] }, target: '' }] });
                                    }}
                                    style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                                  >
                                    + Add target
                                  </button>
                                </div>
                                {(() => {
                                  const nextArr = Array.isArray(opt.next) ? opt.next : [];
                                  if (nextArr.length === 0) {
                                    return (
                                      <div className="py-2 px-3 text-center rounded-md" style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                                        No targets — option loops back
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="space-y-2">
                                      {nextArr.map((entry, rIdx) => {
                                        const isFallback = rIdx === nextArr.length - 1 && !hasConditions(entry.requires);
                                        return (
                                          <div key={entry._id || rIdx} className="p-2.5 rounded-md relative" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                                            <div className="flex items-start gap-2">
                                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{rIdx + 1}.</span>
                                              <div className="flex-1 space-y-2 min-w-0">
                                                {isFallback ? (
                                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Fallback · always matches</span>
                                                ) : (
                                                  <ConditionEditor
                                                    conditions={entry.requires || []}
                                                    onChange={(newReqs) => {
                                                      const updated = [...nextArr];
                                                      updated[rIdx] = { ...entry, requires: newReqs };
                                                      updateChoiceOption(choice.id, idx, { ...opt, next: updated });
                                                    }}
                                                  />
                                                )}
                                                <div className="flex items-center gap-2">
                                                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>→</span>
                                                  <SearchableDropdown
                                                    value={entry.target || null}
                                                    onChange={(val) => {
                                                      const updated = [...nextArr];
                                                      updated[rIdx] = { ...entry, target: val || '' };
                                                      updateChoiceOption(choice.id, idx, { ...opt, next: updated });
                                                    }}
                                                    options={dropdownOptions}
                                                    placeholder="Select target..."
                                                    showFilters={true}
                                                    className="flex-1 min-w-0"
                                                  />
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  const updated = nextArr.filter((_, i) => i !== rIdx);
                                                  updateChoiceOption(choice.id, idx, { ...opt, next: updated });
                                                }}
                                                className="p-1 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-accent-error)]"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {nextArr.length > 0 && hasConditions(nextArr[nextArr.length - 1].requires) && (
                                        <div className="py-2 px-3 mt-1 rounded-md" style={{ fontSize: 11, color: 'var(--color-accent-error)', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)' }}>
                                          ⚠ No fallback — option may loop unexpectedly
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
                    <button
                      onClick={() => setEntryNode(choice.id)}
                      className="px-2 py-1 rounded-md transition-colors"
                      style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: entryNode === choice.id ? 'rgba(0,209,255,0.08)' : 'transparent',
                        border: entryNode === choice.id ? '1px solid rgba(0,209,255,0.2)' : '1px solid var(--color-border-ghost)',
                        color: entryNode === choice.id ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {entryNode === choice.id ? '✓ Entry Node' : 'Set Entry'}
                    </button>
                    <button
                      onClick={() => { if (window.confirm("Delete this choice?")) deleteChoice(choice.id); }}
                      style={{ background: 'none', border: '1px solid var(--color-border-ghost)', borderRadius: 6, color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500, padding: '3px 8px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      Delete choice
                    </button>
                  </div>
                </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
      <QuickNav items={Object.values(choices).sort((a,b) => parseInt(b.id.replace('CH','')) - parseInt(a.id.replace('CH','')))} title="Choices" renderLabel={c => c.text ? (c.text.length > 25 ? c.text.substring(0, 25) + '...' : c.text) : '...'} />
    </div>
  );
}

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
               <button onClick={() => removeFlagMod(idx)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}
                 onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                 onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
               ><Trash2 className="w-3.5 h-3.5" /></button>
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
                   className="w-16 bg-transparent focus:outline-none text-center"
                   style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
                 />
               </div>
               <button onClick={() => removeStatusMod(idx)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}
                 onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent-error)'}
                 onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
               ><Trash2 className="w-3.5 h-3.5" /></button>
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
