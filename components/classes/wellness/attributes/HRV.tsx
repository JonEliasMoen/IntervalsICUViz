import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import { QUANTILE } from "@/components/classes/aggregations/QUANTILE";
import React from "react";
import ChartComponentQuantile from "@/components/components/_chatCompQuantile";
import { zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class HRV implements Attribute {
  hrv: number[];
  hrvT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.hrv = data.getAttr("hrv");
    this.quantile = new QUANTILE(this.hrv, 7 * 4);
    this.hrvT = transformed(this.hrv, this);
    this.last = getLast(this.hrv);
  }

  getTransformed(): number[] {
    return this.hrvT;
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"HRV (rMSSD)"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "ms " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "Very Low",
        startVal: 0,
        endVal: 0.1,
        color: "#D627284D",
      },
      {
        text: "Low",
        startVal: 0.1,
        endVal: 0.25,
        color: "#FFCB0E80",
      },
      {
        text: "Normal",
        startVal: 0.25,
        endVal: 0.75,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.75,
        endVal: 0.9,
        color: "#1F77B44D",
      },
      {
        text: "Very Elevated",
        startVal: 0.9,
        endVal: 1,
        color: "#1f77b4",
      },
    ];
  }
}
