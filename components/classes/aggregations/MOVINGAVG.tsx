import { mean } from "simple-statistics";

export class MOVINGAVG {
  data: number[];
  size: number;

  constructor(data: number[], size: number) {
    this.data = data;
    this.size = size;
  }

  transform(): number[] {
    const result = [];
    for (let i = this.size; i < this.data.length; i += 1) {
      result.push(mean(this.data.slice(i - this.size, i)));
    }
    return result;
  }
}
