/**
 * Template Registry
 * Maps experiment IDs to their default circuit templates.
 */

import { verification_of_superposition_theorem_template }
    from "./verification_of_superposition_theorem.js";
import { verification_of_thevenin_theorem_template }
    from "./verification_of_thevenin_theorem.js";
import { transient_response_rlc_template }
    from "./transient_response_rlc.js";

export const circuitTemplates = {
    "basic-ee-exp-2":
        verification_of_superposition_theorem_template,
    "basic-ee-exp-3":
        verification_of_thevenin_theorem_template,
    "basic-ee-exp-4":
        transient_response_rlc_template
};
