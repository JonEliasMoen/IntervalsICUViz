import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import React from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { Boundaries } from "@/components/utils/_otherModel";

export function findDoable(
  dt: number,
  load: number[],
  tol: number[],
  lowerDiscount: number,
  higherDiscount: number,
): Boundaries {
  const lastTol = tol[tol.length - 1];
  const lastLoad = load[tol.length - 1];
  const yLoad = load[load.length - 2];
  const yTol = tol[tol.length - 2];

  const alpha = 1 - Math.exp(-Math.log(2) / 7);
  const beta = 1 - Math.exp(-Math.log(2) / 42);

  for (let z = 0; z < dt; z++) {
    load.push((1 - alpha) * lastLoad);
    tol.push((1 - beta) * lastTol);
  }

  const d = ((alpha - 1) * yLoad + lastLoad) / alpha;

  const res: number[] = [];
  for (const t of [lowerDiscount, higherDiscount]) {
    let x = alpha * (yLoad - d) + t * (beta * d - beta * yTol + yTol) - yLoad;
    x /= alpha - t * beta;
    res.push(x);
  }

  // Ensure no negative values
  const adjustedRes = res.map((val) => Math.max(0, val));
  return {
    min: adjustedRes[0],
    max: adjustedRes[1],
  };
}

export class ACR implements Attribute {
  atl: number[];
  ctl: number[];
  acwr: number[];
  acwrT: number[];
  last: number;
  needed: Boundaries;

  constructor(data: wellnessWrapper) {
    this.atl = data.getAttr("atl");
    this.ctl = data.getAttr("ctl");
    this.acwr = this.getAcwr();
    this.acwrT = transformed(this.acwr, this);
    this.last = getLast(this.acwr);
    this.needed = findDoable(0, this.atl, this.ctl, 1, 1.3);
  }

  getPlot(): { atl: number[]; ctl: number[] } {
    let max = Math.max(...this.ctl, ...this.atl);
    return {
      atl: this.atl.map((t) => t / max),
      ctl: this.ctl.map((t) => t / max),
    };
  }

  getTransformed(): number[] {
    return this.acwrT;
  }

  getAcwr() {
    return this.ctl.map((t, i) => this.atl[i] / t);
  }

  transform(n: number): number {
    return n / 2.0;
  }

  getZones(): zone[] {
    return [
      {
        text: "Low",
        startVal: 0,
        endVal: 0.8,
        color: "#1F77B44D",
      },
      {
        text: "Optimal",
        startVal: 0.8,
        endVal: 1.3,
        color: "#009E0066",
      },
      {
        text: "High",
        startVal: 1.3,
        endVal: 1.5,
        color: "#FFCB0E80",
      },
      {
        text: "Very high",
        startVal: 1.5,
        endVal: 2,
        color: "#D627284D",
      },
    ];
  }

  getComponent() {
    return (
      <ChartComponent
        title={"ACWR"}
        progress={this.last}
        zones={this.getZones()}
        transform={this.transform}
      />
    );
  }
}
