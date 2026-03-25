import React from 'react';
import { GitBranch } from 'lucide-react';
import SimulatorPanel from '../routeviewer/SimulatorPanel';

export default function RightSidebar({ sim, activeEditId, isSimulating, onBacktrack }) {
  const canTrace = !isSimulating && activeEditId;
  const tooltipText = !activeEditId ? "Select a node to trace its route" : "";

  const handleTraceClick = () => {
    if (canTrace) {
      onBacktrack(activeEditId);
    }
  };

  return (
    <aside className="w-[320px] max-w-[320px] flex-shrink-0 flex flex-col h-full z-10 overflow-hidden" style={{ background: 'var(--color-surface-panel)', borderLeft: '1px solid var(--color-border-panel)' }}>
      {sim ? (
        <SimulatorPanel sim={sim} />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Loading Simulator...</span>
        </div>
      )}

      {/* Footer — Trace Route button (hidden during simulation) */}
      {!isSimulating && (
        <div style={{ borderTop: '1px solid var(--color-border-ghost)', flexShrink: 0 }}>
          <button
            onClick={handleTraceClick}
            disabled={!canTrace}
            title={tooltipText}
            className="w-full flex items-center justify-center gap-2 px-[13px] py-[10px] transition-colors"
            style={{
              background: 'transparent',
              border: `1px solid var(--color-border-ghost)`,
              borderRadius: 6,
              color: canTrace ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'var(--font-ui)',
              cursor: canTrace ? 'pointer' : 'not-allowed',
              opacity: canTrace ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (canTrace) {
                e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (canTrace) {
                e.currentTarget.style.borderColor = 'var(--color-border-ghost)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <GitBranch className="w-[14px] h-[14px] flex-shrink-0" />
            <span>Trace Route</span>
          </button>
        </div>
      )}
    </aside>
  );
}
