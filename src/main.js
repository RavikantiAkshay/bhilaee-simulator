/**
 * Circuit Simulator - Main Entry Point
 * Initializes all modules and wires them together
 */

import { CircuitGraph } from './core/CircuitGraph.js';
import { Canvas } from './ui/Canvas.js';
import { Toolbar } from './ui/Toolbar.js';
import { PropertyPanel } from './ui/PropertyPanel.js';
import { SimulationControls } from './ui/SimulationControls.js';

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
 * Save circuit to local storage (or file)
 */
function saveCircuit() {
    try {
        const data = circuitGraph.serialize();
        const json = JSON.stringify(data, null, 2);

        // For now, save to localStorage
        localStorage.setItem('circuit-simulator-save', json);

        // Also offer download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log('Circuit saved!');
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

    if (statusMode) statusMode.textContent = 'Mode: Edit';
    if (statusCoords) statusCoords.textContent = 'X: 0, Y: 0';
    if (statusZoom) statusZoom.textContent = 'Zoom: 100%';
    if (statusComponents) statusComponents.textContent = 'Components: 0';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
window.circuitSimulator = {
    get circuit() { return circuitGraph; },
    get canvas() { return canvas; },
    get toolbar() { return toolbar; },
    get propertyPanel() { return propertyPanel; },
    get simulationControls() { return simulationControls; }
};
