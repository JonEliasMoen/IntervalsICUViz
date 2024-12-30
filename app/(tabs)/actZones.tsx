import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import {
  fetchToJson,
  hourToString,
  isoDateOffset,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChartComponent from "@/components/chatComp";
import MLR from "ml-regression-multivariate-linear";
import { useStoredKey } from "@/components/utils/_keyContext";
import { getSettings, getWellnessRange } from "@/components/utils/_commonModel";

interface powerzone {
  id: string;
  secs: number;
}

interface activity {
  type: string;
  pace_zone_times?: number[];
  icu_hr_zone_times?: number[];
  gap_zone_times?: number[];
  icu_zone_times?: powerzone[];
  icu_training_load: number;
  moving_time: number;
  pace: number;
}

interface pactivity {
  pace_zone_times: number[];
  icu_hr_zone_times: number[];
  gap_zone_times: number[];
  icu_zone_times: number[];
  acts: activity[];
}

export function test() {}

export function getActivities(n: number, n2: number, apiKey: string | null) {
  let isodate1 = isoDateOffset(n);
  let isodate2 = isoDateOffset(n2);
  const { data: data } = useQuery(
    ["activities", isodate1, isodate2],
    () =>
      fetchToJson<activity[]>(
        `https://intervals.icu/api/v1/athlete/i174646/activities?oldest=${isodate2}&newest=${isodate1}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${apiKey}`,
          },
        },
      ),
    {
      enabled: !!apiKey,
    },
  );
  return data;
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
      icu_hr_zone_times: collapseZones(hzt),
      gap_zone_times: collapseZones(gzt),
      icu_zone_times: collapseZones(pozt),
      acts: facts,
    };
  }
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

type Boundaries = {
  min: number;
  max: number;
};

function calculateX1Boundaries(
  w: number[],
  yMin: number,
  yMax: number,
  x2Min: number,
  x2Max: number,
): Boundaries {
  const [w1, w2, w0] = w; // Bias term is last lmao

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
    min: x1MinFinal,
    max: x1MaxFinal,
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
  facts: activity[],
  vBound: Boundaries,
  lBound: Boundaries,
): Boundaries {
  let X = facts.map((s) => [s.moving_time, s.pace]);
  let Y = facts.map((s) => [s.icu_training_load]);
  const mlr = new MLR(X, Y);
  console.log("weights", mlr.weights);
  return calculateX1Boundaries(
    mlr.weights.map((l) => l[0]),
    lBound.min,
    lBound.max,
    vBound.min,
    vBound.max,
  );
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

function solve(map: number[], t: number) {
  const targetMap0 = t * map.reduce((sum, value) => sum + value, 0);
  return (targetMap0 - map[0]) / (1 - t) / 60;
}

function daysSince() {
  var date2 = new Date();
  var diff = Math.abs(Date.parse("2024-12-14T19:42:07.791Z") - date2.getTime());
  return Math.ceil(diff / (1000 * 3600 * 24));
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
  return 1000 / (s * 60);
}

function dist(s: number, t: number): string {
  return ((s * t) / 1000).toFixed(2) + " km";
}

export default function ZoneScreen() {
  const { storedKey } = useStoredKey();

  if (storedKey == undefined) {
    return <></>;
  }
  //console.log(specZone(storedKey, "Run", 0));
  let d = daysSince() % 28;
  let type = "Run";
  let summary = parse(storedKey, type);
  const dataWeek = getWellnessRange(0, 8, storedKey) ?? [];
  let tol = dataWeek.map((s) => s.ctl);
  let load = dataWeek.map((s) => s.atl);

  let zoneNr = 4; //solve(summary?.pace_zone_times ?? [2222, 1, 1], 0.8) > 0 ? 1 : 2;
  let zone = specZone(storedKey, "Run", zoneNr);
  if (summary == undefined) {
    return <></>;
  }

  if (zone == undefined) {
    return <></>;
  }
  console.log(
    fitNPred(summary.acts, zone, findDoable(0, load, tol, 7, 42, 1, 1.3)),
  );
  let res = fitNPred(
    summary.acts,
    zone,
    findDoable(0, load, tol, 7, 42, 1, 1.3),
  );

  console.log("load bound", findDoable(0, load, tol, 7, 42, 1, 1.3));

  let types: (keyof pactivity)[] = [
    "pace_zone_times",
    "gap_zone_times",
    "icu_zone_times",
    "icu_hr_zone_times",
  ];

  console.log(summary);
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        <text>Zone: {zoneNr + 1}</text>
        <text>
          Speed: {hourToString(conv(zone.min))}-{hourToString(conv(zone.max))}
          /km
        </text>
        <text>
          Time: {hourToString(res.min / 60 / 60)} -{" "}
          {hourToString(res.max / 60 / 60)}
        </text>
        <text>
          Dist: {dist(zone.min, res.min)} - {dist(zone.max, res.max)}
        </text>
        <text>
          Load: {(load[load.length - 1] / tol[tol.length - 1]).toPrecision(2)} -
          (1-1.3)
        </text>
      </View>
      <ChartComponent
        title={"Period"}
        progress={d}
        display={() => false}
        zones={[
          {
            text: "Menstrual",
            startVal: 0,
            endVal: 6,
            color: "#F44336",
          },
          {
            text: "Follicular",
            startVal: 7,
            endVal: 14,
            color: "#66BB6A",
          },
          {
            text: "Ovulation",
            startVal: 14,
            endVal: 15,
            color: "#FF7043",
          },
          {
            text: "Luteal",
            startVal: 16,
            endVal: 21,
            color: "#FFB74D",
          },
          {
            text: "Luteal - Estrogen",
            startVal: 21,
            endVal: 24,
            color: "#755726",
          },
          {
            text: "Luteal",
            startVal: 15,
            endVal: 30,
            color: "#FFB74D",
          },
        ]}
        transform={(n) => n / 28}
      ></ChartComponent>

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
  },
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
    backgroundColor: "#FF4C4C", // Red section
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
