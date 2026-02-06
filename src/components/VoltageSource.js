/**
 * VoltageSource.js - Voltage source component
 * 
 * An ideal voltage source that maintains a constant voltage (DC)
 * or sinusoidal voltage (AC) between its terminals.
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class VoltageSource extends Component {
    constructor(x = 0, y = 0) {
        super('voltage_source', x, y);

        // Two terminals: positive (top) and negative (bottom)
        this.terminals = [
            new Terminal(this, 'positive', 0, -30),
            new Terminal(this, 'negative', 0, 30)
        ];

        // Default: 5V DC
        this.properties = {
            voltage: 5,
            type: 'dc',        // 'dc' or 'ac'
            frequency: 50,     // Hz (for AC)
            phase: 0           // degrees (for AC)
        };
    }

    static get displayName() {
        return 'Voltage Source';
    }

    static get icon() {
        return `
            <circle cx="16" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="16" y1="6" x2="16" y2="10" stroke="currentColor" stroke-width="2"/>
            <line x1="14" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="2"/>
            <line x1="14" y1="16" x2="18" y2="16" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'V';
    }

    static getDefaultProperties() {
        return { voltage: 5, type: 'dc', frequency: 50, phase: 0 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'voltage', label: 'Voltage', type: 'number', unit: 'V' },
            { name: 'type', label: 'Type', type: 'select', options: ['dc', 'ac'] },
            { name: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz', condition: 'type === "ac"' },
            { name: 'phase', label: 'Phase', type: 'number', unit: '°', condition: 'type === "ac"' }
        ];
    }

    renderBody() {
        const isAC = this.properties.type === 'ac';

        return `
            <!-- Leads -->
            <line x1="0" y1="-30" x2="0" y2="-15" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="0" y1="15" x2="0" y2="30" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Circle -->
            <circle class="component-body" cx="0" cy="0" r="15"/>
            ${isAC ? `
                <!-- AC sine wave symbol -->
                <path d="M-8 0 Q-4 -6, 0 0 Q4 6, 8 0" fill="none" stroke="var(--component-stroke)" stroke-width="1.5"/>
            ` : `
                <!-- DC +/- symbols -->
                <line x1="-4" y1="-5" x2="4" y2="-5" stroke="var(--component-stroke)" stroke-width="2"/>
                <line x1="0" y1="-9" x2="0" y2="-1" stroke="var(--component-stroke)" stroke-width="2"/>
                <line x1="-4" y1="5" x2="4" y2="5" stroke="var(--component-stroke)" stroke-width="2"/>
            `}
        `;
    }

    getValueString() {
        const v = formatValue(this.properties.voltage, 'V');
        return this.properties.type === 'ac'
            ? `${v} ${this.properties.frequency}Hz`
            : v;
    }

    getLabel() {
        return this.properties.type === 'ac' ? 'VAC' : 'VDC';
    }

    /**
     * Get MNA stamp for voltage source
     * Voltage sources require an additional row/column in MNA (for branch current)
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id); // positive
        const n2 = nodeMap.get(this.terminals[1].id); // negative
        const V = this.properties.voltage;

        // Voltage source uses Modified Nodal Analysis
        // Adds extra equation: V+ - V- = V
        // The voltage source stamp is handled specially by the solver
        return {
            G: [],
            z: [],
            voltageSource: {
                positiveNode: n1,
                negativeNode: n2,
                voltage: V,
                type: this.properties.type,
                frequency: this.properties.frequency,
                phase: this.properties.phase
            }
        };
    }

    /**
     * Get instantaneous voltage at time t (for transient analysis)
     * @param {number} t - Time in seconds
     * @returns {number} Voltage
     */
    getVoltageAt(t) {
        if (this.properties.type === 'dc') {
            return this.properties.voltage;
        } else {
            // AC: V(t) = Vm * sin(2πft + φ)
            const omega = 2 * Math.PI * this.properties.frequency;
            const phi = this.properties.phase * Math.PI / 180;
            return this.properties.voltage * Math.sin(omega * t + phi);
        }
    }

    getBounds() {
        return {
            x: this.x - 20,
            y: this.y - 35,
            width: 40,
            height: 70
        };
    }
}
