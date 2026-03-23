import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-error shadow-[0_0_15px_rgba(255,180,171,0.3)]',
  visited:     'border-outline-variant opacity-80',
  reachable:   'border-white/5',
  unreachable: 'border-transparent opacity-40 grayscale',
  terminal:    'border-error shadow-[0_0_15px_rgba(255,180,171,0.5)]',
};

function EndingNode({ data, targetPosition }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`w-80 bg-surface-container-high rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={targetPosition || Position.Top} className="!bg-error !w-3 !h-3 !border-2 !border-background" />
      <div className="h-1.5 bg-error"></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
           <span className="text-[10px] font-bold uppercase tracking-tighter text-error">Terminal State</span>
           <span className="font-mono text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">{data.id}</span>
        </div>
        <h3 className="font-headline text-lg font-bold text-on-surface mb-2 truncate leading-snug capitalize">{(data.label || '').replace(/_/g, ' ')}</h3>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[10px] font-mono text-error/80 uppercase">Hard Termination</span>
        </div>
      </div>
    </div>
  );
}

export default memo(EndingNode);
