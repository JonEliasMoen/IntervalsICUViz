import { mean, standardDeviation } from "simple-statistics";
import quantile from "@stdlib/stats-base-dists-normal-quantile";

export function normalQuantile(
  value: number,
  mean: number,
  std: number,
): number {
  // Standard normal CDF (cumulative distribution function)
  function erf(x: number): number {
    // Approximation of the error function using a numerical method
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const tau =
      t *
      (0.254829592 +
        t *
          (-0.284496736 +
            t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const sign = x >= 0 ? 1 : -1;
    return sign * (1 - tau * Math.exp(-x * x));
  }

  // Standard normal CDF for a given x
  function normalCDF(x: number): number {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  }

  // Compute the quantile using the inverse CDF
  const zScore = (value - mean) / std;
  return normalCDF(zScore);
}

export class QUANTILE {
  mean: number;
  std: number;
  data: number[];

  constructor(data: number[], size: number) {
    this.data = data;
    this.mean = mean(data.slice(data.length - size));
    this.std = standardDeviation(data.slice(data.length - size));
  }

  transform(n: number) {
    // number => Quantile
    return normalQuantile(n, this.mean, this.std);
  }

  inverse(n: number) {
    // quantile => number
    return quantile(n, this.mean, this.std);
  }
}
