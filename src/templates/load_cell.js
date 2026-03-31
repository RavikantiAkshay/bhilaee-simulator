export const load_cell_template = {
  "components": [
    {
      "id": "comp_62",
      "type": "voltage_source",
      "x": 180,
      "y": 220,
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
      "id": "comp_63",
      "type": "ground",
      "x": 400,
      "y": 420,
      "rotation": 0,
      "properties": {},
      "state": {}
    },
    {
      "id": "comp_64",
      "type": "voltmeter",
      "x": 400,
      "y": 340,
      "rotation": 0,
      "properties": {
        "voltage": 0
      }
    },
    {
      "id": "comp_66",
      "type": "load_cell",
      "x": 400,
      "y": 180,
      "rotation": 0,
      "properties": {
        "weight": "1000",
        "ratedCapacity": 5000,
        "sensitivity": 0.002,
        "amplifierGain": 100
      },
      "state": {}
    }
  ],
  "wires": [
    {
      "id": "wire_7",
      "startTerminal": "comp_62_negative",
      "endTerminal": "comp_63_ref",
      "points": [
        {
          "x": 180,
          "y": 250
        },
        {
          "x": 180,
          "y": 250
        },
        {
          "x": 180,
          "y": 405
        },
        {
          "x": 400,
          "y": 405
        }
      ]
    },
    {
      "id": "wire_24",
      "startTerminal": "comp_64_negative",
      "endTerminal": "comp_63_ref",
      "points": [
        {
          "x": 430,
          "y": 340
        },
        {
          "x": 520,
          "y": 340
        },
        {
          "x": 520,
          "y": 405
        },
        {
          "x": 400,
          "y": 405
        }
      ]
    },
    {
      "id": "wire_26",
      "startTerminal": "comp_66_exc_pos",
      "endTerminal": "comp_62_positive",
      "points": [
        {
          "x": 400,
          "y": 75
        },
        {
          "x": 180,
          "y": 75
        },
        {
          "x": 180,
          "y": 190
        },
        {
          "x": 180,
          "y": 190
        }
      ]
    },
    {
      "id": "wire_28",
      "startTerminal": "comp_66_exc_neg",
      "endTerminal": "comp_62_negative",
      "points": [
        {
          "x": 400,
          "y": 285
        },
        {
          "x": 180,
          "y": 285
        },
        {
          "x": 180,
          "y": 250
        },
        {
          "x": 180,
          "y": 250
        }
      ]
    },
    {
      "id": "wire_30",
      "startTerminal": "comp_64_positive",
      "endTerminal": "comp_66_out_pos",
      "points": [
        {
          "x": 370,
          "y": 340
        },
        {
          "x": 260,
          "y": 340
        },
        {
          "x": 260,
          "y": 180
        },
        {
          "x": 280,
          "y": 180
        }
      ]
    },
    {
      "id": "wire_32",
      "startTerminal": "comp_64_negative",
      "endTerminal": "comp_66_out_neg",
      "points": [
        {
          "x": 430,
          "y": 340
        },
        {
          "x": 520,
          "y": 340
        },
        {
          "x": 520,
          "y": 180
        },
        {
          "x": 520,
          "y": 180
        }
      ]
    }
  ]
};
