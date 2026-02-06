/**
 * Resistor.js - Resistor component
 * 
 * A two-terminal passive component with resistance.
 * V = I * R (Ohm's Law)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Resistor extends Component {
    constructor(x = 0, y = 0) {
        super('resistor', x, y);

        // Two terminals: left and right
        this.terminals = [
            new Terminal(this, 'left', -30, 0),
            new Terminal(this, 'right', 30, 0)
        ];

        // Default resistance: 1kΩ
        this.properties = {
            resistance: 1000
        };
    }

    static get displayName() {
        return 'Resistor';
    }

    static get icon() {
        return `
            <line x1="0" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2"/>
            <path d="M6 12 L8 6 L12 18 L16 6 L20 18 L24 6 L26 12" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="26" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'R';
    }

    static getDefaultProperties() {
        return { resistance: 1000 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'resistance', label: 'Resistance', type: 'number', unit: 'Ω', min: 0.001 }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="15" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Zigzag resistor symbol -->
            <path class="component-body" 
                  d="M-15 0 L-12 -6 L-6 6 L0 -6 L6 6 L12 -6 L15 0" 
                  fill="none" stroke-width="2"/>
        `;
    }

    getValueString() {
        return formatValue(this.properties.resistance, 'Ω');
    }

    /**
     * Get MNA stamp for resistor
     * Conductance G = 1/R between its two nodes
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id);
        const n2 = nodeMap.get(this.terminals[1].id);
        const G = 1 / this.properties.resistance;

        // Stamp format: { row, col, value }
        const stamps = [];

        if (n1 !== 0) {
            stamps.push({ row: n1, col: n1, value: G });
            if (n2 !== 0) stamps.push({ row: n1, col: n2, value: -G });
        }
        if (n2 !== 0) {
            stamps.push({ row: n2, col: n2, value: G });
            if (n1 !== 0) stamps.push({ row: n2, col: n1, value: -G });
        }

        return { G: stamps, z: [] };
    }

    getBounds() {
        return {
            x: this.x - 35,
            y: this.y - 15,
            width: 70,
            height: 30
        };
    }
}
