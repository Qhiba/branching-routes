import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNarrativeStore, useUIStore, useToastStore, beginGroup, endGroup } from 'store';
import { duplicateSelection } from 'hooks/useKeyboardShortcuts';

// ADDED: Phase 3 ContextMenu component
export default function ContextMenu({ x, y, type, targetId, onClose }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState({ left: x, top: y, visibility: 'hidden' });
  const selectedNodeIds = useUIStore(s => s.selectedNodeIds);
  const copiedNode = useUIStore(s => s.copiedNode);
  const setCopiedNode = useUIStore(s => s.setCopiedNode);

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

  // FIX (Redesign Step 8): Esc closes the menu (documented before, but never implemented)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

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
              Add Common node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'choice', screenX: x, screenY: y } }));
            })}>
              Add Choice node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'ending', screenX: x, screenY: y } }));
            })}>
              Add Ending node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'warp_entrance', screenX: x, screenY: y } }));
            })}>
              Add Warp entrance
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'warp_exit', screenX: x, screenY: y } }));
            })}>
              Add Warp exit
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-open-node-modal', { detail: { nodeType: 'hub', screenX: x, screenY: y } }));
            })}>
              Add Hub
            </button>
            {copiedNode && (
              <>
                <div className="context-menu__divider" />
                <button className="context-menu__item" onClick={handleAction(() => {
                  window.dispatchEvent(new CustomEvent('canvas-paste-node', { detail: { screenX: x, screenY: y } }));
                })}>
                  Paste node
                </button>
              </>
            )}
          </>
        );
      case 'node':
        return (
          <>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-edit-node-modal', { detail: { nodeId: targetId } }));
            })}>
              Edit node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              navStore.setStartNode && navStore.setStartNode(targetId);
            })}>
              Make start node
            </button>
            <button className="context-menu__item" onClick={handleAction(() => {
              const node = navStore.common[targetId] || navStore.choice[targetId] || navStore.ending[targetId];
              if (node) {
                setCopiedNode(node);
                useToastStore.getState().addToast(`Copied node: ${node.data?.label || 'Node'}`, 'success');
              }
            })}>
              Copy node
            </button>
            {/* ADDED (Redesign Step 5) */}
            <button className="context-menu__item" onClick={handleAction(() => {
              useUIStore.getState().selectNode(targetId);
              useUIStore.getState().setSelectedNodeIds([targetId]);
              duplicateSelection();
            })}>
              Duplicate node <span className="context-menu__shortcut">Ctrl D</span>
            </button>
            <div className="context-menu__divider" />
            <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
              navStore.deleteNode(targetId);
            })}>
              Delete node
            </button>
          </>
        );
      case 'edge':
        return (
          <>
            <button className="context-menu__item" onClick={handleAction(() => {
              window.dispatchEvent(new CustomEvent('canvas-edit-edge-modal', { detail: { edgeId: targetId } }));
            })}>
              Edit edge
            </button>
            <div className="context-menu__divider" />
            <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
              navStore.deleteEdge(targetId);
            })}>
              Delete edge
            </button>
          </>
        );
      case 'multi': {
        // CHANGED (Redesign Step 5): align / distribute + duplicate; multi-delete is one undo step
        const align = (mode) => handleAction(() => window.dispatchEvent(new CustomEvent('canvas-align', { detail: { mode } })));
        const canDistribute = selectedNodeIds.length >= 3;
        return (
          <>
            <div className="context-menu__label">Align</div>
            <button className="context-menu__item" onClick={align('left')}>Align left edges</button>
            <button className="context-menu__item" onClick={align('centerX')}>Align centres (vertical line)</button>
            <button className="context-menu__item" onClick={align('right')}>Align right edges</button>
            <button className="context-menu__item" onClick={align('top')}>Align top edges</button>
            <button className="context-menu__item" onClick={align('middleY')}>Align middles (horizontal line)</button>
            <button className="context-menu__item" onClick={align('bottom')}>Align bottom edges</button>
            <div className="context-menu__divider" />
            <button className="context-menu__item" disabled={!canDistribute} onClick={align('distributeX')}>Distribute horizontally</button>
            <button className="context-menu__item" disabled={!canDistribute} onClick={align('distributeY')}>Distribute vertically</button>
            <div className="context-menu__divider" />
            <button className="context-menu__item" onClick={handleAction(() => duplicateSelection())}>
              Duplicate {selectedNodeIds.length} nodes <span className="context-menu__shortcut">Ctrl D</span>
            </button>
            <button className="context-menu__item context-menu__item--danger" onClick={handleAction(() => {
              beginGroup();
              selectedNodeIds.forEach(id => navStore.deleteNode(id));
              endGroup();
            })}>
              Delete {selectedNodeIds.length} nodes <span className="context-menu__shortcut">Del</span>
            </button>
          </>
        );
      }
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
        onDoubleClick={e => e.stopPropagation()}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      >
        {renderItems()}
      </div>
    </div>
  );
}
