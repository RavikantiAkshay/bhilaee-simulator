/**
 * Wattmeter.js - Wattmeter component
 * 
 * Measures real power using current and voltage coils.
 * 
 * Terminals (clearly labeled):
 *   M (Mains/Current+)  ──┐                  ┌── L (Line/Voltage+)
 *                          │  Current Coil    │  Voltage Coil
 *   C (Common/Current-)  ──┘                  └── V (Voltage-)
 * 
 * Current coil (M → C): Connected in SERIES with the load.
 *   Modeled as a 0V voltage source (like an Ammeter) to measure current.
 * 
 * Voltage coil (L → V): Connected in PARALLEL across the load.
 *   Modeled as a very high resistance (100MΩ, like a Voltmeter).
 * 
 * Power reading = V_across(L,V) × I_through(M,C)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Wattmeter extends Component {
    constructor(x = 0, y = 0) {
        super('wattmeter', x, y);

        // Standard Wattmeter Terminals:
        // Current Coil: M (Mains) -> L (Load)
        // Voltage Coil: C (Common) -> V (Voltage)
        //
        // Layout:
        //   M (TL)  ───────  L (TR)
        //          (Current)
        //
        //   C (BL)  ───────  V (BR)
        //          (Voltage)

        this.terminals = [
            new Terminal(this, 'M', -40, -25),   // 0: Current Input (Mains)
            new Terminal(this, 'L', 40, -25),   // 1: Current Output (Load)
            new Terminal(this, 'C', -40, 25),   // 2: Voltage Common
            new Terminal(this, 'V', 40, 25)    // 3: Voltage Input
        ];

        this.properties = {
            power: 0,       // Read-only: computed W
            voltage: 0,     // Read-only: voltage across C-V
            current: 0      // Read-only: current through M-L
        };
    }

    static get displayName() {
        return 'Wattmeter';
    }

    static get icon() {
        return `
            <circle cx="16" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="16" y="16" text-anchor="middle" font-size="10" fill="currentColor" font-family="sans-serif">W</text>
            <line x1="0" y1="6" x2="8" y2="6" stroke="currentColor" stroke-width="1.5"/>
            <line x1="24" y1="6" x2="32" y2="6" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static get shortcut() {
        return 'W';
    }

    static getDefaultProperties() {
        return { power: 0, voltage: 0, current: 0 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'power', label: 'Power', type: 'number', unit: 'W', readOnly: true },
            { name: 'voltage', label: 'Voltage', type: 'number', unit: 'V', readOnly: true },
            { name: 'current', label: 'Current', type: 'number', unit: 'A', readOnly: true }
        ];
    }

    renderBody() {
        return `
            <!-- Current coil leads (Top) -->
            <line x1="-40" y1="-25" x2="-22" y2="-25" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="22" y1="-25" x2="40" y2="-25" stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Current coil (Series element, Top Horizontal) -->
            <rect x="-22" y="-30" width="44" height="10" rx="2"
                  fill="none" stroke="var(--component-stroke)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <path d="M -15 -25 Q 0 -35 15 -25" fill="none" stroke="var(--component-stroke)" stroke-width="1"/>

            <!-- Voltage coil leads (Bottom) -->
            <line x1="-40" y1="25" x2="-22" y2="25" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="22" y1="25" x2="40" y2="25" stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Voltage coil (Parallel element, Bottom Horizontal) -->
            <rect x="-22" y="20" width="44" height="10" rx="2"
                  fill="none" stroke="var(--component-stroke)" stroke-width="1.5" stroke-dasharray="3,2"/>
             <path d="M -15 25 Q 0 35 15 25" fill="none" stroke="var(--component-stroke)" stroke-width="1"/>

            <!-- Main body circle -->
            <circle class="component-body" cx="0" cy="0" r="18" stroke-width="2"/>

            <!-- 'W' Symbol -->
            <text x="0" y="5" text-anchor="middle" font-size="18" font-weight="bold"
                  fill="var(--component-stroke)" font-family="sans-serif">W</text>

            <!-- Terminal labels -->
            <text x="-38" y="-32" text-anchor="middle" font-size="10" font-weight="bold" fill="#e74c3c" font-family="sans-serif">M</text>
            <text x="38"  y="-32" text-anchor="middle" font-size="10" font-weight="bold" fill="#e74c3c" font-family="sans-serif">L</text>
            <text x="-38" y="35"  text-anchor="middle" font-size="10" font-weight="bold" fill="#3498db" font-family="sans-serif">C</text>
            <text x="38"  y="35"  text-anchor="middle" font-size="10" font-weight="bold" fill="#3498db" font-family="sans-serif">V</text>

            <!-- Polarity dots -->
            <circle cx="-26" cy="-25" r="2" fill="var(--component-stroke)"/> <!-- Dot near M -->
            <circle cx="-26" cy="25"  r="2" fill="var(--component-stroke)"/> <!-- Dot near C -->

            <!-- Power reading display -->
            <text class="component-value" x="0" y="34" text-anchor="middle" font-size="10"
                  fill="var(--component-text)">${this.getValueString()}</text>
        `;
    }

    getValueString() {
        return formatValue(this.properties.power, 'W');
    }

    getLabel() {
        return 'W';
    }

    /**
     * Get MNA stamp for Wattmeter.
     * 
     * Current coil (M-C): 0V voltage source (measures current)
     * Voltage coil (L-V): 100MΩ resistor (measures voltage)
     * 
     * The stamp is handled directly by MNASolver.
     */
    getStamp(nodeMap, frequency = 0) {
        const nM = nodeMap.get(this.terminals[0].id); // M (current+)
        const nC = nodeMap.get(this.terminals[1].id); // C (current-)
        const nL = nodeMap.get(this.terminals[2].id); // L (voltage+)
        const nV = nodeMap.get(this.terminals[3].id); // V (voltage-)

        // Voltage coil: high resistance
        const R = 1e8; // 100M Ohm
        const g = 1 / R;

        return {
            G: [
                { row: nL, col: nL, value: g },
                { row: nL, col: nV, value: -g },
                { row: nV, col: nL, value: -g },
                { row: nV, col: nV, value: g }
            ],
            z: [],
            // Current coil: 0V voltage source
            voltageSource: {
                positiveNode: nM,
                negativeNode: nC,
                voltage: 0,
                type: 'dc',
                frequency: 0,
                phase: 0
            }
        };
    }

    /**
     * Update wattmeter readings from simulation
     */
    setReadings(voltage, current) {
        this.properties.voltage = voltage;
        this.properties.current = current;
        this.properties.power = voltage * current;

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
        this.properties = { ...Wattmeter.getDefaultProperties(), ...data.properties, power: 0, voltage: 0, current: 0 };
    }

    getBounds() {
        return {
            x: this.x - 45,
            y: this.y - 35,
            width: 90,
            height: 75
        };
    }
}
