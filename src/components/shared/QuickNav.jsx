import React, { useRef, useEffect } from 'react';
import { Hash } from 'lucide-react';

export default function QuickNav({ items = [], title = "Quick Jump", renderLabel }) {
  const activeTimerRef = useRef(null);

  // Clean up any pending timer on unmount to prevent DOM manipulation on removed elements
  useEffect(() => {
    return () => {
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    };
  }, []);

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', 'ring-indigo-300', 'ring-offset-2', 'transition-shadow', 'duration-500');
      // Clear any previous timer before setting a new one
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      activeTimerRef.current = setTimeout(() => {
        // Guard: element may have been removed by the time this fires
        if (el.isConnected) {
          el.classList.remove('ring-4', 'ring-indigo-300', 'ring-offset-2');
        }
        activeTimerRef.current = null;
      }, 1500);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="w-72 shrink-0 hidden lg:block sticky top-8">
      <div className="bg-surface-container border border-white/5 rounded-2xl p-4 shadow-xl max-h-[calc(100vh-8rem)] flex flex-col">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" /> {title} Navigator
        </h3>
        <div className="overflow-y-auto pr-2 space-y-1 pb-2 flex-1 custom-scrollbar">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleScroll(item.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all truncate text-zinc-400 hover:text-on-surface hover:bg-white/5 border border-transparent shadow-none hover:shadow-sm"
              title={renderLabel(item)}
            >
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mr-2">{item.id}</span>
              {renderLabel(item)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
