import { Button, ScrollView, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import ChartComponent, { fetchToJson } from "@/components/chatComp";
import { useQuery } from "@tanstack/react-query";
import { hourToString } from "@/app/(tabs)/index";

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

export function getSunData() {
  const { data: data } = useQuery(["sun", new Date().toString()], () =>
    fetchToJson<WeatherData>(
      "https://api.met.no/weatherapi/sunrise/3.0/sun?lat=59.933333&lon=10.716667&date=2024-10-12&offset=+02:00",
      {
        method: "GET",
      },
    ),
  );
  return data;
}
function secondsSinceStartOfDay(date: Date): number {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  // @ts-ignore
  return (date - startOfDay) / 1000;
}

export default function WeatherScreen() {
  let sunrise = getSunData()?.properties.sunrise.time;
  let sunset = getSunData()?.properties.sunset.time;
  let sunriseSec = secondsSinceStartOfDay(
    new Date(sunrise != null ? sunrise : ""),
  );
  let sunsetSec = secondsSinceStartOfDay(
    new Date(sunset != null ? sunset : ""),
  );
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <ChartComponent
        progress={secondsSinceStartOfDay(new Date())}
        zones={[
          {
            text: "Sunset",
            startVal: 0,
            endVal: sunriseSec,
            color: "rgba(255, 57, 57, 0.5)",
          },
          {
            text: "Daylight",
            startVal: sunriseSec,
            endVal: sunsetSec,
            color: "rgba(255, 196, 0, 0.5)",
          },
          {
            text: "Sunset",
            startVal: sunsetSec,
            endVal: 86400,
            color: "rgba(255, 72, 72, 0.5)",
          },
        ]}
        indicatorTextTransform={(n) => hourToString(n / 3600)}
        transform={(n) => n / 86400}
      ></ChartComponent>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // To ensure scrolling area has enough space at the bottom
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  redSection: {
    backgroundColor: "#FF4C4C",
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
