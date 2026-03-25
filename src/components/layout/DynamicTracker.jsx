import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function DynamicTracker({ sim }) {
  const { activeState, flags, statusPoints } = sim;
  const flagsState = useMemo(() => activeState?.flags || {}, [activeState]);
  const statusState = useMemo(() => activeState?.status || {}, [activeState]);

  const [showAll, setShowAll] = useState(false);

  const flagList = useMemo(() => Object.keys(flags || {}).sort(), [flags]);
  const statusList = useMemo(
    () => Object.values(statusPoints || {}).sort((a, b) => a.id.localeCompare(b.id)),
    [statusPoints]
  );

  const activeFlagIds = useMemo(() => flagList.filter((fId) => flagsState[fId] === true), [flagList, flagsState]);
  const inactiveCount = Math.max(0, flagList.length - activeFlagIds.length);

  const changedStatusIds = useMemo(() => {
    const changed = [];
    for (const sp of statusList) {
      const startVal = Number(sp.value);
      const curVal = statusState[sp.id];
      if (curVal !== startVal) changed.push(sp.id);
    }
    return changed;
  }, [statusList, statusState]);
  const changedStatuses = useMemo(() => statusList.filter((sp) => changedStatusIds.includes(sp.id)), [statusList, changedStatusIds]);
  const unchangedCount = Math.max(0, statusList.length - changedStatuses.length);

  // Flash animation on value flips (retains prior behavior)
  const prevFlagsRef = useRef({});
  const prevStatusRef = useRef({});
  const [flashedFlags, setFlashedFlags] = useState(new Set());
  const [flashedStatus, setFlashedStatus] = useState(new Set());

  useEffect(() => {
    const nextFlashedFlags = new Set();
    const nextFlashedStatus = new Set();

    for (const fId of flagList) {
      const prev = prevFlagsRef.current[fId];
      const next = flagsState[fId];
      if (prev !== undefined && prev !== next) nextFlashedFlags.add(fId);
    }
    for (const sp of statusList) {
      const prev = prevStatusRef.current[sp.id];
      const next = statusState[sp.id];
      if (prev !== undefined && prev !== next) nextFlashedStatus.add(sp.id);
    }

    prevFlagsRef.current = { ...flagsState };
    prevStatusRef.current = { ...statusState };

    if (nextFlashedFlags.size > 0 || nextFlashedStatus.size > 0) {
      const rafId = requestAnimationFrame(() => {
        if (nextFlashedFlags.size > 0) setFlashedFlags(nextFlashedFlags);
        if (nextFlashedStatus.size > 0) setFlashedStatus(nextFlashedStatus);
      });
      const timer = setTimeout(() => {
        setFlashedFlags(new Set());
        setFlashedStatus(new Set());
      }, 600);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    }
  }, [flagsState, statusState, flagList, statusList]);

  const compactRowStyle = {
    background: 'var(--color-surface-card-low)',
    border: '1px solid var(--color-border-row)',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 11,
  };

  if (!activeState) return null;

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
        <div className="grid grid-cols-2 gap-3">
          {/* FLAGS */}
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flags</h3>
              <button
                onClick={() => setShowAll((v) => !v)}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Toggle full variable tracker"
              >
                {showAll ? '[ Show active ]' : '[ Show all ]'}
              </button>
            </div>

            {flagList.length === 0 ? (
              <div style={{ ...compactRowStyle, background: 'var(--color-surface-card-low)', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                No flags defined
              </div>
            ) : showAll ? (
              <div className="grid grid-cols-2 gap-2">
                {flagList.map((fId) => {
                  const isActive = activeState.flags[fId] === true;
                  const flashing = flashedFlags.has(fId);
                  return (
                    <div
                      key={fId}
                      className={flashing ? 'flash-flag' : ''}
                      style={{
                        ...compactRowStyle,
                        padding: '6px 6px',
                        background: 'var(--color-surface-card-low)',
                        borderLeft: '2px solid var(--color-accent-variable)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: isActive ? 'var(--color-accent-success)' : 'var(--color-text-muted)',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{fId}</span>
                      </div>
                      <span className="truncate" style={{ fontSize: 10, color: 'var(--color-text-muted)' }} title={flags[fId]?.name}>
                        {flags[fId]?.name || fId}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeFlagIds.length === 0 ? (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0 4px' }}>
                    No active flags at current state.
                  </div>
                ) : (
                  activeFlagIds.map((fId) => {
                    const flashing = flashedFlags.has(fId);
                    return (
                      <div
                        key={fId}
                        className={flashing ? 'flash-flag' : ''}
                        style={{
                          ...compactRowStyle,
                          background: 'rgba(234,169,255,0.06)',
                          borderLeft: '2px solid var(--color-accent-variable)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{fId}</span>
                        <span className="truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }} title={flags[fId]?.name}>
                          {flags[fId]?.name || fId}
                        </span>
                      </div>
                    );
                  })
                )}
                {inactiveCount > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0 4px' }}>
                    {inactiveCount} inactive
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STATUS */}
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</h3>
            </div>

            {statusList.length === 0 ? (
              <div style={{ ...compactRowStyle, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                No status points tracking
              </div>
            ) : showAll ? (
              <div className="grid grid-cols-2 gap-2">
                {statusList.map((sp) => {
                  const flashing = flashedStatus.has(sp.id);
                  return (
                    <div
                      key={sp.id}
                      className={flashing ? 'flash-status' : ''}
                      style={{
                        ...compactRowStyle,
                        padding: '6px 6px',
                        background: 'var(--color-surface-card-low)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>{sp.id}</span>
                        <span className="truncate" style={{ fontSize: 10, color: 'var(--color-text-secondary)' }} title={sp.name}>
                          {sp.name}
                        </span>
                      </div>
                      <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                        {activeState.status[sp.id]}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {changedStatuses.length === 0 ? (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0 4px' }}>
                    No status changes at current state.
                  </div>
                ) : (
                  changedStatuses.map((sp) => {
                    const flashing = flashedStatus.has(sp.id);
                    return (
                      <div
                        key={sp.id}
                        className={flashing ? 'flash-status' : ''}
                        style={{
                          ...compactRowStyle,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>{sp.id}</div>
                          <div className="truncate" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }} title={sp.name}>
                            {sp.name}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--color-accent-primary)' }}>
                          {activeState.status[sp.id]}
                        </div>
                      </div>
                    );
                  })
                )}
                {unchangedCount > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0 4px' }}>
                    {unchangedCount} unchanged
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
