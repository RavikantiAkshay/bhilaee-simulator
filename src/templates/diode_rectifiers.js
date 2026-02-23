/**
 * Template for Diode Rectifiers (Half-Wave, Full-Wave Bridge)
 * Experiment ID: devices_and_circuits-exp3
 * 
 * Demonstrates the multi-preset dynamic loading architecture.
 */

export const diode_rectifiers_template = {
    expId: "devices_and_circuits-exp3",
    name: "Diode Rectifiers",
    presets: [
        {
            presetId: "half-wave",
            name: "Half-Wave Rectifier",
            description: "Single diode rectification clipping the negative half cycle.",
            circuit: {
                components: [
                    { "id": "comp_29", "type": "voltage_source", "x": 200, "y": 260, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_31", "type": "junction", "x": 420, "y": 180, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_32", "type": "resistor", "x": 420, "y": 260, "rotation": 90, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_34", "type": "ground", "x": 320, "y": 340, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_35", "type": "oscilloscope", "x": 520, "y": 260, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": true, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} },
                    { "id": "comp_36", "type": "diode", "x": 320, "y": 180, "rotation": 0, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } },
                    { "id": "comp_39", "type": "junction", "x": 420, "y": 320, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_40", "type": "junction", "x": 440, "y": 100, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_41", "type": "junction", "x": 440, "y": 400, "rotation": 0, "properties": {}, "state": {} }
                ],
                wires: [
                    { "id": "wire_6", "startTerminal": "comp_31_node", "endTerminal": "comp_32_left", "points": [{ "x": 420, "y": 180 }, { "x": 420, "y": 180 }, { "x": 420, "y": 230 }, { "x": 420, "y": 230 }] },
                    { "id": "wire_10", "startTerminal": "comp_29_negative", "endTerminal": "comp_34_ref", "points": [{ "x": 200, "y": 290 }, { "x": 200, "y": 290 }, { "x": 200, "y": 325 }, { "x": 320, "y": 325 }] },
                    { "id": "wire_26", "startTerminal": "comp_36_cathode", "endTerminal": "comp_31_node", "points": [{ "x": 350, "y": 180 }, { "x": 385, "y": 180 }, { "x": 385, "y": 180 }, { "x": 420, "y": 180 }] },
                    { "id": "wire_28", "startTerminal": "comp_36_anode", "endTerminal": "comp_29_positive", "points": [{ "x": 290, "y": 180 }, { "x": 200, "y": 180 }, { "x": 200, "y": 230 }, { "x": 200, "y": 230 }] },
                    { "id": "wire_45", "startTerminal": "comp_39_node", "endTerminal": "comp_34_ref", "points": [{ "x": 420, "y": 320 }, { "x": 370, "y": 320 }, { "x": 370, "y": 325 }, { "x": 320, "y": 325 }] },
                    { "id": "wire_47", "startTerminal": "comp_39_node", "endTerminal": "comp_32_right", "points": [{ "x": 420, "y": 320 }, { "x": 420, "y": 320 }, { "x": 420, "y": 290 }, { "x": 420, "y": 290 }] },
                    { "id": "wire_51", "startTerminal": "comp_39_node", "endTerminal": "comp_35_ch1_neg", "points": [{ "x": 420, "y": 320 }, { "x": 520, "y": 320 }, { "x": 520, "y": 295 }, { "x": 520, "y": 295 }] },
                    { "id": "wire_53", "startTerminal": "comp_31_node", "endTerminal": "comp_35_ch1_pos", "points": [{ "x": 420, "y": 180 }, { "x": 520, "y": 180 }, { "x": 520, "y": 225 }, { "x": 520, "y": 225 }] },
                    { "id": "wire_59", "startTerminal": "comp_29_positive", "endTerminal": "comp_40_node", "points": [{ "x": 200, "y": 230 }, { "x": 200, "y": 230 }, { "x": 200, "y": 100 }, { "x": 440, "y": 100 }] },
                    { "id": "wire_61", "startTerminal": "comp_40_node", "endTerminal": "comp_35_ch2_pos", "points": [{ "x": 440, "y": 100 }, { "x": 480, "y": 100 }, { "x": 480, "y": 260 }, { "x": 475, "y": 260 }] },
                    { "id": "wire_63", "startTerminal": "comp_29_negative", "endTerminal": "comp_41_node", "points": [{ "x": 200, "y": 290 }, { "x": 200, "y": 290 }, { "x": 200, "y": 400 }, { "x": 440, "y": 400 }] },
                    { "id": "wire_65", "startTerminal": "comp_41_node", "endTerminal": "comp_35_ch2_neg", "points": [{ "x": 440, "y": 400 }, { "x": 580, "y": 400 }, { "x": 580, "y": 260 }, { "x": 565, "y": 260 }] }
                ]
            }
        },
        {
            presetId: "full-wave-bridge",
            name: "Full-Wave Bridge Rectifier",
            description: "Four diode bridge rectifying both half cycles.",
            circuit: {
                components: [
                    { "id": "vsrc", "type": "voltage_source", "x": 160, "y": 320, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "rload", "type": "resistor", "x": 650, "y": 400, "rotation": 90, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "gnd", "type": "ground", "x": 400, "y": 520, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_1", "type": "junction", "x": 400, "y": 200, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_2", "type": "junction", "x": 400, "y": 160, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_4", "type": "junction", "x": 300, "y": 320, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_5", "type": "junction", "x": 500, "y": 320, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_6", "type": "junction", "x": 400, "y": 420, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_7", "type": "junction", "x": 400, "y": 460, "rotation": 90, "properties": {}, "state": {} },
                    { "id": "comp_8", "type": "oscilloscope", "x": 760, "y": 400, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": false, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} },
                    { "id": "comp_9", "type": "junction", "x": 600, "y": 320, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_10", "type": "junction", "x": 600, "y": 500, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_11", "type": "diode", "x": 500, "y": 220, "rotation": 90, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } },
                    { "id": "comp_12", "type": "diode", "x": 500, "y": 400, "rotation": 270, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } },
                    { "id": "comp_14", "type": "diode", "x": 300, "y": 220, "rotation": 270, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } },
                    { "id": "comp_15", "type": "diode", "x": 300, "y": 400, "rotation": 90, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } }
                ],
                wires: [
                    { "id": "wire_10", "startTerminal": "comp_2_node", "endTerminal": "comp_1_node", "points": [{ "x": 400, "y": 160 }, { "x": 400, "y": 160 }, { "x": 400, "y": 200 }, { "x": 400, "y": 200 }] },
                    { "id": "wire_12", "startTerminal": "comp_2_node", "endTerminal": "vsrc_positive", "points": [{ "x": 400, "y": 160 }, { "x": 160, "y": 160 }, { "x": 160, "y": 290 }, { "x": 160, "y": 290 }] },
                    { "id": "wire_28", "startTerminal": "comp_6_node", "endTerminal": "comp_7_node", "points": [{ "x": 400, "y": 420 }, { "x": 400, "y": 420 }, { "x": 400, "y": 460 }, { "x": 400, "y": 460 }] },
                    { "id": "wire_30", "startTerminal": "comp_7_node", "endTerminal": "vsrc_negative", "points": [{ "x": 400, "y": 460 }, { "x": 160, "y": 460 }, { "x": 160, "y": 350 }, { "x": 160, "y": 350 }] },
                    { "id": "wire_33", "startTerminal": "comp_4_node", "endTerminal": "gnd_ref", "points": [{ "x": 300, "y": 320 }, { "x": 240, "y": 320 }, { "x": 240, "y": 505 }, { "x": 400, "y": 505 }] },
                    { "id": "wire_39", "startTerminal": "comp_9_node", "endTerminal": "comp_8_ch1_pos", "points": [{ "x": 600, "y": 320 }, { "x": 760, "y": 320 }, { "x": 760, "y": 365 }, { "x": 760, "y": 365 }] },
                    { "id": "wire_41", "startTerminal": "comp_9_node", "endTerminal": "rload_left", "points": [{ "x": 600, "y": 320 }, { "x": 625, "y": 320 }, { "x": 625, "y": 370 }, { "x": 650, "y": 370 }] },
                    { "id": "wire_43", "startTerminal": "comp_9_node", "endTerminal": "comp_5_node", "points": [{ "x": 600, "y": 320 }, { "x": 550, "y": 320 }, { "x": 550, "y": 320 }, { "x": 500, "y": 320 }] },
                    { "id": "wire_45", "startTerminal": "rload_right", "endTerminal": "comp_10_node", "points": [{ "x": 650, "y": 430 }, { "x": 625, "y": 430 }, { "x": 625, "y": 500 }, { "x": 600, "y": 500 }] },
                    { "id": "wire_47", "startTerminal": "comp_10_node", "endTerminal": "comp_8_ch1_neg", "points": [{ "x": 600, "y": 500 }, { "x": 760, "y": 500 }, { "x": 760, "y": 435 }, { "x": 760, "y": 435 }] },
                    { "id": "wire_49", "startTerminal": "comp_10_node", "endTerminal": "gnd_ref", "points": [{ "x": 600, "y": 500 }, { "x": 500, "y": 500 }, { "x": 500, "y": 505 }, { "x": 400, "y": 505 }] },
                    { "id": "wire_51", "startTerminal": "comp_1_node", "endTerminal": "comp_11_anode", "points": [{ "x": 400, "y": 200 }, { "x": 440, "y": 200 }, { "x": 440, "y": 190 }, { "x": 500, "y": 190 }] },
                    { "id": "wire_53", "startTerminal": "comp_11_cathode", "endTerminal": "comp_5_node", "points": [{ "x": 500, "y": 250 }, { "x": 500, "y": 250 }, { "x": 500, "y": 320 }, { "x": 500, "y": 320 }] },
                    { "id": "wire_63", "startTerminal": "comp_14_cathode", "endTerminal": "comp_1_node", "points": [{ "x": 300, "y": 190 }, { "x": 350, "y": 190 }, { "x": 350, "y": 200 }, { "x": 400, "y": 200 }] },
                    { "id": "wire_65", "startTerminal": "comp_14_anode", "endTerminal": "comp_4_node", "points": [{ "x": 300, "y": 250 }, { "x": 300, "y": 250 }, { "x": 300, "y": 320 }, { "x": 300, "y": 320 }] },
                    { "id": "wire_67", "startTerminal": "comp_6_node", "endTerminal": "comp_12_anode", "points": [{ "x": 400, "y": 420 }, { "x": 450, "y": 420 }, { "x": 450, "y": 430 }, { "x": 500, "y": 430 }] },
                    { "id": "wire_69", "startTerminal": "comp_12_cathode", "endTerminal": "comp_5_node", "points": [{ "x": 500, "y": 370 }, { "x": 500, "y": 370 }, { "x": 500, "y": 320 }, { "x": 500, "y": 320 }] },
                    { "id": "wire_71", "startTerminal": "comp_15_cathode", "endTerminal": "comp_6_node", "points": [{ "x": 300, "y": 430 }, { "x": 350, "y": 430 }, { "x": 350, "y": 420 }, { "x": 400, "y": 420 }] },
                    { "id": "wire_73", "startTerminal": "comp_15_anode", "endTerminal": "comp_4_node", "points": [{ "x": 300, "y": 370 }, { "x": 300, "y": 370 }, { "x": 300, "y": 320 }, { "x": 300, "y": 320 }] }
                ]
            }
        }
    ]
};
