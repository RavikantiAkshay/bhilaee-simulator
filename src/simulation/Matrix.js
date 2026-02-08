/**
 * Matrix.js - Linear algebra utilities for circuit simulation
 * 
 * Provides matrix operations needed for Modified Nodal Analysis (MNA):
 * - Matrix creation and manipulation
 * - Gaussian elimination with partial pivoting
 * - Solving linear systems Ax = b
 */

export class Matrix {
    /**
     * Create a matrix
     * @param {number} rows 
     * @param {number} cols 
     * @param {number} fill - Initial value (default 0)
     */
    constructor(rows, cols, fill = 0) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];
        
        for (let i = 0; i < rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < cols; j++) {
                this.data[i][j] = fill;
            }
        }
    }

    /**
     * Get value at position
     */
    get(row, col) {
        return this.data[row][col];
    }

    /**
     * Set value at position
     */
    set(row, col, value) {
        this.data[row][col] = value;
    }

    /**
     * Add value to position (useful for stamping)
     */
    add(row, col, value) {
        this.data[row][col] += value;
    }

    /**
     * Create identity matrix
     */
    static identity(n) {
        const m = new Matrix(n, n);
        for (let i = 0; i < n; i++) {
            m.set(i, i, 1);
        }
        return m;
    }

    /**
     * Create matrix from 2D array
     */
    static fromArray(arr) {
        const rows = arr.length;
        const cols = arr[0].length;
        const m = new Matrix(rows, cols);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                m.set(i, j, arr[i][j]);
            }
        }
        return m;
    }

    /**
     * Clone this matrix
     */
    clone() {
        const m = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                m.set(i, j, this.get(i, j));
            }
        }
        return m;
    }

    /**
     * Convert to 2D array
     */
    toArray() {
        return this.data.map(row => [...row]);
    }

    /**
     * Print matrix (for debugging)
     */
    print(label = '') {
        console.log(label);
        for (let i = 0; i < this.rows; i++) {
            console.log(this.data[i].map(v => v.toFixed(4).padStart(10)).join(' '));
        }
    }
}

/**
 * Solve linear system Ax = b using Gaussian elimination with partial pivoting
 * @param {Matrix} A - Coefficient matrix (n x n)
 * @param {number[]} b - Right-hand side vector (length n)
 * @returns {number[]} Solution vector x
 */
export function solveLinearSystem(A, b) {
    const n = A.rows;
    
    // Create augmented matrix [A|b]
    const aug = new Matrix(n, n + 1);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            aug.set(i, j, A.get(i, j));
        }
        aug.set(i, n, b[i]);
    }

    // Forward elimination with partial pivoting
    for (let k = 0; k < n; k++) {
        // Find pivot
        let maxRow = k;
        let maxVal = Math.abs(aug.get(k, k));
        for (let i = k + 1; i < n; i++) {
            if (Math.abs(aug.get(i, k)) > maxVal) {
                maxVal = Math.abs(aug.get(i, k));
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
        if (Math.abs(aug.get(k, k)) < 1e-12) {
            throw new Error(`Singular matrix at row ${k}. Circuit may have floating nodes or short circuits.`);
        }

        // Eliminate column
        for (let i = k + 1; i < n; i++) {
            const factor = aug.get(i, k) / aug.get(k, k);
            for (let j = k; j <= n; j++) {
                aug.set(i, j, aug.get(i, j) - factor * aug.get(k, j));
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = aug.get(i, n);
        for (let j = i + 1; j < n; j++) {
            sum -= aug.get(i, j) * x[j];
        }
        x[i] = sum / aug.get(i, i);
    }

    return x;
}

/**
 * Test the matrix solver
 * This runs a simple 3x3 system to verify correctness
 */
export function testMatrixSolver() {
    console.log('=== Matrix Solver Test ===');
    
    // Test: solve 2x + y = 5, x + 3y = 6
    // Solution: x = 1.8, y = 1.4
    const A = Matrix.fromArray([
        [2, 1],
        [1, 3]
    ]);
    const b = [5, 6];
    
    const x = solveLinearSystem(A, b);
    console.log('System: 2x + y = 5, x + 3y = 6');
    console.log('Solution:', x.map(v => v.toFixed(4)));
    console.log('Expected: [1.8000, 1.4000]');
    
    // Verify
    const v1 = 2 * x[0] + x[1];
    const v2 = x[0] + 3 * x[1];
    console.log('Verification: 2x + y =', v1.toFixed(4), ', x + 3y =', v2.toFixed(4));
    
    const success = Math.abs(v1 - 5) < 0.0001 && Math.abs(v2 - 6) < 0.0001;
    console.log('Test:', success ? '✓ PASSED' : '✗ FAILED');
    
    return success;
}
