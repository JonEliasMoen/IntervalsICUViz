import { fetchToJson, isoDateOffset } from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";

export interface location {
  lat: number;
  long: number;
  snowPlace?: snowPlace[];
}
export interface snowPlace {
  name: string;
  x: string;
  y: string;
  lat: number;
  long: number;
}

interface WeatherData {
  copyright: string;
  licenseURL: string;
  type: string;
  geometry: Geometry;
  when: When;
  properties: Properties;
}

interface When {
  interval: string[]; // e.g., ["2024-10-11T23:03:00Z", "2024-10-12T23:17:00Z"]
}

interface Properties {
  body: string; // e.g., "Sun"
  sunrise: SolarEvent;
  sunset: SolarEvent;
  solarnoon: SolarNoon;
  solarmidnight: SolarMidnight;
}

interface SolarEvent {
  time: string; // e.g., "2024-10-12T06:49+01:00"
  azimuth: number; // e.g., 103.8
}

interface SolarNoon {
  time: string; // e.g., "2024-10-12T12:03+01:00"
  disc_centre_elevation: number; // e.g., 22.42
  visible: boolean; // e.g., true
}

interface SolarMidnight {
  time: string; // e.g., "2024-10-12T00:03+01:00"
  disc_centre_elevation: number; // e.g., -37.59
  visible: boolean; // e.g., false
}

export function getSunData(lat: number, long: number) {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["sun", date, lat, long], () =>
    fetchToJson<WeatherData>(
      `https://yrweatherbackend.vercel.app/sunrise/3.0/sun?lat=${lat}&lon=${long}&date=${date}&offset=+02:00`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}

interface SnowResp {
  Data: number[];
  [key: string]: any;
}

type PropertiesSnow = {
  parent: number;
  level: number;
  type: "TRACK_SEGMENT"; // If this can vary, change to string
  scooter: boolean;
  floodLit: boolean;
  skating: boolean;
  classic: boolean;
  newest_prep_days: number;
  newest_prep_hours: number;
  length: number;
};

export function getSnowDepth(x: String, y: String): SnowResp | undefined {
  const date = isoDateOffset(0);
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      `https://gts.nve.no/api/GridTimeSeries/${x}/${y}/${date}/${date}/sd.json`,
    );
  const { data: data } = useQuery(
    ["snow", date, x, y],
    () =>
      fetchToJson<SnowResp>(url, {
        method: "GET",
      }),
    {
      retry: false,
      cacheTime: 30 * 60 * 1000,
      staleTime: 30 * 60 * 1000,
    },
  );
  return data;
}
export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

export type Feature = {
  type: "Feature";
  properties: PropertiesSnow;
  geometry: Geometry;
};

export function getSkiSporet(
  name: string,
  lat: number,
  long: number,
  s: number,
): FeatureCollection | undefined {
  console.log(
    name,
    `https://yrweatherbackend.vercel.app/map/${lat + s}/${long + s}/${long - s}/${long - s}/12?showSimulatedData=false`,
  );
  const { data: data } = useQuery(
    ["skisporet", lat, long, s],
    () =>
      fetchToJson<FeatureCollection>(
        `https://yrweatherbackend.vercel.app/map/${lat + s}/${long + s}/${long - s}/${long - s}/12?showSimulatedData=false`,
        {
          method: "GET",
        },
      ),
    {
      cacheTime: 30 * 60 * 1000,
      staleTime: 30 * 60 * 1000,
    },
  );
  return data;
}

interface FeatureWaterTempLocation {
  type: "Feature";
  geometry: Geometry;
  properties: Properties;
}

interface Geometry {
  type: string;
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

export function getWaterTemp(
  lat: number,
  long: number,
): FeatureWaterTempLocation | undefined {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["watertemp", date, lat, long], () =>
    fetchToJson<FeatureWaterTempLocation>(
      `https://yrweatherbackend.vercel.app/oceanforecast/2.0/complete?lat=${lat}&lon=${long}`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}

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

export interface InstantDetails {
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

export interface PrecipationDetails {
  precipitation_amount: number;
  precipitation_amount_max: number;
  precipitation_amount_min: number;
  probability_of_precipitation: number;
  probability_of_thunder: number;
}

export interface TimeSeriesEntry {
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

export function getWeather(lat: number, long: number) {
  const date = isoDateOffset(0);
  const { data: data } = useQuery(["weather", date, lat, long], () =>
    fetchToJson<WeatherFeature>(
      `https://yrweatherbackend.vercel.app/locationforecast/2.0/complete?lat=${lat}&lon=${long}`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}
