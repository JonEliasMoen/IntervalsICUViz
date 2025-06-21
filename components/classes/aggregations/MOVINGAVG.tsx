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
    for (let i = 0; i < this.data.length - this.size; i += 1) {
      result.push(mean(this.data.slice(i, i + this.size)));
    }
    return result;
  }
}
