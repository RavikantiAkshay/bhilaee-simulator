export const lvdt_template = {
  "components": [
    {
      "id": "comp_61",
      "type": "lvdt",
      "x": 380,
      "y": 220,
      "rotation": 0,
      "properties": {
        "displacement": 0,
        "sensitivity": 0.2,
        "maxDisplacement": 10
      },
      "state": {}
    },
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
      "x": 340,
      "y": 400,
      "rotation": 0,
      "properties": {},
      "state": {}
    },
    {
      "id": "comp_64",
      "type": "voltmeter",
      "x": 560,
      "y": 220,
      "rotation": 90,
      "properties": {
        "voltage": 0
      }
    }
  ],
  "wires": [
    {
      "id": "wire_3",
      "startTerminal": "comp_62_positive",
      "endTerminal": "comp_61_exc_pos",
      "points": [
        {
          "x": 180,
          "y": 190
        },
        {
          "x": 240,
          "y": 190
        },
        {
          "x": 240,
          "y": 185
        },
        {
          "x": 290,
          "y": 185
        }
      ]
    },
    {
      "id": "wire_5",
      "startTerminal": "comp_62_negative",
      "endTerminal": "comp_61_out_pos",
      "points": [
        {
          "x": 180,
          "y": 250
        },
        {
          "x": 240,
          "y": 250
        },
        {
          "x": 240,
          "y": 255
        },
        {
          "x": 290,
          "y": 255
        }
      ]
    },
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
          "y": 385
        },
        {
          "x": 340,
          "y": 385
        }
      ]
    },
    {
      "id": "wire_9",
      "startTerminal": "comp_64_positive",
      "endTerminal": "comp_61_exc_neg",
      "points": [
        {
          "x": 560,
          "y": 190
        },
        {
          "x": 510,
          "y": 190
        },
        {
          "x": 510,
          "y": 185
        },
        {
          "x": 460,
          "y": 185
        }
      ]
    },
    {
      "id": "wire_11",
      "startTerminal": "comp_64_negative",
      "endTerminal": "comp_61_out_neg",
      "points": [
        {
          "x": 560,
          "y": 250
        },
        {
          "x": 510,
          "y": 250
        },
        {
          "x": 510,
          "y": 255
        },
        {
          "x": 460,
          "y": 255
        }
      ]
    },
    {
      "id": "wire_13",
      "startTerminal": "comp_63_ref",
      "endTerminal": "comp_64_negative",
      "points": [
        {
          "x": 340,
          "y": 385
        },
        {
          "x": 560,
          "y": 385
        },
        {
          "x": 560,
          "y": 250
        },
        {
          "x": 560,
          "y": 250
        }
      ]
    }
  ]
};
