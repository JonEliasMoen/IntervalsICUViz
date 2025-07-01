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

export class WIND implements Attribute {
  wind: number[];
  windT: number[];
  range: number[];
  now: number;
  type: string;

  constructor(data: weatherWrapper, gust: boolean) {
    this.wind = data.getAttr("wind_speed");
    this.type = "wind";
    if (gust) {
      this.type = "wind gale";
      this.wind = data
        .getAttr("wind_speed_of_gust")
        .filter((t) => t != undefined);
    }
    this.windT = transformed(this.wind, this);
    this.range = getRange(this.wind);
    this.now = this.wind[0];
  }

  transform(n: number): number {
    return n / 24;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentRange
        title={"Avg " + this.type}
        display={() => this.range[0] != -1}
        subtitle={"Now: " + this.now + "m/s"}
        progressFrom={this.range[0]}
        progressValue={this.now}
        progressTo={this.range[2]}
        zones={this.getZones()}
        transform={(v) => v / 24}
        indicatorTextTransform={(n) => (n ?? 0).toFixed(2) + "m/s"}
      ></ChartComponentRange>
    );
  }

  getTransformed(): number[] {
    return this.windT;
  }

  getZones(): zone[] {
    const windText: string[] = [
      "Calm",
      "Light Air",
      "Light Breeze",
      "Gentle breeze",
      "Moderate breeze",
      "Fresh Breeze",
      "Strong breeze",
      "High wind",
      "Gale",
    ];
    const colorsw = generateGradient(["#F5AF19", "#F12711"], 10);
    return [0, 0.3, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20].map((v, i, a) => {
      return {
        startVal: v,
        endVal: i != 9 ? a[i + 1] : v + 4,
        text: windText[i], // `${v}-${i != 9 ? a[i + 1] : v + 4} m/s `
        color: colorsw[i],
      };
    });
  }
}
