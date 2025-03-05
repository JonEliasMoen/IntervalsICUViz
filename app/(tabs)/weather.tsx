import { ScrollView, StyleSheet, View } from "react-native";
import ChartComponent from "@/components/chatComp";
import {
  fetchToJson,
  hourToString,
  isoDateOffset,
  secondsSinceStartOfDay,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { SnowDepthLocation } from "@/components/weatherComps/_SnowDepthLocation";
import { SeaWaterTempLocation } from "@/components/weatherComps/_SeaWaterTempLocation";
import { AirTempLocation } from "@/components/weatherComps/_AirTempLocation";
import { TideLocation } from "@/components/weatherComps/_TideLocation";
import DropDownPicker from "react-native-dropdown-picker";
import React, { useEffect, useState } from "react";
import { queryClient } from "expo-dev-launcher/bundle/providers/QueryProvider";
import { location } from "@/components/utils/_commonModel";

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
export default function WeatherScreen() {
  const [value, setValue] = useState<number | null>(null); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility

  let locationMap: location[] = [
    {
      lat: 63.446827,
      long: 10.421906,
      snowPlace: [
        {
          name: "Vassfjellet",
          x: "268636",
          y: "7023562",
          lat: 63.27133,
          long: 10.39099,
        },
        {
          name: "Lohove",
          x: "273275",
          y: "7038654",
          lat: 63.38893,
          long: 10.48501,
        },
        {
          name: "Skistua",
          x: "263575",
          y: "7040863",
          lat: 63.41203,
          long: 10.27318,
        },
        {
          name: "Selbuskogen",
          x: "304490",
          y: "7029240",
          lat: 63.33753,
          long: 11.09409,
        },
      ],
    },
    {
      lat: 59.9139,
      long: 10.7522,
      snowPlace: [
        {
          name: "Holmenkollen",
          x: "258200",
          y: "6655184",
          lat: 59.962772,
          long: 10.667744,
        },
        {
          name: "Tryvann",
          x: "258331",
          y: "6657982",
          lat: 59.9879,
          long: 10.6668,
        },
        {
          name: "Mjøndalsskauen",
          x: "268636",
          y: "7023562",
          lat: 59.67383,
          long: 10.066,
        },
        {
          name: "Finnemarka",
          x: "227057",
          y: "6652831",
          lat: 59.92226,
          long: 10.11511,
        },
      ],
    },
  ];
  const [loc, setLocation] = useState(locationMap[0]);

  useEffect(() => {
    if (value !== null) {
      setLocation(locationMap[value]);
    }
  }, [value]);

  const items = [
    { label: "Trondheim", value: 0 },
    { label: "Oslo", value: 1 },
  ];

  let sunrise = getSunData(loc.lat, loc.long)?.properties.sunrise.time;
  let sunset = getSunData(loc.lat, loc.long)?.properties.sunset.time;
  let sunriseSec = secondsSinceStartOfDay(new Date(sunrise ?? "09:00"));
  let sunsetSec = secondsSinceStartOfDay(new Date(sunset ?? "20:00"));
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={[styles.dcontainer]}>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          placeholder="Select Location"
          dropDownContainerStyle={{
            zIndex: 1000,
            elevation: 1000,
            backgroundColor: "white",
          }}
        />
      </View>
      <ChartComponent
        title={"Sunrise & Sunset"}
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
      <AirTempLocation lat={loc.lat} long={loc.long}></AirTempLocation>
      <TideLocation lat={loc.lat} long={loc.long}></TideLocation>

      {loc.snowPlace?.map((t) => {
        return <SnowDepthLocation loc={t}></SnowDepthLocation>;
      })}
      <SeaWaterTempLocation
        lat={loc.lat}
        long={loc.long}
      ></SeaWaterTempLocation>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // To ensure scrolling area has enough space at the bottom
    backgroundColor: "white",
  },
  dcontainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // Prioritize dropdown over other content
    alignSelf: "center", // Ensures centering
    width: "25%",
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
