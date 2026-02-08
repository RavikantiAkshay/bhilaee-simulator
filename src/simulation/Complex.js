/**
 * Complex.js - Complex number operations for AC analysis
 * 
 * AC circuits use phasor representation with complex impedances:
 * - Z_R = R (real)
 * - Z_L = jωL (imaginary)
 * - Z_C = 1/(jωC) = -j/(ωC) (imaginary)
 */

export class Complex {
    constructor(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    // Addition
    add(other) {
        return new Complex(
            this.real + other.real,
            this.imag + other.imag
        );
    }

    // Subtraction
    sub(other) {
        return new Complex(
            this.real - other.real,
            this.imag - other.imag
        );
    }

    // Multiplication
    mul(other) {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    // Division
    div(other) {
        const denom = other.real * other.real + other.imag * other.imag;
        if (denom === 0) throw new Error('Division by zero');
        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denom,
            (this.imag * other.real - this.real * other.imag) / denom
        );
    }

    // Negate
    neg() {
        return new Complex(-this.real, -this.imag);
    }

    // Magnitude |z|
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    // Phase angle in radians
    phase() {
        return Math.atan2(this.imag, this.real);
    }

    // Phase angle in degrees
    phaseDegrees() {
        return this.phase() * 180 / Math.PI;
    }

    // Clone
    clone() {
        return new Complex(this.real, this.imag);
    }

    // String representation
    toString() {
        if (this.imag === 0) return this.real.toFixed(4);
        if (this.real === 0) return `${this.imag.toFixed(4)}j`;
        const sign = this.imag >= 0 ? '+' : '';
        return `${this.real.toFixed(4)}${sign}${this.imag.toFixed(4)}j`;
    }

    // Polar form string
    toPolar() {
        return `${this.magnitude().toFixed(4)} ∠ ${this.phaseDegrees().toFixed(1)}°`;
    }

    // Static constructors
    static fromReal(r) {
        return new Complex(r, 0);
    }

    static fromImag(i) {
        return new Complex(0, i);
    }

    static fromPolar(magnitude, phaseRadians) {
        return new Complex(
            magnitude * Math.cos(phaseRadians),
            magnitude * Math.sin(phaseRadians)
        );
    }

    static zero() {
        return new Complex(0, 0);
    }

    static one() {
        return new Complex(1, 0);
    }

    static j() {
        return new Complex(0, 1);
    }
}

/**
 * Complex matrix for AC analysis
 */
export class ComplexMatrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];

        for (let i = 0; i < rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < cols; j++) {
                this.data[i][j] = Complex.zero();
            }
        }
    }

    get(row, col) {
        return this.data[row][col];
    }

    set(row, col, value) {
        this.data[row][col] = value;
    }

    add(row, col, value) {
        this.data[row][col] = this.data[row][col].add(value);
    }

    clone() {
        const m = new ComplexMatrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                m.set(i, j, this.get(i, j).clone());
            }
        }
        return m;
    }

    print(label = '') {
        console.log(label);
        for (let i = 0; i < this.rows; i++) {
            console.log(this.data[i].map(c => c.toString().padStart(20)).join(' '));
        }
    }
}

/**
 * Solve complex linear system using Gaussian elimination
 */
export function solveComplexSystem(A, b) {
    const n = A.rows;

    // Create augmented matrix
    const aug = new ComplexMatrix(n, n + 1);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            aug.set(i, j, A.get(i, j).clone());
        }
        aug.set(i, n, b[i].clone());
    }

    // Forward elimination with partial pivoting
    for (let k = 0; k < n; k++) {
        // Find pivot
        let maxRow = k;
        let maxVal = aug.get(k, k).magnitude();
        for (let i = k + 1; i < n; i++) {
            const val = aug.get(i, k).magnitude();
            if (val > maxVal) {
                maxVal = val;
                maxRow = i;
            }
        }

        // Swap rows
        if (maxRow !== k) {
            for (let j = k; j <= n; j++) {
                const temp = aug.get(k, j);
                aug.set(k, j, aug.get(maxRow, j));
                aug.set(maxRow, j, temp);
            }
        }

        // Check for singular matrix
        if (aug.get(k, k).magnitude() < 1e-12) {
            throw new Error(`Singular matrix at row ${k}`);
        }

        // Eliminate column
        for (let i = k + 1; i < n; i++) {
            const factor = aug.get(i, k).div(aug.get(k, k));
            for (let j = k; j <= n; j++) {
                aug.set(i, j, aug.get(i, j).sub(factor.mul(aug.get(k, j))));
            }
        }
    }

    // Back substitution
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let sum = aug.get(i, n);
        for (let j = i + 1; j < n; j++) {
            sum = sum.sub(aug.get(i, j).mul(x[j]));
        }
        x[i] = sum.div(aug.get(i, i));
    }

    return x;
}
