/**
 * Ground.js - Ground reference component
 * 
 * The reference node (0V) for circuit analysis.
 * Every circuit must have exactly one ground.
 */

import { Component, Terminal } from '../core/Component.js';

export class Ground extends Component {
    constructor(x = 0, y = 0) {
        super('ground', x, y);

        // Single terminal at top
        this.terminals = [
            new Terminal(this, 'ref', 0, -15)
        ];

        this.properties = {};
    }

    static get displayName() {
        return 'Ground';
    }

    static get icon() {
        return `
            <line x1="16" y1="4" x2="16" y2="10" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="10" x2="24" y2="10" stroke="currentColor" stroke-width="2"/>
            <line x1="10" y1="14" x2="22" y2="14" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'G';
    }

    static getDefaultProperties() {
        return {};
    }

    static getPropertyDefinitions() {
        return [];
    }

    renderBody() {
        return `
            <!-- Vertical line -->
            <line x1="0" y1="-15" x2="0" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Ground symbol (3 horizontal lines) -->
            <line class="component-body" x1="-12" y1="0" x2="12" y2="0" stroke-width="2"/>
            <line class="component-body" x1="-8" y1="5" x2="8" y2="5" stroke-width="2"/>
            <line class="component-body" x1="-4" y1="10" x2="4" y2="10" stroke-width="2"/>
        `;
    }

    getValueString() {
        return '0V';
    }

    getLabel() {
        return 'GND';
    }

    // Ground doesn't contribute to MNA matrix, it's the reference
    getStamp(nodeMap, frequency = 0) {
        return { G: [], z: [] };
    }

    getBounds() {
        return {
            x: this.x - 15,
            y: this.y - 20,
            width: 30,
            height: 35
        };
    }
}
