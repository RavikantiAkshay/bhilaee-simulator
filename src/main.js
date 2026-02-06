/**
 * Circuit Simulator - Main Entry Point
 * Initializes the application and sets up core modules
 */

// App initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 Circuit Simulator initialized');
    
    // TODO: Initialize modules
    // - Canvas
    // - Toolbar (with component registry)
    // - Property Panel
    // - Simulation Controls
    
    // Update status bar
    updateStatus();
});

/**
 * Update status bar information
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

// Track mouse position for status bar
const canvas = document.getElementById('circuit-canvas');
if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        
        const statusCoords = document.getElementById('status-coords');
        if (statusCoords) {
            statusCoords.textContent = `X: ${x}, Y: ${y}`;
        }
    });
}
