import React, { useMemo } from 'react';
import { useSimulationStore, useNarrativeStore } from 'store';
import { GitCommit, GitPullRequest, BoxSelect, Flag, Activity, FolderTree, BookOpen } from 'lucide-react';
import { detectDeadEnds } from 'utils';
import './StatusStrip.css';

export default function StatusStrip() {
  const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
  const seenCount = useSimulationStore(s => s.seenNodeIds.length);
  const traversedCount = useSimulationStore(s => s.traversedEdgeIds.length);
  // FIX 2: showTraversalOverlay and toggleTraversalOverlay removed from StatusStrip;
  //         overlay toggle moved to FloatingMiddleBar campaign pill
  const seenNodeIds = useSimulationStore(s => s.seenNodeIds);
  const activeNodeId = useSimulationStore(s => s.activeNodeId);

  const common = useNarrativeStore(s => s.common);
  const choice = useNarrativeStore(s => s.choice);
  const ending = useNarrativeStore(s => s.ending);
  const edges = useNarrativeStore(s => s.edges);

  // CHANGED: Phase 7 — fixed field names: s.flags→s.flag, s.statuses→s.status, etc.
  // CONFLICT: prior code used s.flags/s.statuses/s.paths/s.chapters which don't exist in narrativeStore;
  //           correct fields are flag/status/path/chapter (singular) per AR-05
  const flag = useNarrativeStore(s => s.flag);
  const status = useNarrativeStore(s => s.status);
  const path = useNarrativeStore(s => s.path);
  const chapter = useNarrativeStore(s => s.chapter);

  const commonCount = Object.keys(common).length;
  const choiceCount = Object.keys(choice).length;
  const endingCount = Object.keys(ending).length;

  // CHANGED: variable names updated to match corrected selectors above
  const flagsCount = Object.keys(flag ?? {}).length;
  const statusesCount = Object.keys(status ?? {}).length;
  const pathsCount = Object.keys(path ?? {}).length;
  const chaptersCount = Object.keys(chapter ?? {}).length;

  const totalNodeCount = commonCount + choiceCount + endingCount;
  const totalEdgeCount = edges.length;

  const deadEndCount = useMemo(() =>
    detectDeadEnds({ common, choice, ending, edges }).length,
    [common, choice, ending, edges]
  );

  const endingsReachedCount = useMemo(() => {
    const seenEndings = seenNodeIds.filter(id => !!ending[id]).length;
    const activeIsEnding = isCampaignActive && !!ending[activeNodeId];
    return seenEndings + (activeIsEnding ? 1 : 0);
  }, [seenNodeIds, ending, isCampaignActive, activeNodeId]);

  const visitedCount = seenCount + (isCampaignActive ? 1 : 0);

  return (
    <div className="ui-v2-status-strip">
      <div className="ui-v2-status-strip-global">
        <div className="ui-v2-status-strip-group">
          <span className="ui-v2-status-item" title="Common Nodes">
            <GitCommit className="w-3.5 h-3.5 status-icon--emerald" />
            <strong>{commonCount}</strong>
          </span>
          <span className="ui-v2-status-item" title="Choice Nodes">
            <GitPullRequest className="w-3.5 h-3.5 status-icon--blue" />
            <strong>{choiceCount}</strong>
          </span>
          <span className="ui-v2-status-item" title="Ending Nodes">
            <BoxSelect className="w-3.5 h-3.5 status-icon--amber" />
            <strong>{endingCount}</strong>
          </span>
        </div>

        <div className="ui-v2-status-divider"></div>

        <div className="ui-v2-status-strip-group">
          <span className="ui-v2-status-item" title="Flags">
            <Flag className="w-3.5 h-3.5 status-icon--purple" /> Flags: <strong>{flagsCount}</strong>
          </span>
          <span className="ui-v2-status-item" title="Statuses">
            <Activity className="w-3.5 h-3.5 status-icon--rose" /> Statuses: <strong>{statusesCount}</strong>
          </span>
          <span className="ui-v2-status-item" title="Paths">
            <FolderTree className="w-3.5 h-3.5 status-icon--cyan" /> Paths: <strong>{pathsCount}</strong>
          </span>
          <span className="ui-v2-status-item" title="Chapters">
            <BookOpen className="w-3.5 h-3.5 status-icon--indigo" /> Chapters: <strong>{chaptersCount}</strong>
          </span>
        </div>
      </div>

      {isCampaignActive && (
        <div className="ui-v2-status-strip-campaign">
          <span>Nodes: <strong className="campaign-count--nodes">{visitedCount} / {totalNodeCount}</strong></span>
          <span>Endings: <strong className="campaign-count--endings">{endingsReachedCount} / {endingCount}</strong></span>
          <span>Edges: <strong className="campaign-count--edges">{traversedCount} / {totalEdgeCount}</strong></span>
          <span>Dead-ends: <strong className="campaign-count--deadends">{deadEndCount}</strong></span>
        </div>
      )}
    </div>
  );
}
