/**
 * Oscilloscope.js - Passive 2-channel waveform observer
 * 
 * A 4-terminal component that measures differential voltages:
 *   CH1: V(CH1+) - V(CH1-)
 *   CH2: V(CH2+) - V(CH2-)
 * 
 * IMPORTANT: This component does NOT modify the MNA matrix.
 * It is a pure observer — it only reads simulation results post-solve.
 */

import { Component, Terminal } from '../core/Component.js';

export class Oscilloscope extends Component {
    constructor(x = 0, y = 0) {
        super('oscilloscope', x, y);

        // 4 terminals arranged clearly:
        //   CH1+ on top, CH1- on bottom (vertical, like a voltmeter)
        //   CH2+ on left, CH2- on right (horizontal)
        this.terminals = [
            new Terminal(this, 'ch1_pos', 0, -35),   // CH1+ top
            new Terminal(this, 'ch1_neg', 0, 35),     // CH1- bottom
            new Terminal(this, 'ch2_pos', -45, 0),    // CH2+ left
            new Terminal(this, 'ch2_neg', 45, 0)      // CH2- right
        ];

        this.properties = {
            ch1Enabled: true,
            ch2Enabled: false,
            ch1Mode: 'Voltage',
            ch2Mode: 'Voltage',
            ch1Label: 'CH1',
            ch2Label: 'CH2'
        };

        // Channel colors
        this.ch1Color = '#22d3ee'; // cyan
        this.ch2Color = '#f59e0b'; // amber
    }

    static get displayName() {
        return 'Oscilloscope';
    }

    static get icon() {
        return `
            <rect x="4" y="4" width="24" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 12 Q12 4, 16 12 Q20 20, 24 12" fill="none" stroke="currentColor" stroke-width="1.5"/>
        `;
    }

    static get shortcut() {
        return null;
    }

    static getDefaultProperties() {
        return {
            ch1Enabled: true,
            ch2Enabled: false,
            ch1Mode: 'Voltage',
            ch2Mode: 'Voltage',
            ch1Label: 'CH1',
            ch2Label: 'CH2'
        };
    }

    static getPropertyDefinitions() {
        return [
            { name: 'ch1Enabled', label: 'Channel 1', type: 'checkbox' },
            { name: 'ch1Mode', label: 'CH1 Mode', type: 'select', options: ['Voltage', 'Current'] },
            { name: 'ch2Enabled', label: 'Channel 2', type: 'checkbox' },
            { name: 'ch2Mode', label: 'CH2 Mode', type: 'select', options: ['Voltage', 'Current'] },
            { name: 'ch1Label', label: 'CH1 Label', type: 'text' },
            { name: 'ch2Label', label: 'CH2 Label', type: 'text' }
        ];
    }

    /**
     * Get channel configuration for data extraction.
     * Returns an array of enabled channels with their terminal pairs.
     */
    getChannelConfig() {
        const channels = [];
        if (this.properties.ch1Enabled) {
            channels.push({
                id: 'ch1',
                label: this.properties.ch1Label || 'CH1',
                mode: this.properties.ch1Mode || 'Voltage',
                posTerminal: this.terminals[0], // ch1_pos (top)
                negTerminal: this.terminals[1], // ch1_neg (bottom)
                color: this.ch1Color
            });
        }
        if (this.properties.ch2Enabled) {
            channels.push({
                id: 'ch2',
                label: this.properties.ch2Label || 'CH2',
                mode: this.properties.ch2Mode || 'Voltage',
                posTerminal: this.terminals[2], // ch2_pos (left)
                negTerminal: this.terminals[3], // ch2_neg (right)
                color: this.ch2Color
            });
        }
        return channels;
    }

    renderBody() {
        const ch1Active = this.properties.ch1Enabled;
        const ch2Active = this.properties.ch2Enabled;

        return `
            <!-- Screen body -->
            <rect class="component-body" x="-28" y="-22" width="56" height="44" rx="4"
                  fill="rgba(13,17,23,0.8)" stroke-width="2"/>

            <!-- Screen inner -->
            <rect x="-22" y="-16" width="44" height="32" rx="2"
                  fill="rgba(13,17,23,0.95)" stroke="var(--component-stroke)" stroke-width="0.5"/>

            <!-- Grid lines on screen -->
            <line x1="-11" y1="-16" x2="-11" y2="16" stroke="rgba(88,166,255,0.15)" stroke-width="0.5"/>
            <line x1="0"   y1="-16" x2="0"   y2="16" stroke="rgba(88,166,255,0.15)" stroke-width="0.5"/>
            <line x1="11"  y1="-16" x2="11"  y2="16" stroke="rgba(88,166,255,0.15)" stroke-width="0.5"/>
            <line x1="-22" y1="0"   x2="22"  y2="0"  stroke="rgba(88,166,255,0.15)" stroke-width="0.5"/>

            <!-- CH1 waveform preview (cyan) -->
            ${ch1Active ? `
                <path d="M-20 0 Q-14 -10, -8 0 Q-2 10, 4 0 Q10 -10, 16 0"
                      fill="none" stroke="${this.ch1Color}" stroke-width="1.5" opacity="0.9"/>
            ` : ''}

            <!-- CH2 waveform preview (amber) -->
            ${ch2Active ? `
                <path d="M-20 2 Q-12 -6, -4 2 Q4 10, 12 2"
                      fill="none" stroke="${this.ch2Color}" stroke-width="1.5" opacity="0.7"/>
            ` : ''}

            <!-- CH1+ lead (top) -->
            <line x1="0" y1="-35" x2="0" y2="-22" stroke="${this.ch1Color}" stroke-width="1.5"/>
            <text x="10" y="-28" font-size="8" fill="${this.ch1Color}" font-family="sans-serif" font-weight="bold">CH1+</text>

            <!-- CH1- lead (bottom) -->
            <line x1="0" y1="22" x2="0" y2="35" stroke="${this.ch1Color}" stroke-width="1.5"/>
            <text x="10" y="32" font-size="8" fill="${this.ch1Color}" font-family="sans-serif" font-weight="bold">CH1−</text>

            <!-- CH2+ lead (left) -->
            <line x1="-45" y1="0" x2="-28" y2="0" stroke="${this.ch2Color}" stroke-width="1.5"/>
            <text x="-44" y="-6" font-size="7" fill="${this.ch2Color}" font-family="sans-serif" font-weight="bold">CH2+</text>

            <!-- CH2- lead (right) -->
            <line x1="28" y1="0" x2="45" y2="0" stroke="${this.ch2Color}" stroke-width="1.5"/>
            <text x="30" y="-6" font-size="7" fill="${this.ch2Color}" font-family="sans-serif" font-weight="bold">CH2−</text>
        `;
    }

    getValueString() {
        const parts = [];
        if (this.properties.ch1Enabled) parts.push(this.properties.ch1Label || 'CH1');
        if (this.properties.ch2Enabled) parts.push(this.properties.ch2Label || 'CH2');
        return parts.join(' | ') || 'Off';
    }

    getLabel() {
        return 'Scope';
    }

    /**
     * NO MNA stamp — this is a pure observer.
     */
    getStamp(nodeMap, frequency = 0) {
        return { G: [], z: [] };
    }

    /**
     * NO companion model — this is a pure observer.
     */
    getCompanionModel(dt, prevState) {
        return null;
    }

    getBounds() {
        return {
            x: this.x - 50,
            y: this.y - 40,
            width: 100,
            height: 80
        };
    }
}
