import React, { useState, useEffect } from 'react';
import NameplateTab from './NameplateTab';
// CHANGED (Phase 8): Removed legacy Sidebar wrapper; render SandboxPanel directly in Sandbox tab
import SandboxPanel from '../SandboxPanel';
import NodesPanel from '../panels/NodesPanel';
import RouteTracingPanel from '../panels/RouteTracingPanel';
import CampaignListPanel from '../panels/CampaignListPanel';
import { useSimulationStore } from 'store';
import './RightSidebar.css';

// CHANGED: Phase 7 — subscribes to isCampaignActive to apply campaign-mode dim class
export default function RightSidebar() {
    const [activePanel, setActivePanel] = useState('Nodes');
    // PRESERVED: per-slice selector per AR-23; AR-08 isolation — reads only isCampaignActive
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

    useEffect(() => {
        const handler = (e) => setActivePanel(e.detail);
        window.addEventListener('switch-right-panel', handler);
        return () => window.removeEventListener('switch-right-panel', handler);
    }, []);

    // CHANGED (Phase 8): 'Legacy Panel' tab renamed to 'Sandbox' — it now exclusively hosts SandboxPanel
    const mockTabs = [
        { id: 'Nodes', label: 'Nodes' },
        { id: 'RouteTracing', label: 'Route Tracing' },
        { id: 'CampaignList', label: 'Campaign List' },
        { id: 'Sandbox', label: 'Sandbox' }
    ];

    return (
        /* CHANGED: Phase 7 — right-sidebar--campaign-mode class dims/disables sidebar during campaign */
        <div className={`right-sidebar${isCampaignActive ? ' right-sidebar--campaign-mode' : ''}`}>
            <div className={`right-sidebar__panel ${activePanel ? 'right-sidebar__panel--open' : ''}`}>
                <div className="right-sidebar__panel-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {activePanel === 'Nodes' && <NodesPanel />}
                    {activePanel === 'RouteTracing' && <RouteTracingPanel />}
                    {activePanel === 'CampaignList' && <CampaignListPanel />}
                    {activePanel === 'Sandbox' && (
                        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                            <SandboxPanel />
                        </div>
                    )}
                </div>
            </div>
            <div className="right-sidebar__rail">
                {mockTabs.map(tab => (
                    <NameplateTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        isActive={activePanel === tab.id}
                        onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
                        leftSide={false}
                    />
                ))}
            </div>
        </div>
    );
}
