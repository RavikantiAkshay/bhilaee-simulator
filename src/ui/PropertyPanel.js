/**
 * PropertyPanel.js - Component property editor
 * 
 * Displays and allows editing of selected component's properties.
 */

export class PropertyPanel {
    /**
     * @param {HTMLElement} containerElement - The property panel container
     * @param {Canvas} canvas - The canvas instance
     */
    constructor(containerElement, canvas) {
        this.container = containerElement;
        this.content = containerElement.querySelector('#property-content') || containerElement;
        this.canvas = canvas;
        this.currentComponent = null;

        // Listen for selection changes
        if (canvas) {
            canvas.onSelectionChange = (type, item) => {
                if (type === 'component') {
                    this.showComponent(item);
                } else {
                    this.showEmpty();
                }
            };
        }
    }

    /**
     * Show empty state
     */
    showEmpty() {
        this.currentComponent = null;
        this.content.innerHTML = '<p class="placeholder-text">Select a component to view properties</p>';
    }

    /**
     * Show component properties
     */
    showComponent(component) {
        this.currentComponent = component;
        this.content.innerHTML = '';

        // Component info header
        const header = document.createElement('div');
        header.className = 'property-header';
        header.innerHTML = `
            <span class="property-type">${component.constructor.displayName}</span>
            <span class="property-id">${component.getLabel()}</span>
        `;
        this.content.appendChild(header);

        // Action buttons (at top for easy access)
        const actions = document.createElement('div');
        actions.className = 'property-actions';

        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'btn btn-secondary btn-small';
        rotateBtn.innerHTML = '↻ Rotate';
        rotateBtn.addEventListener('click', () => {
            component.rotate();
            this.canvas.updateConnectedWires(component);
            this.showComponent(component); // Refresh
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-secondary btn-small btn-danger';
        deleteBtn.innerHTML = '🗑 Delete';
        deleteBtn.addEventListener('click', () => {
            this.canvas.deleteSelected();
        });

        actions.appendChild(rotateBtn);
        actions.appendChild(deleteBtn);
        this.content.appendChild(actions);

        // Get property definitions
        const definitions = component.constructor.getPropertyDefinitions();

        if (definitions.length === 0) {
            const noProps = document.createElement('p');
            noProps.className = 'placeholder-text';
            noProps.textContent = 'No editable properties';
            this.content.appendChild(noProps);
        } else {
            // Create form fields for each property (with condition check)
            for (const def of definitions) {
                // Check if this property has a condition
                if (def.condition) {
                    // Evaluate condition against component properties
                    const conditionMet = this.evaluateCondition(def.condition, component.properties);
                    if (!conditionMet) continue;
                }
                const field = this.createPropertyField(component, def);
                this.content.appendChild(field);
            }
        }

        // Position info
        const posInfo = document.createElement('div');
        posInfo.className = 'property-field position-info';
        posInfo.innerHTML = `
            <label>Position</label>
            <span class="position-value">X: ${component.x}, Y: ${component.y}</span>
        `;
        this.content.appendChild(posInfo);

        // Rotation info
        const rotInfo = document.createElement('div');
        rotInfo.className = 'property-field';
        rotInfo.innerHTML = `
            <label>Rotation</label>
            <span class="rotation-value">${component.rotation}°</span>
        `;
        this.content.appendChild(rotInfo);
    }

    /**
     * Create a property input field
     */
    createPropertyField(component, definition) {
        const field = document.createElement('div');
        field.className = 'property-field';

        const label = document.createElement('label');
        label.textContent = definition.label;
        label.setAttribute('for', `prop-${definition.name}`);
        field.appendChild(label);

        let input;

        if (definition.type === 'select') {
            input = document.createElement('select');
            input.className = 'select-input';
            for (const opt of definition.options) {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt.toUpperCase();
                option.selected = component.properties[definition.name] === opt;
                input.appendChild(option);
            }
        } else {
            input = document.createElement('input');
            input.type = definition.type === 'number' ? 'number' : 'text';
            input.className = 'number-input';
            input.value = component.properties[definition.name];

            if (definition.min !== undefined) input.min = definition.min;
            if (definition.max !== undefined) input.max = definition.max;
            if (definition.step !== undefined) input.step = definition.step;
        }

        input.id = `prop-${definition.name}`;

        // Unit label
        if (definition.unit) {
            const wrapper = document.createElement('div');
            wrapper.className = 'input-with-unit';
            wrapper.appendChild(input);

            const unit = document.createElement('span');
            unit.className = 'input-unit';
            unit.textContent = definition.unit;
            wrapper.appendChild(unit);

            field.appendChild(wrapper);
        } else {
            field.appendChild(input);
        }

        // Handle value change
        const updateValue = () => {
            let value = input.value;

            if (definition.type === 'number') {
                value = parseFloat(value);
                if (isNaN(value)) return;
                if (definition.min !== undefined && value < definition.min) value = definition.min;
                if (definition.max !== undefined && value > definition.max) value = definition.max;
            }

            component.setProperty(definition.name, value);

            // Refresh panel if changing a property that affects conditions (like 'type')
            if (definition.name === 'type') {
                this.showComponent(component);
            }
        };

        input.addEventListener('change', updateValue);
        input.addEventListener('blur', updateValue);

        // Enter key to confirm
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                updateValue();
                input.blur();
            }
        });

        return field;
    }

    /**
     * Evaluate a condition string against component properties
     * @param {string} condition - e.g. 'type === "ac"'
     * @param {Object} properties - Component properties
     * @returns {boolean}
     */
    evaluateCondition(condition, properties) {
        try {
            // Simple evaluation for common patterns
            // Format: "propertyName === 'value'" or "propertyName !== 'value'"
            const match = condition.match(/(\w+)\s*(===|!==)\s*["']?(\w+)["']?/);
            if (match) {
                const [, propName, operator, value] = match;
                const propValue = properties[propName];
                if (operator === '===') {
                    return propValue === value;
                } else if (operator === '!==') {
                    return propValue !== value;
                }
            }
            return true;
        } catch {
            return true;
        }
    }

    /**
     * Refresh current component display
     */
    refresh() {
        if (this.currentComponent) {
            this.showComponent(this.currentComponent);
        }
    }
}

