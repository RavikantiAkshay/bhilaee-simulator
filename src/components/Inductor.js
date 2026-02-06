/**
 * Inductor.js - Inductor component
 * 
 * A two-terminal passive component that stores magnetic energy.
 * V = L * dI/dt
 * Impedance: Z = jωL
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Inductor extends Component {
    constructor(x = 0, y = 0) {
        super('inductor', x, y);

        // Two terminals
        this.terminals = [
            new Terminal(this, 'left', -30, 0),
            new Terminal(this, 'right', 30, 0)
        ];

        // Default inductance: 1mH
        this.properties = {
            inductance: 1e-3
        };

        // State for transient analysis
        this.state = {
            current: 0,
            voltage: 0
        };
    }

    static get displayName() {
        return 'Inductor';
    }

    static get icon() {
        return `
            <line x1="0" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2"/>
            <path d="M4 12 Q8 4, 12 12 Q16 4, 20 12 Q24 4, 28 12" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="28" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'L';
    }

    static getDefaultProperties() {
        return { inductance: 1e-3 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'inductance', label: 'Inductance', type: 'number', unit: 'H', min: 1e-12 }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="15" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Coil/Inductor symbol -->
            <path class="component-body" 
                  d="M-15 0 Q-10 -8, -5 0 Q0 -8, 5 0 Q10 -8, 15 0" 
                  fill="none" stroke-width="2"/>
        `;
    }

    getValueString() {
        return formatValue(this.properties.inductance, 'H');
    }

    /**
     * Get MNA stamp for inductor
     * For AC analysis: Z = jωL, so Y = 1/(jωL) = -j/(ωL)
     * For DC: short circuit (zero impedance) - requires special handling
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id);
        const n2 = nodeMap.get(this.terminals[1].id);
        const L = this.properties.inductance;

        const stamps = [];

        if (frequency === 0) {
            // DC analysis: inductor is short circuit
            // Model as very small resistance
            const G = 1 / 1e-6; // Very large conductance

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

        // AC analysis: admittance Y = 1/(jωL) = -j/(ωL)
        const omega = 2 * Math.PI * frequency;
        const Ymag = 1 / (omega * L);

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
     * Using trapezoidal integration: L becomes a resistor + voltage source
     * Req = 2L/dt, Veq = Req*I_prev + V_prev
     */
    getCompanionModel(dt, prevState) {
        const L = this.properties.inductance;
        const Req = (2 * L) / dt;
        const Geq = 1 / Req;
        const Veq = Req * prevState.current + prevState.voltage;

        return {
            conductance: Geq,
            voltageSource: Veq,
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
