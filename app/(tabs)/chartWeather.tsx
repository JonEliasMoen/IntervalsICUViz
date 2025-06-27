// components/Chart.tsx
import { ScrollView } from "react-native";
import { Text } from "@/components/Themed";
import React from "react";
import LineChartComp from "@/components/components/_lineChartComp";
import { getWeather } from "@/components/utils/_weatherModel";
import { weatherWrapper } from "@/components/classes/WeatherFeature/weatherWrapper";

export default function ChartWeather() {
  const weather = getWeather(63.4394093, 10.5039971);
  if (!weather) {
    return <Text>Loading...</Text>;
  }
  const wRap = new weatherWrapper(weather, -1).setTimeseries(
    weather.properties.timeseries.slice(0, 55),
  );
  let x = wRap.getDates();
  return (
    <ScrollView>
      <LineChartComp
        lineData={{
          lines: [
            {
              y: wRap.temp.getTransformed(),
              x: x,
              isScaled: true,
              color: "red",
              label: "Temperature",
            },
            {
              y: wRap.getAttr("wind_speed"),
              x: x,
              color: "blue",
              label: "Wind",
            },
            {
              y: wRap.getAttr("cloud_area_fraction"),
              x: x,
              color: "orange",
              label: "Cloud Cover",
            },
          ],
          title: "Temperature",
          labels: x,
        }}
      ></LineChartComp>
    </ScrollView>
  );
}
