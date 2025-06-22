import { generateGradient } from "typescript-color-gradient";
import { getSeaInfo } from "@/components/utils/_weatherModel";
import ChartComponentRange from "@/components/components/_chatCompRange";
import { stats } from "@/components/weatherComps/_AirTempLocation";
import { groupByDayWater } from "@/components/classes/WeatherFeature/weatherFunc";

export function SeaWaterTempLocation(props: {
  lat: number;
  long: number;
  dayOffset: number;
}) {
  const data = getSeaInfo(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const dayMap = groupByDayWater(data.properties.timeseries);
  const today = dayMap[props.dayOffset];

  const temps = today.map((v) => v.data.instant.details.sea_water_temperature);
  const waveHeight = today?.map(
    (v) => v.data.instant.details.sea_surface_wave_height,
  );

  const colors = generateGradient(["#00fff3", "#b90002"], 6);

  const temp = stats(temps);

  const wave = stats(waveHeight);

  return (
    <>
      <ChartComponentRange
        title={"Water temperature"}
        progressFrom={temp[0]}
        progressValue={temp[1]}
        progressTo={temp[2]}
        zones={[
          {
            startVal: 0,
            endVal: 6,
            text: "0-6°C 6mm",
            color: colors[0],
          },
          {
            startVal: 6,
            endVal: 9,
            text: "6-9°C 5mm",
            color: colors[1],
          },
          {
            startVal: 9,
            endVal: 12,
            text: "9-12°C 4mm",
            color: colors[2],
          },
          {
            startVal: 12,
            endVal: 15,
            text: "12-15°C 3m",
            color: colors[3],
          },
          {
            startVal: 15,
            endVal: 19,
            text: "15-19°C 2m",
            color: colors[4],
          },
          {
            startVal: 19,
            endVal: 25,
            text: "19-25°C Badebukse",
            color: colors[5],
          },
        ]}
        transform={(n) => n / 25}
        indicatorTextTransform={(n) => n.toString() + "°C"}
      ></ChartComponentRange>
      <ChartComponentRange
        title={"Wave height"}
        progressFrom={wave[0]}
        progressValue={wave[1]}
        progressTo={wave[2]}
        zones={[
          {
            startVal: 0,
            endVal: 0.3,
            text: "0–0.3m: Flat / Ideal",
            color: colors[0],
          },
          {
            startVal: 0.3,
            endVal: 0.6,
            text: "0.3–0.6m: Small waves",
            color: colors[1],
          },
          {
            startVal: 0.6,
            endVal: 1.0,
            text: "0.6–1.0m: Manageable swell",
            color: colors[2],
          },
          {
            startVal: 1.0,
            endVal: 1.5,
            text: "1.0–1.5m: Rough for most",
            color: colors[3],
          },
          {
            startVal: 1.5,
            endVal: 2.5,
            text: "1.5–2.5m: Advanced only",
            color: colors[4],
          },
          {
            startVal: 2.5,
            endVal: 3.5,
            text: "2.5m+: Dangerous",
            color: colors[5],
          },
        ]}
        transform={(n) => n / 3.5}
        indicatorTextTransform={(n) => n + "m"}
      ></ChartComponentRange>
    </>
  );
}
