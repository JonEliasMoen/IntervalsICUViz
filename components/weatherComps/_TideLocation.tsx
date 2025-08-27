import {
  fetchToTxt,
  getTimeHHMM,
  secondsSinceStartOfDay,
  secondsToHHMM,
} from "@/components/utils/_utils";
import { useQuery } from "@tanstack/react-query";
import { ChartComponent, zone } from "@/components/components/_chatComp";
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

export function findHarbor(lat: number, long: number) {
  let dist = locations.map((u) =>
    Math.sqrt(Math.pow(u[0] - lat, 2) + Math.pow(u[1] - long, 2)),
  );
  return harbors[dist.findIndex((u) => u == Math.min(...dist)) + 1];
}

interface extrema {
  type: string;
  index: number;
  sec: number;
}

export interface forecast {
  x: number[];
  y: number[];
  i: number;
  end: number;
  nowY: number;
  extr: extrema[];
  nextr: extrema | undefined;
}

function getTideReal(data: WaterLevelForecast, now: Date): forecast {
  let today = new Date();
  let dtoday = data.records.filter((t) => t.day == today.getDate());
  let x = dtoday.map(
    (t) =>
      secondsSinceStartOfDay(
        new Date(t.year, t.month, t.day, t.hour, t.minute),
      ) +
      2 * 60 * 60,
  );
  let end = 60 * 60 * 24;
  let i = secondsSinceStartOfDay(now) / end;
  let nowI = Math.round(i * x.length);

  let y = dtoday.map((t) => t.total);
  let max = Math.max(...y);
  let min = Math.abs(Math.min(...y));
  y = y.map((t) => (t + min) / (max + min));

  let current = 0;
  let extr: extrema[] = [];
  let counter = 0;
  let thres = 10;
  y.map((t, i, v) => {
    if (i > 0) {
      if (v[i - 1] < t) {
        if (current == -1 && counter > thres) {
          counter = 0;
          extr.push({ type: "low", index: i, sec: x[i] });
        }
        counter += 1;
        current = 1;
        return 1; // increasing
      } else if (v[i - 1] > t) {
        if (current == 1 && counter > thres) {
          counter = 0;
          extr.push({ type: "high", index: i, sec: x[i] });
        }
        counter += 1;
        current = -1;
        return -1; // decreasing
      } else {
        if (current == 1 && counter > thres) {
          extr.push({ type: "high", index: i, sec: x[i] });
        }
        if (current == -1 && counter > thres) {
          extr.push({ type: "low", index: i, sec: x[i] });
        }
        counter = 0;
        current = 0;
      }
    }

    return 0;
  });
  let coming = extr.find((t) => t.index > nowI);
  x = x.map((t) => t / end);
  return {
    x: x,
    y: y,
    i: i,
    nowY: y[nowI],
    end: end,
    extr: extr,
    nextr: coming,
  };
}

export function TideLocation(props: { lat: number; long: number; now: Date }) {
  let raw = getTide(props.lat, props.long);
  if (raw == undefined) {
    return <></>;
  }
  let data = getTideReal(parseForecast(raw), props.now);
  let extrText = data.extr.map((t) => t.type + " " + secondsToHHMM(t.sec));
  let until = "";
  if (data.nextr != undefined) {
    until =
      secondsToHHMM(data.nextr.sec - secondsSinceStartOfDay(props.now)) +
      " until " +
      data.nextr.type;
  }
  const gradientArray = generateGradient(["#004f64", "#7fffd4"], 101);
  let transform = (v: number) => Math.round(v).toString() + "%";

  const zones: zone[] = data.x.map((v, i, a) => {
    return {
      startVal: v,
      endVal: i != a.length - 1 ? a[i + 1] : v + 4,
      text: until,
      color: gradientArray[Math.round(data.y[i] * 100)],
    };
  });

  return (
    <ChartComponent
      title={"Tide"}
      progress={data.i}
      subtitle={extrText.join(" ")}
      zones={zones}
      transform={(u) => u}
      indicatorTextTransform={(u) =>
        getTimeHHMM(props.now) + " " + transform(data.nowY * 100)
      }
    ></ChartComponent>
  );
}
