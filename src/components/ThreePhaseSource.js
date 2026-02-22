/**
 * ThreePhaseSource.js - Three Phase Voltage Source (Wye/Star)
 * 
 * Represents a balanced three-phase supply with Neutral.
 * Configuration: Star (Y)
 * Terminals: R (Red), Y (Yellow), B (Blue), N (Neutral)
 * 
 * Models 3 independent AC voltage sources connected to a common Neutral.
 * V_RN = Vp < 0
 * V_YN = Vp < -120
 * V_BN = Vp < 120
 * 
 * voltage property is Line-to-Line RMS.
 * Vp = V_LL / sqrt(3)
 */

import { Component, Terminal, formatValue } from '../core/Component.js';

export class ThreePhaseSource extends Component {
    constructor(x = 0, y = 0) {
        super('three_phase_source', x, y);

        // 4 Terminals: R, Y, B, N
        // Layout: R, Y, B on top/sides? 
        // Let's do: R (Top), Y (Right), B (Left), N (Bottom/Center)
        // Or standard vertical arrangement?
        // Let's do a box.
        // R: Top-Left
        // Y: Top-Right
        // B: Bottom-Right
        // N: Bottom-Left

        this.terminals = [
            new Terminal(this, 'phase_R', -30, -40), // Top-Left
            new Terminal(this, 'phase_Y', 30, -40),  // Top-Right
            new Terminal(this, 'phase_B', 30, 40),   // Bottom-Right
            new Terminal(this, 'neutral', -30, 40)   // Bottom-Left
        ];

        this.properties = {
            voltage: 415,      // V_LL (RMS)
            frequency: 50,     // Hz
            phaseShift: 0      // Reference phase for R-phase (degrees)
        };
    }

    static get displayName() {
        return '3-Phase Source';
    }

    static get icon() {
        return `
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
            <!-- Y symbol -->
            <line x1="16" y1="16" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="16" x2="8" y2="24" stroke="currentColor" stroke-width="1.5"/>
            <line x1="16" y1="16" x2="24" y2="24" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static get shortcut() {
        return '3';
    }

    static getDefaultProperties() {
        return { voltage: 415, frequency: 50, phaseShift: 0 };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'voltage', label: 'Line Voltage (RMS)', type: 'number', unit: 'V' },
            { name: 'frequency', label: 'Frequency', type: 'number', unit: 'Hz' },
            { name: 'phaseShift', label: 'Phase Shift', type: 'number', unit: '°' }
        ];
    }

    renderBody() {
        return `
            <rect x="-30" y="-40" width="60" height="80" fill="none" class="component-body" stroke-opacity="0"/> 
            <!-- Using invisible rect for bounding, actual visual below -->
            
            <circle cx="0" cy="0" r="30" fill="none" stroke="var(--component-stroke)" stroke-width="2"/>
            
            <!-- Terminals are at corners (-30,-40 etc). Draw lines to circle? -->
            <line x1="-30" y1="-40" x2="-15" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="30" y1="-40" x2="15" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="30" y1="40" x2="15" y2="20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="-30" y1="40" x2="-15" y2="20" stroke="var(--component-stroke)" stroke-width="2"/>

            <!-- Y Symbol inside -->
            <line x1="0" y1="0" x2="0" y2="-20" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="0" y1="0" x2="17" y2="10" stroke="var(--component-stroke)" stroke-width="2"/>
            <line x1="0" y1="0" x2="-17" y2="10" stroke="var(--component-stroke)" stroke-width="2"/>
            
            <!-- Labels -->
            <text x="-35" y="-35" font-size="10" fill="#e74c3c" font-weight="bold">R</text>
            <text x="35" y="-35" font-size="10" fill="#f1c40f" font-weight="bold">Y</text>
            <text x="35" y="35" font-size="10" fill="#3498db" font-weight="bold">B</text>
            <text x="-35" y="35" font-size="10" fill="var(--component-text)" font-weight="bold">N</text>
        `;
    }

    getValueString() {
        return `${this.properties.voltage}V ${this.properties.frequency}Hz`;
    }

    getLabel() {
        return '3Φ';
    }

    /**
     * MNA Stamp
     * Handled by MNASolver based on component type.
     */
    getStamp(nodeMap, frequency = 0) {
        // Return mostly metadata, solver does the heavy lifting
        return {
            G: [],
            z: [],
            isThreePhaseSource: true,
            // Pass node IDs
            nodes: {
                R: nodeMap.get(this.terminals[0].id),
                Y: nodeMap.get(this.terminals[1].id),
                B: nodeMap.get(this.terminals[2].id),
                N: nodeMap.get(this.terminals[3].id)
            },
            voltage: this.properties.voltage,
            frequency: this.properties.frequency,
            phaseShift: this.properties.phaseShift
        };
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            properties: { ...this.properties },
            state: { ...this.state }
        };
    }

    deserialize(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation;
        this.properties = { ...ThreePhaseSource.getDefaultProperties(), ...data.properties };
        if (data.state) this.state = data.state;
    }

    getBounds() {
        return {
            x: this.x - 30,
            y: this.y - 40,
            width: 60,
            height: 80
        };
    }
}
