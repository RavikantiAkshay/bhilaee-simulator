export const power_factor_correction_template = {
    expId: "basic-ee-exp-1",
    circuitType: "AC",
    components: [
        {
            "id": "comp_1",
            "type": "voltage_source",
            "x": 260,
            "y": 220,
            "rotation": 0,
            "properties": {
                "voltage": 174,
                "type": "ac",
                "frequency": 50,
                "phase": 0
            },
            "state": {}
        },
        {
            "id": "comp_2",
            "type": "ammeter",
            "x": 320,
            "y": 140,
            "rotation": 0,
            "properties": {
                "current": 2.0028036587678355
            }
        },
        {
            "id": "comp_3",
            "type": "wattmeter",
            "x": 460,
            "y": 160,
            "rotation": 0,
            "properties": {
                "power": 240.67307487905,
                "voltage": 174,
                "current": 2.002802457085896
            }
        },
        {
            "id": "comp_4",
            "type": "resistor",
            "x": 640,
            "y": 140,
            "rotation": 0,
            "properties": {
                "resistance": 60
            },
            "state": {}
        },
        {
            "id": "comp_5",
            "type": "voltmeter",
            "x": 560,
            "y": 200,
            "rotation": 90,
            "properties": {
                "voltage": 174
            }
        },
        {
            "id": "comp_6",
            "type": "junction",
            "x": 560,
            "y": 140,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_7",
            "type": "ground",
            "x": 420,
            "y": 300,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_10",
            "type": "junction",
            "x": 620,
            "y": 280,
            "rotation": 0,
            "properties": {},
            "state": {}
        },
        {
            "id": "comp_11",
            "type": "inductor",
            "x": 720,
            "y": 220,
            "rotation": 90,
            "properties": {
                "inductance": 0.2
            },
            "state": {
                "current": 0,
                "voltage": 0
            }
        }
    ],
    wires: [
        {
            "id": "wire_1",
            "startTerminal": "comp_4_left",
            "endTerminal": "comp_6_node",
            "points": [
                {
                    "x": 610,
                    "y": 140
                },
                {
                    "x": 585,
                    "y": 140
                },
                {
                    "x": 585,
                    "y": 140
                },
                {
                    "x": 560,
                    "y": 140
                }
            ]
        },
        {
            "id": "wire_4",
            "startTerminal": "comp_3_L",
            "endTerminal": "comp_6_node",
            "points": [
                {
                    "x": 500,
                    "y": 135
                },
                {
                    "x": 530,
                    "y": 135
                },
                {
                    "x": 530,
                    "y": 140
                },
                {
                    "x": 560,
                    "y": 140
                }
            ]
        },
        {
            "id": "wire_6",
            "startTerminal": "comp_6_node",
            "endTerminal": "comp_5_positive",
            "points": [
                {
                    "x": 560,
                    "y": 140
                },
                {
                    "x": 560,
                    "y": 140
                },
                {
                    "x": 560,
                    "y": 170
                },
                {
                    "x": 560,
                    "y": 170
                }
            ]
        },
        {
            "id": "wire_8",
            "startTerminal": "comp_3_C",
            "endTerminal": "comp_3_M",
            "points": [
                {
                    "x": 420,
                    "y": 185
                },
                {
                    "x": 420,
                    "y": 185
                },
                {
                    "x": 420,
                    "y": 135
                },
                {
                    "x": 420,
                    "y": 135
                }
            ]
        },
        {
            "id": "wire_9",
            "startTerminal": "comp_3_M",
            "endTerminal": "comp_2_negative",
            "points": [
                {
                    "x": 420,
                    "y": 135
                },
                {
                    "x": 385,
                    "y": 135
                },
                {
                    "x": 385,
                    "y": 140
                },
                {
                    "x": 350,
                    "y": 140
                }
            ]
        },
        {
            "id": "wire_11",
            "startTerminal": "comp_2_positive",
            "endTerminal": "comp_1_positive",
            "points": [
                {
                    "x": 290,
                    "y": 140
                },
                {
                    "x": 260,
                    "y": 140
                },
                {
                    "x": 260,
                    "y": 190
                },
                {
                    "x": 260,
                    "y": 190
                }
            ]
        },
        {
            "id": "wire_13",
            "startTerminal": "comp_1_negative",
            "endTerminal": "comp_7_ref",
            "points": [
                {
                    "x": 260,
                    "y": 250
                },
                {
                    "x": 260,
                    "y": 250
                },
                {
                    "x": 260,
                    "y": 285
                },
                {
                    "x": 420,
                    "y": 285
                }
            ]
        },
        {
            "id": "wire_14",
            "startTerminal": "comp_7_ref",
            "endTerminal": "comp_5_negative",
            "points": [
                {
                    "x": 420,
                    "y": 285
                },
                {
                    "x": 560,
                    "y": 285
                },
                {
                    "x": 560,
                    "y": 230
                },
                {
                    "x": 560,
                    "y": 230
                }
            ]
        },
        {
            "id": "wire_18",
            "startTerminal": "comp_3_V",
            "endTerminal": "comp_7_ref",
            "points": [
                {
                    "x": 500,
                    "y": 185
                },
                {
                    "x": 500,
                    "y": 185
                },
                {
                    "x": 500,
                    "y": 285
                },
                {
                    "x": 420,
                    "y": 285
                }
            ]
        },
        {
            "id": "wire_26",
            "startTerminal": "comp_10_node",
            "endTerminal": "comp_7_ref",
            "points": [
                {
                    "x": 620,
                    "y": 280
                },
                {
                    "x": 520,
                    "y": 280
                },
                {
                    "x": 520,
                    "y": 285
                },
                {
                    "x": 420,
                    "y": 285
                }
            ]
        },
        {
            "id": "wire_30",
            "startTerminal": "comp_11_left",
            "endTerminal": "comp_4_right",
            "points": [
                {
                    "x": 720,
                    "y": 190
                },
                {
                    "x": 695,
                    "y": 190
                },
                {
                    "x": 695,
                    "y": 140
                },
                {
                    "x": 670,
                    "y": 140
                }
            ]
        },
        {
            "id": "wire_32",
            "startTerminal": "comp_11_right",
            "endTerminal": "comp_10_node",
            "points": [
                {
                    "x": 720,
                    "y": 250
                },
                {
                    "x": 670,
                    "y": 250
                },
                {
                    "x": 670,
                    "y": 280
                },
                {
                    "x": 620,
                    "y": 280
                }
            ]
        }
    ]
};
