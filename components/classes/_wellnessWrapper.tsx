import { wellness } from "@/components/utils/_fitnessModel";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { Attribute } from "@/components/classes/interfaces";
import { QUANTILE } from "@/components/classes/QUANTILE";
import React from "react";
import ChartComponentQuantile from "@/components/components/_chatCompQuantile";
import { hourToString } from "@/components/utils/_utils";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";

function getLast(data: number[]) {
  return data[data.length - 1];
}

function trim(n: number): number {
  let v = Math.min(1, Math.max(0, n));
  return v;
}

function transformed(data: number[], clas: Attribute) {
  return data.map((t) => trim(clas.transform(t)));
}

export class wellnessWrapper {
  wellness: wellness[];
  acwr: ACR;
  rampRate: RAMP;
  rhr: RHR;
  hrv: HRV;
  sleep: SLEEP;
  sleepScore: SLEEPSCORE;
  readiness: READINESS;

  constructor(data: wellness[]) {
    this.wellness = data;
    this.acwr = new ACR(this);
    this.rampRate = new RAMP(this);
    this.rhr = new RHR(this);
    this.hrv = new HRV(this);
    this.sleep = new SLEEP(this);
    this.sleepScore = new SLEEPSCORE(this);
    this.readiness = new READINESS(this, [
      this.hrv,
      this.rhr,
      this.sleep,
      this.sleepScore,
    ]);
  }

  getComposite(d: Attribute[]) {
    let data = d.map((t) => t.getTransformed());
    let start: number[] = Array(data[0].length).fill(0);
    return start.map((i, a) => arrayIndexSumNormal(data, a) / data.length);
  }

  getAttr(d: keyof wellness): number[] {
    return this.wellness.map((t) => (t[d] == 0 || t[d] == null ? 0 : t[d]));
  }
}

export class READINESS implements Attribute {
  value: number[];
  last: number;

  constructor(wr: wellnessWrapper, data: Attribute[]) {
    this.value = wr.getComposite(data);
    this.last = getLast(this.value);
    console.log("readiness", this.value);
    const q = new QUANTILE(this.value);
    console.log(q.inverse(0.3), q.inverse(0.7));
  }

  transform(n: number) {
    return n;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Health readiness"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last}
        indicatorTextTransform={(n) => Math.round(n * 100) + "%"}
        transform={this.transform}
        zones={this.getZones()}
      ></ChartComponent>
    );
  }

  getZones() {
    return [
      {
        text: "Very Low",
        startVal: 0,
        endVal: 0.1,
        color: "#D627284D",
      },
      {
        text: "Low",
        startVal: 0.1,
        endVal: 0.25,
        color: "#FFCB0E80",
      },
      {
        text: "Normal",
        startVal: 0.25,
        endVal: 0.75,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.75,
        endVal: 0.9,
        color: "#1F77B44D",
      },
      {
        text: "Very Elevated",
        startVal: 0.9,
        endVal: 1,
        color: "#1f77b4",
      },
    ];
  }

  getTransformed(): number[] {
    return this.value;
  }
}

export class SLEEPSCORE implements Attribute {
  sleepScore: number[];
  sleepScoreT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.sleepScore = data.getAttr("sleepScore");
    this.sleepScoreT = transformed(this.sleepScore, this);
    this.last = getLast(this.sleepScore);
  }

  getTransformed(): number[] {
    return this.sleepScoreT;
  }

  transform(n: number): number {
    return (n - 40) / (100 - 40);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Sleep Score"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last != null ? Math.round(this.last) : 0}
        indicatorTextTransform={(n) => Math.round(n) + "%"}
        transform={this.transform}
        zones={this.getZones()}
      ></ChartComponent>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "Very Poor",
        startVal: 40,
        endVal: 59,
        color: "#D627284D",
      },
      {
        text: "Poor",
        startVal: 60,
        endVal: 69,
        color: "#FFCB0E80",
      },
      {
        text: "Fair",
        startVal: 70,
        endVal: 79,
        color: "#C8F509A8",
      },
      {
        text: "Good",
        startVal: 80,
        endVal: 89,
        color: "#009E0057",
      },
      {
        text: "Excellent",
        startVal: 90,
        endVal: 100,
        color: "#009E0099",
      },
    ];
  }
}

export class SLEEP implements Attribute {
  sleep: number[];
  sleepT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.sleep = data.getAttr("sleepSecs").map((t) => t / 3600);
    this.sleepT = transformed(this.sleep, this);
    this.last = getLast(this.sleep);
  }

  getTransformed(): number[] {
    return this.sleepT;
  }

  transform(n: number): number {
    return (n - 4) / 6;
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponent
        title={"Sleep"}
        display={() => this.last != 0 && this.last != null}
        progress={this.last != null ? this.last : 5}
        indicatorTextTransform={hourToString}
        zones={this.getZones()}
        transform={this.transform}
      ></ChartComponent>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "4-5 Hours",
        startVal: 4,
        endVal: 5,
        color: "#DD04A74D",
      },
      {
        text: "5-6 Hours",
        startVal: 5,
        endVal: 6,
        color: "#FFCB0E80",
      },
      {
        text: "6-7 Hours",
        startVal: 6,
        endVal: 7,
        color: "#C8F509A8",
      },
      {
        text: "7-8 Hours",
        startVal: 7,
        endVal: 8,
        color: "#009E0057",
      },
      {
        text: "8-9 Hours",
        startVal: 8,
        endVal: 9,
        color: "#009E0099",
      },
      {
        text: "9-10 Hours",
        startVal: 9,
        endVal: 10,
        color: "#1D00CCFF",
      },
    ];
  }
}

export class HRV implements Attribute {
  hrv: number[];
  hrvT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.hrv = data.getAttr("hrv");
    this.quantile = new QUANTILE(this.hrv, 7 * 4);
    this.hrvT = transformed(this.hrv, this);
    this.last = getLast(this.hrv);
  }

  getTransformed(): number[] {
    return this.hrvT;
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"HRV (rMSSD)"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "ms " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
    );
  }

  getZones(): zone[] {
    return [
      {
        text: "Very Low",
        startVal: 0,
        endVal: 0.1,
        color: "#D627284D",
      },
      {
        text: "Low",
        startVal: 0.1,
        endVal: 0.25,
        color: "#FFCB0E80",
      },
      {
        text: "Normal",
        startVal: 0.25,
        endVal: 0.75,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.75,
        endVal: 0.9,
        color: "#1F77B44D",
      },
      {
        text: "Very Elevated",
        startVal: 0.9,
        endVal: 1,
        color: "#1f77b4",
      },
    ];
  }
}

export class RHR implements Attribute {
  rhr: number[];
  rhrT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.rhr = data.getAttr("restingHR");
    this.quantile = new QUANTILE(this.rhr, 7 * 4);
    this.rhrT = transformed(this.rhr, this);
    this.last = getLast(this.rhr);
  }

  getTransformed(): number[] {
    return this.rhrT.map((t) => 1 - t);
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"Resting hr"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          Math.round(t) + "bpm " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
    );
  }

  getZones(): zone[] {
    return [
      { text: "Low", startVal: 0, endVal: 0.3, color: "#1F77B44D" },
      {
        text: "Normal",
        startVal: 0.3,
        endVal: 0.7,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.7,
        endVal: 1,
        color: "#D627284D",
      },
    ];
  }
}

export class ACR implements Attribute {
  atl: number[];
  ctl: number[];
  acwr: number[];
  acwrT: number[];
  last: number;

  constructor(data: wellnessWrapper) {
    this.atl = data.getAttr("atl");
    this.ctl = data.getAttr("ctl");
    this.acwr = this.getAcwr();
    this.acwrT = transformed(this.acwr, this);
    this.last = getLast(this.acwr);
  }

  getTransformed(): number[] {
    return this.acwrT;
  }

  getAcwr() {
    return this.ctl.map((t, i) => this.atl[i] / t);
  }

  transform(n: number): number {
    return n / 2.0;
  }

  getZones(): zone[] {
    return [
      {
        text: "Low",
        startVal: 0,
        endVal: 0.8,
        color: "#1F77B44D",
      },
      {
        text: "Optimal",
        startVal: 0.8,
        endVal: 1.3,
        color: "#009E0066",
      },
      {
        text: "High",
        startVal: 1.3,
        endVal: 1.5,
        color: "#FFCB0E80",
      },
      {
        text: "Very high",
        startVal: 1.5,
        endVal: 2,
        color: "#D627284D",
      },
    ];
  }

  getComponent() {
    return (
      <ChartComponent
        title={"ACWR"}
        progress={this.last}
        zones={this.getZones()}
        transform={this.transform}
      />
    );
  }
}

export class RAMP implements Attribute {
  ramp: number[];
  rampT: number[];
  quantile: QUANTILE;
  last: number;

  constructor(data: wellnessWrapper) {
    this.ramp = data.getAttr("rampRate");
    this.quantile = new QUANTILE(this.ramp, 7 * 4);
    this.rampT = transformed(this.ramp, this);
    this.last = getLast(this.ramp);
  }

  getTransformed(): number[] {
    return this.rampT;
  }

  transform(n: number): number {
    return this.quantile.transform(n);
  }

  getComponent(): React.JSX.Element {
    return (
      <ChartComponentQuantile
        values={this.quantile}
        title={"Ramprate"}
        display={() => this.last != null}
        progress={this.last ?? 0}
        zones={this.getZones()}
        indicatorTextTransform={(t, q) =>
          t.toFixed(2) + " " + Math.round(q * 100) + "%"
        }
      ></ChartComponentQuantile>
    );
  }

  getZones(): zone[] {
    return [
      { text: "Low", startVal: 0, endVal: 0.3, color: "#1F77B44D" },
      {
        text: "Normal",
        startVal: 0.3,
        endVal: 0.7,
        color: "#009E0066",
        normal: true,
      },
      {
        text: "Elevated",
        startVal: 0.7,
        endVal: 1,
        color: "#D627284D",
      },
    ];
  }
}
