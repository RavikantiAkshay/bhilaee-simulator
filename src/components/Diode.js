/**
 * Diode.js - Nonlinear diode component
 * 
 * Uses the Shockley diode equation:
 *   I_D = Is * (exp(V_D / (n * Vt)) - 1)
 * 
 * Where:
 *   Is = saturation current (default 1e-14 A)
 *   n  = emission coefficient (default 1.0)
 *   Vt = thermal voltage ≈ kT/q ≈ 25.85 mV at 300K
 * 
 * Terminals:
 *   anode (+) ──▷|── cathode (-)
 * 
 * Current flows from anode to cathode when forward biased.
 * 
 * Integration:
 *   During Newton-Raphson iteration the diode is linearized as:
 *     G_D = (Is / (n*Vt)) * exp(V_D / (n*Vt))   (companion conductance)
 *     I_eq = I_D - G_D * V_D                      (companion current source)
 *   Stamp G_D into conductance matrix, I_eq into RHS.
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class Diode extends Component {
    constructor(x = 0, y = 0) {
        super('diode', x, y);

        // Two terminals: anode (+) and cathode (-)
        this.terminals = [
            new Terminal(this, 'anode', -30, 0),
            new Terminal(this, 'cathode', 30, 0)
        ];

        this.properties = {
            saturationCurrent: 1e-14,   // Is (A)
            emissionCoefficient: 1.0,   // n
            thermalVoltage: 0.02585     // Vt (V) at ~300K
        };
    }

    static get displayName() {
        return 'Diode';
    }

    static get icon() {
        return `
            <line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/>
            <polygon points="10,6 10,18 22,12" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="22" y1="6" x2="22" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="22" y1="12" x2="30" y2="12" stroke="currentColor" stroke-width="2"/>
        `;
    }

    static get shortcut() {
        return 'D';
    }

    static getDefaultProperties() {
        return {
            saturationCurrent: 1e-14,
            emissionCoefficient: 1.0,
            thermalVoltage: 0.02585
        };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'saturationCurrent', label: 'Is (Sat. Current)', type: 'number', unit: 'A', min: 1e-18 },
            { name: 'emissionCoefficient', label: 'n (Emission Coeff)', type: 'number', unit: '', min: 0.5, max: 3.0 },
            { name: 'thermalVoltage', label: 'Vt (Thermal Voltage)', type: 'number', unit: 'V', min: 0.01 }
        ];
    }

    renderBody() {
        return `
            <!-- Leads -->
            <line x1="-30" y1="0" x2="-10" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="10" y1="0" x2="30" y2="0" stroke="var(--component-stroke)" stroke-width="2"/>
            <!-- Triangle (anode side) -->
            <polygon class="component-body" 
                     points="-10,-10 -10,10 10,0" 
                     stroke-width="2"/>
            <!-- Bar (cathode side) -->
            <line x1="10" y1="-10" x2="10" y2="10" stroke="var(--component-stroke)" stroke-width="2.5"/>
            <!-- Polarity labels -->
            <text x="-22" y="-10" text-anchor="middle" font-size="9" fill="var(--component-text)" font-family="sans-serif">+</text>
            <text x="22" y="-10" text-anchor="middle" font-size="9" fill="var(--component-text)" font-family="sans-serif">−</text>
        `;
    }

    getValueString() {
        return 'Diode';
    }

    getLabel() {
        return 'D';
    }

    // ─── Diode model computation (used by solvers) ───────────────────

    /**
     * Compute the linearized diode model at operating point Vd.
     * Returns { Id, Gd, Ieq } for Newton-Raphson stamping.
     * 
     * @param {number} Vd - Voltage across diode (anode - cathode)
     * @returns {{ Id: number, Gd: number, Ieq: number }}
     */
    computeDiodeModel(Vd) {
        const Is = this.properties.saturationCurrent;
        const n = this.properties.emissionCoefficient;
        const Vt = this.properties.thermalVoltage;
        const nVt = n * Vt;

        // --- Voltage limiting (prevent exponential overflow) ---
        // Critical voltage for limiting
        const Vcrit = nVt * Math.log(nVt / (Math.SQRT2 * Is));

        // Limit Vd to prevent overflow (cap exponent argument at ~40)
        const maxArg = 40;
        const VdLimited = Math.min(Vd, maxArg * nVt);

        // --- Safe exponential ---
        const expVal = Math.exp(VdLimited / nVt);

        // Diode current: I_D = Is * (exp(Vd / nVt) - 1)
        const Id = Is * (expVal - 1);

        // Companion conductance: G_D = dI/dV = (Is / nVt) * exp(Vd / nVt)
        // Enforce minimum conductance for numerical stability
        const Gmin = Is / nVt;  // conductance at Vd=0
        const Gd = Math.max((Is / nVt) * expVal, Gmin);

        // Equivalent current source: I_eq = I_D - G_D * Vd
        const Ieq = Id - Gd * Vd;

        return { Id, Gd, Ieq };
    }

    /**
     * Apply voltage limiting between iterations to improve NR convergence.
     * Limits the change in Vd between iterations.
     * 
     * @param {number} VdNew - New voltage estimate
     * @param {number} VdOld - Previous iteration voltage
     * @returns {number} Limited voltage
     */
    limitVoltage(VdNew, VdOld) {
        const n = this.properties.emissionCoefficient;
        const Vt = this.properties.thermalVoltage;
        const nVt = n * Vt;
        const Vcrit = nVt * Math.log(nVt / (Math.SQRT2 * this.properties.saturationCurrent));

        if (VdNew > Vcrit && Math.abs(VdNew - VdOld) > 2 * nVt) {
            // In the exponential region, limit step size
            if (VdOld > 0) {
                const arg = (VdNew - VdOld) / nVt;
                if (arg > 0) {
                    // Limit positive changes
                    return VdOld + nVt * (2 + Math.log(arg) - 1);
                }
                return VdOld + nVt * 2;
            }
            return nVt * Math.log(VdNew / nVt);
        }

        // For reverse bias or small-signal region, allow full update
        return VdNew;
    }

    /**
     * MNA stamp — not used directly (solver does NR stamping).
     */
    getStamp(nodeMap, frequency = 0) {
        return { G: [], z: [] };
    }

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

    deserialize(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.properties = { ...Diode.getDefaultProperties(), ...data.properties };
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
