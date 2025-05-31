import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { lineDataItem } from "gifted-charts-core/dist/LineChart/types";

function makeLineItems(numbers: number[]): lineDataItem[] {
  return numbers.map((t, i) => ({ value: t, index: i }));
}

function wrapData(numbers: line[]): {
  areaChart: boolean;
  hideDataPoints: boolean;
  data: lineDataItem[];
  color: string;
  thickness: number;
  endOpacity: number;
  endFillColor: string;
  startOpacity: number;
  startFillColor: string;
}[] {
  return numbers.map((t) => {
    return {
      data: makeLineItems(t.data),
      thickness: 2,
      color: t.color,
      hideDataPoints: true,
      areaChart: false,
      startFillColor: "#3b82f6",
      endFillColor: "#ffffff",
      startOpacity: 0.3,
      endOpacity: 0.0,
    };
  });
}

export interface line {
  data: number[];
  color: string;
  label: string;
}

export interface data {
  lines: line[];
  title: string;
  xLabels: string[];
}

export function LineChartComp(props: { lineData: data }) {
  let labels = props.lineData.lines.map((line) => line.label);
  let colors = props.lineData.lines.map((line) => line.color);
  let xLabels = props.lineData.xLabels;

  const [activeLines, setActiveLines] = useState<boolean[]>(
    props.lineData.lines.map(() => true),
  );

  const toggleLine = (index: number) => {
    setActiveLines((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };
  let dataset = wrapData(props.lineData.lines.filter((a, i) => activeLines[i]));

  return (
    <View style={{ padding: 16, backgroundColor: "#fff", borderRadius: 12 }}>
      <Text style={{ marginBottom: 8, fontSize: 18, fontWeight: "600" }}>
        {props.lineData.title}
      </Text>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {props.lineData.lines.map((line, index) => {
          return (
            <Pressable key={index} onPress={() => toggleLine(index)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: activeLines[index] ? line.color : "gray",
                    borderRadius: 5,
                    marginRight: 6,
                  }}
                />
                <Text>{line.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <LineChart
        dataSet={dataset}
        thickness={2}
        color2="#3b82f6"
        color={"red"}
        hideDataPoints
        isAnimated
        startFillColor="#3b82f6"
        endFillColor="#ffffff"
        startOpacity={0.3}
        endOpacity={0.0}
        noOfSections={4}
        yAxisColor="#ccc"
        xAxisColor="#ccc"
        xAxisLabelTexts={xLabels}
        verticalLinesThickness={1}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: "#aaa",
          pointerStripWidth: 1,
          pointerColor: "gray",
          radius: 6,
          pointerLabelWidth: 100,
          pointerLabelHeight: 70,
          pointerLabelComponent: (items) => {
            return (
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 6,
                  marginLeft: "20px",
                  borderRadius: 6,
                  elevation: 5,
                  shadowColor: "#000",
                  borderColor: "black",
                  borderWidth: "2px",
                }}
              >
                {items.map((item, idx) => (
                  <Text key={idx} style={{ color: colors[idx] }}>
                    {labels[idx]}: {item.value}
                  </Text>
                ))}
                <Text>X: {xLabels[items[0].index]}</Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

export default LineChartComp;
