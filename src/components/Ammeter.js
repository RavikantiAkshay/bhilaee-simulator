/**
 * Ammeter.js - Ammeter component
 * 
 * An ideal ammeter that measures current flowing through it.
 * Modeled as a 0V DC voltage source.
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Ammeter extends Component {
    constructor(x = 0, y = 0) {
        super('ammeter', x, y);

        // Two terminals: positive (input) and negative (output)
        this.terminals = [
            new Terminal(this, 'positive', -30, 0),
            new Terminal(this, 'negative', 30, 0)
        ];

        this.properties = {
            current: 0 // Read-only value updated by simulation
        };
    }

    static get displayName() {
        return 'Ammeter';
    }

    static get icon() {
        return `
            <circle cx="16" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="16" y="16" text-anchor="middle" font-size="10" fill="currentColor" font-family="sans-serif">A</text>
            <line x1="0" y1="12" x2="8" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="24" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'A'; // Defining 'A' as shortcut
    }

    static getDefaultProperties() {
        return { current: 0 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'current', label: 'Current', type: 'number', unit: 'A', readOnly: true }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="15" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Circle -->
            <circle class="component-body" cx="0" cy="0" r="15" stroke-width="2"/>
            <!-- 'A' Symbol -->
            <text x="0" y="5" text-anchor="middle" font-size="20" fill="var(--component-stroke)" font-family="sans-serif">A</text>
        `;
    }

    getValueString() {
        return formatValue(this.properties.current, 'A');
    }

    getLabel() {
        return 'A';
    }

    /**
     * Get MNA stamp for Ammeter
     * Modeled as a 0V voltage source.
     * V+ - V- = 0
     * Solving for branch current I gives the reading.
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id); // positive
        const n2 = nodeMap.get(this.terminals[1].id); // negative

        return {
            G: [],
            z: [],
            voltageSource: {
                positiveNode: n1,
                negativeNode: n2,
                voltage: 0,
                type: 'dc',
                frequency: 0,
                phase: 0
            }
        };
    }

    /**
     * Setter for simulation to update the reading
     * @param {number} current 
     */
    setCurrent(current) {
        this.properties.current = current;
        // Don't trigger full re-render for value update to be efficient
        if (this.element) {
            const valueText = this.element.querySelector('.component-value');
            if (valueText) {
                valueText.textContent = this.getValueString();
            }
        }
    }

    /**
     * Serialize
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            properties: { ...this.properties }
        };
    }

    /**
     * Deserialize
     */
    deserialize(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.properties = { ...data.properties, current: 0 }; // Reset reading on load
    }
}
