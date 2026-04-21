import React from 'react';
import {
    GitCommit,
    GitPullRequest,
    BoxSelect,
    Flag,
    Activity,
    FolderTree,
    BookOpen,
} from 'lucide-react';

/**
 * GlobalStatusStrip
 *
 * The fixed 28px bottom bar that shows graph coverage counters.
 *
 * In edit mode it displays a read-only summary of all entity counts.
 * In campaign mode it additionally shows live traversal stats and an
 * Overlay toggle button (all via the `campaignStats` prop).
 *
 * This component is a pure display component — it holds no local state.
 *
 * Props:
 *  counts           {object}  Entity counts from narrativeStore:
 *    .common          {number}  — Common nodes
 *    .choice          {number}  — Choice nodes
 *    .ending          {number}  — Ending nodes
 *    .flags           {number}  — Flag entities
 *    .statuses        {number}  — Status entities
 *    .paths           {number}  — Path entities
 *    .chapters        {number}  — Chapter entities
 *  campaignMode     {boolean} True when a campaign is running.
 *  campaignStats    {object|null}  Live campaign coverage (only when campaignMode):
 *    .visitedNodes    {number}
 *    .totalNodes      {number}
 *    .endingsReached  {number}
 *    .totalEndings    {number}
 *    .edgesTraversed  {number}
 *    .totalEdges      {number}
 *    .deadEnds        {number}
 *  overlayOn        {boolean} Whether the traversal/route overlay is active.
 *  onToggleOverlay  {Function} Toggles the traversal overlay.
 */
export default function GlobalStatusStrip({
    counts = {
        common: 0,
        choice: 0,
        ending: 0,
        flags: 0,
        statuses: 0,
        paths: 0,
        chapters: 0,
    },
    campaignMode = false,
    campaignStats = null,
    overlayOn = true,
    onToggleOverlay = () => { },
}) {
    return (
        <div className="global-status-strip">

            {/* Left: static entity counters */}
            <div className="global-status-strip__left">

                {/* Node type counts */}
                <div className="global-status-strip__group">
                    <span className="global-status-strip__item" title="Common Nodes">
                        <GitCommit className="global-status-strip__icon global-status-strip__icon--common" />
                        <strong className="global-status-strip__count">{counts.common}</strong>
                    </span>
                    <span className="global-status-strip__item" title="Choice Nodes">
                        <GitPullRequest className="global-status-strip__icon global-status-strip__icon--choice" />
                        <strong className="global-status-strip__count">{counts.choice}</strong>
                    </span>
                    <span className="global-status-strip__item" title="Ending Nodes">
                        <BoxSelect className="global-status-strip__icon global-status-strip__icon--ending" />
                        <strong className="global-status-strip__count">{counts.ending}</strong>
                    </span>
                </div>

                <div className="global-status-strip__sep" />

                {/* Metadata entity counts */}
                <div className="global-status-strip__group">
                    <span className="global-status-strip__item" title="Flags">
                        <Flag className="global-status-strip__icon global-status-strip__icon--flag" />
                        <span className="global-status-strip__label">Flags:</span>
                        <strong className="global-status-strip__count">{counts.flags}</strong>
                    </span>
                    <span className="global-status-strip__item" title="Statuses">
                        <Activity className="global-status-strip__icon global-status-strip__icon--status" />
                        <span className="global-status-strip__label">Statuses:</span>
                        <strong className="global-status-strip__count">{counts.statuses}</strong>
                    </span>
                    <span className="global-status-strip__item" title="Paths">
                        <FolderTree className="global-status-strip__icon global-status-strip__icon--path" />
                        <span className="global-status-strip__label">Paths:</span>
                        <strong className="global-status-strip__count">{counts.paths}</strong>
                    </span>
                    <span className="global-status-strip__item" title="Chapters">
                        <BookOpen className="global-status-strip__icon global-status-strip__icon--chapter" />
                        <span className="global-status-strip__label">Chapters:</span>
                        <strong className="global-status-strip__count">{counts.chapters}</strong>
                    </span>
                </div>
            </div>

            {/* Right: live campaign stats (campaign mode only) */}
            {campaignMode && campaignStats && (
                <div className="global-status-strip__campaign">
                    <span className="global-status-strip__stat">
                        Nodes: <strong className="global-status-strip__stat-value global-status-strip__stat-value--nodes">
                            {campaignStats.visitedNodes} / {campaignStats.totalNodes}
                        </strong>
                    </span>
                    <span className="global-status-strip__stat">
                        Endings: <strong className="global-status-strip__stat-value global-status-strip__stat-value--endings">
                            {campaignStats.endingsReached} / {campaignStats.totalEndings}
                        </strong>
                    </span>
                    <span className="global-status-strip__stat">
                        Edges: <strong className="global-status-strip__stat-value global-status-strip__stat-value--edges">
                            {campaignStats.edgesTraversed} / {campaignStats.totalEdges}
                        </strong>
                    </span>
                    <span className="global-status-strip__stat">
                        Dead-ends: <strong className="global-status-strip__stat-value global-status-strip__stat-value--dead">
                            {campaignStats.deadEnds}
                        </strong>
                    </span>
                    <button
                        onClick={onToggleOverlay}
                        className="global-status-strip__overlay-btn"
                    >
                        Overlay: {overlayOn ? 'ON' : 'OFF'}
                    </button>
                </div>
            )}

        </div>
    );
}
