/**
 * Toolbar.js - Component palette with categorized groups
 * 
 * Displays available components grouped by category in a card grid.
 * Supports search filtering and collapsible category sections.
 */

import { getAllComponents } from '../components/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Component category definitions.
 */
const CATEGORIES = [
    {
        id: 'sources',
        label: 'Sources',
        icon: '⚡',
        types: ['voltage_source', 'three_phase_source', 'ground']
    },
    {
        id: 'passive',
        label: 'Passive',
        icon: '🔧',
        types: ['resistor', 'capacitor', 'inductor', 'junction']
    },
    {
        id: 'active',
        label: 'Active',
        icon: '🔌',
        types: ['diode', 'opamp', 'transformer', 'load']
    },
    {
        id: 'instruments',
        label: 'Instruments',
        icon: '📊',
        types: ['ammeter', 'voltmeter', 'wattmeter', 'oscilloscope']
    }
];

export class Toolbar {
    /**
     * @param {HTMLElement} containerElement - The toolbar container
     * @param {Canvas} canvas - The canvas instance
     */
    constructor(containerElement, canvas) {
        this.container = containerElement;
        this.componentList = containerElement.querySelector('#component-list') || containerElement;
        this.canvas = canvas;
        this.searchInput = containerElement.querySelector('#component-search');

        this.render();
        this.setupEventListeners();
    }

    /**
     * Render all component items grouped by category
     */
    render() {
        this.componentList.innerHTML = '';

        const components = getAllComponents();

        // Build a map from component type to ComponentClass
        const typeMap = new Map();
        for (const C of components) {
            const instance = new C();
            typeMap.set(instance.type, C);
        }

        for (const category of CATEGORIES) {
            const categoryComponents = category.types
                .map(t => typeMap.get(t))
                .filter(Boolean);

            if (categoryComponents.length === 0) continue;

            // Category section
            const section = document.createElement('div');
            section.className = 'component-category';
            section.dataset.categoryId = category.id;

            // Category header (collapsible)
            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <span class="category-icon">${category.icon}</span>
                <span class="category-label">${category.label}</span>
                <svg class="category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            `;
            header.addEventListener('click', () => {
                section.classList.toggle('collapsed');
            });

            // Component grid
            const grid = document.createElement('div');
            grid.className = 'component-grid';

            for (const ComponentClass of categoryComponents) {
                const card = this.createComponentCard(ComponentClass);
                grid.appendChild(card);
            }

            section.appendChild(header);
            section.appendChild(grid);
            this.componentList.appendChild(section);
        }
    }

    /**
     * Create a component card element with proper SVG namespace
     */
    createComponentCard(ComponentClass) {
        const card = document.createElement('div');
        card.className = 'component-card';
        const instance = new ComponentClass();
        card.dataset.type = instance.type;

        // Icon container - use SVG namespace for proper rendering
        const iconWrap = document.createElement('div');
        iconWrap.className = 'card-icon';

        // Create SVG using proper namespace so child elements render correctly
        const svgStr = `<svg xmlns="${SVG_NS}" viewBox="0 0 32 24">${ComponentClass.icon}</svg>`;
        iconWrap.innerHTML = svgStr;

        // Name
        const name = document.createElement('span');
        name.className = 'card-name';
        name.textContent = ComponentClass.displayName;

        // Shortcut badge
        const shortcut = document.createElement('span');
        shortcut.className = 'card-shortcut';
        shortcut.textContent = ComponentClass.shortcut || '';

        card.appendChild(iconWrap);
        card.appendChild(name);
        if (ComponentClass.shortcut) {
            card.appendChild(shortcut);
        }

        // Click to start placement
        card.addEventListener('click', () => {
            this.canvas.startPlacement(ComponentClass);
        });

        card._componentClass = ComponentClass;

        return card;
    }

    /**
     * Setup keyboard shortcuts and search
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT' ||
                event.target.tagName === 'SELECT' ||
                event.target.tagName === 'TEXTAREA' ||
                event.ctrlKey || event.metaKey || event.altKey) {
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

        // Search filtering
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                const query = this.searchInput.value.toLowerCase().trim();
                const cards = this.componentList.querySelectorAll('.component-card');
                const categories = this.componentList.querySelectorAll('.component-category');

                cards.forEach(card => {
                    const name = card.querySelector('.card-name').textContent.toLowerCase();
                    const type = card.dataset.type.toLowerCase();
                    const match = !query || name.includes(query) || type.includes(query);
                    card.style.display = match ? '' : 'none';
                });

                // Hide category if all its cards are hidden
                categories.forEach(cat => {
                    const visibleCards = cat.querySelectorAll('.component-card:not([style*="display: none"])');
                    cat.style.display = visibleCards.length > 0 ? '' : 'none';
                    if (query) {
                        cat.classList.remove('collapsed');
                    }
                });
            });
        }
    }

    /**
     * Highlight active component in toolbar
     */
    setActive(componentType) {
        const cards = this.componentList.querySelectorAll('.component-card');
        cards.forEach(card => {
            card.classList.toggle('active', card.dataset.type === componentType);
        });
    }

    /**
     * Clear active state
     */
    clearActive() {
        const cards = this.componentList.querySelectorAll('.component-card');
        cards.forEach(card => card.classList.remove('active'));
    }
}
