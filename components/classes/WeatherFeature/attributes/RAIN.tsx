import {
  Attribute,
  getRange,
  transformed,
} from "@/components/classes/interfaces";
import React from "react";
import { zone } from "@/components/components/_chatComp";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";
import ChartComponentRange from "@/components/components/_chatCompRange";
import { generateGradient } from "typescript-color-gradient";

export class RAIN implements Attribute {
  rain: number[];
  rainMax: number[];
  rainMin: number[];
  rainP: number;
  thunderP: number;
  rainT: number[];
  range: number[];
  now: number;

  constructor(data: weatherWrapper) {
    this.rain = data.getRainAttr("precipitation_amount");
    this.rainMax = getRange(data.getRainAttr("precipitation_amount_max"));
    this.rainMin = getRange(data.getRainAttr("precipitation_amount_min"));
    this.rainP = this.probTrans(
      data.getRainAttr("probability_of_precipitation"),
    );
    this.thunderP = this.probTrans(data.getRainAttr("probability_of_thunder"));

    this.rainT = transformed(this.rain, this);
    this.range = getRange(this.rain);
    this.now = this.rain[0];
  }

  probTrans(values: number[]) {
    return (
      1 - values.map((t) => 1 - t / 100).reduce((sum, value) => sum * value, 1)
    );
  }

  transform(n: number): number {
    return n / 30;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentRange
        title={"Rain"}
        subtitle={
          "RainProb: " +
          (this.rainP * 100).toFixed(0) +
          "% ThunderProb: " +
          (this.thunderP * 100).toFixed(0) +
          "%"
        }
        display={() => this.rainMax[1] != 0}
        progressFrom={this.rainMin[1]}
        progressValue={this.rain[0]}
        progressTo={this.rainMax[1]}
        zones={this.getZones()}
        transform={this.transform}
        indicatorTextTransform={(n) => (n ?? 0).toFixed(2) + "mm/h"}
      ></ChartComponentRange>
    );
  }

  getTransformed(): number[] {
    return this.rainT;
  }

  getZones(): zone[] {
    const rainText = [
      "",
      "Weak rain",
      "Moderate rain",
      "Heavy rain",
      "Very heavy rain",
      "Shower",
    ];
    const colorsw = generateGradient(["#F5AF19", "#F12711"], 10);
    return [0, 0.5, 2, 6, 10, 18, 30].map((v, i, a) => {
      return {
        startVal: v,
        endVal: i != 9 ? a[i + 1] : v + 4,
        text: rainText[i],
        color: colorsw[i],
      };
    });
  }
}
