export const three_phase_connections_template = {
    expId: "basic-ee-exp-6",
    circuitType: "AC",
    components: [
        {
            "id": "comp_23",
            "type": "three_phase_source",
            "x": 240,
            "y": 260,
            "rotation": 0,
            "properties": {
                "voltage": 415,
                "frequency": 50,
                "phaseShift": 0
            },
            "state": {}
        },
        {
            "id": "comp_24",
            "type": "transformer",
            "x": 560,
            "y": 140,
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
            "id": "comp_25",
            "type": "transformer",
            "x": 560,
            "y": 300,
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
            "id": "comp_26",
            "type": "transformer",
            "x": 560,
            "y": 460,
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
            "id": "comp_27",
            "type": "voltmeter",
            "x": 440,
            "y": 220,
            "rotation": 90,
            "properties": {
                "voltage": 0
            }
        },
        {
            "id": "comp_28",
            "type": "junction",
            "x": 440,
            "y": 120,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_29",
            "type": "junction",
            "x": 440,
            "y": 280,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_30",
            "type": "junction",
            "x": 680,
            "y": 320,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_31",
            "type": "voltmeter",
            "x": 620,
            "y": 220,
            "rotation": 90,
            "properties": {
                "voltage": 0
            }
        },
        {
            "id": "comp_32",
            "type": "ground",
            "x": 400,
            "y": 560,
            "rotation": 0,
            "properties": {},
            "state": {}
        }
    ],
    wires: [
        {
            "id": "wire_7",
            "startTerminal": "comp_23_phase_B",
            "endTerminal": "comp_26_primary_pos",
            "points": [
                {
                    "x": 270,
                    "y": 300
                },
                {
                    "x": 260,
                    "y": 300
                },
                {
                    "x": 260,
                    "y": 430
                },
                {
                    "x": 520,
                    "y": 430
                }
            ]
        },
        {
            "id": "wire_9",
            "startTerminal": "comp_23_neutral",
            "endTerminal": "comp_24_primary_neg",
            "points": [
                {
                    "x": 210,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 170
                },
                {
                    "x": 520,
                    "y": 170
                }
            ]
        },
        {
            "id": "wire_11",
            "startTerminal": "comp_23_neutral",
            "endTerminal": "comp_25_primary_neg",
            "points": [
                {
                    "x": 210,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 330
                },
                {
                    "x": 520,
                    "y": 330
                }
            ]
        },
        {
            "id": "wire_13",
            "startTerminal": "comp_23_neutral",
            "endTerminal": "comp_26_primary_neg",
            "points": [
                {
                    "x": 210,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 490
                },
                {
                    "x": 520,
                    "y": 490
                }
            ]
        },
        {
            "id": "wire_17",
            "startTerminal": "comp_28_node",
            "endTerminal": "comp_24_primary_pos",
            "points": [
                {
                    "x": 440,
                    "y": 120
                },
                {
                    "x": 480,
                    "y": 120
                },
                {
                    "x": 480,
                    "y": 110
                },
                {
                    "x": 520,
                    "y": 110
                }
            ]
        },
        {
            "id": "wire_19",
            "startTerminal": "comp_28_node",
            "endTerminal": "comp_27_positive",
            "points": [
                {
                    "x": 440,
                    "y": 120
                },
                {
                    "x": 440,
                    "y": 120
                },
                {
                    "x": 440,
                    "y": 190
                },
                {
                    "x": 440,
                    "y": 190
                }
            ]
        },
        {
            "id": "wire_21",
            "startTerminal": "comp_23_phase_R",
            "endTerminal": "comp_28_node",
            "points": [
                {
                    "x": 210,
                    "y": 220
                },
                {
                    "x": 200,
                    "y": 220
                },
                {
                    "x": 200,
                    "y": 120
                },
                {
                    "x": 440,
                    "y": 120
                }
            ]
        },
        {
            "id": "wire_23",
            "startTerminal": "comp_29_node",
            "endTerminal": "comp_25_primary_pos",
            "points": [
                {
                    "x": 440,
                    "y": 280
                },
                {
                    "x": 480,
                    "y": 280
                },
                {
                    "x": 480,
                    "y": 270
                },
                {
                    "x": 520,
                    "y": 270
                }
            ]
        },
        {
            "id": "wire_25",
            "startTerminal": "comp_27_negative",
            "endTerminal": "comp_29_node",
            "points": [
                {
                    "x": 440,
                    "y": 250
                },
                {
                    "x": 440,
                    "y": 250
                },
                {
                    "x": 440,
                    "y": 280
                },
                {
                    "x": 440,
                    "y": 280
                }
            ]
        },
        {
            "id": "wire_27",
            "startTerminal": "comp_29_node",
            "endTerminal": "comp_23_phase_Y",
            "points": [
                {
                    "x": 440,
                    "y": 280
                },
                {
                    "x": 355,
                    "y": 280
                },
                {
                    "x": 355,
                    "y": 220
                },
                {
                    "x": 270,
                    "y": 220
                }
            ]
        },
        {
            "id": "wire_30",
            "startTerminal": "comp_24_secondary_neg",
            "endTerminal": "comp_30_node",
            "points": [
                {
                    "x": 600,
                    "y": 170
                },
                {
                    "x": 680,
                    "y": 170
                },
                {
                    "x": 680,
                    "y": 320
                },
                {
                    "x": 680,
                    "y": 320
                }
            ]
        },
        {
            "id": "wire_32",
            "startTerminal": "comp_30_node",
            "endTerminal": "comp_25_secondary_neg",
            "points": [
                {
                    "x": 680,
                    "y": 320
                },
                {
                    "x": 640,
                    "y": 320
                },
                {
                    "x": 640,
                    "y": 330
                },
                {
                    "x": 600,
                    "y": 330
                }
            ]
        },
        {
            "id": "wire_34",
            "startTerminal": "comp_30_node",
            "endTerminal": "comp_26_secondary_neg",
            "points": [
                {
                    "x": 680,
                    "y": 320
                },
                {
                    "x": 680,
                    "y": 320
                },
                {
                    "x": 680,
                    "y": 490
                },
                {
                    "x": 600,
                    "y": 490
                }
            ]
        },
        {
            "id": "wire_36",
            "startTerminal": "comp_31_positive",
            "endTerminal": "comp_24_secondary_pos",
            "points": [
                {
                    "x": 620,
                    "y": 190
                },
                {
                    "x": 620,
                    "y": 190
                },
                {
                    "x": 620,
                    "y": 110
                },
                {
                    "x": 600,
                    "y": 110
                }
            ]
        },
        {
            "id": "wire_38",
            "startTerminal": "comp_31_negative",
            "endTerminal": "comp_25_secondary_pos",
            "points": [
                {
                    "x": 620,
                    "y": 250
                },
                {
                    "x": 620,
                    "y": 250
                },
                {
                    "x": 620,
                    "y": 270
                },
                {
                    "x": 600,
                    "y": 270
                }
            ]
        },
        {
            "id": "wire_40",
            "startTerminal": "comp_23_neutral",
            "endTerminal": "comp_32_ref",
            "points": [
                {
                    "x": 210,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 300
                },
                {
                    "x": 140,
                    "y": 545
                },
                {
                    "x": 400,
                    "y": 545
                }
            ]
        }
    ]
};
