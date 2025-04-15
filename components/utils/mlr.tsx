export class MultivariateLinearRegression {
  public weights: number[];
  private intercept: number;
  public aweights: number[][];

  constructor() {
    this.weights = [];
    this.intercept = 0;
    this.aweights = [];
  }

  // Fit the model to the data
  fit(X: number[][], y: number[]): void {
    const XWithIntercept = this.addIntercept(X); // Add intercept column to X

    // Convert to matrices
    const XMatrix = this.matrixFrom2DArray(XWithIntercept);
    const yMatrix = this.matrixFromArray(y);

    // Normal Equation: (X^T * X)^-1 * X^T * y
    const XTranspose = this.transpose(XMatrix);
    const XtX = this.multiply(XTranspose, XMatrix);
    const XtXInv = this.invert(XtX);
    const XtY = this.multiply(XTranspose, yMatrix);

    // Solve for weights (beta)
    const beta = this.multiply(XtXInv, XtY);

    // Set intercept and weights
    this.intercept = beta[beta.length - 1][0];
    this.weights = beta.slice(0, beta.length - 1).map((row) => row[0]);
    this.aweights = beta;
  }

  // Get the model's weights (coefficients) and intercept
  getWeights(): { intercept: number; weights: number[] } {
    return { intercept: this.intercept, weights: this.weights };
  }

  // Predict using the trained model
  predict(X: number[][]): number[] {
    const XWithIntercept = this.addIntercept(X);
    return XWithIntercept.map((row) => {
      return row.reduce(
        (sum, value, index) =>
          sum +
          value *
            (index === row.length - 1 ? this.intercept : this.weights[index]),
        0,
      );
    });
  }

  // Helper functions to perform matrix operations
  private matrixFrom2DArray(arr: number[][]): number[][] {
    return arr;
  }

  private matrixFromArray(arr: number[]): number[][] {
    return arr.map((value) => [value]);
  }

  private addIntercept(X: number[][]): number[][] {
    return X.map((row) => [...row, 1]); // Add 1 at the end of each row
  }

  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
  }

  private multiply(A: number[][], B: number[][] | number[]): number[][] {
    if (Array.isArray(B[0])) {
      const result: number[][] = [];
      for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < B[0].length; j++) {
          let sum = 0;
          for (let k = 0; k < A[0].length; k++) {
            sum += A[i][k] * B[k][j];
          }
          result[i][j] = sum;
        }
      }
      return result;
    } else {
      return A.map((row) =>
        row.reduce((sum, value, index) => sum + value * (B[index] || 0), 0),
      );
    }
  }

  private invert(matrix: number[][]): number[][] {
    const n = matrix.length;
    const identity: number[][] = Array(n)
      .fill(0)
      .map((_, i) =>
        Array(n)
          .fill(0)
          .map((_, j) => (i === j ? 1 : 0)),
      );

    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      const divisor = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= divisor;
      }

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const multiplier = augmented[j][i];
          for (let k = 0; k < 2 * n; k++) {
            augmented[j][k] -= augmented[i][k] * multiplier;
          }
        }
      }
    }

    return augmented.map((row) => row.slice(n));
  }
}
