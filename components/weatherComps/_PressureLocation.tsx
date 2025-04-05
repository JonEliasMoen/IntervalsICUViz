import {
  cutArrayIfOverLimit,
  fetchToTxt,
  normalizeBasedOnRange,
  normalizeBasedOnRangeSingle,
  secondsFrom,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { fetchToJson } from "@/components/utils/_utils";
import { ChartComponent, zone } from "@/components/chatComp";
import { generateGradient } from "typescript-color-gradient";
import { useEffect, useState } from "react";
import { sunSinus } from "@/components/weatherComps/weatherFunc";
import { getWeather } from "@/components/utils/_weatherModel";
import { mean } from "simple-statistics";
export enum mode {
  Worst = "biggest",
  Min = "min",
  Max = "max",
  Avg = "average",
  Current = "current",
}

export function PressureLocation(props: {
  lat: number;
  long: number;
  mode: mode;
}) {
  const data = getWeather(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  let fdata = data.properties.timeseries.filter((t, i, a) => {
    if (i >= 1) {
      return secondsFrom(new Date(t.time), new Date(a[i - 1].time)) == 60 * 60;
    } else if (i == 0) {
      return true;
    }
  });
  let date = fdata.map((t, i, a) => new Date(t.time));
  let airPressure = fdata.map(
    (t) => t.data.instant.details.air_pressure_at_sea_level,
  );

  let start = 4;
  // @ts-ignore
  let deltaP: number[] = airPressure
    .map((t, i, a) => {
      if (i >= start) {
        console.log();
        return (t - a[i - start] + (t - a[i - 2])) * 0.5;
      }
    })
    .filter((t) => t != null);

  console.log(deltaP);
  console.log(date);
  let biggestV = 0;
  if (props.mode == mode.Worst) {
    biggestV =
      Math.abs(Math.min(...deltaP)) > Math.abs(Math.max(...deltaP))
        ? Math.min(...deltaP)
        : Math.max(...deltaP);
  } else if (props.mode == mode.Min) {
    biggestV = Math.min(...deltaP);
  } else if (props.mode == mode.Max) {
    biggestV = Math.max(...deltaP);
  } else if (props.mode == mode.Current) {
    biggestV = deltaP[0];
  } else if (props.mode == mode.Avg) {
    biggestV = mean(deltaP);
  }

  console.log(Math.min(...deltaP), Math.max(...deltaP));
  let biggestTimestamp =
    props.mode == mode.Avg
      ? null
      : date[deltaP.findIndex((t) => t == biggestV) + start].toString();

  return (
    <ChartComponent
      title={"Air pressure drop " + props.mode.toString()}
      subtitle={biggestTimestamp}
      progress={biggestV}
      zones={[
        {
          startVal: -20.0,
          endVal: -6.0,
          text: "Severe drop — extreme weather incoming 🌩️",
          color: "darkred",
        },
        {
          startVal: -6.0,
          endVal: -3.0,
          text: "Rapid drop — storm likely ⛈️",
          color: "red",
        },
        {
          startVal: -3.0,
          endVal: -1.5,
          text: "Moderate drop — worsening conditions 🌧️",
          color: "orange",
        },
        {
          startVal: -1.5,
          endVal: -0.5,
          text: "Slight trend down 🌦️",
          color: "lightgreen",
        },
        {
          startVal: -0.5,
          endVal: 0.5,
          text: "Stable pressure 🌤️",
          color: "green",
        },
        {
          startVal: 0.5,
          endVal: 1.5,
          text: "Slight trend up 🌥️",
          color: "lightblue",
        },
        {
          startVal: 1.5,
          endVal: 3.0,
          text: "Moderate rise — improving conditions 🌈",
          color: "skyblue",
        },
        {
          startVal: 3.0,
          endVal: 6.0,
          text: "Rapid rise — clearing weather 🌤️",
          color: "blue",
        },
        {
          startVal: 6.0,
          endVal: 20.0,
          text: "Strong rise — high pressure surge ☀️",
          color: "darkblue",
        },
      ]}
      transform={(u) => normalizeBasedOnRangeSingle(u, -20, 20)}
      indicatorTextTransform={(n) => n.toFixed(2) + " ΔHpa"}
    ></ChartComponent>
  );
}
