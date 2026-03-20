import React, { useState } from 'react';
import { Hash } from 'lucide-react';

export default function QuickNav({ items = [], title = "Quick Jump", renderLabel }) {
  const [activeId, setActiveId] = useState(null);

  const handleScroll = (id) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-4', 'ring-indigo-300', 'ring-offset-2', 'transition-shadow', 'duration-500');
      setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-300', 'ring-offset-2'), 1500);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="w-72 shrink-0 hidden lg:block sticky top-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-h-[calc(100vh-8rem)] flex flex-col">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-400" /> {title} Navigator
        </h3>
        <div className="overflow-y-auto pr-2 space-y-1 pb-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleScroll(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${activeId === item.id ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
              title={renderLabel(item)}
            >
              <span className="font-mono text-xs font-bold text-indigo-400/80 mr-2 drop-shadow-sm">{item.id}</span>
              {renderLabel(item)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
