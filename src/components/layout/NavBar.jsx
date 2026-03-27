import React from 'react';
import { Flag, Layers, GitFork, Book, Dumbbell, Award, ListTree } from 'lucide-react';
import SearchableDropdown from '../shared/SearchableDropdown';

export default function NavBar({ activeNavItem, onNavChange, entryNode, setEntryNode, entryPointOptions, entryNodeType }) {
  const navItems = [
    { id: 'flags', name: 'Flags', icon: Flag },
    { id: 'status', name: 'Status', icon: Dumbbell },
    { id: 'choices', name: 'Choices', icon: GitFork },
    { id: 'scenes', name: 'Scenes', icon: Layers },
    { id: 'paths', name: 'Paths', icon: ListTree },
    { id: 'chapters', name: 'Chapters', icon: Book },
    { id: 'quests', name: 'Quests', icon: ListTree },
    { id: 'endings', name: 'Endings', icon: Award },
  ];

  return (
    <nav className="h-9 flex-shrink-0 flex items-center px-4 border-b w-full" style={{ background: 'var(--color-surface-panel)', borderColor: 'var(--color-border-panel)' }}>
      <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-ui)', fontSize: 12 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNavItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(isActive ? null : item.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded transition-colors"
              style={{ 
                color: isActive ? 'var(--color-accent-primary-dim)' : 'var(--color-text-secondary)', 
                background: isActive ? 'rgba(0,209,255,0.06)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-accent-primary-dim)';
                  e.currentTarget.style.background = 'rgba(0,209,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
      <div className="flex-1"></div>
      <div className="flex items-center gap-2">
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          ENTRY NODE
        </span>
        <SearchableDropdown
          value={entryNode || null}
          onChange={setEntryNode}
          options={entryPointOptions}
          placeholder="Set entry node..."
          showFilters={true}
          showIdPrefix={false}
          warningWhenEmpty={true}
          className="w-[200px]"
        />
      </div>
    </nav>
  );
}
