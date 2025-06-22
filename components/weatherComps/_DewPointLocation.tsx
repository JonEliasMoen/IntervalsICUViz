import { generateGradient } from "typescript-color-gradient";
import { getWeather } from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/classes/WeatherFeature/weatherFunc";
import { mean } from "simple-statistics";
import React from "react";
import ChartComponentRange from "@/components/components/_chatCompRange";
import { zone } from "@/components/components/_chatComp";

export function DewPointLocation(props: {
  lat: number;
  long: number;
  dayOffset: number;
}) {
  const data = getWeather(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const dayMap = groupByDay(data.properties.timeseries);
  const today = dayMap[props.dayOffset];
  const dewpoints = today.map(
    (t) => t.data.instant.details.dew_point_temperature,
  );
  const max = Math.max(...dewpoints);
  const min = Math.min(...dewpoints);
  const value = mean(dewpoints);

  const colors = generateGradient(["#02c7fc", "#ff0404"], 6);

  const zText = [
    "Very Dry",
    "Dry",
    "Comfortable",
    "Somewhat muggy",
    "Muggy",
    "Oppressive",
  ];
  const zones: zone[] = [0, 5, 10, 15, 20, 25].map((v, i) => {
    return {
      startVal: v,
      endVal: v + 5,
      text: zText[i],
      color: colors[i],
    };
  });

  return (
    <ChartComponentRange
      title={"Dew point"}
      subtitle={"Now: " + dewpoints[0].toFixed(2) + "°C"}
      progressFrom={min}
      progressValue={value}
      progressTo={max}
      zones={zones}
      transform={(n) => n / 30}
      indicatorTextTransform={(n) => n.toFixed(2) + "°C"}
    ></ChartComponentRange>
  );
}
