/**
 * Thermistor.js — NTC Thermistor Sensor
 *
 * 4-terminal sensor:
 *   in_pos/in_neg  — heater voltage (temperature auto-rises)
 *   out_pos/out_neg — resistance output
 *
 * Physics: R(T) = R₀ × exp(B × (1/T - 1/T₀))
 *   where T is in Kelvin
 *   NTC defaults: R₀ = 10kΩ at T₀ = 25°C (298.15 K), B = 3950
 */

import { Component, Terminal, formatValue } from '../core/Component.js';
import { ThermalEnvironment } from '../simulation/EnvironmentModels.js';

export class Thermistor extends Component {
    constructor(x = 0, y = 0) {
        super('thermistor', x, y);

        this.terminals = [
            new Terminal(this, 'exc_pos', -75, -20),
            new Terminal(this, 'exc_neg', -75,  20),
            new Terminal(this, 'out_pos',  75, -20),
            new Terminal(this, 'out_neg',  75,  20)
        ];

        this.properties = {
            r0: 10000,          // Ω at T₀
            bConstant: 3950,    // B-parameter (K)
            t0: 25,             // reference temperature °C
            ambientTemp: 25,
            timeConstant: 3,
            heaterGain: 60,
            maxTemp: 200
        };

        this.environment = new ThermalEnvironment({
            ambientTemp: this.properties.ambientTemp,
            timeConstant: this.properties.timeConstant,
            heaterGain: this.properties.heaterGain,
            maxTemp: this.properties.maxTemp
        });

        this.sensorState = {
            temperature: this.properties.ambientTemp,
            resistance: this.properties.r0
        };
    }

    static get displayName() { return 'Thermistor (NTC)'; }

    static get icon() {
        return `
            <rect x="6" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="11" y1="7" x2="21" y2="17" stroke="currentColor" stroke-width="1"/>
            <line x1="2" y1="8" x2="6" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="2" y1="16" x2="6" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="8" x2="30" y2="8" stroke="currentColor" stroke-width="1.5"/>
            <line x1="26" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="1.5"/>
            <text x="16" y="13" text-anchor="middle" font-size="4.5" fill="currentColor" font-weight="bold">NTC</text>
        `;
    }

    static getDefaultProperties() {
        return { r0: 10000, bConstant: 3950, t0: 25, ambientTemp: 25, timeConstant: 3, heaterGain: 60, maxTemp: 200 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'r0', label: 'R₀ (at T₀)', type: 'number', unit: 'Ω', min: 1 },
            { name: 'bConstant', label: 'B Constant', type: 'number', unit: 'K', min: 100 },
            { name: 't0', label: 'T₀', type: 'number', unit: '°C' },
            { name: 'ambientTemp', label: 'Ambient Temp', type: 'number', unit: '°C', min: -40, max: 85 },
            { name: 'timeConstant', label: 'Time Constant', type: 'number', unit: 's', min: 0.1 },
            { name: 'heaterGain', label: 'Heater Gain', type: 'number', unit: '°C/V', min: 1 },
            { name: 'maxTemp', label: 'Max Temp', type: 'number', unit: '°C', min: 50 }
        ];
    }

    /** Continuous simulation update */
    updateEnvironment(dt, heaterVoltage) {
        this.environment.ambientTemp = this.properties.ambientTemp;
        this.environment.timeConstant = this.properties.timeConstant;
        this.environment.heaterGain = this.properties.heaterGain;
        this.environment.maxTemp = this.properties.maxTemp;

        const tempC = this.environment.update(dt, heaterVoltage);
        const T_K = tempC + 273.15;
        const T0_K = this.properties.t0 + 273.15;

        // NTC equation: R = R₀ × exp(B × (1/T - 1/T₀))
        const R = this.properties.r0 * Math.exp(this.properties.bConstant * (1 / T_K - 1 / T0_K));

        this.sensorState = { temperature: tempC, resistance: Math.max(0.01, R) };
        return this.sensorState;
    }

    getObservation() {
        return {
            headers: ['Temperature (°C)', 'Resistance (Ω)'],
            values: [
                this.sensorState.temperature.toFixed(2),
                this.sensorState.resistance.toFixed(2)
            ]
        };
    }

    get isSensor() { return true; }
    get sensorType() { return 'thermal'; }

    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[2].id);
        const n2 = nodeMap.get(this.terminals[3].id);
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

        // Heater input — very high resistance
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
                <rect x="5" y="-12" width="25" height="24" rx="2" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
                
                <!-- NTC Thermistor Symbol -->
                <line x1="17.5" y1="10" x2="17.5" y2="-10" stroke="#16a34a" stroke-width="1.5"/>
                <line x1="5" y1="12" x2="30" y2="-10" stroke="#16a34a" stroke-width="1.5"/>
                <path d="M12.5 -10 L17.5 -10 L17.5 10 L22.5 10" fill="none" stroke="#10b981" stroke-width="1.5"/>
                <text x="7" y="5" font-size="6" fill="#16a34a" transform="rotate(-40 7 5)">-t°</text>

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
            <text x="25" y="-22" text-anchor="middle" font-size="6" fill="#22c55e" font-weight="bold">Thermistor NTC</text>
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
        this.sensorState = { temperature: this.properties.ambientTemp, resistance: this.properties.r0 };
    }
}
