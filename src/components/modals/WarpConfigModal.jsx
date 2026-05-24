import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Link2, GitBranch, Trash2, AlignLeft } from 'lucide-react';
import { useNarrativeStore } from 'store';
import '../modals/NodeConfigModal.css'; /* Reuse br-node-config-modal__* token styles */
import './EdgeConfigModal.css'; /* Reuse ecm-* narrow/chip styles */

// Custom SearchableSelect (adapted from EdgeConfigModal / NodeConfigModal)
function SearchableSelect({ value, options, onChange, placeholder, className }) {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [query, setQuery] = useState('');
    const triggerRef = useRef(null);
    const selected = options.find(o => o.id === value);

    const handleOpen = (e) => {
        e.stopPropagation();
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const DROPDOWN_HEIGHT = 220;
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const spaceAbove = rect.top - 8;
            const openUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
            const maxHeight = Math.min(DROPDOWN_HEIGHT, openUpward ? spaceAbove : spaceBelow);

            setDropdownStyle(
                openUpward
                    ? {
                        position: 'fixed',
                        bottom: window.innerHeight - rect.top + 4,
                        left: rect.left,
                        width: rect.width,
                        maxHeight,
                        zIndex: 9999,
                    }
                    : {
                        position: 'fixed',
                        top: rect.bottom + 4,
                        left: rect.left,
                        width: rect.width,
                        maxHeight,
                        zIndex: 9999,
                    }
            );
        }
        setOpen(prev => !prev);
    };

    return (
        <div className={`br-node-config-modal__searchable-select ${className || ''}`}>
            <div ref={triggerRef} className="br-node-config-modal__searchable-select__trigger" onClick={handleOpen}>
                <span className="br-node-config-modal__searchable-select__value">
                    {selected ? selected.name : <span className="br-node-config-modal__searchable-select__placeholder">{placeholder}</span>}
                </span>
                <span className="br-node-config-modal__searchable-select__caret">▾</span>
            </div>
            {open && (
                <div className="br-node-config-modal__searchable-select__dropdown br-node-config-modal__searchable-select__dropdown--fixed" style={dropdownStyle} onClick={e => e.stopPropagation()}>
                    <input type="text" autoFocus placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="br-node-config-modal__input br-node-config-modal__searchable-select__search" />
                    <div className="br-node-config-modal__searchable-select__options">
                        {options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).map(o => (
                            <div key={o.id} className="br-node-config-modal__searchable-select__option" onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}>
                                {o.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {open && <div className="br-node-config-modal__searchable-select__backdrop" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />}
        </div>
    );
}

export default function WarpConfigModal({ nodeId, onClose, onCancel }) {
    const handleCancel = onCancel || onClose;
    const node = useNarrativeStore(s => s.common[nodeId]);
    const updateNode = useNarrativeStore(s => s.updateNode);
    const deleteNode = useNarrativeStore(s => s.deleteNode);
    const allCommonNodes = useNarrativeStore(s => s.common || {});

    // ESC to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') handleCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleCancel]);

    if (!node) return null;

    const data = node.data || {};
    const isEntrance = node.type === 'warp_entrance';

    // Find opposite type warp nodes
    const oppositeWarpNodes = Object.values(allCommonNodes).filter(n =>
        isEntrance ? n.type === 'warp_exit' : n.type === 'warp_entrance'
    );

    // Build options list
    const options = oppositeWarpNodes.map(n => ({
        id: n.id,
        name: `${n.data?.label || 'Unnamed Warp'} [Channel: ${n.data?.portalChannel || '(not set)'}]`
    }));

    const selectOptions = [
        { id: '', name: '— None (Disconnected) —' },
        ...options
    ];

    // Find currently connected node ID (shares the same portalChannel)
    const currentConnectedNode = data.portalChannel && data.portalChannel.trim() !== ''
        ? oppositeWarpNodes.find(n => n.data?.portalChannel === data.portalChannel)
        : null;

    const currentValue = currentConnectedNode ? currentConnectedNode.id : '';

    const handleConnectChange = (selectedId) => {
        if (!selectedId) {
            // Disconnect: set portalChannel to empty
            updateNode(nodeId, { data: { ...data, portalChannel: '' } });
        } else {
            const targetNode = allCommonNodes[selectedId];
            if (!targetNode) return;
            const targetChannel = targetNode.data?.portalChannel;
            const ourChannel = data.portalChannel;

            if (targetChannel && targetChannel.trim() !== '') {
                // Target has channel, copy to us
                updateNode(nodeId, { data: { ...data, portalChannel: targetChannel } });
            } else if (ourChannel && ourChannel.trim() !== '') {
                // We have channel, copy to target
                updateNode(selectedId, { data: { ...targetNode.data, portalChannel: ourChannel } });
            } else {
                // Neither has channel, generate new one
                const newChannel = 'portal_' + Math.random().toString(36).substr(2, 9);
                updateNode(nodeId, { data: { ...data, portalChannel: newChannel } });
                updateNode(selectedId, { data: { ...targetNode.data, portalChannel: newChannel } });
            }
        }
    };

    const handleDelete = () => {
        deleteNode(nodeId);
        onClose();
    };

    const patch = (field, value) => {
        updateNode(nodeId, { data: { ...data, [field]: value } });
    };

    return (
        <div className="br-node-config-modal__backdrop" onClick={handleCancel}>
            <div className="br-node-config-modal__container br-node-config-modal__container--narrow ecm-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="br-node-config-modal__header">
                    <div className="br-node-config-modal__header__left">
                        <span className="br-node-config-modal__type-badge br-node-config-modal__type-badge--warp">
                            {isEntrance ? 'WARP ENTRANCE' : 'WARP EXIT'}
                        </span>
                        <h3 className="br-node-config-modal__header__title">Configure Warp Portal</h3>
                    </div>
                    <button className="br-node-config-modal__close-btn" onClick={onClose}>
                        <X className="br-node-config-modal__icon-lg" />
                    </button>
                </div>

                {/* Body — single column */}
                <div className="br-node-config-modal__body">
                    <div className="br-node-config-modal__col br-node-config-modal__col--left-only">

                        {/* Title (Node Label) */}
                        <div>
                            <div className="br-node-config-modal__section-title">
                                <GitBranch className="br-node-config-modal__section-title__icon" />
                                <h4 className="br-node-config-modal__section-title__text">Title</h4>
                            </div>
                            <div className="br-node-config-modal__field">
                                <label className="br-node-config-modal__label">Node Label</label>
                                <input
                                    className="br-node-config-modal__input"
                                    type="text"
                                    value={data.label || ''}
                                    onChange={e => patch('label', e.target.value)}
                                    placeholder="Enter node label..."
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="br-node-config-modal__section-title">
                                <AlignLeft className="br-node-config-modal__section-title__icon" />
                                <h4 className="br-node-config-modal__section-title__text">Description</h4>
                            </div>
                            <div className="br-node-config-modal__field">
                                <label className="br-node-config-modal__label">Portal Description / Content</label>
                                <textarea
                                    className="br-node-config-modal__textarea"
                                    rows={4}
                                    value={data.content || ''}
                                    onChange={e => patch('content', e.target.value)}
                                    placeholder="Add a description or narrative notes for this warp station..."
                                />
                            </div>
                        </div>

                        {/* Connection */}
                        <div>
                            <div className="br-node-config-modal__section-title">
                                <Link2 className="br-node-config-modal__section-title__icon" />
                                <h4 className="br-node-config-modal__section-title__text">Connect to Warp</h4>
                            </div>
                            <div className="br-node-config-modal__field">
                                <label className="br-node-config-modal__label">
                                    {isEntrance ? 'Link to Warp Exit' : 'Link to Warp Entrance'}
                                </label>
                                <SearchableSelect
                                    className="br-node-config-modal__clause-select"
                                    value={currentValue}
                                    onChange={handleConnectChange}
                                    options={selectOptions}
                                    placeholder={isEntrance ? 'Select exit warp to connect...' : 'Select entrance warp to connect...'}
                                />
                            </div>

                            <div className="br-node-config-modal__field" style={{ marginTop: '12px' }}>
                                <label className="br-node-config-modal__label">Connection Channel Name (Optional)</label>
                                <input
                                    className="br-node-config-modal__input"
                                    type="text"
                                    value={data.portalChannel || ''}
                                    onChange={e => patch('portalChannel', e.target.value)}
                                    placeholder="e.g. heroine_select_portal..."
                                />
                                <span className="br-node-config-modal__hint" style={{ marginTop: '4px', display: 'block', fontSize: '10px' }}>
                                    Warp nodes with the exact same channel name will automatically connect.
                                </span>
                            </div>
                        </div>

                        {/* Danger zone */}
                        <div className="ecm-danger-zone">
                            <button className="ecm-delete-btn" onClick={handleDelete}>
                                <Trash2 className="br-node-config-modal__icon-base" />
                                Delete Portal Node
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="br-node-config-modal__footer">
                    <button className="br-node-config-modal__btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="br-node-config-modal__btn-save" onClick={onClose}>
                        <Check className="br-node-config-modal__icon-base" /> Done
                    </button>
                </div>
            </div>
        </div>
    );
}
