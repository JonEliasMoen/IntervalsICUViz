import { normalizeBasedOnRange, secondsFrom } from "@/components/utils/_utils";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { mean } from "simple-statistics";
import { generateGradient } from "typescript-color-gradient";
import {
  feelTempArray,
  feelTempNow,
  groupByDay,
} from "@/components/weatherComps/weatherFunc";
import {
  getWeather,
  InstantDetails,
  PrecipationDetails,
  TimeSeriesEntry,
} from "@/components/utils/_weatherModel";
import ChartComponentRange from "@/components/components/_chatCompRange";

function getRain(t: TimeSeriesEntry): PrecipationDetails | undefined {
  return t.data.next_1_hours?.details;
}

export function stats(values: number[] | undefined) {
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

function transform(dtoday: TimeSeriesEntry[]): number[] {
  let x = dtoday.map((t) =>
    secondsFrom(new Date(t.time), new Date(dtoday[0].time)),
  );
  let end = x[x.length - 1];
  x = x.map((t) => t / end);
  return x;
}

function getFeltTempArrayMapped(data: TimeSeriesEntry[]) {
  const feltTemp: number[] = feelTempArray(data);
  const forecast = transform(data);
  const sfeltTemp = normalizeBasedOnRange(feltTemp, -25, 25).map((t) =>
    Math.round(t * 1000),
  );

  return [feltTemp, sfeltTemp, forecast];
}

export function AirTempLocation(props: {
  lat: number;
  long: number;
  dayOffset: number;
}) {
  const data = getWeather(props.lat, props.long);
  if (data == null) {
    return <></>;
  }
  const dayMap = groupByDay(data.properties.timeseries);
  const today = dayMap[props.dayOffset];
  const fData = getFeltTempArrayMapped(today);
  const feltTemp = fData[0];
  const feltTempNow = feelTempNow(today[0].data.instant.details);

  const gradientArray = generateGradient(["#02c7fc", "#ff0404"], 1000);
  const zonesFF = dayMap.map((k, i) => {
    const fData = getFeltTempArrayMapped(k);
    const sfeltTemp = Math.round(mean(fData[1]));
    return {
      startVal: i * (1 / 11),
      endVal: (i + 1) * (1 / 11),
      text: "",
      color: gradientArray[sfeltTemp],
    };
  });

  const wind = summary("wind_speed", today);
  const wind2 = summary("wind_speed_of_gust", today);
  // @ts-ignore
  const rain: PrecipationDetails[] = today
    .map((n) => getRain(n))
    .filter((n) => n != undefined);

  const maxRain = rain
    .map((t) => t.precipitation_amount_max)
    .reduce((sum, value) => sum + value, 0);
  const minRain = rain
    .map((t) => t.precipitation_amount_min)
    .reduce((sum, value) => sum + value, 0);
  const expRain = rain
    .map((t) => t.precipitation_amount)
    .reduce((sum, value) => sum + value, 0);
  const rainProb =
    1 -
    rain
      .map((t) => 1 - t.probability_of_precipitation / 100)
      .reduce((sum, value) => sum * value, 1);
  const thunderProb =
    1 -
    rain
      .map((t) => 1 - t.probability_of_thunder / 100)
      .reduce((sum, value) => sum * value, 1);

  const colorsw = generateGradient(["#F5AF19", "#F12711"], 10);
  const colors = generateGradient(["#02c7fc", "#ff0404"], 6 * 2);

  const zones: zone[] = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25].map(
    (v, i) => {
      return {
        startVal: v,
        endVal: v + 5,
        text: `${v}-${v + 5}°C `,
        color: colors[i],
      };
    },
  );
  const windText: string[] = [
    "Calm",
    "Light Air",
    "Light Breeze",
    "Gentle breeze",
    "Moderate breeze",
    "Fresh Breeze",
    "Strong breeze",
    "High wind",
    "Gale",
  ];
  const zonesw: zone[] = [0, 0.3, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20].map(
    (v, i, a) => {
      return {
        startVal: v,
        endVal: i != 9 ? a[i + 1] : v + 4,
        text: windText[i], // `${v}-${i != 9 ? a[i + 1] : v + 4} m/s `
        color: colorsw[i],
      };
    },
  );
  const rainText = [
    "",
    "Weak rain",
    "Moderate rain",
    "Heavy rain",
    "Very heavy rain",
    "Shower",
  ];
  const zonesr: zone[] = [0, 0.5, 2, 6, 10, 18, 30].map((v, i, a) => {
    return {
      startVal: v,
      endVal: i != 9 ? a[i + 1] : v + 4,
      text: rainText[i],
      color: colorsw[i],
    };
  });
  console.log(props.dayOffset, wind2[0]);
  return (
    <>
      <ChartComponentRange
        title={"Average temp"}
        subtitle={"Now: " + feltTempNow.toFixed(2) + "°C"}
        progressFrom={stats(feltTemp)[0]}
        progressValue={stats(feltTemp)[1]}
        progressTo={stats(feltTemp)[2]}
        zones={zones}
        transform={(v) => (v + 25) / 50}
        indicatorTextTransform={(n) => n.toFixed(2) + "°C"}
      ></ChartComponentRange>
      <ChartComponent
        title={"Temp days forward"}
        progress={0}
        zones={zonesFF}
        transform={(u) => u}
        indicatorTextTransform={() => ""}
      ></ChartComponent>
      <ChartComponentRange
        title={"Avg wind"}
        progressFrom={wind[0]}
        progressValue={wind[1]}
        progressTo={wind[2]}
        zones={zonesw}
        transform={(v) => v / 24}
        indicatorTextTransform={(n) => n.toFixed(2) + "m/s"}
      ></ChartComponentRange>
      <ChartComponentRange
        title={"Avg wind gale"}
        display={() => props.dayOffset < 3}
        progressFrom={wind2[0]}
        progressValue={wind2[1]}
        progressTo={wind2[2]}
        zones={zonesw}
        transform={(v) => v / 24}
        indicatorTextTransform={(n) => n.toFixed(2) + "m/s"}
      ></ChartComponentRange>
      <ChartComponentRange
        title={"Rain"}
        subtitle={
          "RainProb: " +
          (rainProb * 100).toFixed(0) +
          "% ThunderProb: " +
          (thunderProb * 100).toFixed(0) +
          "%"
        }
        progressFrom={minRain / today.length}
        progressValue={expRain / today.length}
        progressTo={maxRain / today.length}
        zones={zonesr}
        transform={(n) => n / 30}
        indicatorTextTransform={(n) => n.toFixed(2) + "mm/h"}
      ></ChartComponentRange>
    </>
  );
}
