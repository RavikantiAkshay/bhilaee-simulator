/**
 * Template for verification_of_superposition_theorem
 * This file is immutable and represents the default state.
 */

export const verification_of_superposition_theorem_template = {
    expId: "basic-ee-exp-2",
    circuitType: "dc_linear",
    components: [
        {
            "id": "comp_13",
            "type": "voltage_source",
            "x": 340,
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
            "id": "comp_16",
            "type": "resistor",
            "x": 420,
            "y": 160,
            "rotation": 0,
            "properties": {
                "resistance": 330
            },
            "state": {}
        },
        {
            "id": "comp_17",
            "type": "resistor",
            "x": 580,
            "y": 160,
            "rotation": 0,
            "properties": {
                "resistance": 220
            },
            "state": {}
        },
        {
            "id": "comp_18",
            "type": "resistor",
            "x": 500,
            "y": 340,
            "rotation": 90,
            "properties": {
                "resistance": 1000
            },
            "state": {}
        },
        {
            "id": "comp_19",
            "type": "voltage_source",
            "x": 660,
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
            "id": "comp_21",
            "type": "ground",
            "x": 500,
            "y": 460,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_22",
            "type": "junction",
            "x": 500,
            "y": 160,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_23",
            "type": "ammeter",
            "x": 500,
            "y": 240,
            "rotation": 90,
            "properties": {
                "current": 0
            }
        }
    ],
    wires: [
        {
            "id": "wire_2",
            "startTerminal": "comp_13_positive",
            "endTerminal": "comp_16_left",
            "points": [
                {
                    "x": 340,
                    "y": 230
                },
                {
                    "x": 365,
                    "y": 230
                },
                {
                    "x": 365,
                    "y": 160
                },
                {
                    "x": 390,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_6",
            "startTerminal": "comp_16_right",
            "endTerminal": "comp_22_node",
            "points": [
                {
                    "x": 450,
                    "y": 160
                },
                {
                    "x": 475,
                    "y": 160
                },
                {
                    "x": 475,
                    "y": 160
                },
                {
                    "x": 500,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_8",
            "startTerminal": "comp_22_node",
            "endTerminal": "comp_17_left",
            "points": [
                {
                    "x": 500,
                    "y": 160
                },
                {
                    "x": 525,
                    "y": 160
                },
                {
                    "x": 525,
                    "y": 160
                },
                {
                    "x": 550,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_12",
            "startTerminal": "comp_17_right",
            "endTerminal": "comp_19_positive",
            "points": [
                {
                    "x": 610,
                    "y": 160
                },
                {
                    "x": 635,
                    "y": 160
                },
                {
                    "x": 635,
                    "y": 230
                },
                {
                    "x": 660,
                    "y": 230
                }
            ]
        },
        {
            "id": "wire_14",
            "startTerminal": "comp_13_negative",
            "endTerminal": "comp_21_ref",
            "points": [
                {
                    "x": 340,
                    "y": 290
                },
                {
                    "x": 420,
                    "y": 290
                },
                {
                    "x": 420,
                    "y": 445
                },
                {
                    "x": 500,
                    "y": 445
                }
            ]
        },
        {
            "id": "wire_16",
            "startTerminal": "comp_21_ref",
            "endTerminal": "comp_19_negative",
            "points": [
                {
                    "x": 500,
                    "y": 445
                },
                {
                    "x": 580,
                    "y": 445
                },
                {
                    "x": 580,
                    "y": 290
                },
                {
                    "x": 660,
                    "y": 290
                }
            ]
        },
        {
            "id": "wire_18",
            "startTerminal": "comp_21_ref",
            "endTerminal": "comp_18_right",
            "points": [
                {
                    "x": 500,
                    "y": 445
                },
                {
                    "x": 500,
                    "y": 445
                },
                {
                    "x": 500,
                    "y": 370
                },
                {
                    "x": 500,
                    "y": 370
                }
            ]
        },
        {
            "id": "wire_25",
            "startTerminal": "comp_23_positive",
            "endTerminal": "comp_22_node",
            "points": [
                {
                    "x": 500,
                    "y": 210
                },
                {
                    "x": 500,
                    "y": 210
                },
                {
                    "x": 500,
                    "y": 160
                },
                {
                    "x": 500,
                    "y": 160
                }
            ]
        },
        {
            "id": "wire_27",
            "startTerminal": "comp_23_negative",
            "endTerminal": "comp_18_left",
            "points": [
                {
                    "x": 500,
                    "y": 270
                },
                {
                    "x": 500,
                    "y": 270
                },
                {
                    "x": 500,
                    "y": 310
                },
                {
                    "x": 500,
                    "y": 310
                }
            ]
        }
    ]
};
