import React from 'react';
import {
  GitCommit,
  GitPullRequest,
  BoxSelect
} from 'lucide-react';

// ADDED: Phase 4 CreationBar component for dispatching canvas entity creation events
// FIX: Node buttons open a naming modal before creation; node appears at viewport center on confirm
export default function CreationBar({ disabled }) {
  const handleNodeAdd = (type) => {
    window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: type } }));
  };

  return (
    <div className="floating-overlay-target">
      <div className="floating-pill floating-pill--creation">
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className="topbar__control-btn"
            onClick={() => handleNodeAdd('common')}
            disabled={disabled}
            title="Add Common Node"
          >
            <GitCommit className="topbar__control-icon" style={{ color: 'var(--color-node-common)' }} />
            <span>Common</span>
          </button>
          <button
            className="topbar__control-btn"
            onClick={() => handleNodeAdd('choice')}
            disabled={disabled}
            title="Add Choice Node"
          >
            <GitPullRequest className="topbar__control-icon" style={{ color: 'var(--color-node-choice)' }} />
            <span>Choice</span>
          </button>
          <button
            className="topbar__control-btn"
            onClick={() => handleNodeAdd('ending')}
            disabled={disabled}
            title="Add Ending Node"
          >
            <BoxSelect className="topbar__control-icon" style={{ color: 'var(--color-node-ending)' }} />
            <span>Ending</span>
          </button>
        </div>
      </div>
    </div>
  );
}
