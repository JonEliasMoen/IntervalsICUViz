import {
  cutArrayIfOverLimit,
  fetchToTxt,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { fetchToJson } from "@/components/utils/_utils";
import { ChartComponent, zone } from "@/components/chatComp";
import { generateGradient } from "typescript-color-gradient";

const harbors: string[] = [
  "andenes",
  "bergen",
  "bodø",
  "bruravik",
  "hammerfest",
  "harstad",
  "heimsjø",
  "helgeroa",
  "honningsvåg",
  "kabelvåg",
  "kristiansund", // before ok
  "leirvik",
  "mausund",
  "måløy",
  "narvik",
  "ny-ålesund", // before ok
  "oscarsborg",
  "oslo",
  "rørvik",
  "sandnes", // not ok
  "sirevåg",
  "stavanger", // NOT OK
  "tregde",
  "tromsø",
  "trondheim",
  "vardø",
  "viker",
  "ålesund",
];

const locations: [number, number][] = [
  [69.315267, 16.117299],
  [60.369531, 5.334363],
  [67.281655, 14.425556],
  [60.473373, 6.900656],
  [70.413527, 24.076404],
  [68.79409, 16.529603],
  [63.425879, 9.095264],
  [58.992445, 9.864825],
  [70.980882, 25.976827],
  [68.209728, 14.476578],
  [63.113194, 7.763775],
  [59.780592, 5.497318],
  [63.862982, 8.657514],
  [61.937131, 5.114274],
  [68.437671, 17.435895],
  [78.918701, 11.93772],
  [59.677499, 10.605142],
  [59.921639, 10.714379],
  [58.849795, 5.726917],
  [58.505381, 5.798056],
  [58.976871, 5.709849],
  [58.009823, 7.540309],
  [69.671613, 18.953032],
  [63.431045, 10.412592],
  [64.862085, 11.240181], // inserted directly
  [70.370343, 31.099269],
  [59.037388, 10.948513],
  [62.473042, 6.202297],
];

type WaterLevelRecord = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  surge: number;
  tide: number;
  total: number;
  percentiles: {
    p0: number;
    p25: number;
    p50: number;
    p75: number;
    p100: number;
  };
};

type WaterLevelForecast = {
  lastUpdated: Date;
  location: string;
  records: WaterLevelRecord[];
};

export function getTide(lat: number, long: number) {
  const harbor = findHarbor(lat, long);
  console.log(harbor);
  const { data: data } = useQuery(["tide", harbor], () =>
    fetchToTxt(
      `https://yrweatherbackend.vercel.app/tidalwater/1.1/?harbor=${harbor}`,
      {
        method: "GET",
      },
    ),
  );
  return data;
}

function parseForecast(data: string): WaterLevelForecast {
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Extract the "Last Updated" time
  const lastUpdatedLine = lines.find((line) =>
    line.startsWith("SIST OPPDATERT"),
  );
  if (!lastUpdatedLine) throw new Error("Last updated time not found.");
  const lastUpdatedMatch = lastUpdatedLine.match(
    /(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}) UTC/,
  );
  if (!lastUpdatedMatch)
    throw new Error("Invalid date format in last updated.");
  const lastUpdated = new Date(
    Date.UTC(
      +lastUpdatedMatch[1],
      +lastUpdatedMatch[2] - 1,
      +lastUpdatedMatch[3],
      +lastUpdatedMatch[4],
      +lastUpdatedMatch[5],
    ),
  );

  // Extract the location
  const location = lines.find((line) => /^[A-ZÆØÅ]+$/.test(line)) || "Unknown";

  // Extract records
  const records: WaterLevelRecord[] = [];
  const dataLines = lines.filter((line) => /^\d{4}/.test(line));
  dataLines.forEach((line) => {
    const [
      year,
      month,
      day,
      hour,
      minute,
      surge,
      tide,
      total,
      p0,
      p25,
      p50,
      p75,
      p100,
    ] = line
      .split(/\s+/)
      .map((value, index) =>
        index > 4 ? parseFloat(value) : parseInt(value, 10),
      );

    records.push({
      year,
      month,
      day,
      hour,
      minute,
      surge,
      tide,
      total,
      percentiles: {
        p0,
        p25,
        p50,
        p75,
        p100,
      },
    });
  });

  return {
    lastUpdated,
    location,
    records,
  };
}

function findHarbor(lat: number, long: number) {
  console.log(lat, long);

  let dist = locations.map((u) =>
    Math.sqrt(Math.pow(u[0] - lat, 2) + Math.pow(u[1] - long, 2)),
  );
  console.log(dist);
  return harbors[dist.findIndex((u) => u == Math.min(...dist)) + 1];
}

export interface forecast {
  x: number[];
  y: number[];
  i: number;
  end: number;
}

function findClosest(v: number[], i: number) {
  let d = v.map((u) => Math.abs(u - i));
  let m = Math.min(...d);
  return d.findIndex((t) => t == m);
}

function parse(d: forecast) {
  let index = findClosest(d.x, d.i);
  let data = cutArrayIfOverLimit(
    d.y.filter((a, b) => b >= index), // data point every 10 min. 100*10min = 1000min = 16 hours.
    100,
  );
  let datax = cutArrayIfOverLimit(
    d.x.filter((a, b) => b >= index),
    100,
  );

  let im = findClosest(data, Math.min(...data));
  let ima = findClosest(data, Math.max(...data));
  console.log(data, im, ima);
  let closest = Math.min(im, ima);
  let until = Math.abs(datax[0] - datax[closest]) * d.end;
  let text = im < ima ? "min" : "max";

  return secondsToHHMM(until) + " until " + text;
}

function normalizeToPercentageRangeFromArray(
  array: number[],
  value: number,
): number {
  const min = Math.min(...array); // Find the minimum value in the array
  const max = Math.max(...array); // Find the maximum value in the array

  const minRange = -100;
  const maxRange = 100;

  // Normalize value to the [0, 1] range
  const normalized = (value - min) / (max - min);

  // Scale it to the [-100%, 100%] range
  const scaled = normalized * (maxRange - minRange) + minRange;

  return scaled;
}

function getTideReal(data: WaterLevelForecast): forecast {
  let today = new Date();
  let dtoday = data.records.filter((t) => t.day == today.getDate());
  let x = dtoday.map((t) =>
    secondsSinceStartOfDay(new Date(t.year, t.month, t.day, t.hour, t.minute)),
  );
  let end = x[x.length - 1];
  let i = secondsSinceStartOfDay(new Date()) / end;
  x = x.map((t) => t / end);
  let y = dtoday.map((t) => t.total);
  return { x: x, y: y, i: i, end: end };
}

export function TideLocation(props: { lat: number; long: number }) {
  let raw = getTide(props.lat, props.long);
  if (raw == undefined) {
    return <></>;
  }
  let data = getTideReal(parseForecast(raw));
  let values = Array.from(new Set(data?.y)).sort((a, b) => a - b);
  const gradientArray = generateGradient(["#004f64", "#7fffd4"], values.length);
  const test = data.y.map((t) => values.findIndex((v) => v == t));
  let transform = (v: number) => Math.round(v).toString() + "%";

  const zones: zone[] = data.x.map((v, i, a) => {
    return {
      startVal: v,
      endVal: i != a.length - 1 ? a[i + 1] : v + 4,
      text: parse(data),
      color: gradientArray[values.findIndex((v) => v == data.y[i])],
    };
  });

  return (
    <ChartComponent
      title={"Tide"}
      progress={data.i}
      zones={zones}
      transform={(u) => u}
      indicatorTextTransform={(u) =>
        transform(
          normalizeToPercentageRangeFromArray(
            data.y,
            data.y[findClosest(data.x, data.i)],
          ),
        )
      }
    ></ChartComponent>
  );
}
