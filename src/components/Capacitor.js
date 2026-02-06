/**
 * Capacitor.js - Capacitor component
 * 
 * A two-terminal passive component that stores charge.
 * I = C * dV/dt
 * Impedance: Z = 1/(jωC)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Capacitor extends Component {
    constructor(x = 0, y = 0) {
        super('capacitor', x, y);

        // Two terminals
        this.terminals = [
            new Terminal(this, 'left', -30, 0),
            new Terminal(this, 'right', 30, 0)
        ];

        // Default capacitance: 1µF
        this.properties = {
            capacitance: 1e-6
        };

        // State for transient analysis
        this.state = {
            voltage: 0,
            current: 0
        };
    }

    static get displayName() {
        return 'Capacitor';
    }

    static get icon() {
        return `
            <line x1="0" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'C';
    }

    static getDefaultProperties() {
        return { capacitance: 1e-6 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'capacitance', label: 'Capacitance', type: 'number', unit: 'F', min: 1e-15 }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-5" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="5" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Capacitor plates -->
            <line class="component-body" x1="-5" y1="-10" x2="-5" y2="10" stroke-width="2"/>
            <line class="component-body" x1="5" y1="-10" x2="5" y2="10" stroke-width="2"/>
        `;
    }

    getValueString() {
        return formatValue(this.properties.capacitance, 'F');
    }

    /**
     * Get MNA stamp for capacitor
     * For AC analysis: Y = jωC
     * For DC: open circuit (infinite impedance)
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id);
        const n2 = nodeMap.get(this.terminals[1].id);
        const C = this.properties.capacitance;

        const stamps = [];

        if (frequency === 0) {
            // DC analysis: capacitor is open circuit
            return { G: [], z: [] };
        }

        // AC analysis: admittance Y = jωC
        const omega = 2 * Math.PI * frequency;
        const Y = { real: 0, imag: omega * C };

        // For complex admittance, we'd need complex matrix handling
        // Simplified: just use magnitude for now
        const Ymag = omega * C;

        if (n1 !== 0) {
            stamps.push({ row: n1, col: n1, value: Ymag });
            if (n2 !== 0) stamps.push({ row: n1, col: n2, value: -Ymag });
        }
        if (n2 !== 0) {
            stamps.push({ row: n2, col: n2, value: Ymag });
            if (n1 !== 0) stamps.push({ row: n2, col: n1, value: -Ymag });
        }

        return { G: stamps, z: [] };
    }

    /**
     * Get companion model for transient analysis
     * Using trapezoidal integration: C becomes a resistor + current source
     * Geq = 2C/dt, Ieq = Geq*V_prev + I_prev
     */
    getCompanionModel(dt, prevState) {
        const C = this.properties.capacitance;
        const Geq = (2 * C) / dt;
        const Ieq = Geq * prevState.voltage + prevState.current;

        return {
            conductance: Geq,
            currentSource: Ieq,
            updateState: (voltage, current) => {
                this.state.voltage = voltage;
                this.state.current = current;
            }
        };
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
