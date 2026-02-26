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
import { oc_sc_test_single_phase_transformer_template }
    from "./oc_sc_test_single_phase_transformer.js";

import { three_phase_connections_template }
    from "./three_phase_connections.js";

import { power_factor_correction_template }
    from "./power_factor_correction.js";

import { transformer_test_template }
    from "./transformer_test.js";

import { diode_rectifiers_template }
    from "./diode_rectifiers.js";

import { opamp_arithmetics_template }
    from "./opamp_arithmetics.js";

export const circuitTemplates = {
    "basic-ee-exp-1":
        power_factor_correction_template,
    "basic-ee-exp-2":
        verification_of_superposition_theorem_template,
    "basic-ee-exp-3":
        verification_of_thevenin_theorem_template,
    "basic-ee-exp-4":
        transient_response_rlc_template,
    "basic-ee-exp-5":
        oc_sc_test_single_phase_transformer_template,
    "basic-ee-exp-6":
        three_phase_connections_template,
    "basic-ee-exp-7":
        transformer_test_template,
    "devices_and_circuits-exp3":
        diode_rectifiers_template,
    "devices_and_circuits-exp4":
        opamp_arithmetics_template
};
