/**
 * Component Registry - Central place to register all components
 * 
 * To add a new component:
 * 1. Create the component class file
 * 2. Import it here
 * 3. Add it to the COMPONENTS array
 */

import { Resistor } from './Resistor.js';
import { Capacitor } from './Capacitor.js';
import { Inductor } from './Inductor.js';
import { Ground } from './Ground.js';
import { VoltageSource } from './VoltageSource.js';
import { Junction } from './Junction.js';
import { Ammeter } from './Ammeter.js';
import { Voltmeter } from './Voltmeter.js';
import { Transformer } from './Transformer.js';
import { Wattmeter } from './Wattmeter.js';
import { ThreePhaseSource } from './ThreePhaseSource.js';

/**
 * List of all available components
 * Order determines display order in toolbar
 */
export const COMPONENTS = [
    VoltageSource,
    Ground,
    Junction,
    Resistor,
    Capacitor,
    Inductor,
    Ammeter,
    Voltmeter,
    Transformer,
    Wattmeter,
    ThreePhaseSource
];

/**
 * Map of component type string to component class
 */
export const COMPONENT_MAP = new Map(
    COMPONENTS.map(C => [new C().type, C])
);

/**
 * Get component class by type string
 * @param {string} type 
 * @returns {typeof Component}
 */
export function getComponentClass(type) {
    return COMPONENT_MAP.get(type);
}

/**
 * Create a component instance by type
 * @param {string} type - Component type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Component|null}
 */
export function createComponent(type, x = 0, y = 0) {
    const ComponentClass = COMPONENT_MAP.get(type);
    if (!ComponentClass) {
        console.warn(`Unknown component type: ${type}`);
        return null;
    }
    return new ComponentClass(x, y);
}

/**
 * Get all component classes
 * @returns {Array}
 */
export function getAllComponents() {
    return COMPONENTS;
}

/**
 * Get component by keyboard shortcut
 * @param {string} key - Keyboard key (uppercase)
 * @returns {typeof Component|null}
 */
export function getComponentByShortcut(key) {
    const upperKey = key.toUpperCase();
    return COMPONENTS.find(C => C.shortcut === upperKey) || null;
}

// Re-export component classes for convenience
export { Resistor, Capacitor, Inductor, Ground, VoltageSource, Junction, Ammeter, Voltmeter, Transformer, Wattmeter, ThreePhaseSource };
