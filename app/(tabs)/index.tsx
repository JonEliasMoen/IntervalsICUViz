import { StyleSheet } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import ChartComponent, { fetchToJson } from "@/components/chatComp";
import { useQuery } from "@tanstack/react-query";
interface sportInfo {
  type: string;
  eftp: number;
}
import { quantile } from "simple-statistics";
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
export function weekHealth() {
  let hrv: number[] = [];
  for (let i = 0; i < 8; i++) {
    let data = getWellness(i, "");
    hrv.push(data == undefined ? 90 : data.hrv);
  }
  console.log(hrv);
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
  let form =
    data != undefined ? Math.round(data.ctl) - Math.round(data.atl) : 0;
  let formPer = data != undefined ? (form * 100) / Math.round(data.ctl) : 0;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Status</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
