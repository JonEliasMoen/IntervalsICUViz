import React from "react";
import { View, Text, StyleSheet } from "react-native";
export function fetchToJson<T>(
  url: string,
  params?: object,
  setErrorMessage?: (msg: string) => void,
  operation?: string,
): Promise<T> {
  return fetch(url, params).then((res) => {
    if (res.ok) {
      if (res.status === 204) {
        return null;
      } else {
        return res.json();
      }
    } else if (res.status === 404) {
      return null;
    } else {
      return Promise.reject(null);
    }
  });
}

interface zone {
  text: string;
  startVal: number;
  endVal: number;
  color: string;
}
export function Zones(zones: zone[], valTrans: (n: number) => number) {
  return (
    <>
      {zones.map((zone, index) => (
        <View
          key={index}
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
  title?: string;
  progress: number;
  zones: zone[];
  transform: (n: number) => number;
  indicatorTextTransform?: (n: number) => string | number;
}) {
  let value = props.transform(props.progress);
  let text =
    props.zones.find(
      (zone) =>
        value > props.transform(zone.startVal) &&
        value <= props.transform(zone.endVal),
    )?.text ?? "";
  console.log(props.progress);
  let progress = value - 0.5;
  let titleText = props.title != undefined ? props.title + ": " : "";
  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>ok</Text>
      <View style={styles.progressBarContainer}>
        {Zones(props.zones, props.transform)}
      </View>
      <View
        style={[styles.progressIndicator, { left: `${progress * 100}%` }]}
      />
      <Text style={[styles.subtext, { left: `${progress * 100}%` }]}>
        {props.indicatorTextTransform == null
          ? props.progress.toPrecision(3).toString()
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
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10, // Adds space between text and bar
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
    position: "relative",
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