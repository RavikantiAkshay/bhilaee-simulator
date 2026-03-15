export const inverting_preset = {
    presetId: "inverting",
    name: "Inverting Amplifier",
    description: "Op-Amp configured as an inverting amplifier.",
    circuit: {
        components: [
            { "id": "comp_1", "type": "voltage_source", "x": 340, "y": 280, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 0 }, "state": {} },
            { "id": "comp_3", "type": "resistor", "x": 400, "y": 200, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
            { "id": "comp_5", "type": "junction", "x": 480, "y": 200, "rotation": 90, "properties": {}, "state": {} },
            { "id": "comp_6", "type": "opamp", "x": 560, "y": 220, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90, "saturationVoltage": 15 }, "state": {} },
            { "id": "comp_7", "type": "resistor", "x": 560, "y": 140, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
            { "id": "comp_8", "type": "oscilloscope", "x": 240, "y": 160, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": true, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} },
            { "id": "comp_9", "type": "ground", "x": 460, "y": 380, "rotation": 0, "properties": {}, "state": {} },
            { "id": "comp_10", "type": "junction", "x": 640, "y": 220, "rotation": 90, "properties": {}, "state": {} },
            { "id": "comp_11", "type": "junction", "x": 240, "y": 60, "rotation": 90, "properties": {}, "state": {} }
        ],
        wires: [
            { "id": "wire_2", "startTerminal": "comp_9_ref", "endTerminal": "comp_1_negative", "points": [{ "x": 460, "y": 365 }, { "x": 340, "y": 365 }, { "x": 340, "y": 310 }, { "x": 340, "y": 310 }] },
            { "id": "wire_4", "startTerminal": "comp_9_ref", "endTerminal": "comp_8_ch1_neg", "points": [{ "x": 460, "y": 365 }, { "x": 240, "y": 365 }, { "x": 240, "y": 195 }, { "x": 240, "y": 195 }] },
            { "id": "wire_6", "startTerminal": "comp_1_negative", "endTerminal": "comp_8_ch2_neg", "points": [{ "x": 340, "y": 310 }, { "x": 300, "y": 310 }, { "x": 300, "y": 160 }, { "x": 285, "y": 160 }] },
            { "id": "wire_8", "startTerminal": "comp_1_positive", "endTerminal": "comp_3_left", "points": [{ "x": 340, "y": 250 }, { "x": 340, "y": 250 }, { "x": 340, "y": 200 }, { "x": 370, "y": 200 }] },
            { "id": "wire_10", "startTerminal": "comp_3_right", "endTerminal": "comp_5_node", "points": [{ "x": 430, "y": 200 }, { "x": 455, "y": 200 }, { "x": 455, "y": 200 }, { "x": 480, "y": 200 }] },
            { "id": "wire_12", "startTerminal": "comp_5_node", "endTerminal": "comp_7_left", "points": [{ "x": 480, "y": 200 }, { "x": 480, "y": 200 }, { "x": 480, "y": 140 }, { "x": 530, "y": 140 }] },
            { "id": "wire_14", "startTerminal": "comp_5_node", "endTerminal": "comp_6_in_neg", "points": [{ "x": 480, "y": 200 }, { "x": 505, "y": 200 }, { "x": 505, "y": 205 }, { "x": 530, "y": 205 }] },
            { "id": "wire_16", "startTerminal": "comp_6_in_pos", "endTerminal": "comp_9_ref", "points": [{ "x": 530, "y": 235 }, { "x": 495, "y": 235 }, { "x": 495, "y": 365 }, { "x": 460, "y": 365 }] },
            { "id": "wire_18", "startTerminal": "comp_6_out", "endTerminal": "comp_10_node", "points": [{ "x": 590, "y": 220 }, { "x": 615, "y": 220 }, { "x": 615, "y": 220 }, { "x": 640, "y": 220 }] },
            { "id": "wire_20", "startTerminal": "comp_10_node", "endTerminal": "comp_7_right", "points": [{ "x": 640, "y": 220 }, { "x": 640, "y": 220 }, { "x": 640, "y": 140 }, { "x": 590, "y": 140 }] },
            { "id": "wire_22", "startTerminal": "comp_8_ch1_pos", "endTerminal": "comp_11_node", "points": [{ "x": 240, "y": 125 }, { "x": 240, "y": 125 }, { "x": 240, "y": 60 }, { "x": 240, "y": 60 }] },
            { "id": "wire_24", "startTerminal": "comp_11_node", "endTerminal": "comp_10_node", "points": [{ "x": 240, "y": 60 }, { "x": 640, "y": 60 }, { "x": 640, "y": 220 }, { "x": 640, "y": 220 }] },
            { "id": "wire_26", "startTerminal": "comp_8_ch2_pos", "endTerminal": "comp_1_positive", "points": [{ "x": 195, "y": 160 }, { "x": 180, "y": 160 }, { "x": 180, "y": 250 }, { "x": 340, "y": 250 }] }
        ]
    },
    simulation: {
        route: "default",
        simulationId: "inverting_sim",
        simulationType: "Time"
    }
};

export const non_inverting_preset = {
    presetId: "non_inverting",
    name: "Non-Inverting Amplifier",
    description: "Op-Amp configured as a non-inverting amplifier.",
    circuit: {
        components: [
            { "id": "comp_2", "type": "resistor", "x": 620, "y": 160, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
            { "id": "comp_3", "type": "resistor", "x": 460, "y": 220, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
            { "id": "comp_4", "type": "junction", "x": 540, "y": 220, "rotation": 90, "properties": {}, "state": {} },
            { "id": "comp_5", "type": "opamp", "x": 620, "y": 240, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90, "saturationVoltage": 15 }, "state": {} },
            { "id": "comp_6", "type": "junction", "x": 700, "y": 240, "rotation": 90, "properties": {}, "state": {} },
            { "id": "comp_7", "type": "voltage_source", "x": 540, "y": 340, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 0 }, "state": {} },
            { "id": "comp_8", "type": "ground", "x": 460, "y": 420, "rotation": 0, "properties": {}, "state": {} },
            { "id": "comp_9", "type": "oscilloscope", "x": 760, "y": 340, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": true, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
        ],
        wires: [
            { "id": "wire_2", "startTerminal": "comp_3_right", "endTerminal": "comp_4_node", "points": [{ "x": 490, "y": 220 }, { "x": 515, "y": 220 }, { "x": 515, "y": 220 }, { "x": 540, "y": 220 }] },
            { "id": "wire_4", "startTerminal": "comp_4_node", "endTerminal": "comp_2_left", "points": [{ "x": 540, "y": 220 }, { "x": 540, "y": 220 }, { "x": 540, "y": 160 }, { "x": 590, "y": 160 }] },
            { "id": "wire_9", "startTerminal": "comp_5_in_neg", "endTerminal": "comp_4_node", "points": [{ "x": 590, "y": 225 }, { "x": 565, "y": 225 }, { "x": 565, "y": 220 }, { "x": 540, "y": 220 }] },
            { "id": "wire_13", "startTerminal": "comp_2_right", "endTerminal": "comp_6_node", "points": [{ "x": 650, "y": 160 }, { "x": 700, "y": 160 }, { "x": 700, "y": 240 }, { "x": 700, "y": 240 }] },
            { "id": "wire_15", "startTerminal": "comp_6_node", "endTerminal": "comp_5_out", "points": [{ "x": 700, "y": 240 }, { "x": 675, "y": 240 }, { "x": 675, "y": 240 }, { "x": 650, "y": 240 }] },
            { "id": "wire_17", "startTerminal": "comp_7_positive", "endTerminal": "comp_5_in_pos", "points": [{ "x": 540, "y": 310 }, { "x": 540, "y": 310 }, { "x": 540, "y": 255 }, { "x": 590, "y": 255 }] },
            { "id": "wire_20", "startTerminal": "comp_8_ref", "endTerminal": "comp_3_left", "points": [{ "x": 460, "y": 405 }, { "x": 380, "y": 405 }, { "x": 380, "y": 220 }, { "x": 430, "y": 220 }] },
            { "id": "wire_22", "startTerminal": "comp_8_ref", "endTerminal": "comp_7_negative", "points": [{ "x": 460, "y": 405 }, { "x": 540, "y": 405 }, { "x": 540, "y": 370 }, { "x": 540, "y": 370 }] },
            { "id": "wire_24", "startTerminal": "comp_7_positive", "endTerminal": "comp_9_ch1_pos", "points": [{ "x": 540, "y": 310 }, { "x": 650, "y": 310 }, { "x": 650, "y": 305 }, { "x": 760, "y": 305 }] },
            { "id": "wire_26", "startTerminal": "comp_7_negative", "endTerminal": "comp_9_ch1_neg", "points": [{ "x": 540, "y": 370 }, { "x": 650, "y": 370 }, { "x": 650, "y": 375 }, { "x": 760, "y": 375 }] },
            { "id": "wire_28", "startTerminal": "comp_6_node", "endTerminal": "comp_9_ch2_pos", "points": [{ "x": 700, "y": 240 }, { "x": 700, "y": 240 }, { "x": 700, "y": 340 }, { "x": 715, "y": 340 }] },
            { "id": "wire_30", "startTerminal": "comp_9_ch2_neg", "endTerminal": "comp_8_ref", "points": [{ "x": 805, "y": 340 }, { "x": 820, "y": 340 }, { "x": 820, "y": 405 }, { "x": 460, "y": 405 }] }
        ]
    },
    simulation: {
        route: "default",
        simulationId: "non_inverting_sim",
        simulationType: "Time"
    }
};

export const opamp_characteristics_template = {
    expId: "devices_and_circuits-exp5",
    name: "Op-Amp Characteristics",
    presets: [inverting_preset, non_inverting_preset]
};
