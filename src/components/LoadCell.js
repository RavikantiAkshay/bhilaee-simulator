/**
 * LoadCell.js — Load Cell Sensor
 *
 * 4-terminal sensor:
 *   exc_pos/exc_neg — bridge excitation voltage
 *   out_pos/out_neg — amplified output voltage
 *
 * User selects weight from dropdown via property panel.
 * Internal: 4-gauge full bridge → amplified output proportional to load.
 *
 * Physics: V_out = S × (W / W_rated) × V_exc
 *   where S = sensitivity (typically 2 mV/V)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';
import { MechanicalEnvironment } from '../simulation/EnvironmentModels.js';

export class LoadCell extends Component {
    constructor(x = 0, y = 0) {
        super('load_cell', x, y);

        this.terminals = [
            new Terminal(this, 'exc_pos',   0, -105),
            new Terminal(this, 'exc_neg',   0,  105),
            new Terminal(this, 'out_pos', -120,   0),
            new Terminal(this, 'out_neg',  120,   0)
        ];

        this.properties = {
            weight: 0,                // grams, user selects from dropdown
            ratedCapacity: 5000,      // grams (5 kg)
            sensitivity: 0.002,       // V/V (2 mV/V typical)
            amplifierGain: 100        // internal amplification
        };

        // Reuse mechanical environment for smoothing
        this.environment = new MechanicalEnvironment({
            maxForce: this.properties.ratedCapacity,
            smoothingFactor: 0.12,
            noiseAmplitude: 0.002
        });

        this.sensorState = {
            weight: 0,
            loadRatio: 0,
            rawVoltage: 0,
            outputVoltage: 0
        };
    }

    static get displayName() { return 'Load Cell'; }

    static get icon() {
        return `
            <rect x="4" y="6" width="24" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="3" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="18" x2="16" y2="21" stroke="currentColor" stroke-width="1.5"/>
            <line x1="13" y1="3" x2="19" y2="3" stroke="currentColor" stroke-width="1.5"/>
            <line x1="13" y1="21" x2="19" y2="21" stroke="currentColor" stroke-width="1.5"/>
            <line x1="0" y1="10" x2="4" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="0" y1="14" x2="4" y2="14" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="10" x2="32" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="14" x2="32" y2="14" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static getDefaultProperties() {
        return { weight: 0, ratedCapacity: 5000, sensitivity: 0.002, amplifierGain: 100 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'weight', label: 'Weight', type: 'select', unit: 'g',
              options: [
                  { value: 0, label: '0 g' },
                  { value: 50, label: '50 g' },
                  { value: 100, label: '100 g' },
                  { value: 200, label: '200 g' },
                  { value: 500, label: '500 g' },
                  { value: 1000, label: '1 kg' },
                  { value: 2000, label: '2 kg' },
                  { value: 5000, label: '5 kg' }
              ]},
            { name: 'ratedCapacity', label: 'Rated Capacity', type: 'number', unit: 'g', min: 100 },
            { name: 'sensitivity', label: 'Sensitivity', type: 'number', unit: 'V/V', min: 0.0001, step: 0.0001 },
            { name: 'amplifierGain', label: 'Amplifier Gain', type: 'number', unit: '×', min: 1 }
        ];
    }

    updateEnvironment(dt, excitationVoltage) {
        this.environment.maxForce = this.properties.ratedCapacity;

        // Use the weight as "force" input to get smoothing
        const { force } = this.environment.update(dt, this.properties.weight);

        const loadRatio = Math.min(force / this.properties.ratedCapacity, 1);
        const rawV = this.properties.sensitivity * loadRatio * Math.abs(excitationVoltage);
        const ampV = rawV * this.properties.amplifierGain;

        this.sensorState = {
            weight: force,
            loadRatio,
            rawVoltage: rawV,
            outputVoltage: ampV
        };
        return this.sensorState;
    }

    getObservation() {
        return {
            headers: ['Weight (g)', 'Load Ratio', 'Raw V (mV)', 'Output V (V)'],
            values: [
                this.sensorState.weight.toFixed(1),
                this.sensorState.loadRatio.toFixed(4),
                (this.sensorState.rawVoltage * 1000).toFixed(4),
                this.sensorState.outputVoltage.toFixed(4)
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
        const weightPct = Math.min(1, this.sensorState.weight / this.properties.ratedCapacity);
        const deflection = weightPct * 15; // Max 15px bend
        
        return `
            <rect class="component-body" x="-90" y="-75" width="180" height="150" rx="8"/>

            <!-- Excitation Labels (Top/Bottom) -->
            <text x="0" y="-68" text-anchor="middle" font-size="8" fill="#f97316" font-weight="600">EXC+</text>
            <text x="0" y="73" text-anchor="middle" font-size="8" fill="#f97316" font-weight="600">EXC-</text>
            
            <!-- Output Labels (Left/Right) -->
            <text x="-75" y="-6" font-size="8" fill="#22d3ee" font-weight="600">OUT+</text>
            <text x="50" y="-6" font-size="8" fill="#22d3ee" font-weight="600">OUT-</text>

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
                <rect x="10" y="15" width="10" height="10" transform="rotate(-53.1 15 20)" fill="var(--bg-primary)" stroke="var(--component-stroke)" stroke-width="1.5"/>

                <path d="M-6 -5 L6 5 M-6 5 L6 -5" stroke="#34d399" stroke-width="2" opacity="0.6"/> <!-- Bridge internal marking -->
            </g>

            <!-- Terminal connecting lines -->
            <line x1="0" y1="-105" x2="0" y2="-48" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="0" y1="48" x2="0" y2="105" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="-120" y1="0" x2="-54" y2="0" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="18" y1="0" x2="120" y2="0" stroke="var(--component-stroke)" stroke-width="2.5"/>

            <!-- Physical Load Cell Diagram (Binocular Beam) -->
            <g transform="translate(45, 0) scale(1.3)">
                <!-- Fixed Mount -->
                <rect x="-5" y="-30" width="10" height="60" fill="#334155" rx="2"/>
                <!-- Bending Beam -->
                <path d="M 5 -15 L 40 -15 Q 45 -15 45 -10 L 45 10 Q 45 15 40 15 L 5 15 Z" 
                      fill="url(#beam-gradient)" stroke="#475569" stroke-width="1"/>
                
                <defs>
                    <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#cbd5e1"/>
                        <stop offset="50%" stop-color="#f8fafc"/>
                        <stop offset="100%" stop-color="#94a3b8"/>
                    </linearGradient>
                </defs>

                <!-- Binocular holes -->
                <circle cx="15" cy="0" r="10" fill="var(--bg-primary)" stroke="#475569" stroke-width="1"/>
                <circle cx="30" cy="0" r="10" fill="var(--bg-primary)" stroke="#475569" stroke-width="1"/>
                <!-- Thin section (strain locations) -->
                <path d="M 20 -2 L 25 -2 M 20 2 L 25 2" stroke="#475569" stroke-width="1"/>
                
                <!-- Strain gauges (red markers) -->
                <rect x="12" y="-16" width="6" height="2" fill="#ef4444"/>
                <rect x="27" y="-16" width="6" height="2" fill="#ef4444"/>
                <rect x="12" y="14" width="6" height="2" fill="#ef4444"/>
                <rect x="27" y="14" width="6" height="2" fill="#ef4444"/>

                <!-- Load Hanger (moves down) -->
                <g transform="translate(42, ${15 + deflection})">
                    <!-- Hook -->
                    <path d="M0 0 L0 15 Q0 20 -5 20 Q-10 20 -10 15" fill="none" stroke="#64748b" stroke-width="2"/>
                    <!-- Weight Blocks based on load -->
                    ${weightPct > 0 ? `
                        <rect x="-15" y="20" width="30" height="${10 + weightPct * 15}" 
                              fill="#f59e0b" stroke="#b45309" stroke-width="1" rx="2"/>
                        <text x="0" y="${28 + weightPct * 7}" text-anchor="middle" font-size="6" fill="#0f172a" font-weight="bold">
                            ${this.properties.weight}g
                        </text>
                    ` : ''}
                </g>
            </g>
        `;
    }

    getValueString() {
        const wStr = this.sensorState.weight >= 1000 ? `${(this.sensorState.weight / 1000).toFixed(2)}kg` : `${this.sensorState.weight.toFixed(0)}g`;
        return `Load: ${wStr}  |  Vout: ${(this.sensorState.outputVoltage * 1000).toFixed(2)}mV`;
    }

    getBounds() {
        return { x: this.x - 125, y: this.y - 110, width: 250, height: 220 };
    }

    getLabelOffset() { return -82; }
    getValueOffset() { return 82; }

    resetSensor() {
        this.environment.reset();
        this.properties.weight = 0;
        this.sensorState = { weight: 0, loadRatio: 0, rawVoltage: 0, outputVoltage: 0 };
    }
}
