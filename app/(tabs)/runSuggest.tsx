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
  wellness,
} from "@/components/utils/_fitnessModel";
import { useStoredKey } from "@/components/utils/_keyContext";
import { strainMonotony, strainMonotonyList } from "@/app/(tabs)/index";
import DropDown from "@/components/components/_dropDown";
import Slider from "@react-native-community/slider";

export function convertToRanges(arr: number[]): Boundaries[] {
  if (arr.length === 0) return [];

  arr.sort((a, b) => a - b);

  const ranges: Boundaries[] = [];
  let start = arr[0];
  let end = arr[0];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === end + 1) {
      end = arr[i];
    } else {
      ranges.push({
        min: start,
        max: end,
      });
      start = arr[i];
      end = arr[i];
    }
  }

  ranges.push({
    min: start,
    max: end,
  });

  return ranges;
}

type Boundaries = {
  min: number;
  max: number;
};
type finalRes = {
  time: Boundaries;
  load: Boundaries;
};

type desc = {
  load: number;
  monotony: number;
  acwr: number;
};

const MAXACWR: number = 1.25;
const MAXMONOTONY: number = 1.5;
const MINMONOTONY: number = 1;
const MAXSTRAINACWR: number = 1.5;
const MINSTRAINACWR: number = 1.1;
const SHORT = 7;
const LONG = 42;

function getStrainMonFromLoad(pastLoad: number[], load: number) {
  const cLoad = JSON.parse(JSON.stringify(pastLoad));
  cLoad[cLoad.length - 1] += load;
  const mData = strainMonotonyList(cLoad);
  return {
    load: Math.round(load),
    monotony: mData.monotony,
    acwr: mData.acwr,
  };
}

function calculateMonotonyLoadRange(
  pastLoad: number[],
  loadBound: Boundaries,
  monoBound: Boundaries,
  strBound: Boundaries,
): Boundaries[] {
  const data: desc[] = [];
  for (let i = Math.floor(loadBound.min); i <= Math.ceil(loadBound.max); i++) {
    data.push(getStrainMonFromLoad(pastLoad, i));
  }
  console.log(data);
  var loads = data
    .filter((t) => t.monotony < monoBound.max && t.monotony > monoBound.min)
    .filter((t) => t.acwr < strBound.max && t.acwr > strBound.min)
    .map((t) => t.load);
  if (loads.length == 0) {
    loads = data
      .filter((t) => t.monotony < monoBound.max)
      .filter((t) => t.acwr < strBound.max)
      .map((t) => t.load);
  }
  console.log(loads);
  return convertToRanges(loads);
}

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

function findDoable(
  dt: number,
  load: number[],
  tol: number[],
  lowerDiscount: number,
  higherDiscount: number,
): Boundaries {
  const S = SHORT;
  const L = LONG;
  const lastTol = tol[tol.length - 1];
  const lastLoad = load[tol.length - 1];
  const yLoad = load[load.length - 2];
  const yTol = tol[tol.length - 2];

  const alpha = 1 - Math.exp(-Math.log(2) / S);
  const beta = 1 - Math.exp(-Math.log(2) / L);

  for (let z = 0; z < dt; z++) {
    load.push((1 - alpha) * lastLoad);
    tol.push((1 - beta) * lastTol);
  }

  const d = ((alpha - 1) * yLoad + lastLoad) / alpha;

  const res: number[] = [];
  for (const t of [lowerDiscount, higherDiscount]) {
    let x = alpha * (yLoad - d) + t * (beta * d - beta * yTol + yTol) - yLoad;
    x /= alpha - t * beta;
    res.push(x);
  }

  // Ensure no negative values
  const adjustedRes = res.map((val) => Math.max(0, val));
  return {
    min: adjustedRes[0],
    max: adjustedRes[1],
  };
}

export function fitNPred(
  wellnessData: wellness[],
  setting: SportSettings,
  vBound: Boundaries,
  lBound: Boundaries,
): finalRes[] {
  let load = wellnessData.map((t) => t.ctlLoad).filter((t) => t != undefined);
  let loadRanges = calculateMonotonyLoadRange(
    load,
    lBound,
    { min: MINMONOTONY, max: MAXMONOTONY },
    { min: MINSTRAINACWR, max: MAXSTRAINACWR },
  );
  console.log(loadRanges);
  console.log(vBound);
  let lrange: Boundaries[];
  if (loadRanges == undefined || loadRanges.length == 0) {
    return [];
  } else {
    lrange = loadRanges;
  }

  return lrange.map((t) => {
    return {
      time: calculateTimeBoundary(setting.threshold_pace, t, vBound),
      load: t,
    };
  });
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
    const ex: string = `-${d}km Z${zone} Power`;
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

  let tol = dataLong.map((s) => s.ctl);
  let load = dataLong.map((s) => s.atl);
  let neededLoad = findDoable(0, load, tol, 1, MAXACWR);
  let res = fitNPred(dataLong, runsetting, zone, neededLoad);
  let sload = findDoable(0, load, tol, 1, range).max;
  let middlePace = (zone.min + zone.max) / 2;
  let time =
    estimateRunningTime(runsetting.threshold_pace, middlePace, sload) / 60 / 60;
  let smon = getStrainMonFromLoad(
    dataLong.map((t) => t.ctlLoad).filter((t) => t != undefined),
    sload,
  );
  let cStrain = strainMonotony(dataLong);
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
        <Text>
          Current strain acwr: {cStrain.acwr.toFixed(2)} - ({MINSTRAINACWR}-
          {MAXSTRAINACWR})
        </Text>
        <Text>
          Current monotony: {cStrain.monotony.toFixed(2)} - ({MINMONOTONY}-
          {MAXMONOTONY})
        </Text>
        <Text>Acwr: {range.toFixed(2)}</Text>
        <Text>Load: {sload.toFixed(2)}</Text>
        <Text>Time: {hourToString(time)}</Text>
        <Text>
          Strain acwr: {smon.acwr.toFixed(2)} ({MINSTRAINACWR}-{MAXSTRAINACWR})
        </Text>
        <Text>
          Monotony: {smon.monotony.toFixed(2)} ({MINMONOTONY}-{MAXMONOTONY})
        </Text>
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
