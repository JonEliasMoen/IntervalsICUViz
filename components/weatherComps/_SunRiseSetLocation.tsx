import { ChartComponent, zone } from "@/components/chatComp";
import {
  hourToString,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import React, { useEffect, useState } from "react";
import { generateGradient } from "typescript-color-gradient";
import { getSunData } from "@/components/utils/_weatherModel";
import { sunSinus } from "@/components/weatherComps/weatherFunc";

function until(current: number, rise: number, set: number, noon: number) {
  if (current > set) {
    return "Sunrise " + secondsToHHMM(24 * 3600 - current + rise);
  }
  if (current < noon) {
    return "Noon " + secondsToHHMM(noon - current);
  }
  if (current < set) {
    return "Sunset " + secondsToHHMM(set - current);
  }
  if (current < rise) {
    return "Sunrise" + secondsToHHMM(rise - current);
  }
  return "0";
}

export function toPercent(v: number) {
  return Math.round(Math.abs(v) * 100) + "%";
}

export function SunRiseSetLocation(props: { lat: number; long: number }) {
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

  const [now, setCurrentTime] = useState(new Date());
  let current = secondsSinceStartOfDay(now);
  let data = sunSinus(current, sunriseSec, sunsetSec);
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      updateCurrentTime();
      const interval = setInterval(updateCurrentTime, 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, [now]);

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
        hourToString(n / 3600) + " " + toPercent(data.current)
      }
      transform={(n) => n / 86400}
    ></ChartComponent>
  );
}
