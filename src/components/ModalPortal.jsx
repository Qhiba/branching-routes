// ADDED (Redesign Step 4): single modal root. Every dialog renders through this portal into <body>, so no dialog
// is ever trapped inside a sidebar / panel stacking context (notes.txt: "the modal shouldn't be inside the side bar").
import { createPortal } from 'react-dom';

export default function ModalPortal({ children }) {
    if (typeof document === 'undefined') return children;
    return createPortal(children, document.body);
}

