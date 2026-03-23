import React from 'react';

export default function DynamicTracker({ sim }) {
  const { activeState, flags, statusPoints } = sim;

  if (!activeState) return null;

  const flagList = Object.keys(flags).sort();
  const statusList = Object.values(statusPoints || {}).sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <header className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border-panel)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--color-accent-success)' }}>
          Simulation Active
        </h2>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Tracking live variable state
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dynamic Tracker (Status Points) */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dynamic Tracker</h3>
          {statusList.length === 0 ? (
            <div className="p-2.5 rounded-md" style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>No status points tracking</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {statusList.map(sp => (
                <div key={sp.id} className="p-2.5 rounded-md" style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }} className="truncate">{sp.name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--color-accent-primary)' }}>{activeState.status[sp.id]}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Flags */}
        <section>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Active Flags</h3>
          <div className="space-y-1.5">
            {flagList.length === 0 && <div className="p-2.5 rounded-md" style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-row)' }}>No flags defined</div>}
            {flagList.map(fId => {
              const isActive = activeState.flags[fId];
              if (!isActive) return null;
              return (
                <div key={fId} className="flex items-center gap-2 p-2 px-2.5 rounded-md" style={{ background: 'rgba(234,169,255,0.06)', borderLeft: '2px solid var(--color-accent-variable)', fontSize: 11 }}>
                  <span className="truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }} title={flags[fId]?.name}>{flags[fId]?.name || fId}</span>
                  <span className="ml-auto" style={{ color: 'var(--color-accent-variable)', fontWeight: 600, fontSize: 10 }}>TRUE</span>
                </div>
              );
            })}
            {flagList.filter(f => activeState.flags[f]).length === 0 && flagList.length > 0 && (
               <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0 4px' }}>No active flags at current state.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
