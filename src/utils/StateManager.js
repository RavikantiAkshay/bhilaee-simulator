/**
 * StateManager.js - Manages persistent state for circuit simulations
 * 
 * Handles simulation state per experiment/lab using localStorage.
 * Ensures state isolation between different experiments.
 */

import { circuitTemplates } from '../templates/index.js';

export class StateManager {
    /**
     * @param {string} expId - Experiment identifier (e.g., 'superposition')
     */
    constructor(expId) {
        if (!expId) {
            console.warn('StateManager: No expId provided, defaulting to "sandbox"');
            this.expId = 'sandbox';
        } else {
            this.expId = expId;
        }

        this.storageKey = `sim_state_${this.expId}`;
        this.autosaveTimer = null;
        this.lastSavedState = null;
    }

    /**
     * Load state from storage
     * @returns {Object|null} The parsed state or null if not found
     */
    loadState() {
        try {
            // Check for forced new session
            const urlParams = new URLSearchParams(window.location.search);
            const isNewSession = urlParams.get('newSession') === 'true';

            if (isNewSession) {
                console.log(`StateManager: Forced new session for ${this.expId}`);

                // Clear existing state to ensure fresh start
                localStorage.removeItem(this.storageKey);

                // Remove newSession from URL to allow future reloads to use saved state
                urlParams.delete('newSession');
                const newQuery = urlParams.toString();
                const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
                window.history.replaceState({}, '', newUrl);

                // Fall through to load template
            } else {
                const raw = localStorage.getItem(this.storageKey);
                if (raw) {
                    const state = JSON.parse(raw);
                    console.log(`StateManager: Loaded persistent state for ${this.expId}`);
                    return state;
                }
            }

            // Fallback: Check for template
            const template = circuitTemplates[this.expId];
            if (template) {
                console.log(`StateManager: Initializing from template for ${this.expId}`);
                // Deep clone template to avoid mutation
                const initialState = {
                    expId: this.expId,
                    timestamp: Date.now(),
                    // Template structure might differ from serialized circuit, 
                    // dependent on how user provides "connections".
                    // For now, we assume template follows a structure we can parse or use.
                    // Actually, the user's template has 'components' and 'connections'.
                    // Our serialize() returns { components: [...], wires: [...] }.
                    // We might need a flexible adapter here, but user said "Structure of sim_states: { ...stateObject... }"
                    // which implies the template *is* the state object or close to it.
                    // Let's wrap it in the expected state structure.
                    circuit: JSON.parse(JSON.stringify(template))
                };

                // Return immediately without saving to localStorage
                // This ensures reloads fetch the immutable template unless user saves manually
                return initialState;
            }

            return null;
        } catch (e) {
            console.error('StateManager: Failed to load state', e);
            return null;
        }
    }

    /**
     * Helper to save state object directly (internal use)
     */
    saveIntervalState(state) {
        try {
            const json = JSON.stringify(state);
            localStorage.setItem(this.storageKey, json);
            this.lastSavedState = json;
        } catch (e) {
            console.error('StateManager: Failed to save initial template state', e);
        }
    }

    /**
     * Save state to storage
     * @param {Object} circuitGraph - The circuit graph instance to serialize
     */
    saveState(circuitGraph) {
        try {
            const data = circuitGraph.serialize();
            const state = {
                expId: this.expId,
                timestamp: Date.now(),
                circuit: data
            };

            const json = JSON.stringify(state);

            if (json === this.lastSavedState) return;

            localStorage.setItem(this.storageKey, json);
            this.lastSavedState = json;
            console.log(`StateManager: Auto-saved state for ${this.expId}`);

            // Optional: Update UI to show saved state (could trigger an event)
            const saveBtn = document.getElementById('btn-save');
            if (saveBtn && !saveBtn.textContent.includes('✓')) {
                const original = saveBtn.innerHTML;
                saveBtn.style.opacity = '0.7';
                setTimeout(() => saveBtn.style.opacity = '1', 200);
            }
        } catch (e) {
            console.error('StateManager: Failed to save state', e);
        }
    }

    /**
     * Schedule an autosave (debounce)
     * @param {Object} circuitGraph 
     * @param {number} delayMs 
     */
    autosave(circuitGraph, delayMs = 1000) {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }

        this.autosaveTimer = setTimeout(() => {
            this.saveState(circuitGraph);
        }, delayMs);
    }

    /**
     * Reset state for this experiment
     */
    resetState() {
        localStorage.removeItem(this.storageKey);
        this.lastSavedState = null;
        console.log(`StateManager: Reset state for ${this.expId}`);
    }

    /**
     * Get all saved experiments (utility)
     */
    static listSavedExperiments() {
        const experiments = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('sim_state_')) {
                experiments.push(key.replace('sim_state_', ''));
            }
        }
        return experiments;
    }
}
