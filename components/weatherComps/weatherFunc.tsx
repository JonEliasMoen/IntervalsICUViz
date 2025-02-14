function toFahrenheit(C: number): number {
  return (C * 9) / 5 + 32;
}

function fromFahrenheit(F: number): number {
  return (F - 32) * (5 / 9);
}

function heatIndex(T: number[], RH: number[]): number[] {
  let HI = T.map(
    (temp, i) =>
      -42.379 +
      2.04901523 * temp +
      10.14333127 * RH[i] -
      0.22475541 * temp * RH[i] -
      0.00683783 * temp * temp -
      0.05481717 * RH[i] * RH[i] +
      0.00122874 * temp * temp * RH[i] +
      0.00085282 * temp * RH[i] * RH[i] -
      0.00000199 * temp * temp * RH[i] * RH[i],
  );

  for (let i = 0; i < T.length; i++) {
    if (T[i] > 80 && T[i] < 112 && RH[i] < 13) {
      HI[i] -= ((13 - RH[i]) / 4) * Math.sqrt((17 - Math.abs(T[i] - 95)) / 17);
    }
    if (T[i] > 80 && T[i] < 87 && RH[i] > 85) {
      HI[i] += ((RH[i] - 85) / 10) * ((87 - T[i]) / 5);
    }
  }

  return HI;
}

function heatIndexReel(g: number[], RH: number[]): number[] {
  let T = g.map(toFahrenheit);
  let HI = T.map(
    (temp, i) => 0.5 * (temp + 61.0 + (temp - 68.0) * 1.2 + RH[i] * 0.094),
  );

  HI = HI.map((temp, i) => (temp + T[i]) * 0.5);

  for (let i = 0; i < HI.length; i++) {
    if (HI[i] > 80) {
      HI[i] = heatIndex([T[i]], [RH[i]])[0];
    }
  }

  return HI.map(fromFahrenheit);
}

function windIndex(T: number[], V: number[]): number[] {
  let V_kmh = V.map((v) => v * 3.6);
  let res = T.map(
    (temp, i) =>
      13.12 +
      0.6215 * temp -
      11.37 * Math.pow(V_kmh[i], 0.16) +
      0.3965 * temp * Math.pow(V_kmh[i], 0.16),
  );

  for (let i = 0; i < T.length; i++) {
    if (V_kmh[i] < 3 || V_kmh[i] > 120 || T[i] < -50 || T[i] > 50) {
      res[i] = T[i];
    }
  }

  return res;
}

export function feelTemp(T: number[], V: number[], RH: number[]): number[] {
  return windIndex(heatIndexReel(T, RH), V);
}
