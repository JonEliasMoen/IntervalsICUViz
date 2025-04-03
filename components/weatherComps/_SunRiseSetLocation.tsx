import { ChartComponent, zone } from "@/components/chatComp";
import {
  fetchToJson,
  hourToString,
  isoDateOffset,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateGradient } from "typescript-color-gradient";

interface WeatherData {
  copyright: string;
  licenseURL: string;
  type: string;
  geometry: Geometry;
  when: When;
  properties: Properties;
}

interface Geometry {
  type: string; // e.g., "Point"
  coordinates: [number, number]; // [longitude, latitude]
}

interface When {
  interval: string[]; // e.g., ["2024-10-11T23:03:00Z", "2024-10-12T23:17:00Z"]
}

interface Properties {
  body: string; // e.g., "Sun"
  sunrise: SolarEvent;
  sunset: SolarEvent;
  solarnoon: SolarNoon;
  solarmidnight: SolarMidnight;
}

interface SolarEvent {
  time: string; // e.g., "2024-10-12T06:49+01:00"
  azimuth: number; // e.g., 103.8
}

interface SolarNoon {
  time: string; // e.g., "2024-10-12T12:03+01:00"
  disc_centre_elevation: number; // e.g., 22.42
  visible: boolean; // e.g., true
}

interface SolarMidnight {
  time: string; // e.g., "2024-10-12T00:03+01:00"
  disc_centre_elevation: number; // e.g., -37.59
  visible: boolean; // e.g., false
}

interface result {
  current: number;
  low: number;
  daylength: number;
  nightlength: number;
  difference: number;
}

function sunSinus(t: number, sunrise: number, sunset: number): result {
  let daylength = sunset - sunrise;
  let daySeconds = 3600 * 24;
  let nightLength = daySeconds - sunset + sunrise;
  let difference = -(nightLength / daylength); // ylow. value at lowest
  console.log(difference);
  let xZero = (1 + difference) * 0.5; // middle of high and low
  let amp = 1 - xZero; // Difference between high and zero
  let radians = 1 - (2 * Math.PI * t) / daySeconds + amp; // i dont bother..
  return {
    current: -amp * Math.sin(radians) + xZero,
    low: difference,
    nightlength: nightLength,
    daylength: nightLength,
    difference: difference,
  };
}
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
export function getSunData(lat: number, long: number) {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["sun", date, lat, long], () =>
    fetchToJson<WeatherData>(
      `https://yrweatherbackend.vercel.app/sunrise/3.0/sun?lat=${lat}&lon=${long}&date=${date}&offset=+02:00`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}
export function toPercent(v: number) {
  return Math.round(Math.abs(v) * 100) + "%";
}

export function SunRiseSetLocation(props: { lat: number; long: number }) {
  let { lat, long } = props;
  let sunrise = getSunData(lat, long)?.properties.sunrise.time;
  let sunset = getSunData(lat, long)?.properties.sunset.time;
  let sunriseSec = secondsSinceStartOfDay(new Date(sunrise ?? "09:00"));
  let sunsetSec = secondsSinceStartOfDay(new Date(sunset ?? "20:00"));
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
