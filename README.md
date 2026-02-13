# Circuit Simulator

A browser-based RLC circuit simulator with real-time visualization and analysis capabilities.

## Features

### Components
- **Voltage Source** - DC voltage supply with configurable voltage
- **Resistor** - Fixed resistance with adjustable value
- **Capacitor** - Capacitance with configurable value
- **Inductor** - Inductance with configurable value
- **Ground** - Reference node (0V)
- **Junction** - Connection point for parallel circuits

### Analysis Types
- **DC Analysis** - Steady-state DC operating point
- **AC Analysis** - Frequency response with complex impedances
- **Transient Analysis** - Time-domain simulation with waveform charts

### User Interface
- Drag-and-drop component placement
- Wire routing between component terminals
- Property panel for editing component values
- Collapsible sections for better output visibility
- Interactive waveform chart with legend

### State Management
- **Persistent Storage** - Circuits are saved automatically to the browser's local storage
- **Experiment Isolation** - Use `?expId=your_experiment_name` in the URL to create separate workspaces
- **Auto-Save** - Changes are saved instantly; no manual saving required

## Getting Started

1. Serve the project files with a local server:
   ```bash
   npx serve .
   ```

2. Open `http://localhost:3000` in your browser

3. Build a circuit:
   - Click component buttons in the toolbar (or use keyboard shortcuts)
   - Place components on the canvas
   - Click terminals to create wires between components
   - Add a Ground component to establish reference

4. Run simulation:
   - Select analysis type (DC, AC, or Transient)
   - Configure simulation parameters
   - Click "Run" to execute simulation
   - View results in the Output panel and waveform chart

5. Reset State:
   - To clear the current experiment, run `window.circuitSimulator.stateManager.resetState()` in the browser console.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| R | Place Resistor |
| C | Place Capacitor |
| L | Place Inductor |
| V | Place Voltage Source |
| G | Place Ground |
| J | Place Junction |
| Delete | Delete selected component |
| Escape | Cancel current action |

## Project Structure

```
src/
├── components/     # Component classes (R, L, C, V, Ground, Junction)
├── core/           # Core classes (CircuitGraph, Wire, Node)
├── simulation/     # Solvers (MNA, AC, Transient, Matrix utilities)
├── ui/             # UI components (Canvas, Toolbar, PropertyPanel, Chart)
└── main.js         # Application entry point
```

## Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks required
- **ES6 Modules** - Modern JavaScript module system
- **Canvas API** - Circuit visualization and waveform rendering

## License

MIT