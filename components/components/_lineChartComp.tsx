import React, { useState } from "react";
import {
  Pressable,
  Text as DefaultText,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Line, Polyline, Rect, Text } from "react-native-svg";
import { Attribute } from "@/components/classes/interfaces";
import { getTimeHHMM, secondsFrom } from "@/components/utils/_utils";

export interface line {
  y: number[];
  x?: Date[];
  color: string;
  label: string;
  reverse?: boolean;
  isScaled?: boolean;
}

export interface data {
  lines: line[];
  title: string;
  labels?: Date[];
  height?: number;
  width?: number;
}

function scaleX(data: Date[]): number[] {
  let xN = data.map((t) => secondsFrom(t, data[0]));
  xN = xN.map((t) => t / Math.max(...xN));
  return xN;
}

function normalizeLines(
  lines: line[],
  width: number,
  height: number,
): { points: string; xcolor: string }[] {
  const maxLength = Math.max(...lines.map((l) => l.y.length));

  return lines.map((l) => {
    let max = Math.max(...l.y);
    let min = Math.min(...l.y);
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

    let points = l.y.map((v, i) => `${i * stepX},${scaleY(v)}`).join(" ");
    if (l.x != undefined) {
      // @ts-ignore
      let xN = scaleX(l.x);
      console.log(xN);
      points = l.y.map((v, i) => `${xN[i] * width},${scaleY(v)}`).join(" ");
    }
    return { points, xcolor: l.color };
  });
}

function normalizeLabels(
  data: Date[] | undefined,
  chartWidth: number,
): { text: string; x: number }[] {
  if (!data) {
    return [];
  }
  console.log(chartWidth);
  let xN = scaleX(data);
  let dt = secondsFrom(data[1], data[0]) / 60 / 60 / 24;
  if (dt == 1) {
    return data
      .map((t, i) => {
        if (i > 0) {
          if (t.getDay() != data[i - 1].getDay() && t.getDay() == 0) {
            return {
              text: t.getUTCDate() + "." + t.getMonth(),
              x: xN[i] * chartWidth,
            };
          }
        }
        return {
          text: "",
          x: xN[i] * chartWidth,
        };
      })
      .filter((t) => t.text !== "");
  }

  return data
    .map((t, i) => {
      if (i > 0) {
        if (t.getDay() != data[i - 1].getDay()) {
          return { text: t.toString().slice(0, 3), x: xN[i] * chartWidth };
        }
        if (t.getHours() % 3 == 0) {
          return { text: getTimeHHMM(t).slice(0, 2), x: xN[i] * chartWidth };
        }
      }
      return { text: "", x: xN[i] * chartWidth };
    })
    .filter((t) => t.text != "");
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
  const chartWidth =
    props.lineData.width != undefined ? props.lineData.width : width - 40;
  const chartHeight =
    props.lineData.height != undefined ? props.lineData.height : 160;

  const [activeLines, setActiveLines] = useState<boolean[]>(
    props.lineData.lines.map(() => true),
  );

  const toggleLine = (index: number) => {
    setActiveLines((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const filteredLines = props.lineData.lines.filter((_, i) => activeLines[i]);
  const normalized = normalizeLines(filteredLines, chartWidth, chartHeight);
  const normalizedZones = normalizeZones(props.attr, chartHeight);
  const normalisedLabels = normalizeLabels(props.lineData.labels, chartWidth);
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
      }}
    >
      <DefaultText style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {props.lineData.title}
      </DefaultText>
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
              <DefaultText>{line.label}</DefaultText>
            </View>
          </Pressable>
        ))}
      </View>
      <Svg width={chartWidth} height={chartHeight + 30}>
        {normalisedLabels.map((zone, index) => (
          <>
            <Line
              opacity={50}
              strokeDashoffset={1}
              stroke={"black"}
              x1={zone.x}
              y1={0}
              x2={zone.x}
              y2={chartHeight + 5}
              strokeDasharray="2 4" // Dash length 2, gap length 4
            />
            <Text
              fontSize="10"
              x={zone.x}
              y={chartHeight + 20}
              textAnchor="middle"
            >
              {zone.text}
            </Text>
          </>
        ))}
        {normalisedLabels.length > 0 && (
          <Line
            strokeWidth={"1"}
            stroke={"black"}
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
          />
        )}

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
            stroke={line.xcolor}
            strokeWidth="2"
          />
        ))}
      </Svg>
    </View>
  );
}

export default LineChartComp;
