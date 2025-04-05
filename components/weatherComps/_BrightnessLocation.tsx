import { generateGradient } from "typescript-color-gradient";
import { ChartComponent, zone } from "@/components/chatComp";
import { getTide } from "@/components/weatherComps/_TideLocation";
import { getWeather } from "@/components/utils/_weatherModel";
import { groupByDay, sunSinus } from "@/components/weatherComps/weatherFunc";
import { mean } from "simple-statistics";
import {
  hourToString,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import { useEffect, useState } from "react";
import { toPercent } from "@/components/weatherComps/_SunRiseSetLocation";

export function BrightnessLocation(props: { lat: number; long: number }) {
  const data = getWeather(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const gradientArray = generateGradient(["#00d0ff", "#002d37"], 101);
  const dayMap = groupByDay(data.properties.timeseries);
  const today = dayMap[0];
  const length = today.length;
  const zones = today.map((t, i) => {
    const v = Math.round(t.data.instant.details.cloud_area_fraction);
    return {
      startVal: i * (1 / length),
      endVal: (i + 1) * (1 / length),
      text: "",
      color: gradientArray[v],
    };
  });
  const avg = mean(
    today.map((t) => {
      return t.data.instant.details.cloud_area_fraction;
    }),
  );
  let now = today.find(
    (t) => new Date(t.time).getHours() == new Date().getHours(),
  )?.data.instant.details.cloud_area_fraction;

  return (
    <ChartComponent
      title={"Cloud Cover today"}
      subtitle={
        "Average: " + avg.toFixed(0) + "% Now: " + now?.toFixed(0) + "%"
      }
      progress={0}
      zones={zones}
      transform={(u) => u}
      indicatorTextTransform={(n) => ""}
    ></ChartComponent>
  );
}
