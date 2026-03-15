/**
 * Instrumentation Amplifier Template
 */

export const instrumentation_amplifier_preset = {
    presetId: "instrumentation_amplifier",
    name: "Instrumentation Amplifier",
    description: "High-precision amplifier used for small differential signals.",
    circuit: {
        "components": [
            {
                "id": "comp_1",
                "type": "opamp",
                "x": 260,
                "y": 160,
                "rotation": 0,
                "properties": {
                    "openLoopGain": 100000,
                    "gbp": 1000000,
                    "rin": 2000000,
                    "rout": 75,
                    "offsetVoltage": 0,
                    "cmrr": 90,
                    "saturationVoltage": 15
                },
                "state": {}
            },
            {
                "id": "comp_2",
                "type": "opamp",
                "x": 260,
                "y": 540,
                "rotation": 0,
                "properties": {
                    "openLoopGain": 100000,
                    "gbp": 1000000,
                    "rin": 2000000,
                    "rout": 75,
                    "offsetVoltage": 0,
                    "cmrr": 90,
                    "saturationVoltage": 15
                },
                "state": {}
            },
            {
                "id": "comp_3",
                "type": "opamp",
                "x": 560,
                "y": 340,
                "rotation": 0,
                "properties": {
                    "openLoopGain": 100000,
                    "gbp": 1000000,
                    "rin": 2000000,
                    "rout": 75,
                    "offsetVoltage": 0,
                    "cmrr": 90,
                    "saturationVoltage": 15
                },
                "state": {}
            },
            {
                "id": "comp_4",
                "type": "voltage_source",
                "x": 60,
                "y": 280,
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
                "id": "comp_5",
                "type": "voltage_source",
                "x": 160,
                "y": 600,
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
                "id": "comp_6",
                "type": "resistor",
                "x": 360,
                "y": 220,
                "rotation": 90,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_7",
                "type": "resistor",
                "x": 360,
                "y": 340,
                "rotation": 90,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_8",
                "type": "resistor",
                "x": 360,
                "y": 460,
                "rotation": 90,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_9",
                "type": "junction",
                "x": 360,
                "y": 160,
                "rotation": 90,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_10",
                "type": "junction",
                "x": 360,
                "y": 280,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_11",
                "type": "junction",
                "x": 360,
                "y": 400,
                "rotation": 90,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_12",
                "type": "junction",
                "x": 360,
                "y": 540,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_13",
                "type": "junction",
                "x": 120,
                "y": 140,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_14",
                "type": "junction",
                "x": 500,
                "y": 160,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_15",
                "type": "junction",
                "x": 500,
                "y": 540,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_16",
                "type": "resistor",
                "x": 440,
                "y": 160,
                "rotation": 0,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_17",
                "type": "resistor",
                "x": 440,
                "y": 540,
                "rotation": 0,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_18",
                "type": "resistor",
                "x": 560,
                "y": 160,
                "rotation": 0,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_19",
                "type": "junction",
                "x": 640,
                "y": 340,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_20",
                "type": "resistor",
                "x": 560,
                "y": 540,
                "rotation": 0,
                "properties": {
                    "resistance": 1000
                },
                "state": {}
            },
            {
                "id": "comp_21",
                "type": "ground",
                "x": 640,
                "y": 660,
                "rotation": 0,
                "properties": {},
                "state": {}
            },
            {
                "id": "comp_22",
                "type": "oscilloscope",
                "x": 640,
                "y": 440,
                "rotation": 0,
                "properties": {
                    "ch1Enabled": true,
                    "ch2Enabled": false,
                    "ch1Mode": "Voltage",
                    "ch2Mode": "Voltage",
                    "ch1Label": "CH1",
                    "ch2Label": "CH2"
                },
                "state": {}
            }
        ],
        "wires": [
            {
                "id": "wire_2",
                "startTerminal": "comp_4_positive",
                "endTerminal": "comp_1_in_pos",
                "points": [
                    { "x": 60, "y": 250 },
                    { "x": 60, "y": 250 },
                    { "x": 60, "y": 175 },
                    { "x": 230, "y": 175 }
                ]
            },
            {
                "id": "wire_4",
                "startTerminal": "comp_5_positive",
                "endTerminal": "comp_2_in_pos",
                "points": [
                    { "x": 160, "y": 570 },
                    { "x": 160, "y": 570 },
                    { "x": 160, "y": 555 },
                    { "x": 230, "y": 555 }
                ]
            },
            {
                "id": "wire_15",
                "startTerminal": "comp_2_out",
                "endTerminal": "comp_12_node",
                "points": [
                    { "x": 290, "y": 540 },
                    { "x": 325, "y": 540 },
                    { "x": 325, "y": 540 },
                    { "x": 360, "y": 540 }
                ]
            },
            {
                "id": "wire_17",
                "startTerminal": "comp_1_out",
                "endTerminal": "comp_9_node",
                "points": [
                    { "x": 290, "y": 160 },
                    { "x": 325, "y": 160 },
                    { "x": 325, "y": 160 },
                    { "x": 360, "y": 160 }
                ]
            },
            {
                "id": "wire_19",
                "startTerminal": "comp_9_node",
                "endTerminal": "comp_6_left",
                "points": [
                    { "x": 360, "y": 160 },
                    { "x": 360, "y": 160 },
                    { "x": 360, "y": 190 },
                    { "x": 360, "y": 190 }
                ]
            },
            {
                "id": "wire_21",
                "startTerminal": "comp_8_right",
                "endTerminal": "comp_12_node",
                "points": [
                    { "x": 360, "y": 490 },
                    { "x": 360, "y": 490 },
                    { "x": 360, "y": 540 },
                    { "x": 360, "y": 540 }
                ]
            },
            {
                "id": "wire_24",
                "startTerminal": "comp_8_left",
                "endTerminal": "comp_11_node",
                "points": [
                    { "x": 360, "y": 430 },
                    { "x": 360, "y": 430 },
                    { "x": 360, "y": 400 },
                    { "x": 360, "y": 400 }
                ]
            },
            {
                "id": "wire_26",
                "startTerminal": "comp_7_right",
                "endTerminal": "comp_11_node",
                "points": [
                    { "x": 360, "y": 370 },
                    { "x": 360, "y": 370 },
                    { "x": 360, "y": 400 },
                    { "x": 360, "y": 400 }
                ]
            },
            {
                "id": "wire_28",
                "startTerminal": "comp_7_left",
                "endTerminal": "comp_10_node",
                "points": [
                    { "x": 360, "y": 310 },
                    { "x": 360, "y": 310 },
                    { "x": 360, "y": 280 },
                    { "x": 360, "y": 280 }
                ]
            },
            {
                "id": "wire_30",
                "startTerminal": "comp_10_node",
                "endTerminal": "comp_6_right",
                "points": [
                    { "x": 360, "y": 280 },
                    { "x": 360, "y": 280 },
                    { "x": 360, "y": 250 },
                    { "x": 360, "y": 250 }
                ]
            },
            {
                "id": "wire_32",
                "startTerminal": "comp_11_node",
                "endTerminal": "comp_2_in_neg",
                "points": [
                    { "x": 360, "y": 400 },
                    { "x": 120, "y": 400 },
                    { "x": 120, "y": 525 },
                    { "x": 230, "y": 525 }
                ]
            },
            {
                "id": "wire_38",
                "startTerminal": "comp_1_in_neg",
                "endTerminal": "comp_13_node",
                "points": [
                    { "x": 230, "y": 145 },
                    { "x": 180, "y": 145 },
                    { "x": 180, "y": 140 },
                    { "x": 120, "y": 140 }
                ]
            },
            {
                "id": "wire_40",
                "startTerminal": "comp_13_node",
                "endTerminal": "comp_10_node",
                "points": [
                    { "x": 120, "y": 140 },
                    { "x": 120, "y": 140 },
                    { "x": 120, "y": 280 },
                    { "x": 360, "y": 280 }
                ]
            },
            {
                "id": "wire_42",
                "startTerminal": "comp_16_left",
                "endTerminal": "comp_9_node",
                "points": [
                    { "x": 410, "y": 160 },
                    { "x": 385, "y": 160 },
                    { "x": 385, "y": 160 },
                    { "x": 360, "y": 160 }
                ]
            },
            {
                "id": "wire_44",
                "startTerminal": "comp_16_right",
                "endTerminal": "comp_14_node",
                "points": [
                    { "x": 470, "y": 160 },
                    { "x": 485, "y": 160 },
                    { "x": 485, "y": 160 },
                    { "x": 500, "y": 160 }
                ]
            },
            {
                "id": "wire_46",
                "startTerminal": "comp_17_left",
                "endTerminal": "comp_12_node",
                "points": [
                    { "x": 410, "y": 540 },
                    { "x": 385, "y": 540 },
                    { "x": 385, "y": 540 },
                    { "x": 360, "y": 540 }
                ]
            },
            {
                "id": "wire_48",
                "startTerminal": "comp_17_right",
                "endTerminal": "comp_15_node",
                "points": [
                    { "x": 470, "y": 540 },
                    { "x": 485, "y": 540 },
                    { "x": 485, "y": 540 },
                    { "x": 500, "y": 540 }
                ]
            },
            {
                "id": "wire_50",
                "startTerminal": "comp_14_node",
                "endTerminal": "comp_3_in_neg",
                "points": [
                    { "x": 500, "y": 160 },
                    { "x": 500, "y": 160 },
                    { "x": 500, "y": 325 },
                    { "x": 530, "y": 325 }
                ]
            },
            {
                "id": "wire_53",
                "startTerminal": "comp_3_in_pos",
                "endTerminal": "comp_15_node",
                "points": [
                    { "x": 530, "y": 355 },
                    { "x": 500, "y": 355 },
                    { "x": 500, "y": 540 },
                    { "x": 500, "y": 540 }
                ]
            },
            {
                "id": "wire_56",
                "startTerminal": "comp_18_left",
                "endTerminal": "comp_14_node",
                "points": [
                    { "x": 530, "y": 160 },
                    { "x": 515, "y": 160 },
                    { "x": 515, "y": 160 },
                    { "x": 500, "y": 160 }
                ]
            },
            {
                "id": "wire_58",
                "startTerminal": "comp_18_right",
                "endTerminal": "comp_19_node",
                "points": [
                    { "x": 590, "y": 160 },
                    { "x": 640, "y": 160 },
                    { "x": 640, "y": 340 },
                    { "x": 640, "y": 340 }
                ]
            },
            {
                "id": "wire_60",
                "startTerminal": "comp_19_node",
                "endTerminal": "comp_3_out",
                "points": [
                    { "x": 640, "y": 340 },
                    { "x": 615, "y": 340 },
                    { "x": 615, "y": 340 },
                    { "x": 590, "y": 340 }
                ]
            },
            {
                "id": "wire_62",
                "startTerminal": "comp_20_left",
                "endTerminal": "comp_15_node",
                "points": [
                    { "x": 530, "y": 540 },
                    { "x": 515, "y": 540 },
                    { "x": 515, "y": 540 },
                    { "x": 500, "y": 540 }
                ]
            },
            {
                "id": "wire_64",
                "startTerminal": "comp_20_right",
                "endTerminal": "comp_21_ref",
                "points": [
                    { "x": 590, "y": 540 },
                    { "x": 640, "y": 540 },
                    { "x": 640, "y": 645 },
                    { "x": 640, "y": 645 }
                ]
            },
            {
                "id": "wire_66",
                "startTerminal": "comp_5_negative",
                "endTerminal": "comp_21_ref",
                "points": [
                    { "x": 160, "y": 630 },
                    { "x": 160, "y": 630 },
                    { "x": 160, "y": 645 },
                    { "x": 640, "y": 645 }
                ]
            },
            {
                "id": "wire_68",
                "startTerminal": "comp_22_ch1_pos",
                "endTerminal": "comp_19_node",
                "points": [
                    { "x": 640, "y": 405 },
                    { "x": 640, "y": 405 },
                    { "x": 640, "y": 340 },
                    { "x": 640, "y": 340 }
                ]
            },
            {
                "id": "wire_70",
                "startTerminal": "comp_22_ch1_neg",
                "endTerminal": "comp_21_ref",
                "points": [
                    { "x": 640, "y": 475 },
                    { "x": 640, "y": 475 },
                    { "x": 640, "y": 645 },
                    { "x": 640, "y": 645 }
                ]
            },
            {
                "id": "wire_72",
                "startTerminal": "comp_4_negative",
                "endTerminal": "comp_21_ref",
                "points": [
                    { "x": 60, "y": 310 },
                    { "x": 60, "y": 310 },
                    { "x": 60, "y": 645 },
                    { "x": 640, "y": 645 }
                ]
            }
        ]
    }
};

export const instrumentation_amplifier_template = {
    expId: "sensor_lab-instrumentation",
    name: "Instrumentation Amplifier Lab",
    presets: [instrumentation_amplifier_preset]
};
