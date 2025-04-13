import {
  normalizeBasedOnRangeSingle,
  secondsFrom,
} from "@/components/utils/_utils";

import { ChartComponent, zone } from "@/components/components/_chatComp";

import { getWeather } from "@/components/utils/_weatherModel";
import { mean } from "simple-statistics";
import { ChartComponentRange } from "@/components/components/_chatCompRange";
export function PressureLocation(props: { lat: number; long: number }) {
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
        return (t - a[i - start] + (t - a[i - 2])) * 0.5;
      }
    })
    .filter((t) => t != null);

  let dIndex = deltaP.findIndex((t) => t == Math.min(...deltaP)) + start;
  let decreaseText = "Decrease: " + date[dIndex].toString().slice(0, 21);
  let inIndex = deltaP.findIndex((t) => t == Math.max(...deltaP)) + start;
  let increaseText = "Increase: " + date[inIndex].toString().slice(0, 21);
  let text =
    inIndex < dIndex
      ? [increaseText, decreaseText]
      : [decreaseText, increaseText];

  return (
    <ChartComponentRange
      title={"Air pressure"}
      subtitle={text.join("\n")}
      progressFrom={Math.min(...deltaP)}
      progressTo={Math.max(...deltaP)}
      progressValue={deltaP[0]}
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
    ></ChartComponentRange>
  );
}
