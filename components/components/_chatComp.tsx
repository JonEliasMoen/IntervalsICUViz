import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface zone {
  text: string;
  startVal: number;
  endVal: number;
  color: string;
  normal?: boolean;
}

export function Zones(
  zones: zone[],
  valTrans: (n: number) => number,
  title: string,
) {
  return (
    <>
      {zones.map((zone, index) => (
        <View
          key={index + title}
          style={[
            styles.section,
            {
              backgroundColor: zone.color,
              width: (valTrans(zone.endVal) - valTrans(zone.startVal)) * 200,
            },
          ]}
        />
      ))}
    </>
  );
}

export function ChartComponent(props: {
  title: string;
  subtitle?: string | null;
  display?: () => boolean;
  progress: number;
  zones: zone[];
  transform: (n: number) => number;
  indicatorTextTransform?: (n: number) => string | number;
}) {
  let value = Math.min(1, Math.max(0, props.transform(props.progress)));
  let text =
    props.zones.find(
      (zone) =>
        value >= props.transform(zone.startVal) &&
        value <= props.transform(zone.endVal),
    )?.text ?? "";
  let progress = value - 0.5;
  let display = props.display != null ? props.display() : true;
  let titleText = props.title != undefined ? props.title + ": " : "";
  return (
    <View style={[styles.container, display ? {} : { display: "none" }]}>
      <Text style={styles.statusText}>{titleText + text}</Text>
      {props.subtitle != null && (
        <Text style={styles.subText}>{props.subtitle}</Text>
      )}
      <View style={styles.progressBarContainer}>
        {Zones(props.zones, props.transform, props.title + props.progress)}
      </View>
      <View
        style={[
          styles.progressIndicator,
          {
            position: "relative",
            left: progress * 2 * 100,
          },
        ]}
      />
      <Text
        style={[
          styles.subtext,
          {
            position: "relative",
            left: progress * 2 * 100,
          },
        ]}
      >
        {props.indicatorTextTransform == null
          ? props.progress != null
            ? props.progress.toFixed(2).toString()
            : props.progress
          : props.indicatorTextTransform(props.progress)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0,
    paddingRight: 0,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10, // Adds space between text and bar
  },
  subText: {
    marginTop: -6,
    fontSize: 13,
    marginBottom: 5, // Adds space between text and bar
  },
  progressBarContainer: {
    flexDirection: "row",
    width: 200,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
    marginBottom: 15, // Adds space between progress bar and time text
  },
  section: {
    height: "100%",
  },
  redSection: {
    backgroundColor: "#FF4C4C", // Red section
  },
  yellowSection: {
    backgroundColor: "#FFD700", // Yellow section
  },
  greenSection: {
    backgroundColor: "#76C7C0", // Green section
  },
  orangeSection: {
    backgroundColor: "#FFA500", // Orange section
  },
  subtext: {
    position: "relative",
    top: -30,
    borderColor: "black",
    backgroundColor: "#fff", // Black progress indicator
  },
  progressIndicator: {
    position: "absolute",
    top: -30,
    width: 5,
    height: 20,
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "#fff", // Black progress indicator
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
});

export default ChartComponent;
