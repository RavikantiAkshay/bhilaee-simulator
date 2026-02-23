/**
 * SimulationControls.js - Simulation control panel
 * 
 * Handles Run/Stop/Reset and analysis settings.
 */

import { MNASolver } from '../simulation/MNASolver.js';
import { TransientSolver } from '../simulation/TransientSolver.js';
import { SimpleChart } from './SimpleChart.js';
import { OscilloscopeChart } from './OscilloscopeChart.js';

export class SimulationControls {
    /**
     * @param {HTMLElement} containerElement - The simulation panel container
     * @param {CircuitGraph} circuitGraph - The circuit topology
     */
    constructor(containerElement, circuitGraph) {
        this.container = containerElement;
        this.circuit = circuitGraph;

        // Get UI elements
        this.btnRun = document.getElementById('btn-run');
        this.btnStop = document.getElementById('btn-stop');
        this.btnReset = document.getElementById('btn-reset');
        this.analysisType = document.getElementById('analysis-type');
        this.frequencyInput = document.getElementById('ac-frequency');
        this.simTime = document.getElementById('sim-time');
        this.timeStep = document.getElementById('time-step');

        // Output panel
        this.outputContent = document.getElementById('output-content');
        this.chartOverlay = document.getElementById('chart-overlay');
        this.chartContainer = document.getElementById('chart-container');
        this.chartClose = document.getElementById('chart-close');
        this.chart = null;

        // Oscilloscope overlay
        this.scopeOverlay = document.getElementById('scope-overlay');
        this.scopeContainer = document.getElementById('scope-container');
        this.scopeClose = document.getElementById('scope-close');
        this.scopeChart = null;

        // State
        this.running = false;

        // Callbacks
        this.onRun = null;
        this.onStop = null;
        this.onReset = null;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.btnRun) {
            this.btnRun.addEventListener('click', () => this.run());
        }

        if (this.btnStop) {
            this.btnStop.addEventListener('click', () => this.stop());
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.reset());
        }

        if (this.chartClose) {
            this.chartClose.addEventListener('click', () => this.hideChart());
        }

        if (this.scopeClose) {
            this.scopeClose.addEventListener('click', () => this.hideScope());
        }
    }

    /**
     * Run simulation
     */
    run() {
        // Validate circuit first
        const validation = this.circuit.validate();

        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }

        this.running = true;
        this.updateButtonStates();

        // Show running message
        this.showOutput('Running simulation...', 'info');

        // Get settings
        const settings = this.getSettings();

        // Run the appropriate analysis type
        setTimeout(() => {
            try {
                if (settings.analysisType === 'dc') {
                    this.runDCAnalysis();
                } else if (settings.analysisType === 'ac') {
                    this.runACAnalysis(settings);
                } else if (settings.analysisType === 'transient') {
                    this.runTransientAnalysis(settings);
                }
            } catch (error) {
                this.showErrors([error.message]);
            }

            this.running = false;
            this.updateButtonStates();
        }, 100);
    }

    /**
     * Run DC analysis
     */
    runDCAnalysis() {
        const solver = new MNASolver(this.circuit);
        const result = solver.solveDC();

        if (!result.success) {
            this.showErrors([result.error]);
            return;
        }

        // Format results for display - filter out voltage source terminals
        const voltages = {};
        for (const [nodeId, voltage] of result.nodeVoltages) {
            // Skip voltage source positive/negative terminals (not useful to show)
            if (nodeId.includes('_positive') || nodeId.includes('_negative')) {
                // Check if this is a voltage source
                const match = nodeId.match(/^comp_(\d+)_/);
                if (match) {
                    const compId = `comp_${match[1]}`;
                    const comp = this.circuit.components?.get(compId);
                    if (comp?.constructor.name === 'VoltageSource') continue;
                }
            }
            const displayName = this.formatNodeName(nodeId);
            voltages[displayName] = voltage;
        }

        const currents = {};
        for (const [compId, current] of result.branchCurrents) {
            const comp = this.circuit.components.get(compId);

            // Skip Wattmeters (displayed in their own section)
            if (comp && (comp.constructor.name === 'Wattmeter' || comp.type === 'wattmeter')) continue;

            const displayName = this.formatComponentName(compId);
            const absCurrent = Math.abs(current);
            currents[displayName] = absCurrent;

            // Update Ammeter component if applicable
            if (comp && comp.constructor.name === 'Ammeter') {
                comp.setCurrent(absCurrent);
            }
        }

        // Process Voltmeters
        const voltmeters = {};
        for (const comp of this.circuit.components.values()) {
            if (comp.constructor.name === 'Voltmeter') {
                // Use solver's node ID logic (must match MNA matrix build)
                const n1Id = solver.getNodeId(comp.terminals[0]);
                const n2Id = solver.getNodeId(comp.terminals[1]);

                let v1 = 0, v2 = 0;
                if (n1Id && result.nodeVoltages.has(n1Id)) v1 = result.nodeVoltages.get(n1Id);
                if (n2Id && result.nodeVoltages.has(n2Id)) v2 = result.nodeVoltages.get(n2Id);

                const diff = v1 - v2;
                comp.setVoltage(diff);
                voltmeters[comp.id] = diff;
            }
        }

        // Process Wattmeters
        const wattmeters = {};
        for (const comp of this.circuit.components.values()) {
            if (comp.constructor.name === 'Wattmeter') {
                // Voltage coil (C-V): terminals[2] and terminals[3]
                const nCId = solver.getNodeId(comp.terminals[2]);
                const nVId = solver.getNodeId(comp.terminals[3]);

                let vC = 0, vV = 0;
                if (nCId && result.nodeVoltages.has(nCId)) vC = result.nodeVoltages.get(nCId);
                if (nVId && result.nodeVoltages.has(nVId)) vV = result.nodeVoltages.get(nVId);
                const voltage = vC - vV;

                // Current coil (M-L): wattmeter is tracked as a voltage source
                const currentData = result.branchCurrents.get(comp.id);
                // MNA current direction for voltage source is M -> L?
                // Voltage source current flows from + to - inside source? No, standard element: current enters + leaves -
                // MNA I_src variable usually defined as current flowing from + through source to -.
                // For 0V source, it's just the current in that branch.
                const current = currentData ? Math.abs(currentData) : 0;

                const power = voltage * current;
                comp.setReadings(voltage, current, power);
                wattmeters[comp.id] = { voltage, current, power };
            }
        }

        this.displayResults({ voltages, currents, voltmeters, wattmeters });

        // Hide chart for DC (no time series)
        this.hideChart();

        // Feed oscilloscopes (DC: flat line)
        this.feedOscilloscopesDC(solver, result);
    }

    /**
     * Run AC analysis
     */
    runACAnalysis(settings) {
        const solver = new MNASolver(this.circuit);

        // Use default frequency of 1kHz if not specified
        const frequency = settings.frequency || 1000;
        const result = solver.solveAC(frequency);

        if (!result.success) {
            this.showErrors([result.error]);
            return;
        }

        // Format results for display (complex values with magnitude and phase)
        const voltages = {};
        for (const [nodeId, voltage] of result.nodeVoltages) {
            const displayName = this.formatNodeName(nodeId);
            voltages[displayName] = {
                magnitude: voltage.magnitude(),
                phase: voltage.phaseDegrees(),
                complex: voltage
            };
        }

        const currents = {};
        for (const [compId, current] of result.branchCurrents) {
            const comp = this.circuit.components.get(compId);

            // Skip Wattmeters (displayed in their own section)
            if (comp && (comp.constructor.name === 'Wattmeter' || comp.type === 'wattmeter')) continue;

            const displayName = this.formatComponentName(compId);
            const magnitude = current.magnitude();
            currents[displayName] = {
                magnitude: magnitude,
                phase: current.phaseDegrees(),
                complex: current
            };

            // Update Ammeter component if applicable (show magnitude)
            if (comp && comp.constructor.name === 'Ammeter') {
                comp.setCurrent(magnitude);
            }
        }

        // Process Voltmeters (AC)
        const voltmeters = {};
        for (const comp of this.circuit.components.values()) {
            if (comp.constructor.name === 'Voltmeter') {
                const n1Id = solver.getNodeId(comp.terminals[0]);
                const n2Id = solver.getNodeId(comp.terminals[1]);

                // Get phasors (complex numbers)
                // If node not found or ground, assume 0
                let v1 = { re: 0, im: 0 }, v2 = { re: 0, im: 0 };

                // We need to look up the node voltage object from result.nodeVoltages
                // The map keys are node IDs.
                if (n1Id && result.nodeVoltages.has(n1Id)) v1 = result.nodeVoltages.get(n1Id);
                if (n2Id && result.nodeVoltages.has(n2Id)) v2 = result.nodeVoltages.get(n2Id);

                // Complex difference: (v1_re - v2_re) + j(v1_im - v2_im)
                // Assuming the complex object has .sub() or we do it manually.
                // Looking at MNASolver usage, it uses a Complex class.
                // Let's assume standard operations. 
                // result.nodeVoltages values are Complex instances.

                if (v1 && v2) {
                    // Check if .sub method exists (it should if using Complex class)
                    const vdiff = v1.sub ? v1.sub(v2) : { magnitude: () => 0, phaseDegrees: () => 0 };

                    const mag = vdiff.magnitude();
                    comp.setVoltage(mag);

                    voltmeters[comp.id] = {
                        magnitude: mag,
                        phase: vdiff.phaseDegrees(),
                        complex: vdiff
                    };
                }
            }
        }

        // Process Wattmeters (AC)
        const wattmeters = {};
        for (const comp of this.circuit.components.values()) {
            if (comp.constructor.name === 'Wattmeter') {
                // Voltage coil (C-V): terminals[2] and terminals[3]
                const nCId = solver.getNodeId(comp.terminals[2]);
                const nVId = solver.getNodeId(comp.terminals[3]);

                // Get V_C and V_V phasors
                let vC = { re: 0, im: 0 }, vV = { re: 0, im: 0 };
                // Using solver's Complex class if available or raw object
                // The result.nodeVoltages values are instances of Complex class
                const zero = { real: 0, imag: 0 }; // Fallback

                if (nCId && result.nodeVoltages.has(nCId)) vC = result.nodeVoltages.get(nCId);
                else vC = result.nodeVoltages.values().next().value.constructor.zero(); // Create zero complex

                if (nVId && result.nodeVoltages.has(nVId)) vV = result.nodeVoltages.get(nVId);
                else vV = result.nodeVoltages.values().next().value.constructor.zero();

                // V_coil = V_C - V_V
                const vCoil = vC.sub(vV);

                // Current coil (M-L)
                const currentData = result.branchCurrents.get(comp.id);
                // AC current is a phasor. Direction matches 0V source definition (M->L positive?)
                // Assuming standard definition.
                const iCoil = currentData || vC.constructor.zero();

                // Compute Power: S = V * conj(I)
                // P = Re(S) = Re(V * conj(I))
                // Q = Im(S)
                // Complex class might not have conj(), let's check or implement manually
                // conj(a+jb) = a-jb
                // mul: (ac - bd) + j(ad + bc)
                // Let V = a+jb, I = c+jd, conj(I) = c-jd
                // S = (a+jb)(c-jd) = (ac + bd) + j(-ad + bc)

                const P = vCoil.real * iCoil.real + vCoil.imag * iCoil.imag;
                // const Q = vCoil.imag * iCoil.real - vCoil.real * iCoil.imag;

                const Vmag = vCoil.magnitude();
                const Imag = iCoil.magnitude();

                comp.setReadings(Vmag, Imag, P); // Set readings with Real Power
                // comp.properties.power = P; // Handled in setReadings

                wattmeters[comp.id] = {
                    voltage: Vmag,
                    current: Imag,
                    power: P,
                    complexPower: {
                        real: P,
                        apparent: Vmag * Imag
                    }
                };
            }
        }

        this.displayACResults({ voltages, currents, frequency, wattmeters, voltmeters });

        // Feed oscilloscopes (AC: synthesize waveform from phasor)
        this.feedOscilloscopesAC(solver, result, frequency, settings);
    }

    /**
     * Display AC analysis results with magnitude and phase
     */
    displayACResults(results) {
        if (!results || !this.outputContent) return;

        const freq = results.frequency;
        let html = `<div class="simulation-results">
            <div class="result-header">AC Analysis (${freq} Hz)</div>`;

        // Node voltages
        if (Object.keys(results.voltages).length > 0) {
            html += '<div class="result-section"><h4>Node Voltages (Phasor)</h4>';
            for (const [node, v] of Object.entries(results.voltages)) {
                html += `<div class="output-result">
                    <span class="result-label">${node}</span>
                    <span class="result-value">${v.magnitude.toFixed(4)} V ∠ ${v.phase.toFixed(1)}°</span>
                </div>`;
            }
            html += '</div>';
        }

        // Currents
        if (Object.keys(results.currents).length > 0) {
            html += '<div class="result-section"><h4>Currents (Phasor)</h4>';
            for (const [comp, i] of Object.entries(results.currents)) {
                html += `<div class="output-result">
                    <span class="result-label">${comp}</span>
                    <span class="result-value">${(i.magnitude * 1000).toFixed(4)} mA ∠ ${i.phase.toFixed(1)}°</span>
                </div>`;
            }
            html += '</div>';
        }

        // Wattmeter readings
        if (results.wattmeters && Object.keys(results.wattmeters).length > 0) {
            html += '<div class="result-section"><h4>⚡ Wattmeter Readings</h4>';
            for (const [id, data] of Object.entries(results.wattmeters)) {
                const comp = this.circuit.components.get(id);
                const label = comp ? 'Wattmeter' : id;

                html += `<div class="output-result">
                    <span class="result-label">${label} (${id.replace('comp_', '')})</span>
                    <span class="result-value">${data.power.toFixed(4)} W</span>
                </div>
                <div class="output-result" style="padding-left: 16px; opacity: 0.8;">
                    <span class="result-label">V(C-V)</span>
                    <span class="result-value">${data.voltage.toFixed(4)} V</span>
                </div>
                <div class="output-result" style="padding-left: 16px; opacity: 0.8;">
                    <span class="result-label">I(M-L)</span>
                    <span class="result-value">${(data.current * 1000).toFixed(4)} mA</span>
                </div>`;
            }
            html += '</div>';
        }

        // Voltmeter readings
        if (results.voltmeters && Object.keys(results.voltmeters).length > 0) {
            html += '<div class="result-section"><h4>Voltmeter Readings</h4>';
            for (const [id, val] of Object.entries(results.voltmeters)) {
                const comp = this.circuit.components.get(id);
                const label = comp ? 'Voltmeter' : id;
                html += `<div class="output-result">
                    <span class="result-label">${label} (${id.replace('comp_', '')})</span>
                    <span class="result-value">${val.magnitude.toFixed(4)} V ∠ ${val.phase.toFixed(1)}°</span>
                </div>`;
            }
            html += '</div>';
        }

        html += '</div>';
        this.showOutput(html, 'success');
    }

    /**
     * Run transient analysis
     */
    runTransientAnalysis(settings) {
        const solver = new TransientSolver(this.circuit);

        const endTime = settings.simulationTime || 0.01;
        const timeStep = settings.timeStep || 0.0001;

        const result = solver.solve(endTime, timeStep);

        if (!result.success) {
            this.showErrors([result.error]);
            return;
        }

        this.displayTransientResults(result, solver);
    }

    /**
     * Display transient analysis results (text summary)
     */
    displayTransientResults(result, solver = null) {
        if (!result || !this.outputContent) return;

        const numPoints = result.timePoints.length;
        const endTime = result.timePoints[numPoints - 1] * 1000; // ms

        let html = `<div class="simulation-results">`;
        html += `<div class="result-section"><h4>Transient Analysis</h4>`;
        html += `<p>Simulated ${numPoints} points from 0 to ${endTime.toFixed(2)} ms</p></div>`;

        // Show final values for each node (filter V source terminals)
        html += '<div class="result-section"><h4>Final Values</h4>';
        for (const [nodeId, values] of result.results) {
            // Skip voltage source positive/negative terminals
            if (nodeId.includes('_positive') || nodeId.includes('_negative')) continue;

            const finalValue = values[values.length - 1];
            const displayName = this.formatNodeName(nodeId);
            const unit = nodeId.endsWith('_I') ? ' mA' : ' V';
            const displayValue = nodeId.endsWith('_I') ? finalValue * 1000 : finalValue;
            html += `<div class="output-result">
                <span class="result-label">${displayName}</span>
                <span class="result-value">${displayValue.toFixed(4)}${unit}</span>
            </div>`;
        }
        html += '</div>';

        // Show peak values
        html += '<div class="result-section"><h4>Peak Values</h4>';
        for (const [nodeId, values] of result.results) {
            // Skip voltage source terminals
            if (nodeId.includes('_positive') || nodeId.includes('_negative')) continue;

            const peak = Math.max(...values.map(Math.abs));
            const displayName = this.formatNodeName(nodeId);
            const unit = nodeId.endsWith('_I') ? ' mA peak' : ' V peak';
            const displayValue = nodeId.endsWith('_I') ? peak * 1000 : peak;
            html += `<div class="output-result">
                <span class="result-label">${displayName}</span>
                <span class="result-value">${displayValue.toFixed(4)}${unit}</span>
            </div>`;
        }
        html += '</div></div>';

        this.showOutput(html, 'success');

        // Show chart
        this.showChart(result.timePoints, result.results);

        // Feed oscilloscopes (transient: time-series data)
        this.feedOscilloscopesTransient(result, solver);
    }

    /**
     * Show chart with transient data
     */
    showChart(timePoints, series) {
        if (!this.chartContainer || !this.chartOverlay) return;

        // Show overlay first so container has size
        this.chartOverlay.classList.add('visible');

        // Use setTimeout to allow layout to update before creating/resizing chart
        setTimeout(() => {
            // Create chart if needed
            if (!this.chart) {
                this.chart = new SimpleChart(this.chartContainer, this.circuit);
            } else {
                // Force resize for existing chart
                this.chart.resize();
            }

            // Set data
            this.chart.setData(timePoints, series);
        }, 50);
    }

    /**
     * Hide chart
     */
    hideChart() {
        if (this.chartOverlay) {
            this.chartOverlay.classList.remove('visible');
        }
    }

    // ---- Oscilloscope Data Feed ----

    /**
     * Find all Oscilloscope components in the circuit.
     */
    findOscilloscopes() {
        const scopes = [];
        for (const comp of this.circuit.components.values()) {
            if (comp.constructor.name === 'Oscilloscope') {
                scopes.push(comp);
            }
        }
        return scopes;
    }

    /**
     * Feed oscilloscopes for DC analysis.
     * Displays a flat line at the measured differential voltage.
     */
    feedOscilloscopesDC(solver, result) {
        const scopes = this.findOscilloscopes();
        if (scopes.length === 0) {
            this.hideScope();
            return;
        }

        const allChannels = [];
        for (const scope of scopes) {
            const channels = scope.getChannelConfig();
            for (const ch of channels) {
                let value = 0;
                let unit = 'V';

                if (ch.mode === 'Current') {
                    // Find the virtual VS for this channel and read its branch current
                    for (const vs of solver.voltageSources) {
                        if (vs._isScopeChannel && vs._scopeComponent === scope && vs._channelId === ch.id) {
                            const idx = solver.voltageSources.indexOf(vs);
                            if (result.branchCurrents) {
                                // branchCurrents is a Map, but virtual VS uses the wrapper object
                                // The current is stored by component reference
                                for (const [compId, current] of result.branchCurrents) {
                                    if (compId === vs || compId === scope.id + '_' + ch.id) {
                                        value = Math.abs(current) * 1000; // mA
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    unit = 'mA';
                } else {
                    // Voltage mode
                    const n1Id = solver.getNodeId(ch.posTerminal);
                    const n2Id = solver.getNodeId(ch.negTerminal);
                    let v1 = 0, v2 = 0;
                    if (n1Id && result.nodeVoltages.has(n1Id)) v1 = result.nodeVoltages.get(n1Id);
                    if (n2Id && result.nodeVoltages.has(n2Id)) v2 = result.nodeVoltages.get(n2Id);
                    value = v1 - v2;
                }

                const timePoints = [0, 0.005, 0.01];
                const values = [value, value, value];

                allChannels.push({
                    label: ch.label + ` (${value.toFixed(2)}${unit})`,
                    color: ch.color,
                    timePoints,
                    values
                });
            }
        }

        if (allChannels.length > 0) {
            this.showScope(allChannels);
        }
    }

    /**
     * Feed oscilloscopes for AC analysis.
     * Synthesizes a sinusoidal waveform from phasor magnitude and phase.
     */
    feedOscilloscopesAC(solver, result, frequency, settings = {}) {
        const scopes = this.findOscilloscopes();
        if (scopes.length === 0) {
            this.hideScope();
            return;
        }

        // To ensure the trace isn't a straight line when measuring a 50Hz source 
        // using the default 1000Hz analysis frequency, find the actual source frequency.
        let plotFrequency = frequency;
        // If settings frequency is exactly 1000 (default), try to find an actual AC source frequency
        if (plotFrequency === 1000) {
            for (const comp of this.circuit.components.values()) {
                if (comp.constructor.name === 'VoltageSource' && comp.properties.type === 'ac') {
                    if (comp.properties.frequency) {
                        plotFrequency = comp.properties.frequency;
                        break;
                    }
                }
            }
        }

        const allChannels = [];
        const T = 1 / plotFrequency;

        // Use user-defined simulation time if available, otherwise show 2 cycles
        const totalTime = settings.simulationTime ? settings.simulationTime : (2 * T);

        // Scale number of points based on how many cycles we are trying to show
        // Minimum 300 points, or 50 points per cycle, capped at 10000 points
        const numCycles = totalTime / T;
        const numPoints = Math.min(10000, Math.max(300, Math.ceil(numCycles * 50)));

        const timePoints = [];
        for (let i = 0; i < numPoints; i++) {
            timePoints.push((i / (numPoints - 1)) * totalTime);
        }

        for (const scope of scopes) {
            const channels = scope.getChannelConfig();
            for (const ch of channels) {
                let mag = 0, phaseRad = 0;
                let unit = 'V';

                if (ch.mode === 'Current') {
                    // Read branch current phasor for this channel
                    for (const vs of solver.voltageSources) {
                        if (vs._isScopeChannel && vs._scopeComponent === scope && vs._channelId === ch.id) {
                            for (const [compId, current] of result.branchCurrents) {
                                if (compId === vs.id || compId === vs) {
                                    mag = current.magnitude() * 1000; // mA
                                    phaseRad = Math.atan2(current.imag, current.real);
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    unit = 'mA';
                } else {
                    // Voltage mode
                    const n1Id = solver.getNodeId(ch.posTerminal);
                    const n2Id = solver.getNodeId(ch.negTerminal);
                    let v1 = null, v2 = null;
                    if (n1Id && result.nodeVoltages.has(n1Id)) v1 = result.nodeVoltages.get(n1Id);
                    if (n2Id && result.nodeVoltages.has(n2Id)) v2 = result.nodeVoltages.get(n2Id);

                    if (v1 && v2 && v1.sub) {
                        const vdiff = v1.sub(v2);
                        mag = vdiff.magnitude();
                        phaseRad = Math.atan2(vdiff.imag, vdiff.real);
                    } else if (v1) {
                        mag = v1.magnitude ? v1.magnitude() : 0;
                        phaseRad = v1.phase ? v1.phase() : 0;
                    }
                }

                const omega = 2 * Math.PI * plotFrequency;
                const values = timePoints.map(t => mag * Math.sin(omega * t + phaseRad));

                let displayMag = mag;
                let displayUnit = unit;
                if (unit === 'mA' && mag >= 1000) {
                    displayMag = mag / 1000;
                    displayUnit = 'A';
                }

                allChannels.push({
                    label: ch.label + ` (${displayMag.toFixed(2)}${displayUnit})`,
                    color: ch.color,
                    timePoints,
                    values
                });
            }
        }

        if (allChannels.length > 0) {
            this.showScope(allChannels);
        }
    }

    /**
     * Feed oscilloscopes for transient analysis.
     * Extracts differential voltage time-series from simulation results.
     */
    feedOscilloscopesTransient(result, solver = null) {
        const scopes = this.findOscilloscopes();
        if (scopes.length === 0) {
            this.hideScope();
            return;
        }

        const allChannels = [];

        for (const scope of scopes) {
            const channels = scope.getChannelConfig();
            for (const ch of channels) {
                let values;
                let label = ch.label;

                if (ch.mode === 'Current') {
                    // Find the branch current time series for this channel
                    // It's stored with key = virtual VS component ID or channel key
                    const currentKey = scope.id + '_' + ch.id + '_I';
                    let currentValues = null;
                    for (const [nodeId, vals] of result.results) {
                        if (nodeId === currentKey) {
                            currentValues = vals;
                            break;
                        }
                    }
                    // Convert to mA
                    values = result.timePoints.map((_, i) => {
                        const raw = currentValues ? currentValues[i] : 0;
                        return Math.abs(raw) * 1000;
                    });
                    label += ' (mA)';
                } else {
                    // Voltage mode: differential voltage
                    // Resolve terminal IDs to node IDs via solver for correct lookup
                    const posId = solver ? solver.getNodeId(ch.posTerminal) : ch.posTerminal.id;
                    const negId = solver ? solver.getNodeId(ch.negTerminal) : ch.negTerminal.id;

                    let posValues = null, negValues = null;
                    for (const [nodeId, vals] of result.results) {
                        if (nodeId === posId) posValues = vals;
                        if (nodeId === negId) negValues = vals;
                    }

                    values = result.timePoints.map((_, i) => {
                        const v1 = posValues ? posValues[i] : 0;
                        const v2 = negValues ? negValues[i] : 0;
                        return v1 - v2;
                    });
                }

                allChannels.push({
                    label,
                    color: ch.color,
                    timePoints: [...result.timePoints],
                    values
                });
            }
        }

        if (allChannels.length > 0) {
            this.showScope(allChannels);
        }
    }

    /**
 * Show oscilloscope overlay with channel data.
 */
    showScope(channels) {
        if (!this.scopeContainer || !this.scopeOverlay) return;

        this.scopeOverlay.classList.add('visible');

        setTimeout(() => {
            if (!this.scopeChart) {
                this.scopeChart = new OscilloscopeChart(this.scopeContainer);
            } else {
                this.scopeChart.resize();
            }
            this.scopeChart.setData(channels);
        }, 50);
    }

    /**
     * Hide oscilloscope overlay.
     */
    hideScope() {
        if (this.scopeOverlay) {
            this.scopeOverlay.classList.remove('visible');
        }
    }

    /**
     * Format node name for display - uses short labels matching chart
     */
    formatNodeName(nodeId) {
        // Extract readable name from node ID like "comp_11_positive"
        const match = nodeId.match(/^comp_(\d+)_(.+)$/);
        if (match) {
            const compId = `comp_${match[1]}`;
            const terminal = match[2];

            // Get component type
            let typeChar = '?';
            if (this.circuit && this.circuit.components) {
                const comp = this.circuit.components.get(compId);
                if (comp) {
                    const name = comp.constructor.name;
                    if (name === 'Resistor') typeChar = 'R';
                    else if (name === 'Capacitor') typeChar = 'C';
                    else if (name === 'Inductor') typeChar = 'L';
                    else if (name === 'VoltageSource') typeChar = 'V';
                    else typeChar = name[0];
                }
            }

            // Current trace (e.g. comp_13_I)
            if (terminal === 'I') {
                return `I(${typeChar})`;
            }
            // Voltage labels
            if (terminal === 'left' || terminal === 'right') {
                return `V(${typeChar})`;
            }
            if (terminal === 'positive' || terminal === 'negative') {
                return `V(${typeChar})`;
            }
            return terminal;
        }
        // Current traces
        if (nodeId.endsWith('_I')) {
            const compMatch = nodeId.match(/^comp_(\d+)_I$/);
            if (compMatch) {
                const compId = `comp_${compMatch[1]}`;
                let typeChar = '?';
                if (this.circuit && this.circuit.components) {
                    const comp = this.circuit.components.get(compId);
                    if (comp) {
                        const name = comp.constructor.name;
                        if (name === 'Resistor') typeChar = 'R';
                        else if (name === 'Capacitor') typeChar = 'C';
                        else if (name === 'Inductor') typeChar = 'L';
                        else if (name === 'VoltageSource') typeChar = 'V';
                        else typeChar = name[0];
                    }
                }
                return `I(${typeChar})`;
            }
            return 'I';
        }
        return nodeId;
    }

    /**
     * Format component name for display
     */
    formatComponentName(compId) {
        // Try to get actual component name from circuit
        const component = this.circuit.components?.get(compId);
        if (component) {
            return component.constructor.displayName || component.type;
        }
        // Fallback to simple ID
        const match = compId.match(/^comp_(\d+)$/);
        if (match) {
            return `Source ${match[1]}`;
        }
        return compId;
    }

    /**
     * Stop simulation
     */
    stop() {
        this.running = false;
        this.updateButtonStates();
        this.showOutput('Simulation stopped', 'info');

        if (this.onStop) {
            this.onStop();
        }
    }

    /**
     * Reset simulation
     */
    reset() {
        this.running = false;
        this.updateButtonStates();
        this.showEmpty();

        if (this.onReset) {
            this.onReset();
        }
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            analysisType: this.analysisType?.value || 'dc',
            frequency: parseFloat(this.frequencyInput?.value) || 60,
            simulationTime: parseFloat(this.simTime?.value) || 0.01,
            timeStep: parseFloat(this.timeStep?.value) || 0.0001
        };
    }

    /**
     * Update button states
     */
    updateButtonStates() {
        if (this.btnRun) {
            this.btnRun.disabled = this.running;
        }
        if (this.btnStop) {
            this.btnStop.disabled = !this.running;
        }

        // Update status bar
        const statusMode = document.getElementById('status-mode');
        if (statusMode && this.running) {
            statusMode.textContent = 'Mode: Simulating';
            statusMode.classList.add('status-running');
        } else if (statusMode) {
            statusMode.classList.remove('status-running');
        }
    }

    /**
     * Show errors in output
     */
    showErrors(errors) {
        const errorHtml = errors.map(e =>
            `<div class="output-error">⚠ ${e}</div>`
        ).join('');

        this.showOutput(errorHtml, 'error');
    }

    /**
     * Show output content
     */
    showOutput(content, type = 'info') {
        if (!this.outputContent) return;

        this.outputContent.innerHTML = content;
        this.outputContent.className = `output-content output-${type}`;
    }

    /**
     * Show empty state
     */
    showEmpty() {
        if (!this.outputContent) return;
        this.outputContent.innerHTML = '<p class="placeholder-text">Run simulation to see results</p>';
        this.outputContent.className = 'output-content';
    }

    /**
     * Display simulation results
     */
    displayResults(results) {
        if (!results || !this.outputContent) return;

        let html = '<div class="simulation-results">';

        // Node voltages
        if (results.voltages && Object.keys(results.voltages).length > 0) {
            html += '<div class="result-section"><h4>Node Voltages</h4>';
            for (const [node, voltage] of Object.entries(results.voltages)) {
                html += `<div class="output-result">
                    <span class="result-label">${node}</span>
                    <span class="result-value">${voltage.toFixed(4)} V</span>
                </div>`;
            }
            html += '</div>';
        }

        // Component currents
        if (results.currents && Object.keys(results.currents).length > 0) {
            html += '<div class="result-section"><h4>Currents</h4>';
            for (const [comp, current] of Object.entries(results.currents)) {
                html += `<div class="output-result">
                    <span class="result-label">${comp}</span>
                    <span class="result-value">${(current * 1000).toFixed(4)} mA</span>
                </div>`;
            }
            html += '</div>';
        }

        // Voltmeter readings
        if (results.voltmeters && Object.keys(results.voltmeters).length > 0) {
            html += '<div class="result-section"><h4>Voltmeter Readings</h4>';
            for (const [id, voltage] of Object.entries(results.voltmeters)) {
                // Try to get component name or label
                const comp = this.circuit.components.get(id);
                const label = comp ? (comp.constructor.displayName || 'Volt Meter') : id;

                html += `<div class="output-result">
                    <span class="result-label">${label} (${id.replace('comp_', '')})</span>
                    <span class="result-value">${voltage.toFixed(4)} V</span>
                </div>`;
            }
            html += '</div>';
        }

        // Wattmeter readings
        if (results.wattmeters && Object.keys(results.wattmeters).length > 0) {
            html += '<div class="result-section"><h4>⚡ Wattmeter Readings</h4>';
            for (const [id, data] of Object.entries(results.wattmeters)) {
                const comp = this.circuit.components.get(id);
                const label = comp ? 'Wattmeter' : id;

                html += `<div class="output-result">
                    <span class="result-label">${label} (${id.replace('comp_', '')})</span>
                    <span class="result-value">${data.power.toFixed(4)} W</span>
                </div>
                <div class="output-result" style="padding-left: 16px; opacity: 0.8;">
                    <span class="result-label">V(C-V)</span>
                    <span class="result-value">${data.voltage.toFixed(4)} V</span>
                </div>
                <div class="output-result" style="padding-left: 16px; opacity: 0.8;">
                    <span class="result-label">I(M-L)</span>
                    <span class="result-value">${(data.current * 1000).toFixed(4)} mA</span>
                </div>`;
            }
            html += '</div>';
        }



        html += '</div>';

        this.showOutput(html, 'success');
    }
}
