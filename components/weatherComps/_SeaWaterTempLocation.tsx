import { isoDateOffset } from "@/components/utils/_utils";
import { ChartComponent } from "@/components/components/_chatComp";
import { generateGradient } from "typescript-color-gradient";
import { getWaterTemp } from "@/components/utils/_weatherModel";
import { mean } from "simple-statistics";

export function SeaWaterTempLocation(props: { lat: number; long: number }) {
  const data = getWaterTemp(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const today = data.properties.timeseries.filter((n) =>
    n.time.match(isoDateOffset(0)),
  );
  console.log(today);
  const temps = today.map((v) => v.data.instant.details.sea_water_temperature);
  const waveHeight = today?.map(
    (v) => v.data.instant.details.sea_surface_wave_height,
  );

  const colors = generateGradient(["#00fff3", "#b90002"], 6);

  const temp = Math.round(mean(temps));

  const wave = Math.min(...waveHeight);
  const wavem = Math.max(...waveHeight);

  console.log(wave);
  console.log(Math.min(...waveHeight));
  const waveStr = ` ${wave}-${wavem}m`;
  return (
    <ChartComponent
      title={"Sea info"}
      progress={temp}
      zones={[
        {
          startVal: 0,
          endVal: 6,
          text: "0-6°C 6mm" + waveStr,
          color: colors[0],
        },
        {
          startVal: 6,
          endVal: 9,
          text: "6-9°C 5mm" + waveStr,
          color: colors[1],
        },
        {
          startVal: 9,
          endVal: 12,
          text: "9-12°C 4mm" + waveStr,
          color: colors[2],
        },
        {
          startVal: 12,
          endVal: 15,
          text: "12-15°C 3m" + waveStr,
          color: colors[3],
        },
        {
          startVal: 15,
          endVal: 19,
          text: "15-19°C 2m" + waveStr,
          color: colors[4],
        },
        {
          startVal: 19,
          endVal: 25,
          text: "19-25°C Badebukse" + waveStr,
          color: colors[5],
        },
      ]}
      transform={(n) => n / 25}
      indicatorTextTransform={(n) => n.toString() + "°C"}
    ></ChartComponent>
  );
}
