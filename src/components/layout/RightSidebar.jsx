import React, { useState, useEffect } from 'react';
import { Search, SquarePen, Route, Play, FlaskConical } from 'lucide-react';
import SideRail from './SideRail';
import SandboxPanel from '../SandboxPanel';
import BrowsePanel from '../panels/BrowsePanel';
import InspectorPanel from '../panels/InspectorPanel';
import RouteTracingPanel from '../panels/RouteTracingPanel';
import CampaignListPanel from '../panels/CampaignListPanel';
import { useSimulationStore, useUIStore } from 'store';

// CHANGED (Redesign Step 4): right = nodes. Rotated NameplateTab tabs replaced by the shared SideRail.
// CHANGED (Redesign Step 6): Nodes + Filters tabs merged into one Browse panel (search + filters).
// ADDED (Redesign Step 7): Inspector tab; canvas clicks open it via the switch-right-panel event.
// Campaign tabs exist only when the Campaign feature switch is on (AR-36). Dims during campaign mode.
const BASE_ITEMS = [
    { id: 'Browse', label: 'Browse', title: 'Find nodes', icon: Search, render: () => <BrowsePanel /> },
    // ADDED (Redesign Step 7): hybrid editing — quick fields here, full modal for options/conditions
    { id: 'Inspector', label: 'Inspect', title: 'Inspector', icon: SquarePen, render: () => <InspectorPanel /> },
];

const CAMPAIGN_ITEMS = [
    { id: 'RouteTracing', label: 'Routes', title: 'Route tracing', icon: Route, render: () => <RouteTracingPanel /> },
    { id: 'CampaignList', label: 'Campaigns', icon: Play, render: () => <CampaignListPanel /> },
    { id: 'Sandbox', label: 'Sandbox', icon: FlaskConical, render: () => <SandboxPanel /> },
];

export default function RightSidebar() {
    const [activePanel, setActivePanel] = useState(null);
    // PRESERVED: per-slice selector per AR-23; AR-08 isolation — reads only isCampaignActive
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);
    // ADDED (Redesign Step 1): Campaign/Route Tracing/Sandbox tabs only exist when the feature is on
    const featureCampaign = useUIStore(s => s.featureCampaign);

    // Other components can open a panel: window.dispatchEvent(new CustomEvent('switch-right-panel', { detail: 'Nodes' }))
    useEffect(() => {
        const handler = (e) => setActivePanel(e.detail);
        window.addEventListener('switch-right-panel', handler);
        return () => window.removeEventListener('switch-right-panel', handler);
    }, []);

    const items = featureCampaign ? [...BASE_ITEMS, ...CAMPAIGN_ITEMS] : BASE_ITEMS;

    return (
        <SideRail
            side="right"
            label="Nodes"
            items={items}
            activeId={items.some(i => i.id === activePanel) ? activePanel : null}
            onChange={setActivePanel}
            dimmed={isCampaignActive}
        />
    );
}
