import React from 'react';

// ADDED: Phase 4 CreationBar component for dispatching canvas entity creation events
// FIX: Node buttons open a naming modal before creation; node appears at viewport center on confirm
export default function CreationBar({ disabled }) {
  const handleNodeAdd = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
  };

  const handleEntityAdd = (entityType) => {
    window.dispatchEvent(new CustomEvent('canvas-open-name-modal', { detail: { entityType } }));
  };

  return (
    <div className="topbar__creation-bar">
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleNodeAdd('common')} 
        disabled={disabled}
      >
        Common
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleNodeAdd('choice')} 
        disabled={disabled}
      >
        Choice
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleNodeAdd('ending')} 
        disabled={disabled}
      >
        Ending
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleEntityAdd('flag')} 
        disabled={disabled}
      >
        Flag
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleEntityAdd('status')} 
        disabled={disabled}
      >
        Status
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleEntityAdd('path')} 
        disabled={disabled}
      >
        Path
      </button>
      <button 
        className="button creation-bar__btn" 
        onClick={() => handleEntityAdd('chapter')} 
        disabled={disabled}
      >
        Chapter
      </button>
    </div>
  );
}
