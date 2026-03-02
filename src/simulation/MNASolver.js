/**
 * MNASolver.js - Modified Nodal Analysis for DC/AC Circuit Simulation
 * 
 * MNA builds a system of equations: G*V = I
 * Where:
 * - G is the conductance/admittance matrix
 * - V is the vector of node voltages
 * - I is the vector of current sources
 * 
 * For voltage sources, MNA adds extra variables (branch currents)
 */

import { Matrix, solveLinearSystem } from './Matrix.js';
import { Complex, ComplexMatrix, solveComplexSystem } from './Complex.js';

export class MNASolver {
    constructor(circuitGraph) {
        this.circuit = circuitGraph;
        this.nodes = [];        // List of node IDs (excluding ground)
        this.nodeMap = new Map();  // node ID -> matrix index
        this.voltageSources = []; // List of voltage sources

        this.transformers = [];   // List of transformers
        this.threePhaseSources = []; // List of 3-phase sources
        this.result = null;
    }

    /**
     * Run DC analysis
     * Uses Newton-Raphson iteration for circuits containing nonlinear elements (diodes).
     * For purely linear circuits, converges in exactly 1 iteration.
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

            // Step 3: Determine system size
            const n = this.nodes.length;
            const m = this.voltageSources.length;
            const t = this.transformers.length;
            const size = n + m + t;

            // Check if circuit has diodes (nonlinear elements)
            const components = this.circuit.getAllComponents();
            this.diodes = components.filter(c => c.constructor.name === 'Diode');
            const hasNonlinear = this.diodes.length > 0;

            // Newton-Raphson settings
            const maxIter = hasNonlinear ? 100 : 1;
            const vtol = 1e-6;  // Voltage convergence tolerance

            // Initial solution guess (all zeros)
            let solution = new Array(size).fill(0);
            // Give a small forward bias initial guess for diodes
            if (hasNonlinear) {
                for (const diode of this.diodes) {
                    const [t1] = diode.terminals;
                    const nIdx = this.getNodeIndex(t1);
                    if (nIdx !== null) solution[nIdx] = 0.6;  // Typical diode forward voltage
                }
            }

            // Debug output
            console.log('=== MNA DC Analysis ===');
            console.log('Nodes:', this.nodes);
            if (hasNonlinear) console.log(`Newton-Raphson: ${this.diodes.length} diode(s) detected`);

            // Step 4: Newton-Raphson iteration
            let converged = false;
            let iter = 0;

            for (iter = 0; iter < maxIter; iter++) {
                // Build system with linearized nonlinear stamps
                const { G, I } = this.buildMNASystem(solution);

                if (iter === 0) {
                    console.log('G matrix:');
                    G.print();
                    console.log('I vector:', I);
                }

                // Solve
                const newSolution = solveLinearSystem(G, I);

                // Clamp OpAmp internal pole AND output node voltages to ±Vsat (output saturation)
                for (const comp of components) {
                    if (comp.constructor.name === 'OpAmp') {
                        const vsat = comp.properties.saturationVoltage || 15;
                        const nPole = this.getNodeIndex(comp.terminals[3]);
                        const nOut = this.getNodeIndex(comp.terminals[2]);
                        if (nPole !== null) {
                            newSolution[nPole] = Math.max(-vsat, Math.min(vsat, newSolution[nPole]));
                        }
                        if (nOut !== null) {
                            newSolution[nOut] = Math.max(-vsat, Math.min(vsat, newSolution[nOut]));
                        }
                    }
                }

                // Check convergence for NR
                if (hasNonlinear) {
                    let maxDiff = 0;
                    for (let i = 0; i < n; i++) {
                        maxDiff = Math.max(maxDiff, Math.abs(newSolution[i] - solution[i]));
                    }
                    solution = newSolution;
                    if (maxDiff < vtol) {
                        converged = true;
                        console.log(`NR converged in ${iter + 1} iteration(s), max ΔV = ${maxDiff.toExponential(2)}`);
                        break;
                    }
                } else {
                    solution = newSolution;
                    converged = true;
                    break;
                }
            }

            if (!converged) {
                console.warn(`NR did not converge after ${maxIter} iterations`);
                // Still return the last solution with a warning
            }

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
     * Stamp non-ideal OpAmp for DC analysis
     */
    stampOpAmp(component, G, I) {
        const props = component.properties;
        const A0 = props.openLoopGain;
        const rout = Math.max(0.001, props.rout);
        const rin = props.rin;
        const ric = props.rin * 50;
        const cmrr_linear = Math.pow(10, props.cmrr / 20);
        const Ac = A0 / cmrr_linear;

        const g_plus = A0 + Ac / 2;
        const g_minus = -A0 + Ac / 2;
        const g_out = 1 / rout;
        const G_id = 1 / rin;
        const G_ic = 1 / ric;

        const nPos = this.getNodeIndex(component.terminals[0]);
        const nNeg = this.getNodeIndex(component.terminals[1]);
        const nOut = this.getNodeIndex(component.terminals[2]);
        const nPole = this.getNodeIndex(component.terminals[3]);

        // Input resistors
        if (nPos !== null) G.add(nPos, nPos, G_id + G_ic);
        if (nNeg !== null) G.add(nNeg, nNeg, G_id + G_ic);
        if (nPos !== null && nNeg !== null) {
            G.add(nPos, nNeg, -G_id);
            G.add(nNeg, nPos, -G_id);
        }

        // Internal pole node (VCVS generating dominant voltage)
        if (nPole !== null) {
            G.add(nPole, nPole, 1.0);
            if (nPos !== null) G.add(nPole, nPos, -g_plus);
            if (nNeg !== null) G.add(nPole, nNeg, -g_minus);
            if (props.offsetVoltage !== 0) {
                I[nPole] += A0 * props.offsetVoltage;
            }
        }

        // Output stage (dependent source buffer + Rout)
        if (nOut !== null) {
            G.add(nOut, nOut, g_out);
            if (nPole !== null) G.add(nOut, nPole, -g_out);
        }
    }

    /**
     * Stamp non-ideal OpAmp for AC analysis
     */
    stampACOpAmp(component, Y, I, omega) {
        const props = component.properties;
        const A0 = props.openLoopGain;
        const rout = Math.max(0.001, props.rout);
        const rin = props.rin;
        const ric = props.rin * 50;
        const cmrr_linear = Math.pow(10, props.cmrr / 20);
        const Ac = A0 / cmrr_linear;

        const g_plus = Complex.fromReal(A0 + Ac / 2);
        const g_minus = Complex.fromReal(-A0 + Ac / 2);
        const g_out = Complex.fromReal(1 / rout);
        const G_id = Complex.fromReal(1 / rin);
        const G_ic = Complex.fromReal(1 / ric);

        const nPos = this.getNodeIndex(component.terminals[0]);
        const nNeg = this.getNodeIndex(component.terminals[1]);
        const nOut = this.getNodeIndex(component.terminals[2]);
        const nPole = this.getNodeIndex(component.terminals[3]);

        if (nPos !== null) Y.add(nPos, nPos, G_id.add(G_ic));
        if (nNeg !== null) Y.add(nNeg, nNeg, G_id.add(G_ic));
        if (nPos !== null && nNeg !== null) {
            Y.add(nPos, nNeg, G_id.neg());
            Y.add(nNeg, nPos, G_id.neg());
        }

        if (nPole !== null) {
            const fp = props.gbp / A0;
            const Cp = 1 / (2 * Math.PI * fp);
            const Ymag = omega * Cp;
            // Pole admittance = 1.0 + j * omega * Cp
            const yPole = new Complex(1.0, Ymag);
            Y.add(nPole, nPole, yPole);

            if (nPos !== null) Y.add(nPole, nPos, g_plus.neg());
            if (nNeg !== null) Y.add(nPole, nNeg, g_minus.neg());

            if (props.offsetVoltage !== 0) {
                const I_os = Complex.fromReal(A0 * props.offsetVoltage);
                // I vector requires assigning complex directly, not null check
                I[nPole] = I[nPole] ? I[nPole].add(I_os) : I_os;
            }
        }

        if (nOut !== null) {
            Y.add(nOut, nOut, g_out);
            if (nPole !== null) Y.add(nOut, nPole, g_out.neg());
        }
    }
    /**
     * Run AC analysis at a given frequency
     * @param {number} frequency - Frequency in Hz
     * @returns {{ nodeVoltages: Map, branchCurrents: Map, success: boolean, error: string }}
     */
    solveAC(frequency = 1000) {
        try {
            // Build node list
            this.buildNodeList();

            if (this.nodes.length === 0) {
                return { success: false, error: 'No nodes found.' };
            }

            if (!this.hasGround()) {
                return { success: false, error: 'Circuit must have a ground reference.' };
            }

            // Build complex MNA system
            const omega = 2 * Math.PI * frequency;
            const { Y, I } = this.buildACSystem(omega);

            // Debug output
            console.log(`=== MNA AC Analysis @ ${frequency} Hz ===`);
            console.log('Nodes:', this.nodes);
            Y.print('Y matrix:');
            console.log('I vector:', I.map(c => c.toString()));

            // Solve complex system
            const solution = solveComplexSystem(Y, I);
            console.log('Solution:', solution.map(c => c.toPolar()));

            // Extract results
            const nodeVoltages = new Map();
            for (let i = 0; i < this.nodes.length; i++) {
                nodeVoltages.set(this.nodes[i], solution[i]);
            }

            const branchCurrents = new Map();
            for (let i = 0; i < this.voltageSources.length; i++) {
                const vs = this.voltageSources[i];
                branchCurrents.set(vs.id, solution[this.nodes.length + i]);
            }

            this.result = { nodeVoltages, branchCurrents, success: true, frequency };
            return this.result;

        } catch (error) {
            console.error('MNA AC Solver error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build complex admittance matrix for AC analysis
     */
    buildACSystem(omega) {
        const n = this.nodes.length;
        const m = this.voltageSources.length;
        const t = this.transformers.length;
        const tp = this.threePhaseSources ? this.threePhaseSources.length : 0;
        const size = n + m + t + 3 * tp;

        const Y = new ComplexMatrix(size, size);
        const I = new Array(size).fill(null).map(() => Complex.zero());

        const components = this.circuit.getAllComponents();

        for (const component of components) {
            this.stampACComponent(component, Y, I, omega);
        }

        // Stamp virtual voltage sources (e.g. for Oscilloscope current channels)
        for (const vs of this.voltageSources) {
            if (vs._isScopeChannel) {
                this.stampACVoltageSource(vs, Y, I);
            }
        }

        return { Y, I };
    }

    /**
     * Stamp component for AC analysis
     */
    stampACComponent(component, Y, I, omega) {
        const type = component.constructor.name;

        switch (type) {
            case 'Resistor':
                this.stampACResistor(component, Y);
                break;
            case 'Capacitor':
                this.stampACCapacitor(component, Y, omega);
                break;
            case 'Inductor':
                this.stampACInductor(component, Y, omega);
                break;
            case 'VoltageSource':
            case 'Ammeter':
                this.stampACVoltageSource(component, Y, I);
                break;
            case 'Ground':
                break;
            case 'Transformer':
                this.stampACTransformer(component, Y, I, omega);
                break;
            case 'Voltmeter':
                this.stampACVoltmeter(component, Y);
                break;
            case 'Wattmeter':
                this.stampACWattmeter(component, Y, I);
                break;

            case 'ThreePhaseSource':
                this.stampThreePhaseSource(component, Y, I);
                break;

            case 'Diode':
                this.stampACDiode(component, Y, omega);
                break;
            case 'OpAmp':
                this.stampACOpAmp(component, Y, I, omega);
                break;
            case 'Load':
                this.stampACLoad(component, Y, omega);
                break;
            case 'Oscilloscope':
                this.stampACOscilloscope(component, Y);
                break;
        }
    }

    /**
     * Stamp resistor for AC (same as DC, but complex)
     */
    stampACResistor(component, Y) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = Complex.fromReal(1 / component.properties.resistance);

        if (n1 !== null) Y.add(n1, n1, g);
        if (n2 !== null) Y.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            Y.add(n1, n2, g.neg());
            Y.add(n2, n1, g.neg());
        }
    }

    /**
     * Stamp capacitor: Y = jωC
     */
    stampACCapacitor(component, Y, omega) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const C = component.properties.capacitance;
        const y = new Complex(0, omega * C); // jωC

        if (n1 !== null) Y.add(n1, n1, y);
        if (n2 !== null) Y.add(n2, n2, y);
        if (n1 !== null && n2 !== null) {
            Y.add(n1, n2, y.neg());
            Y.add(n2, n1, y.neg());
        }
    }

    /**
     * Stamp inductor: Y = 1/(jωL) = -j/(ωL)
     */
    stampACInductor(component, Y, omega) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const L = component.properties.inductance;
        const y = new Complex(0, -1 / (omega * L)); // 1/(jωL) = -j/(ωL)

        if (n1 !== null) Y.add(n1, n1, y);
        if (n2 !== null) Y.add(n2, n2, y);
        if (n1 !== null && n2 !== null) {
            Y.add(n1, n2, y.neg());
            Y.add(n2, n1, y.neg());
        }
    }

    /**
     * Stamp voltage source for AC
     */
    stampACVoltageSource(component, Y, I) {
        const [tPos, tNeg] = component.terminals;
        const n1 = this.getNodeIndex(tPos);
        const n2 = this.getNodeIndex(tNeg);
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);

        let V = 0;
        let phase = 0;

        if (component.constructor.name !== 'Ammeter') {
            V = component.properties.voltage;
            phase = (component.properties.phase || 0) * Math.PI / 180;
        }

        const Vphasor = Complex.fromPolar(V, phase);

        const one = Complex.one();

        if (n1 !== null) {
            Y.add(n1, vsIndex, one);
            Y.add(vsIndex, n1, one);
        }
        if (n2 !== null) {
            Y.add(n2, vsIndex, one.neg());
            Y.add(vsIndex, n2, one.neg());
        }

        I[vsIndex] = Vphasor;
    }

    /**
     * Stamp Voltmeter for AC (high resistance)
     */
    stampACVoltmeter(component, Y) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = Complex.fromReal(1 / 1e8);

        if (n1 !== null) Y.add(n1, n1, g);
        if (n2 !== null) Y.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            Y.add(n1, n2, g.neg());
            Y.add(n2, n1, g.neg());
        }
    }

    /**
     * Stamp Wattmeter for AC analysis.
     * Current coil (M-L): 0V voltage source
     * Voltage coil (C-V): 100MΩ resistor
     */
    stampACWattmeter(component, Y, I) {
        // Current coil (M-L): 0V voltage source
        const nM = this.getNodeIndex(component.terminals[0]); // M
        const nL = this.getNodeIndex(component.terminals[1]); // L
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);

        const one = Complex.one();

        if (nM !== null) {
            Y.add(nM, vsIndex, one);
            Y.add(vsIndex, nM, one);
        }
        if (nL !== null) {
            Y.add(nL, vsIndex, one.neg());
            Y.add(vsIndex, nL, one.neg());
        }
        I[vsIndex] = Complex.zero();

        // Voltage coil (C-V): high resistance
        const nC = this.getNodeIndex(component.terminals[2]); // C
        const nV = this.getNodeIndex(component.terminals[3]); // V
        const g = Complex.fromReal(1 / 1e8);

        if (nC !== null) Y.add(nC, nC, g);
        if (nV !== null) Y.add(nV, nV, g);
        if (nC !== null && nV !== null) {
            Y.add(nC, nV, g.neg());
            Y.add(nV, nC, g.neg());
        }
    }

    /**
     * Stamp non-ideal transformer for AC analysis.
     * Full complex impedance model:
     *   - Series: Zeq = Req + jXeq between P+ and n_mid
     *   - Shunt:  Ysh = 1/Rc + 1/(jXm) between n_mid and P-
     *   - Ideal transformer: a:1 coupling n_mid/P- to S+/S-
     */
    stampACTransformer(component, Y, I, omega) {
        const a = component.properties.turnsRatio;
        const Req = component.properties.Req;
        const Xeq = component.properties.Xeq;
        const Rc = component.properties.Rc;
        const Xm = component.properties.Xm;

        // Terminal node indices
        const nPP = this.getNodeIndex(component.terminals[0]); // primary_pos
        const nPN = this.getNodeIndex(component.terminals[1]); // primary_neg
        const nSP = this.getNodeIndex(component.terminals[2]); // secondary_pos
        const nSN = this.getNodeIndex(component.terminals[3]); // secondary_neg

        // Internal node
        const internalNodeId = `__xfmr_mid_${component.id}`;
        const nMid = this.nodeMap.get(internalNodeId);

        // Extra MNA row index
        const xfmrIdx = this.transformers.indexOf(component);
        const iPrimIdx = this.nodes.length + this.voltageSources.length + xfmrIdx;

        // Add small leakage to ground for stability.
        // The secondary side is galvanically isolated (no physical ground connection),
        // so it needs a larger virtual leakage (~1 GΩ) to act as a numerical ground
        // reference. This prevents the isolated sub-network from creating a singular
        // admittance matrix. The 1e-9 S value is negligible for measurement accuracy
        // but well above the solver's 1e-12 singularity threshold.
        const gleakPri = new Complex(1e-12, 0);
        const gleakSec = new Complex(1e-9, 0);  // larger for isolated secondary
        if (nPP !== null) Y.add(nPP, nPP, gleakPri);
        if (nPN !== null) Y.add(nPN, nPN, gleakPri);
        if (nSP !== null) Y.add(nSP, nSP, gleakSec);
        if (nSN !== null) Y.add(nSN, nSN, gleakSec);

        // 1. Stamp Zeq = Req + jXeq between P+ and n_mid
        //    Admittance Yeq = 1 / (Req + jXeq)
        const Zeq_re = Req;
        const Zeq_im = Xeq; // Xeq = ωLeq, already given as reactance value
        const Zeq_mag2 = Zeq_re * Zeq_re + Zeq_im * Zeq_im;
        const Yeq = new Complex(Zeq_re / Zeq_mag2, -Zeq_im / Zeq_mag2); // 1/(R+jX)

        if (nPP !== null) Y.add(nPP, nPP, Yeq);
        if (nMid !== null) Y.add(nMid, nMid, Yeq);
        if (nPP !== null && nMid !== null) {
            Y.add(nPP, nMid, Yeq.neg());
            Y.add(nMid, nPP, Yeq.neg());
        }

        // 2. Stamp shunt branch: Ysh = 1/Rc + 1/(jXm)
        //    1/Rc is real conductance
        //    1/(jXm) = -j/Xm (susceptance)
        const Ysh = new Complex(1 / Rc, -1 / Xm);

        if (nMid !== null) Y.add(nMid, nMid, Ysh);
        if (nPN !== null) Y.add(nPN, nPN, Ysh);
        if (nMid !== null && nPN !== null) {
            Y.add(nMid, nPN, Ysh.neg());
            Y.add(nPN, nMid, Ysh.neg());
        }

        // 3. Stamp ideal transformer constraint (symmetric MNA formulation)
        //
        // Auxiliary variable x = I_primary (current entering n_mid from the ideal xfmr)
        //
        // Voltage constraint row:
        //   V(n_mid) - V(P-) - a*V(S+) + a*V(S-) = 0
        //
        // KCL column stamps (SYMMETRIC with row for numerical stability):
        //   n_mid: +x,  P-: -x,  S+: -a*x,  S-: +a*x
        //
        // Power conservation: V1*I1 = V2*I2 is maintained because
        //   I_secondary = -a * x  and  V_secondary = V_primary / a
        //   → V2 * I2 = (V1/a) * (a*x) = V1*x = V1*I1  ✓
        //
        const one = Complex.one();
        const negOne = one.neg();
        const ca = Complex.fromReal(a);

        if (nMid !== null) {
            Y.add(iPrimIdx, nMid, one);       // Row: +1 at V(n_mid)
            Y.add(nMid, iPrimIdx, one);        // Col: +x at KCL(n_mid)
        }
        if (nPN !== null) {
            Y.add(iPrimIdx, nPN, negOne);      // Row: -1 at V(P-)
            Y.add(nPN, iPrimIdx, negOne);      // Col: -x at KCL(P-)
        }
        if (nSP !== null) {
            Y.add(iPrimIdx, nSP, ca.neg());    // Row: -a at V(S+)
            Y.add(nSP, iPrimIdx, ca.neg());    // Col: -a*x at KCL(S+)  [symmetric]
        }
        if (nSN !== null) {
            Y.add(iPrimIdx, nSN, ca);          // Row: +a at V(S-)
            Y.add(nSN, iPrimIdx, ca);          // Col: +a*x at KCL(S-)  [symmetric]
        }

        I[iPrimIdx] = Complex.zero();
    }
    /**
     * Build list of unique nodes from circuit
     */
    buildNodeList() {
        this.nodes = [];
        this.nodeMap = new Map();
        this.voltageSources = [];
        this.transformers = [];

        const nodeSet = new Set();
        const components = this.circuit.getAllComponents();

        // Collect all terminals
        for (const component of components) {
            // Track voltage sources, ammeters, and wattmeter current coils
            if (component.constructor.name === 'VoltageSource' || component.constructor.name === 'Ammeter'
                || component.constructor.name === 'Wattmeter') {
                this.voltageSources.push(component);
            }

            // Track oscilloscope with current-mode channels (needs branch current variable)
            if (component.constructor.name === 'Oscilloscope') {
                const channels = component.getChannelConfig();
                for (const ch of channels) {
                    if (ch.mode === 'Current' && ch.posTerminal.isConnected() && ch.negTerminal.isConnected()) {
                        // Register as a "virtual" voltage source for this channel
                        // We store a wrapper object that the stamp method can identify
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

            // Track transformers
            if (component.constructor.name === 'Transformer') {
                this.transformers.push(component);
            }

            // Track 3-phase sources
            if (component.constructor.name === 'ThreePhaseSource') {
                this.threePhaseSources.push(component);
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

        // Add internal nodes for each transformer (n_mid)
        for (let i = 0; i < this.transformers.length; i++) {
            const internalNodeId = `__xfmr_mid_${this.transformers[i].id}`;
            this.nodes.push(internalNodeId);
        }

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
     * @param {Array|null} prevSolution - Previous solution for NR linearization of nonlinear elements
     */
    buildMNASystem(prevSolution = null) {
        const n = this.nodes.length;
        const m = this.voltageSources.length;
        const t = this.transformers.length;  // Each transformer adds 1 row (primary current / voltage constraint)
        const size = n + m + t;

        const G = new Matrix(size, size);
        const I = new Array(size).fill(0);

        const components = this.circuit.getAllComponents();

        for (const component of components) {
            this.stampComponent(component, G, I, prevSolution);
        }

        // Stamp virtual voltage sources for oscilloscope current-mode channels
        for (const vs of this.voltageSources) {
            if (vs._isScopeChannel) {
                this.stampVoltageSource(vs, G, I);
            }
        }

        return { G, I };
    }

    /**
     * Stamp a component into the MNA matrices
     */
    stampComponent(component, G, I, prevSolution = null) {
        const type = component.constructor.name;

        switch (type) {
            case 'Resistor':
                this.stampResistor(component, G);
                break;
            case 'VoltageSource':
            case 'Ammeter':
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
            case 'Transformer':
                this.stampTransformer(component, G, I);
                break;
            case 'Voltmeter':
                this.stampVoltmeter(component, G);
                break;
            case 'Wattmeter':
                this.stampWattmeter(component, G, I);
                break;
            case 'Load':
                this.stampLoad(component, G);
                break;
            case 'Oscilloscope':
                this.stampOscilloscope(component, G, I);
                break;
            case 'Diode':
                this.stampDiode(component, G, I, prevSolution);
                break;
            case 'OpAmp':
                this.stampOpAmp(component, G, I);
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

        // Ammeter has 0V drop
        const V = (component.constructor.name === 'Ammeter') ? 0 : component.properties.voltage;

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
     * Stamp Voltmeter as a very high resistance
     */
    stampVoltmeter(component, G) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);
        const g = 1 / 1e8; // 100M Ohm

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp Oscilloscope — dual mode:
     *   Voltage mode: high-Z (100MΩ) across channel pair (parallel measurement)
     *   Current mode: 0V voltage source (series measurement, like ammeter)
     *   + tiny ground leakage on all terminals for unconnected ones
     */
    stampOscilloscope(component, G, I) {
        const gleak = 1e-12;

        // Ground leakage on every terminal
        for (const terminal of component.terminals) {
            const n = this.getNodeIndex(terminal);
            if (n !== null) G.add(n, n, gleak);
        }

        const channels = component.getChannelConfig();
        for (const ch of channels) {
            if (!ch.posTerminal.isConnected() || !ch.negTerminal.isConnected()) continue;

            if (ch.mode === 'Voltage') {
                // High impedance across pair (voltmeter mode)
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
            // Current mode is handled by stampVoltageSource (registered as virtual VS)
        }
    }

    /**
     * Stamp Diode for DC analysis (Newton-Raphson companion model).
     * 
     * Linearized model at operating point V_D:
     *   G_D = (Is / nVt) * exp(V_D / nVt)  — companion conductance
     *   I_eq = I_D - G_D * V_D              — companion current source
     * 
     * Matrix stamps (anode = n1, cathode = n2):
     *   G(n1,n1) += G_D,  G(n1,n2) -= G_D
     *   G(n2,n1) -= G_D,  G(n2,n2) += G_D
     *   I(n1) -= I_eq  (current out of anode)
     *   I(n2) += I_eq  (current into cathode)
     */
    stampDiode(component, G, I, prevSolution = null) {
        const [t1, t2] = component.terminals;  // anode, cathode
        const n1 = this.getNodeIndex(t1);  // anode node
        const n2 = this.getNodeIndex(t2);  // cathode node

        // Get voltage across diode from previous solution
        const v1 = (prevSolution && n1 !== null) ? prevSolution[n1] : 0;
        const v2 = (prevSolution && n2 !== null) ? prevSolution[n2] : 0;
        const Vd = v1 - v2;

        // Compute linearized model
        const { Id, Gd, Ieq } = component.computeDiodeModel(Vd);

        // Stamp conductance G_D
        if (n1 !== null) G.add(n1, n1, Gd);
        if (n2 !== null) G.add(n2, n2, Gd);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -Gd);
            G.add(n2, n1, -Gd);
        }

        // Stamp equivalent current source I_eq
        // I_eq = I_D - G_D * V_D flows from anode to cathode
        // Into RHS: subtract from anode (n1), add to cathode (n2)
        if (n1 !== null) I[n1] -= Ieq;
        if (n2 !== null) I[n2] += Ieq;
    }

    /**
     * Stamp Oscilloscope for AC analysis (same logic, complex admittance).
     */
    stampACOscilloscope(component, Y) {
        const gleak = 1e-12;

        for (const terminal of component.terminals) {
            const n = this.getNodeIndex(terminal);
            if (n !== null) Y.add(n, n, Complex.fromReal(gleak));
        }

        const channels = component.getChannelConfig();
        for (const ch of channels) {
            if (!ch.posTerminal.isConnected() || !ch.negTerminal.isConnected()) continue;

            if (ch.mode === 'Voltage') {
                const g = 1 / 1e8;
                const gComplex = Complex.fromReal(g);
                const n1 = this.getNodeIndex(ch.posTerminal);
                const n2 = this.getNodeIndex(ch.negTerminal);
                if (n1 !== null) Y.add(n1, n1, gComplex);
                if (n2 !== null) Y.add(n2, n2, gComplex);
                if (n1 !== null && n2 !== null) {
                    Y.add(n1, n2, gComplex.neg());
                    Y.add(n2, n1, gComplex.neg());
                }
            }
            // Current mode handled by stampVoltageSource
        }
    }

    /**
     * Stamp Wattmeter for DC analysis.
     * Current coil (M-C, terminals[0]-terminals[1]): 0V voltage source (ammeter)
     * Voltage coil (L-V, terminals[2]-terminals[3]): 100MΩ resistor (voltmeter)
     */
    stampWattmeter(component, G, I) {
        // Current coil: 0V voltage source between M (0) and L (1)
        const tM = component.terminals[0]; // M
        const tL = component.terminals[1]; // L
        const nM = this.getNodeIndex(tM);
        const nL = this.getNodeIndex(tL);
        const vsIndex = this.nodes.length + this.voltageSources.indexOf(component);

        // Stamp 0V source for current coil
        if (nM !== null) {
            G.add(nM, vsIndex, 1);
            G.add(vsIndex, nM, 1);
        }
        if (nL !== null) {
            G.add(nL, vsIndex, -1);
            G.add(vsIndex, nL, -1);
        }
        I[vsIndex] = 0; // 0V drop

        // Voltage coil: high resistance between C (2) and V (3)
        const nC = this.getNodeIndex(component.terminals[2]); // C
        const nV = this.getNodeIndex(component.terminals[3]); // V
        const g = 1 / 1e8; // 100M Ohm

        if (nC !== null) G.add(nC, nC, g);
        if (nV !== null) G.add(nV, nV, g);
        if (nC !== null && nV !== null) {
            G.add(nC, nV, -g);
            G.add(nV, nC, -g);
        }
    }

    /**
     * Stamp non-ideal transformer for DC analysis.
     * 
     * Equivalent circuit (referred to primary):
     *   P+ ──[ Req ]── n_mid ──┬── ideal xfmr (a:1) ── S+
     *                          │
     *                          Rc (shunt)
     *                          │
     *   P− ────────────────────┴──────────────────────── S−
     * 
     * DC: Xeq = 0 (short), Xm = ∞ (open)
     * So only Req (series) and Rc (shunt) remain.
     * 
     * Ideal transformer adds 2 extra MNA rows:
     *   Row i1: KCL at n_mid includes primary current I_p
     *           V(n_mid) - V(P-) = a * (V(S+) - V(S-))
     *   Row i2: I_p + I_s/a = 0  (or equivalently, a*I_p + I_s = 0)
     *
     * We use the standard MNA ideal transformer stamp:
     *   Extra variable: I_p (primary winding current through ideal xfmr)
     *   Constraint: V(n_mid) - V(P-) - a*(V(S+) - V(S-)) = 0
     *   KCL contribution: I_p enters n_mid, a*I_p enters S+ (with sign conventions)
     */
    stampTransformer(component, G, I) {
        const a = component.properties.turnsRatio;
        const Req = component.properties.Req;
        const Rc = component.properties.Rc;

        // Terminal node indices
        const nPP = this.getNodeIndex(component.terminals[0]); // primary_pos
        const nPN = this.getNodeIndex(component.terminals[1]); // primary_neg
        const nSP = this.getNodeIndex(component.terminals[2]); // secondary_pos
        const nSN = this.getNodeIndex(component.terminals[3]); // secondary_neg

        // Internal node: junction between Req and ideal transformer primary
        const xfmrIdx = this.transformers.indexOf(component);
        const internalNodeId = `__xfmr_mid_${component.id}`;
        const nMid = this.nodeMap.get(internalNodeId);

        // Extra MNA row indices for this transformer
        // After all nodes and voltage sources, we have transformer rows
        const iPrimIdx = this.nodes.length + this.voltageSources.length + xfmrIdx;

        // Add small leakage to ground for stability (prevents singular matrix for floating terminals)
        const gleak = 1e-12;
        if (nPP !== null) G.add(nPP, nPP, gleak);
        if (nPN !== null) G.add(nPN, nPN, gleak);
        if (nSP !== null) G.add(nSP, nSP, gleak);
        if (nSN !== null) G.add(nSN, nSN, gleak);

        // 1. Stamp Req between P+ and n_mid
        if (Req > 0) {
            const gReq = 1 / Req;
            if (nPP !== null) G.add(nPP, nPP, gReq);
            if (nMid !== null) G.add(nMid, nMid, gReq);
            if (nPP !== null && nMid !== null) {
                G.add(nPP, nMid, -gReq);
                G.add(nMid, nPP, -gReq);
            }
        }

        // 2. Stamp Rc (shunt) between n_mid and P-
        if (Rc > 0 && isFinite(Rc)) {
            const gRc = 1 / Rc;
            if (nMid !== null) G.add(nMid, nMid, gRc);
            if (nPN !== null) G.add(nPN, nPN, gRc);
            if (nMid !== null && nPN !== null) {
                G.add(nMid, nPN, -gRc);
                G.add(nPN, nMid, -gRc);
            }
        }

        // 3. Stamp ideal transformer: V(n_mid) - V(P-) = a * (V(S+) - V(S-))
        //    Uses two extra MNA variables.
        //
        //    We model the ideal transformer with:
        //    Extra variable I_p (current into primary of ideal xfmr)
        //
        //    KCL at n_mid:  ... + I_p = 0   (I_p flows into n_mid from ideal xfmr)
        //    KCL at P-:     ... - I_p = 0   (I_p returns via P-)
        //    KCL at S+:     ... - a*I_p = 0 (secondary current = -I_p/a, but power balance)
        //    KCL at S-:     ... + a*I_p = 0
        //    Wait — let me use the standard formulation:
        //
        //    For ideal transformer with turns ratio a:
        //    V1 = a * V2   and   I1 = -I2 / a
        //    where V1 = V(n_mid) - V(P-), V2 = V(S+) - V(S-)
        //    I1 = I_p (current into primary), I2 = current out of S+
        //
        //    MNA stamp (extra row for voltage constraint, I_p as extra variable):
        //    Row iPrimIdx (voltage constraint): V(n_mid) - V(P-) - a*(V(S+) - V(S-)) = 0
        //    Column iPrimIdx (current I_p contributes to KCL):
        //      At n_mid: +1 * I_p  (current entering)
        //      At P-:    -1 * I_p  (current leaving)
        //      At S+:    +(1/a) * I_p  (secondary current = I_p/a entering S+... 
        //                                 Actually: I2 = -I1/a = -I_p/a, 
        //                                 so current INTO S+ is I_p/a)
        //      At S-:    -(1/a) * I_p

        // Voltage constraint row (iPrimIdx):
        // V(n_mid) - V(P-) - a*V(S+) + a*V(S-) = 0
        if (nMid !== null) {
            G.add(iPrimIdx, nMid, 1);
            G.add(nMid, iPrimIdx, 1);  // KCL: I_p enters n_mid
        }
        if (nPN !== null) {
            G.add(iPrimIdx, nPN, -1);
            G.add(nPN, iPrimIdx, -1);  // KCL: I_p leaves P-
        }
        if (nSP !== null) {
            G.add(iPrimIdx, nSP, -a);
            G.add(nSP, iPrimIdx, 1 / a); // KCL: I_p/a enters S+
        }
        if (nSN !== null) {
            G.add(iPrimIdx, nSN, a);
            G.add(nSN, iPrimIdx, -1 / a); // KCL: I_p/a leaves S-
        }

        // Voltage constraint: V(n_mid) - V(P-) - a*(V(S+) - V(S-)) = 0
        I[iPrimIdx] = 0;
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

    /**
     * Stamp Three Phase Source (Star/Wye)
     * Adds 3 voltage constraints constraints (R-N, Y-N, B-N)
     */
    stampThreePhaseSource(component, Y, I) {
        // Terminals: R(0), Y(1), B(2), N(3)
        const nR = this.getNodeIndex(component.terminals[0]);
        const nY = this.getNodeIndex(component.terminals[1]);
        const nB = this.getNodeIndex(component.terminals[2]);
        const nN = this.getNodeIndex(component.terminals[3]);

        // Base index for 3 extra rows
        const tpIdx = this.threePhaseSources.indexOf(component);
        const baseRow = this.nodes.length + this.voltageSources.length + this.transformers.length + 3 * tpIdx;

        // Vp = V_LL / sqrt(3)
        const Vp = component.properties.voltage / Math.sqrt(3);
        const freq = component.properties.frequency;
        const phaseShift = component.properties.phaseShift || 0;

        // Phases: 0, -120, 120 relative to phaseShift
        const phases = [0, -120, 120];

        // Loop for 3 phases: 0=R, 1=Y, 2=B
        const nodeIndices = [nR, nY, nB];

        for (let k = 0; k < 3; k++) {
            const rowIdx = baseRow + k;
            const nPhase = nodeIndices[k];

            // Calculate Phasor
            const phi = (phaseShift + phases[k]) * Math.PI / 180;
            const Vphasor = Complex.fromPolar(Vp, phi);

            // Stamp Constraint: V(Phase) - V(Neutral) = Vphasor
            // Row 'rowIdx' enforces this.

            const one = Complex.one();

            if (nPhase !== null) {
                Y.add(rowIdx, nPhase, one);      // +V(Phase)
                Y.add(nPhase, rowIdx, one);      // Current entering Phase terminal
            }

            if (nN !== null) {
                Y.add(rowIdx, nN, one.neg());    // -V(Neutral)
                Y.add(nN, rowIdx, one.neg());    // Current leaving Neutral terminal
            }

            I[rowIdx] = Vphasor;
        }
    }

    /**
     * Stamp Load for DC analysis.
     * Load is series R + L. For DC, XL = 0, so stamp only R.
     * At 0% load → open circuit (very high resistance).
     */
    stampLoad(component, G) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);

        const imp = component.getLoadImpedance();
        const R = imp ? imp.R : 1e9; // Open circuit fallback
        const g = 1 / R;

        if (n1 !== null) G.add(n1, n1, g);
        if (n2 !== null) G.add(n2, n2, g);
        if (n1 !== null && n2 !== null) {
            G.add(n1, n2, -g);
            G.add(n2, n1, -g);
        }
    }

    /**
     * Stamp Load for AC analysis.
     * Z = R + jXL → Y = 1/(R + jXL) = (R - jXL) / (R² + XL²)
     * At 0% load → open circuit (tiny admittance).
     */
    stampACLoad(component, Y, omega) {
        const [t1, t2] = component.terminals;
        const n1 = this.getNodeIndex(t1);
        const n2 = this.getNodeIndex(t2);

        const imp = component.getLoadImpedance();

        let y;
        if (!imp) {
            // Open circuit: very small admittance
            y = new Complex(1e-12, 0);
        } else {
            // Y = 1/(R + jXL) = (R - jXL) / (R² + XL²)
            const R = imp.R;
            const XL = imp.XL;
            const denom = R * R + XL * XL;
            y = new Complex(R / denom, -XL / denom);
        }

        if (n1 !== null) Y.add(n1, n1, y);
        if (n2 !== null) Y.add(n2, n2, y);
        if (n1 !== null && n2 !== null) {
            Y.add(n1, n2, y.neg());
            Y.add(n2, n1, y.neg());
        }
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