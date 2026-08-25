import { useEffect, useRef } from 'react';

/**
 * Custom hook for WAI-ARIA modal dialog focus management (RISK-AUD-15).
 * - Focuses the first focusable element (or autoFocus/input) on mount.
 * - Traps Tab and Shift+Tab navigation within the container.
 * - Restores focus to the previously active element on unmount.
 */
export default function useFocusTrap(isOpen = true) {
  const containerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save element that had focus before modal opened
    previousActiveElementRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
    };

    // Auto-focus first input or focusable element
    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      const autoFocusEl = focusables.find(el => el.hasAttribute('autofocus') || el.tagName === 'INPUT') || focusables[0];
      autoFocusEl.focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = getFocusableElements();
      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = currentFocusables[0];
      const lastEl = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl || !container.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  return containerRef;
}
