import React, { useEffect, useState } from "react";
import { Text } from "@/components/Themed";
import { ScrollView, StyleSheet, View } from "react-native";
import { daysSince, hourToString } from "@/components/utils/_utils";
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
import Slider from "@react-native-community/slider";
import { Checkbox } from "react-native-paper";
interface pactivity {
  pace_zone_times: number[];
  icu_hr_zone_times: number[];
  gap_zone_times: number[];
  icu_zone_times: number[];
  combined: number[];
  acts: activity[];
}

export function arrayIndexSum(
  list: number[][],
  timeS: number[],
  index: number,
  hl: number,
) {
  const beta = 1 - Math.exp(-Math.log(2) / hl);

  return list
    .map((s) => fix(s[index]))
    .reduce(
      (accumulator, currentValue, i) =>
        accumulator + Math.pow(1 - beta, timeS[i]) * currentValue,
      0,
    );
}
function fix(v: number | undefined | null): number {
  if (v == undefined || Number.isNaN(v)) {
    return 0;
  }
  return v;
}
export function arrayIndexSumNormal(list: number[][], index: number) {
  return list
    .map((s) => fix(s[index]))
    .reduce(
      (accumulator, currentValue, i) => accumulator + currentValue ?? 0,
      0,
    );
}

export function parseActivites(
  acts: activity[],
  timeS: number[],
  attr: keyof activity,
  ewm: boolean = true,
  hl: number,
) {
  let filact = acts.map((a) => a[attr]).filter((s) => s != undefined);
  let res = Array(filact[0]?.length).fill(0);
  if (ewm) {
    // @ts-ignore
    return res.map((s, i) => arrayIndexSum(filact, timeS, i, hl));
  } else {
    filact = filact.slice(0, hl);
    // @ts-ignore
    return res.map((s, i) => arrayIndexSumNormal(filact, i));
  }
}

export function parseActivitesPower(
  acts: activity[],
  timeS: number[],
  ewm: boolean = true,
  hl: number,
) {
  let filact = acts
    .map((a) => a.icu_zone_times?.map((s) => s.secs))
    .filter((s) => s != undefined);
  let res = Array(filact[0]?.length).fill(0);
  if (ewm) {
    // @ts-ignore
    return res.map((s, i) => arrayIndexSum(filact, timeS, i));
  } else {
    filact = filact.slice(0, hl);
    // @ts-ignore
    return res.map((s, i) => arrayIndexSumNormal(filact, i));
  }
}

export function parse(
  storedKey: string,
  aid: string,
  sport: string = "Run",
  ewm: boolean = true,
  hl: number,
): pactivity | undefined {
  console.log(storedKey, aid);
  let acts = getActivities(0, 7 * 4, storedKey, aid);
  if (acts != undefined) {
    console.log(acts?.map((t) => t.type));
    let facts = acts.filter((s) => s.type == sport);
    if (sport == "Combined") {
      facts = acts;
    }
    let tacts = facts.map((s) => daysSince(new Date(s.start_date_local)));
    console.log(tacts);
    let pzt = collapseZones(
      parseActivites(facts, tacts, "pace_zone_times", ewm, hl),
    );
    let hzt = collapseZones(
      parseActivites(facts, tacts, "icu_hr_zone_times", ewm, hl),
    );
    let gzt = collapseZones(
      parseActivites(facts, tacts, "gap_zone_times", ewm, hl),
    );
    let pozt = collapseZones(parseActivitesPower(facts, tacts, ewm, hl));
    console.log([pzt, hzt, gzt, pozt]);
    let combined = [0, 1, 2].map((t) =>
      arrayIndexSumNormal([pzt, hzt, gzt, pozt], t),
    );

    return {
      pace_zone_times: pzt,
      icu_hr_zone_times: hzt,
      gap_zone_times: gzt,
      icu_zone_times: pozt,
      combined: combined,
      acts: facts,
    };
  }
}

export function collapseZones(zoneTimes: number[]) {
  console.log(zoneTimes);
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

function solve(map: number[], t: number, i: number = 0) {
  const targetMap0 = t * map.reduce((sum, value) => sum + value, 0);
  return (targetMap0 - map[i]) / (1 - t) / 60;
}

export default function ZoneScreen() {
  const { storedKey, storedAid } = useStoredKey();
  const [value, setValue] = useState<number | null>(null); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility
  const [ewmvalue, setEwmValue] = useState<number | null>(null); // Initialize state for selected value
  const [checked, setChecked] = useState(false);
  if (storedKey == undefined) {
    return <></>;
  }
  const itemsAct = [
    { label: "Run", value: 1 },
    { label: "Ride", value: 2 },
    { label: "Swim", value: 3 },
    { label: "Combined", value: 4 },
  ];
  let type = value != null ? itemsAct[value - 1].label : "Combined";

  let summary = parse(storedKey, storedAid, type, checked, ewmvalue ?? 14);
  console.log(summary);
  if (summary == undefined) {
    return <></>;
  }
  let types: (keyof pactivity)[] = [
    "combined",
    "pace_zone_times",
    "gap_zone_times",
    "icu_zone_times",
    "icu_hr_zone_times",
  ];
  let nameMap = ["Combined", "Pace zone", "Gap zone", "Power zone", "Hr zone"];
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={[styles.dcontainer]}>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={1}
          maximumValue={7 * 4}
          value={14}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#FFFFFF"
          onValueChange={(value) => setEwmValue(value)}
        />
        <Text>{Math.round(ewmvalue ?? 14)}</Text>
        <Checkbox
          status={checked ? "checked" : "unchecked"}
          onPress={() => {
            setChecked(!checked);
          }}
        />
        <DropDownPicker
          open={open}
          value={value}
          items={itemsAct}
          setOpen={setOpen}
          setValue={setValue}
          placeholder="Select a type"
          dropDownContainerStyle={{
            zIndex: 1000,
            elevation: 1000,
            backgroundColor: "white",
          }}
        />
      </View>
      <View style={styles.container}>
        {types
          .filter((s) => !Number.isNaN(summary[s][0]))
          .map((s) => {
            let zones = toPrecent(summary[s]);
            let needed = solve(summary[s], 0.8) / 60;
            console.log(s, needed);
            let solved =
              (needed > 0 ? "" : "-") + hourToString(Math.abs(needed));
            return (
              <ChartComponent
                title={
                  type +
                  " " +
                  nameMap[types.indexOf(s)].toString() +
                  " " +
                  solved.toString()
                }
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
