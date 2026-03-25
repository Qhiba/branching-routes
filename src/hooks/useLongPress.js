import { useCallback, useRef, useState } from 'react';

export default function useLongPress(onLongPress, onClick, { delay = 500 } = {}) {
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const timerRef = useRef();
  const isMovedRef = useRef(false);

  const start = useCallback((event) => {
    // Only primary mouse button or touch
    if (event.type === 'mousedown' && event.button !== 0) return;
    
    isMovedRef.current = false;
    timerRef.current = setTimeout(() => {
      onLongPress(event);
      setIsLongPressActive(true);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback((event) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!isLongPressActive && !isMovedRef.current) {
      onClick && onClick(event);
    }
    
    setIsLongPressActive(false);
  }, [onClick, isLongPressActive]);

  const move = useCallback(() => {
    // If the user moves significantly, cancel the long press
    isMovedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseMove: move,
  };
}
