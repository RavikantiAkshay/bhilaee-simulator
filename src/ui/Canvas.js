/**
 * Canvas.js - Main circuit canvas
 * 
 * Handles:
 * - Component rendering and placement
 * - Wire drawing
 * - Selection and movement
 * - Zoom and pan
 */

import { Wire } from '../core/Wire.js';

export class Canvas {
    /**
     * @param {SVGSVGElement} svgElement - The main SVG canvas
     * @param {CircuitGraph} circuitGraph - Circuit topology manager
     */
    constructor(svgElement, circuitGraph) {
        this.svg = svgElement;
        this.circuit = circuitGraph;

        // Get layer groups
        this.componentsLayer = svgElement.querySelector('#components-layer');
        this.wiresLayer = svgElement.querySelector('#wires-layer');
        this.interactionLayer = svgElement.querySelector('#interaction-layer');

        // View state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.gridSize = 20;

        // Interaction state
        this.mode = 'select'; // 'select', 'place', 'wire'
        this.selectedComponent = null;
        this.selectedWire = null;
        this.dragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };

        // Component placement
        this.placingComponent = null;
        this.placingComponentClass = null;

        // Wire drawing
        this.drawingWire = null;
        this.wirePreview = null;

        // Callbacks
        this.onSelectionChange = null;
        this.onComponentCountChange = null;

        this.setupEventListeners();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.svg.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        this.svg.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Prevent context menu on canvas
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

        // Zoom controls
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-fit')?.addEventListener('click', () => this.zoomFit());
    }

    /**
     * Get mouse position in SVG coordinates
     */
    getMousePosition(event) {
        const rect = this.svg.getBoundingClientRect();
        const x = (event.clientX - rect.left - this.panX) / this.zoom;
        const y = (event.clientY - rect.top - this.panY) / this.zoom;
        return { x, y };
    }

    /**
     * Snap position to grid
     */
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.gridSize) * this.gridSize,
            y: Math.round(y / this.gridSize) * this.gridSize
        };
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        if (event.button !== 0) return; // Left click only

        const pos = this.getMousePosition(event);
        const snapped = this.snapToGrid(pos.x, pos.y);

        // Check if clicking on a terminal (start wire drawing)
        const terminalHit = this.circuit.findTerminalAt(pos.x, pos.y);
        if (terminalHit) {
            this.startWireDrawing(terminalHit.terminal);
            return;
        }

        // Check if clicking on a component
        const component = this.circuit.findComponentAt(pos.x, pos.y);
        if (component) {
            this.selectComponent(component);
            this.startDragging(component, pos);
            return;
        }

        // Check if clicking on a wire
        const wire = this.circuit.findWireAt(pos.x, pos.y);
        if (wire) {
            this.selectWire(wire);
            return;
        }

        // Clicked on empty space - deselect
        this.deselectAll();
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        const pos = this.getMousePosition(event);
        const snapped = this.snapToGrid(pos.x, pos.y);

        // Update status bar coordinates
        const statusCoords = document.getElementById('status-coords');
        if (statusCoords) {
            statusCoords.textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;
        }

        // Dragging component
        if (this.dragging && this.selectedComponent) {
            const newX = snapped.x + this.dragOffset.x;
            const newY = snapped.y + this.dragOffset.y;
            this.selectedComponent.moveTo(newX, newY);

            // Update connected wires
            this.updateConnectedWires(this.selectedComponent);
        }

        // Drawing wire
        if (this.drawingWire) {
            this.drawingWire.updatePreview(pos.x, pos.y);
        }

        // Placing component (following cursor)
        if (this.placingComponent) {
            this.placingComponent.moveTo(snapped.x, snapped.y);
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(event) {
        const pos = this.getMousePosition(event);

        // End dragging
        if (this.dragging) {
            this.dragging = false;
        }

        // Complete wire drawing
        if (this.drawingWire) {
            const terminalHit = this.circuit.findTerminalAt(pos.x, pos.y);
            if (terminalHit && terminalHit.terminal !== this.drawingWire.startTerminal) {
                // Complete the wire
                this.drawingWire.setEndTerminal(terminalHit.terminal);
                this.circuit.addWire(this.drawingWire);

                // Replace preview with final wire
                if (this.wirePreview) {
                    this.wiresLayer.removeChild(this.wirePreview);
                }
                const wireElement = this.drawingWire.render();
                this.wiresLayer.appendChild(wireElement);
            } else {
                // Cancel wire drawing
                if (this.wirePreview) {
                    this.wiresLayer.removeChild(this.wirePreview);
                }
            }

            this.drawingWire = null;
            this.wirePreview = null;
        }

        // Place component
        if (this.placingComponent) {
            this.circuit.addComponent(this.placingComponent);
            this.updateComponentCount();
            this.selectComponent(this.placingComponent);
            this.placingComponent = null;
            this.placingComponentClass = null;
            this.mode = 'select';
            this.updateStatusMode();
        }
    }

    /**
     * Handle double click (rotate component)
     */
    handleDoubleClick(event) {
        const pos = this.getMousePosition(event);
        const component = this.circuit.findComponentAt(pos.x, pos.y);

        if (component) {
            component.rotate();
            this.updateConnectedWires(component);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(event) {
        // Don't handle if typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
            return;
        }

        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'Escape':
                this.cancelPlacement();
                this.deselectAll();
                break;
            case 'r':
            case 'R':
                if (this.selectedComponent) {
                    this.selectedComponent.rotate();
                    this.updateConnectedWires(this.selectedComponent);
                }
                break;
        }
    }

    /**
     * Start placing a component
     */
    startPlacement(ComponentClass) {
        // Cancel any existing placement
        this.cancelPlacement();

        // Create new component at center of visible area
        const rect = this.svg.getBoundingClientRect();
        const centerX = (rect.width / 2 - this.panX) / this.zoom;
        const centerY = (rect.height / 2 - this.panY) / this.zoom;
        const snapped = this.snapToGrid(centerX, centerY);

        this.placingComponent = new ComponentClass(snapped.x, snapped.y);
        this.placingComponentClass = ComponentClass;
        this.mode = 'place';

        // Render and add to canvas
        const element = this.placingComponent.render();
        element.style.opacity = '0.7';
        this.componentsLayer.appendChild(element);

        this.updateStatusMode();
    }

    /**
     * Cancel component placement
     */
    cancelPlacement() {
        if (this.placingComponent && this.placingComponent.element) {
            this.componentsLayer.removeChild(this.placingComponent.element);
        }
        this.placingComponent = null;
        this.placingComponentClass = null;
        this.mode = 'select';
        this.updateStatusMode();
    }

    /**
     * Place a component at specific position
     */
    placeComponentAt(ComponentClass, x, y) {
        const snapped = this.snapToGrid(x, y);
        const component = new ComponentClass(snapped.x, snapped.y);

        const element = component.render();
        this.componentsLayer.appendChild(element);
        this.circuit.addComponent(component);

        this.updateComponentCount();
        return component;
    }

    /**
     * Start wire drawing
     */
    startWireDrawing(terminal) {
        this.mode = 'wire';
        this.drawingWire = new Wire(terminal, null);
        this.wirePreview = this.drawingWire.render(true);
        this.wiresLayer.appendChild(this.wirePreview);
        this.updateStatusMode();
    }

    /**
     * Start dragging a component
     */
    startDragging(component, mousePos) {
        this.dragging = true;
        const snapped = this.snapToGrid(mousePos.x, mousePos.y);
        this.dragOffset = {
            x: component.x - snapped.x,
            y: component.y - snapped.y
        };
    }

    /**
     * Select a component
     */
    selectComponent(component) {
        this.deselectAll();
        component.select();
        this.selectedComponent = component;

        if (this.onSelectionChange) {
            this.onSelectionChange('component', component);
        }
    }

    /**
     * Select a wire
     */
    selectWire(wire) {
        this.deselectAll();
        wire.select();
        this.selectedWire = wire;

        if (this.onSelectionChange) {
            this.onSelectionChange('wire', wire);
        }
    }

    /**
     * Deselect all
     */
    deselectAll() {
        this.circuit.deselectAll();
        this.selectedComponent = null;
        this.selectedWire = null;

        if (this.onSelectionChange) {
            this.onSelectionChange(null, null);
        }
    }

    /**
     * Delete selected component or wire
     */
    deleteSelected() {
        if (this.selectedComponent) {
            this.circuit.removeComponent(this.selectedComponent.id);
            this.selectedComponent = null;
            this.updateComponentCount();
        }
        if (this.selectedWire) {
            this.circuit.removeWire(this.selectedWire.id);
            this.selectedWire = null;
        }

        if (this.onSelectionChange) {
            this.onSelectionChange(null, null);
        }
    }

    /**
     * Update wires connected to a component
     */
    updateConnectedWires(component) {
        for (const terminal of component.terminals) {
            for (const wire of terminal.connectedWires) {
                wire.updatePath();
            }
        }
    }

    /**
     * Render a component to canvas
     */
    renderComponent(component) {
        const element = component.render();
        this.componentsLayer.appendChild(element);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.circuit.clear();
        this.componentsLayer.innerHTML = '';
        this.wiresLayer.innerHTML = '';
        this.interactionLayer.innerHTML = '';
        this.deselectAll();
        this.updateComponentCount();
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.updateZoom();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.25);
        this.updateZoom();
    }

    /**
     * Fit to view
     */
    zoomFit() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    }

    /**
     * Update zoom transform
     */
    updateZoom() {
        const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        this.componentsLayer.style.transform = transform;
        this.wiresLayer.style.transform = transform;
        this.interactionLayer.style.transform = transform;

        const statusZoom = document.getElementById('status-zoom');
        if (statusZoom) {
            statusZoom.textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
        }
    }

    /**
     * Update status bar mode
     */
    updateStatusMode() {
        const statusMode = document.getElementById('status-mode');
        if (statusMode) {
            const modeText = {
                'select': 'Edit',
                'place': `Placing: ${this.placingComponentClass?.displayName || 'Component'}`,
                'wire': 'Drawing Wire'
            };
            statusMode.textContent = `Mode: ${modeText[this.mode] || 'Edit'}`;
        }
    }

    /**
     * Update component count in status bar
     */
    updateComponentCount() {
        const statusComponents = document.getElementById('status-components');
        if (statusComponents) {
            statusComponents.textContent = `Components: ${this.circuit.getComponentCount()}`;
        }

        if (this.onComponentCountChange) {
            this.onComponentCountChange(this.circuit.getComponentCount());
        }
    }
}
