import { Button, ScrollView, StyleSheet } from "react-native";
import { SnowDepthLocation } from "@/components/weatherComps/_SnowDepthLocation";
import { HayfeverLocation } from "@/components/weatherComps/_HayfeverLocation";
import { SeaWaterTempLocation } from "@/components/weatherComps/_SeaWaterTempLocation";
import { AirTempLocation } from "@/components/weatherComps/_AirTempLocation";
import {
  findHarbor,
  TideLocation,
} from "@/components/weatherComps/_TideLocation";
import React, { useEffect, useState } from "react";
import { SunRiseSetLocation } from "@/components/weatherComps/_SunRiseSetLocation";
import { location } from "@/components/utils/_weatherModel";
import { PressureLocation } from "@/components/weatherComps/_PressureLocation";
import DropDown from "@/components/components/_dropDown";
import { Text } from "@/components/Themed";
import { dateOffset } from "@/components/utils/_utils";
import { KayakLocation } from "@/components/weatherComps/_Kayak";
import * as Location from "expo-location";
import { DewPointLocation } from "@/components/weatherComps/_DewPointLocation";

export default function WeatherScreen() {
  const [locationMap, setLocationMap] = useState<location[]>([
    {
      label: "Current Location",
      value: 0,
      lat: 63.4394093,
      long: 10.5039971,
      snowPlace: [],
    },
    {
      label: "Grillstad",
      value: 1,
      lat: 63.4394093,
      long: 10.5039971,
      snowPlace: [],
    },
    {
      label: "Trondheim",
      value: 2,
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
      value: 3,
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
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return; // Don't run on server

    const getCurrentLocationAndUpdateMap = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log("User location:", location);

      const updated = [...locationMap];
      updated[0] = {
        ...updated[0],
        lat: location.coords.latitude,
        long: location.coords.longitude,
      };
      setLocationMap(updated);
    };

    getCurrentLocationAndUpdateMap();
  }, []);

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
  let harbor = findHarbor(loc.lat, loc.long);
  harbor = harbor.charAt(0).toUpperCase() + harbor.slice(1);

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
      <Text style={[{ textAlign: "center" }]}>
        Lat: {loc.lat.toFixed(4)} Long: {loc.long.toFixed(4)}
      </Text>
      <Text style={[{ textAlign: "center" }]}>Closest harbor: {harbor}</Text>
      <DewPointLocation lat={loc.lat} long={loc.long} dayOffset={offset} />
      <PressureLocation lat={loc.lat} long={loc.long}></PressureLocation>
      <SunRiseSetLocation
        lat={loc.lat}
        long={loc.long}
        now={now}
      ></SunRiseSetLocation>
      <AirTempLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></AirTempLocation>
      <TideLocation lat={loc.lat} long={loc.long} now={now}></TideLocation>
      {loc.snowPlace?.map((t) => {
        return <SnowDepthLocation loc={t}></SnowDepthLocation>;
      })}
      <SeaWaterTempLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></SeaWaterTempLocation>
      <KayakLocation
        lat={loc.lat}
        long={loc.long}
        dayOffset={offset}
      ></KayakLocation>
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
