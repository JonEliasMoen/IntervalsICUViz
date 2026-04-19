import { Attribute, getLast, getRange } from "@/components/classes/interfaces";
import React from "react";
import ChartComponent from "@/components/components/_chatComp";
import { weatherWrapper } from "../weatherWrapper";

export class WEATHERSCORE implements Attribute {
  value: number[];
  last: number;

  constructor(wr: weatherWrapper, data: Attribute[], max: number[]) {
    this.value = wr.getComposite(data, max);
    this.last = getRange(this.value)[1];
  }
  getValue() {
    return this.value;
  }

  transform(n: number) {
    return n;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Weather Score"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last}
        indicatorTextTransform={(n) => Math.round(n * 100) + "%"}
        transform={this.transform}
        zones={this.getZones()}
      ></ChartComponent>
    );
  }

  getZones() {
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

  getTransformed(): number[] {
    return this.value;
  }
}
