/**
 * Load.js - Transformer Load component
 * 
 * A two-terminal component representing a series R-L load
 * for transformer load/no-load testing.
 * 
 * Rated secondary specs (fixed):
 *   V2 = 120 V, I2 = 16.66 A, S = 2 kVA, PF = 0.8 lagging
 * 
 * User input: Load % (0–125%)
 * 
 * Computed:
 *   k = Load% / 100
 *   I2 = k × 16.66
 *   Z  = 120 / I2
 *   R  = Z × 0.8
 *   XL = Z × 0.6
 *   L  = XL / (2π × f)   (for transient analysis)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

// Fixed transformer secondary ratings
const RATED_VOLTAGE = 120;     // V
const RATED_CURRENT = 16.6667; // A  (2000 / 120)
const POWER_FACTOR = 0.8;     // lagging
const SIN_PHI = 0.6;     // sin(arccos(0.8))

export class Load extends Component {
    constructor(x = 0, y = 0) {
        super('load', x, y);

        // Two terminals: left and right
        this.terminals = [
            new Terminal(this, 'left', -40, 0),
            new Terminal(this, 'right', 40, 0)
        ];

        // Default: 100% loading
        this.properties = {
            loadPercent: 100
        };

        // State for transient analysis (inductor current tracking)
        this.state = {
            inductorCurrent: 0,
            inductorVoltage: 0
        };
    }

    static get displayName() {
        return 'Load';
    }

    static get icon() {
        return `
            <rect x="4" y="4" width="24" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 12 L10 8 L12 16 L14 8 L16 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M18 12 Q20 8, 22 12 Q24 8, 26 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static get shortcut() {
        return null; // No keyboard shortcut
    }

    static getDefaultProperties() {
        return { loadPercent: 100 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'loadPercent', label: 'Load %', type: 'number', unit: '%', min: 0, max: 125, step: 1 }
        ];
    }

    /**
     * Compute the R and XL values from load percentage.
     * Returns { R, XL, Z, I2, k } or null if open circuit.
     */
    getLoadImpedance() {
        const k = this.properties.loadPercent / 100;
        if (k <= 0) {
            return null; // Open circuit
        }

        const I2 = k * RATED_CURRENT;
        const Z = RATED_VOLTAGE / I2;
        const R = Z * POWER_FACTOR;
        const XL = Z * SIN_PHI;

        return { R, XL, Z, I2, k };
    }

    renderBody() {
        return `
            <!-- Outer box -->
            <rect class="component-body" x="-35" y="-14" width="70" height="28" rx="3" 
                  fill="none" stroke-width="2"/>
            <!-- Left lead -->
            <line x1="-40" y1="0" x2="-35" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Right lead -->
            <line x1="35" y1="0" x2="40" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Resistor zigzag (left half) -->
            <path d="M-30 0 L-27 -7 L-21 7 L-15 -7 L-9 7 L-6 0" 
                  fill="none" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Connecting line -->
            <line x1="-6" y1="0" x2="2" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Inductor coil (right half) -->
            <path d="M2 0 Q7 -9, 12 0 Q17 -9, 22 0 Q27 -9, 32 0" 
                  fill="none" stroke="var(--component-stroke)" stroke-width="2"/>
        `;
    }

    getValueString() {
        const pct = this.properties.loadPercent;
        if (pct <= 0) return 'No Load';

        const imp = this.getLoadImpedance();
        if (!imp) return 'No Load';

        return `${pct}% (${formatValue(imp.R, 'Ω')} + j${formatValue(imp.XL, 'Ω')})`;
    }

    getLabel() {
        return 'Load';
    }

    /**
     * Get MNA stamp for DC analysis.
     * Load is R + jXL. For DC (ω=0), XL = 0, so only R is stamped.
     * At 0% load → open circuit (very high resistance).
     */
    getStamp(nodeMap, frequency = 0) {
        const n1 = nodeMap.get(this.terminals[0].id);
        const n2 = nodeMap.get(this.terminals[1].id);
        const stamps = [];

        const imp = this.getLoadImpedance();

        // Open circuit: use very high resistance
        const R = imp ? imp.R : 1e9;
        const G = 1 / R;

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

    /**
     * Companion model for transient analysis.
     * The load is series R + L.
     * We decompose this into:
     *   - A resistor (R) — stamped as conductance
     *   - An inductor (L = XL / ω_rated) — Backward Euler companion model
     * 
     * The series combination means the same current flows through both.
     * Total companion conductance: 1 / (R + R_eq_L), where R_eq_L = 2L/dt (trapezoidal) or L/dt (BE)
     * 
     * For simplicity and consistency with the solver, we return a combined model.
     */
    getCompanionModel(dt, prevState) {
        const imp = this.getLoadImpedance();
        if (!imp) {
            // Open circuit - very high resistance
            return {
                conductance: 1e-12,
                currentSource: 0,
                updateState: () => { }
            };
        }

        // Compute inductance from XL at rated frequency (50 Hz assumed)
        // XL = 2πfL → L = XL / (2πf)
        const f = 50; // rated frequency
        const L = imp.XL / (2 * Math.PI * f);
        const R = imp.R;

        // Backward Euler for inductor: G_eq = dt/L, I_eq = i_prev
        const GeqL = dt / L;
        const ReqL = 1 / GeqL;

        // Series R + L: total resistance = R + ReqL
        const totalR = R + ReqL;
        const totalG = 1 / totalR;

        // Equivalent current source from inductor history
        // V_eq = ReqL * i_prev → equivalent current source = i_prev
        // In series model, the current source due to inductor state is:
        // I_source = GeqL * ReqL * i_prev = i_prev (adjusted for series)
        const iPrev = prevState.inductorCurrent || 0;
        const Isource = totalG * ReqL * iPrev;

        return {
            conductance: totalG,
            currentSource: Isource,
            updateState: (voltage, current) => {
                this.state.inductorCurrent = current;
                this.state.inductorVoltage = voltage - current * R; // voltage across L only
            }
        };
    }

    getBounds() {
        return {
            x: this.x - 45,
            y: this.y - 20,
            width: 90,
            height: 40
        };
    }
}
