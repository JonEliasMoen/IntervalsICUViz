import { fetchToJson, isoDateOffset } from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { ChartComponent } from "@/components/chatComp";
import { generateGradient } from "typescript-color-gradient";

interface Feature {
  type: "Feature";
  geometry: Geometry;
  properties: Properties;
}

interface Geometry {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

interface Properties {
  meta: Meta;
  timeseries: Timeseries[];
}

interface Meta {
  updated_at: string; // ISO date string
  units: Units;
}

interface Units {
  sea_surface_wave_from_direction: "degrees";
  sea_surface_wave_height: "m";
  sea_water_speed: "m/s";
  sea_water_temperature: "celsius";
  sea_water_to_direction: "degrees";
}

interface Timeseries {
  time: string; // ISO date string
  data: Data;
}

interface Data {
  instant: Instant;
}

interface Instant {
  details: Details;
}

interface Details {
  sea_surface_wave_from_direction: number;
  sea_surface_wave_height: number;
  sea_water_speed: number;
  sea_water_temperature: number;
  sea_water_to_direction: number;
}

export function getWaterTemp(lat: number, long: number) {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["watertemp", date], () =>
    fetchToJson<Feature>(
      `https://yrweatherbackend.vercel.app/oceanforecast/2.0/complete?lat=${lat}&lon=${long}`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}

export function SeaWaterTempLocation(props: { lat: number; long: number }) {
  const data = getWaterTemp(props.lat, props.long);

  const today = data?.properties.timeseries.filter((n) =>
    n.time.match(isoDateOffset(0)),
  );
  console.log(today);
  const temps = today?.map(
    (v) => v.data.instant.details.sea_water_temperature,
  ) ?? [8, 3];
  const waveHeight = today?.map(
    (v) => v.data.instant.details.sea_surface_wave_height,
  ) ?? [8, 3];

  const colors = generateGradient(["#00fff3", "#b90002"], 6);

  const temp = Math.min(...temps);

  const wave = Math.min(...waveHeight);
  const wavem = Math.max(...waveHeight);

  console.log(wave);
  console.log(Math.min(...waveHeight));
  const waveStr = ` ${wave}-${wavem}m`;
  return (
    <ChartComponent
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
