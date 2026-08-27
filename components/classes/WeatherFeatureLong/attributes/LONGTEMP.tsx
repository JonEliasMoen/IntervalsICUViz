import { weatherLongWrapper } from "../weatherWrapper";
import { normalizeBasedOnRange } from "@/components/utils/_utils";

export class LONGTEMP {
  low: number[];
  high: number[];

  constructor(data: weatherLongWrapper) {
    this.low = data.dayIntervals.map((t) => t.temperature.min);
    this.high = data.dayIntervals.map((t) => t.temperature.max);
  }

  getTransformedLow(): number[] {
    return normalizeBasedOnRange(this.low, -30, 40);
  }
  getTransformedHigh(): number[] {
    return normalizeBasedOnRange(this.high, -30, 40);
  }
}
