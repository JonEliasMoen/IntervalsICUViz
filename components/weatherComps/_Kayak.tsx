import {
  FeatureWaterTempLocation,
  getWaterTemp,
  getWeather,
  TimeSeriesEntry,
} from "@/components/utils/_weatherModel";
import { Text } from "@/components/Themed";
import { StyleSheet, View } from "react-native";

interface kayakRes {
  date: Date;
  wind: number;
  gust: number;
  height: number;
  rain: number;
}

function isOkKayak(
  t: TimeSeriesEntry,
  i: number,
  wdata: FeatureWaterTempLocation,
): kayakRes | undefined {
  const wind =
    t.data.instant.details.wind_speed < 5 &&
    t.data.instant.details.wind_speed_of_gust < 8;
  const hour = new Date(t.time).getHours();
  const okhour = hour < 22 && hour > 16;
  const wave = wdata?.properties.timeseries[i];
  const height = wave?.data.instant.details.sea_surface_wave_height;
  const okHeight = height < 0.5;
  const rain: number = t.data.next_1_hours?.details.precipitation_amount ?? 99;
  const okRain = rain < 0.1;
  if (okHeight && okhour && wind && okRain) {
    return {
      date: new Date(t.time),
      wind: t.data.instant.details.wind_speed,
      gust: t.data.instant.details.wind_speed_of_gust,
      height: height,
      rain: rain,
    };
  }
  return undefined;
}

export function KayakLocation(props: {
  lat: number;
  long: number;
  dayOffset: number;
}) {
  const data = getWeather(props.lat, props.long);
  const wdata = getWaterTemp(props.lat, props.long);

  if (data == undefined || wdata == undefined) {
    return <></>;
  }
  let ok: kayakRes[] = [];
  data.properties.timeseries.forEach((t, i) => {
    let data = isOkKayak(t, i, wdata);
    if (data != undefined) {
      ok.push(data);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>Kayak windows</Text>

      <View style={styles.row}>
        <Text style={styles.dateCellHeader}>Date</Text>
        <Text style={styles.cellHeader}>Wind</Text>
        <Text style={styles.cellHeader}>Gust</Text>
        <Text style={styles.cellHeader}>Wave</Text>
        <Text style={styles.cellHeader}>Rain</Text>
      </View>

      {ok.map((t, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.dateCell}>
            {t.date.toISOString().slice(0, 1)}
          </Text>
          <Text style={styles.cell}>{t.wind}</Text>
          <Text style={styles.cell}>{t.gust}</Text>
          <Text style={styles.cell}>{t.height}</Text>
          <Text style={styles.cell}>{t.rain}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    paddingVertical: 4,
  },
  dateCellHeader: {
    flex: 2,
    fontWeight: "bold",
    textAlign: "left",
    paddingHorizontal: 4,
  },
  cellHeader: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  dateCell: {
    flex: 2,
    textAlign: "left",
    paddingHorizontal: 4,
    fontFamily: "monospace",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 4,
    fontFamily: "monospace",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
