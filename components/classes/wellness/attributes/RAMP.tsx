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

export class RAMP implements Attribute {
  ramp: number[];
  rampT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.ramp = data.getAttr("rampRate");
    this.quantile = new QUANTILE(this.ramp, 7 * 4);
    this.rampT = transformed(this.ramp, this);
    this.last = getLast(this.ramp);
  }

  getTransformed(): number[] {
    return this.rampT;
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"Ramprate"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          t.toFixed(2) + " " + Math.round(q * 100) + "%"
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
