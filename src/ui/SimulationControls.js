/**
 * SimulationControls.js - Simulation control panel
 * 
 * Handles Run/Stop/Reset and analysis settings.
 */

import { MNASolver } from '../simulation/MNASolver.js';
import { TransientSolver } from '../simulation/TransientSolver.js';
import { SimpleChart } from './SimpleChart.js';

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
        this.simTime = document.getElementById('sim-time');
        this.timeStep = document.getElementById('time-step');

        // Output panel
        this.outputContent = document.getElementById('output-content');
        this.chartOverlay = document.getElementById('chart-overlay');
        this.chartContainer = document.getElementById('chart-container');
        this.chartClose = document.getElementById('chart-close');
        this.chart = null;

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
            const displayName = this.formatComponentName(compId);
            currents[displayName] = Math.abs(current); // Use absolute value
        }

        this.displayResults({ voltages, currents });

        // Hide chart for DC (no time series)
        this.hideChart();
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
            const displayName = this.formatComponentName(compId);
            currents[displayName] = {
                magnitude: current.magnitude(),
                phase: current.phaseDegrees(),
                complex: current
            };
        }

        this.displayACResults({ voltages, currents, frequency });
    }

    /**
     * Display AC analysis results with magnitude and phase
     */
    displayACResults(results) {
        if (!results || !this.outputContent) return;

        let html = `<div class="simulation-results">`;
        html += `<div class="result-section"><h4>AC Analysis @ ${results.frequency} Hz</h4></div>`;

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

        this.displayTransientResults(result);
    }

    /**
     * Display transient analysis results (text summary)
     */
    displayTransientResults(result) {
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
        if (results.voltages) {
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
        if (results.currents) {
            html += '<div class="result-section"><h4>Currents</h4>';
            for (const [comp, current] of Object.entries(results.currents)) {
                html += `<div class="output-result">
                    <span class="result-label">${comp}</span>
                    <span class="result-value">${(current * 1000).toFixed(4)} mA</span>
                </div>`;
            }
            html += '</div>';
        }

        html += '</div>';

        this.showOutput(html, 'success');
    }
}
