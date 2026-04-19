// components/Chart.tsx
import { ScrollView, Text } from "react-native";

import React from "react";
import LineChartComp from "@/components/components/_lineChartComp";
import { dateOffset } from "@/components/utils/_utils";
import { useWellness } from "@/components/utils/_wrapContext";

export default function Chart() {
  const { wRap } = useWellness();
  if (!wRap) {
    return <Text>Loading</Text>;
  }
  const fitPlot = wRap.acwr.getPlot();

  const simpleRange = (a: number, b: number): number[] =>
    Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

  const dt = simpleRange(-fitPlot.ctl + 1, 1).map((t) => dateOffset(-t));

  // @ts-ignore
  return (
    <ScrollView>
      <LineChartComp
        lineData={{
          lines: [
            {
              y: fitPlot.atl,
              y2: fitPlot.atl2,
              color: "red",
              label: "ATL",
              isScaled: true
            },
            {
              y: fitPlot.ctl,
              y2: fitPlot.ctl2,
              color: "blue",
              label: "CTL",
              isScaled: true
            },
          ],
          title: "Acute chronic",
          labels: dt,
        }}
      ></LineChartComp>
      <LineChartComp
        attr={wRap.acwr}
        lineData={{
          lines: [
            {
              y: wRap.acwr.acwrT,
              y2: wRap.acwr.getValue(),
              color: "red",
              label: "ACR",
              isScaled: true,
            },
            {
              y: wRap.acwrs.acrsT,
              y2: wRap.acwrs.getValue(),
              color: "blue",
              label: "ACRS",
              isScaled: true,
            },
          ],
          labels: dt,
          title: "Acute chronic Workload ratio",
        }}
      ></LineChartComp>
      <LineChartComp
        attr={wRap.hrv}
        lineData={{
          lines: [
            {
              y: wRap.readiness.value,
              y2: wRap.readiness.getValue(),
              color: "blue",
              label: "Readiness"
            },
            {
              y: wRap.hrv.hrvT,
              y2: wRap.hrv.getValue(),
              color: "red",
              label: "HRV",
              isScaled: true
            },
            {
              y: wRap.rhr.getTransformed(),
              y2: wRap.rhr.getValue(),
              color: "purple",
              label: "RHR",
              isScaled: true,
            },
          ],
          title: "Health data",
          labels: dt,
        }}
      ></LineChartComp>
      <LineChartComp
        lineData={{
          lines: [
            {
              y: wRap.sleep.getTransformed(),
              y2: wRap.sleep.getValue(),
              color: "blue",
              label: "Sleep",
              isScaled: true,
            },
            {
              y: wRap.sleepScore.getTransformed(),
              y2: wRap.sleepScore.getValue(),
              color: "red",
              label: "Sleep Score",
              isScaled: true,
            },
          ],
          title: "Sleep",
          labels: dt,
        }}
      ></LineChartComp>
    </ScrollView>
  );
}
