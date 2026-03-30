/**
 * RTD.js — Resistance Temperature Detector (Pt100)
 *
 * 4-terminal sensor component:
 *   in_pos/in_neg  — heater driving voltage (temperature rises with applied voltage)
 *   out_pos/out_neg — resistance output (connect voltmeter/ammeter)
 *
 * Physics: R(T) = R₀ × (1 + α × (T - T_ref))
 *   Pt100 defaults: R₀ = 100 Ω, α = 0.00385 /°C, T_ref = 0°C
 */

import { Component, Terminal, formatValue } from '../core/Component.js';
import { ThermalEnvironment } from '../simulation/EnvironmentModels.js';

export class RTD extends Component {
    constructor(x = 0, y = 0) {
        super('rtd', x, y);

        // 4 terminals
        this.terminals = [
            new Terminal(this, 'exc_pos', -75, -20),
            new Terminal(this, 'exc_neg', -75,  20),
            new Terminal(this, 'out_pos',  75, -20),
            new Terminal(this, 'out_neg',  75,  20)
        ];

        this.properties = {
            r0: 100,            // Ω at T_ref
            alpha: 0.00385,     // /°C
            tRef: 0,            // reference temperature °C
            ambientTemp: 25,    // °C
            timeConstant: 3,    // seconds
            heaterGain: 60,     // °C per volt
            maxTemp: 300        // °C saturation
        };

        // Internal state
        this.environment = new ThermalEnvironment({
            ambientTemp: this.properties.ambientTemp,
            timeConstant: this.properties.timeConstant,
            heaterGain: this.properties.heaterGain,
            maxTemp: this.properties.maxTemp
        });

        this.sensorState = {
            temperature: this.properties.ambientTemp,
            resistance: this.properties.r0 * (1 + this.properties.alpha * (this.properties.ambientTemp - this.properties.tRef))
        };
    }

    static get displayName() { return 'RTD (Pt100)'; }

    static get icon() {
        return `
            <rect x="6" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 8 L12 16 M16 8 L16 16 M20 8 L20 16" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            <line x1="2" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="2" y1="16" x2="6" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="8" x2="30" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <text x="16" y="13" text-anchor="middle" font-size="5" fill="currentColor" font-weight="bold">RTD</text>
        `;
    }

    static getDefaultProperties() {
        return { r0: 100, alpha: 0.00385, tRef: 0, ambientTemp: 25, timeConstant: 3, heaterGain: 60, maxTemp: 300 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'r0', label: 'R₀ (at T_ref)', type: 'number', unit: 'Ω', min: 1 },
            { name: 'alpha', label: 'α (TCR)', type: 'number', unit: '/°C', min: 0.0001, step: 0.0001 },
            { name: 'tRef', label: 'T_ref', type: 'number', unit: '°C' },
            { name: 'ambientTemp', label: 'Ambient Temp', type: 'number', unit: '°C', min: -40, max: 85 },
            { name: 'timeConstant', label: 'Time Constant', type: 'number', unit: 's', min: 0.1 },
            { name: 'heaterGain', label: 'Heater Gain', type: 'number', unit: '°C/V', min: 1 },
            { name: 'maxTemp', label: 'Max Temp', type: 'number', unit: '°C', min: 50 }
        ];
    }

    /** Called by continuous simulation loop */
    updateEnvironment(dt, heaterVoltage) {
        // Sync environment params in case user changed them
        this.environment.ambientTemp = this.properties.ambientTemp;
        this.environment.timeConstant = this.properties.timeConstant;
        this.environment.heaterGain = this.properties.heaterGain;
        this.environment.maxTemp = this.properties.maxTemp;

        const temp = this.environment.update(dt, heaterVoltage);
        const R = this.properties.r0 * (1 + this.properties.alpha * (temp - this.properties.tRef));

        this.sensorState = { temperature: temp, resistance: Math.max(0.01, R) };
        return this.sensorState;
    }

    /** Get observation row for Note Reading */
    getObservation() {
        return {
            headers: ['Temperature (°C)', 'Resistance (Ω)'],
            values: [
                this.sensorState.temperature.toFixed(2),
                this.sensorState.resistance.toFixed(2)
            ]
        };
    }

    /** True for sensors that need the continuous loop */
    get isSensor() { return true; }
    get sensorType() { return 'thermal'; }

    /**
     * MNA stamp: variable resistance between out_pos and out_neg
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[2].id); // out_pos
        const n2 = nodeMap.get(this.terminals[3].id); // out_neg
        const G = 1 / this.sensorState.resistance;

        const stamps = [];
        if (n1 !== 0) {
            stamps.push({ row: n1, col: n1, value: G });
            if (n2 !== 0) stamps.push({ row: n1, col: n2, value: -G });
        }
        if (n2 !== 0) {
            stamps.push({ row: n2, col: n2, value: G });
            if (n1 !== 0) stamps.push({ row: n2, col: n1, value: -G });
        }

        // Heater input — modelled as very high resistance (draws negligible current for sensing)
        const ni1 = nodeMap.get(this.terminals[0].id); // in_pos
        const ni2 = nodeMap.get(this.terminals[1].id); // in_neg
        const Gin = 1 / 100000; // 100kΩ heater impedance
        if (ni1 !== 0) {
            stamps.push({ row: ni1, col: ni1, value: Gin });
            if (ni2 !== 0) stamps.push({ row: ni1, col: ni2, value: -Gin });
        }
        if (ni2 !== 0) {
            stamps.push({ row: ni2, col: ni2, value: Gin });
            if (ni1 !== 0) stamps.push({ row: ni2, col: ni1, value: -Gin });
        }

        return { G: stamps, z: [] };
    }

    renderBody() {
        const tempBar = Math.min(24, (this.sensorState.temperature / 200) * 24);
        
        return `
            <rect class="component-body" x="-60" y="-40" width="120" height="80" rx="6"/>

            <!-- Terminals Connections -->
            <line x1="-75" y1="-20" x2="-40" y2="-20" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="-75" y1="20" x2="-40" y2="20" stroke="var(--component-stroke)" stroke-width="2.5"/>
            
            <g transform="translate(0, 0) scale(1.2)">
                <!-- Heater Symbol Left -->
                <rect x="-30" y="-12" width="15" height="24" rx="2" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
                <path d="M-25 -12 L-25 12 M-20 -12 L-20 12 M-15 -12 L-15 12" stroke="#ef4444" stroke-width="1" opacity="0.3"/>
                <line x1="-40" y1="-17" x2="-30" y2="-8" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <line x1="-40" y1="17" x2="-30" y2="8" stroke="var(--component-stroke)" stroke-width="1.5"/>
                
                <!-- Sensor Element Right -->
                <rect x="5" y="-12" width="25" height="24" rx="2" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
                <!-- Pt100 Zigzag -->
                <polyline points="5,-5 10,-10 15,10 20,-10 25,10 30,5" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linejoin="round"/>
                
                <line x1="30" y1="-8" x2="45" y2="-17" stroke="var(--component-stroke)" stroke-width="1.5"/>
                <line x1="30" y1="8" x2="45" y2="17" stroke="var(--component-stroke)" stroke-width="1.5"/>

                <!-- Thermal coupling arrows -->
                <path d="M-12 -6 L2 -6 M-12 0 L2 0 M-12 6 L2 6" stroke="#f59e0b" stroke-width="1" marker-end="url(#heat-arrow)"/>
            </g>

            <defs>
                <marker id="heat-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
            </defs>

            <!-- Thermometer Bar -->
            <rect x="-12" y="30" width="24" height="4" rx="1" fill="#cbd5e1" opacity="0.5"/>
            <rect x="-12" y="30" width="${tempBar}" height="4" rx="1" fill="#ef4444"/>

            <text x="-40" y="-22" font-size="6" fill="#ef4444" font-weight="bold">HEAT</text>
            <text x="25" y="-22" text-anchor="middle" font-size="6" fill="#3b82f6" font-weight="bold">RTD Pt100</text>
            <text x="0" y="38" text-anchor="middle" font-size="7" fill="#64748b">${this.sensorState.temperature.toFixed(1)}°C</text>
            
            <line x1="75" y1="-20" x2="50" y2="-20" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <line x1="75" y1="20" x2="50" y2="20" stroke="var(--component-stroke)" stroke-width="2.5"/>
        `;
    }

    getValueString() {
        return `R: ${this.sensorState.resistance.toFixed(2)} Ω`;
    }

    getBounds() {
        return { x: this.x - 85, y: this.y - 50, width: 170, height: 100 };
    }

    getLabelOffset() { return -47; }
    getValueOffset() { return 47; }

    resetSensor() {
        this.environment.reset();
        this.sensorState = {
            temperature: this.properties.ambientTemp,
            resistance: this.properties.r0 * (1 + this.properties.alpha * (this.properties.ambientTemp - this.properties.tRef))
        };
    }
}
