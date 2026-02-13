/**
 * StateManager.js - Manages persistent state for circuit simulations
 * 
 * Handles simulation state per experiment/lab using localStorage.
 * Ensures state isolation between different experiments.
 */

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
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return null;

            const state = JSON.parse(raw);
            console.log(`StateManager: Loaded state for ${this.expId}`, state);
            return state;
        } catch (e) {
            console.error('StateManager: Failed to load state', e);
            return null;
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
