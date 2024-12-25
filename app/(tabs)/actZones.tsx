import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  fetchToJson,
  hourToString,
  isoDateOffset,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChartComponent from "@/components/chatComp";

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
}

interface pactivity {
  pace_zone_times: number[];
  icu_hr_zone_times: number[];
  gap_zone_times: number[];
  icu_zone_times: number[];
}

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
  let acts = getActivities(0, 14, storedKey);
  if (acts != undefined) {
    let facts = acts.filter((s) => s.type == sport);
    let pzt = parseActivites(facts, "pace_zone_times");
    let hzt = parseActivites(facts, "icu_hr_zone_times");
    console.log(hzt);
    let gzt = parseActivites(facts, "gap_zone_times");
    let pozt = parseActivitesPower(facts);
    return {
      pace_zone_times: collapseZones(pzt),
      icu_hr_zone_times: collapseZones(hzt),
      gap_zone_times: collapseZones(gzt),
      icu_zone_times: collapseZones(pozt),
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

export default function ZoneScreen() {
  const [storedKey, setStoredKey] = useState("");
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const value = await AsyncStorage.getItem("@api_key");
        if (value !== null) {
          setStoredKey(btoa("API_KEY:" + value));
        }
      } catch (e) {
        console.log("Error reading API key:", e);
      }
    };
    loadApiKey();
  }, []);
  if (storedKey == undefined) {
    return <></>;
  }
  let d = daysSince() % 28;
  let type = "Run";
  let summary = parse(storedKey, type);
  if (summary == undefined) {
    return <></>;
  }
  let types: (keyof pactivity)[] = [
    "pace_zone_times",
    "gap_zone_times",
    "icu_zone_times",
    "icu_hr_zone_times",
  ];

  console.log(summary);
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <ChartComponent
        title={"Period"}
        progress={d}
        zones={[
          {
            text: "Menstrual",
            startVal: 0,
            endVal: 5,
            color: "#F44336",
          },
          {
            text: "Follicular",
            startVal: 6,
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
