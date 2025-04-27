import { ScrollView, StyleSheet } from "react-native";
import { Text } from "@/components/Themed";
import ChartComponent from "@/components/components/_chatComp";
import React from "react";
import { mean, standardDeviation } from "simple-statistics";
import quantile from "@stdlib/stats-base-dists-normal-quantile";
import { hourToString, sLong, sShort } from "@/components/utils/_utils";
import { useStoredKey } from "@/components/utils/_keyContext";
import {
  activity,
  getActivities,
  getWellnessRange,
  groupByWeek,
  wellness,
} from "@/components/utils/_fitnessModel";
import { ChartComponentQuantile } from "@/components/components/_chatCompQuantile";

interface wattResult {
  wattPerKg: number;
  kg: number;
  watt: number;
  title: string;
}

export function wattPer(t: "Run" | "Ride", data: wellness[]): wattResult {
  let weightData = data.filter((t) => t.weight != null).map((t) => t.weight);
  let weight = mean(weightData.length > 0 ? weightData : [70]);
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
  let length = 7;
  let load = data.map((t) => t.ctlLoad).filter((t) => t != undefined);
  let monotony =
    mean(load.slice(data.length - sShort)) /
    standardDeviation(load.slice(data.length - sShort));
  let monotonyL =
    mean(load.slice(data.length - sLong)) /
    standardDeviation(load.slice(data.length - sLong));
  let strain = monotony * mean(load.slice(data.length - sShort));
  let strainL = monotonyL * mean(load.slice(data.length - sLong));
  return {
    monotony: monotony,
    acwr: strain / strainL,
    strain: strain,
    strainL: strainL,
  };
}
export function strainMonotonyList(load: number[]): strainMonotony {
  let monotony =
    mean(load.slice(load.length - sShort)) /
    standardDeviation(load.slice(load.length - sShort));
  let monotonyL =
    mean(load.slice(load.length - sLong)) /
    standardDeviation(load.slice(load.length - sLong));
  let strain = monotony * mean(load.slice(load.length - sShort));
  let strainL = monotonyL * mean(load.slice(load.length - sLong));
  return {
    monotony: monotony,
    acwr: strain / strainL,
    strain: strain,
    strainL: strainL,
  };
}
export function groupbyWeekDistance(acts: activity[], sport: string): number[] {
  let facts = acts.filter((t) => t.type == sport);
  let wacts = groupByWeek(facts);
  /*  let test = wacts
    .map((t) =>
      t
        .map((a) => {
          return a.distance / 1000;
        })
        .reduce((a, b) => a + b),
    )
    .map((t, i, a) => t / (a[i + 1] ?? 1));
  console.log("test", test.slice(0, test.length - 1));
  return test;*/
  return wacts.map((t) =>
    t
      .map((a) => {
        return a.distance / 1000;
      })
      .reduce((a, b) => a + b),
  );
}

export default function TabOneScreen() {
  const { storedKey, storedAid } = useStoredKey();
  const dataLong = getWellnessRange(0, 42, storedKey, storedAid) ?? [];
  const acts = getActivities(0, 42, storedKey, storedAid);

  const dataWeek = dataLong.slice(dataLong.length - 9);
  const dataMonth = dataLong.slice(dataLong.length - 7 * 4);
  if (dataLong.length == 0 && dataLong != undefined) {
    return <Text>Loading</Text>;
  }
  if (dataWeek.length == 0 && dataWeek != undefined) {
    return <Text>Loading</Text>;
  }
  if (acts == undefined) {
    return <Text>Loading</Text>;
  }
  let distances = groupbyWeekDistance(acts, "Run").slice(0, 3);
  let sAcwr = strainMonotony(dataLong.slice(dataLong.length - 28));
  let acwr = dataLong.map((t) => t.atl / t.ctl);

  const data = dataWeek[dataWeek.length - 1];

  const sleep =
    dataLong
      .filter((s) => s.sleepSecs != 0 && s.sleepSecs != null)
      .map((s) => s.sleepSecs)
      .at(-1) ?? 0;
  const sleepScore =
    dataLong
      .filter((s) => s.sleepScore != 0 && s.sleepScore != null)
      .map((s) => s.sleepScore)
      .at(-1) ?? 0;
  const vo2max =
    dataLong
      .filter((s) => s.vo2max != 0 && s.vo2max != null)
      .map((s) => s.vo2max)
      .at(-1) ?? 0;
  const restingHrI =
    dataLong
      .filter((s) => s.restingHR != 0 && s.restingHR != null)
      .map((s) => s.restingHR)
      .at(-1) ?? 0;

  let hrv = dataMonth
    .filter((s) => s.hrv != 0 && s.hrv != null)
    .map((t) => t.hrv);
  if (hrv.length == 0) {
    hrv = [90, 100];
  }
  let restingHr = dataMonth
    .filter((s) => s.restingHR != 0 && s.restingHR != null)
    .map((t) => t.restingHR);
  if (restingHr.length == 0) {
    restingHr = [90, 100];
  }
  let weight = dataMonth
    .filter((s) => s.weight != 0 && s.weight != null)
    .map((t) => t.weight);
  if (weight.length == 0) {
    restingHr = [90, 100];
  }

  let form = data != undefined ? Math.round(data.ctl - data.atl) : 0;
  let formPer =
    data != undefined
      ? Math.round(((data.ctl - data.atl) * 100) / data.ctl)
      : 0;
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
            color: "#D627284D", // Red
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
            color: "#D627284D", // Red
          },
        ]}
        transform={(n) => n / 3}
      />
      <ChartComponentQuantile
        title={"Distance running"}
        values={distances}
        progress={distances[0]}
        zones={[
          // Low weekly distance -> bad (red)
          { text: "Low", startVal: 0, endVal: 0.2, color: "#D627284D" },

          // Below average -> not great (orange)
          {
            text: "Below Average",
            startVal: 0.2,
            endVal: 0.4,
            color: "#FFCB0E80",
          },

          // Normal -> okay/good (light green)
          {
            text: "Normal",
            startVal: 0.4,
            endVal: 0.7,
            color: "#009E0066",
            normal: true,
          },

          // High -> better (green)
          { text: "High", startVal: 0.7, endVal: 0.9, color: "#FFCB0E80" },

          // Very High -> very good, but could also be caution if *extreme*
          { text: "Very High", startVal: 0.9, endVal: 1, color: "#D627284D" }, // dark green
        ]}
        indicatorTextTransform={(t, q) =>
          t.toFixed(2) + "km " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
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
      <ChartComponentQuantile
        values={hrv}
        title={"HRV (rMSSD)"}
        display={() => hrv[hrv.length - 1] != null}
        progress={hrv[hrv.length - 1] ?? 0}
        zones={[
          {
            text: "Low",
            startVal: 0,
            endVal: 0.1,
            color: "#D627284D",
          },
          {
            text: "Below",
            startVal: 0.1,
            endVal: 0.2,
            color: "#FFCB0E80",
          },
          {
            text: "Normal",
            startVal: 0.2,
            endVal: 0.7,
            color: "#009E0066",
            normal: true,
          },
          {
            text: "Elevated",
            startVal: 0.7,
            endVal: 1,
            color: "#1F77B44D",
          },
        ]}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "ms " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
      <ChartComponentQuantile
        values={restingHr}
        title={"Resting hr"}
        display={() => restingHr[restingHr.length - 1] != null}
        progress={restingHr[restingHr.length - 1] ?? 0}
        zones={[
          { text: "Low", startVal: 0, endVal: 0.2, color: "#1F77B44D" },
          { text: "Normal", startVal: 0.2, endVal: 0.6, color: "#009E0066" },
          {
            text: "Elevated",
            startVal: 0.6,
            endVal: 0.8,
            color: "#D627284D",
          },
        ]}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "bpm " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
      <ChartComponentQuantile
        values={weight}
        title={"Weight"}
        display={() => weight[weight.length - 1] != null}
        progress={weight[weight.length - 1]}
        zones={[
          { text: "Very Low", startVal: 0, endVal: 0.1, color: "#D627284D" },
          { text: "Low", startVal: 0.1, endVal: 0.25, color: "#FFCB0E80" },
          {
            text: "Normal",
            startVal: 0.25,
            endVal: 0.75,
            color: "#009E0066",
            normal: true,
          },
          { text: "High", startVal: 0.75, endVal: 0.9, color: "#FFCB0E80" },
          {
            text: "Very High",
            startVal: 0.9,
            endVal: 1,
            color: "#D627284D",
          },
        ]}
        indicatorTextTransform={(t, q) =>
          t.toFixed(2) + "kg " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
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
        progress={acwr[acwr.length - 1]}
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
        title={"ACWR 42d"}
        progress={mean(acwr)}
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
            endVal: 1.1,
            color: "#009E0066",
          },
          {
            text: "High",
            startVal: 1.1,
            endVal: 1.2,
            color: "#FFCB0E80",
          },
          {
            text: "Very high",
            startVal: 1.2,
            endVal: 2,
            color: "#D627284D",
          },
        ]}
        transform={(n) => n / 2.0}
      />
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
        title={"Sleep Score"}
        display={() => sleepScore != 0 && sleepScore != null}
        progress={sleepScore != null ? Math.round(sleepScore) : 0}
        indicatorTextTransform={(n) => Math.round(n) + "%"}
        zones={[
          {
            text: "Very Poor",
            startVal: 0,
            endVal: 59,
            color: "#D627284D",
          },
          {
            text: "Poor",
            startVal: 60,
            endVal: 69,
            color: "#FFCB0E80",
          },
          {
            text: "Fair",
            startVal: 70,
            endVal: 79,
            color: "#C8F509A8",
          },
          {
            text: "Good",
            startVal: 80,
            endVal: 89,
            color: "#009E0057",
          },
          {
            text: "Excellent",
            startVal: 90,
            endVal: 100,
            color: "#009E0099",
          },
        ]}
        transform={(n) => n / 100}
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
        title={"Vo2max (25-29 years)"}
        progress={vo2max}
        zones={[
          {
            text: "Very Poor",
            startVal: 20,
            endVal: 31,
            color: "rgba(180,31,31,0.3)",
          },
          {
            text: "Poor",
            startVal: 31,
            endVal: 35,
            color: "rgba(255,69,0,0.4)",
          },
          {
            text: "Fair",
            startVal: 35,
            endVal: 42,
            color: "rgba(255,165,0,0.5)",
          },
          {
            text: "Average",
            startVal: 42,
            endVal: 48,
            color: "rgba(255,215,0,0.6)",
          },
          {
            text: "Good",
            startVal: 48,
            endVal: 53,
            color: "rgba(0,128,0,0.6)",
          },
          {
            text: "Very good",
            startVal: 53,
            endVal: 59,
            color: "rgba(0,100,0,0.6)",
          },
          {
            text: "Excellent",
            startVal: 59,
            endVal: 70,
            color: "rgba(65,105,225,0.7)",
          },
          {
            text: "Elite",
            startVal: 70,
            endVal: 95,
            color: "rgba(138,43,226,0.7)",
          },
        ]}
        transform={(n) => (n - 20) / (95 - 29)}
        indicatorTextTransform={(n) =>
          n != null ? Math.round(n).toString() + "mL/kg/min" : ""
        }
      ></ChartComponent>
      <ChartComponent
        title={"Resting hr (26-35 years)"}
        progress={restingHrI}
        zones={[
          {
            text: "Poor",
            startVal: 80,
            endVal: 82,
            color: "rgba(180,31,31,0.3)",
          },
          {
            text: "Below Average",
            startVal: 82,
            endVal: 74,
            color: "rgba(255,69,0,0.4)",
          },
          {
            text: "Average",
            startVal: 74,
            endVal: 71,
            color: "rgba(255,215,0,0.6)",
          },
          {
            text: "Good",
            startVal: 71,
            endVal: 66,
            color: "rgba(0,128,0,0.6)",
          },
          {
            text: "Great",
            startVal: 66,
            endVal: 62,
            color: "rgba(0,100,0,0.6)",
          },
          {
            text: "Excellent",
            startVal: 62,
            endVal: 55,
            color: "rgba(65,105,225,0.7)",
          },
          {
            text: "Athlete",
            startVal: 55,
            endVal: 49,
            color: "rgba(30,144,255,0.7)",
          },
          {
            text: "Elite",
            startVal: 49,
            endVal: 40,
            color: "rgba(138,43,226,0.7)",
          },
        ]}
        transform={(n) => 1 - (n - 40) / (80 - 40)}
        indicatorTextTransform={(n) =>
          n != null ? Math.round(n).toString() + "bpm" : ""
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
