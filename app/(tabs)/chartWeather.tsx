// components/Chart.tsx
import { ScrollView } from "react-native";
import { Text } from "@/components/Themed";
import React from "react";
import LineChartComp from "@/components/components/_lineChartComp";
import { getWeather } from "@/components/utils/_weatherModel";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";
import { useSettings } from "@/components/utils/_keyContext";

function getComponent(wRap: weatherWrapper, title: string): React.JSX.Element {
  let x = wRap.getDates();
  console.log(title, "rain", wRap.rain.getTransformed());
  return (
    <LineChartComp
      lineData={{
        lines: [
          {
            y: wRap.temp.getTransformed(),
            y2: wRap.temp.getValue(),
            x: x,
            isScaled: true,
            color: "red",
            label: "Temperature",
          },
          {
            y: wRap.wind.getTransformed(),
            y2: wRap.wind.getValue(),
            x: x,
            isScaled: true,
            color: "blue",
            label: "Wind",
          },
          {
            y: wRap.cover.getTransformed(),
            y2: wRap.cover.getValue(),
            isScaled: true,
            x: x,
            color: "orange",
            label: "Cloud Cover",
          },
          {
            y: wRap.rain.getTransformed(),
            y2: wRap.rain.getValue(),
            isScaled: true,
            x: x,
            color: "green",
            label: "Rain",
          },
          {
            y: wRap.uv.getTransformed(),
            y2: wRap.uv.getValue(),
            isScaled: true,
            x: x,
            color: "pink",
            label: "UV",
          },
        ],
        title: title,
        labels: x,
      }}
    ></LineChartComp>
  );
}

function getComponentScore(wRap: weatherWrapper, title: string): React.JSX.Element {
  let x = wRap.getDates();
  return (
    <LineChartComp
      lineData={{
        lines: [
          {
            y: wRap.score.getTransformed(),
            y2: wRap.score.getValue(),
            isScaled: true,
            x: x,
            color: "red",
            label: "Score",
          },
        ],
        title: title,
        labels: x,
      }}
    ></LineChartComp>
  );
}


export default function ChartWeather() {
  const { settings } = useSettings();
  const weather = getWeather(
    settings.lat ?? 63.4394093,
    settings.long ?? 10.5039971,
  );
  if (!weather) {
    return <Text>Loading...</Text>;
  }
  const wRap = new weatherWrapper(weather, -1).setTimeseries(
    weather.properties.timeseries.slice(0, 55),
  );
  const wRapFull = new weatherWrapper(weather, -1);
  return (
    <ScrollView>
      {getComponent(wRap, "Forecast short")}
      {getComponent(wRapFull, "Forecast long")}
      {getComponentScore(wRapFull, "Weather score")}
    </ScrollView>
  );
}