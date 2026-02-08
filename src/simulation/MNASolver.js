/**
 * MNASolver.js - Modified Nodal Analysis for DC Circuit Simulation
 * 
 * MNA builds a system of equations: G*V = I
 * Where:
 * - G is the conductance matrix
 * - V is the vector of node voltages
 * - I is the vector of current sources
 * 
 * For voltage sources, MNA adds extra variables (branch currents)
 */

import { Matrix, solveLinearSystem } from './Matrix.js';

export class MNASolver {
    constructor(circuitGraph) {
        this.circuit = circuitGraph;
        this.nodes = [];        // List of node IDs (excluding ground)
        this.nodeMap = new Map();  // node ID -> matrix index
        this.voltageSources = []; // List of voltage sources
        this.result = null;
    }

    /**
     * Run DC analysis
     * @returns {{ nodeVoltages: Map, branchCurrents: Map, success: boolean, error: string }}
     */
    solveDC() {
        try {
            // Step 1: Build node list from circuit
            this.buildNodeList();

            if (this.nodes.length === 0) {
                return {
                    success: false,
                    error: 'No nodes found. Add components to the circuit.'
                };
            }

            // Step 2: Check for ground
            if (!this.hasGround()) {
                return {
                    success: false,
                    error: 'Circuit must have a ground reference. Add a Ground component.'
                };
            }

            // Step 3: Build MNA matrices
            const { G, I } = this.buildMNASystem();

            // Debug output
            console.log('=== MNA DC Analysis ===');
            console.log('Nodes:', this.nodes);
            console.log('G matrix:');
            G.print();
            console.log('I vector:', I);

            // Step 4: Solve the system
            const solution = solveLinearSystem(G, I);
            console.log('Solution:', solution);

            // Step 5: Extract results
            const nodeVoltages = new Map();
            for (let i = 0; i < this.nodes.length; i++) {
                nodeVoltages.set(this.nodes[i], solution[i]);
            }

            // Extract branch currents for voltage sources
            const branchCurrents = new Map();
            for (let i = 0; i < this.voltageSources.length; i++) {
                const vs = this.voltageSources[i];
                branchCurrents.set(vs.id, solution[this.nodes.length + i]);
            }

            this.result = { nodeVoltages, branchCurrents, success: true };
            return this.result;

        } catch (error) {
            console.error('MNA Solver error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build list of unique nodes from circuit
     */
    buildNodeList() {
        this.nodes = [];
        this.nodeMap = new Map();
        this.voltageSources = [];

        const nodeSet = new Set();
        const components = this.circuit.getAllComponents();

        // Collect all terminals
        for (const component of components) {
            // Track voltage sources
            if (component.constructor.name === 'VoltageSource') {
                this.voltageSources.push(component);
            }

            for (const terminal of component.terminals) {
                // Get the net/node this terminal belongs to
                const nodeId = this.getNodeId(terminal);
                if (nodeId !== 'ground' && nodeId !== null) {
                    nodeSet.add(nodeId);
                }
            }
        }

        // Convert to array and create index map
        this.nodes = Array.from(nodeSet);
        this.nodes.forEach((nodeId, index) => {
            this.nodeMap.set(nodeId, index);
        });
    }

    /**
     * Get unique node ID for a terminal
     * Returns 'ground' for grounded terminals
     */
    getNodeId(terminal) {
        // Trace through all connected terminals to find ground
        const netTerminals = this.getNetTerminals(terminal);

        // Check if any terminal in this net is a ground
        for (const t of netTerminals) {
            if (t.component.constructor.name === 'Ground') {
                return 'ground';
            }
        }

        // Use smallest terminal ID as the net identifier
        let minId = terminal.id;
        for (const t of netTerminals) {
            if (t.id < minId) minId = t.id;
        }
        return minId;
    }

    /**
     * Get all terminals in the same net (connected by wires)
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

            // Follow wires to other terminals
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
     * Check if circuit has a ground reference
     */
    hasGround() {
        const components = this.circuit.getAllComponents();
        return components.some(c => c.constructor.name === 'Ground');
    }

    /**
     * Build MNA G matrix and I vector
     */
    buildMNASystem() {
        const n = this.nodes.length;
        const m = this.voltageSources.length;
        const size = n + m;

        const G = new Matrix(size, size);
        const I = new Array(size).fill(0);

        const components = this.circuit.getAllComponents();

        for (const component of components) {
            this.stampComponent(component, G, I);
        }

        return { G, I };
    }

    /**
     * Stamp a component into the MNA matrices
     */
    stampComponent(component, G, I) {
        const type = component.constructor.name;

        switch (type) {
            case 'Resistor':
                this.stampResistor(component, G);
                break;
            case 'VoltageSource':
                this.stampVoltageSource(component, G, I);
                break;
            case 'Capacitor':
                // For DC, capacitor is open circuit (infinite impedance)
                // No stamp needed
                break;
            case 'Inductor':
                // For DC, inductor is short circuit (zero impedance)
                // Stamp as wire (very low resistance)
                this.stampInductor(component, G);
                break;
            case 'Ground':
                // Ground is reference, handled separately
                break;
        }
    }

    /**
     * Stamp resistor: adds 1/R to diagonal, -1/R to off-diagonal
     */
    stampResistor(component, G) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = 1 / component.properties.resistance; // conductance

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp inductor as short circuit for DC
     */
    stampInductor(component, G) {
        // For DC steady-state, inductor is a short (wire)
        // Model as very small resistance
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = 1e6; // Very high conductance = low resistance

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp voltage source using MNA extra variables
     */
    stampVoltageSource(component, G, I) {
        const [tPos, tNeg] = component.terminals;
        const n1 = this.getNodeIndex(tPos); // positive terminal
        const n2 = this.getNodeIndex(tNeg); // negative terminal
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);
        const V = component.properties.voltage;

        // Voltage source equations
        if (n1 !== null) {
            G.add(n1, vsIndex, 1);
            G.add(vsIndex, n1, 1);
        }
        if (n2 !== null) {
            G.add(n2, vsIndex, -1);
            G.add(vsIndex, n2, -1);
        }

        // Voltage constraint
        I[vsIndex] = V;
    }

    /**
     * Get matrix index for a terminal's node
     * Returns null if grounded
     */
    getNodeIndex(terminal) {
        const nodeId = this.getNodeId(terminal);
        if (nodeId === 'ground') return null;
        return this.nodeMap.get(nodeId) ?? null;
    }

    /**
     * Get formatted results string
     */
    getResultsString() {
        if (!this.result || !this.result.success) {
            return this.result?.error || 'No results';
        }

        let output = '=== DC Analysis Results ===\n\n';

        output += 'Node Voltages:\n';
        for (const [nodeId, voltage] of this.result.nodeVoltages) {
            output += `  ${nodeId}: ${voltage.toFixed(4)} V\n`;
        }

        if (this.result.branchCurrents.size > 0) {
            output += '\nBranch Currents:\n';
            for (const [vsId, current] of this.result.branchCurrents) {
                output += `  ${vsId}: ${(current * 1000).toFixed(4)} mA\n`;
            }
        }

        return output;
    }
}

/**
 * Test MNA solver with a simple circuit
 */
export function testMNASolver(circuitGraph) {
    console.log('=== MNA Solver Test ===');
    console.log('Please create a simple circuit:');
    console.log('1. Place a Voltage Source (V key)');
    console.log('2. Place a Resistor (R key)');
    console.log('3. Place a Ground (G key)');
    console.log('4. Connect: V+ to R, R to Ground, V- to Ground');
    console.log('Then run: circuitSimulator.runDC()');
}
