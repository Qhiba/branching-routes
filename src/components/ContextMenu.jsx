import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNarrativeStore, useUIStore } from 'store';

// ADDED: Phase 3 ContextMenu component
export default function ContextMenu({ x, y, type, targetId, onClose }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({ left: x, top: y, visibility: 'hidden' });
  const selectedNodeIds = useUIStore(s => s.selectedNodeIds);

  // PROTECTED: Viewport edge flip logic (mitigates RISK-CMK-05)
  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    
    let nextLeft = x;
    let nextTop = y;

    // Flip left if overflowing right edge
    if (x + rect.width > window.innerWidth) {
      nextLeft = x - rect.width;
    }

    // Flip up if overflowing bottom edge
    if (y + rect.height > window.innerHeight) {
      nextTop = y - rect.height;
    }

    setStyle({
      left: nextLeft,
      top: nextTop,
      visibility: 'visible',
    });
  }, [x, y, type, targetId]);

  if (!type) return null;

  const handleAction = (actionFn) => {
    return (e) => {
      e.stopPropagation();
      actionFn();
      onClose();
    };
  };

  const navStore = useNarrativeStore.getState();

  const renderItems = () => {
    switch (type) {
      case 'pane':
        return (
          <>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'common', screenX: x, screenY: y } }));
            })}>
              Add Common Node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'choice', screenX: x, screenY: y } }));
            })}>
              Add Choice Node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'ending', screenX: x, screenY: y } }));
            })}>
              Add Ending Node
            </button>
          </>
        );
      case 'node':
        return (
          <>
            <button className="context-menu__item" onClick={handleAction(() => {
              // Ensure we actually have the action signature in narrativeStore:
              navStore.setStartNode && navStore.setStartNode(targetId);
            })}>
              Set as Start Node
            </button>
            <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
              navStore.deleteNode(targetId);
            })}>
              Delete Node
            </button>
          </>
        );
      case 'edge':
        return (
          <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
            navStore.deleteEdge(targetId);
          })}>
            Delete Edge
          </button>
        );
      case 'multi':
        return (
          <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
            selectedNodeIds.forEach(id => navStore.deleteNode(id));
          })}>
            Delete Selected ({selectedNodeIds.length} nodes)
          </button>
        );
      default:
        return null;
    }
  };

  // Close when clicking outside in the wrapper
  return (
    <div className="context-menu__backdrop" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }}>
      <div
        ref={menuRef}
        className="context-menu"
        style={style}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      >
        {renderItems()}
      </div>
    </div>
  );
}
