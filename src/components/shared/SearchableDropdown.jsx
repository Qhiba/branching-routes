import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

const LOOP_SENTINEL = '__LOOP__';

export default function SearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  showFilters = false,
  className = "",
  buttonClass = "border-gray-200 focus:ring-indigo-400"
}) {
  const { paths, chapters } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPath, setFilterPath] = useState('ALL');
  const [filterChapter, setFilterChapter] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize null-ID loop options to use the sentinel value
  const normalizedOptions = useMemo(() =>
    options.map(o => o.id === null ? { ...o, id: LOOP_SENTINEL } : o),
    [options]
  );

  const normalizedValue = value === null ? LOOP_SENTINEL : value;

  const selectedOption = useMemo(() => normalizedOptions.find(o => o.id === normalizedValue), [normalizedOptions, normalizedValue]);

  const availableTypes = useMemo(() => {
    const types = new Set();
    normalizedOptions.forEach(o => { if (o.type) types.add(o.type); });
    return Array.from(types).sort();
  }, [normalizedOptions]);

  const filteredOptions = useMemo(() => {
    let result = normalizedOptions;
    if (showFilters) {
      if (filterPath !== 'ALL') result = result.filter(o => o.path === filterPath);
      if (filterChapter !== 'ALL') result = result.filter(o => o.chapter === filterChapter);
    }
    if (filterType !== 'ALL') {
      result = result.filter(o => o.type === filterType);
    }
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(o => 
        (o.name && o.name.toLowerCase().includes(lowerSearch)) || 
        (o.text && o.text.toLowerCase().includes(lowerSearch)) ||
        (o.id && o.id.toLowerCase().includes(lowerSearch))
      );
    }
    return result;
  }, [normalizedOptions, search, filterPath, filterChapter, filterType, showFilters]);

  // Reset highlight when filtered results change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filteredOptions]);

  const selectItem = useCallback((optId) => {
    // Convert sentinel back to null for the external API
    onChange(optId === LOOP_SENTINEL ? null : optId);
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
  }, [onChange]);

  // Full keyboard navigation: Enter, Escape, ArrowUp, ArrowDown
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearch('');
      setHighlightIndex(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        scrollHighlightIntoView(next);
        return next;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        scrollHighlightIntoView(next);
        return next;
      });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
        selectItem(filteredOptions[highlightIndex].id);
      } else if (filteredOptions.length > 0) {
        selectItem(filteredOptions[0].id);
      }
      return;
    }
  };

  const flatItems = useMemo(() => {
    const arr = [];
    if (filteredOptions.length === 0) return arr;
    
    // Group by type
    const grouped = filteredOptions.reduce((acc, opt) => {
      const t = opt.type || '';
      if (!acc[t]) acc[t] = [];
      acc[t].push(opt);
      return acc;
    }, {});

    let flatIdx = 0;
    Object.entries(grouped).forEach(([typeStr, items]) => {
      if (typeStr) {
        arr.push({ isHeader: true, title: `${typeStr}s`, count: items.length });
      }
      items.forEach(opt => {
        arr.push({ isHeader: false, item: opt, flatIdx: flatIdx++ });
      });
    });
    return arr;
  }, [filteredOptions]);

  const scrollHighlightIntoView = (flatIdx) => {
    if (listRef.current && listRef.current.scrollToIndex) {
      const listIndex = flatItems.findIndex(data => !data.isHeader && data.flatIdx === flatIdx);
      if (listIndex !== -1) {
        listRef.current.scrollToIndex({ index: listIndex, align: 'center', behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 hover:border-white/20 transition-colors ${buttonClass}`}
        aria-label={selectedOption ? `${selectedOption.id} - ${selectedOption.name || selectedOption.text || 'Unnamed'}` : placeholder}
      >
        <span className="truncate font-medium whitespace-nowrap overflow-hidden pr-2">
          {selectedOption ? `${selectedOption.id === LOOP_SENTINEL ? '' : selectedOption.id + ' - '}${selectedOption.name || selectedOption.text || 'Unnamed'}` : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-auto min-w-full max-w-[90vw] bg-surface-container-highest border border-white/5 rounded-xl shadow-2xl overflow-hidden flex flex-col"
             onClick={(e) => e.stopPropagation()}
             role="listbox"
        >
          <div className="p-3 bg-black/40 border-b border-white/5 flex flex-col gap-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Search by ID or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-container border border-white/5 text-on-surface rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-zinc-500 transition-colors"
                role="searchbox"
                aria-label="Search dropdown options"
              />
            </div>

            {(showFilters || availableTypes.length > 0) && (
              <div className="flex gap-2 flex-wrap">
                {availableTypes.length > 0 && (
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 bg-surface-container border border-white/5 rounded-lg px-2 py-1.5 text-xs font-bold font-mono tracking-widest uppercase text-zinc-400 focus:outline-none focus:border-primary focus:text-primary transition-colors cursor-pointer min-w-[30%]"
                    aria-label="Filter by type"
                  >
                    <option value="ALL">All Types</option>
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}
                
                {showFilters && (
                  <>
                    <select 
                      value={filterPath} 
                      onChange={(e) => setFilterPath(e.target.value)}
                      className="flex-1 bg-surface-container border border-white/5 rounded-lg px-2 py-1.5 text-xs font-bold font-mono tracking-widest uppercase text-zinc-400 focus:outline-none focus:border-primary focus:text-primary transition-colors cursor-pointer min-w-[30%]"
                      aria-label="Filter by path"
                    >
                      <option value="ALL">All Paths</option>
                      {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    
                    <select 
                      value={filterChapter} 
                      onChange={(e) => setFilterChapter(e.target.value)}
                      className="flex-1 bg-surface-container border border-white/5 rounded-lg px-2 py-1.5 text-xs font-bold font-mono tracking-widest uppercase text-zinc-400 focus:outline-none focus:border-primary focus:text-primary transition-colors cursor-pointer min-w-[30%]"
                      aria-label="Filter by chapter"
                    >
                      <option value="ALL">All Chapters</option>
                      {Object.values(chapters).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="h-[280px] relative w-full">
            {flatItems.length === 0 ? (
               <div className="text-center py-8 text-sm text-zinc-500 font-mono" role="option" aria-disabled="true">No results found</div>
            ) : (
               <Virtuoso
                 ref={listRef}
                 style={{ height: '100%', width: '100%' }}
                 totalCount={flatItems.length}
                 itemContent={(index) => {
                   const data = flatItems[index];

                   if (data.isHeader) {
                     return (
                       <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-surface-container-highest/90 backdrop-blur-md z-10 border-y border-white/5 flex items-center justify-between" aria-hidden="true">
                         {data.title}
                         <span className="font-mono text-[9px] text-zinc-600 bg-surface-container px-1.5 py-0.5 rounded">{data.count}</span>
                       </div>
                     );
                   }

                   const { item: opt, flatIdx: currentFlatIdx } = data;
                   return (
                     <div className="p-1">
                       <button
                         type="button"
                         data-dropdown-item
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           selectItem(opt.id);
                         }}
                         onMouseEnter={() => setHighlightIndex(currentFlatIdx)}
                         className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                           normalizedValue === opt.id ? 'bg-primary/10 border border-primary/20 text-on-primary font-bold' :
                           currentFlatIdx === highlightIndex ? 'bg-white/10 text-on-surface border border-transparent' :
                           'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                         }`}
                         role="option"
                         aria-selected={normalizedValue === opt.id}
                       >
                         <span className="truncate flex items-center gap-2">
                            {opt.id !== LOOP_SENTINEL && <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 bg-black/30 rounded border border-white/5">{opt.id}</span>}
                            <span>{opt.name ? opt.name.replace(/\[.*?\]\s/, '') : (opt.text || 'Unnamed')}</span>
                         </span>
                         {normalizedValue === opt.id && <Check className="w-4 h-4 shrink-0 text-primary drop-shadow-[0_0_8px_rgba(0,209,255,0.8)]" />}
                       </button>
                     </div>
                   );
                 }}
                 className="custom-scrollbar"
               />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
