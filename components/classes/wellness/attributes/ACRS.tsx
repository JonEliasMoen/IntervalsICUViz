import {
  Attribute,
  ewm,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import React from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { wellness } from "@/components/utils/_fitnessModel";
import { Boundaries } from "@/components/utils/_otherModel";

export function strainMonotonyEwm(tdata: wellness[]): number[] {
  const varianceL = tdata.map((t) => Math.pow(t.ctlLoad - t.ctl, 2));
  const varianceS = tdata.map((t) => Math.pow(t.atlLoad - t.atl, 2));
  console.log("variance", varianceS);
  const stdS = ewm(varianceS, 28).map((t) => Math.sqrt(t));
  const stdL = ewm(varianceL, 42).map((t) => Math.sqrt(t));

  const strainS = tdata.map((t, i) => t.atl * (t.atl / stdS[i]));
  const strainL = tdata.map((t, i) => t.ctl * (t.ctl / stdL[i]));
  return tdata.map((t, i) => strainS[i] / strainL[i]);
}

export function strainMonotonyEwmList(tdata: wellness[], k: number): number {
  tdata = JSON.parse(JSON.stringify(tdata));

  let n = (y: number, load: number, f: number) => {
    return y + f * (load - y);
  };
  console.log(k, tdata[tdata.length - 1].atl);
  tdata[tdata.length - 1].atl = n(
    tdata[tdata.length - 2].atl,
    tdata[tdata.length - 1].atlLoad + k,
    1 / 7,
  );
  tdata[tdata.length - 1].ctl = n(
    tdata[tdata.length - 2].ctl,
    tdata[tdata.length - 1].ctlLoad + k,
    1 / 42,
  );
  console.log(k, tdata[tdata.length - 1].atl);

  const diff = (load: number, mean: number, t: number, i: number) => {
    if (i == tdata.length - 1) {
      return load - mean + t;
    } else {
      return load - mean;
    }
  };
  const varianceL = tdata.map((t, i, a) =>
    Math.pow(diff(t.ctlLoad, t.ctl, k, i), 2),
  );
  const varianceS = tdata.map((t, i, a) =>
    Math.pow(diff(t.atlLoad, t.atl, k, i), 2),
  );
  const stdS = ewm(varianceS, 28).map((t) => Math.sqrt(t));
  const stdL = ewm(varianceL, 42).map((t) => Math.sqrt(t));

  const strainS = tdata.map((t, i) => t.atl * (t.atl / stdS[i]));
  const strainL = tdata.map((t, i) => t.ctl * (t.ctl / stdL[i]));

  return getLast(tdata.map((t, i) => strainS[i] / strainL[i]));
}

interface goal {
  goal: number;
  x: number;
  y: number;
}

function neededLoad(data: wellnessWrapper, c: number): Boundaries {
  const goals: goal[] = [
    { goal: 1, x: 0, y: 1000 },
    { goal: 1.2, x: 0, y: 1000 },
  ];
  if (c > Math.max(...goals.map((t) => t.goal))) {
    return { min: -1, max: -2 };
  }
  for (let i = 0; i < 100; i++) {
    const value = strainMonotonyEwmList(data.wellness, i);
    goals.forEach((g) => {
      let v = Math.abs(value - g.goal);
      if (g.y > v) {
        g.y = v;
        g.x = i;
      }
    });
  }
  return { min: goals[0].x, max: goals[1].x };
}

export class ACRS implements Attribute {
  wellness: wellness[];
  acrs: number[];
  acrsT: number[];
  last: number;
  needed: Boundaries;

  constructor(data: wellnessWrapper) {
    this.wellness = data.wellness;
    this.acrs = strainMonotonyEwm(data.wellness);
    this.acrsT = transformed(this.acrs, this);
    this.last = getLast(this.acrs);
    this.needed = neededLoad(data, this.last);
  }

  getTransformed(): number[] {
    return this.acrs;
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
        title={"Strain ACWR"}
        progress={this.last}
        zones={this.getZones()}
        transform={this.transform}
      />
    );
  }
}
