import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { QUANTILE } from "@/components/classes/aggregations/QUANTILE";
import { zone } from "@/components/components/_chatComp";

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

export function ChartComponentQuantile(props: {
  title: string;
  display?: () => boolean;
  progress: number;
  values: QUANTILE;
  zones: zone[];
  indicatorTextTransform?: (n: number, q: number) => string | number;
}) {
  let q = [props.zones[0].startVal, props.zones[props.zones.length - 1].endVal];
  let wrap = props.values;
  let zn = props.zones.find((t) => t.normal == true);
  let qn = [zn?.startVal ?? 0.25, zn?.endVal ?? 0.75];
  let transform = (n: number) => {
    // Quantile => 0-1
    //return n;
    let vDif = q[1] - q[0];
    return vDif != 0 ? (n - q[0]) / vDif : 0;
  };

  let subtitle =
    "Normal range: " +
    wrap.mean.toFixed(2) +
    "±" +
    (wrap.inverse(qn[1]) - wrap.inverse(0.5)).toFixed(2);
  let vquantile = wrap.transform(props.progress);
  let value = transform(vquantile);
  let text =
    props.zones.find(
      (zone) =>
        value >= transform(zone.startVal) && value <= transform(zone.endVal),
    )?.text ?? "";
  let progress = value - 0.5;
  let display = props.display != null ? props.display() : true;
  let titleText = props.title != undefined ? props.title + ": " : "";
  return (
    <View style={[styles.container, display ? {} : { display: "none" }]}>
      <Text style={styles.statusText}>{titleText + text}</Text>
      {subtitle != null && <Text style={styles.subText}>{subtitle}</Text>}
      <View style={styles.progressBarContainer}>
        {Zones(props.zones, transform, props.title)}
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
          : props.indicatorTextTransform(props.progress, vquantile)}
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

export default ChartComponentQuantile;
