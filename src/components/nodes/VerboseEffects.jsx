import React from 'react';
import { useNarrativeStore } from 'store';
import { Lock } from 'lucide-react';

export function FlagChip({ flagId, compact = false, suffix = '' }) {
  const flagName = useNarrativeStore(s => s.flag[flagId]?.name);
  return (
    <span className={`effect-chip effect-chip--flag ${compact ? 'effect-chip--compact' : ''}`}>
      {flagName || 'Unknown'}{suffix}
    </span>
  );
}

export function FlagConditionChip({ condition }) {
  const flagName = useNarrativeStore(s => s.flag[condition.flag]?.name);
  const chipClass = condition.state ? 'effect-chip--flag' : 'effect-chip--negative';
  return (
    <span className={`effect-chip effect-chip--compact ${chipClass}`}>
      <Lock size={9} style={{ marginRight: '3px', marginTop: '-1px' }} />
      {flagName || 'Unknown'} {condition.state ? 'TRUE' : 'FALSE'}
    </span>
  );
}

export function StatusConditionChip({ condition }) {
  const statusName = useNarrativeStore(s => s.status[condition.status]?.name);
  let range = '';
  if (condition.min !== undefined && condition.max !== undefined) range = `${condition.min}..${condition.max}`;
  else if (condition.min !== undefined) range = `≥${condition.min}`;
  else if (condition.max !== undefined) range = `≤${condition.max}`;

  return (
    <span className="effect-chip effect-chip--compact effect-chip--status">
      <Lock size={9} style={{ marginRight: '3px', marginTop: '-1px' }} />
      {statusName || 'Unknown'} {range}
    </span>
  );
}

export function StatusChip({ statusEffect, compact = false }) {
  const statusName = useNarrativeStore(s => s.status[statusEffect.statusId]?.name);
  const val = statusEffect.amount ?? statusEffect.value ?? 0;
  const isSet = statusEffect.mode === 'set';
  const chipClass = isSet ? 'effect-chip--set' : val > 0 ? 'effect-chip--positive' : val < 0 ? 'effect-chip--negative' : 'effect-chip--set';
  const formattedVal = isSet ? `= ${val}` : val > 0 ? `+${val}` : `${val}`;

  return (
    <span className={`effect-chip ${compact ? 'effect-chip--compact' : ''} ${chipClass}`}>
      {statusName || 'Unknown'} {formattedVal}
    </span>
  );
}

export function VerboseEffectsBox({ flagsSet = [], statusSet = [], compact = false }) {
  const flagDict = useNarrativeStore(s => s.flag) || {};
  const statusDict = useNarrativeStore(s => s.status) || {};

  const flagKeys = Object.keys(flagDict);
  const statusKeys = Object.keys(statusDict);

  const sortedFlags = [...flagsSet].sort((a, b) => flagKeys.indexOf(a) - flagKeys.indexOf(b));
  const sortedStatuses = [...statusSet].sort((a, b) => statusKeys.indexOf(a.statusId) - statusKeys.indexOf(b.statusId));

  const boxClass = compact ? "verbose-effects-box--compact" : "verbose-effects-box";

  return (
    <div className={boxClass}>
      {sortedFlags.length > 0 && (
        <div className="verbose-effects-section">
          {sortedFlags.map(flagId => (
            <FlagChip key={`f-${flagId}`} flagId={flagId} compact={compact} />
          ))}
        </div>
      )}
      {sortedStatuses.length > 0 && (
        <div className="verbose-effects-section">
          {sortedStatuses.map(se => (
            <StatusChip key={`s-${se.statusId}`} statusEffect={se} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OptionVerboseEffectsBox({ option }) {
  const flagDict = useNarrativeStore(s => s.flag) || {};
  const statusDict = useNarrativeStore(s => s.status) || {};

  const flagKeys = Object.keys(flagDict);
  const statusKeys = Object.keys(statusDict);

  const conditions = option.requires?.conditions || [];
  const flagsSet = option.flags_set || [];
  const statusSet = option.status_set || [];

  const hasContent = conditions.length > 0 || flagsSet.length > 0 || statusSet.length > 0;
  if (!hasContent) return null;

  const sortedFlags = [...flagsSet].sort((a, b) => flagKeys.indexOf(a) - flagKeys.indexOf(b));
  const sortedStatuses = [...statusSet].sort((a, b) => statusKeys.indexOf(a.statusId) - statusKeys.indexOf(b.statusId));

  return (
    <div className="verbose-effects-box--compact">
      {conditions.length > 0 && (
        <div className="verbose-effects-section">
          {conditions.map((c, i) => {
            if ('flag' in c) return <FlagConditionChip key={`req-f-${i}`} condition={c} />;
            if ('status' in c) return <StatusConditionChip key={`req-s-${i}`} condition={c} />;
            return null;
          })}
        </div>
      )}
      {sortedFlags.length > 0 && (
        <div className="verbose-effects-section">
          {sortedFlags.map(flagId => (
            <FlagChip key={`of-${flagId}`} flagId={flagId} compact={true} />
          ))}
        </div>
      )}
      {sortedStatuses.length > 0 && (
        <div className="verbose-effects-section">
          {sortedStatuses.map(se => (
            <StatusChip key={`os-${se.statusId}`} statusEffect={se} compact={true} />
          ))}
        </div>
      )}
    </div>
  );
}
