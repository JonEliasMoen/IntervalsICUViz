import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import React from "react";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class FORMPER implements Attribute {
  atl: number[];
  ctl: number[];
  formp: number[];
  formpT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.atl = data.getAttr("atl");
    this.ctl = data.getAttr("ctl");
    this.formp = this.getForm();
    this.formpT = transformed(this.formp, this);
    this.last = getLast(this.formp);
  }

  getTransformed(): number[] {
    return this.formpT;
  }

  getForm(): number[] {
    return this.ctl.map((t, i) => Math.round(((t - this.atl[i]) * 100) / t));
  }

  transform(n: number): number {
    return (n + 30) / 90;
  }

  getZones(): zone[] {
    return [
      {
        text: "Transition",
        startVal: -30,
        endVal: -20,
        color: "#FFCB0E80",
      },
      {
        text: "Fresh",
        startVal: -20,
        endVal: -5,
        color: "#1F77B44D",
      },
      {
        text: "Gray zone",
        startVal: -5,
        endVal: 10,
        color: "rgba(196,196,196,0.66)",
      },
      {
        text: "Optimal",
        startVal: 10,
        endVal: 30,
        color: "#009E0066",
      },
      {
        text: "High Risk",
        startVal: 30,
        endVal: 60,
        color: "#D627284D",
      },
    ];
  }

  getComponent() {
    return (
      <ChartComponent
        title={"Form %"}
        progress={-this.last}
        zones={this.getZones()}
        transform={this.transform}
        indicatorTextTransform={(n) => -n.toPrecision(3).toString() + "%"}
      />
    );
  }
}
