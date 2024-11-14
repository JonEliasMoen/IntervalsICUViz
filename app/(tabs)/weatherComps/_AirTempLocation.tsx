import { gradientGen, isoDateOffset } from "@/app/(tabs)/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { ChartComponent, fetchToJson, zone } from "@/components/chatComp";
import { mean } from "simple-statistics";

interface WeatherFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [longitude, latitude, altitude]
  };
  properties: {
    meta: {
      updated_at: string; // ISO date string
      units: {
        air_pressure_at_sea_level: string;
        air_temperature: string;
        air_temperature_max: string;
        air_temperature_min: string;
        air_temperature_percentile_10: string;
        air_temperature_percentile_90: string;
        cloud_area_fraction: string;
        cloud_area_fraction_high: string;
        cloud_area_fraction_low: string;
        cloud_area_fraction_medium: string;
        dew_point_temperature: string;
        fog_area_fraction: string;
        precipitation_amount: string;
        precipitation_amount_max: string;
        precipitation_amount_min: string;
        probability_of_precipitation: string;
        probability_of_thunder: string;
        relative_humidity: string;
        ultraviolet_index_clear_sky: string;
        wind_from_direction: string;
        wind_speed: string;
        wind_speed_of_gust: string;
        wind_speed_percentile_10: string;
        wind_speed_percentile_90: string;
      };
    };
    timeseries: TimeSeriesEntry[];
  };
}
interface InstantDetails {
  air_pressure_at_sea_level: number;
  air_temperature: number;
  air_temperature_percentile_10: number;
  air_temperature_percentile_90: number;
  cloud_area_fraction: number;
  cloud_area_fraction_high: number;
  cloud_area_fraction_low: number;
  cloud_area_fraction_medium: number;
  dew_point_temperature: number;
  fog_area_fraction: number;
  relative_humidity: number;
  ultraviolet_index_clear_sky: number;
  wind_from_direction: number;
  wind_speed: number;
  wind_speed_of_gust: number;
  wind_speed_percentile_10: number;
  wind_speed_percentile_90: number;
}
interface PrecipationDetails {
  precipitation_amount: number;
  precipitation_amount_max: number;
  precipitation_amount_min: number;
  probability_of_precipitation: number;
  probability_of_thunder: number;
}

interface TimeSeriesEntry {
  time: string; // ISO date string
  data: {
    instant: {
      details: InstantDetails;
    };
    next_12_hours?: SummaryDetails;
    next_1_hours?: PrecipitationDetails;
    next_6_hours?: TemperatureDetails;
  };
}
function getRain(t: TimeSeriesEntry) {
  return (
    t.data.next_1_hours?.details.precipitation_amount ??
    t.data.next_6_hours?.details.precipitation_amount ??
    0
  );
}

interface SummaryDetails {
  summary: {
    symbol_code: string;
    symbol_confidence: string;
  };
  details: {
    probability_of_precipitation: number;
  };
}

interface PrecipitationDetails {
  summary: {
    symbol_code: string;
  };
  details: PrecipationDetails;
}

interface TemperatureDetails {
  summary: {
    symbol_code: string;
  };
  details: {
    air_temperature_max: number;
    air_temperature_min: number;
    precipitation_amount: number;
    precipitation_amount_max: number;
    precipitation_amount_min: number;
    probability_of_precipitation: number;
  };
}
export function getWeather() {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["weather", date], () =>
    fetchToJson<WeatherFeature>(
      "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=63.4293&lon=10.393718",
      {
        method: "GET",
      },
    ),
  );
  return data;
}
function stats(values: number[] | undefined) {
  const data = values ?? [10, 20];
  return [Math.min(...data), mean(data), Math.max(...data)];
}
function summary(
  param: keyof InstantDetails,
  value: TimeSeriesEntry[] | undefined,
): number[] {
  const values = value?.map((n) => n.data.instant.details[param]);
  return stats(values);
}

export function AirTempLocation() {
  const data = getWeather();
  const today = data?.properties.timeseries.filter((n) =>
    n.time.match(isoDateOffset(0)),
  );
  const temp = summary("air_temperature", today);
  const wind = summary("wind_speed", today);
  const wind2 = summary("wind_speed_of_gust", today);
  const rain = stats(today?.map((n) => getRain(n)));

  const colors = gradientGen([241, 39, 17], [245, 175, 25], 6).map(
    (n: number[]) => `rgb(${n[0]}, ${n[1]}, ${n[2]})`,
  );
  const colorsw = gradientGen([241, 39, 17], [245, 175, 25], 10).map(
    (n: number[]) => `rgb(${n[0]}, ${n[1]}, ${n[2]})`,
  );
  const colorsr = gradientGen([241, 39, 17], [245, 175, 25], 7).map(
    (n: number[]) => `rgb(${n[0]}, ${n[1]}, ${n[2]})`,
  );
  console.log(temp);
  const zones: zone[] = [0, 5, 10, 15, 20, 25].map((v, i) => {
    return {
      startVal: v,
      endVal: v + 5,
      text: `Temp: ${v}-${v + 5}°C `,
      color: colors[i],
    };
  });
  const zonesw: zone[] = [0, 0.3, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20].map(
    (v, i, a) => {
      return {
        startVal: v,
        endVal: i != 9 ? a[i + 1] : v + 4,
        text: `Wind: ${v}-${i != 9 ? a[i + 1] : v + 4} m/s `,
        color: colorsw[i],
      };
    },
  );
  const zonesr: zone[] = [0, 0.5, 2, 6, 10, 18, 30].map((v, i, a) => {
    return {
      startVal: v,
      endVal: i != 9 ? a[i + 1] : v + 4,
      text: `Rain: ${v}-${i != 9 ? a[i + 1] : v + 4} mm `,
      color: colorsw[i],
    };
  });

  console.log(rain);
  console.log(data);
  return (
    <>
      <ChartComponent
        progress={temp}
        zones={zones}
        transform={(v) => v / 25}
      ></ChartComponent>
      <ChartComponent
        progress={wind}
        zones={zonesw}
        transform={(v) => v / 24}
      ></ChartComponent>
      <ChartComponent
        progress={wind2}
        zones={zonesw}
        transform={(v) => v / 24}
      ></ChartComponent>
      <ChartComponent
        display={() => rain[2] != 0}
        progress={rain}
        zones={zonesr}
        transform={(n) => n / 34}
      ></ChartComponent>
    </>
  );
}
