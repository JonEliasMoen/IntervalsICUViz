import { fetchToJson, isoDateOffset } from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";

export interface sportInfo {
  type: string;
  eftp: number;
}

export interface wellness {
  sleepSecs: number;
  atl: number; // acute
  ctl: number; // chronic
  hrv: number;
  rampRate: number;
  restingHR: number;
  weight: number;
  sportInfo: sportInfo[];

  [key: string]: any; // This allows for any other unknown properties
}

export interface settings {
  sportSettings: SportSettings[];

  [key: string]: any; // This allows for any other unknown properties
}

interface SportSettings {
  types: string[];
  threshold_pace: number;
  pace_zones: number[];
  pace_zone_names: string[];

  [key: string]: any; // This allows for any other unknown properties
}

export function getSettings(apiKey: string | null): settings | undefined {
  const { data: data } = useQuery(
    ["settings"],
    () =>
      fetchToJson<settings>(`https://intervals.icu/api/v1/athlete/i174646`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${apiKey}`,
        },
      }),
    {
      enabled: !!apiKey,
    },
  );
  return data;
}

export function getWellnessRange(n: number, n2: number, apiKey: string | null) {
  console.log(apiKey);
  let isodate1 = isoDateOffset(n);
  let isodate2 = isoDateOffset(n2);

  const { data: data } = useQuery(
    ["wellness", isodate2, isodate1],
    () =>
      fetchToJson<wellness[]>(
        `https://intervals.icu/api/v1/athlete/i174646/wellness?oldest=${isodate2}&newest=${isodate1}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${apiKey}`,
          },
        },
      ),
    {
      enabled: !!apiKey,
    },
  );
  return data;
}
