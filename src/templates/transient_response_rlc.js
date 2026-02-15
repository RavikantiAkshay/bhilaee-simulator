/**
 * Template for transient_response_rlc
 * Transient Response of Series RL, RC and RLC Circuits
 * This file is immutable and represents the default state.
 */

export const transient_response_rlc_template = {
    expId: "basic-ee-exp-4",
    circuitType: "transient_rlc",
    components: [
        {
            "id": "comp_19",
            "type": "voltage_source",
            "x": 180,
            "y": 260,
            "rotation": 0,
            "properties": {
                "voltage": 5,
                "type": "dc",
                "frequency": 50,
                "phase": 0
            },
            "state": {}
        },
        {
            "id": "comp_20",
            "type": "resistor",
            "x": 260,
            "y": 180,
            "rotation": 0,
            "properties": {
                "resistance": 1000
            },
            "state": {}
        },
        {
            "id": "comp_21",
            "type": "capacitor",
            "x": 500,
            "y": 180,
            "rotation": 0,
            "properties": {
                "capacitance": 1e-7
            },
            "state": {
                "voltage": 0,
                "current": 0
            }
        },
        {
            "id": "comp_22",
            "type": "inductor",
            "x": 380,
            "y": 180,
            "rotation": 0,
            "properties": {
                "inductance": 0.01
            },
            "state": {
                "current": 0,
                "voltage": 0
            }
        },
        {
            "id": "comp_23",
            "type": "ground",
            "x": 360,
            "y": 340,
            "rotation": 0,
            "properties": {},
            "state": {}
        }
    ],
    wires: [
        {
            "id": "wire_2",
            "startTerminal": "comp_19_positive",
            "endTerminal": "comp_20_left",
            "points": [
                { "x": 180, "y": 230 },
                { "x": 180, "y": 230 },
                { "x": 180, "y": 180 },
                { "x": 230, "y": 180 }
            ]
        },
        {
            "id": "wire_4",
            "startTerminal": "comp_20_right",
            "endTerminal": "comp_22_left",
            "points": [
                { "x": 290, "y": 180 },
                { "x": 320, "y": 180 },
                { "x": 320, "y": 180 },
                { "x": 350, "y": 180 }
            ]
        },
        {
            "id": "wire_6",
            "startTerminal": "comp_22_right",
            "endTerminal": "comp_21_left",
            "points": [
                { "x": 410, "y": 180 },
                { "x": 440, "y": 180 },
                { "x": 440, "y": 180 },
                { "x": 470, "y": 180 }
            ]
        },
        {
            "id": "wire_8",
            "startTerminal": "comp_19_negative",
            "endTerminal": "comp_23_ref",
            "points": [
                { "x": 180, "y": 290 },
                { "x": 180, "y": 290 },
                { "x": 180, "y": 325 },
                { "x": 360, "y": 325 }
            ]
        },
        {
            "id": "wire_10",
            "startTerminal": "comp_23_ref",
            "endTerminal": "comp_21_right",
            "points": [
                { "x": 360, "y": 325 },
                { "x": 540, "y": 325 },
                { "x": 540, "y": 180 },
                { "x": 530, "y": 180 }
            ]
        }
    ]
};
