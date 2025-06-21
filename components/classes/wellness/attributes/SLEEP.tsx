import {
  Attribute,
  getLast,
  transformed,
} from "@/components/classes/interfaces";
import React from "react";
import { hourToString } from "@/components/utils/_utils";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

export class SLEEP implements Attribute {
  sleep: number[];
  sleepT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.sleep = data.getAttr("sleepSecs").map((t) => t / 3600);
    this.sleepT = transformed(this.sleep, this);
    this.last = getLast(this.sleep);
  }

  getTransformed(): number[] {
    return this.sleepT;
  }

  transform(n: number): number {
    return (n - 4) / 6;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Sleep"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last != null ? this.last : 5}
        indicatorTextTransform={hourToString}
        zones={this.getZones()}
        transform={this.transform}
      ></ChartComponent>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "4-5 Hours",
        startVal: 4,
        endVal: 5,
        color: "#DD04A74D",
      },
      {
        text: "5-6 Hours",
        startVal: 5,
        endVal: 6,
        color: "#FFCB0E80",
      },
      {
        text: "6-7 Hours",
        startVal: 6,
        endVal: 7,
        color: "#C8F509A8",
      },
      {
        text: "7-8 Hours",
        startVal: 7,
        endVal: 8,
        color: "#009E0057",
      },
      {
        text: "8-9 Hours",
        startVal: 8,
        endVal: 9,
        color: "#009E0099",
      },
      {
        text: "9-10 Hours",
        startVal: 9,
        endVal: 10,
        color: "#1D00CCFF",
      },
    ];
  }
}
