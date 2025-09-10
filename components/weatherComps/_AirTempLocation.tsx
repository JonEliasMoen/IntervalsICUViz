import { mean } from "simple-statistics";
import { feelTempArray } from "@/components/classes/WeatherFeature/weatherFunc";
import { getWeather, TimeSeriesEntry } from "@/components/utils/_weatherModel";
import React from "react";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";
import { normalizeBasedOnRange, secondsFrom } from "@/components/utils/_utils";

export function stats(values: number[] | undefined) {
  const data = values ?? [10, 20];
  return [Math.min(...data), mean(data), Math.max(...data)];
}

function transform(dtoday: TimeSeriesEntry[]): number[] {
  let x = dtoday.map((t) =>
    secondsFrom(new Date(t.time), new Date(dtoday[0].time)),
  );
  let end = x[x.length - 1];
  x = x.map((t) => t / end);
  return x;
}

function getFeltTempArrayMapped(data: TimeSeriesEntry[]) {
  const feltTemp: number[] = feelTempArray(data);
  const forecast = transform(data);
  const sfeltTemp = normalizeBasedOnRange(feltTemp, -25, 25).map((t) =>
    Math.round(t * 1000),
  );

  return [feltTemp, sfeltTemp, forecast];
}

export function AirTempLocation(props: {
  lat: number;
  long: number;
  dayOffset: number;
}) {
  const data = getWeather(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const wRap = new weatherWrapper(data, props.dayOffset);
  return (
    <>
      {wRap.cover.getComponent()}
      {wRap.uv.getComponent()}
      {wRap.temp.getComponent()}
      {wRap.rain.getComponent()}
      {wRap.wind.getComponent()}
      {wRap.windgust.getComponent()}
    </>
  );
}
