import React, { useState } from "react";
import { Text } from "@/components/Themed";
import { Button, ScrollView, StyleSheet, View } from "react-native";
import { hourToString, sLong } from "@/components/utils/_utils";
import {
  getSettings,
  getWellnessRange,
  newEx,
  newExMutation,
  SportSettings,
} from "@/components/utils/_fitnessModel";
import { useStoredKey } from "@/components/utils/_keyContext";
import DropDown from "@/components/components/_dropDown";
import Slider from "@react-native-community/slider";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { Boundaries } from "@/components/utils/_otherModel";
import { findDoable } from "@/components/classes/wellness/attributes/ACR";

type finalRes = {
  time: Boundaries;
  load: Boundaries;
};

const MAXACWR: number = 1.25;

function calculateTimeBoundary(
  tpace: number,
  load: Boundaries,
  pace: Boundaries,
): Boundaries {
  if (load == undefined) {
    return {
      min: 0,
      max: 0,
    };
  }
  const lMin = load.min;
  const lMax = load.max;
  const pMin = pace.min;
  const pMax = pace.max;

  // Calculate the boundaries for t based on lmin
  const tMinFromlMin = estimateRunningTime(tpace, pMax, lMin);
  const tMaxFromlMin = estimateRunningTime(tpace, pMin, lMin);

  // Calculate the boundaries for t based on lmin
  const tMinFromlMax = estimateRunningTime(tpace, pMax, lMax);
  const tMaxFromlMax = estimateRunningTime(tpace, pMin, lMax);

  // Determine the final boundaries
  const tMinFinal = Math.min(tMinFromlMin, tMinFromlMax);
  const tMaxFinal = Math.max(tMaxFromlMin, tMaxFromlMax);

  return {
    min: Math.max(tMinFinal, 0),
    max: Math.max(tMaxFinal, 0),
  };
}

export function fitNPred(
  setting: SportSettings,
  vBound: Boundaries,
  t: Boundaries | null,
): finalRes[] {
  if (!t) {
    return [];
  }
  return [
    {
      time: calculateTimeBoundary(setting.threshold_pace, t, vBound),
      load: t,
    },
  ];
}

// z is like z0, z1 here.
function specZone(
  setting: SportSettings,
  z: number,
  z2: number = -1,
): Boundaries {
  let zl = z2 == -1 ? z - 1 : z2 - 1;
  let zone = setting.pace_zones[z];
  let zoneL = zl != -1 ? setting.pace_zones[zl] : 50;
  let tPace = setting?.threshold_pace;
  return {
    min: (zoneL / 100) * tPace,
    max: (zone / 100) * tPace,
  };
}

function conv(s: number): number {
  return 1000 / (s * 60); // m/s => m/km
}

function mpsToSecPerKm(speedMps: number): number {
  return (1 / speedMps) * 1000;
}

function convertMStoKMH(metersPerSecond: number): number {
  return metersPerSecond * 3.6;
}

function estimateRunningTime(
  tpace: number, // seconds per km
  pace: number,
  load: number, // km
): number {
  let thresholdPace = mpsToSecPerKm(tpace);
  const timeSeconds =
    (load / 100 / Math.pow(thresholdPace / mpsToSecPerKm(pace), 2)) * 3600;
  return timeSeconds;
}

function distN(s: number, t: number): number {
  t = Math.max(0, t);
  return (s * t) / 1000;
}

function dist(s: number, t: number): string {
  return distN(s, t).toFixed(2) + " km";
}

export interface zone {
  label: string;
  value: number;
}

export default function RunSuggestScreen() {
  const { storedKey, storedAid, storedToken } = useStoredKey();

  const [value, setValue] = useState<zone>({ label: "Zone 1", value: 1 }); // Initialize state for selected value
  const [range, setRange] = useState<number>(1.1);

  const { mutate, isLoading, error } = newExMutation(storedKey);
  const newEx = (zone: number, distance: number) => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const day = String(today.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    const localMidnightString = `${date}T00:00:00`;

    const d = Math.round(distance);
    const ex: string = `-${d}km Z${zone} Pace`;
    const nex: newEx = {
      start_date_local: localMidnightString,
      athlete_id: storedAid,
      name: `${d}km Z${zone} ${date}`,
      description: ex,
      type: "Run",
      category: "WORKOUT",
    };
    mutate(nex);
  };
  const items: zone[] = [
    { label: "Zone 1", value: 0 },
    { label: "Zone 2", value: 1 },
    { label: "Zone 3", value: 2 },
    { label: "Zone 4", value: 3 },
    { label: "Zone 5", value: 4 },
  ];
  if (storedKey == undefined || storedAid == undefined) {
    return (
      <Text>
        {storedKey}
        {storedAid}
      </Text>
    );
  }
  const dataLong = getWellnessRange(0, sLong, storedKey, storedAid) ?? [];
  const settings = getSettings(storedKey, storedAid);
  if (dataLong == undefined || settings == undefined || dataLong.length == 0) {
    return (
      <Text>
        {storedKey}
        {storedAid}
      </Text>
    );
  }

  let runsetting = settings.sportSettings.filter(
    (t) =>
      t.types.find((t) => {
        return t == "Run";
      }) != null,
  )[0];
  if (runsetting == undefined) {
    return (
      <Text>
        This page does not work without pace zones in intervals.icu settings for
        running.
      </Text>
    );
  }
  console.log(value);
  let zoneNr = value.value ?? 0;
  console.log(value.value, zoneNr);
  let zone = specZone(runsetting, zoneNr);
  let wR = new wellnessWrapper(dataLong);
  let lrange = wR.solve.common;

  let tol = dataLong.map((s) => s.ctl);
  let load = dataLong.map((s) => s.atl);
  let res = fitNPred(runsetting, zone, lrange);
  let sload = findDoable(0, load, tol, 1, range).max;
  let middlePace = (zone.min + zone.max) / 2;
  let time =
    estimateRunningTime(runsetting.threshold_pace, middlePace, sload) / 60 / 60;

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <DropDown
        items={items}
        setItem={setValue}
        text={"Select a zone"}
      ></DropDown>
      <View style={styles.container}>
        {res.length == 0 && <Text>Dont Run</Text>}
        {res.map((t, i) => {
          return (
            <>
              <Text>Run: {i + 1}</Text>
              <Text>
                Speed: Z{zoneNr + 1} {hourToString(conv(zone.min))}-
                {hourToString(conv(zone.max))}
                /km
              </Text>
              <Text>
                Speed: Z{zoneNr + 1} {convertMStoKMH(zone.min).toFixed(1)}-
                {convertMStoKMH(zone.max).toFixed(1)}
                km/h
              </Text>
              <Text>
                Time: {hourToString(t.time.min / 60 / 60)} -{" "}
                {hourToString(t.time.max / 60 / 60)}
              </Text>
              <Text>
                Dist: {dist(zone.min, t.time.min)} -{" "}
                {dist(zone.max, t.time.max)}
              </Text>
              <Text>
                LoadRange: {t.load.min} - {t.load.max}
              </Text>
            </>
          );
        })}
      </View>
      <View style={styles.dcontainerLow}>
        <Text>
          Current acwr:{" "}
          {(load[load.length - 1] / tol[tol.length - 1]).toFixed(2)} - ({1}-
          {MAXACWR})
        </Text>

        <Text>Acwr: {range.toFixed(2)}</Text>
        <Text>Load: {sload.toFixed(2)}</Text>
        <Text>Time: {hourToString(time)}</Text>
        <Text>Distance: {dist(middlePace, time * 3600)}</Text>
        <Slider
          style={{ width: 400, height: 40 }}
          minimumValue={1}
          maximumValue={MAXACWR}
          value={1.1}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#FFFFFF"
          onValueChange={(value) => setRange(value)}
        />
        <Button
          title={"Post workout"}
          onPress={() => newEx(zoneNr + 1, distN(middlePace, time * 3600))}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0,
    paddingRight: 0,
    zIndex: 10, // Ensure dropdown is above other elements
  },
  scrollViewContent: {
    paddingBottom: 20, // To ensure scrolling area has enough space at the bottom
    backgroundColor: "white",
  },
  redSection: {
    backgroundColor: "#FF4C4C", // Red section
  },
  dcontainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000, // Prioritize dropdown over other content
    alignSelf: "center", // Ensures centering
    width: "25%",
  },
  dcontainerLow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // Prioritize dropdown over other content
    alignSelf: "center", // Ensures centering
    width: "25%",
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
