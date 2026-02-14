/**
 * Template for verification_of_thevenin_theorem
 * This file is immutable and represents the default state.
 */

export const verification_of_thevenin_theorem_template = {
    expId: "basic-ee-exp-3",
    circuitType: "dc_linear",
    components: [
        {
            "id": "comp_17",
            "type": "voltage_source",
            "x": 240,
            "y": 300,
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
            "id": "comp_18",
            "type": "resistor",
            "x": 320,
            "y": 180,
            "rotation": 0,
            "properties": {
                "resistance": 270
            },
            "state": {}
        },
        {
            "id": "comp_19",
            "type": "resistor",
            "x": 460,
            "y": 180,
            "rotation": 0,
            "properties": {
                "resistance": 150
            },
            "state": {}
        },
        {
            "id": "comp_20",
            "type": "resistor",
            "x": 400,
            "y": 280,
            "rotation": 90,
            "properties": {
                "resistance": 220
            },
            "state": {}
        },
        {
            "id": "comp_21",
            "type": "resistor",
            "x": 560,
            "y": 360,
            "rotation": 90,
            "properties": {
                "resistance": 82
            },
            "state": {}
        },
        {
            "id": "comp_22",
            "type": "ammeter",
            "x": 560,
            "y": 240,
            "rotation": 90,
            "properties": {
                "current": 0.006355442569909869
            }
        },
        {
            "id": "comp_23",
            "type": "ground",
            "x": 400,
            "y": 460,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_24",
            "type": "junction",
            "x": 400,
            "y": 180,
            "rotation": 90,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_25",
            "type": "junction",
            "x": 560,
            "y": 180,
            "rotation": 90,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_26",
            "type": "junction",
            "x": 560,
            "y": 300,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_27",
            "type": "junction",
            "x": 560,
            "y": 420,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_28",
            "type": "junction",
            "x": 400,
            "y": 420,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_29",
            "type": "voltmeter",
            "x": 660,
            "y": 360,
            "rotation": 90,
            "properties": {
                "voltage": 0.5211462907326092
            }
        }
    ],
    "wires": [
        {
            "id": "wire_2",
            "startTerminal": "comp_17_negative",
            "endTerminal": "comp_28_node",
            "points": [
                {
                    "x": 240,
                    "y": 330
                },
                {
                    "x": 240,
                    "y": 330
                },
                {
                    "x": 240,
                    "y": 420
                },
                {
                    "x": 400,
                    "y": 420
                }
            ]
        },
        {
            "id": "wire_4",
            "startTerminal": "comp_28_node",
            "endTerminal": "comp_27_node",
            "points": [
                {
                    "x": 400,
                    "y": 420
                },
                {
                    "x": 480,
                    "y": 420
                },
                {
                    "x": 480,
                    "y": 420
                },
                {
                    "x": 560,
                    "y": 420
                }
            ]
        },
        {
            "id": "wire_6",
            "startTerminal": "comp_27_node",
            "endTerminal": "comp_21_right",
            "points": [
                {
                    "x": 560,
                    "y": 420
                },
                {
                    "x": 560,
                    "y": 420
                },
                {
                    "x": 560,
                    "y": 390
                },
                {
                    "x": 560,
                    "y": 390
                }
            ]
        },
        {
            "id": "wire_8",
            "startTerminal": "comp_21_left",
            "endTerminal": "comp_26_node",
            "points": [
                {
                    "x": 560,
                    "y": 330
                },
                {
                    "x": 560,
                    "y": 330
                },
                {
                    "x": 560,
                    "y": 300
                },
                {
                    "x": 560,
                    "y": 300
                }
            ]
        },
        {
            "id": "wire_10",
            "startTerminal": "comp_26_node",
            "endTerminal": "comp_22_negative",
            "points": [
                {
                    "x": 560,
                    "y": 300
                },
                {
                    "x": 560,
                    "y": 300
                },
                {
                    "x": 560,
                    "y": 270
                },
                {
                    "x": 560,
                    "y": 270
                }
            ]
        },
        {
            "id": "wire_12",
            "startTerminal": "comp_22_positive",
            "endTerminal": "comp_25_node",
            "points": [
                {
                    "x": 560,
                    "y": 210
                },
                {
                    "x": 560,
                    "y": 210
                },
                {
                    "x": 560,
                    "y": 180
                },
                {
                    "x": 560,
                    "y": 180
                }
            ]
        },
        {
            "id": "wire_14",
            "startTerminal": "comp_25_node",
            "endTerminal": "comp_19_right",
            "points": [
                {
                    "x": 560,
                    "y": 180
                },
                {
                    "x": 525,
                    "y": 180
                },
                {
                    "x": 525,
                    "y": 180
                },
                {
                    "x": 490,
                    "y": 180
                }
            ]
        },
        {
            "id": "wire_16",
            "startTerminal": "comp_19_left",
            "endTerminal": "comp_24_node",
            "points": [
                {
                    "x": 430,
                    "y": 180
                },
                {
                    "x": 415,
                    "y": 180
                },
                {
                    "x": 415,
                    "y": 180
                },
                {
                    "x": 400,
                    "y": 180
                }
            ]
        },
        {
            "id": "wire_18",
            "startTerminal": "comp_24_node",
            "endTerminal": "comp_18_right",
            "points": [
                {
                    "x": 400,
                    "y": 180
                },
                {
                    "x": 375,
                    "y": 180
                },
                {
                    "x": 375,
                    "y": 180
                },
                {
                    "x": 350,
                    "y": 180
                }
            ]
        },
        {
            "id": "wire_20",
            "startTerminal": "comp_18_left",
            "endTerminal": "comp_17_positive",
            "points": [
                {
                    "x": 290,
                    "y": 180
                },
                {
                    "x": 240,
                    "y": 180
                },
                {
                    "x": 240,
                    "y": 270
                },
                {
                    "x": 240,
                    "y": 270
                }
            ]
        },
        {
            "id": "wire_22",
            "startTerminal": "comp_24_node",
            "endTerminal": "comp_20_left",
            "points": [
                {
                    "x": 400,
                    "y": 180
                },
                {
                    "x": 400,
                    "y": 180
                },
                {
                    "x": 400,
                    "y": 250
                },
                {
                    "x": 400,
                    "y": 250
                }
            ]
        },
        {
            "id": "wire_24",
            "startTerminal": "comp_20_right",
            "endTerminal": "comp_28_node",
            "points": [
                {
                    "x": 400,
                    "y": 310
                },
                {
                    "x": 400,
                    "y": 310
                },
                {
                    "x": 400,
                    "y": 420
                },
                {
                    "x": 400,
                    "y": 420
                }
            ]
        },
        {
            "id": "wire_27",
            "startTerminal": "comp_26_node",
            "endTerminal": "comp_29_positive",
            "points": [
                {
                    "x": 560,
                    "y": 300
                },
                {
                    "x": 660,
                    "y": 300
                },
                {
                    "x": 660,
                    "y": 330
                },
                {
                    "x": 660,
                    "y": 330
                }
            ]
        },
        {
            "id": "wire_29",
            "startTerminal": "comp_29_negative",
            "endTerminal": "comp_27_node",
            "points": [
                {
                    "x": 660,
                    "y": 390
                },
                {
                    "x": 660,
                    "y": 390
                },
                {
                    "x": 660,
                    "y": 420
                },
                {
                    "x": 560,
                    "y": 420
                }
            ]
        },
        {
            "id": "wire_31",
            "startTerminal": "comp_28_node",
            "endTerminal": "comp_23_ref",
            "points": [
                {
                    "x": 400,
                    "y": 420
                },
                {
                    "x": 400,
                    "y": 420
                },
                {
                    "x": 400,
                    "y": 445
                },
                {
                    "x": 400,
                    "y": 445
                }
            ]
        }
    ]
};
