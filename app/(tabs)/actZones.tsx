import React, { useState } from "react";
import { Text } from "@/components/Themed";
import { ScrollView, StyleSheet, View } from "react-native";
import { daysSince, hourToString } from "@/components/utils/_utils";
import ChartComponent from "@/components/components/_chatComp";
import {
  activity,
  getActivities,
  getSettings,
  getStravaActivities,
  getStream,
  powerzone,
  settings,
  stream,
} from "@/components/utils/_fitnessModel";
import { useSettings } from "@/components/utils/_keyContext";
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
    return res.map((s, i) => arrayIndexSum(filact, timeS, i, hl));
  } else {
    // @ts-ignore
    return res.map((s, i) => arrayIndexSumNormal(filact, i));
  }
}

export function parse(
  acts: activity[],
  sport: string = "Run",
  ewm: boolean = true,
  hl: number,
): pactivity {
  let facts = acts.filter((s) => s.type == sport);
  if (sport == "Combined") {
    facts = acts;
  }
  let tacts = facts.map((s) => daysSince(new Date(s.start_date_local)));

  if (!ewm) {
    facts = facts.filter((s) => daysSince(new Date(s.start_date_local)) <= hl);
  }
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

function solve(map: number[], t: number, i: number = 0) {
  const targetMap0 = t * map.reduce((sum, value) => sum + value, 0);
  return (targetMap0 - map[i]) / (1 - t) / 60;
}

interface zone {
  type: string;
  zones: number[];
}

export function getDataForType(
  settings: settings,
  sport: string,
  attribute: string[],
): zone[] {
  let setting = settings?.sportSettings.filter(
    (t) =>
      t.types.find((t) => {
        return t == sport;
      }) != null,
  )[0];
  let available = [
    ["ftp", "power_zones", "watts"],
    ["threshold_pace", "pace_zones", "velocity_smooth"],
    ["max_hr", "hr_zones", "heartrate"],
  ]
    .filter((t) => setting[t[0]] != null && setting[t[0]] != undefined)
    .filter((t) => attribute.findIndex((k) => k == t[2]) != -1);

  return available.map((t): zone => {
    let value: number = setting[t[0]];
    let prec: number[] = setting[t[1]];

    return {
      type: t[2],
      zones: prec.map((k) => (k / 100) * value),
    };
  });
}

export function streamToZone(
  acts: activity[],
  streams: stream[],
  settings: settings,
): zone[][] {
  return streams.map((stream, i): zone[] => {
    let available = ["heartrate", "watts", "velocity_smooth"].filter((t) =>
      stream.hasOwnProperty(t),
    );
    let zoneData = getDataForType(settings, acts[i]?.type ?? "Ride", available);
    return zoneData.map((zone): zone => {
      let result: number[] = Array(zone.zones.length).fill(0);
      const { data } = stream[zone.type];
      for (const powerValue of data) {
        let zoneIndex = zone.zones.findIndex(
          (threshold) => powerValue < threshold,
        );
        if (zoneIndex === -1) {
          zoneIndex = zone.zones.length - 1;
        }
        result[zoneIndex] += 1;
      }
      return {
        type: zone.type,
        zones: result,
      };
    });
  });
}

export function mergeStravaIntervals(
  acts: activity[],
  timeData: zone[][],
): activity[] {
  // @ts-ignore
  return acts.map((t, i) => {
    const powerZone: powerzone[] | undefined = timeData[i]
      .find((t) => t.type == "watts")
      ?.zones.map((zone) => {
        return { id: "", secs: zone };
      });
    const paceZone: number[] | undefined = timeData[i].find(
      (t) => t.type == "velocity_smooth",
    )?.zones;
    const hrZone: number[] | undefined = timeData[i].find(
      (t) => t.type == "heartrate",
    )?.zones;

    return {
      id: "",
      _note: null,
      start_date_local: t.start_date_local,
      type: t.type,
      pace_zone_times: paceZone,
      icu_hr_zone_times: hrZone,
      gap_zone_times: paceZone,
      icu_zone_times: powerZone,
      icu_training_load: 0,
      moving_time: t.moving_time,
      pace: 0,
    };
  });
}

export default function ZoneScreen() {
  const { settings } = useSettings();

  const [value, setValue] = useState<number | null>(null); // Initialize state for selected value
  const [open, setOpen] = useState(false); // State for dropdown visibility
  const [ewmvalue, setEwmValue] = useState<number | null>(null); // Initialize state for selected value
  const [checked, setChecked] = useState(false);
  const itemsAct = [
    { label: "Run", value: 1 },
    { label: "Ride", value: 2 },
    { label: "Swim", value: 3 },
    { label: "Combined", value: 4 },
  ];
  let types: (keyof pactivity)[] = [
    "combined",
    "pace_zone_times",
    "gap_zone_times",
    "icu_zone_times",
    "icu_hr_zone_times",
  ];
  let nameMap = ["Combined", "Pace zone", "Gap zone", "Power zone", "Hr zone"];
  let type = value != null ? itemsAct[value - 1].label : "Combined";
  console.log("token", settings.stravaToken);
  let acts = getActivities(0, 7 * 4, settings);
  let isettings = getSettings(settings);
  const iacts = acts?.filter((t) => t._note != null) || [];
  const streamData = getStream(
    iacts.map((t) => t.id),
    ["watts", "heartrate", "velocity_smooth"],
    settings.stravaToken,
  );
  const sacts = getStravaActivities(
    iacts.map((t) => t.id),
    settings.stravaToken,
  );

  if (!settings.apiKey || !settings.aid || !acts || !isettings) {
    return (
      <Text>
        {settings.apiKey}
        {settings.aid}
      </Text>
    );
  }
  if (streamData && sacts) {
    let rideData = streamToZone(sacts, streamData, isettings);
    acts = [
      ...acts.filter((t) => t._note == null),
      ...mergeStravaIntervals(sacts, rideData),
    ];
  } else {
    acts = [...acts.filter((t) => t._note == null)];
  }
  let summary = parse(acts, type, checked, ewmvalue ?? 14);

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
            let distr = [0.8, 0.15, 0.05]; // Pyramidical
            let res = zones.map((t, i) => solve(summary[s], distr[i], i) / 60);
            let pi = Math.log10((zones[0] / zones[1]) * zones[2] * 100);
            let needed = res.find((t) => t > 0) ?? 0;
            let zoneText = "Z" + (res.findIndex((t) => t > 0) + 1);
            let solved = zoneText + " " + hourToString(Math.abs(needed));
            return (
              <ChartComponent
                title={nameMap[types.indexOf(s)].toString()}
                progress={0.8}
                subtitle={
                  solved.toString() +
                  " PI=" +
                  pi.toFixed(2) +
                  " " +
                  zones.map((t) => Math.round(t * 100)).join("/")
                }
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
