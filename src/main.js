/**
 * Circuit Simulator - Main Entry Point
 * Initializes all modules and wires them together
 */

import { CircuitGraph } from './core/CircuitGraph.js';
import { Canvas } from './ui/Canvas.js';
import { Toolbar } from './ui/Toolbar.js';
import { PropertyPanel } from './ui/PropertyPanel.js';
import { SimulationControls } from './ui/SimulationControls.js';
import { StateManager } from './utils/StateManager.js';
import { testMatrixSolver, MNASolver } from './simulation/index.js';

// Global instances
let circuitGraph;
let canvas;
let toolbar;
let propertyPanel;
let simulationControls;

/**
 * Initialize the application
 */
function init() {
    console.log('🔌 Circuit Simulator initializing...');

    // Create circuit graph
    circuitGraph = new CircuitGraph();

    // Initialize Canvas
    const svgElement = document.getElementById('circuit-canvas');
    if (svgElement) {
        canvas = new Canvas(svgElement, circuitGraph);
    }

    // Initialize Toolbar
    const toolbarElement = document.getElementById('toolbar');
    if (toolbarElement && canvas) {
        toolbar = new Toolbar(toolbarElement, canvas);
    }

    // Initialize Property Panel
    const propertyPanelElement = document.getElementById('property-panel');
    if (propertyPanelElement && canvas) {
        propertyPanel = new PropertyPanel(propertyPanelElement, canvas);
    }

    // Initialize Simulation Controls
    const simulationPanelElement = document.getElementById('simulation-panel');
    if (simulationPanelElement) {
        simulationControls = new SimulationControls(simulationPanelElement, circuitGraph);
    }

    // Setup header buttons
    setupHeaderButtons();

    // Setup collapsible panel sections
    // Setup collapsible panel sections
    setupCollapsibleSections();

    // ----------------------------------------------------
    // State Persistence
    // ----------------------------------------------------

    // Get experiment ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const expId = urlParams.get('expId') || 'sandbox'; // Default if not provided
    console.log(`🔌 Initializing session for experiment: ${expId}`);

    const stateManager = new StateManager(expId);

    // Load previous state if available
    const savedState = stateManager.loadState();
    if (savedState && savedState.circuit) {
        console.log('Restoring saved simulation state...');
        circuitGraph.deserialize(savedState.circuit);

        // Force UI update
        if (canvas) {
            canvas.renderAll();
        }
    } else {
        // Initial save for new session
        stateManager.saveState(circuitGraph);
    }

    // Listen for circuit changes (topology)
    circuitGraph.onChange = (type, data) => {
        // console.log('Circuit changed:', type);
        // Auto-save disabled per user request
        // stateManager.autosave(circuitGraph);
        updateStatus(); // Ensure UI status updates
    };

    // Listen for property changes (values)
    if (propertyPanel) {
        propertyPanel.onPropertyChange = (component, prop, value) => {
            // console.log('Property changed:', prop, value);
            // Auto-save disabled per user request
            // stateManager.autosave(circuitGraph);
        };
    }

    // Expose for debugging/external control
    window.circuitSimulator.stateManager = stateManager;

    // Update status bar
    updateStatus();

    console.log('✅ Circuit Simulator ready!');
}

/**
 * Setup header button actions
 */
function setupHeaderButtons() {
    // New circuit
    document.getElementById('btn-new')?.addEventListener('click', () => {
        if (circuitGraph.getComponentCount() > 0) {
            if (confirm('Clear current circuit? All unsaved changes will be lost.')) {
                canvas.clear();
            }
        }
    });

    // Save circuit
    document.getElementById('btn-save')?.addEventListener('click', () => {
        saveCircuit();
    });

    // Load circuit
    document.getElementById('btn-load')?.addEventListener('click', () => {
        loadCircuit();
    });
}

/**
 * Setup collapsible sections in the right panel
 */
function setupCollapsibleSections() {
    const headers = document.querySelectorAll('.collapsible-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.collapsible-section');
            // Just toggle collapsed class - CSS handles the rest
            section.classList.toggle('collapsed');
        });
    });
}

/**
 * Save circuit to local storage (or file)
 */
/**
 * Save circuit to local storage via StateManager
 */
function saveCircuit() {
    try {
        // Force immediate save
        window.circuitSimulator.stateManager.saveState(circuitGraph);

        // Visual feedback
        const originalText = document.getElementById('btn-save').innerHTML;
        const btn = document.getElementById('btn-save');
        btn.textContent = '✓ Saved';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1000);

        console.log('Circuit saved manually!');
    } catch (error) {
        console.error('Failed to save circuit:', error);
        alert('Failed to save circuit');
    }
}

/**
 * Load circuit from file
 */
function loadCircuit() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // TODO: Deserialize and rebuild circuit
                console.log('Loaded circuit data:', data);
                alert('Circuit loading not fully implemented yet');
            } catch (error) {
                console.error('Failed to load circuit:', error);
                alert('Failed to load circuit: Invalid file');
            }
        };
        reader.readAsText(file);
    });

    input.click();
}

/**
 * Update status bar
 */
function updateStatus() {
    const statusMode = document.getElementById('status-mode');
    const statusCoords = document.getElementById('status-coords');
    const statusZoom = document.getElementById('status-zoom');
    const statusComponents = document.getElementById('status-components');

    if (statusMode) statusMode.textContent = `Mode: ${canvas ? canvas.mode : 'Edit'}`;
    if (statusCoords) statusCoords.textContent = 'X: 0, Y: 0'; // Dynamic
    if (statusZoom) statusZoom.textContent = `Zoom: ${canvas ? Math.round(canvas.zoom * 100) : 100}%`;
    if (statusComponents) statusComponents.textContent = `Components: ${circuitGraph ? circuitGraph.getComponentCount() : 0}`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
window.circuitSimulator = {
    get circuit() { return circuitGraph; },
    get canvas() { return canvas; },
    get toolbar() { return toolbar; },
    get propertyPanel() { return propertyPanel; },
    get simulationControls() { return simulationControls; },
    testMatrix: testMatrixSolver,
    runDC: function () {
        const solver = new MNASolver(circuitGraph);
        const result = solver.solveDC();
        console.log(solver.getResultsString());
        return result;
    }
};
