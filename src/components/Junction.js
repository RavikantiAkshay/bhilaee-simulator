/**
 * Junction.js - Wire junction/node component
 * 
 * A simple connection point that allows multiple wires to connect.
 * Used for creating parallel circuits by connecting multiple wires to same node.
 */

import { Component, Terminal } from '../core/Component.js';

export class Junction extends Component {
    constructor(x = 0, y = 0) {
        super('junction', x, y);

        // Single terminal at center - can connect multiple wires
        this.terminals = [
            new Terminal(this, 'node', 0, 0)
        ];

        this.properties = {};
    }

    static get displayName() {
        return 'Junction';
    }

    static get icon() {
        return `
            <circle cx="16" cy="16" r="6" fill="currentColor"/>
        `;
    }

    static get shortcut() {
        return 'J';
    }

    static getDefaultProperties() {
        return {};
    }

    static getPropertyDefinitions() {
        return [];
    }

    renderBody() {
        return `
            <!-- Junction dot -->
            <circle class="component-body" cx="0" cy="0" r="5" 
                fill="var(--component-stroke)" stroke="var(--component-stroke)" stroke-width="1"/>
        `;
    }

    getValueString() {
        return '';
    }

    getLabel() {
        return '';
    }

    // Junction doesn't contribute to MNA matrix - it's just a connection point
    getStamp(nodeMap, frequency = 0) {
        return { G: [], z: [] };
    }

    getBounds() {
        return {
            x: this.x - 10,
            y: this.y - 10,
            width: 20,
            height: 20
        };
    }
}
