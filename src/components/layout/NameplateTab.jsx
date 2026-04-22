import React from 'react';
import './NameplateTab.css';

export default function NameplateTab({ id, label, isActive, onClick, leftSide = true }) {
    const sideClass = leftSide ? 'nameplate-tab--left' : 'nameplate-tab--right';
    const activeClass = isActive ? 'nameplate-tab--active' : '';

    return (
        <button
            className={`nameplate-tab ${sideClass} ${activeClass}`}
            onClick={onClick}
        >
            <span className="nameplate-tab__text">
                {label}
            </span>
        </button>
    );
}
