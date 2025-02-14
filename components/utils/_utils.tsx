export function today() {
  let d = new Date();
  return d.getDate();
}

export function isoDateOffset(n: number) {
  let date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

export function secondsSinceStartOfDay(date: Date): number {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  // @ts-ignore
  return (date - startOfDay) / 1000;
}
export function cutArrayIfOverLimit<T>(array: T[], maxLength: number): T[] {
  return array.length > maxLength ? array.slice(0, maxLength) : array;
}
export function normalizeBasedOnRange(
  array: number[],
  min: number,
  max: number,
): number[] {
  return array.map((t) => (t - min) / (max - min));
}
export function secondsFrom(date: Date, dateFrom: Date): number {
  // @ts-ignore
  return (date - dateFrom) / 1000;
}
export function getTimeHHMM(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function secondsToHHMM(seconds: number): string {
  if (seconds < 0) throw new Error("Seconds cannot be negative");

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function corsify(url: string): string {
  return `https://thingproxy.freeboard.io/fetch/${url}`;
}

export function hourToString(h: number) {
  // gets time as HH:SS from hours as decimal
  let whole = new Date(1970, 0, 1);
  whole.setSeconds(h * 60 * 60);
  return whole.toTimeString().slice(0, 5);
}

export function fetchToJson<T>(
  url: string,
  params?: object,
  setErrorMessage?: (msg: string) => void,
  operation?: string,
): Promise<T> {
  console.log("fetchiing");
  return fetch(url, params).then((res) => {
    if (res.ok) {
      if (res.status === 204) {
        return null;
      } else {
        return res.json();
      }
    } else if (res.status === 404) {
      return null;
    } else {
      return Promise.reject(null);
    }
  });
}

export function fetchToTxt(
  url: string,
  params?: object,
  setErrorMessage?: (msg: string) => void,
  operation?: string,
): Promise<string | undefined> {
  console.log("fetchiing");
  return fetch(url, params).then((res) => {
    if (res.ok) {
      if (res.status === 204) {
        return undefined;
      } else {
        return res.text();
      }
    } else if (res.status === 404) {
      return undefined;
    } else {
      return Promise.reject(null);
    }
  });
}
