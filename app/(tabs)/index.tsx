import { ScrollView, StyleSheet } from "react-native";
import { Text } from "@/components/Themed";
import ChartComponent from "@/components/components/_chatComp";
import React from "react";
import { mean, standardDeviation } from "simple-statistics";
import { sLong, sShort } from "@/components/utils/_utils";
import { useStoredKey } from "@/components/utils/_keyContext";
import {
  activity,
  getActivities,
  getWellnessRange,
  groupByWeek,
  wellness,
} from "@/components/utils/_fitnessModel";
import { wellnessWrapper } from "@/components/classes/_wellnessWrapper";

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
  let load = data.map((t) => t.ctlLoad).filter((t) => t != undefined);
  let short = load.slice(data.length - sShort);
  let long = load.slice(data.length - sLong);
  let shortM = mean(short);
  let longM = mean(long);
  let monotony = shortM / standardDeviation(short);
  let monotonyL = longM / standardDeviation(long);
  let strain = monotony * shortM;
  let strainL = monotonyL * longM;
  return {
    monotony: monotony,
    acwr: strain / strainL,
    strain: strain,
    strainL: strainL,
  };
}

export function ewm(n: number[], hl: number) {
  const alpha = 1 - Math.exp(-Math.log(2) / hl);
  const res: number[] = [];
  n.forEach((v, i) => {
    if (i == 0) {
      res.push(v);
    } else {
      res.push((1 - alpha) * res[i - 1] + alpha * v);
    }
  });
  return res;
}

export function strainMonotonyEwm(tdata: wellness[]): strainMonotony {
  const varianceL = tdata.map((t) => Math.pow(t.ctlLoad - t.ctl, 2));
  const varianceS = tdata.map((t) => Math.pow(t.atlLoad - t.atl, 2));

  //console.log(varianceS);
  const stdS = Math.sqrt(ewm(varianceS, 28).at(-1) ?? 1);
  const stdL = Math.sqrt(ewm(varianceL, 42).at(-1) ?? 1);

  const monoS = tdata.at(-1)?.atl ?? 0 / stdS;
  const monoL = tdata.at(-1)?.ctl ?? 0 / stdL;

  const strainS = (tdata.at(-1)?.atl ?? 0) * monoS;
  const strainL = (tdata.at(-1)?.ctl ?? 0) * monoL;

  return {
    monotony: monoS,
    acwr: strainS / strainL,
    strain: strainS,
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
  let distances = wacts.map((t) =>
    t
      .map((a) => {
        return a.distance / 1000;
      })
      .reduce((a, b) => a + b, 0),
  );

  return distances;
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
  let distances = groupbyWeekDistance(acts, "Run");
  let sAcwr = strainMonotonyEwm(dataLong);
  let mAcwr = strainMonotony(dataLong.slice(dataLong.length - 28));

  let acwr = dataLong.map((t) => t.atl / t.ctl);

  const data = dataWeek[dataWeek.length - 1];
  let wRap = new wellnessWrapper(dataMonth);

  const vo2max =
    dataLong
      .filter((s) => s.vo2max != 0 && s.vo2max != null)
      .map((s) => s.vo2max)
      .at(-1) ?? 0;

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
      {wRap.readiness.getComponent()}
      <ChartComponent
        title={"Weekly running distance"}
        subtitle={"Last week: " + distances[1].toFixed(2) + "km"}
        progress={distances[0] / mean(distances.slice(distances.length - 5))}
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
        indicatorTextTransform={(t: number) => {
          return distances[0].toFixed(2) + "km " + t.toFixed(2);
        }}
        transform={(n) => n / 2.0}
      ></ChartComponent>
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
        title={"Strain ACR"}
        progress={mAcwr.acwr}
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
      {wRap.hrv.getComponent()}
      {wRap.rhr.getComponent()}
      {wRap.rampRate.getComponent()}
      {wRap.acwr.getComponent()}
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
      {wRap.sleep.getComponent()}
      {wRap.sleepScore.getComponent()}
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
        progress={wRap.rhr.last}
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
