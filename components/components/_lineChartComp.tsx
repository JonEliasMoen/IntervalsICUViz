import React, { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Svg, { Polyline, Rect } from "react-native-svg";
import { Attribute } from "@/components/classes/interfaces";

export interface line {
  data: number[];
  color: string;
  label: string;
  reverse?: boolean;
  isScaled?: boolean;
}

export interface data {
  lines: line[];
  title: string;
}

function normalizeLines(
  lines: line[],
  width: number,
  height: number,
): { points: string; color: string }[] {
  const maxLength = Math.max(...lines.map((l) => l.data.length));

  return lines.map((l) => {
    let max = Math.max(...l.data);
    let min = Math.min(...l.data);
    console.log(l.label, max, min);
    if (l.isScaled) {
      max = 1;
      min = 0;
    }
    const stepX = width / (maxLength - 1);
    let scaleY = (v: number) => height - ((v - min) / (max - min)) * height;
    if (l.reverse) {
      scaleY = (v: number) => ((v - min) / (max - min)) * height;
    }

    const points = l.data.map((v, i) => `${i * stepX},${scaleY(v)}`).join(" ");
    return { points, color: l.color };
  });
}

function normalizeZones(
  attr: Attribute | undefined,
  height: number,
): { start: number; end: number; color: string }[] | undefined {
  if (!attr) {
    return undefined;
  }
  let zones = attr.getZones();
  let isScaled = zones[zones.length - 1].endVal == 1 && zones[0].startVal == 0;

  return zones.map((l) => {
    let scaleY = (v: number): number => height - attr.transform(v) * height;
    if (isScaled) {
      scaleY = (v: number): number => height - v * height;
    }

    return { start: scaleY(l.startVal), end: scaleY(l.endVal), color: l.color };
  });
}

export function LineChartComp(props: { lineData: data; attr?: Attribute }) {
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
  const normalizedZones = normalizeZones(props.attr, chartHeight);
  if (props.attr) {
    console.log(
      "norm",
      props.lineData.title,
      normalizeZones(props.attr, chartHeight),
    );
  }
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
        {normalizedZones &&
          normalizedZones.map((zone, index) => (
            <Rect
              x={0}
              y={zone.end}
              height={zone.start - zone.end}
              width={chartWidth}
              fill={zone.color}
            ></Rect>
          ))}
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
