/**
 * SimulationControls.js - Simulation control panel
 * 
 * Handles Run/Stop/Reset and analysis settings.
 */

import { MNASolver } from '../simulation/MNASolver.js';
import { TransientSolver } from '../simulation/TransientSolver.js';

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

        // Format results for display
        const voltages = {};
        for (const [nodeId, voltage] of result.nodeVoltages) {
            // Clean up node ID for display
            const displayName = this.formatNodeName(nodeId);
            voltages[displayName] = voltage;
        }

        const currents = {};
        for (const [compId, current] of result.branchCurrents) {
            const displayName = this.formatComponentName(compId);
            currents[displayName] = current;
        }

        this.displayResults({ voltages, currents });
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

        // Show final values for each node
        html += '<div class="result-section"><h4>Final Node Voltages</h4>';
        for (const [nodeId, values] of result.results) {
            if (!nodeId.endsWith('_I')) {
                const finalValue = values[values.length - 1];
                const displayName = this.formatNodeName(nodeId);
                html += `<div class="output-result">
                    <span class="result-label">${displayName}</span>
                    <span class="result-value">${finalValue.toFixed(4)} V</span>
                </div>`;
            }
        }
        html += '</div>';

        // Show peak values
        html += '<div class="result-section"><h4>Peak Values</h4>';
        for (const [nodeId, values] of result.results) {
            if (!nodeId.endsWith('_I')) {
                const peak = Math.max(...values.map(Math.abs));
                const displayName = this.formatNodeName(nodeId);
                html += `<div class="output-result">
                    <span class="result-label">${displayName}</span>
                    <span class="result-value">${peak.toFixed(4)} V peak</span>
                </div>`;
            }
        }
        html += '</div>';

        html += '<p style="opacity: 0.7; margin-top: 1rem;">Graph visualization coming soon!</p>';
        html += '</div>';

        this.showOutput(html, 'success');
    }

    /**
     * Format node name for display
     */
    formatNodeName(nodeId) {
        // Extract readable name from node ID like "comp_11_positive"
        const match = nodeId.match(/^comp_(\d+)_(.+)$/);
        if (match) {
            return `Node ${match[1]} (${match[2]})`;
        }
        return nodeId;
    }

    /**
     * Format component name for display
     */
    formatComponentName(compId) {
        // Extract readable name from component ID like "comp_11"
        const match = compId.match(/^comp_(\d+)$/);
        if (match) {
            return `V${match[1]}`;
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
