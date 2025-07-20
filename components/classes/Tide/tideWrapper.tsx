import { Attribute } from "@/components/classes/interfaces";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";
import {
  InstantDetails,
  PrecipationDetails,
  TimeSeriesEntry,
  WeatherFeature,
} from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/classes/WeatherFeature/weatherFunc";

export class weatherWrapper {
  weather: WeatherFeature;
  timeseries: TimeSeriesEntry[];

  constructor(data: WeatherFeature, dayOffset: number) {
    this.weather = data;
    if (dayOffset != -1) {
      this.timeseries = groupByDay(data.properties.timeseries)[dayOffset];
    } else {
      this.timeseries = data.properties.timeseries;
    }
  }

  setTimeseries(timeseries: TimeSeriesEntry[]) {
    this.timeseries = timeseries;

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
