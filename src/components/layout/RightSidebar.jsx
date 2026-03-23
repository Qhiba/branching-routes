import React from 'react';
import SimulatorPanel from '../routeviewer/SimulatorPanel';

export default function RightSidebar({ sim }) {
  return (
    <aside className="w-[320px] max-w-[320px] flex-shrink-0 flex flex-col h-full z-10 overflow-hidden" style={{ background: 'var(--color-surface-panel)', borderLeft: '1px solid var(--color-border-panel)' }}>
      {sim ? (
        <SimulatorPanel sim={sim} />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Loading Simulator...</span>
        </div>
      )}
    </aside>
  );
}
