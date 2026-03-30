/**
 * EnvironmentModels.js — Physics models for sensor environments
 *
 * Each model maintains internal state that evolves over time via update(dt, input).
 * They provide gradual transitions (exponential dynamics), noise, and saturation.
 */

/**
 * Thermal Environment — used by RTD and Thermistor
 *
 * Models a heating element driven by electrical power.
 * Temperature rises exponentially toward a max determined by heater power,
 * and decays exponentially toward ambient when power is removed.
 */
export class ThermalEnvironment {
    /**
     * @param {Object} opts
     * @param {number} opts.ambientTemp   — ambient temperature in °C (default 25)
     * @param {number} opts.timeConstant  — thermal time constant in seconds (default 3)
     * @param {number} opts.maxTemp       — saturation temperature in °C (default 300)
     * @param {number} opts.heaterGain    — °C rise per volt of heater input (default 60)
     * @param {number} opts.noiseAmplitude — random fluctuation in °C (default 0.2)
     */
    constructor(opts = {}) {
        this.ambientTemp = opts.ambientTemp ?? 25;
        this.timeConstant = opts.timeConstant ?? 15;        // Slower default thermal rise
        this.maxTemp = opts.maxTemp ?? 300;
        this.heaterGain = opts.heaterGain ?? 35;          // Lower default °C per volt
        this.noiseAmplitude = opts.noiseAmplitude ?? 0.2;

        // State
        this.temperature = this.ambientTemp;
    }

    /**
     * Advance the thermal state.
     * @param {number} dt      — elapsed time in seconds
     * @param {number} voltage — heater driving voltage (absolute value used)
     * @returns {number} current temperature in °C
     */
    update(dt, voltage) {
        const power = Math.abs(voltage);
        const targetTemp = Math.min(
            this.ambientTemp + power * this.heaterGain,
            this.maxTemp
        );

        // Exponential approach:  T(t+dt) = target + (T(t) - target) * e^(-dt/τ)
        const alpha = 1 - Math.exp(-dt / this.timeConstant);
        this.temperature += (targetTemp - this.temperature) * alpha;

        // Clamp + noise
        this.temperature = Math.max(this.ambientTemp, Math.min(this.temperature, this.maxTemp));
        const noise = (Math.random() - 0.5) * 2 * this.noiseAmplitude;
        return this.temperature + noise;
    }

    /** Reset to ambient */
    reset() {
        this.temperature = this.ambientTemp;
    }
}

/**
 * Mechanical Environment — used by Strain Gauge
 *
 * Models an applied force producing strain in a material.
 * Includes slight smoothing so values don't jump instantly.
 */
export class MechanicalEnvironment {
    /**
     * @param {Object} opts
     * @param {number} opts.smoothingFactor — 0–1, how fast we approach target (default 0.15)
     * @param {number} opts.maxForce       — saturation force in N (default 100)
     * @param {number} opts.youngsModulus   — material stiffness Pa (default 200e9 — steel)
     * @param {number} opts.crossSection   — cross-section area m² (default 1e-6)
     * @param {number} opts.noiseAmplitude  — random fluctuation in strain (default 1e-7)
     */
    constructor(opts = {}) {
        this.smoothingFactor = opts.smoothingFactor ?? 0.15;
        this.maxForce = opts.maxForce ?? 100;
        this.youngsModulus = opts.youngsModulus ?? 200e9;
        this.crossSection = opts.crossSection ?? 1e-6;
        this.noiseAmplitude = opts.noiseAmplitude ?? 1e-7;

        // State
        this.currentForce = 0;
        this.strain = 0;
    }

    /**
     * @param {number} dt    — elapsed time (used for smoothing)
     * @param {number} force — target force in Newtons
     * @returns {{ force: number, strain: number }}
     */
    update(dt, force) {
        const clampedForce = Math.max(0, Math.min(force, this.maxForce));

        // Smooth approach
        this.currentForce += (clampedForce - this.currentForce) * this.smoothingFactor;

        // Strain = Force / (E × A)
        this.strain = this.currentForce / (this.youngsModulus * this.crossSection);

        const noise = (Math.random() - 0.5) * 2 * this.noiseAmplitude;
        return {
            force: this.currentForce,
            strain: this.strain + noise
        };
    }

    reset() {
        this.currentForce = 0;
        this.strain = 0;
    }
}

/**
 * Displacement Environment — used by LVDT
 *
 * Models a core moving inside a transformer.
 * Position set by user slider, with light smoothing.
 */
export class DisplacementEnvironment {
    /**
     * @param {Object} opts
     * @param {number} opts.maxDisplacement — max range in mm (default 10)
     * @param {number} opts.smoothingFactor — 0–1 (default 0.2)
     * @param {number} opts.noiseAmplitude  — mm (default 0.01)
     */
    constructor(opts = {}) {
        this.maxDisplacement = opts.maxDisplacement ?? 10;
        this.smoothingFactor = opts.smoothingFactor ?? 0.2;
        this.noiseAmplitude = opts.noiseAmplitude ?? 0.01;

        // State
        this.displacement = 0; // mm, signed (negative = left, positive = right)
    }

    /**
     * @param {number} dt           — elapsed time
     * @param {number} targetDisplacement — desired position in mm
     * @returns {number} current displacement in mm
     */
    update(dt, targetDisplacement) {
        const clamped = Math.max(-this.maxDisplacement, Math.min(targetDisplacement, this.maxDisplacement));
        this.displacement += (clamped - this.displacement) * this.smoothingFactor;

        const noise = (Math.random() - 0.5) * 2 * this.noiseAmplitude;
        return this.displacement + noise;
    }

    reset() {
        this.displacement = 0;
    }
}
