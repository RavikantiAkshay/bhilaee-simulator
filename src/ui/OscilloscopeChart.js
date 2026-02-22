/**
 * OscilloscopeChart.js - Canvas-based 2-channel oscilloscope display
 * 
 * Features:
 *   - 2 independent channels with distinct colors
 *   - Auto-scaling (default) with manual zoom/pan
 *   - Crosshair cursor with time/amplitude readouts
 *   - Buffered data (max 10,000 points per channel)
 *   - Handles DC (flat), AC (sinusoidal), and transient waveforms
 */

export class OscilloscopeChart {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;

        // Data storage
        this.channels = [];  // Array of { label, color, timePoints, values }
        this.maxPoints = 10000;

        // Chart area
        this.padding = { top: 36, right: 20, bottom: 45, left: 65 };
        this.width = 0;
        this.height = 0;

        // Zoom / pan state
        this.zoomX = 1;
        this.zoomY = 1;
        this.panX = 0; // as fraction of data range (0=start, 1=end)
        this.panY = 0;

        // Data range (computed from data)
        this.dataXMin = 0;
        this.dataXMax = 1;
        this.dataYMin = -1;
        this.dataYMax = 1;

        // Crosshair
        this.crosshair = null; // { x, y } in canvas coords

        // Styling
        this.bgColor = '#0d1117';
        this.gridColor = 'rgba(88, 166, 255, 0.12)';
        this.axisColor = '#444';
        this.textColor = '#8b949e';
        this.highlightColor = '#58a6ff';

        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'scope-canvas';
        this.canvas.style.cursor = 'crosshair';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.resize();

        // Event listeners
        this._onResize = () => this.resize();
        this._onWheel = (e) => this.handleWheel(e);
        this._onMouseMove = (e) => this.handleMouseMove(e);
        this._onMouseLeave = () => this.handleMouseLeave();
        this._onDblClick = () => this.resetZoom();

        window.addEventListener('resize', this._onResize);
        this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mouseleave', this._onMouseLeave);
        this.canvas.addEventListener('dblclick', this._onDblClick);
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        if (this.channels.length > 0) {
            this.render();
        }
    }

    /**
     * Set channel data.
     * @param {Array<{label: string, color: string, timePoints: number[], values: number[]}>} channels
     */
    setData(channels) {
        // Buffer: downsample if too many points
        this.channels = channels.map(ch => {
            if (ch.timePoints.length > this.maxPoints) {
                const step = Math.ceil(ch.timePoints.length / this.maxPoints);
                return {
                    label: ch.label,
                    color: ch.color,
                    timePoints: ch.timePoints.filter((_, i) => i % step === 0),
                    values: ch.values.filter((_, i) => i % step === 0)
                };
            }
            return { ...ch };
        });

        this.computeDataRange();
        this.render();
    }

    computeDataRange() {
        if (this.channels.length === 0) return;

        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;

        for (const ch of this.channels) {
            if (ch.timePoints.length === 0) continue;
            xMin = Math.min(xMin, ch.timePoints[0]);
            xMax = Math.max(xMax, ch.timePoints[ch.timePoints.length - 1]);
            for (const v of ch.values) {
                if (isFinite(v)) {
                    yMin = Math.min(yMin, v);
                    yMax = Math.max(yMax, v);
                }
            }
        }

        // Handle flat signals
        if (yMin === yMax) {
            yMin -= 1;
            yMax += 1;
        }

        // Add 10% padding
        const yRange = yMax - yMin;
        yMin -= yRange * 0.1;
        yMax += yRange * 0.1;

        // Handle edge case of no time range
        if (xMin >= xMax) {
            xMax = xMin + 1;
        }

        this.dataXMin = xMin;
        this.dataXMax = xMax;
        this.dataYMin = yMin;
        this.dataYMax = yMax;
    }

    // Get the visible data range (applying zoom/pan)
    getVisibleRange() {
        const fullXRange = this.dataXMax - this.dataXMin;
        const fullYRange = this.dataYMax - this.dataYMin;

        const visXRange = fullXRange / this.zoomX;
        const visYRange = fullYRange / this.zoomY;

        const xCenter = this.dataXMin + fullXRange * (0.5 + this.panX);
        const yCenter = this.dataYMin + fullYRange * (0.5 + this.panY);

        return {
            xMin: xCenter - visXRange / 2,
            xMax: xCenter + visXRange / 2,
            yMin: yCenter - visYRange / 2,
            yMax: yCenter + visYRange / 2
        };
    }

    render() {
        if (!this.ctx) return;
        const { width, height, padding, ctx } = this;
        if (width <= 0 || height <= 0) return;

        // Clear
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, width, height);

        if (this.channels.length === 0) {
            ctx.fillStyle = this.textColor;
            ctx.font = '13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data — run simulation with Oscilloscope connected', width / 2, height / 2);
            return;
        }

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const { xMin, xMax, yMin, yMax } = this.getVisibleRange();

        const scaleX = (x) => padding.left + ((x - xMin) / (xMax - xMin)) * chartW;
        const scaleY = (y) => padding.top + chartH - ((y - yMin) / (yMax - yMin)) * chartH;

        // Draw grid
        this.drawGrid(xMin, xMax, yMin, yMax, scaleX, scaleY, chartW, chartH);

        // Draw zero line if visible
        if (yMin < 0 && yMax > 0) {
            const y0 = scaleY(0);
            ctx.strokeStyle = 'rgba(88,166,255,0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y0);
            ctx.lineTo(padding.left + chartW, y0);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Clip to chart area
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding.left, padding.top, chartW, chartH);
        ctx.clip();

        // Draw waveforms
        for (const ch of this.channels) {
            this.drawWaveform(ch, scaleX, scaleY);
        }

        ctx.restore();

        // Draw axes
        this.drawAxes(chartW, chartH);

        // Draw axis labels
        this.drawLabels(xMin, xMax, yMin, yMax, chartW, chartH);

        // Draw legend
        this.drawLegend();

        // Draw crosshair
        if (this.crosshair) {
            this.drawCrosshair(xMin, xMax, yMin, yMax, scaleX, scaleY, chartW, chartH);
        }
    }

    drawWaveform(ch, scaleX, scaleY) {
        const { ctx } = this;
        const { timePoints, values, color } = ch;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        let started = false;
        for (let i = 0; i < timePoints.length; i++) {
            const x = scaleX(timePoints[i]);
            const y = scaleY(values[i]);

            if (!isFinite(x) || !isFinite(y)) continue;

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Glow effect
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawGrid(xMin, xMax, yMin, yMax, scaleX, scaleY, chartW, chartH) {
        const { ctx, padding } = this;

        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;

        // Vertical grid (8 divisions)
        const xDivs = 8;
        for (let i = 0; i <= xDivs; i++) {
            const x = padding.left + (i / xDivs) * chartW;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartH);
            ctx.stroke();
        }

        // Horizontal grid (6 divisions)
        const yDivs = 6;
        for (let i = 0; i <= yDivs; i++) {
            const y = padding.top + (i / yDivs) * chartH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartW, y);
            ctx.stroke();
        }
    }

    drawAxes(chartW, chartH) {
        const { ctx, padding } = this;

        ctx.strokeStyle = this.axisColor;
        ctx.lineWidth = 1.5;

        // X axis (bottom)
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.stroke();

        // Y axis (left)
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.stroke();
    }

    drawLabels(xMin, xMax, yMin, yMax, chartW, chartH) {
        const { ctx, padding, height } = this;

        ctx.fillStyle = this.textColor;
        ctx.font = '10px "JetBrains Mono", monospace';

        // X axis labels
        ctx.textAlign = 'center';
        const xDivs = 8;
        for (let i = 0; i <= xDivs; i++) {
            const value = xMin + (i / xDivs) * (xMax - xMin);
            const x = padding.left + (i / xDivs) * chartW;
            ctx.fillText(this.formatTime(value), x, height - padding.bottom + 18);
        }

        // Y axis labels
        ctx.textAlign = 'right';
        const yDivs = 6;
        for (let i = 0; i <= yDivs; i++) {
            const value = yMax - (i / yDivs) * (yMax - yMin);
            const y = padding.top + (i / yDivs) * chartH;
            ctx.fillText(this.formatAmplitude(value), padding.left - 6, y + 3);
        }

        // Axis titles
        ctx.fillStyle = '#aaa';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Time', padding.left + chartW / 2, height - 4);

        ctx.save();
        ctx.translate(12, padding.top + chartH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Amplitude', 0, 0);
        ctx.restore();
    }

    drawLegend() {
        const { ctx, padding } = this;
        ctx.font = '11px "JetBrains Mono", monospace';
        let x = padding.left + 10;
        const y = padding.top - 12;

        for (const ch of this.channels) {
            // Color indicator
            ctx.fillStyle = ch.color;
            ctx.fillRect(x, y - 5, 10, 10);

            // Label
            ctx.fillStyle = '#ccc';
            ctx.textAlign = 'left';
            ctx.fillText(ch.label, x + 14, y + 4);
            x += ctx.measureText(ch.label).width + 34;
        }
    }

    drawCrosshair(xMin, xMax, yMin, yMax, scaleX, scaleY, chartW, chartH) {
        const { ctx, padding, crosshair } = this;
        const { x, y } = crosshair;

        // Check if inside chart area
        if (x < padding.left || x > padding.left + chartW ||
            y < padding.top || y > padding.top + chartH) return;

        // Crosshair lines
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Vertical
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartH);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();

        ctx.setLineDash([]);

        // Compute data values at cursor
        const dataX = xMin + ((x - padding.left) / chartW) * (xMax - xMin);
        const dataY = yMax - ((y - padding.top) / chartH) * (yMax - yMin);

        // Readout box
        const readout = `${this.formatTime(dataX)}  |  ${this.formatAmplitude(dataY)}`;
        ctx.font = '10px "JetBrains Mono", monospace';
        const textW = ctx.measureText(readout).width + 12;

        const boxX = Math.min(x + 10, padding.left + chartW - textW - 4);
        const boxY = Math.max(y - 22, padding.top + 4);

        ctx.fillStyle = 'rgba(13,17,23,0.85)';
        ctx.fillRect(boxX, boxY, textW, 18);
        ctx.strokeStyle = 'rgba(88,166,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, textW, 18);

        ctx.fillStyle = '#e6edf3';
        ctx.textAlign = 'left';
        ctx.fillText(readout, boxX + 6, boxY + 13);

        // Highlight nearest data point on each channel
        for (const ch of this.channels) {
            const idx = this.findNearestIndex(ch.timePoints, dataX);
            if (idx >= 0 && idx < ch.values.length) {
                const px = scaleX(ch.timePoints[idx]);
                const py = scaleY(ch.values[idx]);

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = ch.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }

    findNearestIndex(arr, target) {
        let lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (arr[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        if (lo > 0 && Math.abs(arr[lo - 1] - target) < Math.abs(arr[lo] - target)) {
            return lo - 1;
        }
        return lo;
    }

    // ---- Zoom / Pan ----

    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.85 : 1.18;

        if (e.shiftKey) {
            this.zoomY = Math.max(0.1, Math.min(100, this.zoomY * factor));
        } else {
            this.zoomX = Math.max(0.1, Math.min(100, this.zoomX * factor));
        }

        this.render();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.render();
    }

    handleMouseLeave() {
        this.crosshair = null;
        this.render();
    }

    resetZoom() {
        this.zoomX = 1;
        this.zoomY = 1;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }

    // ---- Formatting helpers ----

    formatTime(seconds) {
        if (Math.abs(seconds) < 1e-6) return '0';
        if (Math.abs(seconds) < 1e-3) return (seconds * 1e6).toFixed(1) + 'µs';
        if (Math.abs(seconds) < 1) return (seconds * 1e3).toFixed(2) + 'ms';
        return seconds.toFixed(4) + 's';
    }

    formatAmplitude(value) {
        if (Math.abs(value) < 0.001) return value.toExponential(1);
        if (Math.abs(value) >= 1000) return (value / 1000).toFixed(2) + 'k';
        return value.toFixed(2);
    }

    // ---- Cleanup ----

    destroy() {
        window.removeEventListener('resize', this._onResize);
        if (this.canvas) {
            this.canvas.removeEventListener('wheel', this._onWheel);
            this.canvas.removeEventListener('mousemove', this._onMouseMove);
            this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
            this.canvas.removeEventListener('dblclick', this._onDblClick);
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }
}
