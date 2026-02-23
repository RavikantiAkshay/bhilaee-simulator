/**
 * TransientSolver.js - Time-domain transient analysis
 * 
 * Uses Backward Euler numerical integration to solve:
 * - Capacitor: i = C * dv/dt  →  companion model: G = C/h, I = C/h * v(n-1)
 * - Inductor: v = L * di/dt  →  companion model: G = h/L, I = i(n-1)
 * 
 * Where h is the time step
 */

import { Matrix, solveLinearSystem } from './Matrix.js';

export class TransientSolver {
    constructor(circuitGraph) {
        this.circuit = circuitGraph;
        this.nodes = [];
        this.nodeMap = new Map();
        this.voltageSources = [];

        // Simulation state
        this.time = 0;
        this.timeStep = 0.0001; // 100µs default
        this.endTime = 0.01;    // 10ms default

        // Component states (for energy storage elements)
        this.capacitorVoltages = new Map();  // capacitor ID -> voltage
        this.inductorCurrents = new Map();   // inductor ID -> current
        this.diodeVoltages = new Map();      // diode ID -> voltage (for NR)

        // Results
        this.timePoints = [];
        this.results = new Map(); // node/component ID -> array of values
    }

    /**
     * Run transient analysis
     * @param {number} endTime - End time in seconds
     * @param {number} timeStep - Time step in seconds
     * @returns {{ timePoints: number[], results: Map, success: boolean, error: string }}
     */
    solve(endTime = 0.01, timeStep = 0.0001) {
        try {
            this.endTime = endTime;
            this.timeStep = timeStep;
            this.time = 0;

            // Build node list
            this.buildNodeList();

            if (this.nodes.length === 0) {
                return { success: false, error: 'No nodes found.' };
            }

            if (!this.hasGround()) {
                return { success: false, error: 'Circuit must have a ground reference.' };
            }

            // Initialize component states
            this.initializeStates();

            // Initialize result arrays
            this.timePoints = [];
            this.results = new Map();
            for (const node of this.nodes) {
                this.results.set(node, []);
            }
            // Track voltage source currents
            for (const vs of this.voltageSources) {
                this.results.set(vs.id + '_I', []);
            }
            // Track resistor and capacitor currents
            const components = this.circuit.getAllComponents();
            this.resistors = [];
            this.capacitors = [];
            for (const comp of components) {
                if (comp.constructor.name === 'Resistor') {
                    this.resistors.push(comp);
                    this.results.set(comp.id + '_I', []);
                } else if (comp.constructor.name === 'Capacitor') {
                    this.capacitors.push(comp);
                    this.results.set(comp.id + '_I', []);
                } else if (comp.constructor.name === 'Diode') {
                    this.results.set(comp.id + '_I', []);
                }
            }
            this.diodes = components.filter(c => c.constructor.name === 'Diode');

            console.log(`=== Transient Analysis: 0 to ${endTime * 1000}ms, step=${timeStep * 1e6}µs ===`);

            // Time stepping loop
            while (this.time <= this.endTime) {
                // Build and solve system for this time step
                const solution = this.solveTimeStep();

                // Divergence detection
                for (let i = 0; i < solution.length; i++) {
                    if (!isFinite(solution[i]) || Math.abs(solution[i]) > 1e15) {
                        return {
                            success: false,
                            error: `Simulation diverged at t=${(this.time * 1000).toFixed(4)}ms (node value: ${solution[i].toExponential(2)}). Check circuit connectivity and component values.`
                        };
                    }
                }

                // Store results
                this.timePoints.push(this.time);
                for (let i = 0; i < this.nodes.length; i++) {
                    this.results.get(this.nodes[i]).push(solution[i]);
                }
                // Voltage source currents
                for (let i = 0; i < this.voltageSources.length; i++) {
                    const vs = this.voltageSources[i];
                    this.results.get(vs.id + '_I').push(solution[this.nodes.length + i]);
                }
                // Calculate and store resistor currents (I = V/R)
                for (const r of this.resistors) {
                    const [t1, t2] = r.terminals;
                    const n1 = this.getNodeIndex(t1);
                    const n2 = this.getNodeIndex(t2);
                    const v1 = n1 !== null ? solution[n1] : 0;
                    const v2 = n2 !== null ? solution[n2] : 0;
                    const current = (v1 - v2) / r.properties.resistance;
                    this.results.get(r.id + '_I').push(current);
                }
                // Calculate and store capacitor currents (I = C * dv/dt)
                for (const c of this.capacitors) {
                    const [t1, t2] = c.terminals;
                    const n1 = this.getNodeIndex(t1);
                    const n2 = this.getNodeIndex(t2);
                    const v1 = n1 !== null ? solution[n1] : 0;
                    const v2 = n2 !== null ? solution[n2] : 0;
                    const vNow = v1 - v2;
                    const vPrev = this.capacitorVoltages.get(c.id) || 0;
                    const current = c.properties.capacitance * (vNow - vPrev) / this.timeStep;
                    this.results.get(c.id + '_I').push(current);
                }
                // Calculate and store diode currents
                if (this.diodes) {
                    for (const d of this.diodes) {
                        const [t1, t2] = d.terminals;
                        const n1 = this.getNodeIndex(t1);
                        const n2 = this.getNodeIndex(t2);
                        const v1 = n1 !== null ? solution[n1] : 0;
                        const v2 = n2 !== null ? solution[n2] : 0;
                        const Vd = v1 - v2;
                        const { Id } = d.computeDiodeModel(Vd);
                        this.results.get(d.id + '_I').push(Id);
                    }
                }

                // Update component states
                this.updateStates(solution);

                // Advance time
                this.time += this.timeStep;
            }

            console.log(`Completed ${this.timePoints.length} time points`);

            return {
                success: true,
                timePoints: this.timePoints,
                results: this.results
            };

        } catch (error) {
            console.error('Transient Solver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build node list (same as MNA)
     */
    buildNodeList() {
        this.nodes = [];
        this.nodeMap = new Map();
        this.voltageSources = [];

        const nodeSet = new Set();
        const components = this.circuit.getAllComponents();

        for (const component of components) {
            if (component.constructor.name === 'VoltageSource' || component.constructor.name === 'Ammeter') {
                this.voltageSources.push(component);
            }

            // Oscilloscope current-mode channels need branch current variables
            if (component.constructor.name === 'Oscilloscope') {
                const channels = component.getChannelConfig();
                for (const ch of channels) {
                    if (ch.mode === 'Current' && ch.posTerminal.isConnected() && ch.negTerminal.isConnected()) {
                        this.voltageSources.push({
                            id: component.id + '_' + ch.id,
                            _isScopeChannel: true,
                            _scopeComponent: component,
                            _channelId: ch.id,
                            terminals: [ch.posTerminal, ch.negTerminal],
                            constructor: { name: 'OscilloscopeCurrentChannel' },
                            properties: { voltage: 0 }
                        });
                    }
                }
            }

            for (const terminal of component.terminals) {
                const nodeId = this.getNodeId(terminal);
                if (nodeId !== 'ground' && nodeId !== null) {
                    nodeSet.add(nodeId);
                }
            }
        }

        this.nodes = Array.from(nodeSet);
        this.nodes.forEach((nodeId, index) => {
            this.nodeMap.set(nodeId, index);
        });
    }

    /**
     * Get node ID for terminal
     */
    getNodeId(terminal) {
        const netTerminals = this.getNetTerminals(terminal);

        for (const t of netTerminals) {
            if (t.component.constructor.name === 'Ground') {
                return 'ground';
            }
        }

        let minId = terminal.id;
        for (const t of netTerminals) {
            if (t.id < minId) minId = t.id;
        }
        return minId;
    }

    /**
     * Get all terminals in same net
     */
    getNetTerminals(terminal) {
        const visited = new Set();
        const queue = [terminal];
        const terminals = [];

        while (queue.length > 0) {
            const t = queue.shift();
            if (visited.has(t.id)) continue;
            visited.add(t.id);
            terminals.push(t);

            for (const wire of t.connectedWires) {
                const other = wire.getOtherTerminal(t);
                if (other && !visited.has(other.id)) {
                    queue.push(other);
                }
            }
        }

        return terminals;
    }

    /**
     * Check for ground
     */
    hasGround() {
        const components = this.circuit.getAllComponents();
        return components.some(c => c.constructor.name === 'Ground');
    }

    /**
     * Initialize capacitor voltages and inductor currents to zero
     */
    initializeStates() {
        const components = this.circuit.getAllComponents();

        for (const component of components) {
            if (component.constructor.name === 'Capacitor') {
                this.capacitorVoltages.set(component.id, 0);
            } else if (component.constructor.name === 'Inductor') {
                this.inductorCurrents.set(component.id, 0);
            } else if (component.constructor.name === 'Load') {
                this.inductorCurrents.set(component.id + '_L', 0);
            } else if (component.constructor.name === 'Diode') {
                this.diodeVoltages.set(component.id, 0);
            }
        }
    }

    /**
     * Solve for one time step
     * Uses Newton-Raphson iteration when diodes are present.
     */
    solveTimeStep() {
        const n = this.nodes.length;
        const m = this.voltageSources.length;
        const size = n + m;

        const hasNonlinear = this.diodes && this.diodes.length > 0;
        const maxIter = hasNonlinear ? 50 : 1;
        const vtol = 1e-6;

        // Use previous time-step solution as initial guess
        let solution = this._prevSolution || new Array(size).fill(0);

        for (let iter = 0; iter < maxIter; iter++) {
            const G = new Matrix(size, size);
            const I = new Array(size).fill(0);

            const components = this.circuit.getAllComponents();
            for (const component of components) {
                this.stampComponent(component, G, I, solution);
            }

            // Stamp virtual voltage sources for oscilloscope current-mode channels
            for (const vs of this.voltageSources) {
                if (vs._isScopeChannel) {
                    this.stampAmmeter(vs, G, I);
                }
            }

            const newSolution = solveLinearSystem(G, I);

            if (hasNonlinear) {
                let maxDiff = 0;
                for (let i = 0; i < n; i++) {
                    maxDiff = Math.max(maxDiff, Math.abs(newSolution[i] - solution[i]));
                }
                solution = newSolution;
                if (maxDiff < vtol) break;
            } else {
                solution = newSolution;
                break;
            }
        }

        this._prevSolution = solution;
        return solution;
    }

    /**
     * Stamp component with companion model
     */
    stampComponent(component, G, I, prevSolution = null) {
        const type = component.constructor.name;

        switch (type) {
            case 'Resistor':
                this.stampResistor(component, G);
                break;
            case 'Capacitor':
                this.stampCapacitor(component, G, I);
                break;
            case 'Inductor':
                this.stampInductor(component, G, I);
                break;
            case 'VoltageSource':
                this.stampVoltageSource(component, G, I);
                break;
            case 'Ammeter':
                this.stampAmmeter(component, G, I);
                break;
            case 'Voltmeter':
                this.stampVoltmeter(component, G);
                break;
            case 'Ground':
            case 'Junction':
                break;
            case 'Load':
                this.stampLoad(component, G, I);
                break;
            case 'Oscilloscope':
                this.stampOscilloscope(component, G);
                break;
            case 'Diode':
                this.stampDiode(component, G, I, prevSolution);
                break;
        }
    }

    /**
     * Stamp Oscilloscope — dual mode:
     *   Voltage mode: high-Z across channel pair
     *   Current mode: handled by virtual voltage source
     *   + ground leakage on all terminals
     */
    stampOscilloscope(component, G) {
        const gleak = 1e-12;

        for (const terminal of component.terminals) {
            const n = this.getNodeIndex(terminal);
            if (n !== null) G.add(n, n, gleak);
        }

        const channels = component.getChannelConfig();
        for (const ch of channels) {
            if (!ch.posTerminal.isConnected() || !ch.negTerminal.isConnected()) continue;

            if (ch.mode === 'Voltage') {
                const g = 1 / 1e8;
                const n1 = this.getNodeIndex(ch.posTerminal);
                const n2 = this.getNodeIndex(ch.negTerminal);
                if (n1 !== null) G.add(n1, n1, g);
                if (n2 !== null) G.add(n2, n2, g);
                if (n1 !== null && n2 !== null) {
                    G.add(n1, n2, -g);
                    G.add(n2, n1, -g);
                }
            }
            // Current mode: handled by virtual VS in voltageSources list
        }
    }

    /**
     * Stamp resistor (same as DC)
     */
    stampResistor(component, G) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = 1 / component.properties.resistance;

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp capacitor using Backward Euler companion model
     * G = C/h, I_eq = C/h * v(n-1)
     */
    stampCapacitor(component, G, I) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const C = component.properties.capacitance;
        const h = this.timeStep;

        const g = C / h;  // Companion conductance
        const vPrev = this.capacitorVoltages.get(component.id) || 0;
        const iEq = g * vPrev;  // Equivalent current source

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }

        // Current source from n2 to n1
        if (n1 !== null) I[n1] += iEq;
        if (n2 !== null) I[n2] -= iEq;
    }

    /**
     * Stamp inductor using Backward Euler companion model
     * G = h/L, I_eq = i(n-1)
     */
    stampInductor(component, G, I) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const L = component.properties.inductance;
        const h = this.timeStep;

        const g = h / L;  // Companion conductance
        const iPrev = this.inductorCurrents.get(component.id) || 0;

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }

        // Current source: iPrev flows from n1 to n2 (leaves n1, enters n2)
        // MNA convention: I[n] = current entering node n
        if (n1 !== null) I[n1] -= iPrev;
        if (n2 !== null) I[n2] += iPrev;
    }

    /**
     * Stamp voltage source (time-varying for AC)
     */
    stampVoltageSource(component, G, I) {
        const [tPos, tNeg] = component.terminals;
        const n1 = this.getNodeIndex(tPos);
        const n2 = this.getNodeIndex(tNeg);
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);

        // Get time-varying voltage
        let V = component.properties.voltage;
        if (component.properties.type === 'ac') {
            const freq = component.properties.frequency || 50;
            const phase = (component.properties.phase || 0) * Math.PI / 180;
            V = V * Math.sin(2 * Math.PI * freq * this.time + phase);
        }

        if (n1 !== null) {
            G.add(n1, vsIndex, 1);
            G.add(vsIndex, n1, 1);
        }
        if (n2 !== null) {
            G.add(n2, vsIndex, -1);
            G.add(vsIndex, n2, -1);
        }

        I[vsIndex] = V;
    }

    /**
     * Stamp Ammeter as 0V voltage source (same as VoltageSource with V=0)
     */
    stampAmmeter(component, G, I) {
        const [tPos, tNeg] = component.terminals;
        const n1 = this.getNodeIndex(tPos);
        const n2 = this.getNodeIndex(tNeg);
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);

        if (n1 !== null) {
            G.add(n1, vsIndex, 1);
            G.add(vsIndex, n1, 1);
        }
        if (n2 !== null) {
            G.add(n2, vsIndex, -1);
            G.add(vsIndex, n2, -1);
        }

        I[vsIndex] = 0; // 0V drop
    }

    /**
     * Stamp Voltmeter as very high resistance resistor (100MΩ)
     */
    stampVoltmeter(component, G) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = 1 / 1e8; // 100MΩ

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp Load component for transient analysis.
     * Series R-L load using Backward Euler companion model:
     *   Total companion conductance: 1 / (R + L/h)
     *   History current source: iPrev * (L/h) / (R + L/h)
     */
    stampLoad(component, G, I) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);

        const imp = component.getLoadImpedance();

        if (!imp) {
            // Open circuit: very high resistance
            const g = 1e-12;
            if (n1 !== null) G.add(n1, n1, g);
            if (n2 !== null) G.add(n2, n2, g);
            if (n1 !== null && n2 !== null) {
                G.add(n1, n2, -g);
                G.add(n2, n1, -g);
            }
            return;
        }

        const R = imp.R;
        const f = 50; // rated frequency
        const L = imp.XL / (2 * Math.PI * f);
        const h = this.timeStep;

        // Backward Euler series R-L:
        // Companion resistance = R + L/h
        // Companion conductance = 1 / (R + L/h)
        const Rtotal = R + L / h;
        const g = 1 / Rtotal;

        // History current from inductor state
        const iPrev = this.inductorCurrents.get(component.id + '_L') || 0;
        // Current source = iPrev * (L/h) / (R + L/h) = iPrev * (L/h) * g
        const iEq = iPrev * (L / h) * g;

        // Stamp conductance
        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }

        // Stamp history current source (flows from n1 to n2)
        if (n1 !== null) I[n1] -= iEq;
        if (n2 !== null) I[n2] += iEq;
    }

    /**
     * Stamp Diode for transient analysis (Newton-Raphson companion model).
     * Same linearization as DC: G_D conductance + I_eq current source.
     */
    stampDiode(component, G, I, prevSolution = null) {
        const [t1, t2] = component.terminals;  // anode, cathode
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);

        // Get voltage across diode from previous solution
        const v1 = (prevSolution && n1 !== null) ? prevSolution[n1] : 0;
        const v2 = (prevSolution && n2 !== null) ? prevSolution[n2] : 0;
        const Vd = v1 - v2;

        // Compute linearized model
        const { Id, Gd, Ieq } = component.computeDiodeModel(Vd);

        // Stamp conductance
        if (n1 !== null) G.add(n1, n1, Gd);
        if (n2 !== null) G.add(n2, n2, Gd);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -Gd);
            G.add(n2, n1, -Gd);
        }

        // Stamp equivalent current source
        if (n1 !== null) I[n1] -= Ieq;
        if (n2 !== null) I[n2] += Ieq;
    }

    /**
     * Get node index
     */
    getNodeIndex(terminal) {
        const nodeId = this.getNodeId(terminal);
        if (nodeId === 'ground') return null;
        return this.nodeMap.get(nodeId) ?? null;
    }

    /**
     * Update capacitor voltages and inductor currents
     */
    updateStates(solution) {
        const components = this.circuit.getAllComponents();

        for (const component of components) {
            if (component.constructor.name === 'Capacitor') {
                const [t1, t2] = component.terminals;
                const n1 = this.getNodeIndex(t1);
                const n2 = this.getNodeIndex(t2);
                const v1 = n1 !== null ? solution[n1] : 0;
                const v2 = n2 !== null ? solution[n2] : 0;
                this.capacitorVoltages.set(component.id, v1 - v2);
            } else if (component.constructor.name === 'Inductor') {
                const [t1, t2] = component.terminals;
                const n1 = this.getNodeIndex(t1);
                const n2 = this.getNodeIndex(t2);
                const v1 = n1 !== null ? solution[n1] : 0;
                const v2 = n2 !== null ? solution[n2] : 0;
                const L = component.properties.inductance;
                const h = this.timeStep;
                const iPrev = this.inductorCurrents.get(component.id) || 0;
                // i(n) = i(n-1) + h/L * v(n)
                const iNew = iPrev + (h / L) * (v1 - v2);
                this.inductorCurrents.set(component.id, iNew);
            } else if (component.constructor.name === 'Load') {
                const imp = component.getLoadImpedance();
                if (imp) {
                    const [t1, t2] = component.terminals;
                    const n1 = this.getNodeIndex(t1);
                    const n2 = this.getNodeIndex(t2);
                    const v1 = n1 !== null ? solution[n1] : 0;
                    const v2 = n2 !== null ? solution[n2] : 0;
                    const vTotal = v1 - v2;
                    const f = 50;
                    const L = imp.XL / (2 * Math.PI * f);
                    const R = imp.R;
                    const h = this.timeStep;
                    const iPrev = this.inductorCurrents.get(component.id + '_L') || 0;
                    // Current through series R-L: use total voltage and companion model
                    // i(n) = i(n-1) + h/(L) * (vL) where vL = vTotal - i*R
                    // From BE: i(n) = (h * vTotal + L * iPrev) / (L + h * R)
                    const iNew = (h * vTotal + L * iPrev) / (L + h * R);
                    this.inductorCurrents.set(component.id + '_L', iNew);
                }
            }
        }
    }
}
