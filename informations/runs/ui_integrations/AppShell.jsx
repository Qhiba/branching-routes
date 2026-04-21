import React, { useState } from 'react';
import PrimaryTopBar from './PrimaryTopBar';
import FloatingMiddleBar from './FloatingMiddleBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import NodeConfigModal from './NodeConfigModal';
import GlobalStatusStrip from './GlobalStatusStrip';
import CreationModal from './CreationModal';
import { Zap } from 'lucide-react';

/**
 * AppShell — Prototype Orchestrator
 *
 * This thin shell wires all the extracted UI components together using local
 * React state for demo/review purposes ONLY. It does NOT use Zustand stores.
 *
 * When integrating into the real app:
 *  1. Delete this file (or keep it for Storybook/dev purposes).
 *  2. Replace every `useState` in this file with the corresponding Zustand
 *     selector / action listed in each component's JSDoc header.
 *  3. The actual App.jsx layout (TopBar + GraphCanvas + Sidebar + StatusStrip)
 *     already exists — bolt the new components on top of / alongside the
 *     existing pieces one at a time.
 *
 * See each component's .md phase plan document for detailed integration notes.
 */
export default function AppShell() {
    // ---- Project meta ----
    const [projectName, setProjectName] = useState('The Enchanted Forest');

    // ---- Modals ----
    const [creationModalType, setCreationModalType] = useState(null); // 'Flags'|'Status'|'Chapter'|'Paths'|null
    const [nodeConfigType, setNodeConfigType] = useState(null); // 'Common'|'Choice'|'Ending'|null

    // ---- Left Sidebar ----
    const [activeLeftPanel, setActiveLeftPanel] = useState('Flags');

    // ---- Right Sidebar ----
    const [activeRightPanel, setActiveRightPanel] = useState('Nodes');
    const [activeNodeTab, setActiveNodeTab] = useState('Common');
    const [routeResults, setRouteResults] = useState(null);

    // ---- Campaign / Simulation ----
    const [campaignMode, setCampaignMode] = useState(false);
    const [campaigns, setCampaigns] = useState([
        { id: '1', name: 'Default' },
        { id: '2', name: 'test 1' },
        { id: '3', name: 'test 2' },
    ]);
    const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0].id);
    const [activeCampaignId, setActiveCampaignId] = useState(null);

    // ---- Canvas controls ----
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [clustersEnabled, setClustersEnabled] = useState(false);
    const [overlayOn, setOverlayOn] = useState(true);

    // ---- Derived ----
    const activeCampaignName =
        campaigns.find((c) => c.id === activeCampaignId)?.name || '';

    // ---- Mock data (stand-in for Zustand stores) ----
    const mockFlags = [
        { id: '1', name: 'has_lantern' },
        { id: '2', name: 'met_wizard' },
        { id: '3', name: 'door_unlocked' },
    ];
    const mockStatuses = [
        { id: '1', name: 'Health' },
        { id: '2', name: 'Mana' },
        { id: '3', name: 'Gold' },
    ];
    const mockChapters = [
        { id: '1', name: 'Chapter 1: The Ruins' },
        { id: '2', name: 'Chapter 2: Deep Woods' },
    ];
    const mockPaths = [
        { id: '1', name: 'True Ending Route' },
        { id: '2', name: 'Bad Ending Route' },
    ];
    const mockNodes = [
        { id: '1', name: 'Forest Entrance', type: 'Common' },
        { id: '2', name: 'Crossroads', type: 'Choice' },
        { id: '3', name: 'Crystal Chamber', type: 'Ending' },
    ];

    // ---- Campaign handlers ----
    const handleStartCampaign = () => {
        setActiveCampaignId(selectedCampaignId);
        setCampaignMode(true);
        setActiveRightPanel(null);
    };
    const handleExitCampaign = () => {
        setCampaignMode(false);
        setActiveCampaignId(null);
    };

    // ---- Route Tracing (simulated async) ----
    const handleRunTrace = () =>
        new Promise((resolve) => {
            setTimeout(() => {
                setRouteResults([
                    { id: 1, steps: 5, name: 'Optimal Path (Direct)' },
                    { id: 2, steps: 8, name: 'Alternate Route (Safe)' },
                    { id: 3, steps: 12, name: 'Exploration Route' },
                ]);
                resolve();
            }, 1200);
        });

    // ---- Canvas node quick-add (dispatches DOM event per AR-19) ----
    const dispatchAddNode = (type) =>
        window.dispatchEvent(new CustomEvent('canvas-add-node', { detail: { type } }));

    // ---- Entity CRUD stubs ----
    const handleConfirmCreation = (data) => {
        console.log('[AppShell] Create entity:', creationModalType, data);
        setCreationModalType(null);
    };

    const handleEditEntity = (type, id) => {
        console.log('[AppShell] Edit entity:', type, id);
    };

    const handleDeleteEntity = (type, id) => {
        console.log('[AppShell] Delete entity:', type, id);
    };

    const handleSaveNode = (data) => {
        console.log('[AppShell] Save node:', nodeConfigType, data);
        setNodeConfigType(null);
    };

    // ---- Campaign CRUD stubs ----
    const handleAddCampaign = (name) => {
        const id = String(campaigns.length + 1);
        setCampaigns([...campaigns, { id, name }]);
    };
    const handleDeleteCampaign = (id) => {
        setCampaigns(campaigns.filter((c) => c.id !== id));
    };

    // ---- Status strip counts (mocked) ----
    const counts = {
        common: 24,
        choice: 12,
        ending: 3,
        flags: 8,
        statuses: 4,
        paths: 2,
        chapters: 1,
    };
    const campaignStats = campaignMode
        ? {
            visitedNodes: 1, totalNodes: 9, endingsReached: 0, totalEndings: 3,
            edgesTraversed: 0, totalEdges: 8, deadEnds: 0
        }
        : null;

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-200">

            {/* ── Modals (portal-style, rendered before layout) ── */}
            <CreationModal
                entityType={creationModalType}
                onClose={() => setCreationModalType(null)}
                onConfirm={handleConfirmCreation}
            />
            <NodeConfigModal
                nodeType={nodeConfigType}
                onClose={() => setNodeConfigType(null)}
                onSave={handleSaveNode}
                chapters={mockChapters}
                paths={mockPaths}
                flags={mockFlags}
                statuses={mockStatuses}
            />

            {/* ── Top bar ── */}
            <PrimaryTopBar
                projectName={projectName}
                onProjectNameChange={setProjectName}
                snapEnabled={snapEnabled}
                onSnapToggle={() => setSnapEnabled(!snapEnabled)}
                clustersEnabled={clustersEnabled}
                onClustersToggle={() => setClustersEnabled(!clustersEnabled)}
                onTidyLayout={() => console.log('[AppShell] Tidy layout')}
                onNew={() => console.log('[AppShell] New project')}
                onImport={() => console.log('[AppShell] Import')}
                onExport={() => console.log('[AppShell] Export')}
            />

            {/* ── Middle row: sidebars + canvas ── */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left sidebar */}
                <LeftSidebar
                    activePanel={activeLeftPanel}
                    onPanelChange={setActiveLeftPanel}
                    campaignMode={campaignMode}
                    flags={mockFlags}
                    statuses={mockStatuses}
                    chapters={mockChapters}
                    paths={mockPaths}
                    onCreateEntity={(type) => setCreationModalType(type)}
                    onEditEntity={handleEditEntity}
                    onDeleteEntity={handleDeleteEntity}
                />

                {/* Canvas area (placeholder — replaced by <GraphCanvas /> in the real app) */}
                <div className="flex-1 relative overflow-hidden bg-[#070A11] flex">
                    <FloatingMiddleBar
                        campaignMode={campaignMode}
                        activeCampaignName={activeCampaignName}
                        campaigns={campaigns}
                        selectedCampaignId={selectedCampaignId}
                        onCampaignSelect={setSelectedCampaignId}
                        onStartCampaign={handleStartCampaign}
                        onExitCampaign={handleExitCampaign}
                        onUndo={() => console.log('[AppShell] Undo')}
                        onReset={() => console.log('[AppShell] Reset')}
                        onAddCommonNode={() => dispatchAddNode('common')}
                        onAddChoiceNode={() => dispatchAddNode('choice')}
                        onAddEndingNode={() => dispatchAddNode('ending')}
                    />

                    {/* Campaign mode banner */}
                    {campaignMode && (
                        <div className="absolute top-0 left-0 w-full h-8 bg-[#2A6EBB]/90 backdrop-blur border-b border-[#3b82f6] text-sky-100 text-xs font-medium flex items-center justify-center shadow-md z-30 animate-in slide-in-from-top-4">
                            <Zap className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" />
                            <span className="font-bold text-white mr-1">Campaign Active</span> — click a highlighted node to advance
                        </div>
                    )}

                    {/* Canvas dot-grid background */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                            opacity: 0.3,
                        }}
                    />
                </div>

                {/* Right sidebar */}
                <RightSidebar
                    activePanel={activeRightPanel}
                    onPanelChange={setActiveRightPanel}
                    campaignMode={campaignMode}
                    nodes={mockNodes}
                    activeNodeTab={activeNodeTab}
                    onNodeTabChange={setActiveNodeTab}
                    onEditNode={(id) => setNodeConfigType(mockNodes.find(n => n.id === id)?.type ?? 'Common')}
                    onDeleteNode={(id) => console.log('[AppShell] Delete node', id)}
                    routeResults={routeResults}
                    onRunTrace={handleRunTrace}
                    onClearTrace={() => setRouteResults(null)}
                    campaigns={campaigns}
                    onAddCampaign={handleAddCampaign}
                    onDeleteCampaign={handleDeleteCampaign}
                    onEditCampaignName={(id) => console.log('[AppShell] Edit campaign name', id)}
                />

            </div>

            {/* ── Bottom status strip ── */}
            <GlobalStatusStrip
                counts={counts}
                campaignMode={campaignMode}
                campaignStats={campaignStats}
                overlayOn={overlayOn}
                onToggleOverlay={() => setOverlayOn(!overlayOn)}
            />

        </div>
    );
}
