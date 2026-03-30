/**
 * LVDT.js — Linear Variable Differential Transformer
 *
 * 4-terminal sensor:
 *   exc_pos/exc_neg — excitation voltage input
 *   out_pos/out_neg — output voltage proportional to core displacement
 *
 * Displacement is set by user via property panel slider (-10mm to +10mm).
 * Output: V_out = sensitivity × displacement × V_excitation
 *
 * Center = 0 output; direction determines sign.
 */

import { Component, Terminal, formatValue } from '../core/Component.js';
import { DisplacementEnvironment } from '../simulation/EnvironmentModels.js';

export class LVDT extends Component {
    constructor(x = 0, y = 0) {
        super('lvdt', x, y);

        this.terminals = [
            new Terminal(this, 'exc_pos', -90, -35),
            new Terminal(this, 'exc_neg',  90, -35),
            new Terminal(this, 'out_pos', -90,  35),
            new Terminal(this, 'out_neg',  90,  35)
        ];

        this.properties = {
            displacement: 0,       // mm, user slider (-maxDisplacement to +maxDisplacement)
            sensitivity: 0.2,      // V/mm per volt excitation
            maxDisplacement: 10,   // mm
        };

        this.environment = new DisplacementEnvironment({
            maxDisplacement: this.properties.maxDisplacement
        });

        this.sensorState = {
            displacement: 0,
            outputVoltage: 0
        };
    }

    static get displayName() { return 'LVDT'; }

    static get icon() {
        return `
            <rect x="4" y="3" width="24" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 6 L8 18 M12 6 L12 18 M20 6 L20 18 M24 6 L24 18" stroke="currentColor" stroke-width="0.8" opacity="0.4"/>
            <line x1="0" y1="8" x2="4" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="0" y1="16" x2="4" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="8" x2="32" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="28" y1="16" x2="32" y2="16" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static getDefaultProperties() {
        return { displacement: 0, sensitivity: 0.2, maxDisplacement: 10 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'displacement', label: 'Displacement', type: 'range', unit: 'mm',
              min: -10, max: 10, step: 0.1 },
            { name: 'sensitivity', label: 'Sensitivity', type: 'number', unit: 'V/mm/V', min: 0.001, step: 0.01 },
            { name: 'maxDisplacement', label: 'Max Displacement', type: 'number', unit: 'mm', min: 1 }
        ];
    }

    updateEnvironment(dt, excitationVoltage) {
        this.environment.maxDisplacement = this.properties.maxDisplacement;

        const disp = this.environment.update(dt, this.properties.displacement);

        // Output voltage = sensitivity × displacement × excitation
        const vOut = this.properties.sensitivity * disp * Math.abs(excitationVoltage);

        this.sensorState = { displacement: disp, outputVoltage: vOut };
        return this.sensorState;
    }

    getObservation() {
        return {
            headers: ['Displacement (mm)', 'Output Voltage (V)'],
            values: [
                this.sensorState.displacement.toFixed(3),
                this.sensorState.outputVoltage.toFixed(4)
            ]
        };
    }

    get isSensor() { return true; }
    get sensorType() { return 'displacement'; }

    /**
     * MNA stamp: excitation as high-impedance load, output as dependent voltage source.
     * For simplicity, output modelled as conductance to ground with an injected current
     * to produce the desired output voltage.
     */
    getStamp(nodeMap, frequency = 0) {
        const stamps = [];
        const zStamps = [];

        // Excitation input — high impedance load
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

        // Output — model as conductance + current source to create desired voltage
        const no1 = nodeMap.get(this.terminals[2].id);
        const no2 = nodeMap.get(this.terminals[3].id);
        const Gout = 1 / 1000; // 1kΩ output impedance
        const Iout = this.sensorState.outputVoltage * Gout; // I = V × G

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
        // Draw the core position indicator (-35 to +35 pixels)
        const coreOffset = (this.sensorState.displacement / this.properties.maxDisplacement) * 35;
        return `
            <rect class="component-body" x="-75" y="-55" width="150" height="110" rx="6"/>

            <!-- Excitation Labels -->
            <text x="-50" y="-40" font-size="8" fill="#f97316" font-weight="600">EXC+</text>
            <text x="50" y="-40" font-size="8" fill="#f97316" font-weight="600">EXC-</text>
            
            <!-- Output Labels -->
            <text x="-50" y="50" font-size="8" fill="#22d3ee" font-weight="600">OUT+</text>
            <text x="50" y="50" font-size="8" fill="#22d3ee" font-weight="600">OUT-</text>

            <!-- Primary Coil (Top) -->
            <line x1="-90" y1="-35" x2="-45" y2="-35" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="90" y1="-35" x2="45" y2="-35" stroke="var(--component-stroke)" stroke-width="2"/>
            <path d="M-45 -35 Q-38 -50 -32 -35 T-15 -35 T2 -35 T19 -35 T36 -35 T45 -35"
                  fill="none" stroke="var(--component-stroke)" stroke-width="1.8"/>

            <!-- Core (moving) -->
            <rect x="${coreOffset - 35}" y="-12" width="70" height="24" rx="2"
                  fill="url(#core-gradient)" stroke="#555" stroke-width="1.5"/>
            <defs>
                <linearGradient id="core-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#444"/>
                    <stop offset="50%" stop-color="#aaa"/>
                    <stop offset="100%" stop-color="#444"/>
                </linearGradient>
            </defs>

            <!-- Secondary Coils (Bottom, series opposing) -->
            <line x1="-90" y1="35" x2="-45" y2="35" stroke="var(--component-stroke)" stroke-width="2"/>
            <path d="M-45 35 Q-38 20 -32 35 T-15 35 T-7 35"
                  fill="none" stroke="var(--component-stroke)" stroke-width="1.8"/>
            
            <!-- Wire connecting the two secondaries -->
            <path d="M-7 35 L-7 20 L7 20 L7 35" fill="none" stroke="var(--component-stroke)" stroke-width="1.5"/>
            
            <path d="M7 35 Q14 20 21 35 T38 35 T45 35"
                  fill="none" stroke="var(--component-stroke)" stroke-width="1.8"/>
            <line x1="90" y1="35" x2="45" y2="35" stroke="var(--component-stroke)" stroke-width="2"/>
        `;
    }

    getValueString() {
        return `Core: ${this.sensorState.displacement.toFixed(1)}mm  |  Vout: ${this.sensorState.outputVoltage.toFixed(3)}V`;
    }

    getBounds() {
        return { x: this.x - 95, y: this.y - 65, width: 190, height: 130 };
    }

    getLabelOffset() { return -62; }
    getValueOffset() { return 65; }

    resetSensor() {
        this.environment.reset();
        this.properties.displacement = 0;
        this.sensorState = { displacement: 0, outputVoltage: 0 };
    }
}
