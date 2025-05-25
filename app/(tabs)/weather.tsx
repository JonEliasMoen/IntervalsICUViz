import { Button, ScrollView, StyleSheet } from "react-native";
import { SnowDepthLocation } from "@/components/weatherComps/_SnowDepthLocation";
import { HayfeverLocation } from "@/components/weatherComps/_HayfeverLocation";
import { SeaWaterTempLocation } from "@/components/weatherComps/_SeaWaterTempLocation";
import { AirTempLocation } from "@/components/weatherComps/_AirTempLocation";
import { TideLocation } from "@/components/weatherComps/_TideLocation";
import React, { useEffect, useState } from "react";
import { SunRiseSetLocation } from "@/components/weatherComps/_SunRiseSetLocation";
import { location } from "@/components/utils/_weatherModel";
import { BrightnessLocation } from "@/components/weatherComps/_BrightnessLocation";
import { PressureLocation } from "@/components/weatherComps/_PressureLocation";
import DropDown from "@/components/components/_dropDown";
import { Text } from "@/components/Themed";
import { dateOffset } from "@/components/utils/_utils";
import { KayakLocation } from "@/components/weatherComps/_Kayak";

export default function WeatherScreen() {
  const [value, setValue] = useState<number>(0); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility
  let locationMap: location[] = [
    {
      label: "Grillstad",
      value: 0,
      lat: 63.4394093,
      long: 10.5039971,
      snowPlace: [],
    },
    {
      label: "Trondheim",
      value: 1,
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
      label: "Oslo",
      value: 2,
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

  const [now, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(new Date());
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      updateCurrentTime();
      const interval = setInterval(updateCurrentTime, 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, [now]);
  const [offset, setOffset] = useState<number>(0);
  const barrier = (n: number) => {
    setOffset(Math.min(Math.max(n, 0), 4));
  };
  const inc = () => {
    barrier(offset + 1);
  };
  const dec = () => {
    barrier(offset - 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <Button title={"-->"} onPress={inc} />
      <Button title={"<--"} onPress={dec} />
      <Text style={[styles.title]}>
        {dateOffset(-offset).toString().slice(0, 15)}
      </Text>
      <DropDown
        items={locationMap}
        setItem={setLocation}
        text={"Select a location"}
      ></DropDown>
      <PressureLocation lat={loc.lat} long={loc.long}></PressureLocation>
      <SunRiseSetLocation
        lat={loc.lat}
        long={loc.long}
        now={now}
      ></SunRiseSetLocation>
      <TideLocation lat={loc.lat} long={loc.long} now={now}></TideLocation>
      <BrightnessLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></BrightnessLocation>
      <AirTempLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></AirTempLocation>
      <KayakLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></KayakLocation>

      {loc.snowPlace?.map((t) => {
        return <SnowDepthLocation loc={t}></SnowDepthLocation>;
      })}
      <SeaWaterTempLocation
        lat={loc.lat}
        long={loc.long}
      ></SeaWaterTempLocation>
      <HayfeverLocation lat={loc.lat} long={loc.long}></HayfeverLocation>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // To ensure scrolling area has enough space at the bottom
    backgroundColor: "white",
  },
  container: {
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
    marginBottom: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
