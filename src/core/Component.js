/**
 * Component.js - Base class for all circuit components
 * 
 * This is the foundation for R, L, C, and all future components.
 * All components extend this class and implement their specific behavior.
 */

// Unique ID generator
let componentIdCounter = 0;
function generateId() {
    return `comp_${++componentIdCounter}`;
}

export function setComponentIdCounter(count) {
    componentIdCounter = count;
}

/**
 * Terminal class - represents a connection point on a component
 */
export class Terminal {
    /**
     * @param {Component} component - Parent component
     * @param {string} name - Terminal name (e.g., 'positive', 'negative')
     * @param {number} offsetX - X offset from component center
     * @param {number} offsetY - Y offset from component center
     */
    constructor(component, name, offsetX, offsetY) {
        this.id = `${component.id}_${name}`;
        this.component = component;
        this.name = name;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.connectedWires = [];
        this.nodeId = null; // Assigned during circuit analysis
    }

    /**
     * Get absolute position of terminal on canvas
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        const cos = Math.cos(this.component.rotation * Math.PI / 180);
        const sin = Math.sin(this.component.rotation * Math.PI / 180);

        // Apply rotation transformation
        const rotatedX = this.offsetX * cos - this.offsetY * sin;
        const rotatedY = this.offsetX * sin + this.offsetY * cos;

        return {
            x: this.component.x + rotatedX,
            y: this.component.y + rotatedY
        };
    }

    /**
     * Check if a point is near this terminal
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} threshold - Distance threshold (default 10px)
     * @returns {boolean}
     */
    isNear(x, y, threshold = 10) {
        const pos = this.getPosition();
        const dx = pos.x - x;
        const dy = pos.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }

    /**
     * Connect a wire to this terminal
     * @param {Wire} wire 
     */
    connect(wire) {
        if (!this.connectedWires.includes(wire)) {
            this.connectedWires.push(wire);
        }
    }

    /**
     * Disconnect a wire from this terminal
     * @param {Wire} wire 
     */
    disconnect(wire) {
        const index = this.connectedWires.indexOf(wire);
        if (index > -1) {
            this.connectedWires.splice(index, 1);
        }
    }

    /**
     * Check if this terminal is connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connectedWires.length > 0;
    }
}

/**
 * Component base class
 * All circuit components (R, L, C, sources, etc.) extend this class
 */
export class Component {
    /**
     * @param {string} type - Component type identifier (e.g., 'resistor', 'capacitor')
     * @param {number} x - X position on canvas
     * @param {number} y - Y position on canvas
     */
    constructor(type, x = 0, y = 0) {
        this.id = generateId();
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0; // Degrees (0, 90, 180, 270)
        this.selected = false;
        this.terminals = [];
        this.properties = {}; // Component-specific properties (value, etc.)
        this.element = null; // SVG element reference
    }

    // =========== Override in subclasses ===========

    /**
     * Get display name of the component
     * @returns {string}
     */
    static get displayName() {
        return 'Component';
    }

    /**
     * Get the component icon/symbol for toolbar
     * @returns {string} SVG markup
     */
    static get icon() {
        return '<rect x="4" y="8" width="24" height="8" fill="none" stroke="currentColor" stroke-width="2"/>';
    }

    /**
     * Get keyboard shortcut for this component
     * @returns {string|null}
     */
    static get shortcut() {
        return null;
    }

    /**
     * Get default properties for this component type
     * @returns {Object}
     */
    static getDefaultProperties() {
        return {};
    }

    /**
     * Get property definitions (for property panel UI)
     * @returns {Array<{name: string, label: string, type: string, unit: string}>}
     */
    static getPropertyDefinitions() {
        return [];
    }

    /**
     * Render SVG for the component body (override in subclass)
     * @returns {string} SVG markup for the component body
     */
    renderBody() {
        return '<rect class="component-body" x="-20" y="-10" width="40" height="20" rx="2"/>';
    }

    /**
     * Get the stamp for Modified Nodal Analysis (override in subclass)
     * This returns contribution to the G matrix and source vector
     * @param {Object} nodeMap - Map of terminal IDs to node indices
     * @param {number} frequency - Frequency for AC analysis (0 for DC)
     * @returns {{G: Array, z: Array}} Contributions to system matrices
     */
    getStamp(nodeMap, frequency = 0) {
        // Default: no contribution (override in subclass)
        return { G: [], z: [] };
    }

    /**
     * Get companion model for transient analysis (override for L, C)
     * @param {number} dt - Time step
     * @param {Object} prevState - Previous state values
     * @returns {Object} Companion model parameters
     */
    getCompanionModel(dt, prevState) {
        return null;
    }

    // =========== Instance methods ===========

    /**
     * Move component to new position
     * @param {number} x 
     * @param {number} y 
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this.updateElement();
    }

    /**
     * Move component by delta
     * @param {number} dx 
     * @param {number} dy 
     */
    moveBy(dx, dy) {
        this.x += dx;
        this.y += dy;
        this.updateElement();
    }

    /**
     * Rotate component by 90 degrees
     */
    rotate() {
        this.rotation = (this.rotation + 90) % 360;
        this.updateElement();
    }

    /**
     * Set rotation to specific angle
     * @param {number} degrees 
     */
    setRotation(degrees) {
        this.rotation = degrees % 360;
        this.updateElement();
    }

    /**
     * Select this component
     */
    select() {
        this.selected = true;
        if (this.element) {
            this.element.classList.add('selected');
        }
    }

    /**
     * Deselect this component
     */
    deselect() {
        this.selected = false;
        if (this.element) {
            this.element.classList.remove('selected');
        }
    }

    /**
     * Set a property value
     * @param {string} name 
     * @param {*} value 
     */
    setProperty(name, value) {
        this.properties[name] = value;
        this.updateElement();
    }

    /**
     * Get a property value
     * @param {string} name 
     * @returns {*}
     */
    getProperty(name) {
        return this.properties[name];
    }

    /**
     * Get terminal by name
     * @param {string} name 
     * @returns {Terminal|undefined}
     */
    getTerminal(name) {
        return this.terminals.find(t => t.name === name);
    }

    /**
     * Find terminal near a point
     * @param {number} x 
     * @param {number} y 
     * @param {number} threshold 
     * @returns {Terminal|null}
     */
    findTerminalAt(x, y, threshold = 10) {
        for (const terminal of this.terminals) {
            if (terminal.isNear(x, y, threshold)) {
                return terminal;
            }
        }
        return null;
    }

    /**
     * Check if point is inside component bounding box
     * @param {number} x 
     * @param {number} y 
     * @returns {boolean}
     */
    containsPoint(x, y) {
        // Simple rectangular hit test (override for complex shapes)
        const bounds = this.getBounds();
        return x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height;
    }

    /**
     * Get bounding box of component
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBounds() {
        // Default bounds (override in subclass for accuracy)
        const width = 60;
        const height = 40;
        return {
            x: this.x - width / 2,
            y: this.y - height / 2,
            width,
            height
        };
    }

    /**
     * Render the complete SVG element
     * @returns {SVGGElement}
     */
    render() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `component-group ${this.selected ? 'selected' : ''}`);
        group.setAttribute('data-id', this.id);
        group.setAttribute('data-type', this.type);
        group.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        // Component body
        group.innerHTML = this.renderBody();

        // Terminals
        for (const terminal of this.terminals) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'terminal');
            circle.setAttribute('data-terminal', terminal.name);
            circle.setAttribute('cx', terminal.offsetX);
            circle.setAttribute('cy', terminal.offsetY);
            circle.setAttribute('r', '4');
            group.appendChild(circle);
        }

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'component-label');
        label.setAttribute('y', '-15');
        label.textContent = this.getLabel();
        group.appendChild(label);

        // Value
        const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        value.setAttribute('class', 'component-value');
        value.setAttribute('y', '25');
        value.textContent = this.getValueString();
        group.appendChild(value);

        this.element = group;
        return group;
    }

    /**
     * Update the SVG element (call after property changes)
     */
    updateElement() {
        if (!this.element) return;

        this.element.setAttribute('transform', `translate(${this.x}, ${this.y}) rotate(${this.rotation})`);

        // Update value text
        const valueText = this.element.querySelector('.component-value');
        if (valueText) {
            valueText.textContent = this.getValueString();
        }
    }

    /**
     * Get component label (e.g., R1, C2)
     * @returns {string}
     */
    getLabel() {
        return this.id.replace('comp_', this.type.charAt(0).toUpperCase());
    }

    /**
     * Get formatted value string (e.g., "1kΩ", "10µF")
     * @returns {string}
     */
    getValueString() {
        return ''; // Override in subclass
    }

    /**
     * Serialize component to JSON
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            properties: { ...this.properties },
            state: { ...this.state } // Save transient state
        };
    }

    /**
     * Restore component from serialized data (override in subclass)
     * @param {Object} data 
     */
    deserialize(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.properties = { ...data.properties };
        if (data.state) {
            this.state = { ...data.state };
        }
    }
}

/**
 * Format a value with SI prefix (1000 → 1k, 0.001 → 1m)
 * @param {number} value 
 * @param {string} unit 
 * @returns {string}
 */
export function formatValue(value, unit = '') {
    if (value === 0) return `0${unit}`;

    const prefixes = [
        { threshold: 1e12, prefix: 'T' },
        { threshold: 1e9, prefix: 'G' },
        { threshold: 1e6, prefix: 'M' },
        { threshold: 1e3, prefix: 'k' },
        { threshold: 1, prefix: '' },
        { threshold: 1e-3, prefix: 'm' },
        { threshold: 1e-6, prefix: 'µ' },
        { threshold: 1e-9, prefix: 'n' },
        { threshold: 1e-12, prefix: 'p' },
    ];

    for (const { threshold, prefix } of prefixes) {
        if (Math.abs(value) >= threshold) {
            const scaled = value / threshold;
            const formatted = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
            return `${formatted}${prefix}${unit}`;
        }
    }

    return `${value.toExponential(2)}${unit}`;
}
