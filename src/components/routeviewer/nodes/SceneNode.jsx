import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200 shadow-lg shadow-indigo-200/50',
  visited:     'border-blue-300 bg-blue-50/60 opacity-80',
  reachable:   'border-blue-200 bg-white',
  unreachable: 'border-gray-200 bg-gray-100 opacity-40',
  terminal:    'border-amber-400 bg-amber-50 ring-4 ring-amber-200 shadow-lg shadow-amber-200/50',
};

function SceneNode({ data }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`rounded-xl border-2 px-4 py-3 min-w-[200px] transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white" />

      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
          {data.id}
        </span>
        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Scene</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate leading-snug">{data.label}</p>
      <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400">
        {data.requiresCount > 0 && <span>🔒 {data.requiresCount}</span>}
        {data.nextCount > 0 && <span>→ {data.nextCount} routes</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
}

export default memo(SceneNode);
