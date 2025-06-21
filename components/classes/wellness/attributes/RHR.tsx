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

export class RHR implements Attribute {
  rhr: number[];
  rhrT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.rhr = data.getAttr("restingHR");
    this.quantile = new QUANTILE(this.rhr, 7 * 4);
    this.rhrT = transformed(this.rhr, this);
    this.last = getLast(this.rhr);
  }

  getTransformed(): number[] {
    return this.rhrT.map((t) => 1 - t);
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"Resting hr"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "bpm " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
    );
  }

  getZones(): zone[] {
    return [
      { text: "Low", startVal: 0, endVal: 0.3, color: "#1F77B44D" },
      {
        text: "Normal",
        startVal: 0.3,
        endVal: 0.7,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.7,
        endVal: 1,
        color: "#D627284D",
      },
    ];
  }
}
