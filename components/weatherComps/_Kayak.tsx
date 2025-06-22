import {
  getSeaInfo,
  getWeather,
  TimeSeriesEntry,
  TimeseriesWater,
} from "@/components/utils/_weatherModel";
import { Text } from "@/components/Themed";
import { StyleSheet, View } from "react-native";
import {
  groupByDay,
  groupByDayWater,
} from "@/components/classes/WeatherFeature/weatherFunc";

interface kayakRes {
  date: Date;
  wind: number;
  gust: number;
  height: number;
  rain: number;
  score: string;
  t: number;
}

function isOkKayak(
  t: TimeSeriesEntry,
  i: number,
  wdata: TimeseriesWater[],
): kayakRes | undefined {
  const mw = 5;
  const mwg = 8;
  const mwh = 0.5;
  const mr = 1;

  const wind =
    t.data.instant.details.wind_speed < mw &&
    t.data.instant.details.wind_speed_of_gust < mwg;
  const wave = wdata[i];
  const height = wave?.data.instant.details.sea_surface_wave_height;
  const okHeight = height < mwh;
  const rain: number = t.data.next_1_hours?.details.precipitation_amount ?? 99;
  const okRain = rain < mr;
  if (okHeight && wind && okRain) {
    let score =
      (t.data.instant.details.wind_speed / mw +
        t.data.instant.details.wind_speed_of_gust / mwg +
        rain / mr) /
      3;
    score = 1 - score;
    return {
      date: new Date(t.time),
      wind: t.data.instant.details.wind_speed,
      gust: t.data.instant.details.wind_speed_of_gust,
      height: height,
      rain: rain,
      t: t.data.instant.details.air_temperature,
      score: score.toFixed(2),
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
  const wdata = getSeaInfo(props.lat, props.long);
  if (data == undefined || wdata == undefined) {
    return <></>;
  }
  const dayMapw = groupByDayWater(wdata.properties.timeseries);
  const todayw = dayMapw[props.dayOffset];

  const dayMap = groupByDay(data.properties.timeseries);
  const today = dayMap[props.dayOffset];

  let result: kayakRes[] = [];
  today.forEach((t, i) => {
    let data = isOkKayak(t, i, todayw);
    if (data != undefined) {
      result.push(data);
    }
  });

  return (
    <View style={[styles.container]}>
      {result.length > 0 && (
        <>
          <Text style={styles.statusText}>Kayak windows</Text>
          {result.map((t) => {
            return (
              <Text>
                {t.date.getHours() + ":00"} s {t.score} w {t.wind} g {t.gust} h{" "}
                {t.height} t {t.t} r {t.rain}
              </Text>
            );
          })}
        </>
      )}
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
    marginBottom: 0, // Adds space between text and bar
  },
});
