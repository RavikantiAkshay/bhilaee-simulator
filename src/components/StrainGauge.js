/**
 * StrainGauge.js — Strain Gauge Sensor (Quarter-Bridge)
 *
 * 4-terminal sensor:
 *   exc_pos/exc_neg — bridge excitation voltage
 *   out_pos/out_neg — bridge output (ΔV)
 *
 * User sets applied force via property panel slider (0–100 N).
 * Internal: force → strain → ΔR → Wheatstone bridge output
 *
 * Physics: ε = F / (E × A), ΔR/R = GF × ε
 * Quarter-bridge output: V_out ≈ (GF × ε / 4) × V_exc
 */

import { Component, Terminal, formatValue } from '../core/Component.js';
import { MechanicalEnvironment } from '../simulation/EnvironmentModels.js';

export class StrainGauge extends Component {
    constructor(x = 0, y = 0) {
        super('strain_gauge', x, y);

        this.terminals = [
            new Terminal(this, 'exc_pos',   0, -90),
            new Terminal(this, 'exc_neg',   0,  90),
            new Terminal(this, 'out_pos', -90,   0),
            new Terminal(this, 'out_neg',  90,   0)
        ];

        this.properties = {
            force: 0,              // N, user slider
            maxForce: 100,         // N
            gaugeFactor: 2.1,      // typical metallic strain gauge
            nominalR: 350,         // Ω
            youngsModulus: 200e9,   // Pa (steel)
            crossSection: 1e-6     // m²
        };

        this.environment = new MechanicalEnvironment({
            maxForce: this.properties.maxForce,
            youngsModulus: this.properties.youngsModulus,
            crossSection: this.properties.crossSection
        });

        this.sensorState = {
            force: 0,
            strain: 0,
            deltaR: 0,
            outputVoltage: 0
        };
    }

    static get displayName() { return 'Strain Gauge'; }

    static get icon() {
        return `
            <rect x="6" y="3" width="20" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 7 L10 10 L14 10 L14 7 L18 7 L18 10 L22 10 L22 7"
                  fill="none" stroke="currentColor" stroke-width="1"/>
            <path d="M10 14 L10 17 L14 17 L14 14 L18 14 L18 17 L22 17 L22 14"
                  fill="none" stroke="currentColor" stroke-width="1"/>
            <line x1="0" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="0" y1="16" x2="6" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="8" x2="32" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="16" x2="32" y2="16" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static getDefaultProperties() {
        return { force: 0, maxForce: 100, gaugeFactor: 2.1, nominalR: 350, youngsModulus: 200e9, crossSection: 1e-6 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'force', label: 'Applied Force', type: 'range', unit: 'N', min: 0, max: 100, step: 0.5 },
            { name: 'gaugeFactor', label: 'Gauge Factor', type: 'number', unit: '', min: 0.1, step: 0.1 },
            { name: 'nominalR', label: 'Nominal R', type: 'number', unit: 'Ω', min: 1 },
            { name: 'maxForce', label: 'Max Force', type: 'number', unit: 'N', min: 1 }
        ];
    }

    updateEnvironment(dt, excitationVoltage) {
        this.environment.maxForce = this.properties.maxForce;
        this.environment.youngsModulus = this.properties.youngsModulus;
        this.environment.crossSection = this.properties.crossSection;

        const { force, strain } = this.environment.update(dt, this.properties.force);

        // ΔR = GF × ε × R
        const deltaR = this.properties.gaugeFactor * strain * this.properties.nominalR;

        // Quarter-bridge output: V_out ≈ (GF × ε / 4) × V_exc
        const vOut = (this.properties.gaugeFactor * strain / 4) * Math.abs(excitationVoltage);

        this.sensorState = { force, strain, deltaR, outputVoltage: vOut };
        return this.sensorState;
    }

    getObservation() {
        return {
            headers: ['Force (N)', 'Strain', 'ΔR (Ω)', 'Output (mV)'],
            values: [
                this.sensorState.force.toFixed(2),
                this.sensorState.strain.toExponential(3),
                this.sensorState.deltaR.toFixed(4),
                (this.sensorState.outputVoltage * 1000).toFixed(4)
            ]
        };
    }

    get isSensor() { return true; }
    get sensorType() { return 'mechanical'; }

    getStamp(nodeMap, frequency = 0) {
        const stamps = [];
        const zStamps = [];

        // Excitation — high impedance
        const ni1 = nodeMap.get(this.terminals[0].id);
        const ni2 = nodeMap.get(this.terminals[1].id);
        const Gin = 1 / 100000;
        if (ni1 !== 0) {
            stamps.push({ row: ni1, col: ni1, value: Gin });
            if (ni2 !== 0) stamps.push({ row: ni1, col: ni2, value: -Gin });
        }
        if (ni2 !== 0) {
            stamps.push({ row: ni2, col: ni2, value: Gin });
            if (ni1 !== 0) stamps.push({ row: ni2, col: ni1, value: -Gin });
        }

        // Output — conductance + current source
        const no1 = nodeMap.get(this.terminals[2].id);
        const no2 = nodeMap.get(this.terminals[3].id);
        const Gout = 1 / 1000;
        const Iout = this.sensorState.outputVoltage * Gout;

        if (no1 !== 0) {
            stamps.push({ row: no1, col: no1, value: Gout });
            if (no2 !== 0) stamps.push({ row: no1, col: no2, value: -Gout });
            zStamps.push({ row: no1, value: Iout });
        }
        if (no2 !== 0) {
            stamps.push({ row: no2, col: no2, value: Gout });
            if (no1 !== 0) stamps.push({ row: no2, col: no1, value: -Gout });
            zStamps.push({ row: no2, value: -Iout });
        }

        return { G: stamps, z: zStamps };
    }

    renderBody() {
        const forcePct = Math.min(1, this.sensorState.force / this.properties.maxForce);
        const arrowLen = 15 + (forcePct * 25); // Scale arrow with force
        
        return `
            <rect class="component-body" x="-75" y="-75" width="150" height="150" rx="8"/>

            <!-- Excitation Labels (Top/Bottom) -->
            <text x="0" y="-68" text-anchor="middle" font-size="8" fill="#f97316" font-weight="600">EXC+</text>
            <text x="0" y="73" text-anchor="middle" font-size="8" fill="#f97316" font-weight="600">EXC-</text>
            
            <!-- Output Labels (Left/Right) -->
            <text x="-65" y="-6" font-size="8" fill="#22d3ee" font-weight="600">OUT+</text>
            <text x="40" y="-6" font-size="8" fill="#22d3ee" font-weight="600">OUT-</text>

            <g transform="translate(-18, 0) scale(1.2)">
                <!-- Diamond Bridge Lines -->
                <line x1="0" y1="-40" x2="-30" y2="0" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <line x1="-30" y1="0" x2="0" y2="40" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <line x1="0" y1="-40" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <line x1="30" y1="0" x2="0" y2="40" stroke="var(--component-stroke)" stroke-width="1.5"/>

                <!-- Resistors -->
                <rect x="-20" y="-25" width="10" height="10" transform="rotate(-53.1 -15 -20)" fill="var(--bg-primary)" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <rect x="10" y="-25" width="10" height="10" transform="rotate(53.1 15 -20)" fill="var(--bg-primary)" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <rect x="-20" y="15" width="10" height="10" transform="rotate(53.1 -15 20)" fill="var(--bg-primary)" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <rect x="10" y="15" width="10" height="10" transform="rotate(-53.1 15 20)" fill="var(--bg-primary)" id="rg" stroke="#34d399" stroke-width="2"/>
                
                <text x="25" y="25" font-size="5" fill="#34d399">Rg</text>
            </g>

            <!-- Terminal connecting lines -->
            <line x1="0" y1="-90" x2="0" y2="-48" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="0" y1="48" x2="0" y2="90" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="-90" y1="0" x2="-54" y2="0" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="18" y1="0" x2="90" y2="0" stroke="var(--component-stroke)" stroke-width="2.5"/>

            <!-- Physical Strain Gauge Diagram -->
            <g transform="translate(45, 0) scale(1.3)">
                <!-- Substrate -->
                <rect x="-10" y="-25" width="20" height="50" rx="3" fill="#f8fafc" opacity="0.1" stroke="#94a3b8" stroke-width="1"/>
                <!-- Gauge wire -->
                <path d="M-5 -20 L-5 20 A2 2 0 0 0 -1 20 L-1 -20 A2 2 0 0 1 3 -20 L3 20 A2 2 0 0 0 7 20 L7 -20" 
                      fill="none" stroke="#fbbf24" stroke-width="1.2"/>
                
                <!-- Force Arrows (stretch/compress based on force) -->
                ${this.sensorState.force > 0 ? `
                    <!-- Pulling arrows -->
                    <line x1="0" y1="-30" x2="0" y2="-${30 + arrowLen}" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow-up)"/>
                    <line x1="0" y1="30" x2="0" y2="${30 + arrowLen}" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow-down)"/>
                ` : ''}
            </g>
            
            <defs>
                <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 10 L 5 0 L 10 10 z" fill="#ef4444" />
                </marker>
                <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 0 L 5 10 z" fill="#ef4444" />
                </marker>
            </defs>
        `;
    }

    getValueString() {
        return `Strain: ${this.sensorState.strain.toExponential(2)}  |  Vout: ${(this.sensorState.outputVoltage * 1000).toFixed(2)}mV`;
    }

    getBounds() {
        return { x: this.x - 95, y: this.y - 95, width: 190, height: 190 };
    }

    getLabelOffset() { return -82; }
    getValueOffset() { return 85; }

    resetSensor() {
        this.environment.reset();
        this.properties.force = 0;
        this.sensorState = { force: 0, strain: 0, deltaR: 0, outputVoltage: 0 };
    }
}
