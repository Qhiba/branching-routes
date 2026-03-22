import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-amber-500 bg-amber-50 ring-4 ring-amber-200 shadow-lg shadow-amber-200/50',
  visited:     'border-amber-300 bg-amber-50/60 opacity-80',
  reachable:   'border-amber-200 bg-white',
  unreachable: 'border-gray-200 bg-gray-100 opacity-40',
  terminal:    'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 ring-4 ring-amber-300 shadow-lg shadow-amber-300/50',
};

function EndingNode({ data }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`rounded-xl border-2 px-4 py-3 min-w-[180px] text-center transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-white" />

      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
          {data.id}
        </span>
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Ending</span>
      </div>
      <p className="text-sm font-bold text-gray-800 truncate leading-snug capitalize">{(data.label || '').replace(/_/g, ' ')}</p>
      {data.requiresCount > 0 && (
        <div className="mt-1 text-[10px] text-gray-400">🔒 {data.requiresCount}</div>
      )}
    </div>
  );
}

export default memo(EndingNode);
