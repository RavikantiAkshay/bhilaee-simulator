# Circuit Simulator

A browser-based circuit simulator for electrical engineering lab experiments. Supports DC, AC, and transient analysis with real-time visualization, oscilloscope charting, and pre-built experiment templates.

## Features

### Components

| Component | Description | Shortcut |
|-----------|-------------|----------|
| **Voltage Source** | AC/DC supply with configurable voltage, frequency, and phase | `V` |
| **Ground** | Reference node (0 V) | `G` |
| **Junction** | Connection node for branching circuits | `J` |
| **Resistor** | Fixed resistance | `R` |
| **Capacitor** | Configurable capacitance | `C` |
| **Inductor** | Configurable inductance | `L` |
| **Ammeter** | Series current measurement (0 V internal source) | `A` |
| **Voltmeter** | Parallel voltage measurement (high impedance) | `M` |
| **Wattmeter** | 4-terminal power meter with current coil (M→L) and voltage coil (C→V) | `W` |
| **Transformer** | Non-ideal single-phase transformer (Req, Xeq, Rc, Xm, turns ratio) | `T` |
| **3-Phase Source** | Balanced Y-connected three-phase supply (R, Y, B, N terminals) | `3` |
| **Load** | Series R–L load for transformer testing (0–125 % of rated load) | — |
| **Oscilloscope** | 2-channel differential voltage/current observer with waveform display | — |

### Analysis Modes

- **DC Analysis** — Steady-state operating point using MNA (Modified Nodal Analysis).
- **AC Analysis** — Complex phasor-domain solution at a single frequency. Computes node voltages, branch currents, and instrument readings (ammeter, voltmeter, wattmeter).
- **Transient Analysis** — Time-domain integration (Backward Euler companion models) with interactive waveform charts.

### Visualization

- **Waveform Chart** — Canvas-rendered time-domain plots for transient results with auto-scaling axes, legend, and zoom/pan.
- **Oscilloscope** — Dedicated 2-channel overlay with per-channel enable, color-coded traces (CH1 cyan, CH2 amber), crosshair cursor, and adaptive units (mV/V, mA/A, ms/µs). Supports DC flat-line, AC phasor reconstruction, and transient time-series display.

### State Management

- **Persistent Storage** — Circuit state is saved to `localStorage` per experiment (manual save only).
- **Templates** — Pre-built experiments load automatically via URL parameter:
  ```
  http://localhost:3001/?expId=basic-ee-exp-2
  ```
- **New Session** — Append `&newSession=true` to force a fresh template load, discarding any saved state.
- **Reset** — Run `localStorage.removeItem('sim_state_<expId>')` in the console and reload to revert.

## Experiment Templates

| Template ID | Experiment | Analysis |
|-------------|------------|----------|
| `basic-ee-exp-1` | Measurement and Correction of Power Factor | AC |
| `basic-ee-exp-2` | Verification of Superposition Theorem | DC |
| `basic-ee-exp-3` | Verification of Thévenin's Theorem | DC |
| `basic-ee-exp-4` | Transient Response of Series RLC Circuit | Transient |
| `basic-ee-exp-5` | OC & SC Test on Single-Phase Transformer | AC |
| `basic-ee-exp-6` | Three-Phase Star and Delta Connections | AC |
| `basic-ee-exp-7` | No-Load and Load Test on Single-Phase Transformer | AC |

## Getting Started

1. **Serve the project** with any static file server:
   ```bash
   npx -y http-server . -p 3001
   ```

2. **Open** `http://localhost:3001` in your browser.

3. **Build a circuit:**
   - Click toolbar buttons or press keyboard shortcuts to select a component.
   - Click the canvas to place the component.
   - Click a terminal (dot) and then another terminal to draw a wire.
   - Always add a **Ground** component to establish a reference node.

4. **Run simulation:**
   - Select the analysis type (DC, AC, or Transient) in the simulation panel.
   - Configure parameters (frequency, simulation time, time step).
   - Click **Run** to solve the circuit.
   - View numeric results in the **Output** panel and waveforms in the chart/oscilloscope overlays.

5. **Load a template:**
   ```
   http://localhost:3001/?expId=basic-ee-exp-4
   ```

## Project Structure

```
├── index.html              # Application shell
├── index.css               # Global styles (dark theme)
├── config.js               # Runtime configuration
└── src/
    ├── main.js             # Entry point — initializes all modules
    ├── core/
    │   ├── Component.js    # Base component class, Terminal, formatValue
    │   ├── CircuitGraph.js # Graph data structure (components + wires)
    │   ├── Wire.js         # Wire routing and rendering
    │   └── Node.js         # Electrical node abstraction
    ├── components/
    │   ├── index.js        # Component registry & factory
    │   ├── Resistor.js
    │   ├── Capacitor.js
    │   ├── Inductor.js
    │   ├── VoltageSource.js
    │   ├── Ground.js
    │   ├── Junction.js
    │   ├── Ammeter.js
    │   ├── Voltmeter.js
    │   ├── Wattmeter.js
    │   ├── Transformer.js
    │   ├── ThreePhaseSource.js
    │   ├── Load.js
    │   └── Oscilloscope.js
    ├── simulation/
    │   ├── index.js        # Public exports
    │   ├── MNASolver.js    # DC & AC solver (MNA + complex phasors)
    │   ├── TransientSolver.js  # Time-domain solver (BE companion models)
    │   ├── Complex.js      # Complex number & matrix arithmetic
    │   └── Matrix.js       # Real matrix utilities (LU decomposition)
    ├── templates/
    │   ├── index.js        # Template registry (expId → circuit state)
    │   ├── power_factor_correction.js
    │   ├── verification_of_superposition_theorem.js
    │   ├── verification_of_thevenin_theorem.js
    │   ├── transient_response_rlc.js
    │   ├── oc_sc_test_single_phase_transformer.js
    │   ├── three_phase_connections.js
    │   └── transformer_test.js
    ├── ui/
    │   ├── Canvas.js       # SVG canvas — drag, drop, select, wire drawing
    │   ├── Toolbar.js      # Component palette & keyboard shortcuts
    │   ├── PropertyPanel.js    # Selected-component property editor
    │   ├── SimulationControls.js   # Run/Stop/Reset, result display, chart feed
    │   ├── SimpleChart.js      # Canvas waveform chart (transient results)
    │   └── OscilloscopeChart.js    # 2-channel oscilloscope overlay
    └── utils/
        └── StateManager.js # localStorage persistence & template loading
```

## Technology Stack

- **Pure HTML / CSS / JavaScript** — no build step, no frameworks.
- **ES6 Modules** — native browser module loading.
- **SVG** — component rendering and interactive canvas.
- **Canvas API** — waveform chart and oscilloscope rendering.

## License

MIT