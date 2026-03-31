export const strain_gauge_template = {
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
      "id": "comp_65",
      "type": "strain_gauge",
      "x": 400,
      "y": 200,
      "rotation": 0,
      "properties": {
        "force": 11,
        "maxForce": 100,
        "gaugeFactor": 2.1,
        "nominalR": 350,
        "youngsModulus": 200000000000,
        "crossSection": 0.000001
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
      "id": "wire_15",
      "startTerminal": "comp_65_exc_pos",
      "endTerminal": "comp_62_positive",
      "points": [
        {
          "x": 400,
          "y": 110
        },
        {
          "x": 180,
          "y": 110
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
      "id": "wire_17",
      "startTerminal": "comp_65_exc_neg",
      "endTerminal": "comp_62_negative",
      "points": [
        {
          "x": 400,
          "y": 290
        },
        {
          "x": 180,
          "y": 290
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
      "id": "wire_20",
      "startTerminal": "comp_64_negative",
      "endTerminal": "comp_65_out_neg",
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
          "y": 200
        },
        {
          "x": 490,
          "y": 200
        }
      ]
    },
    {
      "id": "wire_22",
      "startTerminal": "comp_64_positive",
      "endTerminal": "comp_65_out_pos",
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
          "y": 200
        },
        {
          "x": 310,
          "y": 200
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
    }
  ]
};
