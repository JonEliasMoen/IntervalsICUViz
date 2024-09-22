import { StyleSheet } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import ChartComponent, {fetchToJson} from "@/components/chatComp";
import {useQuery} from "@tanstack/react-query";

interface wellness {
  sleepSecs: number;
  atl: number; // acute
  ctl: number; // chronic
  [key: string]: any; // This allows for any other unknown properties
}
export function getWellness(n: number) {
  let isodate = new Date(Date.now()-n).toISOString().slice(0, 10)
  const { data: data} = useQuery(["wellness"], () => fetchToJson<wellness>(
    "https://intervals.icu/api/v1/athlete/i174646/wellness/"+isodate, {
      method: "GET",
      headers: {
        'Authorization': `Basic QVBJX0tFWTo1dTVtbWk2M2Z3NHJ5ZXh0c3dya3h0NzF0`
      }
    },
  ));
  return data
}


export default function TabOneScreen() {
  const layout = { title: "My cool chart!" };
  const data = getWellness(0);
  const dataYesterday = getWellness(1);

  console.log("here")

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <ChartComponent progress={data != undefined ? (data.atl/data.ctl) : 1} zones={[{
        text: "Low",
        startVal: 0,
        endVal: 0.8,
        color: "#1F77B44D"},
        {
          text: "Optimal",
          startVal: 0.8,
          endVal: 1.3,
          color: "#009E0066"},
        {
          text: "High",
          startVal: 1.3,
          endVal: 1.5,
          color: "#FFCB0E80"},
        {
          text: "Very high",
          startVal: 1.5,
          endVal: 2,
          color: "#D627284D"}

      ]}
      transform={(n) => n/2.0}>
      </ChartComponent>
      <ChartComponent progress={data != undefined ? (data.sleepSecs/3600) : 3600*3} zones={[{
        text: "4-5",
        startVal: 4,
        endVal: 5,
        color: "#DD04A74D"},
        {
          text: "5-6",
          startVal: 5,
          endVal: 6,
          color: "#FFCB0E80"},
        {
          text: "6-7",
          startVal: 6,
          endVal: 7,
          color: "#C8F509A8"},
        {
          text: "7-8",
          startVal: 6,
          endVal: 7,
          color: "#009E0057"},
        {
          text: "8-9",
          startVal: 8,
          endVal: 9,
          color: "#009E0099"},
        {
          text: "9-10",
          startVal: 9,
          endVal: 10,
          color: "#1D00CCFF"},

      ]}
                      transform={(n) => (n-4)/6}>
      </ChartComponent>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  redSection: {
    backgroundColor: "#FF4C4C", // Red section
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
