/**
 * Transformer.js - Non-ideal single-phase transformer component
 * 
 * Modeled using the approximate equivalent circuit referred to the primary side:
 * 
 *   P+  ──[ Req + jXeq ]──┬──── (ideal xfmr a:1) ──── S+
 *                          │
 *                         Rc ∥ jXm  (shunt branch)
 *                          │
 *   P−  ───────────────────┴──────────────────────────── S−
 * 
 * Default specs: 2 KVA, 240/120 V, turns ratio 2:1
 *   Req = 1.15 Ω,  Xeq = 0.85 Ω  (series winding losses)
 *   Rc  = 1200 Ω,  Xm  = 1000 Ω  (core / magnetizing losses)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Transformer extends Component {
    constructor(x = 0, y = 0) {
        super('transformer', x, y);

        // 4 terminals arranged as a box:
        //   primary_pos (top-left)      secondary_pos (top-right)
        //   primary_neg (bottom-left)   secondary_neg (bottom-right)
        this.terminals = [
            new Terminal(this, 'primary_pos', -40, -30),
            new Terminal(this, 'primary_neg', -40, 30),
            new Terminal(this, 'secondary_pos', 40, -30),
            new Terminal(this, 'secondary_neg', 40, 30)
        ];

        this.properties = {
            turnsRatio: 2,          // a = N1/N2 (primary-to-secondary)
            Req: 1.15,              // Equivalent series resistance (Ω)
            Xeq: 0.85,             // Equivalent series reactance (Ω)
            Rc: 1200,              // Core loss resistance (Ω)
            Xm: 1000,              // Magnetizing reactance (Ω)
            ratingKVA: 2,
            primaryVoltage: 240,
            secondaryVoltage: 120
        };
    }

    static get displayName() {
        return 'Transformer';
    }

    static get icon() {
        return `
            <!-- Primary coil -->
            <path d="M4,4 Q10,4 10,8 Q10,12 4,12 Q10,12 10,16 Q10,20 4,20" 
                  fill="none" stroke="currentColor" stroke-width="1.5"/>
            <!-- Core lines -->
            <line x1="14" y1="2" x2="14" y2="22" stroke="currentColor" stroke-width="1.5"/>
            <line x1="18" y1="2" x2="18" y2="22" stroke="currentColor" stroke-width="1.5"/>
            <!-- Secondary coil -->
            <path d="M28,4 Q22,4 22,8 Q22,12 28,12 Q22,12 22,16 Q22,20 28,20" 
                  fill="none" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static get shortcut() {
        return 'T';
    }

    static getDefaultProperties() {
        return {
            turnsRatio: 2,
            Req: 1.15,
            Xeq: 0.85,
            Rc: 1200,
            Xm: 1000,
            ratingKVA: 2,
            primaryVoltage: 240,
            secondaryVoltage: 120
        };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'turnsRatio', label: 'Turns Ratio (a)', type: 'number', unit: '' },
            { name: 'Req', label: 'R_eq', type: 'number', unit: 'Ω' },
            { name: 'Xeq', label: 'X_eq', type: 'number', unit: 'Ω' },
            { name: 'Rc', label: 'R_c', type: 'number', unit: 'Ω' },
            { name: 'Xm', label: 'X_m', type: 'number', unit: 'Ω' },
            { name: 'ratingKVA', label: 'Rating', type: 'number', unit: 'kVA', readOnly: true },
            { name: 'primaryVoltage', label: 'Primary Voltage', type: 'number', unit: 'V', readOnly: true },
            { name: 'secondaryVoltage', label: 'Secondary Voltage', type: 'number', unit: 'V', readOnly: true }
        ];
    }

    renderBody() {
        const a = this.properties.turnsRatio;
        return `
            <!-- Primary leads -->
            <line x1="-40" y1="-30" x2="-20" y2="-30" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-20" y1="-30" x2="-20" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-40" y1="30"  x2="-20" y2="30"  stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-20" y1="30"  x2="-20" y2="20"  stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Primary coil (arcs) -->
            <path d="M-20,-20 Q-10,-20 -10,-14 Q-10,-8 -20,-8 Q-10,-8 -10,-2 Q-10,4 -20,4 Q-10,4 -10,10 Q-10,16 -20,16 Q-10,16 -10,20"
                  fill="none" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-20" y1="16" x2="-20" y2="20" stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Core (two vertical bars) -->
            <line x1="-4" y1="-24" x2="-4" y2="24" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="4"  y1="-24" x2="4"  y2="24" stroke="var(--component-stroke)" stroke-width="2.5"/>

            <!-- Secondary coil (arcs, mirrored) -->
            <path d="M20,-20 Q10,-20 10,-14 Q10,-8 20,-8 Q10,-8 10,-2 Q10,4 20,4 Q10,4 10,10 Q10,16 20,16 Q10,16 10,20"
                  fill="none" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="20" y1="-20" x2="20" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Secondary leads -->
            <line x1="20" y1="-30" x2="40" y2="-30" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="20" y1="-30" x2="20" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="20" y1="30"  x2="40" y2="30"  stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="20" y1="30"  x2="20" y2="20"  stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Polarity dots -->
            <circle cx="-18" cy="-25" r="2" fill="var(--component-stroke)"/>
            <circle cx="18"  cy="-25" r="2" fill="var(--component-stroke)"/>

            <!-- Turns ratio label -->
            <text x="0" y="38" text-anchor="middle" font-size="10" fill="var(--component-text)">${a}:1</text>
        `;
    }

    getValueString() {
        const a = this.properties.turnsRatio;
        return `${a}:1  ${this.properties.ratingKVA}kVA`;
    }

    getLabel() {
        return 'T';
    }

    /**
     * Get MNA stamp for transformer (DC analysis).
     * 
     * For DC steady-state:
     *   - Xeq is zero (inductor → short)
     *   - Xm  is infinite (inductor → open)
     *   - Model simplifies to: series Req + shunt Rc + ideal transformer
     * 
     * The stamp is handled directly by MNASolver.stampTransformer().
     * We return metadata here so the solver knows what to stamp.
     */
    getStamp(nodeMap, frequency = 0) {
        return {
            G: [],
            z: [],
            voltageSource: null,
            isTransformer: true,
            transformerData: {
                primaryPos: nodeMap.get(this.terminals[0].id),
                primaryNeg: nodeMap.get(this.terminals[1].id),
                secondaryPos: nodeMap.get(this.terminals[2].id),
                secondaryNeg: nodeMap.get(this.terminals[3].id),
                turnsRatio: this.properties.turnsRatio,
                Req: this.properties.Req,
                Xeq: this.properties.Xeq,
                Rc: this.properties.Rc,
                Xm: this.properties.Xm
            }
        };
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
            properties: { ...this.properties },
            state: { ...this.state }
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
        this.properties = { ...Transformer.getDefaultProperties(), ...data.properties };
        if (data.state) {
            this.state = data.state;
        }
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
