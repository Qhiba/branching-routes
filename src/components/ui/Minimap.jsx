// ============================================================
// Minimap.jsx — React Flow minimap with dark-themed styling
// ============================================================
// Wraps @xyflow/react MiniMap with dark colors matching the
// app aesthetic. Provides entity-type-aware node coloring.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/ui/
//   AR-09: MiniMap nodeColor requires raw strings — CSS custom
//          properties cannot be read from JS without
//          getComputedStyle. Values mirror tokens.css.
// ============================================================

import { useCallback } from 'react';
import { MiniMap } from '@xyflow/react';

/**
 * Minimap — Dark-themed React Flow minimap wrapper.
 *
 * Renders in the bottom-right corner with node coloring
 * based on entity type (common, choice, ending).
 */
function Minimap() {
  /**
   * Returns a color string for minimap node rendering.
   * Must use raw color strings because MiniMap nodeColor
   * does not support CSS custom properties.
   * Values mirror tokens.css node-type colors.
   */
  const nodeColor = useCallback((node) => {
    switch (node.type) {
      case 'commonNode':
        return 'hsl(210, 100%, 55%)'; // --color-node-common
      case 'choiceNode':
        return 'hsl(265, 80%, 60%)'; // --color-node-choice
      case 'endingNode':
        return 'hsl(0, 75%, 55%)'; // --color-node-ending
      default:
        return 'hsl(220, 10%, 35%)';
    }
  }, []);

  return (
    <MiniMap
      position="bottom-right"
      nodeColor={nodeColor}
      maskColor="hsla(220, 16%, 6%, 0.75)"
      style={{
        background: 'hsl(220, 14%, 11%)', // --color-bg-secondary
        border: '1px solid hsl(220, 10%, 20%)', // --color-border-subtle
        borderRadius: '8px', // --radius-lg
        boxShadow: '0 4px 16px hsla(0, 0%, 0%, 0.5)', // --shadow-lg
        // Position offset to account for status strip height
        marginBottom: '36px',
      }}
      pannable
      zoomable
    />
  );
}

export default Minimap;
