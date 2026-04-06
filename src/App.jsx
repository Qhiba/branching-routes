import { GitBranch } from 'lucide-react'

/**
 * App — placeholder shell for Branching Routes V2.
 * 
 * Phase 1 only: renders a centered placeholder confirming
 * the dev server, design tokens, and import alias are working.
 * This component will be replaced in Phase 6 with <GraphCanvas />.
 */
function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 'var(--space-6)',
      userSelect: 'none',
    }}>
      {/* Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <GitBranch
          size={32}
          strokeWidth={1.5}
          style={{ color: 'var(--color-accent-cyan)' }}
        />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--letter-spacing-tight)',
      }}>
        Branching Routes
      </h1>

      {/* Version badge */}
      <span style={{
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-accent-cyan)',
        background: 'var(--color-accent-cyan-muted)',
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-full)',
        letterSpacing: 'var(--letter-spacing-wider)',
        textTransform: 'uppercase',
      }}>
        v2.0 — Phase 4
      </span>

      {/* Status */}
      <p style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-tertiary)',
        maxWidth: '320px',
        textAlign: 'center',
        lineHeight: 'var(--line-height-normal)',
      }}>
        State Management Layer Implemeted.
        <br />
        Waiting for Phase 4.
      </p>
    </div>
  )
}

export default App
