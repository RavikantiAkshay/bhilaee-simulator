/**
 * Template for Load and No Load Test of Transformer
 * Experiment ID: basic-ee-exp-7 
 * This file is the default starting state.
 */

export const transformer_test_template = {
    expId: "basic-ee-exp-7",
    circuitType: "transformer_test",
    components: [
        {
            "id": "comp_27",
            "type": "voltage_source",
            "x": 160,
            "y": 180,
            "rotation": 0,
            "properties": {
                "voltage": 230,
                "type": "ac",
                "frequency": 50,
                "phase": 0
            },
            "state": {}
        },
        {
            "id": "comp_28",
            "type": "wattmeter",
            "x": 300,
            "y": 120,
            "rotation": 0,
            "properties": {
                "power": 0,
                "voltage": 0,
                "current": 0
            }
        },
        {
            "id": "comp_29",
            "type": "ground",
            "x": 300,
            "y": 280,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_30",
            "type": "junction",
            "x": 420,
            "y": 100,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_31",
            "type": "junction",
            "x": 420,
            "y": 260,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_32",
            "type": "voltmeter",
            "x": 420,
            "y": 180,
            "rotation": 90,
            "properties": {
                "voltage": 0
            }
        },
        {
            "id": "comp_33",
            "type": "transformer",
            "x": 540,
            "y": 180,
            "rotation": 0,
            "properties": {
                "turnsRatio": 2,
                "Req": 1.15,
                "Xeq": 0.85,
                "Rc": 1200,
                "Xm": 1000,
                "ratingKVA": 2,
                "primaryVoltage": 240,
                "secondaryVoltage": 120
            },
            "state": {}
        },
        {
            "id": "comp_34",
            "type": "junction",
            "x": 640,
            "y": 100,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_35",
            "type": "junction",
            "x": 640,
            "y": 260,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_36",
            "type": "voltmeter",
            "x": 640,
            "y": 180,
            "rotation": 90,
            "properties": {
                "voltage": 0
            }
        },
        {
            "id": "comp_37",
            "type": "ammeter",
            "x": 700,
            "y": 100,
            "rotation": 0,
            "properties": {
                "current": 0
            }
        },
        {
            "id": "comp_38",
            "type": "load",
            "x": 760,
            "y": 180,
            "rotation": 90,
            "properties": {
                "loadPercent": 75
            },
            "state": {
                "inductorCurrent": 0,
                "inductorVoltage": 0
            }
        }
    ],
    wires: [
        {
            "id": "wire_2",
            "startTerminal": "comp_27_positive",
            "endTerminal": "comp_28_M",
            "points": [
                {
                    "x": 160,
                    "y": 150
                },
                {
                    "x": 160,
                    "y": 150
                },
                {
                    "x": 160,
                    "y": 95
                },
                {
                    "x": 260,
                    "y": 95
                }
            ]
        },
        {
            "id": "wire_4",
            "startTerminal": "comp_27_negative",
            "endTerminal": "comp_29_ref",
            "points": [
                {
                    "x": 160,
                    "y": 210
                },
                {
                    "x": 160,
                    "y": 210
                },
                {
                    "x": 160,
                    "y": 265
                },
                {
                    "x": 300,
                    "y": 265
                }
            ]
        },
        {
            "id": "wire_7",
            "startTerminal": "comp_29_ref",
            "endTerminal": "comp_28_V",
            "points": [
                {
                    "x": 300,
                    "y": 265
                },
                {
                    "x": 340,
                    "y": 265
                },
                {
                    "x": 340,
                    "y": 145
                },
                {
                    "x": 340,
                    "y": 145
                }
            ]
        },
        {
            "id": "wire_9",
            "startTerminal": "comp_29_ref",
            "endTerminal": "comp_31_node",
            "points": [
                {
                    "x": 300,
                    "y": 265
                },
                {
                    "x": 360,
                    "y": 265
                },
                {
                    "x": 360,
                    "y": 260
                },
                {
                    "x": 420,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_11",
            "startTerminal": "comp_28_L",
            "endTerminal": "comp_30_node",
            "points": [
                {
                    "x": 340,
                    "y": 95
                },
                {
                    "x": 380,
                    "y": 95
                },
                {
                    "x": 380,
                    "y": 100
                },
                {
                    "x": 420,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_13",
            "startTerminal": "comp_32_positive",
            "endTerminal": "comp_30_node",
            "points": [
                {
                    "x": 420,
                    "y": 150
                },
                {
                    "x": 420,
                    "y": 150
                },
                {
                    "x": 420,
                    "y": 100
                },
                {
                    "x": 420,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_15",
            "startTerminal": "comp_32_negative",
            "endTerminal": "comp_31_node",
            "points": [
                {
                    "x": 420,
                    "y": 210
                },
                {
                    "x": 420,
                    "y": 210
                },
                {
                    "x": 420,
                    "y": 260
                },
                {
                    "x": 420,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_17",
            "startTerminal": "comp_30_node",
            "endTerminal": "comp_33_primary_pos",
            "points": [
                {
                    "x": 420,
                    "y": 100
                },
                {
                    "x": 500,
                    "y": 100
                },
                {
                    "x": 500,
                    "y": 150
                },
                {
                    "x": 500,
                    "y": 150
                }
            ]
        },
        {
            "id": "wire_19",
            "startTerminal": "comp_33_primary_neg",
            "endTerminal": "comp_31_node",
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
                    "y": 260
                },
                {
                    "x": 420,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_21",
            "startTerminal": "comp_33_secondary_pos",
            "endTerminal": "comp_34_node",
            "points": [
                {
                    "x": 580,
                    "y": 150
                },
                {
                    "x": 580,
                    "y": 150
                },
                {
                    "x": 580,
                    "y": 100
                },
                {
                    "x": 640,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_23",
            "startTerminal": "comp_33_secondary_neg",
            "endTerminal": "comp_35_node",
            "points": [
                {
                    "x": 580,
                    "y": 210
                },
                {
                    "x": 580,
                    "y": 210
                },
                {
                    "x": 580,
                    "y": 260
                },
                {
                    "x": 640,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_25",
            "startTerminal": "comp_36_positive",
            "endTerminal": "comp_34_node",
            "points": [
                {
                    "x": 640,
                    "y": 150
                },
                {
                    "x": 640,
                    "y": 150
                },
                {
                    "x": 640,
                    "y": 100
                },
                {
                    "x": 640,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_27",
            "startTerminal": "comp_36_negative",
            "endTerminal": "comp_35_node",
            "points": [
                {
                    "x": 640,
                    "y": 210
                },
                {
                    "x": 640,
                    "y": 210
                },
                {
                    "x": 640,
                    "y": 260
                },
                {
                    "x": 640,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_29",
            "startTerminal": "comp_34_node",
            "endTerminal": "comp_37_positive",
            "points": [
                {
                    "x": 640,
                    "y": 100
                },
                {
                    "x": 655,
                    "y": 100
                },
                {
                    "x": 655,
                    "y": 100
                },
                {
                    "x": 670,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_31",
            "startTerminal": "comp_38_left",
            "endTerminal": "comp_37_negative",
            "points": [
                {
                    "x": 760,
                    "y": 140
                },
                {
                    "x": 760,
                    "y": 140
                },
                {
                    "x": 760,
                    "y": 100
                },
                {
                    "x": 730,
                    "y": 100
                }
            ]
        },
        {
            "id": "wire_33",
            "startTerminal": "comp_38_right",
            "endTerminal": "comp_35_node",
            "points": [
                {
                    "x": 760,
                    "y": 220
                },
                {
                    "x": 760,
                    "y": 220
                },
                {
                    "x": 760,
                    "y": 260
                },
                {
                    "x": 640,
                    "y": 260
                }
            ]
        },
        {
            "id": "wire_35",
            "startTerminal": "comp_28_M",
            "endTerminal": "comp_28_C",
            "points": [
                {
                    "x": 260,
                    "y": 95
                },
                {
                    "x": 260,
                    "y": 95
                },
                {
                    "x": 260,
                    "y": 145
                },
                {
                    "x": 260,
                    "y": 145
                }
            ]
        }
    ]
};
