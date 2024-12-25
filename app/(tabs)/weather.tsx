import { ScrollView, StyleSheet } from "react-native";
import ChartComponent from "@/components/chatComp";
import {
  corsify,
  fetchToJson,
  secondsSinceStartOfDay,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { hourToString, isoDateOffset } from "@/components/utils/_utils";
import { SnowDepthLocation } from "@/components/weatherComps/_SnowDepthLocation";
import { SeaWaterTempLocation } from "@/components/weatherComps/_SeaWaterTempLocation";
import { AirTempLocation } from "@/components/weatherComps/_AirTempLocation";
import { TideLocation } from "@/components/weatherComps/_TideLocation";

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

export function getSunData(lat: number, long: number) {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["sun", date], () =>
    fetchToJson<WeatherData>(
      corsify(
        `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${lat}&lon=${long}&date=${date}&offset=+02:00`,
      ),
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla",
        },
      },
    ),
  );
  return data;
}

interface SnowResp {
  Data: number[];

  [key: string]: any;
}

export function getSnowDepth(x: String, y: String) {
  const date = isoDateOffset(0);
  const url = corsify(
    `https://gts.nve.no/api/GridTimeSeries/${x}/${y}/${date}/${date}/sd.json`,
  );
  const { data: data } = useQuery(["snow", date], () =>
    fetchToJson<SnowResp>(url, {
      method: "GET",
    }),
  );
  return data;
}

export default function WeatherScreen() {
  let lat = 63.446827;
  let long = 10.421906;
  let sunrise = getSunData(lat, long)?.properties.sunrise.time;
  let sunset = getSunData(lat, long)?.properties.sunset.time;
  let sunriseSec = secondsSinceStartOfDay(new Date(sunrise ?? "09:00"));
  let sunsetSec = secondsSinceStartOfDay(new Date(sunset ?? "20:00"));
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
      <TideLocation lat={lat} long={long}></TideLocation>
      <SnowDepthLocation
        name={"Vassfjellet"}
        x={"268636"}
        y={"7023562"}
      ></SnowDepthLocation>
      <SnowDepthLocation
        name={"Lohove"}
        x={"572843"}
        y={"7031468"}
      ></SnowDepthLocation>
      <SnowDepthLocation
        name={"Skistua"}
        x={"562932"}
        y={"7032696"}
      ></SnowDepthLocation>
      <SeaWaterTempLocation lat={lat} long={long}></SeaWaterTempLocation>
      <AirTempLocation lat={lat} long={long}></AirTempLocation>
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
