import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import React from "react";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class SLEEPSCORE implements Attribute {
  sleepScore: number[];
  sleepScoreT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.sleepScore = data.getAttr("sleepScore");
    this.sleepScoreT = transformed(this.sleepScore, this);
    this.last = getLast(this.sleepScore);
  }

  getTransformed(): number[] {
    return this.sleepScoreT;
  }

  transform(n: number): number {
    return (n - 40) / (100 - 40);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Sleep Score"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last != null ? Math.round(this.last) : 0}
        indicatorTextTransform={(n) => Math.round(n) + "%"}
        transform={this.transform}
        zones={this.getZones()}
      ></ChartComponent>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "Very Poor",
        startVal: 40,
        endVal: 59,
        color: "#D627284D",
      },
      {
        text: "Poor",
        startVal: 60,
        endVal: 69,
        color: "#FFCB0E80",
      },
      {
        text: "Fair",
        startVal: 70,
        endVal: 79,
        color: "#C8F509A8",
      },
      {
        text: "Good",
        startVal: 80,
        endVal: 89,
        color: "#009E0057",
      },
      {
        text: "Excellent",
        startVal: 90,
        endVal: 100,
        color: "#009E0099",
      },
    ];
  }
}
