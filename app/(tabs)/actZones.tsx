import React, { useEffect, useState } from "react";
import { Text } from "@/components/Themed";
import { ScrollView, StyleSheet, View } from "react-native";
import { hourToString } from "@/components/utils/_utils";
import ChartComponent from "@/components/chatComp";
import { MultivariateLinearRegression } from "@/components/utils/mlr";
import {
  activity,
  getActivities,
  getSettings,
  getWellnessRange,
  wellness,
} from "@/components/utils/_commonModel";
import { mean, standardDeviation } from "simple-statistics";
import { useStoredKey } from "@/components/utils/_keyContext";
import DropDownPicker from "react-native-dropdown-picker";
interface pactivity {
  pace_zone_times: number[];
  icu_hr_zone_times: number[];
  gap_zone_times: number[];
  icu_zone_times: number[];
  acts: activity[];
  pace_zone_times_20: number[];
}

export function arrayIndexSum(list: number[][], index: number) {
  return list
    .map((s) => s[index])
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

export function parseActivites(acts: activity[], attr: keyof activity) {
  let filact = acts.map((a) => a[attr]).filter((s) => s != undefined);
  let res = Array(filact[0]?.length).fill(0);
  // @ts-ignore
  return res.map((s, i) => arrayIndexSum(filact, i));
}

export function parseActivitesPower(acts: activity[]) {
  let filact = acts
    .map((a) => a.icu_zone_times?.map((s) => s.secs))
    .filter((s) => s != undefined);
  let res = Array(filact[0]?.length).fill(0);
  // @ts-ignore
  return res.map((s, i) => arrayIndexSum(filact, i));
}

export function parse(
  storedKey: string,
  sport: string = "Run",
): pactivity | undefined {
  let acts = getActivities(0, 7 * 4, storedKey);
  if (acts != undefined) {
    let facts = acts.filter((s) => s.type == sport);
    let pzt = parseActivites(facts, "pace_zone_times");
    let hzt = parseActivites(facts, "icu_hr_zone_times");
    let gzt = parseActivites(facts, "gap_zone_times");
    let pozt = parseActivitesPower(facts);
    return {
      pace_zone_times: collapseZones(pzt),
      pace_zone_times_20: innerZone(pzt),
      icu_hr_zone_times: collapseZones(hzt),
      gap_zone_times: collapseZones(gzt),
      icu_zone_times: collapseZones(pozt),
      acts: facts,
    };
  }
}

function innerZone(zone: number[]) {
  return [zone[2], zone[3], zone[4]];
}

export function collapseZones(zoneTimes: number[]) {
  if (zoneTimes.length >= 6) {
    return [
      zoneTimes[0] + zoneTimes[1],
      zoneTimes[2] + zoneTimes[3],
      zoneTimes[4] + (zoneTimes[5] ?? 0),
    ];
  } else {
    return [
      zoneTimes[0] + zoneTimes[1],
      zoneTimes[2] + zoneTimes[3],
      zoneTimes[4],
    ];
  }
}

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
  strain: number;
};

function calculateMonotonyLoadRange(
  past7Days: number[],
  loadBound: Boundaries,
  monoBound: Boundaries,
  strBound: Boundaries,
): Boundaries[] {
  const cLoad = structuredClone(past7Days);
  const today = cLoad[cLoad.length - 1];
  const data: desc[] = [];

  for (let i = Math.floor(loadBound.min); i <= Math.ceil(loadBound.max); i++) {
    cLoad[cLoad.length - 1] = today + i;
    let monotony = mean(cLoad) / standardDeviation(cLoad);
    let strain = monotony * mean(cLoad);
    data.push({
      load: Math.round(i),
      monotony: monotony,
      strain: strain,
    });
  }
  const loads = data
    .filter((t) => t.monotony < monoBound.max && t.monotony > monoBound.min)
    .filter((t) => t.strain < strBound.max && t.strain > strBound.min)
    .map((t) => t.load);
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
  load = load.slice(load.length - 7);
  let loadRanges = calculateMonotonyLoadRange(
    load,
    lBound,
    { min: 0.8, max: 2 },
    { min: 30, max: 150 },
  );
  let lrange: Boundaries[];
  if (loadRanges == undefined || loadRanges.length == 0) {
    lrange = [lBound];
  } else {
    lrange = loadRanges;
  }
  console.log(lrange);

  let X = facts.map((s) => [s.moving_time, s.pace]);
  let Y = facts.map((s) => s.icu_training_load);
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

export function toPrecent(zoneTimes: number[] | undefined) {
  return zoneTimes.map(
    (s) =>
      s /
      zoneTimes.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0,
      ),
  );
}

function solve(map: number[], t: number, i: number = 0) {
  const targetMap0 = t * map.reduce((sum, value) => sum + value, 0);
  return (targetMap0 - map[i]) / (1 - t) / 60;
}

// z is like z0, z1 here.
function specZone(
  storedKey: string,
  sport: string,
  z: number,
  z2: number = -1,
): Boundaries | undefined {
  let setting = getSettings(storedKey)?.sportSettings.filter(
    (t) =>
      t.types.find((t) => {
        return t == sport;
      }) != null,
  )[0];
  let zl = z2 == -1 ? z - 1 : z2 - 1;
  console.log(setting);
  if (setting != null) {
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

export default function ZoneScreen() {
  const { storedKey } = useStoredKey();
  if (storedKey == undefined) {
    return <></>;
  }
  let type = "Run";
  const [value, setValue] = useState<number | null>(null); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility

  let summary = parse(storedKey, type);
  const dataWeek = getWellnessRange(0, 8, storedKey);
  if (dataWeek == undefined || dataWeek.length == 0) {
    return <></>;
  }
  let tol = dataWeek.map((s) => s.ctl);
  let load = dataWeek.map((s) => s.atl);
  let zoneNr =
    value != null
      ? value - 1
      : solve(summary?.pace_zone_times ?? [2222, 1, 1], 0.8) > 0
        ? 1
        : 2;
  let zone = specZone(storedKey, "Run", zoneNr);
  if (summary == undefined) {
    return <></>;
  }

  if (zone == undefined) {
    return <></>;
  }

  let neededLoad = findDoable(0, load, tol, 7, 42, 1, 1.3);
  let res = fitNPred(dataWeek, summary.acts, zone, neededLoad);

  const items = [
    { label: "Zone 1", value: 1 },
    { label: "Zone 2", value: 2 },
    { label: "Zone 3", value: 3 },
    { label: "Zone 4", value: 4 },
    { label: "Zone 5", value: 5 },
  ];
  let types: (keyof pactivity)[] = [
    "pace_zone_times",
    "gap_zone_times",
    "icu_zone_times",
    "icu_hr_zone_times",
  ];
  let zoneI = [0, 1, 2];
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
        {types.map((s) => {
          let zones = toPrecent(summary[s]);
          let needed = solve(summary[s], 0.8) / 60;
          console.log(s, needed);
          let solved = (needed > 0 ? "" : "-") + hourToString(Math.abs(needed));
          return (
            <ChartComponent
              title={type + " " + s.toString() + " " + solved.toString()}
              progress={0.8}
              zones={[
                {
                  text: "Polarized",
                  startVal: 0,
                  endVal: zones[0],
                  color: "#009E0066",
                },
                {
                  text: "Threshold",
                  startVal: zones[0],
                  endVal: zones[1] + zones[0],
                  color: "#FFCB0E80",
                },
                {
                  text: "HIT",
                  startVal: zones[1] + zones[0],
                  endVal: zones[1] + zones[0] + zones[2],
                  color: "rgb(255, 0, 0)",
                },
              ]}
              transform={(n) => n}
            ></ChartComponent>
          );
        })}
        ;
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
