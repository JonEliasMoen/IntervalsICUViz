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

export class ACRS implements Attribute {
  wellness: wellness[];
  acrs: number[];
  acrsT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.wellness = data.wellness;
    this.acrs = strainMonotonyEwm(data.wellness);
    this.acrsT = transformed(this.acrs, this);
    this.last = getLast(this.acrs);
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
