import {
  Attribute,
  getRange,
  transformed,
} from "@/components/classes/interfaces";
import React from "react";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";

export class UV implements Attribute {
  uv: number[];
  uvT: number[];
  range: number[];
  now: number;

  constructor(data: weatherWrapper) {
    this.uv = data
      .getAttr("ultraviolet_index_clear_sky")
      .filter((t) => t !== undefined);
    this.uvT = transformed(this.uv, this);
    this.range = getRange(this.uv);
    this.now = this.uv[0];
  }

  transform(n: number): number {
    return n / 14;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"UV Index"}
        display={() => this.range[0] != -1}
        subtitle={"Now: " + this.now}
        progress={this.range[2]}
        zones={this.getZones()}
        transform={this.transform}
      />
    );
  }

  getTransformed(): number[] {
    return this.uvT;
  }

  getZones(): zone[] {
    return [
      {
        startVal: 0,
        endVal: 3,
        text: "Low",
        color: "#9cc600",
      },
      {
        startVal: 3,
        endVal: 6,
        text: "Moderate",
        color: "#ffbc01",
      },
      {
        startVal: 6,
        endVal: 8,
        text: "High",
        color: "#ff9000",
      },
      {
        startVal: 8,
        endVal: 11,
        text: "Very High",
        color: "#f45023",
      },
      {
        startVal: 11,
        endVal: 14,
        text: "Extreme",
        color: "#9e47cc",
      },
    ];
  }
}
