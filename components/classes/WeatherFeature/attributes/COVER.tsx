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

export class COVER implements Attribute {
  cover: number[];
  coverT: number[];
  range: number[];
  now: number;

  constructor(data: weatherWrapper) {
    this.cover = data.getAttr("cloud_area_fraction");
    this.coverT = transformed(this.cover, this);
    this.range = getRange(this.cover);
    this.now = this.coverT[0];
  }

  transform(n: number): number {
    return n / 100;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentRange
        title={"Cloud Area"}
        subtitle={"Now: " + (this.now * 100).toFixed(1) + "%"}
        progressFrom={this.range[0]}
        progressValue={this.cover[0]}
        progressTo={this.range[2]}
        zones={this.getZones()}
        transform={this.transform}
        indicatorTextTransform={(n) => n.toFixed(0) + "%"}
      ></ChartComponentRange>
    );
  }

  getTransformed(): number[] {
    return this.coverT;
  }

  getZones(): zone[] {
    const gradientArray = generateGradient(["#00d0ff", "#000000"], 5);
    const cloudText: string[] = [
      "Clear",
      "Few",
      "Scattered",
      "Broken",
      "Overcast",
    ];
    return [0, 1, 2, 4, 7].map((v, i, a) => {
      return {
        startVal: v * (1 / 8) * 100,
        endVal: i != 4 ? a[i + 1] * (1 / 8) * 100 : 100,
        text: cloudText[i],
        color: gradientArray[i],
      };
    });
  }
}
