import {
  fetchToJson,
  getWeekNumber,
  isoDateOffset,
} from "@/components/utils/_utils";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";

export interface sportInfo {
  type: string;
  eftp: number;
}

export interface wellness {
  id: string;
  bodyFat: number;
  sleepSecs: number;
  atl: number; // acute
  ctl: number; // chronic
  hrv: number;
  rampRate: number;
  restingHR: number;
  weight: number;
  sportInfo: sportInfo[];
  ctlLoad: number;
  atlLoad: number;
  sleepScore: number;
  vo2max: number;

  [key: string]: any; // This allows for any other unknown properties
}

export interface newEx {
  start_date_local: string; // "2025-05-04T00:00:00"
  type: "Run";
  athlete_id: string;
  category: "WORKOUT";
  name: string;
  description: string;
}

export function newExMutation(apiKey: String) {
  return useMutation(async (ex: newEx): Promise<any> => {
    const response = await fetch(
      `https://intervals.icu/api/v1/athlete/${ex.athlete_id}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ex),
      },
    );
    if (!response.ok) throw new Error("Failed to fetch refresh token");
  });
}

export interface settings {
  sportSettings: SportSettings[];

  [key: string]: any; // This allows for any other unknown properties
}

export interface SportSettings {
  types: string[];
  threshold_pace: number;
  ftp: number;
  max_hr: number;
  hr_zones: number[];
  power_zones: number[];
  pace_zones: number[];
  pace_zone_names: string[];

  [key: string]: any; // This allows for any other unknown properties
}

export function getSettings(
  apiKey: string | null,
  aid: string | null,
): settings | undefined {
  const { data: data } = useQuery(
    ["intervals", "settings"],
    () =>
      fetchToJson<settings>(`https://intervals.icu/api/v1/athlete/${aid}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${apiKey}`,
        },
      }),
    {
      enabled: !!apiKey && !!aid,
    },
  );
  console.log(data);
  return data;
}

export function getWellnessRange(
  n: number,
  n2: number,
  apiKey: string | null,
  aid: string | null,
): wellness[] | undefined {
  console.log(apiKey);
  let isodate1 = isoDateOffset(n);
  let isodate2 = isoDateOffset(n2);

  const { data: data } = useQuery(
    ["intervals", "wellness", isodate2, isodate1],
    () =>
      fetchToJson<wellness[]>(
        `https://intervals.icu/api/v1/athlete/${aid}/wellness?oldest=${isodate2}&newest=${isodate1}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${apiKey}`,
          },
        },
      ),
    {
      enabled: !!apiKey && !!aid,
    },
  );
  return data;
}

export interface powerzone {
  id: string;
  secs: number;
}

export interface activity {
  id: string;
  _note: string | null;
  start_date_local: string;
  type: string;
  pace_zone_times?: number[];
  icu_hr_zone_times?: number[];
  gap_zone_times?: number[];
  icu_zone_times?: powerzone[];
  icu_training_load: number;
  moving_time: number;
  pace: number;
  distance: number;
}

export function groupByWeek(data: activity[]): activity[][] {
  let myMap = new Array<Array<activity>>();
  let index = new Array<number>();
  data.forEach((d) => {
    const date = new Date(d.start_date_local);
    const key = getWeekNumber(date);
    const i = index.findIndex((k) => k == key);
    if (i != -1) {
      const data = myMap[i];
      if (data != undefined) {
        myMap[i] = [...data, d];
      }
    } else {
      index = [...index, key];
      myMap.push([d]);
    }
  });
  const current = getWeekNumber(new Date());
  let cindex = 0;
  for (let i = current; i > Math.min(...index) + 1; i -= 1) {
    const findex = index.findIndex((k) => k == i);
    if (findex == -1) {
      index.splice(cindex, 0, i);
      myMap.splice(cindex, 0, []);
    }
    cindex = cindex + 1;
  }
  return myMap;
}

export function getActivities(
  n: number,
  n2: number,
  apiKey: string | null,
  aid: string | null,
) {
  let isodate1 = isoDateOffset(n);
  let isodate2 = isoDateOffset(n2);
  const { data: data } = useQuery(
    ["intervals", "activities", isodate1, isodate2],
    () =>
      fetchToJson<activity[]>(
        `https://intervals.icu/api/v1/athlete/${aid}/activities?oldest=${isodate2}&newest=${isodate1}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${apiKey}`,
          },
        },
      ),
    {
      enabled: !!apiKey && !!aid,
    },
  );
  console.log(data);
  return data;
}

export interface athlete {
  profile: string;

  [key: string]: any;
}

export interface tokenResponse {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  athlete?: athlete;
}

export interface stream {
  [key: string]: sData;
}

export interface sData {
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export function getStream(
  ids: string[],
  keys: string[],
  token: tokenResponse,
): stream[] | undefined {
  const queries = useQueries({
    queries: ids.map((t) => ({
      queryKey: ["strava", "activity", "stream", t, keys],
      queryFn: () =>
        fetchToJson<stream>(
          `https://www.strava.com/api/v3/activities/${t}/streams?keys=${keys.join(",")}&key_by_type=true`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token?.access_token}`,
            },
          },
        ),
      enabled: token.access_token != null,
    })),
  });
  let any = queries.map((q) => q.data).some((d) => d == undefined);
  if (any) {
    return undefined;
  }
  return queries.map((q) => q.data).filter((d) => d !== undefined) as stream[];
}

export function getStravaActivities(
  ids: string[],
  token: tokenResponse,
): activity[] | undefined {
  const queries = useQueries({
    queries: ids.map((t) => ({
      queryKey: ["strava", "activity", t],
      queryFn: () =>
        fetchToJson<activity>(`https://www.strava.com/api/v3/activities/${t}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token?.access_token}`,
          },
        }),
      enabled: !!token,
    })),
  });

  return queries
    .map((q) => q.data)
    .filter((d) => d !== undefined) as activity[];
}
