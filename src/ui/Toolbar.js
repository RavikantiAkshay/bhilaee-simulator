/**
 * Toolbar.js - Component palette
 * 
 * Displays available components that can be dragged onto the canvas
 * or clicked to start placement mode.
 */

import { getAllComponents } from '../components/index.js';

export class Toolbar {
    /**
     * @param {HTMLElement} containerElement - The toolbar container
     * @param {Canvas} canvas - The canvas instance
     */
    constructor(containerElement, canvas) {
        this.container = containerElement;
        this.canvas = canvas;
        this.componentList = containerElement.querySelector('#component-list') || containerElement;

        this.render();
        this.setupEventListeners();
    }

    /**
     * Render all component items
     */
    render() {
        this.componentList.innerHTML = '';

        const components = getAllComponents();

        for (const ComponentClass of components) {
            const item = this.createComponentItem(ComponentClass);
            this.componentList.appendChild(item);
        }
    }

    /**
     * Create a component item element
     */
    createComponentItem(ComponentClass) {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.dataset.type = new ComponentClass().type;

        // Icon
        const icon = document.createElement('svg');
        icon.setAttribute('viewBox', '0 0 32 24');
        icon.innerHTML = ComponentClass.icon;

        // Name
        const name = document.createElement('span');
        name.className = 'component-name';
        name.textContent = ComponentClass.displayName;

        // Shortcut
        const shortcut = document.createElement('span');
        shortcut.className = 'component-shortcut';
        shortcut.textContent = ComponentClass.shortcut || '';

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(shortcut);

        // Click to start placement
        item.addEventListener('click', () => {
            this.canvas.startPlacement(ComponentClass);
        });

        // Store class reference
        item._componentClass = ComponentClass;

        return item;
    }

    /**
     * Setup keyboard shortcuts
     */
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            // Don't handle if typing in input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
                return;
            }

            const key = event.key.toUpperCase();
            const components = getAllComponents();

            for (const ComponentClass of components) {
                if (ComponentClass.shortcut === key) {
                    this.canvas.startPlacement(ComponentClass);
                    event.preventDefault();
                    break;
                }
            }
        });
    }

    /**
     * Highlight active component in toolbar
     */
    setActive(componentType) {
        const items = this.componentList.querySelectorAll('.component-item');
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.type === componentType);
        });
    }

    /**
     * Clear active state
     */
    clearActive() {
        const items = this.componentList.querySelectorAll('.component-item');
        items.forEach(item => item.classList.remove('active'));
    }
}
