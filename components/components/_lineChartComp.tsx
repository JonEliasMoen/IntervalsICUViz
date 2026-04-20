import React, { useMemo, useState } from "react";
import {
  PanResponder,
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
  y2: number[];
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
  const max = Math.max(...xN, 1);
  xN = xN.map((t) => t / max);
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

    if (l.isScaled) {
      max = 1;
      min = 0;
    }

    if (max === min) {
      max = min + 1;
    }

    const stepX = maxLength > 1 ? width / (maxLength - 1) : 0;

    let scaleY = (v: number) => height - ((v - min) / (max - min)) * height;
    if (l.reverse) {
      scaleY = (v: number) => ((v - min) / (max - min)) * height;
    }

    let points = l.y.map((v, i) => `${i * stepX},${scaleY(v)}`).join(" ");

    if (l.x !== undefined) {
      const xN = scaleX(l.x);
      points = l.y.map((v, i) => `${xN[i] * width},${scaleY(v)}`).join(" ");
    }

    return { points, xcolor: l.color };
  });
}

function normalizeLabels(
  data: Date[] | undefined,
  chartWidth: number,
): { text: string; x: number }[] {
  if (!data || data.length < 2) {
    return [];
  }

  const xN = scaleX(data);
  const dt = secondsFrom(data[1], data[0]) / 60 / 60 / 24;

  if (dt === 1) {
    return data
      .map((t, i) => {
        if (i > 0) {
          if (t.getDay() !== data[i - 1].getDay() && t.getDay() === 0) {
            return {
              text: t.getUTCDate() + "." + (t.getMonth() + 1),
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
        if (t.getDay() !== data[i - 1].getDay()) {
          return { text: t.toString().slice(0, 3), x: xN[i] * chartWidth };
        }
        if (t.getHours() % 3 === 0) {
          return { text: getTimeHHMM(t).slice(0, 2), x: xN[i] * chartWidth };
        }
      }
      return { text: "", x: xN[i] * chartWidth };
    })
    .filter((t) => t.text !== "");
}

function normalizeZones(
  attr: Attribute | undefined,
  height: number,
): { start: number; end: number; color: string }[] | undefined {
  if (!attr) {
    return undefined;
  }

  const zones = attr.getZones();
  const isScaled =
    zones[zones.length - 1].endVal === 1 && zones[0].startVal === 0;

  return zones.map((l) => {
    let scaleY = (v: number): number => height - attr.transform(v) * height;
    if (isScaled) {
      scaleY = (v: number): number => height - v * height;
    }

    return { start: scaleY(l.startVal), end: scaleY(l.endVal), color: l.color };
  });
}

function getNearestIndexFromX(
  x: number,
  lines: line[],
  chartWidth: number,
): number | null {
  if (lines.length === 0) {
    return null;
  }

  const firstLine = lines[0];
  const pointCount = firstLine.y.length;

  if (pointCount === 0) {
    return null;
  }

  const clampedX = Math.max(0, Math.min(x, chartWidth));

  if (firstLine.x && firstLine.x.length === pointCount) {
    const xN = scaleX(firstLine.x);
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < xN.length; i++) {
      const px = xN[i] * chartWidth;
      const dist = Math.abs(px - clampedX);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  }

  if (pointCount === 1) {
    return 0;
  }

  const ratio = clampedX / chartWidth;
  return Math.round(ratio * (pointCount - 1));
}

function getCursorX(index: number, lines: line[], chartWidth: number): number {
  if (lines.length === 0) {
    return 0;
  }

  const firstLine = lines[0];
  const pointCount = firstLine.y.length;

  if (pointCount <= 1) {
    return 0;
  }

  if (firstLine.x && firstLine.x.length === pointCount) {
    const xN = scaleX(firstLine.x);
    return xN[index] * chartWidth;
  }

  return (index / (pointCount - 1)) * chartWidth;
}

export function LineChartComp(props: { lineData: data; attr?: Attribute }) {
  const { width } = useWindowDimensions();
  const chartWidth =
    props.lineData.width !== undefined ? props.lineData.width : width - 40;
  const chartHeight =
    props.lineData.height !== undefined ? props.lineData.height : 160;

  const [activeLines, setActiveLines] = useState<boolean[]>(
    props.lineData.lines.map(() => true),
  );

  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const toggleLine = (index: number) => {
    setActiveLines((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const filteredLines = useMemo(
    () => props.lineData.lines.filter((_, i) => activeLines[i]),
    [props.lineData.lines, activeLines],
  );

  const normalized = normalizeLines(filteredLines, chartWidth, chartHeight);
  const normalizedZones = normalizeZones(props.attr, chartHeight);
  const normalisedLabels = normalizeLabels(props.lineData.labels, chartWidth);

  const cursorX =
    isPressing && pressedIndex !== null
      ? getCursorX(pressedIndex, filteredLines, chartWidth)
      : null;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const index = getNearestIndexFromX(x, filteredLines, chartWidth);
          setPressedIndex(index);
          setIsPressing(true);
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const index = getNearestIndexFromX(x, filteredLines, chartWidth);
          setPressedIndex(index);
        },
        onPanResponderRelease: () => {
          setIsPressing(false);
          setPressedIndex(null);
        },
        onPanResponderTerminate: () => {
          setIsPressing(false);
          setPressedIndex(null);
        },
      }),
    [filteredLines, chartWidth],
  );
  const xDate = isPressing && pressedIndex !== null && props.lineData.lines[0].x != undefined && props.lineData.lines[0].x[pressedIndex] !== undefined
      ? props.lineData.lines[0].x[pressedIndex]
      : null;


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
        {(!isPressing && xDate == null) ? props.lineData.title : props.lineData.title+": "+xDate?.toString().slice(0, 18)} 
      </DefaultText>

      <View style={{ flexDirection: "row", marginBottom: 8, flexWrap: "wrap" }}>
        {props.lineData.lines.map((line, index) => {
          const value =
            isPressing && pressedIndex !== null && line.y2[pressedIndex] !== undefined
              ? line.y2[pressedIndex]
              : null;

          return (
            <Pressable key={index} onPress={() => toggleLine(index)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 12,
                  marginBottom: 6,
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
                <DefaultText>
                  {line.label}
                  {value !== null ? `: ${value.toFixed(2)}` : ""}
                </DefaultText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {normalisedLabels.map((zone, index) => (
            <React.Fragment key={`label-${index}`}>
              <Line
                opacity={0.5}
                stroke={"black"}
                x1={zone.x}
                y1={0}
                x2={zone.x}
                y2={chartHeight + 5}
                strokeDasharray="2 4"
              />
              <Text
                fontSize="10"
                x={zone.x}
                y={chartHeight + 20}
                textAnchor="middle"
              >
                {zone.text}
              </Text>
            </React.Fragment>
          ))}

          {normalisedLabels.length > 0 && (
            <Line
              strokeWidth="1"
              stroke="black"
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
            />
          )}

          {normalizedZones &&
            normalizedZones.map((zone, index) => (
              <Rect
                key={`zone-${index}`}
                x={0}
                y={zone.end}
                height={zone.start - zone.end}
                width={chartWidth}
                fill={zone.color}
              />
            ))}

          {cursorX !== null && (
            <Line
              x1={cursorX}
              y1={0}
              x2={cursorX}
              y2={chartHeight}
              stroke="black"
              strokeDasharray="4 4"
            />
          )}

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
    </View>
  );
}

export default LineChartComp;