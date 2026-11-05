// ADDED (Redesign Step 3): development-only reference sheet for the design system (styles/system.css).
// Open http://localhost:<port>/#design while `npm run dev` is running. Not mounted in production builds.
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Settings, FilePlus, Upload, Download, Copy } from 'lucide-react';

const ROUTES = ['common', 'choice', 'ending', 'hub', 'warp'];

export default function DesignSystemPreview() {
    const [on, setOn] = useState(true);
    const [seg, setSeg] = useState('counts');
    return (
        <div style={{ minHeight: '100vh', overflow: 'auto', background: 'var(--br-night)', color: 'var(--br-text)', fontFamily: 'var(--br-font)', padding: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1200 }}>

                <section style={{ background: 'var(--br-graphite)', borderRadius: 12, border: '1px solid var(--br-line)' }}>
                    <div className="br-panel-header">
                        <h2 className="br-panel-header__title">Flags<span className="br-panel-header__count">14</span></h2>
                        <div className="br-panel-header__actions">
                            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-label="Search"><Search /></button>
                            <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-label="New flag"><Plus /></button>
                        </div>
                    </div>
                    <div style={{ padding: 8 }}>
                        {['met_alice', 'has_key', 'cg_rooftop_unlocked', 'alice_route'].map((n, i) => (
                            <div key={n} className={`br-row${i === 1 ? ' br-row--selected' : ''}`} tabIndex={0}>
                                <span className="br-row__main">{n}</span>
                                <span className="br-row__meta">{i === 0 ? 'used 3×' : 'false'}</span>
                                <span className="br-row__actions">
                                    <button className="br-btn br-btn--ghost br-btn--icon br-btn--sm" aria-label="Rename"><Pencil /></button>
                                    <button className="br-btn br-btn--danger br-btn--icon br-btn--sm" aria-label="Delete"><Trash2 /></button>
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="br-empty" style={{ borderTop: '1px solid var(--br-line)' }}>
                        <p className="br-empty__title">No collectibles yet</p>
                        <p className="br-empty__text">Track CGs, items or achievements and see which nodes grant them.</p>
                        <button className="br-btn br-btn--sm"><Plus />New collectible</button>
                    </div>
                </section>

                <section style={{ background: 'var(--br-graphite)', borderRadius: 12, border: '1px solid var(--br-line)', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className="br-btn br-btn--primary">Save node</button>
                        <button className="br-btn">Cancel</button>
                        <button className="br-btn br-btn--ghost">Skip</button>
                        <button className="br-btn br-btn--danger"><Trash2 />Delete</button>
                        <button className="br-btn" disabled>Disabled</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <button className="br-btn br-btn--ghost br-btn--sm"><FilePlus />New</button>
                        <button className="br-btn br-btn--ghost br-btn--sm"><Download />Import</button>
                        <button className="br-btn br-btn--ghost br-btn--sm"><Upload />Export</button>
                        <button className="br-btn br-btn--ghost br-btn--icon" aria-label="Settings"><Settings /></button>
                        <button className="br-btn br-btn--icon" aria-pressed="true" aria-label="Copy"><Copy /></button>
                    </div>
                    <div className="br-field">
                        <label className="br-field__label" htmlFor="ds-label">Node label</label>
                        <input id="ds-label" className="br-input" defaultValue="Alice at the café" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="ds-ch">Chapter</label>
                            <select id="ds-ch" className="br-select"><option>Chapter 2</option><option>None</option></select>
                        </div>
                        <div className="br-field">
                            <label className="br-field__label" htmlFor="ds-path">Path</label>
                            <select id="ds-path" className="br-select"><option>None</option></select>
                        </div>
                    </div>
                    <div className="br-field">
                        <label className="br-field__label" htmlFor="ds-text">Content</label>
                        <textarea id="ds-text" className="br-textarea" rows={3} placeholder="What happens in this scene…" />
                        <span className="br-field__hint">Shown in the node preview on the canvas.</span>
                    </div>
                </section>

                <section style={{ background: 'var(--br-graphite)', borderRadius: 12, border: '1px solid var(--br-line)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="br-setting">
                        <div className="br-setting__text">
                            <span className="br-setting__label">Snap to grid</span>
                            <p className="br-setting__hint">Nodes land on a 16px grid. <kbd className="br-kbd">V</kbd></p>
                        </div>
                        <button className="br-switch" role="switch" aria-checked={on} onClick={() => setOn(v => !v)}><span className="br-switch__thumb" /></button>
                    </div>
                    <div className="br-segmented" role="radiogroup" aria-label="Labels">
                        {['counts', 'names'].map(v => (
                            <button key={v} className="br-segment" role="radio" aria-checked={seg === v} onClick={() => setSeg(v)}>{v === 'counts' ? 'Counts' : 'Names'}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ROUTES.map(r => (
                            <span key={r} className="br-chip" data-route={r}><span className="br-route" />{r[0].toUpperCase() + r.slice(1)}</span>
                        ))}
                        <span className="br-chip br-chip--button br-chip--on">CG scene</span>
                        <span className="br-chip br-chip--button">Alice present</span>
                        <span className="br-badge">3</span>
                    </div>
                    <div>
                        {ROUTES.map(r => (
                            <div key={r} className="br-row" data-route={r}>
                                <span className="br-route br-route--stripe" />
                                <span className="br-row__main">{{ common: 'Rooftop confession', choice: 'Alice at the café', ending: 'Good ending', hub: 'After school hub', warp: 'To chapter 3' }[r]}</span>
                                <span className="br-row__meta">{r}</span>
                            </div>
                        ))}
                    </div>
                    <div className="br-menu" role="menu">
                        <button className="br-menu__item" role="menuitem"><Pencil />Edit node<span className="br-menu__shortcut">Enter</span></button>
                        <button className="br-menu__item" role="menuitem"><Copy />Duplicate<span className="br-menu__shortcut">Ctrl D</span></button>
                        <hr className="br-menu__divider" />
                        <button className="br-menu__item br-menu__item--danger" role="menuitem"><Trash2 />Delete<span className="br-menu__shortcut">Del</span></button>
                    </div>
                </section>
            </div>
        </div>
    );
}
