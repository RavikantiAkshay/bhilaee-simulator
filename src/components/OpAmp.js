/**
 * OpAmp.js - Non-ideal Operational Amplifier Component
 * 
 * Implements a linear macro-model using Modified Nodal Analysis (MNA).
 * Characteristics:
 * - Finite open-loop gain (A0)
 * - Gain-Bandwidth Product (GBP) limitation via dominant internal pole
 * - Differential (Rin) and Common-mode (Rin_cm) input resistances
 * - Finite output resistance (Rout)
 * - Input offset voltage (Vos)
 * - Finite CMRR integration
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class OpAmp extends Component {
    constructor(x = 0, y = 0) {
        super('opamp', x, y);

        // Terminals
        // in_pos: Non-inverting input (+)
        // in_neg: Inverting input (-)
        // out: Amplifier output
        // internal_pole: Hidden node for MNA frequency compensation
        this.terminals = [
            new Terminal(this, 'in_pos', -30, 15),
            new Terminal(this, 'in_neg', -30, -15),
            new Terminal(this, 'out', 30, 0),
            new Terminal(this, 'internal_pole', 0, 0)
        ];

        // Hide internal pole terminal from UI interactions
        this.terminals[3].isHidden = true;

        this.properties = OpAmp.getDefaultProperties();
    }

    static get displayName() {
        return 'Operational Amplifier';
    }

    static get icon() {
        return `
            <polygon points="4,4 4,28 28,16" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5"/>
            <line x1="11" y1="9" x2="11" y2="15" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="20" x2="14" y2="20" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="16" x2="32" y2="16" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'O';
    }

    static getDefaultProperties() {
        return {
            openLoopGain: 100000,
            gbp: 1e6,
            rin: 2e6,
            rout: 75,
            offsetVoltage: 0,
            cmrr: 90,
            saturationVoltage: 15
        };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'openLoopGain', label: 'Open-Loop Gain', type: 'number', unit: 'V/V', min: 1 },
            { name: 'gbp', label: 'Gain-Bandwidth Product', type: 'number', unit: 'Hz', min: 1 },
            { name: 'rin', label: 'Input Resistance', type: 'number', unit: 'Ω', min: 1 },
            { name: 'rout', label: 'Output Resistance', type: 'number', unit: 'Ω', min: 0.001 },
            { name: 'offsetVoltage', label: 'Offset Voltage', type: 'number', unit: 'V' },
            { name: 'cmrr', label: 'CMRR', type: 'number', unit: 'dB', min: 1 },
            { name: 'saturationVoltage', label: 'Output Saturation (±V)', type: 'number', unit: 'V', min: 0.1 }
        ];
    }

    renderBody() {
        return `
            <!-- Input Leads -->
            <line x1="-30" y1="-15" x2="-20" y2="-15" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-30" y1="15" x2="-20" y2="15" stroke="var(--component-stroke)" stroke-width="2"/>
            
            <!-- Output Lead -->
            <line x1="20" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            
            <!-- Triangle Symbol -->
            <polygon class="component-body" points="-20,-25 -20,25 20,0" stroke-width="2"/>
            
            <!-- Polarity Markers: (-) on top, (+) on bottom -->
            <path d="M-15 -15 L-9 -15" stroke="var(--component-stroke)" stroke-width="1.5" fill="none"/>
            <path d="M-15 15 L-9 15 M-12 12 L-12 18" stroke="var(--component-stroke)" stroke-width="1.5" fill="none"/>
        `;
    }

    getValueString() {
        return 'Op-Amp';
    }

    getLabel() {
        return 'U';
    }

    /**
     * Get MNA stamp for OpAmp
     * Models the non-ideal OpAmp using strictly linear VCCS and resistors 
     * to avoid singular matrices and solver convergence problems.
     */
    getStamp(nodeMap, frequency = 0) {
        const nPos = nodeMap.get(this.terminals[0].id);
        const nNeg = nodeMap.get(this.terminals[1].id);
        const nOut = nodeMap.get(this.terminals[2].id);
        const nPole = nodeMap.get(this.terminals[3].id);

        const G_stamps = [];
        const z_stamps = [];

        const props = this.properties;
        const A0 = props.openLoopGain;
        const rout = Math.max(0.001, props.rout);
        const rin = props.rin;
        const ric = props.rin * 50; // common-mode input resistance
        const cmrr_linear = Math.pow(10, props.cmrr / 20);
        const Ac = A0 / cmrr_linear;

        const g_plus = A0 + Ac / 2;
        const g_minus = -A0 + Ac / 2;
        const g_out = 1 / rout;

        const G_id = 1 / rin;
        const G_ic = 1 / ric;

        // 1. Input Stage (Differential + CM Resistance)
        if (nPos !== 0) {
            G_stamps.push({ row: nPos, col: nPos, value: G_id + G_ic });
            if (nNeg !== 0) {
                G_stamps.push({ row: nPos, col: nNeg, value: -G_id });
            }
        }
        if (nNeg !== 0) {
            G_stamps.push({ row: nNeg, col: nNeg, value: G_id + G_ic });
            if (nPos !== 0) {
                G_stamps.push({ row: nNeg, col: nPos, value: -G_id });
            }
        }

        // 2. Intermediate Gain Stage with Internal Pole handling
        if (nPole !== undefined && nPole !== 0) {
            // Internal Rpole = 1 Ohm
            G_stamps.push({ row: nPole, col: nPole, value: 1.0 });

            // Frequency dependent pole admittance (Ymag) for AC analysis
            if (frequency > 0) {
                const fp = props.gbp / A0;
                const Cp = 1 / (2 * Math.PI * fp);
                const omega = 2 * Math.PI * frequency;
                const Ymag = omega * Cp;
                G_stamps.push({ row: nPole, col: nPole, value: Ymag });
            }

            // Inward VCCS calculating differential & CM voltages
            if (nPos !== 0) G_stamps.push({ row: nPole, col: nPos, value: -g_plus });
            if (nNeg !== 0) G_stamps.push({ row: nPole, col: nNeg, value: -g_minus });

            // Input Offset Voltage injected as equivalent DC current
            if (props.offsetVoltage !== 0) {
                z_stamps.push({ row: nPole, value: A0 * props.offsetVoltage });
            }
        }

        // 3. Output Stage (Norton VCCS delivering voltage to Rout)
        if (nOut !== 0) {
            // Output resistance towards ground
            G_stamps.push({ row: nOut, col: nOut, value: g_out });
            // Buffered dependency from internal pole Node
            if (nPole !== undefined && nPole !== 0) {
                G_stamps.push({ row: nOut, col: nPole, value: -g_out });
            }
        }

        return { G: G_stamps, z: z_stamps };
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            properties: { ...this.properties },
            state: { ...this.state }
        };
    }

    deserialize(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.properties = { ...OpAmp.getDefaultProperties(), ...data.properties };
        if (data.state) {
            this.state = data.state;
        }
    }

    getBounds() {
        return {
            x: this.x - 35,
            y: this.y - 30,
            width: 70,
            height: 60
        };
    }
}
