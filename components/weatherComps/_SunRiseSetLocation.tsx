import { ChartComponent, zone } from "@/components/components/_chatComp";
import {
  hourToString,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import React from "react";
import { generateGradient } from "typescript-color-gradient";
import { getSunData } from "@/components/utils/_weatherModel";
import { sunSinus } from "@/components/classes/WeatherFeature/weatherFunc";

function until(current: number, rise: number, set: number, noon: number) {
  if (current > set) {
    return "Sunrise " + secondsToHHMM(24 * 3600 - current + rise);
  }
  if (current < rise) {
    return "Sunrise " + secondsToHHMM(rise - current);
  }
  if (current < noon) {
    return "Noon " + secondsToHHMM(noon - current);
  }
  if (current < set) {
    return "Sunset " + secondsToHHMM(set - current);
  }
  return "0";
}

export function toPercent(v: number) {
  return Math.round(Math.abs(v) * 100) + "%";
}

export function toPercentNotAbs(v: number) {
  return Math.round(v * 100) + "%";
}

export function SunRiseSetLocation(props: {
  lat: number;
  long: number;
  now: Date;
}) {
  let { lat, long } = props;
  let sunData = getSunData(lat, long);
  if (!sunData) {
    return <></>;
  }

  let sunrise = sunData.properties.sunrise.time;
  let sunset = sunData.properties.sunset.time;
  let sunriseSec = secondsSinceStartOfDay(new Date(sunrise));
  let sunsetSec = secondsSinceStartOfDay(new Date(sunset));
  let noon = (sunriseSec + sunsetSec) * 0.5;

  let current = secondsSinceStartOfDay(props.now);
  let data = sunSinus(current, sunriseSec, sunsetSec);

  let zones: zone[] = [];
  let step: number = 10 * 60;
  let max: number = 24 * 3600;

  let colors = generateGradient(["#ee5d6c", "#ffdd00"], 100);
  for (let i = 0; i < max; i += step) {
    let v = sunSinus(i + step / 2, sunriseSec, sunsetSec); // Somehow scale this so that it actually is more darker on darker days.
    let t2 = Math.round(49 + v.current * 49);
    zones.push({
      text: "",
      startVal: i,
      endVal: i + step,
      color: colors[t2],
    });
  }

  return (
    <ChartComponent
      subtitle={
        secondsToHHMM(sunriseSec) +
        "/" +
        secondsToHHMM(noon) +
        "/" +
        secondsToHHMM(sunsetSec) +
        " low: -" +
        toPercent(data.low)
      }
      title={"Time until " + until(current, sunriseSec, sunsetSec, noon)}
      progress={current}
      zones={zones}
      indicatorTextTransform={(n) =>
        hourToString(n / 3600) + " " + toPercentNotAbs(data.current)
      }
      transform={(n) => n / 86400}
    ></ChartComponent>
  );
}
