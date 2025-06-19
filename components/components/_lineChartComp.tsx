import React, { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";

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

function normalizeLines(
  lines: line[],
  width: number,
  height: number,
): { points: string; color: string }[] {
  const maxLength = Math.max(...lines.map((l) => l.data.length));
  const flat = lines.flatMap((l) => l.data);
  const max = Math.max(...flat);
  const min = Math.min(...flat);

  return lines.map((l) => {
    const stepX = width / (maxLength - 1);
    const scaleY = (v: number) => height - ((v - min) / (max - min)) * height;
    const points = l.data.map((v, i) => `${i * stepX},${scaleY(v)}`).join(" ");
    return { points, color: l.color };
  });
}

export function LineChartComp(props: { lineData: data }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 40;
  const chartHeight = 160;

  const [activeLines, setActiveLines] = useState<boolean[]>(
    props.lineData.lines.map(() => true),
  );

  const toggleLine = (index: number) => {
    setActiveLines((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const filteredLines = props.lineData.lines.filter((_, i) => activeLines[i]);
  const normalized = normalizeLines(filteredLines, chartWidth, chartHeight);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {props.lineData.title}
      </Text>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {props.lineData.lines.map((line, index) => (
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
        ))}
      </View>
      <Svg width={chartWidth} height={chartHeight}>
        {normalized.map((line, idx) => (
          <Polyline
            key={idx}
            points={line.points}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
          />
        ))}
      </Svg>
    </View>
  );
}

export default LineChartComp;
