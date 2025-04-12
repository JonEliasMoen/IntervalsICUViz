import React, { useState } from "react";
import { Text } from "@/components/Themed";
import { ScrollView, StyleSheet, View } from "react-native";
import { hourToString } from "@/components/utils/_utils";
import { MultivariateLinearRegression } from "@/components/utils/mlr";
import {
  activity,
  getActivities,
  getSettings,
  getWellnessRange,
  settings,
  wellness,
} from "@/components/utils/_fitnessModel";
import { mean, standardDeviation } from "simple-statistics";
import { useStoredKey } from "@/components/utils/_keyContext";
import DropDownPicker from "react-native-dropdown-picker";
import { strainMonotony, strainMonotonyList } from "@/app/(tabs)/index";

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

function calculateMonotonyLoadRange(
  past7Days: number[],
  loadBound: Boundaries,
  monoBound: Boundaries,
  strBound: Boundaries,
): Boundaries[] {
  const cLoad = JSON.parse(JSON.stringify(past7Days));
  const today = cLoad[cLoad.length - 1];
  const data: desc[] = [];

  for (let i = Math.floor(loadBound.min); i <= Math.ceil(loadBound.max); i++) {
    cLoad[cLoad.length - 1] = today + i;
    let mdata = strainMonotonyList(cLoad);
    data.push({
      load: Math.round(i),
      monotony: mdata.monotony,
      acwr: mdata.acwr,
    });
  }
  const loads = data
    .filter((t) => t.monotony < monoBound.max && t.monotony > monoBound.min)
    .filter((t) => t.acwr < strBound.max && t.acwr > strBound.min)
    .map((t) => t.load);
  console.log(data);

  return convertToRanges(loads);
}

function calculateX1Boundaries(
  w: number[],
  y2: Boundaries,
  x2: Boundaries,
): Boundaries {
  if (y2 == undefined) {
    return {
      min: 0,
      max: 0,
    };
  }
  const [w1, w2, w0] = w; // Bias term is last lmao
  const yMin = y2.min;
  const yMax = y2.max;
  const x2Min = x2.min;
  const x2Max = x2.max;
  if (w1 === 0) {
    throw new Error("w1 cannot be zero to avoid division by zero.");
  }

  // Calculate the boundaries for x1 based on yMin
  const x1MinFromYMin = (yMin - w0 - w2 * x2Max) / w1;
  const x1MaxFromYMin = (yMin - w0 - w2 * x2Min) / w1;

  // Calculate the boundaries for x1 based on yMax
  const x1MinFromYMax = (yMax - w0 - w2 * x2Max) / w1;
  const x1MaxFromYMax = (yMax - w0 - w2 * x2Min) / w1;

  // Determine the final boundaries
  const x1MinFinal = Math.min(x1MinFromYMin, x1MinFromYMax);
  const x1MaxFinal = Math.max(x1MaxFromYMin, x1MaxFromYMax);

  return {
    min: Math.max(x1MinFinal, 0),
    max: Math.max(x1MaxFinal, 0),
  };
}

function findDoable(
  dt: number,
  load: number[],
  tol: number[],
  S: number,
  L: number,
  lowerDiscount: number,
  higherDiscount: number,
): Boundaries {
  const alpha = 1 - Math.exp(-Math.log(2) / S);
  const beta = 1 - Math.exp(-Math.log(2) / L);

  for (let z = 0; z < dt; z++) {
    load.push((1 - alpha) * load[load.length - 1]);
    tol.push((1 - beta) * tol[tol.length - 1]);
  }

  const last = load[load.length - 1] / tol[tol.length - 1];
  const d =
    ((alpha - 1) * load[load.length - 2] + load[load.length - 1]) / alpha;

  const res: number[] = [];
  for (const t of [lowerDiscount, higherDiscount]) {
    let x =
      alpha * (load[load.length - 2] - d) +
      t * (beta * d - beta * tol[tol.length - 2] + tol[tol.length - 2]) -
      load[load.length - 2];
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
  dataWeek: wellness[],
  facts: activity[],
  vBound: Boundaries,
  lBound: Boundaries,
): finalRes[] {
  let load = dataWeek.map((t) => t.ctlLoad).filter((t) => t != undefined);
  let loadRanges = calculateMonotonyLoadRange(
    load,
    lBound,
    { min: 0.8, max: 2 },
    { min: 0.8, max: 1.3 },
  );
  let lrange: Boundaries[];
  if (loadRanges == undefined || loadRanges.length == 0) {
    return [];
  } else {
    lrange = loadRanges;
  }
  let filtered = facts
    .filter((f) => vBound.min < f.pace)
    .filter((f) => f.pace < vBound.max);

  let X = filtered.map((s) => [s.moving_time, s.pace]);
  let Y = filtered.map((s) => s.icu_training_load);
  const mlr = new MultivariateLinearRegression();
  mlr.fit(X, Y);

  return lrange.map((t) => {
    return {
      time: calculateX1Boundaries(
        mlr.aweights.map((l) => l[0]),
        t,
        vBound,
      ),
      load: t,
    };
  });
}

// z is like z0, z1 here.
function specZone(
  settings: settings,
  sport: string,
  z: number,
  z2: number = -1,
): Boundaries | undefined {
  let setting = settings.sportSettings.filter(
    (t) =>
      t.types.find((t) => {
        return t == sport;
      }) != null,
  )[0];
  console.log(setting);
  let zl = z2 == -1 ? z - 1 : z2 - 1;
  if (setting != null && setting.pace_zones != null) {
    let zone = setting.pace_zones[z];
    let zoneL = zl != -1 ? setting.pace_zones[zl] : 50;
    let tPace = setting?.threshold_pace;
    console.log(zone, zoneL);
    return {
      min: (zoneL / 100) * tPace,
      max: (zone / 100) * tPace,
    };
  }
}

function conv(s: number): number {
  return 1000 / (s * 60); // m/s => m/km
}

function convertMStoKMH(metersPerSecond: number): number {
  return metersPerSecond * 3.6;
}

function dist(s: number, t: number): string {
  t = Math.max(0, t);
  return ((s * t) / 1000).toFixed(2) + " km";
}

export default function RunSuggestScreen() {
  const { storedKey, storedAid, storedToken } = useStoredKey();
  const [value, setValue] = useState<number | null>(null); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility
  const items = [
    { label: "Zone 1", value: 1 },
    { label: "Zone 2", value: 2 },
    { label: "Zone 3", value: 3 },
    { label: "Zone 4", value: 4 },
    { label: "Zone 5", value: 5 },
  ];
  if (storedKey == undefined || storedAid == undefined) {
    return (
      <Text>
        {storedKey}
        {storedAid}
      </Text>
    );
  }
  let activities = getActivities(0, 365, storedKey, storedAid);
  const dataLong = getWellnessRange(0, 28, storedKey, storedAid) ?? [];
  const dataWeek = dataLong.slice(dataLong.length - 7);
  const settings = getSettings(storedKey, storedAid);
  if (
    dataWeek == undefined ||
    activities == undefined ||
    settings == undefined
  ) {
    return (
      <Text>
        {storedKey}
        {storedAid}
      </Text>
    );
    //return <Text>Loading</Text>;
  }
  activities = activities.filter((s) => s.type == "Run");

  let tol = dataWeek.map((s) => s.ctl);
  let load = dataWeek.map((s) => s.atl);
  let zoneNr = value != null ? value - 1 : 1;
  let zone = specZone(settings, "Run", zoneNr);

  if (zone == undefined) {
    return (
      <Text>
        This page does not work without pace zones in intervals.icu settings for
        running.
      </Text>
    );
  }
  let neededLoad = findDoable(0, load, tol, 7, 42, 1, 1.3);
  let res = fitNPred(dataLong, activities, zone, neededLoad);
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={[styles.dcontainer]}>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          placeholder="Select a zone"
          dropDownContainerStyle={{
            zIndex: 1000,
            elevation: 1000,
            backgroundColor: "white",
          }}
        />
      </View>
      <View style={styles.container}>
        {res.length == 0 && <Text>Dont Run</Text>}
        {res.map((t, i) => {
          return (
            <>
              <Text>Run: {i + 1}</Text>
              <Text>
                Speed: {hourToString(conv(zone.min))}-
                {hourToString(conv(zone.max))}
                /km
              </Text>
              <Text>
                Speed: {convertMStoKMH(zone.min).toFixed(1)}-
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
              <Text>
                Load:{" "}
                {(load[load.length - 1] / tol[tol.length - 1]).toPrecision(2)} -
                (1-1.3)
              </Text>
            </>
          );
        })}
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
