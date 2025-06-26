// components/Chart.tsx
import { ScrollView, Text } from "react-native";

import React from "react";
import { getWellnessRange } from "@/components/utils/_fitnessModel";
import { useStoredKey } from "@/components/utils/_keyContext";
import LineChartComp from "@/components/components/_lineChartComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";

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
  // @ts-ignore
  return (
    <ScrollView>
      <LineChartComp
        lineData={{
          lines: [
            { y: a, color: "red", label: "ATL" },
            { y: b, color: "blue", label: "CTL" },
          ],
          title: "Acute chronic",
        }}
      ></LineChartComp>
      <LineChartComp
        attr={wRap.acwr}
        lineData={{
          lines: [
            {
              y: wRap.acwr.acwrT,
              color: "red",
              label: "ACR",
              isScaled: true,
            },
            {
              y: wRap.acwrs.acrsT,
              color: "blue",
              label: "ACRS",
              isScaled: true,
            },
            {
              y: wRap.rampRate.rampT,
              color: "blue",
              label: "Ramp rate",
              isScaled: true,
            },
          ],
          title: "Acute chronic Workload ratio",
        }}
      ></LineChartComp>
      <LineChartComp
        attr={wRap.hrv}
        lineData={{
          lines: [
            { y: wRap.readiness.value, color: "blue", label: "Readiness" },
            { y: wRap.hrv.hrvT, color: "red", label: "HRV", isScaled: true },
            {
              y: wRap.rhr.getTransformed(),
              color: "purple",
              label: "RHR",
              isScaled: true,
            },
          ],
          title: "Health data",
        }}
      ></LineChartComp>
      <LineChartComp
        lineData={{
          lines: [
            {
              y: wRap.sleep.getTransformed(),
              color: "blue",
              label: "Sleep",
              isScaled: true,
            },
            {
              y: wRap.sleepScore.getTransformed(),
              color: "red",
              label: "Sleep Score",
              isScaled: true,
            },
          ],
          title: "Sleep",
        }}
      ></LineChartComp>
    </ScrollView>
  );
}
