// components/Chart.tsx

import React from "react";
import { Text } from "react-native";
import { getWellnessRange } from "@/components/utils/_fitnessModel";
import { useStoredKey } from "@/components/utils/_keyContext";
import LineChartComp from "@/components/components/_lineChartComp";
import { dateOffset } from "@/components/utils/_utils";

export default function Chart() {
  const { storedKey, storedAid } = useStoredKey();
  const dataLong = getWellnessRange(0, 42, storedKey, storedAid) ?? [];
  const dataWeek = dataLong.slice(dataLong.length - 9);
  const dataMonth = dataLong.slice(dataLong.length - 7 * 4);

  if (dataLong.length == 0 && dataLong != undefined) {
    return <Text>Loading</Text>;
  }
  if (dataWeek.length == 0 && dataWeek != undefined) {
    return <Text>Loading</Text>;
  }
  let a = dataMonth.map((t) => t.atl);
  let b = dataMonth.map((t) => t.ctl);
  let labels = b.map((a, i) => {
    return dateOffset(b.length - i - 1)
      .toString()
      .slice(4, 4 + 6);
  });
  console.log(labels);
  // @ts-ignore
  return (
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
  );
}
