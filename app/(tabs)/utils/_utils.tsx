import { Color } from "ora";

export function isoDateOffset(n: number) {
  let date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}
export function hourToString(h: number) {
  // gets time as HH:SS from hours as decimal
  let whole = new Date(1970, 0, 1);
  whole.setSeconds(h * 60 * 60);
  return whole.toTimeString().slice(0, 5);
}

export function gradientGen(n: number[], n2: number[], step: number) {
  const colors: number[][] = [];
  const delta: number[] = [];
  for (let z = 0; z < n.length; z++) {
    delta.push(Math.round(-n[z] + n2[z]) / step - 1);
    console.log(n[z]);
  }
  console.log(delta);
  for (let z = 0; z < step + 1; z++) {
    colors.push(
      delta.map((v, index) =>
        Math.min(Math.max(Math.round(v * z + n[index]), 0), 255),
      ),
    );
    console.log();
  }
  return colors;
}
