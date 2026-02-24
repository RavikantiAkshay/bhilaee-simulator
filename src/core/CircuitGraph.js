/**
 * CircuitGraph.js - Manages the circuit topology
 * 
 * Central manager for all components, wires, and nodes.
 * Handles circuit validation and generates netlist for simulation.
 */

import { Node, resetNodeCounter } from './Node.js';
import { createComponent } from '../components/index.js';
import { Wire, setWireIdCounter } from './Wire.js';
import { setComponentIdCounter } from './Component.js';

export class CircuitGraph {
    constructor() {
        this.components = new Map(); // id -> Component
        this.wires = new Map();      // id -> Wire
        this.nodes = new Map();      // id -> Node
        this.groundNode = null;

        // Event callbacks
        this.onChange = null;
    }

    /**
     * Add a component to the circuit
     * @param {Component} component 
     */
    addComponent(component) {
        this.components.set(component.id, component);
        this.notifyChange('component-added', component);
    }

    /**
     * Remove a component and its connected wires
     * @param {string} componentId 
     */
    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (!component) return;

        // Remove all wires connected to this component
        for (const terminal of component.terminals) {
            for (const wire of [...terminal.connectedWires]) {
                this.removeWire(wire.id);
            }
        }

        // Remove SVG element
        if (component.element && component.element.parentNode) {
            component.element.parentNode.removeChild(component.element);
        }

        this.components.delete(componentId);
        this.notifyChange('component-removed', component);
    }

    /**
     * Add a wire to the circuit
     * @param {Wire} wire 
     */
    addWire(wire) {
        this.wires.set(wire.id, wire);
        this.notifyChange('wire-added', wire);
    }

    /**
     * Remove a wire
     * @param {string} wireId 
     */
    removeWire(wireId) {
        const wire = this.wires.get(wireId);
        if (!wire) return;

        wire.remove();
        this.wires.delete(wireId);
        this.notifyChange('wire-removed', wire);
    }

    /**
     * Get component by ID
     * @param {string} id 
     * @returns {Component|undefined}
     */
    getComponent(id) {
        return this.components.get(id);
    }

    /**
     * Get wire by ID
     * @param {string} id 
     * @returns {Wire|undefined}
     */
    getWire(id) {
        return this.wires.get(id);
    }

    /**
     * Find component at position
     * @param {number} x 
     * @param {number} y 
     * @returns {Component|null}
     */
    findComponentAt(x, y) {
        for (const component of this.components.values()) {
            if (component.containsPoint(x, y)) {
                return component;
            }
        }
        return null;
    }

    /**
     * Find terminal at position
     * @param {number} x 
     * @param {number} y 
     * @param {number} threshold 
     * @returns {{component: Component, terminal: Terminal}|null}
     */
    findTerminalAt(x, y, threshold = 10) {
        for (const component of this.components.values()) {
            const terminal = component.findTerminalAt(x, y, threshold);
            if (terminal) {
                return { component, terminal };
            }
        }
        return null;
    }

    /**
     * Find wire at position
     * @param {number} x 
     * @param {number} y 
     * @returns {Wire|null}
     */
    findWireAt(x, y) {
        for (const wire of this.wires.values()) {
            if (wire.isNear(x, y)) {
                return wire;
            }
        }
        return null;
    }

    /**
     * Deselect all components and wires
     */
    deselectAll() {
        for (const component of this.components.values()) {
            component.deselect();
        }
        for (const wire of this.wires.values()) {
            wire.deselect();
        }
    }

    /**
     * Get all selected components
     * @returns {Component[]}
     */
    getSelectedComponents() {
        return Array.from(this.components.values()).filter(c => c.selected);
    }

    /**
     * Get component count
     * @returns {number}
     */
    getComponentCount() {
        return this.components.size;
    }

    /**
     * Get all components as array
     * @returns {Component[]}
     */
    getAllComponents() {
        return Array.from(this.components.values());
    }

    /**
     * Clear the entire circuit
     */
    clear() {
        // Remove all wires first
        for (const wire of this.wires.values()) {
            wire.remove();
        }
        this.wires.clear();

        // Remove all components
        for (const component of this.components.values()) {
            if (component.element && component.element.parentNode) {
                component.element.parentNode.removeChild(component.element);
            }
        }
        this.components.clear();

        // Clear nodes
        this.nodes.clear();
        this.groundNode = null;
        resetNodeCounter();

        this.notifyChange('circuit-cleared', null);
    }

    /**
     * Build nodes from connections (for circuit analysis)
     * This creates the nodal structure needed for MNA
     */
    buildNodes() {
        this.nodes.clear();
        resetNodeCounter();

        // Map terminal IDs to node IDs
        const terminalToNode = new Map();

        // Find connected sets of terminals using Union-Find
        const parent = new Map();

        const find = (id) => {
            if (!parent.has(id)) parent.set(id, id);
            if (parent.get(id) !== id) {
                parent.set(id, find(parent.get(id)));
            }
            return parent.get(id);
        };

        const union = (a, b) => {
            const rootA = find(a);
            const rootB = find(b);
            if (rootA !== rootB) {
                parent.set(rootB, rootA);
            }
        };

        // Initialize all terminals
        for (const component of this.components.values()) {
            for (const terminal of component.terminals) {
                parent.set(terminal.id, terminal.id);
            }
        }

        // Union terminals connected by wires
        for (const wire of this.wires.values()) {
            if (wire.isComplete()) {
                union(wire.startTerminal.id, wire.endTerminal.id);
            }
        }

        // Group terminals by their root
        const groups = new Map();
        for (const component of this.components.values()) {
            for (const terminal of component.terminals) {
                const root = find(terminal.id);
                if (!groups.has(root)) {
                    groups.set(root, []);
                }
                groups.get(root).push(terminal);
            }
        }

        // Create nodes for each group
        let hasGround = false;
        for (const [root, terminals] of groups) {
            // Check if any terminal belongs to a ground component
            const isGround = terminals.some(t => t.component.type === 'ground');
            const node = new Node(isGround);

            if (isGround) {
                this.groundNode = node;
                hasGround = true;
            }

            for (const terminal of terminals) {
                node.addTerminal(terminal.id);
                terminalToNode.set(terminal.id, node.id);
                terminal.nodeId = node.id;
            }

            this.nodes.set(node.id, node);
        }

        return { terminalToNode, hasGround };
    }

    /**
     * Validate the circuit
     * @returns {{valid: boolean, errors: string[]}}
     */
    validate() {
        const errors = [];

        if (this.components.size === 0) {
            errors.push('Circuit is empty');
            return { valid: false, errors };
        }

        // Build nodes to check connectivity
        const { hasGround } = this.buildNodes();

        // Check for ground
        if (!hasGround) {
            errors.push('Circuit must have a ground reference');
        }

        // Check for floating terminals
        for (const component of this.components.values()) {
            for (const terminal of component.terminals) {
                if (!terminal.isConnected() && component.type !== 'ground' && component.type !== 'transformer' && component.type !== 'oscilloscope') {
                    if (terminal.isHidden) continue;
                    errors.push(`${component.getLabel()} has unconnected terminal: ${terminal.name}`);
                }
            }
        }

        // Check for voltage source
        const hasSources = Array.from(this.components.values()).some(
            c => c.type === 'voltage_source' || c.type === 'current_source' || c.type === 'three_phase_source'
        );
        if (!hasSources) {
            errors.push('Circuit needs at least one source');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Clear the entire circuit
     */
    clear() {
        // Remove all SVG elements
        for (const component of this.components.values()) {
            if (component.element && component.element.parentNode) {
                component.element.parentNode.removeChild(component.element);
            }
        }
        for (const wire of this.wires.values()) {
            if (wire.element && wire.element.parentNode) {
                wire.element.parentNode.removeChild(wire.element);
            }
        }

        // Clear maps
        this.components.clear();
        this.wires.clear();
        this.nodes.clear();
        this.groundNode = null;

        // Reset counters (optional, but good for cleanliness if not preserving IDs)
        // But deserialize sets them specifically, so this is safe.

        this.notifyChange('circuit-cleared', null);
    }

    /**
     * Generate netlist for simulation
     * @returns {Array<{type: string, nodes: string[], properties: Object}>}
     */
    generateNetlist() {
        this.buildNodes();

        const netlist = [];

        for (const component of this.components.values()) {
            if (component.type === 'ground') continue;

            const nodeIds = component.terminals.map(t => t.nodeId);

            netlist.push({
                id: component.id,
                type: component.type,
                nodes: nodeIds,
                properties: { ...component.properties }
            });
        }

        return netlist;
    }

    /**
     * Notify change listeners
     * @param {string} type 
     * @param {*} data 
     */
    notifyChange(type, data) {
        if (this.onChange) {
            this.onChange(type, data);
        }
    }

    /**
     * Serialize circuit to JSON
     * @returns {Object}
     */
    serialize() {
        return {
            components: Array.from(this.components.values()).map(c => c.serialize()),
            wires: Array.from(this.wires.values()).map(w => w.serialize())
        };
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return {
            components: this.components.size,
            wires: this.wires.size,
            nodes: this.nodes.size
        };
    }

    /**
     * Find terminal by ID
     * @param {string} id 
     * @returns {Terminal|null}
     */
    findTerminalById(id) {
        if (!id) return null;
        for (const component of this.components.values()) {
            for (const terminal of component.terminals) {
                if (terminal.id === id) return terminal;
            }
        }
        return null;
    }

    /**
     * Deserialize circuit from JSON
     * @param {Object} data 
     */
    deserialize(data) {
        this.clear(); // Ensure clean slate

        if (!data || !data.components) return;

        // Reset counters to 0 before restoring to ensure we find the true max
        // Actually, we should just let the max finding logic handle it.

        // Restore components
        let maxCompId = 0;
        for (const compData of data.components) {
            const component = createComponent(compData.type, compData.x, compData.y);
            if (component) {
                // Restore ID and properties
                component.id = compData.id;

                // Track max ID to prevent collisions
                const idNum = parseInt(component.id.replace('comp_', ''));
                if (!isNaN(idNum) && idNum > maxCompId) maxCompId = idNum;

                component.rotation = compData.rotation;
                component.properties = { ...compData.properties };

                // Fix terminal IDs to match restored component ID
                for (const terminal of component.terminals) {
                    terminal.id = `${component.id}_${terminal.name}`;
                    terminal.component = component;
                }

                // Force update of SVG transforms/labels
                component.updateElement();

                this.addComponent(component);
            }
        }

        // Sync component ID counter
        setComponentIdCounter(maxCompId);

        // Restore wires
        let maxWireId = 0;
        if (data.wires) {
            for (const wireData of data.wires) {
                const startTerm = this.findTerminalById(wireData.startTerminal);
                const endTerm = this.findTerminalById(wireData.endTerminal);

                if (startTerm && endTerm) {
                    // Create wire (this increments counter, but we'll reset it after)
                    const wire = new Wire(startTerm, endTerm);
                    wire.id = wireData.id;

                    // Track max ID
                    const idNum = parseInt(wire.id.replace('wire_', ''));
                    if (!isNaN(idNum) && idNum > maxWireId) maxWireId = idNum;

                    // Restore custom routing points
                    if (wireData.points && wireData.points.length > 0) {
                        wire.points = wireData.points;
                        if (wireData.points.length >= 2) {
                            const bendX = wireData.points[1].x;
                            wire.bendOffset = bendX;
                        }
                    }

                    this.addWire(wire);
                } else {
                    console.warn(`Skipping wire ${wireData.id}: Terminal not found (start=${wireData.startTerminal}, end=${wireData.endTerminal})`);
                }
            }
        }

        // Sync wire ID counter
        setWireIdCounter(maxWireId);

        this.notifyChange('circuit-loaded', null);
    }
}
