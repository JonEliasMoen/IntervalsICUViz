import { ScrollView, StyleSheet, View } from "react-native";
import { SnowDepthLocation } from "@/components/weatherComps/_SnowDepthLocation";
import { SeaWaterTempLocation } from "@/components/weatherComps/_SeaWaterTempLocation";
import { AirTempLocation } from "@/components/weatherComps/_AirTempLocation";
import { TideLocation } from "@/components/weatherComps/_TideLocation";
import DropDownPicker from "react-native-dropdown-picker";
import React, { useEffect, useState } from "react";
import { SunRiseSetLocation } from "@/components/weatherComps/_SunRiseSetLocation";
import { location } from "@/components/utils/_weatherModel";
import { BrightnessLocation } from "@/components/weatherComps/_BrightnessLocation";
import { PressureLocation } from "@/components/weatherComps/_PressureLocation";

export default function WeatherScreen() {
  const [value, setValue] = useState<number>(0); // Initialize state for selected value
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

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} on>
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
      <SunRiseSetLocation
        lat={loc.lat}
        long={loc.long}
        now={now}
      ></SunRiseSetLocation>
      <TideLocation lat={loc.lat} long={loc.long} now={now}></TideLocation>
      <BrightnessLocation lat={loc.lat} long={loc.long}></BrightnessLocation>
      <PressureLocation lat={loc.lat} long={loc.long}></PressureLocation>
      <AirTempLocation lat={loc.lat} long={loc.long}></AirTempLocation>

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
