import { ScrollView, StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import ChartComponent, { fetchToJson } from "@/components/chatComp";
import { useQuery } from "@tanstack/react-query";

interface sportInfo {
  type: string;
  eftp: number;
}
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
interface wellness {
  sleepSecs: number;
  atl: number; // acute
  ctl: number; // chronic
  hrv: number;
  rampRate: number;
  restingHR: number;
  weight: number;
  sportInfo: sportInfo[];
  [key: string]: any; // This allows for any other unknown properties
}
export function getWellness(n: number, apiKey: string | null) {
  let date = new Date();
  console.log(apiKey);
  date.setDate(date.getDate() - n);
  let isodate = date.toISOString().slice(0, 10);

  const { data: data } = useQuery(
    ["wellness", isodate],
    () =>
      fetchToJson<wellness>(
        "https://intervals.icu/api/v1/athlete/i174646/wellness/" + isodate,
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
export function quantile(data: number[], q: number): number {
  if (q < 0 || q > 1) {
    throw new Error("Quantile value must be between 0 and 1");
  }

  // Sort the data in ascending order
  const sortedData = [...data].sort((a, b) => a - b);
  const n = sortedData.length;

  // If the array is empty, return NaN
  if (n === 0) {
    return NaN;
  }

  // Compute the position of the quantile
  const pos = (n - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);

  // If the position is an integer, return the value directly
  if (lower === upper) {
    return sortedData[lower];
  }

  // Interpolate between the lower and upper positions
  const weight = pos - lower;
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

export function hourToString(h: number) {
  // gets time as HH:SS from hours as decimal
  let whole = new Date(1970, 0, 1);
  whole.setSeconds(h * 60 * 60);
  return whole.toTimeString().slice(0, 5);
}
export function wattPer(t: "Run" | "Ride", data: wellness | undefined) {
  let weight = data?.weight;
  let eftp = data?.sportInfo.find((s) => s.type == t)?.eftp ?? 0;
  return eftp / (weight == undefined ? 73.0 : weight);
}
export function weekHealth(apiKey: string | null) {
  let hrv: number[] = [];
  for (let i = 0; i < 8; i++) {
    let data = getWellness(i, apiKey);
    hrv.push(data == undefined ? 90 : data.hrv);
  }
  return hrv;
}

export default function TabOneScreen() {
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

  const data = getWellness(0, storedKey);
  const hrv = weekHealth(storedKey);
  let form =
    data != undefined ? Math.round(data.ctl) - Math.round(data.atl) : 0;
  let formPer = data != undefined ? (form * 100) / Math.round(data.ctl) : 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.title}>Status</Text>
      <ChartComponent
        title={"HRV"}
        progress={data != undefined ? data.hrv : 0}
        zones={[
          {
            text: "Below",
            startVal: quantile(hrv, 0.05),
            endVal: quantile(hrv, 0.2),
            color: "#FFCB0E80",
          },
          {
            text: "Normal",
            startVal: quantile(hrv, 0.2),
            endVal: quantile(hrv, 0.7),
            color: "#009E0066",
          },
          {
            text: "Elevated",
            startVal: quantile(hrv, 0.7),
            endVal: quantile(hrv, 0.95),
            color: "#FFCB0E80",
          },
        ]}
        transform={(n) =>
          (n - quantile(hrv, 0.05)) /
          (quantile(hrv, 0.95) - quantile(hrv, 0.05))
        }
      ></ChartComponent>
      <ChartComponent
        title={"Ramprate q"}
        progress={data != undefined ? data.rampRate : 0}
        zones={[
          {
            text: "0-0.2",
            startVal: -2.5,
            endVal: -0.53,
            color: "#1F77B44D",
          },
          {
            text: "0.2-0.7",
            startVal: -0.53,
            endVal: 0.78,
            color: "#009E0066",
          },
          {
            text: "0.7-0.9",
            startVal: 0.78,
            endVal: 1.43,
            color: "#FFCB0E80",
          },
          {
            text: "0.9-1",
            startVal: 1.43,
            endVal: 2,
            color: "#D627284D",
          },
        ]}
        transform={(n) => (n + 2.5) / (2.5 + 2)}
      ></ChartComponent>
      <ChartComponent
        title={"ACWR"}
        progress={data != undefined ? data.atl / data.ctl : 1}
        zones={[
          {
            text: "Low",
            startVal: 0,
            endVal: 0.8,
            color: "#1F77B44D",
          },
          {
            text: "Optimal",
            startVal: 0.8,
            endVal: 1.3,
            color: "#009E0066",
          },
          {
            text: "High",
            startVal: 1.3,
            endVal: 1.5,
            color: "#FFCB0E80",
          },
          {
            text: "Very high",
            startVal: 1.5,
            endVal: 2,
            color: "#D627284D",
          },
        ]}
        transform={(n) => n / 2.0}
      ></ChartComponent>
      <ChartComponent
        title={"Sleep"}
        progress={data != undefined ? data.sleepSecs / 3600 : 5}
        indicatorTextTransform={hourToString}
        zones={[
          {
            text: "4-5 Hours",
            startVal: 4,
            endVal: 5,
            color: "#DD04A74D",
          },
          {
            text: "5-6 Hours",
            startVal: 5,
            endVal: 6,
            color: "#FFCB0E80",
          },
          {
            text: "6-7 Hours",
            startVal: 6,
            endVal: 7,
            color: "#C8F509A8",
          },
          {
            text: "7-8 Hours",
            startVal: 6,
            endVal: 7,
            color: "#009E0057",
          },
          {
            text: "8-9 Hours",
            startVal: 8,
            endVal: 9,
            color: "#009E0099",
          },
          {
            text: "9-10 Hours",
            startVal: 9,
            endVal: 10,
            color: "#1D00CCFF",
          },
        ]}
        transform={(n) => (n - 4) / 6}
      ></ChartComponent>
      <ChartComponent
        title={"Form"}
        progress={-form}
        zones={[
          {
            text: "Transition",
            startVal: -30,
            endVal: -20,
            color: "#FFCB0E80",
          },
          {
            text: "Fresh",
            startVal: -20,
            endVal: -5,
            color: "#1F77B44D",
          },
          {
            text: "Gray zone",
            startVal: -5,
            endVal: 10,
            color: "rgba(196,196,196,0.66)",
          },
          {
            text: "Optimal",
            startVal: 10,
            endVal: 30,
            color: "#009E0066",
          },
          {
            text: "High Risk",
            startVal: 30,
            endVal: 60,
            color: "#D627284D",
          },
        ]}
        transform={(n) => (n + 30) / 90}
        indicatorTextTransform={(n) => -n}
      ></ChartComponent>
      <ChartComponent
        title={"Form %"}
        progress={-formPer}
        zones={[
          {
            text: "Transition",
            startVal: -30,
            endVal: -20,
            color: "#FFCB0E80",
          },
          {
            text: "Fresh",
            startVal: -20,
            endVal: -5,
            color: "#1F77B44D",
          },
          {
            text: "Gray zone",
            startVal: -5,
            endVal: 10,
            color: "rgba(196,196,196,0.66)",
          },
          {
            text: "Optimal",
            startVal: 10,
            endVal: 30,
            color: "#009E0066",
          },
          {
            text: "High Risk",
            startVal: 30,
            endVal: 60,
            color: "#D627284D",
          },
        ]}
        transform={(n) => (n + 30) / 90}
        indicatorTextTransform={(n) => -n.toPrecision(3).toString() + "%"}
      ></ChartComponent>
      <ChartComponent
        title={"Running eftp/kg"}
        progress={data != undefined ? wattPer("Run", data) : 0}
        zones={[
          {
            text: "Very Poor (20%)",
            startVal: 1.4,
            endVal: 1.9,
            color: "rgba(180,31,31,0.3)",
          },
          {
            text: "Poor (30%)",
            startVal: 1.9,
            endVal: 2.6,
            color: "rgba(255,69,0,0.4)",
          },
          {
            text: "Untrained (40%)",
            startVal: 2.6,
            endVal: 3.2,
            color: "rgba(255,165,0,0.5)",
          },
          {
            text: "Fair (50%)",
            startVal: 3.2,
            endVal: 3.8,
            color: "rgba(255,215,0,0.6)",
          },
          {
            text: "Recreational (60%)",
            startVal: 3.8,
            endVal: 4.5,
            color: "rgba(0,128,0,0.6)",
          },
          {
            text: "Regional (70%)",
            startVal: 4.5,
            endVal: 5.1,
            color: "rgba(0,100,0,0.6)",
          },
          {
            text: "National (80%)",
            startVal: 5.1,
            endVal: 5.8,
            color: "rgba(65,105,225,0.7)",
          },
          {
            text: "International (90%)",
            startVal: 5.8,
            endVal: 6.4,
            color: "rgba(30,144,255,0.7)",
          },
          {
            text: "World Class (100%)",
            startVal: 6.4,
            endVal: 7,
            color: "rgba(138,43,226,0.7)",
          },
        ]}
        transform={(n) => (n - 1.4) / (7 - 1.4)}
        indicatorTextTransform={(n) => n.toPrecision(3).toString() + "W/kg"}
      ></ChartComponent>
      <ChartComponent
        title={"Ride eftp/kg"}
        progress={data != undefined ? wattPer("Ride", data) : 0}
        zones={[
          {
            text: "Untrained",
            startVal: 1.78,
            endVal: 2.3,
            color: "rgba(255,165,0,0.5)",
          },
          {
            text: "Fair",
            startVal: 2.3,
            endVal: 2.92,
            color: "rgba(255,215,0,0.6)",
          },
          {
            text: "Moderate",
            startVal: 2.93,
            endVal: 3.46,
            color: "rgba(0,128,0,0.6)",
          },
          {
            text: "Good",
            startVal: 3.46,
            endVal: 4.08,
            color: "rgba(0,100,0,0.6)",
          },
          {
            text: "Very Good",
            startVal: 4.08,
            endVal: 4.61,
            color: "rgba(65,105,225,0.7)",
          },
          {
            text: "Excellent",
            startVal: 4.61,
            endVal: 5.14,
            color: "rgba(30,144,255,0.7)",
          },
          {
            text: "Exceptional",
            startVal: 5.14,
            endVal: 5.69,
            color: "rgba(138,43,226,0.7)",
          },
        ]}
        transform={(n) => (n - 1.78) / (5.69 - 1.78)}
        indicatorTextTransform={(n) => n.toPrecision(3).toString() + "W/kg"}
      ></ChartComponent>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // To ensure scrolling area has enough space at the bottom
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
