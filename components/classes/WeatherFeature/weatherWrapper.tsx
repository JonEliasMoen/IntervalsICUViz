import { Attribute } from "@/components/classes/interfaces";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";
import {
  InstantDetails,
  PrecipationDetails,
  TimeSeriesEntry,
  WeatherFeature,
} from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/classes/WeatherFeature/weatherFunc";
import { UV } from "./attributes/UV";
import { TEMP } from "@/components/classes/WeatherFeature/attributes/TEMP";
import { COVER } from "@/components/classes/WeatherFeature/attributes/COVER";
import { WIND } from "@/components/classes/WeatherFeature/attributes/WIND";
import { RAIN } from "@/components/classes/WeatherFeature/attributes/RAIN";

export class weatherWrapper {
  weather: WeatherFeature;
  timeseries: TimeSeriesEntry[];
  uv: UV;
  temp: TEMP;
  cover: COVER;
  wind: WIND;
  windgust: WIND;
  rain: RAIN;

  constructor(data: WeatherFeature, dayOffset: number) {
    this.weather = data;
    if (dayOffset != -1) {
      this.timeseries = groupByDay(data.properties.timeseries)[dayOffset];
    } else {
      this.timeseries = data.properties.timeseries;
    }
    this.uv = new UV(this);
    this.temp = new TEMP(this);
    this.cover = new COVER(this);
    this.wind = new WIND(this, false);
    this.windgust = new WIND(this, true);
    this.rain = new RAIN(this);
  }

  setTimeseries(timeseries: TimeSeriesEntry[]) {
    this.timeseries = timeseries;
    this.uv = new UV(this);
    this.temp = new TEMP(this);
    this.cover = new COVER(this);
    this.wind = new WIND(this, false);
    this.windgust = new WIND(this, true);
    this.rain = new RAIN(this);

    return this;
  }

  getComposite(d: Attribute[]) {
    let data = d.map((t) => t.getTransformed());
    let start: number[] = Array(data[0].length).fill(0);
    return start.map((i, a) => arrayIndexSumNormal(data, a) / data.length);
  }

  getAttr(d: keyof InstantDetails): number[] {
    return this.timeseries.map((n) => n.data.instant.details[d]);
  }

  getRainAttr(d: keyof PrecipationDetails): number[] {
    // @ts-ignore
    return this.timeseries
      .map((n) => n.data.next_1_hours?.details[d])
      .filter((t) => t != undefined);
  }

  getAttrX(d: keyof InstantDetails): Date[] {
    return this.timeseries
      .filter((n) => n.data.instant.details[d] != undefined)
      .map((t) => new Date(t.time));
  }

  getDates(): Date[] {
    return this.timeseries.map((n) => new Date(n.time));
  }
}
