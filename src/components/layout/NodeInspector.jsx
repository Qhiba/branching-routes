import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Pencil, Trash2, Diamond } from 'lucide-react';
import { hasConditions, normalizeRequires, isLeafCondition, isConditionGroup } from '../../utils/conditionUtils';

/**
 * Resolve helpers — convert IDs to human-readable names.
 */
function useLookups() {
  const { flags, statusPoints, paths, chapters, scenes, choices, endings } = useEditor();

  const flagName = (id) => flags[id]?.name ?? id;
  const statusName = (id) => statusPoints[id]?.name ?? id;
  const pathName = (id) => paths[id]?.name ?? id;
  const chapterName = (id) => chapters[id]?.name ?? id;
  const targetName = (id) => {
    if (scenes[id]) return scenes[id].name;
    if (choices[id]) return choices[id].text;
    if (endings[id]) return endings[id].name;
    return id;
  };

  return { flagName, statusName, pathName, chapterName, targetName };
}

/* ─── Single condition chip ─── */
function CondChip({ req, flagName, statusName }) {
  const label = req.flag !== undefined
    ? `${flagName(req.flag)} = ${String(req.state)}`
    : `${statusName(req.status)}${req.min !== undefined ? ` ≥ ${req.min}` : ''}${req.max !== undefined ? ` ≤ ${req.max}` : ''}`;
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
      background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)',
      color: 'var(--color-text-secondary)', whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  );
}

/* ─── Operator pill (AND / OR) ─── */
function OpPill({ op }) {
  const isOr = op === 'or';
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
      padding: '1px 5px', borderRadius: 3,
      background: isOr ? 'rgba(251,191,36,0.12)' : 'rgba(0,209,255,0.1)',
      border: `1px solid ${isOr ? 'rgba(251,191,36,0.3)' : 'rgba(0,209,255,0.2)'}`,
      color: isOr ? 'rgb(251,191,36)' : 'var(--color-accent-primary-dim)',
      letterSpacing: '0.05em',
    }}>
      {isOr ? 'OR' : 'AND'}
    </span>
  );
}

/* ─── Recursive group renderer ─── */
function GroupDisplay({ group, flagName, statusName }) {
  const { operator, conditions } = group;
  const items = [];
  conditions.forEach((item, idx) => {
    if (idx > 0) {
      items.push(<OpPill key={`op-${idx}`} op={operator} />);
    }
    if (isLeafCondition(item)) {
      items.push(<CondChip key={idx} req={item} flagName={flagName} statusName={statusName} />);
    } else if (isConditionGroup(item)) {
      // Wrap sub-group in parens if parent is OR (to clarify grouping)
      items.push(
        <span key={idx} className="flex items-center gap-1 flex-wrap" style={{
          padding: '2px 5px', borderRadius: 4,
          border: '1px dashed var(--color-border-ghost)',
        }}>
          <GroupDisplay group={item} flagName={flagName} statusName={statusName} />
        </span>
      );
    }
  });
  return <div className="flex items-center gap-1.5 flex-wrap">{items}</div>;
}

/* ─── Shared ConditionDisplay ─── */
function ConditionDisplay({ requires, flagName, statusName }) {
  if (!hasConditions(requires)) return null;
  const group = normalizeRequires(requires);
  return <GroupDisplay group={group} flagName={flagName} statusName={statusName} />;
}

/* ─── Section divider ─── */
const Divider = () => <div style={{ borderTop: '1px solid var(--color-border-ghost)', margin: '12px 0' }} />;

/* ─── Section label ─── */
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
    {children}
  </div>
);

/* ─── Action footer ─── */
function InspectorFooter({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 p-3 mt-auto flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-ghost)', background: 'var(--color-surface-panel)' }}>
      <button
        onClick={onEdit}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors"
        style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.2)', color: 'var(--color-accent-primary-dim)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,209,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,209,255,0.08)'}
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>
      <button
        onClick={onDelete}
        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md transition-colors"
        style={{ background: 'transparent', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'; e.currentTarget.style.color = 'var(--color-accent-error)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-ghost)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE INSPECTOR
   ═══════════════════════════════════════════════════════════ */
export function SceneInspector({ entityId, onEdit, onDelete }) {
  const { scenes } = useEditor();
  const { flagName, statusName, pathName, chapterName, targetName } = useLookups();
  const scene = scenes[entityId];
  if (!scene) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Header */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-scene)', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', borderRadius: 4 }}>Scene</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginTop: 4 }}>{scene.name}</div>

        {/* Path & Chapter chips */}
        {(scene.path || scene.chapter) && (
          <div className="flex gap-1.5 mt-2">
            {scene.path && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>
                {pathName(scene.path)}
              </span>
            )}
            {scene.chapter && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>
                {chapterName(scene.chapter)}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {scene.description && (
          <>
            <Divider />
            <SectionLabel>Description</SectionLabel>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{scene.description}"
            </div>
          </>
        )}

        {/* Variants */}
        {scene.variants && scene.variants.length > 0 && (
          <>
            <Divider />
            <SectionLabel>VARIANTS <span style={{ textTransform: 'none', letterSpacing: 'normal' }}>(◈ {scene.variants.length})</span></SectionLabel>
            <div className="flex flex-col flex-wrap gap-1">
              {scene.variants.map((v, i) => (
                <div key={v._id || i} style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', borderRadius: 6, padding: '6px 8px' }}>
                  <div className="mb-1" style={{ fontSize: 10 }}>
                    {hasConditions(v.requires) ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span style={{ color: 'var(--color-text-muted)' }}>if</span>
                        <ConditionDisplay requires={v.requires} flagName={flagName} statusName={statusName} />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>always</span>
                    )}
                  </div>
                  <div title={v.text} style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.text}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Requires */}
        <Divider />
        <SectionLabel>Requires</SectionLabel>
        {hasConditions(scene.requires) ? (
          <ConditionDisplay requires={scene.requires} flagName={flagName} statusName={statusName} />
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No conditions</div>
        )}

        {/* Next Targets */}
        <Divider />
        <SectionLabel>Next Targets</SectionLabel>
        {scene.next && scene.next.length > 0 ? (
          <div className="flex flex-col gap-1">
            {scene.next.map((route, idx) => {
              const isFallback = idx === scene.next.length - 1 && !hasConditions(route.requires);
              return (
                <div key={route._id || idx} style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', borderRadius: 6, padding: '6px 8px' }}>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {isFallback ? (
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>fallback</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--color-text-muted)' }}>if</span>
                        <ConditionDisplay requires={route.requires} flagName={flagName} statusName={statusName} />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>→</span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-accent-primary-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={route.target ? targetName(route.target) : '—'}>
                      {route.target ? targetName(route.target) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-accent-error)' }}>⚠ No targets</div>
        )}
      </div>
      <InspectorFooter onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHOICE INSPECTOR
   ═══════════════════════════════════════════════════════════ */
export function ChoiceInspector({ entityId, onEdit, onDelete }) {
  const { choices } = useEditor();
  const { flagName, statusName, pathName, chapterName, targetName } = useLookups();
  const choice = choices[entityId];
  if (!choice) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Header */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-primary-dim)', background: 'rgba(0,209,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>Choice</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginTop: 4 }}>{choice.text}</div>

        {(choice.path || choice.chapter) && (
          <div className="flex gap-1.5 mt-2">
            {choice.path && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>{pathName(choice.path)}</span>
            )}
            {choice.chapter && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>{chapterName(choice.chapter)}</span>
            )}
          </div>
        )}

        {/* Requires */}
        <Divider />
        <SectionLabel>Requires</SectionLabel>
        {hasConditions(choice.requires) ? (
          <ConditionDisplay requires={choice.requires} flagName={flagName} statusName={statusName} />
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No conditions</div>
        )}

        {/* Options */}
        <Divider />
        <SectionLabel>Options</SectionLabel>
        {choice.options && choice.options.length > 0 ? (
          <div className="space-y-2">
            {choice.options.map((opt, idx) => (
              <div key={opt.id || idx} className="p-2.5 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  ── {opt.label || `Option ${idx + 1}`}
                </div>
                {/* Flags set */}
                {opt.flags_set?.map(flagId => (
                  <div key={flagId} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent-variable)', lineHeight: 1.6 }}>
                    sets {flagName(flagId)}
                  </div>
                ))}
                {/* Status set */}
                {opt.status_set?.map((s, i) => {
                  const name = statusName(s.status);
                  const isPositive = s.amount >= 0;
                  return (
                    <div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--color-accent-primary)' : 'var(--color-accent-error)', lineHeight: 1.6 }}>
                      {isPositive ? `+${s.amount}` : s.amount} {name}
                    </div>
                  );
                })}
                {/* Next targets */}
                {(() => {
                  const nextArr = Array.isArray(opt.next) ? opt.next : (opt.next ? [{ requires: [], target: opt.next }] : []);
                  if (nextArr.length === 0) return null;
                  return nextArr.map((entry, rIdx) => (
                    <div key={rIdx} style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {hasConditions(entry.requires) && (
                        <span style={{ fontStyle: 'italic', marginRight: 4 }}>if met → </span>
                      )}
                      <span style={{ color: 'var(--color-text-secondary)' }}>{targetName(entry.target || '—')}</span>
                    </div>
                  ));
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No options</div>
        )}
      </div>
      <InspectorFooter onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ENDING INSPECTOR
   ═══════════════════════════════════════════════════════════ */
export function EndingInspector({ entityId, onEdit, onDelete }) {
  const { endings } = useEditor();
  const { flagName, statusName, pathName, chapterName } = useLookups();
  const ending = endings[entityId];
  if (!ending) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-accent-terminal)', background: 'rgba(200,119,10,0.12)', padding: '2px 6px', borderRadius: 4 }}>Ending</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginTop: 4 }}>{ending.name}</div>

        {(ending.path || ending.chapter) && (
          <div className="flex gap-1.5 mt-2">
            {ending.path && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>
                {pathName(ending.path)}
              </span>
            )}
            {ending.chapter && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)', color: 'var(--color-text-secondary)' }}>
                {chapterName(ending.chapter)}
              </span>
            )}
          </div>
        )}

        <Divider />
        <SectionLabel>Requires</SectionLabel>
        {hasConditions(ending.requires) ? (
          <ConditionDisplay requires={ending.requires} flagName={flagName} statusName={statusName} />
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No conditions</div>
        )}

        <Divider />
        <div className="flex items-center gap-1.5">
          <Diamond className="w-3 h-3" style={{ color: 'var(--color-accent-terminal)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Terminal — no next target</span>
        </div>
      </div>
      <InspectorFooter onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
