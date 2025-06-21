export class MOVINGFUNCTION {
  data: number[];
  size: number;
  func: (d: number[]) => number;

  constructor(data: any[], func: (d: any[]) => number, size: number) {
    this.data = data;
    this.size = size;
    this.func = func;
  }

  transform(): number[] {
    const result = [];
    for (let i = 0; i < this.data.length - this.size; i += 1) {
      result.push(this.func(this.data.slice(i, i + this.size)));
    }
    return result;
  }
}
