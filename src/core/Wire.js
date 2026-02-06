/**
 * Wire.js - Represents a connection between two terminals
 * 
 * Wires connect component terminals and are rendered as lines/paths on the canvas.
 */

let wireIdCounter = 0;

export class Wire {
    /**
     * @param {Terminal} startTerminal - Starting terminal
     * @param {Terminal} endTerminal - Ending terminal (null if wire is being drawn)
     */
    constructor(startTerminal = null, endTerminal = null) {
        this.id = `wire_${++wireIdCounter}`;
        this.startTerminal = startTerminal;
        this.endTerminal = endTerminal;
        this.selected = false;
        this.element = null; // SVG element reference

        // Path points for routing (start, bends, end)
        this.points = [];

        // Offset for the bend point (user can drag to shift the bend left/right)
        // null = auto (centered between terminals)
        this.bendOffset = null;

        // Register with terminals
        if (startTerminal) {
            startTerminal.connect(this);
        }
        if (endTerminal) {
            endTerminal.connect(this);
        }

        // Initialize path if both terminals are set
        if (startTerminal && endTerminal) {
            this.updatePath();
        }
    }

    /**
     * Check if wire is complete (has both terminals)
     * @returns {boolean}
     */
    isComplete() {
        return this.startTerminal !== null && this.endTerminal !== null;
    }

    /**
     * Set the end terminal and complete the wire
     * @param {Terminal} terminal 
     */
    setEndTerminal(terminal) {
        if (this.endTerminal) {
            this.endTerminal.disconnect(this);
        }
        this.endTerminal = terminal;
        if (terminal) {
            terminal.connect(this);
        }
        this.updatePath();
    }

    /**
     * Get the other terminal (given one terminal, return the other)
     * @param {Terminal} terminal 
     * @returns {Terminal|null}
     */
    getOtherTerminal(terminal) {
        if (terminal === this.startTerminal) return this.endTerminal;
        if (terminal === this.endTerminal) return this.startTerminal;
        return null;
    }

    /**
     * Calculate wire path points
     * Uses bendOffset if set, otherwise auto-centers
     */
    updatePath() {
        if (!this.startTerminal) return;

        const start = this.startTerminal.getPosition();
        const end = this.endTerminal ? this.endTerminal.getPosition() : start;

        // Calculate bend X position
        let bendX;
        if (this.bendOffset !== null) {
            bendX = this.bendOffset;
        } else {
            // Auto-center between terminals
            bendX = (start.x + end.x) / 2;
        }

        // Manhattan routing: horizontal, vertical, horizontal
        this.points = [
            { x: start.x, y: start.y },
            { x: bendX, y: start.y },
            { x: bendX, y: end.y },
            { x: end.x, y: end.y }
        ];

        this.updateElement();
    }

    /**
     * Set the bend X position (for dragging)
     */
    setBendX(x) {
        this.bendOffset = x;
        this.updatePath();
    }

    /**
     * Get current bend X position
     */
    getBendX() {
        if (this.bendOffset !== null) {
            return this.bendOffset;
        }
        const start = this.startTerminal.getPosition();
        const end = this.endTerminal ? this.endTerminal.getPosition() : start;
        return (start.x + end.x) / 2;
    }

    /**
     * Reset to auto-routing (clear custom bend)
     */
    resetRouting() {
        this.bendOffset = null;
        this.updatePath();
    }

    /**
     * Update path to follow cursor (during wire drawing)
     * @param {number} x - Cursor X
     * @param {number} y - Cursor Y
     */
    updatePreview(x, y) {
        if (!this.startTerminal) return;

        const start = this.startTerminal.getPosition();
        const midX = (start.x + x) / 2;

        this.points = [
            { x: start.x, y: start.y },
            { x: midX, y: start.y },
            { x: midX, y: y },
            { x: x, y: y }
        ];

        this.updateElement();
    }

    /**
     * Select this wire
     */
    select() {
        this.selected = true;
        if (this.element) {
            this.element.classList.add('selected');
        }
    }

    /**
     * Deselect this wire
     */
    deselect() {
        this.selected = false;
        if (this.element) {
            this.element.classList.remove('selected');
        }
    }

    /**
     * Check if a point is near the wire path
     * @param {number} x 
     * @param {number} y 
     * @param {number} threshold 
     * @returns {boolean}
     */
    isNear(x, y, threshold = 5) {
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];

            if (this.pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y) <= threshold) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate distance from point to line segment
     */
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
    }

    /**
     * Generate SVG path string
     * @returns {string}
     */
    getPathString() {
        if (this.points.length < 2) return '';

        const [first, ...rest] = this.points;
        return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    /**
     * Render wire as SVG element
     * @param {boolean} isPreview - Whether this is a preview (being drawn)
     * @returns {SVGPathElement}
     */
    render(isPreview = false) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', isPreview ? 'wire-preview' : `wire ${this.selected ? 'selected' : ''}`);
        path.setAttribute('data-id', this.id);
        path.setAttribute('d', this.getPathString());

        this.element = path;
        return path;
    }

    /**
     * Update SVG element
     */
    updateElement() {
        if (!this.element) return;
        this.element.setAttribute('d', this.getPathString());
    }

    /**
     * Remove wire and disconnect from terminals
     */
    remove() {
        if (this.startTerminal) {
            this.startTerminal.disconnect(this);
        }
        if (this.endTerminal) {
            this.endTerminal.disconnect(this);
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * Serialize wire
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            startTerminal: this.startTerminal?.id || null,
            endTerminal: this.endTerminal?.id || null,
            points: this.points.map(p => ({ x: p.x, y: p.y }))
        };
    }
}

/**
 * Reset wire ID counter
 */
export function resetWireCounter() {
    wireIdCounter = 0;
}
