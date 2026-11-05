// ADDED (Redesign Step 4): shared icon rail + collapsible docked panel for both sidebars.
// Replaces the rotated NameplateTab tabs. The panel shows/hides instantly (never via CSS transform —
// AR-29: transforms break @hello-pangea/dnd drag offsets inside the panel).
import React from 'react';
import { X } from 'lucide-react';
import './SideRail.css';

/**
 * @param {'left'|'right'} side
 * @param {Array<{id: string, label: string, title?: string, icon: React.ComponentType, render: () => React.ReactNode}>} items
 * @param {string|null} activeId
 * @param {(id: string|null) => void} onChange
 * @param {boolean} [dimmed] campaign-mode dimming (read-only while a campaign runs)
 */
export default function SideRail({ side, label, items, activeId, onChange, dimmed = false }) {
    const active = items.find(i => i.id === activeId) || null;

    const rail = (
        <nav className="br-siderail__rail" aria-label={label}>
            {items.map(item => {
                const Icon = item.icon;
                const isActive = item.id === activeId;
                return (
                    <button
                        key={item.id}
                        type="button"
                        className="br-siderail__tab"
                        aria-pressed={isActive}
                        aria-controls={`br-siderail-panel-${side}`}
                        title={item.title || item.label}
                        onClick={() => onChange(isActive ? null : item.id)}
                    >
                        <Icon className="br-siderail__tab-icon" aria-hidden="true" />
                        <span className="br-siderail__tab-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );

    const panel = (
        <section
            id={`br-siderail-panel-${side}`}
            className="br-siderail__panel"
            aria-label={active ? (active.title || active.label) : undefined}
            hidden={!active}
        >
            {active && (
                <>
                    <header className="br-panel-header">
                        <h2 className="br-panel-header__title">{active.title || active.label}</h2>
                        <div className="br-panel-header__actions">
                            <button
                                type="button"
                                className="br-btn br-btn--ghost br-btn--icon br-btn--sm"
                                aria-label={`Close ${active.title || active.label}`}
                                onClick={() => onChange(null)}
                            >
                                <X />
                            </button>
                        </div>
                    </header>
                    <div className="br-siderail__body">{active.render()}</div>
                </>
            )}
        </section>
    );

    return (
        <div className={`br-siderail br-siderail--${side}${active ? ' br-siderail--open' : ''}${dimmed ? ' br-siderail--dimmed' : ''}`}>
            {side === 'left' ? <>{rail}{panel}</> : <>{panel}{rail}</>}
        </div>
    );
}
