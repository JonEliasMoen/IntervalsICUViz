import { Attribute } from "@/components/classes/interfaces";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";
import {
  DayInterval,
  WeatherForecast,
} from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/classes/WeatherFeature/weatherFunc";
import { normalizeBasedOnRangeSingle } from "@/components/utils/_utils";
import { LONGTEMP } from "./attributes/LONGTEMP";
import { LONGRAIN } from "./attributes/LONGRAIN";

export class weatherLongWrapper {
  weather: WeatherForecast;
  dayIntervals: DayInterval[];
  temperature: LONGTEMP;
  rain: LONGRAIN;

  constructor(data: WeatherForecast) {
    this.weather = data;
    this.dayIntervals = data.dayIntervals;
    this.temperature = new LONGTEMP(this);
    this.rain = new LONGRAIN(this);
  }

  getDates(): Date[] {
    return this.dayIntervals.map((n) => new Date(n.start));
  }
}
