import {
  fetchToJson,
  getTimeHHMM,
  isoDateOffset,
  secondsSinceStartOfDay,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@/components/Themed";
import { StyleSheet } from "react-native";
import ChartComponent, { zone } from "@/components/components/_chatComp";
import React from "react";

interface TideEntry {
  height: number;
  time: string; // ISO 8601 timestamp
  type: "low" | "high";
}

interface TideStation {
  distance: number;
  lat: number;
  lng: number;
  name: string;
  source: string;
}

interface TideMeta {
  cost: number;
  dailyQuota: number;
  datum: string;
  end: string; // "YYYY-MM-DD HH:mm"
  lat: number;
  lng: number;
  offset: number;
  requestCount: number;
  start: string; // "YYYY-MM-DD HH:mm"
  station: TideStation;
}

interface TideData {
  data: TideEntry[];
  meta: TideMeta;
}

export function getTide2(lat: number, long: number) {
  let start = isoDateOffset(0);
  let end = isoDateOffset(-1);
  console.log(start, end);
  const { data: data } = useQuery(
    ["tide2", lat.toFixed(0), long.toFixed(0)],
    () =>
      fetchToJson<TideData>(
        `https://yrweatherbackend.vercel.app/stormglass/v2/tide/extremes/point?start=${start}&end=${end}&lat=${lat}&lng=${long}`,
        {
          method: "GET",
        },
      ),
    {
      cacheTime: 30 * 60 * 1000,
      staleTime: 30 * 60 * 1000,
      retry: false,
    },
  );
  return data;
}

export function TideLocationGlobal(props: {
  lat: number;
  long: number;
  now: Date;
}) {
  let raw = getTide2(props.lat, props.long);
  // const raw: TideData = {
  //   data: [
  //     {
  //       height: -0.8865135185002665,
  //       time: "2025-09-10T05:04:00+00:00",
  //       type: "low",
  //     },
  //     {
  //       height: 0.5405793330290688,
  //       time: "2025-09-10T11:26:00+00:00",
  //       type: "high",
  //     },
  //     {
  //       height: -0.7910657257619506,
  //       time: "2025-09-10T17:18:00+00:00",
  //       type: "low",
  //     },
  //     {
  //       height: 0.6291827736199677,
  //       time: "2025-09-10T23:37:00+00:00",
  //       type: "high",
  //     },
  //   ],
  //   meta: {
  //     cost: 1,
  //     dailyQuota: 10,
  //     datum: "MSL",
  //     end: "2025-09-11 00:00",
  //     lat: 60.936,
  //     lng: 5.114,
  //     offset: 0,
  //     requestCount: 9,
  //     start: "2025-09-10 00:00",
  //     station: {
  //       distance: 61,
  //       lat: 60.398,
  //       lng: 5.321,
  //       name: "station",
  //       source: "ticon3",
  //     },
  //   },
  // };
  console.log(raw);
  if (!raw) {
    return <Text>Tide Rate limit reached</Text>;
  }
  let end = 60 * 60 * 24;
  let zones: zone[] = raw.data.map((t, i, a) => {
    let conv = (t: string) => secondsSinceStartOfDay(new Date(t)) / end;
    let dt = conv(t.time);
    let next = new Date(t.time).getDay() != new Date().getDay();
    return {
      startVal: i == 0 ? 0 : conv(a[i - 1].time),
      endVal: next ? end : dt,
      text: "",
      color: t.type == "low" ? "red" : "blue",
    };
  });

  let subtext = raw.data
    .map((t) => {
      let dt = getTimeHHMM(new Date(t.time));
      return t.type + ": " + dt;
    })
    .join(" ");
  return (
    <ChartComponent
      title={"Tide Global"}
      progress={secondsSinceStartOfDay(props.now) / end}
      subtitle={subtext}
      zones={zones}
      transform={(u) => u}
      indicatorTextTransform={(u) => getTimeHHMM(props.now)}
    ></ChartComponent>
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
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10, // Adds space between text and bar
  },
  subText: {
    marginTop: -6,
    fontSize: 13,
    marginBottom: 5, // Adds space between text and bar
  },
  progressBarContainer: {
    flexDirection: "row",
    width: 200,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
    marginBottom: 15, // Adds space between progress bar and time text
  },
  section: {
    height: "100%",
  },
  redSection: {
    backgroundColor: "#FF4C4C", // Red section
  },
  yellowSection: {
    backgroundColor: "#FFD700", // Yellow section
  },
  greenSection: {
    backgroundColor: "#76C7C0", // Green section
  },
  orangeSection: {
    backgroundColor: "#FFA500", // Orange section
  },
  subtext: {
    position: "relative",
    top: -30,
    borderColor: "black",
    backgroundColor: "#fff", // Black progress indicator
  },
  progressIndicator: {
    position: "absolute",
    top: -30,
    width: 5,
    height: 20,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "#fff", // Black progress indicator
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
});

export default ChartComponent;
