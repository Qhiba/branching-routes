// ADDED (Redesign Step 4): Enter-to-confirm rule shared by every dialog (notes.txt: "Enter should be able to be
// pressed as confirm"). Pure function, kept out of ModalPortal.jsx so that file only exports a component.
/**
 * True when a keydown should trigger the dialog's confirm action: plain Enter, not composing text (IME), and not
 * inside a multi-line field, a select, or on a button/link (those keep their native Enter behaviour).
 */
export function isConfirmEnter(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.isComposing) return false;
    const el = e.target;
    const tag = el?.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') return false;
    if (el?.isContentEditable) return false;
    const role = el?.getAttribute?.('role');
    if (role === 'combobox' || role === 'listbox') return false;
    return true;
}
