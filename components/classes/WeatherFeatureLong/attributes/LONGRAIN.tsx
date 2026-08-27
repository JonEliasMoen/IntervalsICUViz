import { weatherLongWrapper } from "../weatherWrapper";
import { normalizeBasedOnRange } from "@/components/utils/_utils";

export class LONGRAIN {
  value: number[];

  constructor(data: weatherLongWrapper) {
    this.value = data.dayIntervals.map((t) => t.precipitation.value);
  }

  getTransformed(): number[] {
    return this.value.map(t => t/10);
  }
}
