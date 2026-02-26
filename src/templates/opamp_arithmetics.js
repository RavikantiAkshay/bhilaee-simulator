export const opamp_arithmetics_template = {
    expId: "devices_and_circuits-exp4",
    name: "OpAmp Arithmetics",
    presets: [
        {
            presetId: "summer",
            name: "Summer",
            description: "Op-Amp configured as a summing amplifier.",
            circuit: {
                components: [
                    { "id": "comp_1", "type": "voltage_source", "x": 240, "y": 240, "rotation": 0, "properties": { "voltage": 5, "type": "dc", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_2", "type": "resistor", "x": 380, "y": 160, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_3", "type": "voltage_source", "x": 300, "y": 280, "rotation": 0, "properties": { "voltage": 1, "type": "dc", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_4", "type": "resistor", "x": 380, "y": 220, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_5", "type": "junction", "x": 460, "y": 180, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_6", "type": "opamp", "x": 540, "y": 180, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90 }, "state": {} },
                    { "id": "comp_7", "type": "resistor", "x": 540, "y": 100, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_8", "type": "junction", "x": 620, "y": 180, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_9", "type": "ground", "x": 400, "y": 360, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_10", "type": "junction", "x": 300, "y": 340, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_11", "type": "oscilloscope", "x": 600, "y": 260, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": false, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
                ],
                wires: [
                    { "id": "wire_2", "startTerminal": "comp_3_positive", "endTerminal": "comp_4_left", "points": [{ "x": 300, "y": 250 }, { "x": 300, "y": 250 }, { "x": 300, "y": 220 }, { "x": 350, "y": 220 }] },
                    { "id": "wire_4", "startTerminal": "comp_1_positive", "endTerminal": "comp_2_left", "points": [{ "x": 240, "y": 210 }, { "x": 240, "y": 210 }, { "x": 240, "y": 160 }, { "x": 350, "y": 160 }] },
                    { "id": "wire_6", "startTerminal": "comp_2_right", "endTerminal": "comp_5_node", "points": [{ "x": 410, "y": 160 }, { "x": 435, "y": 160 }, { "x": 435, "y": 180 }, { "x": 460, "y": 180 }] },
                    { "id": "wire_8", "startTerminal": "comp_4_right", "endTerminal": "comp_5_node", "points": [{ "x": 410, "y": 220 }, { "x": 435, "y": 220 }, { "x": 435, "y": 180 }, { "x": 460, "y": 180 }] },
                    { "id": "wire_11", "startTerminal": "comp_5_node", "endTerminal": "comp_6_in_neg", "points": [{ "x": 460, "y": 180 }, { "x": 460, "y": 180 }, { "x": 460, "y": 165 }, { "x": 510, "y": 165 }] },
                    { "id": "wire_13", "startTerminal": "comp_5_node", "endTerminal": "comp_7_left", "points": [{ "x": 460, "y": 180 }, { "x": 460, "y": 180 }, { "x": 460, "y": 100 }, { "x": 510, "y": 100 }] },
                    { "id": "wire_16", "startTerminal": "comp_7_right", "endTerminal": "comp_8_node", "points": [{ "x": 570, "y": 100 }, { "x": 620, "y": 100 }, { "x": 620, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_18", "startTerminal": "comp_6_out", "endTerminal": "comp_8_node", "points": [{ "x": 570, "y": 180 }, { "x": 595, "y": 180 }, { "x": 595, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_20", "startTerminal": "comp_3_negative", "endTerminal": "comp_10_node", "points": [{ "x": 300, "y": 310 }, { "x": 300, "y": 310 }, { "x": 300, "y": 340 }, { "x": 300, "y": 340 }] },
                    { "id": "wire_23", "startTerminal": "comp_10_node", "endTerminal": "comp_9_ref", "points": [{ "x": 300, "y": 340 }, { "x": 350, "y": 340 }, { "x": 350, "y": 345 }, { "x": 400, "y": 345 }] },
                    { "id": "wire_25", "startTerminal": "comp_10_node", "endTerminal": "comp_1_negative", "points": [{ "x": 300, "y": 340 }, { "x": 240, "y": 340 }, { "x": 240, "y": 270 }, { "x": 240, "y": 270 }] },
                    { "id": "wire_27", "startTerminal": "comp_6_in_pos", "endTerminal": "comp_9_ref", "points": [{ "x": 510, "y": 195 }, { "x": 460, "y": 195 }, { "x": 460, "y": 345 }, { "x": 400, "y": 345 }] },
                    { "id": "wire_29", "startTerminal": "comp_11_ch1_pos", "endTerminal": "comp_8_node", "points": [{ "x": 600, "y": 225 }, { "x": 620, "y": 225 }, { "x": 620, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_31", "startTerminal": "comp_11_ch1_neg", "endTerminal": "comp_9_ref", "points": [{ "x": 600, "y": 295 }, { "x": 500, "y": 295 }, { "x": 500, "y": 345 }, { "x": 400, "y": 345 }] }
                ]
            }
        },
        {
            presetId: "subtractor",
            name: "Subtractor",
            description: "Op-Amp configured as a difference amplifier (subtractor).",
            circuit: {
                components: [
                    { "id": "comp_1", "type": "voltage_source", "x": 240, "y": 240, "rotation": 0, "properties": { "voltage": 5, "type": "dc", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_2", "type": "resistor", "x": 380, "y": 160, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_3", "type": "voltage_source", "x": 300, "y": 280, "rotation": 0, "properties": { "voltage": 1, "type": "dc", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_4", "type": "resistor", "x": 380, "y": 220, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_5", "type": "junction", "x": 460, "y": 180, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_6", "type": "opamp", "x": 540, "y": 180, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90 }, "state": {} },
                    { "id": "comp_7", "type": "resistor", "x": 540, "y": 100, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_8", "type": "junction", "x": 620, "y": 180, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_9", "type": "ground", "x": 400, "y": 360, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_10", "type": "junction", "x": 300, "y": 340, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_11", "type": "oscilloscope", "x": 600, "y": 260, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": false, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
                ],
                wires: [
                    { "id": "wire_2", "startTerminal": "comp_3_positive", "endTerminal": "comp_4_left", "points": [{ "x": 300, "y": 250 }, { "x": 300, "y": 250 }, { "x": 300, "y": 220 }, { "x": 350, "y": 220 }] },
                    { "id": "wire_4", "startTerminal": "comp_1_positive", "endTerminal": "comp_2_left", "points": [{ "x": 240, "y": 210 }, { "x": 240, "y": 210 }, { "x": 240, "y": 160 }, { "x": 350, "y": 160 }] },
                    { "id": "wire_6", "startTerminal": "comp_2_right", "endTerminal": "comp_5_node", "points": [{ "x": 410, "y": 160 }, { "x": 435, "y": 160 }, { "x": 435, "y": 180 }, { "x": 460, "y": 180 }] },
                    { "id": "wire_8", "startTerminal": "comp_4_right", "endTerminal": "comp_5_node", "points": [{ "x": 410, "y": 220 }, { "x": 435, "y": 220 }, { "x": 435, "y": 180 }, { "x": 460, "y": 180 }] },
                    { "id": "wire_11", "startTerminal": "comp_5_node", "endTerminal": "comp_6_in_neg", "points": [{ "x": 460, "y": 180 }, { "x": 460, "y": 180 }, { "x": 460, "y": 165 }, { "x": 510, "y": 165 }] },
                    { "id": "wire_13", "startTerminal": "comp_5_node", "endTerminal": "comp_7_left", "points": [{ "x": 460, "y": 180 }, { "x": 460, "y": 180 }, { "x": 460, "y": 100 }, { "x": 510, "y": 100 }] },
                    { "id": "wire_16", "startTerminal": "comp_7_right", "endTerminal": "comp_8_node", "points": [{ "x": 570, "y": 100 }, { "x": 620, "y": 100 }, { "x": 620, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_18", "startTerminal": "comp_6_out", "endTerminal": "comp_8_node", "points": [{ "x": 570, "y": 180 }, { "x": 595, "y": 180 }, { "x": 595, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_20", "startTerminal": "comp_3_negative", "endTerminal": "comp_10_node", "points": [{ "x": 300, "y": 310 }, { "x": 300, "y": 310 }, { "x": 300, "y": 340 }, { "x": 300, "y": 340 }] },
                    { "id": "wire_23", "startTerminal": "comp_10_node", "endTerminal": "comp_9_ref", "points": [{ "x": 300, "y": 340 }, { "x": 350, "y": 340 }, { "x": 350, "y": 345 }, { "x": 400, "y": 345 }] },
                    { "id": "wire_25", "startTerminal": "comp_10_node", "endTerminal": "comp_1_negative", "points": [{ "x": 300, "y": 340 }, { "x": 240, "y": 340 }, { "x": 240, "y": 270 }, { "x": 240, "y": 270 }] },
                    { "id": "wire_27", "startTerminal": "comp_6_in_pos", "endTerminal": "comp_9_ref", "points": [{ "x": 510, "y": 195 }, { "x": 460, "y": 195 }, { "x": 460, "y": 345 }, { "x": 400, "y": 345 }] },
                    { "id": "wire_29", "startTerminal": "comp_11_ch1_pos", "endTerminal": "comp_8_node", "points": [{ "x": 600, "y": 225 }, { "x": 620, "y": 225 }, { "x": 620, "y": 180 }, { "x": 620, "y": 180 }] },
                    { "id": "wire_31", "startTerminal": "comp_11_ch1_neg", "endTerminal": "comp_9_ref", "points": [{ "x": 600, "y": 295 }, { "x": 500, "y": 295 }, { "x": 500, "y": 345 }, { "x": 400, "y": 345 }] }
                ]
            }
        },
        {
            presetId: "integrator",
            name: "Integrator",
            description: "Op-Amp configured to perform mathematical integration.",
            circuit: {
                components: [
                    { "id": "comp_1", "type": "voltage_source", "x": 240, "y": 260, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_2", "type": "resistor", "x": 300, "y": 200, "rotation": 0, "properties": { "resistance": 10000 }, "state": {} },
                    { "id": "comp_3", "type": "opamp", "x": 460, "y": 220, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90 }, "state": {} },
                    { "id": "comp_4", "type": "junction", "x": 380, "y": 200, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_5", "type": "junction", "x": 380, "y": 160, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_6", "type": "junction", "x": 540, "y": 160, "rotation": 90, "properties": {}, "state": {} },
                    { "id": "comp_7", "type": "junction", "x": 540, "y": 220, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_8", "type": "capacitor", "x": 460, "y": 160, "rotation": 0, "properties": { "capacitance": 1e-7 }, "state": { "voltage": 0, "current": 0 } },
                    { "id": "comp_9", "type": "ground", "x": 360, "y": 340, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_11", "type": "oscilloscope", "x": 140, "y": 100, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": true, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
                ],
                wires: [
                    { "id": "wire_2", "startTerminal": "comp_2_right", "endTerminal": "comp_4_node", "points": [{ "x": 330, "y": 200 }, { "x": 355, "y": 200 }, { "x": 355, "y": 200 }, { "x": 380, "y": 200 }] },
                    { "id": "wire_4", "startTerminal": "comp_2_left", "endTerminal": "comp_1_positive", "points": [{ "x": 270, "y": 200 }, { "x": 240, "y": 200 }, { "x": 240, "y": 230 }, { "x": 240, "y": 230 }] },
                    { "id": "wire_6", "startTerminal": "comp_4_node", "endTerminal": "comp_3_in_neg", "points": [{ "x": 380, "y": 200 }, { "x": 405, "y": 200 }, { "x": 405, "y": 205 }, { "x": 430, "y": 205 }] },
                    { "id": "wire_8", "startTerminal": "comp_4_node", "endTerminal": "comp_5_node", "points": [{ "x": 380, "y": 200 }, { "x": 380, "y": 200 }, { "x": 380, "y": 160 }, { "x": 380, "y": 160 }] },
                    { "id": "wire_10", "startTerminal": "comp_5_node", "endTerminal": "comp_8_left", "points": [{ "x": 380, "y": 160 }, { "x": 405, "y": 160 }, { "x": 405, "y": 160 }, { "x": 430, "y": 160 }] },
                    { "id": "wire_13", "startTerminal": "comp_8_right", "endTerminal": "comp_6_node", "points": [{ "x": 490, "y": 160 }, { "x": 515, "y": 160 }, { "x": 515, "y": 160 }, { "x": 540, "y": 160 }] },
                    { "id": "wire_15", "startTerminal": "comp_6_node", "endTerminal": "comp_7_node", "points": [{ "x": 540, "y": 160 }, { "x": 540, "y": 160 }, { "x": 540, "y": 220 }, { "x": 540, "y": 220 }] },
                    { "id": "wire_17", "startTerminal": "comp_3_out", "endTerminal": "comp_7_node", "points": [{ "x": 490, "y": 220 }, { "x": 515, "y": 220 }, { "x": 515, "y": 220 }, { "x": 540, "y": 220 }] },
                    { "id": "wire_19", "startTerminal": "comp_1_negative", "endTerminal": "comp_9_ref", "points": [{ "x": 240, "y": 290 }, { "x": 240, "y": 290 }, { "x": 240, "y": 325 }, { "x": 360, "y": 325 }] },
                    { "id": "wire_21", "startTerminal": "comp_9_ref", "endTerminal": "comp_3_in_pos", "points": [{ "x": 360, "y": 325 }, { "x": 395, "y": 325 }, { "x": 395, "y": 235 }, { "x": 430, "y": 235 }] },
                    { "id": "wire_31", "startTerminal": "comp_7_node", "endTerminal": "comp_11_ch1_pos", "points": [{ "x": 540, "y": 220 }, { "x": 600, "y": 220 }, { "x": 600, "y": 65 }, { "x": 140, "y": 65 }] },
                    { "id": "wire_33", "startTerminal": "comp_11_ch1_neg", "endTerminal": "comp_9_ref", "points": [{ "x": 140, "y": 135 }, { "x": 140, "y": 135 }, { "x": 140, "y": 325 }, { "x": 360, "y": 325 }] },
                    { "id": "wire_35", "startTerminal": "comp_1_positive", "endTerminal": "comp_11_ch2_pos", "points": [{ "x": 240, "y": 230 }, { "x": 100, "y": 230 }, { "x": 100, "y": 100 }, { "x": 95, "y": 100 }] },
                    { "id": "wire_37", "startTerminal": "comp_1_negative", "endTerminal": "comp_11_ch2_neg", "points": [{ "x": 240, "y": 290 }, { "x": 200, "y": 290 }, { "x": 200, "y": 100 }, { "x": 185, "y": 100 }] }
                ]
            }
        },
        {
            presetId: "differentiator",
            name: "Differentiator",
            description: "Op-Amp configured to perform mathematical differentiation.",
            circuit: {
                components: [
                    { "id": "comp_1", "type": "voltage_source", "x": 240, "y": 260, "rotation": 0, "properties": { "voltage": 10, "type": "ac", "frequency": 50, "phase": 90 }, "state": {} },
                    { "id": "comp_2", "type": "resistor", "x": 300, "y": 200, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_3", "type": "capacitor", "x": 420, "y": 200, "rotation": 0, "properties": { "capacitance": 0.000001 }, "state": { "voltage": 0, "current": 0 } },
                    { "id": "comp_4", "type": "junction", "x": 500, "y": 200, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_5", "type": "opamp", "x": 580, "y": 220, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90 }, "state": {} },
                    { "id": "comp_6", "type": "ground", "x": 420, "y": 360, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_7", "type": "resistor", "x": 580, "y": 140, "rotation": 0, "properties": { "resistance": 1000 }, "state": {} },
                    { "id": "comp_8", "type": "junction", "x": 680, "y": 220, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_9", "type": "oscilloscope", "x": 160, "y": 100, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": true, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
                ],
                wires: [
                    { "id": "wire_2", "startTerminal": "comp_1_positive", "endTerminal": "comp_2_left", "points": [{ "x": 240, "y": 230 }, { "x": 240, "y": 230 }, { "x": 240, "y": 200 }, { "x": 270, "y": 200 }] },
                    { "id": "wire_4", "startTerminal": "comp_2_right", "endTerminal": "comp_3_left", "points": [{ "x": 330, "y": 200 }, { "x": 360, "y": 200 }, { "x": 360, "y": 200 }, { "x": 390, "y": 200 }] },
                    { "id": "wire_6", "startTerminal": "comp_4_node", "endTerminal": "comp_5_in_neg", "points": [{ "x": 500, "y": 200 }, { "x": 525, "y": 200 }, { "x": 525, "y": 205 }, { "x": 550, "y": 205 }] },
                    { "id": "wire_8", "startTerminal": "comp_4_node", "endTerminal": "comp_3_right", "points": [{ "x": 500, "y": 200 }, { "x": 475, "y": 200 }, { "x": 475, "y": 200 }, { "x": 450, "y": 200 }] },
                    { "id": "wire_10", "startTerminal": "comp_1_negative", "endTerminal": "comp_6_ref", "points": [{ "x": 240, "y": 290 }, { "x": 240, "y": 290 }, { "x": 240, "y": 345 }, { "x": 420, "y": 345 }] },
                    { "id": "wire_12", "startTerminal": "comp_6_ref", "endTerminal": "comp_5_in_pos", "points": [{ "x": 420, "y": 345 }, { "x": 485, "y": 345 }, { "x": 485, "y": 235 }, { "x": 550, "y": 235 }] },
                    { "id": "wire_14", "startTerminal": "comp_4_node", "endTerminal": "comp_7_left", "points": [{ "x": 500, "y": 200 }, { "x": 500, "y": 200 }, { "x": 500, "y": 140 }, { "x": 550, "y": 140 }] },
                    { "id": "wire_16", "startTerminal": "comp_7_right", "endTerminal": "comp_8_node", "points": [{ "x": 610, "y": 140 }, { "x": 680, "y": 140 }, { "x": 680, "y": 220 }, { "x": 680, "y": 220 }] },
                    { "id": "wire_18", "startTerminal": "comp_8_node", "endTerminal": "comp_5_out", "points": [{ "x": 680, "y": 220 }, { "x": 645, "y": 220 }, { "x": 645, "y": 220 }, { "x": 610, "y": 220 }] },
                    { "id": "wire_21", "startTerminal": "comp_9_ch1_neg", "endTerminal": "comp_6_ref", "points": [{ "x": 160, "y": 135 }, { "x": 160, "y": 135 }, { "x": 160, "y": 345 }, { "x": 420, "y": 345 }] },
                    { "id": "wire_23", "startTerminal": "comp_9_ch1_pos", "endTerminal": "comp_8_node", "points": [{ "x": 160, "y": 65 }, { "x": 740, "y": 65 }, { "x": 740, "y": 220 }, { "x": 680, "y": 220 }] },
                    { "id": "wire_25", "startTerminal": "comp_9_ch2_pos", "endTerminal": "comp_1_positive", "points": [{ "x": 115, "y": 100 }, { "x": 80, "y": 100 }, { "x": 80, "y": 230 }, { "x": 240, "y": 230 }] },
                    { "id": "wire_27", "startTerminal": "comp_9_ch2_neg", "endTerminal": "comp_1_negative", "points": [{ "x": 205, "y": 100 }, { "x": 220, "y": 100 }, { "x": 220, "y": 290 }, { "x": 240, "y": 290 }] }
                ]
            }
        },
        {
            presetId: "log",
            name: "Log Amplifier",
            description: "Op-Amp configured as a logarithmic amplifier.",
            circuit: {
                components: [
                    { "id": "comp_1", "type": "voltage_source", "x": 220, "y": 300, "rotation": 0, "properties": { "voltage": 9, "type": "dc", "frequency": 50, "phase": 0 }, "state": {} },
                    { "id": "comp_2", "type": "resistor", "x": 280, "y": 220, "rotation": 0, "properties": { "resistance": 100000 }, "state": {} },
                    { "id": "comp_3", "type": "opamp", "x": 440, "y": 240, "rotation": 0, "properties": { "openLoopGain": 100000, "gbp": 1000000, "rin": 2000000, "rout": 75, "offsetVoltage": 0, "cmrr": 90 }, "state": {} },
                    { "id": "comp_4", "type": "junction", "x": 360, "y": 220, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_5", "type": "ground", "x": 340, "y": 380, "rotation": 0, "properties": {}, "state": {} },
                    { "id": "comp_6", "type": "diode", "x": 440, "y": 160, "rotation": 0, "properties": { "saturationCurrent": 1e-14, "emissionCoefficient": 1, "thermalVoltage": 0.02585 } },
                    { "id": "comp_7", "type": "junction", "x": 520, "y": 240, "rotation": 90, "properties": {}, "state": {} },
                    { "id": "comp_8", "type": "oscilloscope", "x": 520, "y": 300, "rotation": 0, "properties": { "ch1Enabled": true, "ch2Enabled": false, "ch1Mode": "Voltage", "ch2Mode": "Voltage", "ch1Label": "CH1", "ch2Label": "CH2" }, "state": {} }
                ],
                wires: [
                    { "id": "wire_2", "startTerminal": "comp_2_right", "endTerminal": "comp_4_node", "points": [{ "x": 310, "y": 220 }, { "x": 335, "y": 220 }, { "x": 335, "y": 220 }, { "x": 360, "y": 220 }] },
                    { "id": "wire_4", "startTerminal": "comp_4_node", "endTerminal": "comp_3_in_neg", "points": [{ "x": 360, "y": 220 }, { "x": 385, "y": 220 }, { "x": 385, "y": 225 }, { "x": 410, "y": 225 }] },
                    { "id": "wire_6", "startTerminal": "comp_2_left", "endTerminal": "comp_1_positive", "points": [{ "x": 250, "y": 220 }, { "x": 220, "y": 220 }, { "x": 220, "y": 270 }, { "x": 220, "y": 270 }] },
                    { "id": "wire_8", "startTerminal": "comp_1_negative", "endTerminal": "comp_5_ref", "points": [{ "x": 220, "y": 330 }, { "x": 220, "y": 330 }, { "x": 220, "y": 365 }, { "x": 340, "y": 365 }] },
                    { "id": "wire_10", "startTerminal": "comp_5_ref", "endTerminal": "comp_3_in_pos", "points": [{ "x": 340, "y": 365 }, { "x": 375, "y": 365 }, { "x": 375, "y": 255 }, { "x": 410, "y": 255 }] },
                    { "id": "wire_12", "startTerminal": "comp_4_node", "endTerminal": "comp_6_anode", "points": [{ "x": 360, "y": 220 }, { "x": 360, "y": 220 }, { "x": 360, "y": 160 }, { "x": 410, "y": 160 }] },
                    { "id": "wire_14", "startTerminal": "comp_7_node", "endTerminal": "comp_3_out", "points": [{ "x": 520, "y": 240 }, { "x": 495, "y": 240 }, { "x": 495, "y": 240 }, { "x": 470, "y": 240 }] },
                    { "id": "wire_16", "startTerminal": "comp_7_node", "endTerminal": "comp_6_cathode", "points": [{ "x": 520, "y": 240 }, { "x": 520, "y": 240 }, { "x": 520, "y": 160 }, { "x": 470, "y": 160 }] },
                    { "id": "wire_18", "startTerminal": "comp_8_ch1_pos", "endTerminal": "comp_7_node", "points": [{ "x": 520, "y": 265 }, { "x": 520, "y": 265 }, { "x": 520, "y": 240 }, { "x": 520, "y": 240 }] },
                    { "id": "wire_20", "startTerminal": "comp_5_ref", "endTerminal": "comp_8_ch1_neg", "points": [{ "x": 340, "y": 365 }, { "x": 520, "y": 365 }, { "x": 520, "y": 335 }, { "x": 520, "y": 335 }] }
                ]
            }
        },
        {
            presetId: "antilog",
            name: "Antilog Amplifier",
            description: "Op-Amp configured as an antilogarithmic (exponential) amplifier.",
            circuit: {
                components: [],
                wires: []
            }
        }
    ]
};
