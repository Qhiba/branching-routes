import React from 'react';
import { useNarrativeStore, useUIStore } from 'store';
import { SlidersHorizontal, RefreshCw, Info, Tag } from 'lucide-react';
import './RightPanels.css';

export default function FiltersPanel() {
    const chapters = Object.values(useNarrativeStore(state => state.chapter) || {});
    const paths = Object.values(useNarrativeStore(state => state.path) || {});
    const tags = Object.values(useNarrativeStore(state => state.tag) || {});

    const canvasFilterChapterId = useUIStore(state => state.canvasFilterChapterId);
    const canvasFilterPathId = useUIStore(state => state.canvasFilterPathId);
    const canvasFilterTagIds = useUIStore(state => state.canvasFilterTagIds) || [];
    const canvasFilterTagsLogic = useUIStore(state => state.canvasFilterTagsLogic) || 'or';

    const setCanvasFilterChapterId = useUIStore(state => state.setCanvasFilterChapterId);
    const setCanvasFilterPathId = useUIStore(state => state.setCanvasFilterPathId);
    const setCanvasFilterTagIds = useUIStore(state => state.setCanvasFilterTagIds);
    const setCanvasFilterTagsLogic = useUIStore(state => state.setCanvasFilterTagsLogic);

    const toggleTagFilter = (tagId) => {
        const next = canvasFilterTagIds.includes(tagId)
            ? canvasFilterTagIds.filter(id => id !== tagId)
            : [...canvasFilterTagIds, tagId];
        setCanvasFilterTagIds(next);
    };

    const handleReset = () => {
        setCanvasFilterChapterId(null);
        setCanvasFilterPathId(null);
        setCanvasFilterTagIds([]);
        setCanvasFilterTagsLogic('or');
    };

    const hasActiveFilters = canvasFilterChapterId !== null || canvasFilterPathId !== null || canvasFilterTagIds.length > 0;

    return (
        <div className="br-filters-panel">
            <div className="br-filters-panel__header">
                <div className="br-filters-panel__title-row">
                    <SlidersHorizontal size={14} className="br-filters-panel__icon" />
                    <span className="br-filters-panel__title">Canvas Filters</span>
                </div>
                {hasActiveFilters && (
                    <button onClick={handleReset} className="br-filters-panel__reset-btn" title="Reset all filters">
                        <RefreshCw size={12} />
                        Reset
                    </button>
                )}
            </div>

            <div className="br-filters-panel__info">
                <Info size={12} className="br-filters-panel__info-icon" />
                <span className="br-filters-panel__info-text">
                    Active filters dim non-matching nodes and edges on the canvas.
                </span>
            </div>

            <div className="br-filters-panel__section">
                <label className="br-filters-panel__label">Chapter Filter</label>
                <select
                    value={canvasFilterChapterId || ''}
                    onChange={e => setCanvasFilterChapterId(e.target.value || null)}
                    className="br-filters-panel__select"
                >
                    <option value="">Show All Chapters</option>
                    {chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="br-filters-panel__section">
                <label className="br-filters-panel__label">Path Filter</label>
                <select
                    value={canvasFilterPathId || ''}
                    onChange={e => setCanvasFilterPathId(e.target.value || null)}
                    className="br-filters-panel__select"
                >
                    <option value="">Show All Paths</option>
                    {paths.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className="br-filters-panel__section">
                <div className="br-filters-panel__label-row">
                    <label className="br-filters-panel__label">Tag Filters</label>
                    {canvasFilterTagIds.length > 1 && (
                        <div className="br-filters-panel__logic-toggle">
                            <button
                                className={`br-filters-panel__logic-btn ${canvasFilterTagsLogic === 'or' ? 'br-filters-panel__logic-btn--active' : ''}`}
                                onClick={() => setCanvasFilterTagsLogic('or')}
                            >
                                ANY (OR)
                            </button>
                            <button
                                className={`br-filters-panel__logic-btn ${canvasFilterTagsLogic === 'and' ? 'br-filters-panel__logic-btn--active' : ''}`}
                                onClick={() => setCanvasFilterTagsLogic('and')}
                            >
                                ALL (AND)
                            </button>
                        </div>
                    )}
                </div>

                <div className="br-filters-panel__tag-list">
                    {tags.length === 0 ? (
                        <div className="br-filters-panel__empty-tags">
                            No tags defined. Create them in the Left Sidebar ("Tags" tab).
                        </div>
                    ) : (
                        tags.map(t => {
                            const isActive = canvasFilterTagIds.includes(t.id);
                            return (
                                <button
                                    key={t.id}
                                    className={`br-filters-panel__tag-chip ${isActive ? 'br-filters-panel__tag-chip--active' : ''}`}
                                    onClick={() => toggleTagFilter(t.id)}
                                >
                                    <Tag size={10} className="br-filters-panel__tag-icon" />
                                    {t.name}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
