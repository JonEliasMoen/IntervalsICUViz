import { zone } from "@/components/components/_chatComp";
import { mean } from "simple-statistics";

export interface Attribute {
  transform: (n: number) => number;

  getTransformed(): number[];

  getZones(): zone[];

  getComponent(): React.JSX.Element;
}

export function fix(v: number | undefined | null): number {
  if (v == undefined || Number.isNaN(v)) {
    return 0;
  }
  return v;
}

export function getRange(data: number[]) {
  return [Math.min(...data), mean(data), Math.max(...data)];
}

export function getLast(data: number[]) {
  return data[data.length - 1];
}

function trim(n: number): number {
  let v = Math.min(1, Math.max(0, n));
  return v;
}

export function transformed(data: number[], clas: Attribute) {
  return data.map((t) => trim(clas.transform(t)));
}

export function ewm(n: number[], hl: number) {
  const alpha = 1 - Math.exp(-Math.log(2) / hl);
  const res: number[] = [];
  n.forEach((v, i) => {
    if (i == 0) {
      res.push(v);
    } else {
      res.push((1 - alpha) * res[i - 1] + alpha * v);
    }
  });
  return res;
}
