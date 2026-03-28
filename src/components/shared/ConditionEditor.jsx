import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { Plus, X, GitBranch } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';
import { normalizeRequires, isConditionGroup, isLeafCondition } from '../../utils/conditionUtils';

let conditionIdCounter = 0;
const nextConditionId = () => `cond_${++conditionIdCounter}_${Math.random().toString(36).substr(2, 4)}`;

function ConditionEditor({ conditions, onChange }) {
  const group = normalizeRequires(conditions);
  return <GroupEditor group={group} onChange={onChange} isRoot={true} />;
}

function GroupEditor({ group, onChange, isRoot = false }) {
  const { flags, statusPoints } = useEditor();
  const availableFlags = Object.values(flags || {});
  const availableStatus = Object.values(statusPoints || {});

  const isAnd = group.operator === 'and';

  const setOperator = (op) => {
    onChange({ ...group, operator: op });
  };

  const updateCondition = (idx, newCond) => {
    const newConds = [...group.conditions];
    newConds[idx] = newCond;
    onChange({ ...group, conditions: newConds });
  };

  const removeCondition = (idx) => {
    const newConds = group.conditions.filter((_, i) => i !== idx);
    onChange({ ...group, conditions: newConds });
  };

  const addLeaf = (type) => {
    const leaf = type === 'flag'
      ? { _id: nextConditionId(), flag: '', state: true }
      : { _id: nextConditionId(), status: '', min: 0 };
    onChange({ ...group, conditions: [...group.conditions, leaf] });
  };

  const addOrGroup = () => {
    const emptyOrGroup = { operator: 'or', conditions: [] };
    onChange({ ...group, conditions: [...group.conditions, emptyOrGroup] });
  };

  const borderColor = isAnd
    ? 'rgba(59,130,246,0.25)'
    : 'rgba(251,191,36,0.25)';
  const accentColor = isAnd ? 'rgba(59,130,246,0.5)' : 'rgba(251,191,36,0.5)';

  return (
    <div className="space-y-2">
      {!isRoot && (
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setOperator(isAnd ? 'or' : 'and')}
            style={{
              fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'none', border: 'none', cursor: 'pointer',
              color: accentColor,
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${borderColor}`,
            }}
          >
            {isAnd ? 'AND' : 'OR'}
          </button>
          <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {isAnd ? 'all must be true' : 'any one must be true'}
          </span>
        </div>
      )}

      {group.conditions.length === 0 && (
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {isRoot ? 'No conditions — flow path is unblocked.' : 'Empty group — always passes.'}
        </div>
      )}

      {group.conditions.map((item, idx) => {
        if (isLeafCondition(item)) {
          return (
            <LeafRow
              key={item._id || idx}
              leaf={item}
              availableFlags={availableFlags}
              availableStatus={availableStatus}
              onChange={(updated) => updateCondition(idx, updated)}
              onRemove={() => removeCondition(idx)}
            />
          );
        }

        if (isConditionGroup(item)) {
          return (
            <div
              key={item._id || `group-${idx}`}
              style={{
                marginLeft: 16,
                paddingLeft: 12,
                borderLeft: `2px solid ${borderColor}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.operator === 'or' ? 'OR group' : 'AND group'}
                </span>
                <button
                  onClick={() => removeCondition(idx)}
                  className="p-0.5 rounded"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <GroupEditor
                group={item}
                onChange={(updated) => updateCondition(idx, updated)}
              />
            </div>
          );
        }

        return null;
      })}

      <div className="flex gap-1.5 pt-1.5" style={{ borderTop: '1px solid var(--color-border-ghost)' }}>
        <button
          onClick={() => addLeaf('flag')}
          disabled={availableFlags.length === 0}
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'none', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 10, cursor: 'pointer' }}
        >
          <Plus className="w-3 h-3" /> Flag
        </button>
        <button
          onClick={() => addLeaf('status')}
          disabled={availableStatus.length === 0}
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'none', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 10, cursor: 'pointer' }}
        >
          <Plus className="w-3 h-3" /> Status
        </button>
        {isAnd && (
          <button
            onClick={addOrGroup}
            className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
            style={{ background: 'none', border: '1px solid rgba(251,191,36,0.3)', color: 'rgba(251,191,36,0.8)', fontSize: 10, cursor: 'pointer' }}
          >
            <GitBranch className="w-3 h-3" /> OR group
          </button>
        )}
      </div>
    </div>
  );
}

function LeafRow({ leaf, availableFlags, availableStatus, onChange, onRemove }) {
  const isFlag = leaf.flag !== undefined;

  return (
    <div
      className="flex flex-wrap items-center gap-2 p-2.5 rounded-md"
      style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}
    >
      {isFlag ? (
        <>
          <SearchableDropdown
            value={leaf.flag || ''}
            onChange={val => onChange({ ...leaf, flag: val })}
            options={availableFlags}
            placeholder="Select Flag..."
            showFilters={true}
            className="flex-1 min-w-[120px]"
          />
          <select
            value={leaf.state ? 'true' : 'false'}
            onChange={e => onChange({ ...leaf, state: e.target.value === 'true' })}
            className="rounded-md px-2 py-1.5 cursor-pointer focus:outline-none"
            style={{
              background: 'var(--color-surface-card-low)',
              border: '1px solid var(--color-border-ghost)',
              color: leaf.state ? 'var(--color-accent-success)' : 'var(--color-accent-error)',
              fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500
            }}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </>
      ) : (
        <>
          <SearchableDropdown
            value={leaf.status || ''}
            onChange={val => onChange({ ...leaf, status: val })}
            options={availableStatus}
            placeholder="Select Status..."
            showFilters={false}
            className="flex-1 min-w-[120px]"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>min</span>
            <input
              type="number"
              placeholder="—"
              value={leaf.min !== undefined ? leaf.min : ''}
              onChange={e => {
                if (e.target.value === '') {
                  const { min, _id, ...rest } = leaf;
                  onChange({ _id, ...rest });
                } else {
                  onChange({ ...leaf, min: Number(e.target.value) });
                }
              }}
              className="w-16 bg-transparent focus:outline-none text-center"
              style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
            />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>max</span>
            <input
              type="number"
              placeholder="—"
              value={leaf.max !== undefined ? leaf.max : ''}
              onChange={e => {
                if (e.target.value === '') {
                  const { max, _id, ...rest } = leaf;
                  onChange({ _id, ...rest });
                } else {
                  onChange({ ...leaf, max: Number(e.target.value) });
                }
              }}
              className="w-16 bg-transparent focus:outline-none text-center"
              style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--color-accent-primary)' }}
            />
          </div>
        </>
      )}
      <button
        onClick={onRemove}
        className="p-1 rounded transition-colors"
        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ConditionEditor;
