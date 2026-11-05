import React, { useState } from 'react';
import { Flag, Activity, Gem, Tag, BookOpen, Signpost, Shapes } from 'lucide-react';
import SideRail from './SideRail';
import FlagManager from '../FlagManager';
import StatusManager from '../StatusManager';
import PathChapterManager from '../PathChapterManager';
import CollectibleManager from '../CollectibleManager';
import { useSimulationStore } from 'store';

// CHANGED (Redesign Step 4): left = project data. Rotated NameplateTab tabs replaced by the shared SideRail
// (icon + label rail, docked panel with a titled header). Collectibles panel added; Common Types and Ending Types
// merged into one "Types" panel. Dims during campaign mode (AR-08 read-only authoring tools).

function TypesPanel() {
    return (
        <div className="br-siderail__stack">
            <section aria-labelledby="br-types-common">
                <h3 id="br-types-common" className="br-siderail__stack-title">Common node types</h3>
                <PathChapterManager filterType="commonType" />
            </section>
            <section aria-labelledby="br-types-ending">
                <h3 id="br-types-ending" className="br-siderail__stack-title">Ending types</h3>
                <PathChapterManager filterType="endingType" />
            </section>
        </div>
    );
}

const ITEMS = [
    { id: 'Flags', label: 'Flags', icon: Flag, render: () => <FlagManager /> },
    { id: 'Status', label: 'Status', title: 'Statuses', icon: Activity, render: () => <StatusManager /> },
    { id: 'Collectibles', label: 'Collectibles', icon: Gem, render: () => <CollectibleManager /> },
    { id: 'Tags', label: 'Tags', icon: Tag, render: () => <PathChapterManager filterType="tag" /> },
    { id: 'Chapter', label: 'Chapters', icon: BookOpen, render: () => <PathChapterManager filterType="chapter" /> },
    { id: 'Paths', label: 'Paths', icon: Signpost, render: () => <PathChapterManager filterType="path" /> },
    { id: 'Types', label: 'Types', title: 'Node types', icon: Shapes, render: () => <TypesPanel /> },
];

export default function LeftSidebar() {
    const [activePanel, setActivePanel] = useState(null);
    // PRESERVED: per-slice selector per AR-23; AR-08 isolation — reads only isCampaignActive
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

    return (
        <SideRail
            side="left"
            label="Project data"
            items={ITEMS}
            activeId={activePanel}
            onChange={setActivePanel}
            dimmed={isCampaignActive}
        />
    );
}
