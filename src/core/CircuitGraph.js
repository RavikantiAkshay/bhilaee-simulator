/**
 * CircuitGraph.js - Manages the circuit topology
 * 
 * Central manager for all components, wires, and nodes.
 * Handles circuit validation and generates netlist for simulation.
 */

import { Node, resetNodeCounter } from './Node.js';

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
                if (!terminal.isConnected() && component.type !== 'ground') {
                    errors.push(`${component.getLabel()} has unconnected terminal: ${terminal.name}`);
                }
            }
        }

        // Check for voltage source
        const hasSources = Array.from(this.components.values()).some(
            c => c.type === 'voltage_source' || c.type === 'current_source'
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
}
