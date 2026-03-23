import React from 'react';

export default function FormFooter({ onSave, onCancel, saveDisabled = false }) {
  return (
    <div className="flex gap-2 p-3 mt-auto flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-ghost)', background: 'var(--color-surface-panel)' }}>
      <button
        onClick={onCancel}
        className="w-1/4 py-2 rounded-md transition-colors"
        style={{ background: 'transparent', border: '1px solid var(--color-border-ghost)', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 500 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-surface-card)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saveDisabled}
        className="w-3/4 py-2 rounded-md signature-gradient transition-opacity"
        style={{ 
          border: 'none', 
          color: '#0a1a1f', 
          fontSize: 12, 
          fontWeight: 600, 
          letterSpacing: '0.04em', 
          textTransform: 'uppercase',
          opacity: saveDisabled ? 0.3 : 1,
          cursor: saveDisabled ? 'not-allowed' : 'pointer'
        }}
      >
        Save
      </button>
    </div>
  );
}
