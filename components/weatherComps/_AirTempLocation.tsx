import { mean } from "simple-statistics";
import { getWeather } from "@/components/utils/_weatherModel";
import React from "react";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";

export function stats(values: number[] | undefined) {
  const data = values ?? [10, 20];
  return [Math.min(...data), mean(data), Math.max(...data)];
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
