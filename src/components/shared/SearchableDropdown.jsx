import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  buttonClass = ""
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
  const [coords, setCoords] = useState(null);

  const updateCoords = useCallback(() => {
    if (dropdownRef.current && isOpen) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = 320;
      let topPos = rect.bottom + 4;
      
      // If it would go off the bottom of the screen, flip it above the button
      if (topPos + menuHeight > window.innerHeight) {
        topPos = rect.top - 4 - menuHeight;
        if (topPos < 0) topPos = 4; // fallback if screen is too small
      }
      
      // Width calculation:
      // Minimum width = button's width (rect.width), but at least 260px.
      // Maximum width = 450px (to prevent extreme expansion).
      const baseWidth = Math.max(260, rect.width);
      const menuMaxWidth = 450;
      
      // Prevent off-screen horizontal
      let leftPos = rect.left;
      if (leftPos + menuMaxWidth > window.innerWidth) {
        leftPos = window.innerWidth - menuMaxWidth - 8;
        if (leftPos < 8) leftPos = 8;
      }
      
      setCoords({
        top: topPos,
        left: leftPos,
        width: baseWidth,
        maxWidth: menuMaxWidth
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Because portal is outside dropdownRef, we also need to check if target is inside the portal
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Only close if it's not a click inside the portal itself
        if (!event.target.closest('[role="listbox"]')) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    updateCoords();
    if (isOpen) {
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true); // true = capture phase for any scrolling container
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, updateCoords]);

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

  useEffect(() => {
    setHighlightIndex(-1);
  }, [filteredOptions]);

  const selectItem = useCallback((optId) => {
    onChange(optId === LOOP_SENTINEL ? null : optId);
    setIsOpen(false);
    setSearch('');
    setHighlightIndex(-1);
  }, [onChange]);

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
        className={`w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${buttonClass}`}
        style={{
          background: 'var(--color-surface-card-low)',
          border: '1px solid var(--color-border-row)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
        }}
        aria-label={selectedOption ? `${selectedOption.id} - ${selectedOption.name || selectedOption.text || 'Unnamed'}` : placeholder}
      >
        <span className="truncate pr-2" style={{ fontWeight: 500 }}>
          {selectedOption ? `${selectedOption.id === LOOP_SENTINEL ? '' : selectedOption.id + ' · '}${selectedOption.name || selectedOption.text || 'Unnamed'}` : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0 ml-1" />
      </button>

      {isOpen && coords && createPortal(
        <div
          className="fixed z-[9999] flex flex-col shadow-2xl overflow-hidden"
          style={{ 
            top: coords.top, 
            left: coords.left, 
            minWidth: coords.width,
            maxWidth: coords.maxWidth, 
            background: 'var(--color-surface-elevated)', 
            border: '1px solid var(--color-border-card)', 
            borderRadius: 8, 
            maxHeight: 320 
          }}
          onClick={(e) => e.stopPropagation()}
          role="listbox"
        >
          <div className="p-2 flex flex-col gap-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border-divider)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Search by ID or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-8 pr-3 py-1.5 rounded-md focus:outline-none transition-colors"
                style={{
                  background: 'var(--color-surface-card-low)',
                  color: 'var(--color-text-primary)',
                  fontSize: 12,
                  fontFamily: 'var(--font-ui)',
                }}
                role="searchbox"
                aria-label="Search dropdown options"
              />
            </div>

            {(showFilters || availableTypes.length > 0) && (
              <div className="flex gap-1.5 flex-wrap">
                {availableTypes.length > 0 && (
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 rounded-md px-2 py-1 cursor-pointer min-w-[30%] focus:outline-none"
                    style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}
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
                      className="flex-1 rounded-md px-2 py-1 cursor-pointer min-w-[30%] focus:outline-none"
                      style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      aria-label="Filter by path"
                    >
                      <option value="ALL">All Paths</option>
                      {Object.values(paths).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    
                    <select 
                      value={filterChapter} 
                      onChange={(e) => setFilterChapter(e.target.value)}
                      className="flex-1 rounded-md px-2 py-1 cursor-pointer min-w-[30%] focus:outline-none"
                      style={{ background: 'var(--color-surface-card-low)', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}
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

          <div className="relative w-full" style={{ height: 280 }}>
            {flatItems.length === 0 ? (
               <div className="text-center py-8" style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }} role="option" aria-disabled="true">No results found</div>
            ) : (
               <Virtuoso
                 ref={listRef}
                 style={{ height: '100%', width: '100%' }}
                 totalCount={flatItems.length}
                 itemContent={(index) => {
                   const data = flatItems[index];

                   if (data.isHeader) {
                     return (
                       <div
                         className="px-3 py-1.5 flex items-center justify-between"
                         style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border-ghost)' }}
                         aria-hidden="true"
                       >
                         {data.title}
                         <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', background: 'var(--color-surface-card)', padding: '1px 5px', borderRadius: 4 }}>{data.count}</span>
                       </div>
                     );
                   }

                   const { item: opt, flatIdx: currentFlatIdx } = data;
                   const isSelected = normalizedValue === opt.id;
                   const isHighlighted = currentFlatIdx === highlightIndex;

                   return (
                     <div className="px-1 py-0.5">
                       <button
                         type="button"
                         data-dropdown-item
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           selectItem(opt.id);
                         }}
                         onMouseEnter={() => setHighlightIndex(currentFlatIdx)}
                         className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors"
                         style={{
                           background: isSelected ? 'rgba(0,209,255,0.08)' : isHighlighted ? 'var(--color-surface-card)' : 'transparent',
                           border: isSelected ? '1px solid rgba(0,209,255,0.2)' : '1px solid transparent',
                           color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                           fontSize: 12,
                         }}
                         role="option"
                         aria-selected={isSelected}
                       >
                         <span className="flex items-center gap-2 overflow-hidden w-full">
                           {opt.id !== LOOP_SENTINEL && (
                             <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>{opt.id}</span>
                           )}
                           <span className="truncate flex-1">{opt.name ? opt.name.replace(/\[.*?\]\s/, '') : (opt.text || 'Unnamed')}</span>
                         </span>
                         {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-accent-primary)' }} />}
                       </button>
                     </div>
                   );
                 }}
               />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
