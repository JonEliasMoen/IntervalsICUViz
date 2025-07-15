import {
  Attribute,
  getRange,
  transformed,
} from "@/components/classes/interfaces";
import React from "react";
import { zone } from "@/components/components/_chatComp";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";
import ChartComponentRange from "@/components/components/_chatCompRange";
import { feelTempArray } from "@/components/classes/WeatherFeature/weatherFunc";
import { normalizeBasedOnRangeSingle } from "@/components/utils/_utils";
import { generateGradient } from "typescript-color-gradient";

export class TEMP implements Attribute {
  temp: number[];
  tempT: number[];
  range: number[];
  now: number;

  constructor(data: weatherWrapper) {
    this.temp = feelTempArray(data.timeseries);
    this.tempT = transformed(this.temp, this);
    this.range = getRange(this.temp);
    this.now = this.temp[0];
  }

  transform(n: number): number {
    return normalizeBasedOnRangeSingle(n, -50, 50);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentRange
        title={"Average temp"}
        subtitle={"Now: " + this.temp[0].toFixed(2) + "°C"}
        progressFrom={this.range[0]}
        progressValue={this.now}
        progressTo={this.range[2]}
        zones={this.getZones()}
        transform={this.transform}
        indicatorTextTransform={(n) => n.toFixed(2) + "°C"}
      ></ChartComponentRange>
    );
  }

  getTransformed(): number[] {
    return this.tempT;
  }

  getZones(): zone[] {
    const colors = generateGradient(["#02c7fc", "#ff0404"], 10 * 2);
    const zones: zone[] = [
      -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30,
      35, 40, 45, 50,
    ].map((v, i) => {
      return {
        startVal: v,
        endVal: v + 5,
        text: `${v}-${v + 5}°C `,
        color: colors[i],
      };
    });
    return zones;
  }
}
