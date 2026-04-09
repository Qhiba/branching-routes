import React from 'react';
import { useGraphStore, useSimulationStore } from 'store';

export default function TopBar() {
  const meta = useGraphStore(s => s.meta);
  const updateMeta = useGraphStore(s => s.updateMeta);
  const isRunning = useSimulationStore(s => s.isRunning);

  const handleTitleChange = (e) => {
    if (updateMeta) {
      updateMeta({ title: e.target.value });
    }
  };

  return (
    <div className="topbar-content">
      <div className="topbar__left">
        <strong>Branching Routes</strong>
      </div>
      <div className="topbar__center">
        <input 
          type="text" 
          value={meta?.title || ''} 
          onChange={handleTitleChange}
          onFocus={(e) => {
            if (e.target.value === 'Untitled Graph') {
              e.target.select();
            }
          }}
          placeholder="Project Title"
          className="topbar__title-input"
        />
      </div>
      <div className="topbar__right">
        <button onClick={() => console.log('New')}>New</button>
        <button onClick={() => console.log('Open')}>Open</button>
        <button onClick={() => console.log('Save')}>Save</button>
        <button onClick={() => console.log('Toggle Simulation')}>
          {isRunning ? 'Stop Simulation' : 'Start Simulation'}
        </button>
      </div>
    </div>
  );
}
