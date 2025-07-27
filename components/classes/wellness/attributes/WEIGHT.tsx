import { Attribute, transformed } from "@/components/classes/interfaces";
import React from "react";
import { zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { QUANTILE } from "@/components/classes/aggregations/QUANTILE";
import ChartComponentQuantile from "@/components/components/_chatCompQuantile";
import { mean } from "simple-statistics";

export class WEIGHT implements Attribute {
  weight: number[];
  x: Date[];
  weightT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.weight = data.getAttr("weight").filter((t) => t != 0);
    this.x = data
      .getAttrNon("weight")
      .filter((t) => t.weight != 0)
      .map((t) => new Date(t.id));
    this.quantile = new QUANTILE(this.weight, 4);
    this.weightT = transformed(this.weight, this);
    this.last = mean(this.weight.slice(this.weight.length - 2));
  }

  getTransformed(): number[] {
    return [];
  }

  getX(): Date[] {
    return this.x;
  }

  transform(n: number): number {
    return 0;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"Weight (kg)"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          t.toFixed(2) + "kg " + Math.round(q * 100) + "%"
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
