/**
 * Template for OC and SC Test of Single Phase Transformer
 * Experiment ID: basic-ee-exp-5
 * This file is the default starting state.
 */

export const oc_sc_test_single_phase_transformer_template = {
    expId: "basic-ee-exp-5",
    circuitType: "oc_sc_test_single_phase_transformer",
    components: [
        {
            "id": "comp_21",
            "type": "voltage_source",
            "x": 140,
            "y": 240,
            "rotation": 0,
            "properties": {
                "voltage": 120,
                "type": "ac",
                "frequency": 50,
                "phase": 0
            },
            "state": {}
        },
        {
            "id": "comp_22",
            "type": "ammeter",
            "x": 260,
            "y": 160,
            "rotation": 0,
            "properties": {
                "current": 0.09990665847914172
            }
        },
        {
            "id": "comp_23",
            "type": "wattmeter",
            "x": 400,
            "y": 200,
            "rotation": 0,
            "properties": {
                "power": 11.988655017497006,
                "voltage": 120,
                "current": 0.09990545847914171
            }
        },
        {
            "id": "comp_24",
            "type": "voltmeter",
            "x": 540,
            "y": 240,
            "rotation": 90,
            "properties": {
                "voltage": 120
            }
        },
        {
            "id": "comp_26",
            "type": "ground",
            "x": 400,
            "y": 360,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_27",
            "type": "junction",
            "x": 540,
            "y": 160,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_29",
            "type": "transformer",
            "x": 660,
            "y": 240,
            "rotation": 0,
            "properties": {
                "turnsRatio": 0.5,
                "Req": 1.15,
                "Xeq": 0.85,
                "Rc": 1200,
                "Xm": 1000,
                "ratingKVA": 2,
                "primaryVoltage": 120,
                "secondaryVoltage": 240
            },
            "state": {}
        }
    ],
    wires: [
        {
            "id": "wire_2",
            "startTerminal": "comp_21_positive",
            "endTerminal": "comp_22_positive",
            "points": [
                {
                    "x": 140,
                    "y": 210
                },
                {
                    "x": 140,
                    "y": 210
                },
                {
                    "x": 140,
                    "y": 160
                },
                {
                    "x": 230,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_4",
            "startTerminal": "comp_22_negative",
            "endTerminal": "comp_23_M",
            "points": [
                {
                    "x": 290,
                    "y": 160
                },
                {
                    "x": 325,
                    "y": 160
                },
                {
                    "x": 325,
                    "y": 175
                },
                {
                    "x": 360,
                    "y": 175
                }
            ]
        },
        {
            "id": "wire_7",
            "startTerminal": "comp_23_M",
            "endTerminal": "comp_23_C",
            "points": [
                {
                    "x": 360,
                    "y": 175
                },
                {
                    "x": 360,
                    "y": 175
                },
                {
                    "x": 360,
                    "y": 225
                },
                {
                    "x": 360,
                    "y": 225
                }
            ]
        },
        {
            "id": "wire_9",
            "startTerminal": "comp_21_negative",
            "endTerminal": "comp_26_ref",
            "points": [
                {
                    "x": 140,
                    "y": 270
                },
                {
                    "x": 140,
                    "y": 270
                },
                {
                    "x": 140,
                    "y": 345
                },
                {
                    "x": 400,
                    "y": 345
                }
            ]
        },
        {
            "id": "wire_11",
            "startTerminal": "comp_23_V",
            "endTerminal": "comp_26_ref",
            "points": [
                {
                    "x": 440,
                    "y": 225
                },
                {
                    "x": 440,
                    "y": 225
                },
                {
                    "x": 440,
                    "y": 345
                },
                {
                    "x": 400,
                    "y": 345
                }
            ]
        },
        {
            "id": "wire_13",
            "startTerminal": "comp_26_ref",
            "endTerminal": "comp_24_negative",
            "points": [
                {
                    "x": 400,
                    "y": 345
                },
                {
                    "x": 540,
                    "y": 345
                },
                {
                    "x": 540,
                    "y": 270
                },
                {
                    "x": 540,
                    "y": 270
                }
            ]
        },
        {
            "id": "wire_15",
            "startTerminal": "comp_23_L",
            "endTerminal": "comp_27_node",
            "points": [
                {
                    "x": 440,
                    "y": 175
                },
                {
                    "x": 490,
                    "y": 175
                },
                {
                    "x": 490,
                    "y": 160
                },
                {
                    "x": 540,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_17",
            "startTerminal": "comp_24_positive",
            "endTerminal": "comp_27_node",
            "points": [
                {
                    "x": 540,
                    "y": 210
                },
                {
                    "x": 540,
                    "y": 210
                },
                {
                    "x": 540,
                    "y": 160
                },
                {
                    "x": 540,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_19",
            "startTerminal": "comp_27_node",
            "endTerminal": "comp_29_primary_pos",
            "points": [
                {
                    "x": 540,
                    "y": 160
                },
                {
                    "x": 620,
                    "y": 160
                },
                {
                    "x": 620,
                    "y": 210
                },
                {
                    "x": 620,
                    "y": 210
                }
            ]
        },
        {
            "id": "wire_22",
            "startTerminal": "comp_29_primary_neg",
            "endTerminal": "comp_26_ref",
            "points": [
                {
                    "x": 620,
                    "y": 270
                },
                {
                    "x": 620,
                    "y": 270
                },
                {
                    "x": 620,
                    "y": 345
                },
                {
                    "x": 400,
                    "y": 345
                }
            ]
        }
    ]
};
