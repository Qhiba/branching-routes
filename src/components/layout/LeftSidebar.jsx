import React, { useState } from 'react';
import NameplateTab from './NameplateTab';
import FlagManager from '../FlagManager';
import StatusManager from '../StatusManager';
import PathChapterManager from '../PathChapterManager';
import { useSimulationStore } from 'store';
import './LeftSidebar.css';

// CHANGED: Added dynamic rendering bindings for Phase 2 data managers (Flags, Status, Chapters, Paths)
// CHANGED: Phase 7 — subscribes to isCampaignActive to apply campaign-mode dim class
export default function LeftSidebar() {
    const [activePanel, setActivePanel] = useState(null);
    // PRESERVED: per-slice selector per AR-23; AR-08 isolation — reads only isCampaignActive
    const isCampaignActive = useSimulationStore(s => s.isCampaignActive);

    const mockTabs = [
        { id: 'Flags', label: 'Flags' },
        { id: 'Status', label: 'Status' },
        { id: 'Chapter', label: 'Chapter' },
        { id: 'Paths', label: 'Paths' },
        { id: 'CommonType', label: 'Common Types' },
        { id: 'EndingType', label: 'Ending Types' }
    ];

    return (
        /* CHANGED: Phase 7 — br-left-sidebar--campaign-mode class dims/disables sidebar during campaign */
        <div className={`br-left-sidebar${isCampaignActive ? ' br-left-sidebar--campaign-mode' : ''}`}>
            <div className="br-left-sidebar__rail">
                {mockTabs.map(tab => (
                    <NameplateTab
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        isActive={activePanel === tab.id}
                        onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
                        leftSide={true}
                    />
                ))}
            </div>
            <div className={`br-left-sidebar__panel ${activePanel ? 'br-left-sidebar__panel--open' : ''}`}>
                <div className="br-left-sidebar__panel-content">
                    {activePanel === 'Flags' && <FlagManager />}
                    {activePanel === 'Status' && <StatusManager />}
                    {activePanel === 'Chapter' && <PathChapterManager filterType="chapter" />}
                    {activePanel === 'Paths' && <PathChapterManager filterType="path" />}
                    {activePanel === 'CommonType' && <PathChapterManager filterType="commonType" />}
                    {activePanel === 'EndingType' && <PathChapterManager filterType="endingType" />}
                </div>
            </div>
        </div>
    );
}
