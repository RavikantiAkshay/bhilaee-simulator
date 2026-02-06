/**
 * Node.js - Represents a circuit node (junction point)
 * 
 * In circuit analysis, a node is any point where two or more terminals connect.
 * Used by the solver for Modified Nodal Analysis.
 */

let nodeIdCounter = 0;

export class Node {
    /**
     * @param {boolean} isGround - Whether this is the reference (ground) node
     */
    constructor(isGround = false) {
        this.id = isGround ? 'gnd' : `node_${++nodeIdCounter}`;
        this.isGround = isGround;
        this.terminals = []; // Terminal IDs connected to this node
        this.voltage = 0; // Calculated voltage (result of analysis)
        this.index = isGround ? 0 : -1; // Matrix index (assigned during analysis)
    }

    /**
     * Add a terminal to this node
     * @param {string} terminalId 
     */
    addTerminal(terminalId) {
        if (!this.terminals.includes(terminalId)) {
            this.terminals.push(terminalId);
        }
    }

    /**
     * Remove a terminal from this node
     * @param {string} terminalId 
     */
    removeTerminal(terminalId) {
        const index = this.terminals.indexOf(terminalId);
        if (index > -1) {
            this.terminals.splice(index, 1);
        }
    }

    /**
     * Check if this node has any connections
     * @returns {boolean}
     */
    hasConnections() {
        return this.terminals.length > 0;
    }

    /**
     * Get number of connections
     * @returns {number}
     */
    connectionCount() {
        return this.terminals.length;
    }

    /**
     * Merge another node into this one
     * @param {Node} other 
     */
    merge(other) {
        for (const terminalId of other.terminals) {
            this.addTerminal(terminalId);
        }
    }

    /**
     * Serialize node
     * @returns {Object}
     */
    serialize() {
        return {
            id: this.id,
            isGround: this.isGround,
            terminals: [...this.terminals]
        };
    }
}

/**
 * Reset node ID counter (for testing or new circuit)
 */
export function resetNodeCounter() {
    nodeIdCounter = 0;
}
