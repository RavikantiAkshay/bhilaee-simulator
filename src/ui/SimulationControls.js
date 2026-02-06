/**
 * SimulationControls.js - Simulation control panel
 * 
 * Handles Run/Stop/Reset and analysis settings.
 * For now, just basic UI - simulation logic comes later.
 */

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

        if (this.onRun) {
            this.onRun(settings);
        } else {
            // Placeholder - actual simulation comes later
            setTimeout(() => {
                this.showOutput(`
                    <div class="output-result">
                        <div class="result-label">Analysis Type</div>
                        <div class="result-value">${settings.analysisType.toUpperCase()}</div>
                    </div>
                    <div class="output-result">
                        <div class="result-label">Components</div>
                        <div class="result-value">${this.circuit.getComponentCount()}</div>
                    </div>
                    <div class="output-result">
                        <div class="result-label">Status</div>
                        <div class="result-value" style="color: var(--accent-secondary)">✓ Circuit valid - Solver pending</div>
                    </div>
                `, 'success');
                this.running = false;
                this.updateButtonStates();
            }, 500);
        }
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
