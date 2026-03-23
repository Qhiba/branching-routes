import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-tertiary-container shadow-[0_0_15px_rgba(234,169,255,0.3)]',
  visited:     'border-outline-variant opacity-80',
  reachable:   'border-white/5',
  unreachable: 'border-transparent opacity-40 grayscale',
  terminal:    'border-error shadow-[0_0_15px_rgba(255,180,171,0.3)]',
};

function ChoiceNode({ data, sourcePosition, targetPosition }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`w-72 bg-surface-container-high rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={targetPosition || Position.Top} className="!bg-tertiary-container !w-3 !h-3 !border-2 !border-background" />
      <div className="h-1.5 bg-tertiary-container"></div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-tighter uppercase text-tertiary">Logic Choice</span>
          <span className="font-mono text-[10px] font-bold text-tertiary-fixed bg-tertiary/10 px-1.5 py-0.5 rounded">
            {data.id}
          </span>
        </div>
        <h3 className="font-headline text-md font-bold text-on-surface mb-3 truncate leading-snug">{data.label}</h3>
        {data.options && data.options.length > 0 && (
          <div className="space-y-1 mt-2">
            {data.options.map((label, i) => (
              <div key={i} className="relative text-xs text-zinc-300 bg-surface-container-lowest rounded p-2 border border-white/5 truncate">
                {label || `Option ${i + 1}`}
                <Handle
                  type="source"
                  position={sourcePosition || Position.Bottom}
                  id={`opt-${i}`}
                  className="!bg-tertiary-container !w-2 !h-2 !border-2 !border-background"
                  style={
                    sourcePosition === Position.Right || sourcePosition === 'right'
                      ? { top: '50%' }
                      : { left: `${((i + 1) / (data.options.length + 1)) * 100}%` }
                  }
                />
              </div>
            ))}
          </div>
        )}
        {(!data.options || data.options.length === 0) && (
          <Handle type="source" position={sourcePosition || Position.Bottom} className="!bg-tertiary-container !w-3 !h-3 !border-2 !border-background" />
        )}
      </div>
    </div>
  );
}

export default memo(ChoiceNode);
