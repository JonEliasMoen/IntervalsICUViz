export class Range {
  public start: number;
  public end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  toString(): string {
    return this.start === this.end
      ? `${this.start}`
      : `${this.start}-${this.end}`;
  }

  // Check if this range overlaps with another range
  overlapsWith(range: Range): boolean {
    return this.start <= range.end && this.end >= range.start;
  }

  // Trim the current range based on another range
  trimWith(range: Range): Range | null {
    if (!this.overlapsWith(range)) {
      return this; // No overlap, return the original range
    }

    if (this.start < range.start && this.end > range.end) {
      // Trim both ends
      return new Range(this.start, range.start - 1);
    }

    if (this.start < range.start) {
      // Trim the right side
      return new Range(this.start, range.start - 1);
    }

    if (this.end > range.end) {
      // Trim the left side
      return new Range(range.end + 1, this.end);
    }

    return null; // If the range is fully contained in the trimming range, return null
  }
}

export function convertToRanges(arr: number[]): Range[] {
  if (arr.length === 0) return [];

  arr.sort((a, b) => a - b);

  const ranges: Range[] = [];
  let start = arr[0];
  let end = arr[0];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === end + 1) {
      end = arr[i];
    } else {
      ranges.push(new Range(start, end));
      start = arr[i];
      end = arr[i];
    }
  }

  ranges.push(new Range(start, end));

  return ranges;
}

export function trimRanges(ranges: Range[], trimRange: Range): Range[] {
  const trimmedRanges: Range[] = [];
  console.log(ranges, trimRange);
  for (let range of ranges) {
    const trimmedRange = range.trimWith(trimRange);
    if (trimmedRange) {
      trimmedRanges.push(trimmedRange);
    }
  }

  return trimmedRanges;
}
