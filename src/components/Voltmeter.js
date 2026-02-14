/**
 * Voltmeter.js - Voltmeter component
 * 
 * Measures voltage difference between two points.
 * Modeled as a very high resistance (100M Ohm) to approximate an ideal voltmeter
 * while avoiding floating node issues in MNA.
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Voltmeter extends Component {
    constructor(x = 0, y = 0) {
        super('voltmeter', x, y);

        // Two terminals: positive (red) and negative (black)
        this.terminals = [
            new Terminal(this, 'positive', -30, 0),
            new Terminal(this, 'negative', 30, 0)
        ];

        this.properties = {
            voltage: 0 // Read-only value updated by simulation
        };
    }

    static get displayName() {
        return 'Voltmeter';
    }

    static get icon() {
        return `
            <circle cx="16" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="16" y="16" text-anchor="middle" font-size="10" fill="currentColor" font-family="sans-serif">V</text>
            <line x1="0" y1="12" x2="8" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="24" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'M'; // 'V' is taken by Voltage Source, using 'M' for Meter (or could use Shift+V)
    }

    static getDefaultProperties() {
        return { voltage: 0 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'voltage', label: 'Voltage', type: 'number', unit: 'V', readOnly: true }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="15" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            
            <!-- Polarity indicators -->
            <text x="-22" y="-5" text-anchor="middle" font-size="10" fill="var(--component-stroke)" font-family="sans-serif">+</text>
            <text x="22" y="-5" text-anchor="middle" font-size="10" fill="var(--component-stroke)" font-family="sans-serif">-</text>

            <!-- Circle -->
            <circle class="component-body" cx="0" cy="0" r="15" stroke-width="2"/>
            
            <!-- 'V' Symbol -->
            <text x="0" y="5" text-anchor="middle" font-size="20" fill="var(--component-stroke)" font-family="sans-serif">V</text>
            
            <!-- Reading Display -->
            <text class="component-value" x="0" y="28" text-anchor="middle" font-size="10" fill="var(--component-text)">${this.getValueString()}</text>
        `;
    }

    getValueString() {
        return formatValue(this.properties.voltage, 'V');
    }

    getLabel() {
        return 'V';
    }

    /**
     * Get MNA stamp for Voltmeter
     * Modeled as a large resistor (100M Ohm)
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id); // positive
        const n2 = nodeMap.get(this.terminals[1].id); // negative

        const R = 1e8; // 100M Ohm
        const g = 1 / R;

        return {
            G: [
                { row: n1, col: n1, value: g },
                { row: n1, col: n2, value: -g },
                { row: n2, col: n1, value: -g },
                { row: n2, col: n2, value: g }
            ],
            z: [], // No impedance in DC
            voltageSource: null
        };
    }

    /**
     * Setter for simulation to update the reading
     * @param {number} voltage 
     */
    setVoltage(voltage) {
        this.properties.voltage = voltage;
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
        this.properties = { ...data.properties, voltage: 0 }; // Reset reading
    }
}
