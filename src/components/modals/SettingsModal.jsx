// ADDED (Redesign Step 1): Settings modal — single home for editor preferences.
// CHANGED (Redesign Step 3): rebuilt on the design-system primitives in styles/system.css
// (.br-dialog, .br-section, .br-setting, .br-switch, .br-segmented, .br-range, .br-kbd); SettingsModal.css removed.
// Opened from the TopBar gear (uiStore.showSettings). Mounted in App.jsx outside ReactFlowProvider;
// it only reads/writes uiStore, so no canvas-space operations are needed (AR-19 not applicable).
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore, useSimulationStore } from 'store';
import { CANVAS_DOT_LEVEL_MAX } from 'utils';
import useFocusTrap from 'hooks/useFocusTrap';
import ModalPortal from 'components/ModalPortal';

function Kbd({ children }) {
    return <kbd className="br-kbd">{children}</kbd>;
}

function SwitchSetting({ id, label, hint, checked, onChange, disabled }) {
    return (
        <div className={`br-setting${disabled ? ' br-setting--disabled' : ''}`}>
            <div className="br-setting__text">
                <label htmlFor={id} className="br-setting__label">{label}</label>
                {hint && <p className="br-setting__hint">{hint}</p>}
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className="br-switch"
            >
                <span className="br-switch__thumb" />
            </button>
        </div>
    );
}

function ChoiceSetting({ label, hint, value, options, onChange }) {
    return (
        <div className="br-setting">
            <div className="br-setting__text">
                <span className="br-setting__label">{label}</span>
                {hint && <p className="br-setting__hint">{hint}</p>}
            </div>
            <div className="br-segmented" role="radiogroup" aria-label={label}>
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={value === opt.value}
                        className="br-segment"
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SettingsModalInner() {
    const isOpen = useUIStore(s => s.showSettings);
    const setShowSettings = useUIStore(s => s.setShowSettings);

    const snapToGrid = useUIStore(s => s.snapToGrid);
    const toggleSnapToGrid = useUIStore(s => s.toggleSnapToGrid);
    const snapAssist = useUIStore(s => s.snapAssist);
    const toggleSnapAssist = useUIStore(s => s.toggleSnapAssist);
    const snapThreshold = useUIStore(s => s.snapThreshold);
    const canvasDotLevel = useUIStore(s => s.canvasDotLevel);
    const setCanvasDotLevel = useUIStore(s => s.setCanvasDotLevel);
    const setSnapThreshold = useUIStore(s => s.setSnapThreshold);
    const choiceDisplayMode = useUIStore(s => s.choiceDisplayMode);
    const setChoiceDisplayMode = useUIStore(s => s.setChoiceDisplayMode);
    const labelDisplayMode = useUIStore(s => s.labelDisplayMode);
    const toggleLabelDisplayMode = useUIStore(s => s.toggleLabelDisplayMode);
    const searchIncludeEdges = useUIStore(s => s.searchIncludeEdges);
    const setSearchIncludeEdges = useUIStore(s => s.setSearchIncludeEdges);
    const featureCampaign = useUIStore(s => s.featureCampaign);
    const setFeatureCampaign = useUIStore(s => s.setFeatureCampaign);

    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    const setShowShortcuts = useUIStore(s => s.setShowShortcuts); // ADDED (Redesign Step 5)

    const containerRef = useFocusTrap(isOpen);
    const close = () => setShowSettings(false);

    // ESC closes (capture phase + stopPropagation so the canvas doesn't also clear its selection).
    // Settings apply live, so there is no Save button.
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setShowSettings(false);
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, setShowSettings]);

    if (!isOpen) return null;

    return (
        <div className="br-dialog-backdrop" onClick={close}>
            <div
                ref={containerRef}
                className="br-dialog"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="br-settings-title"
            >
                <div className="br-dialog__header">
                    <h2 id="br-settings-title" className="br-dialog__title">Settings</h2>
                    <button className="br-btn br-btn--ghost br-btn--icon" onClick={close} aria-label="Close settings">
                        <X />
                    </button>
                </div>

                <div className="br-dialog__body">
                    <section className="br-section">
                        <h3 className="br-section__title">Canvas</h3>
                        <SwitchSetting
                            id="set-snap-grid"
                            label="Snap to grid"
                            hint={<>Nodes land on a 16px grid. <Kbd>V</Kbd></>}
                            checked={snapToGrid}
                            onChange={() => toggleSnapToGrid()}
                        />
                        <SwitchSetting
                            id="set-snap-assist"
                            label="Align to nearby nodes"
                            hint={<>Hold <Kbd>Ctrl</Kbd> while dragging to see guides, <Kbd>Shift</Kbd> to move in a straight line. <Kbd>A</Kbd></>}
                            checked={snapAssist}
                            onChange={() => toggleSnapAssist()}
                        />
                        {snapAssist && (
                            <div className="br-setting br-setting--nested">
                                <label htmlFor="set-snap-threshold" className="br-setting__label">Alignment distance</label>
                                <span className="br-setting__control">
                                    <input
                                        id="set-snap-threshold"
                                        className="br-range"
                                        type="range"
                                        min="2"
                                        max="32"
                                        step="1"
                                        value={snapThreshold}
                                        onChange={(e) => setSnapThreshold(e.target.value)}
                                    />
                                    <span className="br-value">{snapThreshold}px</span>
                                </span>
                            </div>
                        )}
                        {/* ADDED (2026-11-06): brightness of the dots on the canvas */}
                        <div className="br-setting">
                            <div className="br-setting__text">
                                <label htmlFor="set-dot-level" className="br-setting__label">Dot brightness</label>
                                <p className="br-setting__hint">0 hides the dots on the canvas, 10 is the brightest.</p>
                            </div>
                            <span className="br-setting__control">
                                <input
                                    id="set-dot-level"
                                    className="br-range"
                                    type="range"
                                    min="0"
                                    max={CANVAS_DOT_LEVEL_MAX}
                                    step="1"
                                    value={canvasDotLevel}
                                    onChange={(e) => setCanvasDotLevel(e.target.value)}
                                />
                                <span className="br-value">
                                    {canvasDotLevel}
                                </span>
                            </span>
                        </div>
                    </section>

                    <section className="br-section">
                        <h3 className="br-section__title">Display</h3>
                        <ChoiceSetting
                            label="Choice options"
                            hint="How much of each option's text shows on Choice nodes."
                            value={choiceDisplayMode}
                            options={[{ value: 'medium', label: 'Short' }, { value: 'full', label: 'Full' }]}
                            onChange={setChoiceDisplayMode}
                        />
                        <ChoiceSetting
                            label="Flags and statuses on nodes"
                            hint={<>Counts only, or each name written out. <Kbd>R</Kbd></>}
                            value={labelDisplayMode}
                            options={[{ value: 'compact', label: 'Counts' }, { value: 'verbose', label: 'Names' }]}
                            onChange={(v) => { if (v !== labelDisplayMode) toggleLabelDisplayMode(); }}
                        />
                    </section>

                    <section className="br-section">
                        <h3 className="br-section__title">Search</h3>
                        <SwitchSetting
                            id="set-search-edges"
                            label="Include edge conditions"
                            hint="Searching a flag or status also lists the edges that require it, under the node they start from."
                            checked={searchIncludeEdges}
                            onChange={setSearchIncludeEdges}
                        />
                    </section>

                    <section className="br-section">
                        <h3 className="br-section__title">Features</h3>
                        <SwitchSetting
                            id="set-feature-campaign"
                            label="Campaign and Route Tracing"
                            hint={isCampaignActive
                                ? 'Exit the running campaign to turn this off.'
                                : 'Play through your story, trace routes and mark nodes as seen. Turning this off hides these tools; your data stays.'}
                            checked={featureCampaign}
                            onChange={setFeatureCampaign}
                            disabled={isCampaignActive}
                        />
                    </section>
                </div>
                {/* ADDED (Redesign Step 5): shortcut sheet entry point */}
                <div className="br-dialog__footer">
                    <button
                        className="br-btn br-btn--ghost br-btn--sm"
                        onClick={() => { setShowSettings(false); setShowShortcuts(true); }}
                    >
                        Keyboard shortcuts <Kbd>?</Kbd>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ADDED (Redesign Step 4): every dialog renders through ModalPortal into <body> (never inside a sidebar).
export default function SettingsModal(props) {
    return (
        <ModalPortal>
            <SettingsModalInner {...props} />
        </ModalPortal>
    );
}
