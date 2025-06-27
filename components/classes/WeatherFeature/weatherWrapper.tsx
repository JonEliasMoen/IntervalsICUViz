import { Attribute } from "@/components/classes/interfaces";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";
import {
  InstantDetails,
  TimeSeriesEntry,
  WeatherFeature,
} from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/classes/WeatherFeature/weatherFunc";
import { UV } from "./attributes/UV";
import { TEMP } from "@/components/classes/WeatherFeature/attributes/TEMP";

export class weatherWrapper {
  weather: WeatherFeature;
  timeseries: TimeSeriesEntry[];
  uv: UV;
  temp: TEMP;

  constructor(data: WeatherFeature, dayOffset: number) {
    this.weather = data;
    if (dayOffset != -1) {
      this.timeseries = groupByDay(data.properties.timeseries)[dayOffset];
    } else {
      this.timeseries = data.properties.timeseries;
    }
    this.uv = new UV(this);
    this.temp = new TEMP(this);
  }

  setTimeseries(timeseries: TimeSeriesEntry[]) {
    this.timeseries = timeseries;
    this.uv = new UV(this);
    this.temp = new TEMP(this);
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

  getDates(): Date[] {
    return this.timeseries.map((n) => new Date(n.time));
  }
}
