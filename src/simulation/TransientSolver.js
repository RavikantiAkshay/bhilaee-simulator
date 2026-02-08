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
            for (const vs of this.voltageSources) {
                this.results.set(vs.id + '_I', []);
            }

            console.log(`=== Transient Analysis: 0 to ${endTime * 1000}ms, step=${timeStep * 1e6}µs ===`);

            // Time stepping loop
            while (this.time <= this.endTime) {
                // Build and solve system for this time step
                const solution = this.solveTimeStep();

                // Store results
                this.timePoints.push(this.time);
                for (let i = 0; i < this.nodes.length; i++) {
                    this.results.get(this.nodes[i]).push(solution[i]);
                }
                for (let i = 0; i < this.voltageSources.length; i++) {
                    const vs = this.voltageSources[i];
                    this.results.get(vs.id + '_I').push(solution[this.nodes.length + i]);
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
            if (component.constructor.name === 'VoltageSource') {
                this.voltageSources.push(component);
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
            }
        }
    }

    /**
     * Solve for one time step
     */
    solveTimeStep() {
        const n = this.nodes.length;
        const m = this.voltageSources.length;
        const size = n + m;

        const G = new Matrix(size, size);
        const I = new Array(size).fill(0);

        const components = this.circuit.getAllComponents();

        for (const component of components) {
            this.stampComponent(component, G, I);
        }

        return solveLinearSystem(G, I);
    }

    /**
     * Stamp component with companion model
     */
    stampComponent(component, G, I) {
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
            case 'Ground':
                break;
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

        // Current source representing stored current
        if (n1 !== null) I[n1] += iPrev;
        if (n2 !== null) I[n2] -= iPrev;
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
            }
        }
    }
}
