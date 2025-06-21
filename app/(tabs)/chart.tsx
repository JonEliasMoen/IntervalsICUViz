// components/Chart.tsx
import { ScrollView, Text } from "react-native";

import React from "react";
import { getWellnessRange } from "@/components/utils/_fitnessModel";
import { useStoredKey } from "@/components/utils/_keyContext";
import LineChartComp from "@/components/components/_lineChartComp";
import { dateOffset } from "@/components/utils/_utils";
import { wellnessWrapper } from "@/components/classes/_wellnessWrapper";

export default function Chart() {
  const { storedKey, storedAid } = useStoredKey();
  const dataLong = getWellnessRange(0, 42, storedKey, storedAid) ?? [];
  // 1440/
  if (dataLong.length == 0 && dataLong != undefined) {
    return <Text>Loading</Text>;
  }
  let wRap = new wellnessWrapper(dataLong);
  let a = dataLong.map((t) => t.atl);
  let b = dataLong.map((t) => t.ctl);
  let labels = b.map((a, i) => {
    return dateOffset(b.length - i - 1)
      .toString()
      .slice(4, 4 + 6);
  });
  console.log(labels);
  // @ts-ignore
  return (
    <ScrollView>
      <LineChartComp
        lineData={{
          lines: [
            { data: a, color: "red", label: "ATL" },
            { data: b, color: "blue", label: "CTL" },
          ],
          title: "Acute chronic",
          xLabels: labels,
        }}
      ></LineChartComp>
      <LineChartComp
        lineData={{
          lines: [
            { data: wRap.acwr.acwrT, color: "red", label: "ACR" },
            {
              data: wRap.rampRate.rampT,
              color: "blue",
              label: "Ramp rate",
              isScaled: true,
            },
          ],
          title: "Acute chronic Workload ratio",
          xLabels: labels,
        }}
      ></LineChartComp>
      <LineChartComp
        lineData={{
          lines: [
            { data: wRap.readiness.value, color: "blue", label: "Readiness" },
            { data: wRap.hrv.hrvT, color: "red", label: "HRV", isScaled: true },
            {
              data: wRap.rhr.getTransformed(),
              color: "purple",
              label: "RHR",
              isScaled: true,
            },
            {
              data: wRap.sleepScore.sleepScoreT,
              color: "orange",
              label: "Sleep score",
              isScaled: true,
            },
            {
              data: wRap.sleep.sleepT,
              color: "black",
              label: "Sleep secs",
              isScaled: true,
            },
          ],
          title: "Health data",
          xLabels: labels,
        }}
      ></LineChartComp>
    </ScrollView>
  );
}
