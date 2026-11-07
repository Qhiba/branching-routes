// ADDED (Redesign Step 5): keyboard shortcut sheet. Opened with "?" or from Settings. Design-system primitives
// (AR-37), ModalPortal + Enter/Esc close (AR-38), focus trap (AR-35).
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from 'store';
import useFocusTrap from 'hooks/useFocusTrap';
import ModalPortal from 'components/ModalPortal';

const GROUPS = [
    {
        title: 'Edit',
        rows: [
            [['Ctrl', 'S'], 'Save project'],
            [['Ctrl', 'Z'], 'Undo'],
            [['Ctrl', 'Shift', 'Z'], 'Redo (also Ctrl Y)'],
            [['Ctrl', 'A'], 'Select all nodes'],
            [['Ctrl', 'C'], 'Copy node'],
            [['Ctrl', 'V'], 'Paste node'],
            [['Ctrl', 'D'], 'Duplicate selection'],
            [['Del'], 'Delete selection'],
            [['↑ ↓ ← →'], 'Move selection (Shift for bigger steps)'],
            [['Esc'], 'Clear selection'],
        ],
    },
    {
        title: 'Add',
        rows: [
            [['N'], 'Common node'],
            [['C'], 'Choice node'],
            [['E'], 'Ending node'],
            [['W'], 'Warp entrance'],
            [['Ctrl', 'W'], 'Warp exit'],
            [['F'], 'Flag'],
            [['S'], 'Status'],
            [['H'], 'Chapter'],
            [['P'], 'Path'],
        ],
    },
    {
        title: 'View',
        rows: [
            [['Ctrl', 'K'], 'Search everything'],
            [['Ctrl', '+'], 'Zoom in'],
            [['Ctrl', '−'], 'Zoom out'],
            [['Ctrl', '0'], 'Zoom to 100%'],
            [['Shift', '1'], 'Fit the whole story'],
            [['Shift', '2'], 'Zoom to selection'],
            [['L'], 'Fit the whole story'],
            [['R'], 'Flag/status names on nodes'],
            [['V'], 'Snap to grid'],
            [['A'], 'Align to nearby nodes'],
            [['?'], 'This list'],
        ],
    },
];

function Shortcut({ keys }) {
    return (
        <span className="br-shortcuts__keys">
            {keys.map(k => <kbd key={k} className="br-kbd">{k}</kbd>)}
        </span>
    );
}

function ShortcutsDialogInner() {
    const setShowShortcuts = useUIStore(s => s.setShowShortcuts);
    const containerRef = useFocusTrap(true);
    const close = () => setShowShortcuts(false);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === '?') {
                e.preventDefault();
                e.stopPropagation();
                setShowShortcuts(false);
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [setShowShortcuts]);

    return (
        <div className="br-dialog-backdrop" onClick={close}>
            <div
                ref={containerRef}
                className="br-dialog br-shortcuts"
                role="dialog"
                aria-modal="true"
                aria-labelledby="br-shortcuts-title"
                onClick={e => e.stopPropagation()}
            >
                <div className="br-dialog__header">
                    <h2 id="br-shortcuts-title" className="br-dialog__title">Keyboard shortcuts</h2>
                    <button className="br-btn br-btn--ghost br-btn--icon" onClick={close} aria-label="Close">
                        <X />
                    </button>
                </div>
                <div className="br-dialog__body br-shortcuts__body">
                    {GROUPS.map(g => (
                        <section key={g.title} className="br-shortcuts__group" aria-labelledby={`br-shortcuts-${g.title}`}>
                            <h3 id={`br-shortcuts-${g.title}`} className="br-section__title">{g.title}</h3>
                            <dl className="br-shortcuts__list">
                                {g.rows.map(([keys, label]) => (
                                    <div key={label + keys.join()} className="br-shortcuts__row">
                                        <dt>{label}</dt>
                                        <dd><Shortcut keys={keys} /></dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ShortcutsDialog() {
    const isOpen = useUIStore(s => s.showShortcuts);
    if (!isOpen) return null;
    return (
        <ModalPortal>
            <ShortcutsDialogInner />
        </ModalPortal>
    );
}
