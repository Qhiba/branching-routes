import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const STATE_STYLES = {
  current:     'border-primary neon-glow-blue',
  visited:     'border-outline-variant opacity-80',
  reachable:   'border-white/5',
  unreachable: 'border-transparent opacity-40 grayscale',
  terminal:    'border-error shadow-[0_0_15px_rgba(255,180,171,0.3)]',
};

function SceneNode({ data, sourcePosition, targetPosition }) {
  const stateClass = STATE_STYLES[data.state] || STATE_STYLES.reachable;

  return (
    <div className={`w-80 bg-surface-container-high rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 ${stateClass}`}>
      <Handle type="target" position={targetPosition || Position.Top} className="!bg-primary-container !w-3 !h-3 !border-2 !border-background" />
      <div className="h-1.5 signature-gradient"></div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-tighter uppercase text-primary/80">Scene Node</span>
          <span className="font-mono text-[10px] font-bold text-primary-fixed bg-primary/10 px-1.5 py-0.5 rounded">
            {data.id}
          </span>
        </div>
        <h3 className="font-headline text-lg font-bold text-on-surface mb-2 truncate leading-snug">{data.label}</h3>
        <div className="flex gap-3 mt-1.5 text-[10px] text-zinc-500 font-mono">
          {data.requiresCount > 0 && <span>🔒 REQ:{data.requiresCount}</span>}
          {data.nextCount > 0 && <span>→ OUT:{data.nextCount}</span>}
        </div>
      </div>
      <Handle type="source" position={sourcePosition || Position.Bottom} className="!bg-secondary-container hover:scale-125 transition-transform cursor-crosshair neon-glow-lime !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}

export default memo(SceneNode);
