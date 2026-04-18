import React, { useState } from 'react';
import { useNarrativeStore, useUIStore } from 'store';
import NodeInspector from './NodeInspector';
import EdgeInspector from './EdgeInspector';
import FlagManager from './FlagManager';
import StatusManager from './StatusManager';
// MODIFIED: Import the new PathChapterManager
import PathChapterManager from './PathChapterManager';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('inspector');
  const selectedNodeId = useUIStore(state => state.selectedNodeId);
  const selectedEdgeId = useUIStore(state => state.selectedEdgeId);

  return (
    // PROTECTED: Integration points (existing 3 tabs, render conditions, and style patterns) are preserved.
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' }}>
      <div className="sidebar-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'inspector' ? 'var(--color-bg-base)' : 'transparent', color: activeTab === 'inspector' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', borderBottom: activeTab === 'inspector' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('inspector')}
        >
          Inspector
        </button>
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'flags' ? 'var(--color-bg-base)' : 'transparent', color: activeTab === 'flags' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', borderBottom: activeTab === 'flags' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('flags')}
        >
          Flags
        </button>
        {/* CHANGED: 2 tabs (inspector, flags) → 3 tabs (inspector, flags, status) */}
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'status' ? 'var(--color-bg-base)' : 'transparent', color: activeTab === 'status' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', borderBottom: activeTab === 'status' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('status')}
        >
          Status
        </button>
        {/* MODIFIED: Fourth tab for PathChapterManager */}
        <button 
          style={{ flex: 1, padding: '12px', background: activeTab === 'paths' ? 'var(--color-bg-base)' : 'transparent', color: activeTab === 'paths' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', border: 'none', borderBottom: activeTab === 'paths' ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer' }}
          onClick={() => setActiveTab('paths')}
        >
          Paths
        </button>
      </div>
      
      <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'inspector' && (
          <>
            {selectedNodeId && <NodeInspector />}
            {selectedEdgeId && <EdgeInspector />}
            {!selectedNodeId && !selectedEdgeId && (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                Select a node or edge to inspect
              </div>
            )}
          </>
        )}
        {activeTab === 'flags' && <FlagManager />}
        {/* CHANGED: render only Inspector and FlagManager → also render StatusManager for status tab */}
        {activeTab === 'status' && <StatusManager />}
        {/* MODIFIED: Render PathChapterManager for paths tab */}
        {activeTab === 'paths' && <PathChapterManager />}
      </div>
    </div>
  );
}
