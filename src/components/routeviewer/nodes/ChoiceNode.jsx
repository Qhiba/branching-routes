import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200 shadow-lg shadow-indigo-200/50',
  visited:     'border-indigo-300 bg-indigo-50/60 opacity-80',
  reachable:   'border-indigo-200 bg-white',
  unreachable: 'border-gray-200 bg-gray-100 opacity-40',
  terminal:    'border-amber-400 bg-amber-50 ring-4 ring-amber-200 shadow-lg shadow-amber-200/50',
};

function ChoiceNode({ data }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`rounded-xl border-2 px-4 py-3 min-w-[220px] transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-white" />

      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
          {data.id}
        </span>
        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Choice</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{data.label}</p>
      {data.options && data.options.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.options.map((label, i) => (
            <div key={i} className="relative text-[11px] text-gray-500 bg-gray-50 rounded px-2 py-0.5 truncate border border-gray-100">
              {label || `Option ${i + 1}`}
              <Handle
                type="source"
                position={Position.Bottom}
                id={`opt-${i}`}
                className="!bg-indigo-400 !w-2 !h-2 !border-2 !border-white"
                style={{ left: `${((i + 1) / (data.options.length + 1)) * 100}%` }}
              />
            </div>
          ))}
        </div>
      )}
      {(!data.options || data.options.length === 0) && (
        <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-white" />
      )}
    </div>
  );
}

export default memo(ChoiceNode);
