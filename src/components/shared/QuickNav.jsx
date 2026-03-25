import React, { useRef, useEffect } from 'react';
import useLongPress from '../../hooks/useLongPress';
import { useEditorActions } from '../../context/EditorContext';

function QuickNavItem({ item, onScroll, onFocus, renderLabel }) {
  const longPressProps = useLongPress(
    () => onFocus(item.id),
    () => onScroll(item.id),
    { delay: 600 }
  );

  return (
    <button
      {...longPressProps}
      className="w-full text-center py-1.5 rounded transition-colors"
      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', cursor: 'pointer', background: 'transparent' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
      title={renderLabel(item)}
    >
      {item.id}
    </button>
  );
}

export default function QuickNav({ items = [], title = "Quick Jump", renderLabel }) {
  const activeTimerRef = useRef(null);
  const { focusNode } = useEditorActions();

  useEffect(() => {
    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, []);

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.style.outline = '1.5px solid var(--color-border-active)';
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      activeTimerRef.current = setTimeout(() => {
        if (el.isConnected) {
          el.style.outline = 'none';
        }
        activeTimerRef.current = null;
      }, 1500);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="w-[72px] shrink-0 hidden lg:flex flex-col sticky top-0 h-full overflow-y-auto" style={{ background: 'var(--color-surface-panel)', borderLeft: '1px solid var(--color-border-ghost)' }}>
      <div className="py-3 px-1.5 space-y-0.5">
        {items.map(item => (
          <QuickNavItem 
            key={item.id} 
            item={item} 
            onScroll={handleScroll} 
            onFocus={focusNode}
            renderLabel={renderLabel}
          />
        ))}
      </div>
    </div>
  );
}
