import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import React from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class ACR implements Attribute {
  atl: number[];
  ctl: number[];
  acwr: number[];
  acwrT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.atl = data.getAttr("atl");
    this.ctl = data.getAttr("ctl");
    this.acwr = this.getAcwr();
    this.acwrT = transformed(this.acwr, this);
    this.last = getLast(this.acwr);
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
