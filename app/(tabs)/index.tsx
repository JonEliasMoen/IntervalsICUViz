import { ScrollView, StyleSheet } from "react-native";
import { Text } from "@/components/Themed";
import ChartComponent from "@/components/components/_chatComp";
import React from "react";
import { mean, standardDeviation } from "simple-statistics";
import quantile from "@stdlib/stats-base-dists-normal-quantile";
import { hourToString } from "@/components/utils/_utils";
import { useStoredKey } from "@/components/utils/_keyContext";
import { getWellnessRange, wellness } from "@/components/utils/_fitnessModel";

interface wattResult {
  wattPerKg: number;
  kg: number;
  watt: number;
  title: string;
}

export function wattPer(t: "Run" | "Ride", data: wellness[]): wattResult {
  let weight = mean(data.filter((t) => t.weight != null).map((t) => t.weight));
  let eftp =
    data[data.length - 1].sportInfo.find((s) => s.type == t)?.eftp ?? 0;
  let text = "Kg=" + Math.round(weight) + ", W=" + Math.round(eftp);
  return {
    wattPerKg: eftp / weight,
    kg: weight,
    watt: eftp,
    title: text,
  };
}
interface strainMonotony {
  monotony: number;
  acwr: number;
  strain: number;
  strainL: number;
}
export function strainMonotony(data: wellness[]): strainMonotony {
  let load = data.map((t) => t.ctlLoad).filter((t) => t != undefined);
  let monotony =
    mean(load.slice(data.length - 7)) /
    standardDeviation(load.slice(data.length - 7));
  let monotonyL =
    mean(load.slice(data.length - 7 * 2)) /
    standardDeviation(load.slice(data.length - 7 * 2));
  let strain = monotony * mean(load.slice(data.length - 7));
  let strainL = monotonyL * mean(load.slice(data.length - 7 * 2));
  return {
    monotony: monotony,
    acwr: strain / strainL,
    strain: strain,
    strainL: strainL,
  };
}

export default function TabOneScreen() {
  const { storedKey, storedAid } = useStoredKey();
  const dataLong = getWellnessRange(0, 14, storedKey, storedAid) ?? [];
  const dataWeek = dataLong.slice(dataLong.length - 9);
  console.log(dataLong);
  if (dataLong.length == 0 && dataLong != undefined) {
    return <Text>Loading</Text>;
  }
  if (dataWeek.length == 0 && dataWeek != undefined) {
    return <Text>Loading</Text>;
  }
  let sAcwr = strainMonotony(dataLong);

  const data = dataWeek[dataWeek.length - 1];

  const sleep =
    dataWeek
      .filter((s) => s.sleepSecs != 0 && s.sleepSecs != null)
      .map((s) => s.sleepSecs)
      .at(-1) ?? 0;
  console.log(sleep);
  let hrv = dataWeek
    .filter((s) => s.hrv != 0 && s.hrv != null)
    .map((t) => t.hrv);
  if (hrv.length == 0) {
    hrv = [90, 100];
  }
  let form = data != undefined ? Math.round(data.ctl - data.atl) : 0;
  let formPer =
    data != undefined
      ? Math.round(((data.ctl - data.atl) * 100) / data.ctl)
      : 0;

  let hmean = mean(hrv);
  let hstd = standardDeviation(hrv);
  let hq = (q: number) => {
    return quantile(q, hmean, hstd);
  };
  console.log("Sleep", hrv[hrv.length - 1], sleep);

  let rideEftp = wattPer("Ride", dataWeek);
  let runEftp = wattPer("Run", dataWeek);
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.title}>Status</Text>
      <ChartComponent
        title={"Montony"}
        progress={sAcwr.monotony ?? 0}
        zones={[
          {
            text: "Very Low (0-0.8)",
            startVal: 0.0,
            endVal: 0.8,
            color: "rgb(255,0,0)", // Red
          },
          {
            text: "Low",
            startVal: 0.8,
            endVal: 1.0,
            color: "#FFCB0E80", // Yellow
          },
          {
            text: "Normal (1-1.5)",
            startVal: 1.0,
            endVal: 1.5,
            color: "#009E0066", // Green
          },
          {
            text: "High (1.5-2)",
            startVal: 1.5,
            endVal: 2.0,
            color: "#FFCB0E80", // Yellow
          },
          {
            text: "Very High (2-3)",
            startVal: 2.0,
            endVal: 3.0, // Arbitrary upper bound
            color: "rgb(255,0,0)", // Red
          },
        ]}
        transform={(n) => n / 3}
      />
      <ChartComponent
        title={"Strain ACWR"}
        progress={sAcwr.acwr}
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
        title={"HRV"}
        display={() => hrv[hrv.length - 1] != null}
        progress={hrv[hrv.length - 1] ?? 0}
        zones={[
          {
            text: "Low",
            startVal: hq(0.05),
            endVal: hq(0.1),
            color: "rgb(255,0,0)",
          },
          {
            text: "Below",
            startVal: hq(0.1),
            endVal: hq(0.2),
            color: "#FFCB0E80",
          },
          {
            text: "Normal",
            startVal: hq(0.2),
            endVal: hq(0.85),
            color: "#009E0066",
          },
          {
            text: "Elevated",
            startVal: hq(0.85),
            endVal: hq(0.95),
            color: "#FFCB0E80",
          },
        ]}
        transform={(n) =>
          hq(0.95) - hq(0.05) != 0 ? (n - hq(0.05)) / (hq(0.95) - hq(0.05)) : 0
        }
      ></ChartComponent>
      <ChartComponent
        title={`Ramprate q`}
        progress={data.rampRate}
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
        progress={data.atl / data.ctl}
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
        display={() => sleep != 0 && sleep != null}
        progress={sleep != null ? sleep / 3600 : 5}
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
            startVal: 7,
            endVal: 8,
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
        indicatorTextTransform={(n) =>
          n != null ? -n.toPrecision(3).toString() + "%" : ""
        }
      ></ChartComponent>
      <ChartComponent
        title={"Running eftp/kg"}
        progress={runEftp.wattPerKg}
        subtitle={runEftp.title}
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
        indicatorTextTransform={(n) =>
          n != null ? n.toPrecision(3).toString() + "W/kg" : ""
        }
      ></ChartComponent>
      <ChartComponent
        title={"Ride eftp/kg"}
        progress={rideEftp.wattPerKg}
        subtitle={rideEftp.title}
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
        indicatorTextTransform={(n) =>
          n != null ? n.toPrecision(3).toString() + "W/kg" : ""
        }
      ></ChartComponent>
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
