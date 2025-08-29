import { Attribute, ewm, getLast } from "@/components/classes/interfaces";
import React from "react";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class HRVRATIO implements Attribute {
  hrv: number[];
  hrvT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.hrv = data.getAttr("hrv");
    let short = ewm(this.hrv, 7);
    let long = ewm(this.hrv, 42);
    this.hrvT = long.map((t, i) => short[i] / t);
    this.last = getLast(this.hrvT);
  }

  getTransformed(): number[] {
    return this.hrvT;
  }

  transform(n: number): number {
    return n / 2;
  }

  getComponent() {
    return (
      <ChartComponent
        title={"hrv acute chronic acwr"}
        progress={this.last}
        zones={this.getZones()}
        transform={this.transform}
      />
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "Low",
        startVal: 0,
        endVal: 0.8,
        color: "#1F77B44D", // soft blue
      },
      {
        text: "Optimal",
        startVal: 0.8,
        endVal: 1.3,
        color: "#009E0066", // green
      },
      {
        text: "High",
        startVal: 1.3,
        endVal: 1.5,
        color: "#FFCB0E80", // amber/yellow
      },
      {
        text: "Very high",
        startVal: 1.5,
        endVal: 2,
        color: "#D627284D", // red
      },
    ];
  }
}
