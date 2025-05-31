import React, { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
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
  const { width } = useWindowDimensions();
  const lineData = props.lineData;

  let labels = lineData.lines.map((line) => line.label);
  let colors = lineData.lines.map((line) => line.color);
  let xLabels = lineData.xLabels;

  const [activeLines, setActiveLines] = useState<boolean[]>(
    lineData.lines.map(() => true),
  );

  const toggleLine = (index: number) => {
    setActiveLines((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };
  let dataset = wrapData(lineData.lines.filter((a, i) => activeLines[i]));

  const ratio = 1440 / 28;
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        zIndex: width,
        paddingRight: 0,
      }}
    >
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
      <View>
        <LineChart
          spacing={10}
          adjustToWidth={true}
          dataSet={dataset}
          thickness={2}
          roundToDigits={2}
          color2="#3b82f6"
          color={"red"}
          hideDataPoints
          isAnimated
          startFillColor="#3b82f6"
          endFillColor="#ffffff"
          startOpacity={0.3}
          endOpacity={0.0}
          noOfSections={4}
          curved={true}
          yAxisColor="#ccc"
          xAxisColor="#ccc"
          xAxisLabelTexts={xLabels}
          verticalLinesThickness={1}
          pointerConfig={{
            pointerStripUptoDataPoint: false, // disables drawing to the point
            pointerStripHeight: 160,
            autoAdjustPointerLabelPosition: true,
            pointerStripColor: "#aaa",
            pointerStripWidth: 1,
            pointerColor: "transparent",
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 70,
            pointerLabelComponent: (items) => {
              return (
                <View
                  style={{
                    zIndex: 0,
                    backgroundColor: "#fff",
                    borderRadius: 6,
                    elevation: 5,
                    shadowColor: "#000",
                    borderColor: "black",
                    borderWidth: "2px",
                  }}
                >
                  {items.map((item: lineDataItem, idx: number) => (
                    <Text key={idx} style={{ color: colors[idx] }}>
                      {labels[idx]}: {Math.round(item.value * 100) / 100}
                    </Text>
                  ))}
                  <Text>X: {xLabels[items[0].index]}</Text>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
}

export default LineChartComp;
