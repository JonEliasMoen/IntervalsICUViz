import { wellness } from "@/components/utils/_fitnessModel";
import { Attribute } from "@/components/classes/interfaces";
import { arrayIndexSumNormal } from "@/app/(tabs)/actZones";
import { READINESS } from "@/components/classes/wellness/attributes/READINESS";
import { SLEEPSCORE } from "@/components/classes/wellness/attributes/SLEEPSCORE";
import { SLEEP } from "@/components/classes/wellness/attributes/SLEEP";
import { HRV } from "@/components/classes/wellness/attributes/HRV";
import { RHR } from "@/components/classes/wellness/attributes/RHR";
import { ACR } from "@/components/classes/wellness/attributes/ACR";
import { RAMP } from "@/components/classes/wellness/attributes/RAMP";
import { ACRS } from "@/components/classes/wellness/attributes/ACRS";
import { WEIGHT } from "@/components/classes/wellness/attributes/WEIGHT";
import { BODYFAT } from "@/components/classes/wellness/attributes/BODYFAT";

export class wellnessWrapper {
  wellness: wellness[];
  acwr: ACR;
  rampRate: RAMP;
  rhr: RHR;
  hrv: HRV;
  sleep: SLEEP;
  sleepScore: SLEEPSCORE;
  readiness: READINESS;
  acwrs: ACRS;
  weight: WEIGHT;
  fat: BODYFAT;

  constructor(data: wellness[]) {
    this.wellness = data;
    this.acwr = new ACR(this);
    this.rampRate = new RAMP(this);
    this.rhr = new RHR(this);
    this.hrv = new HRV(this);
    this.sleep = new SLEEP(this);
    this.sleepScore = new SLEEPSCORE(this);
    this.readiness = new READINESS(this, [this.hrv, this.rhr]);
    this.acwrs = new ACRS(this);
    this.weight = new WEIGHT(this);
    this.fat = new BODYFAT(this);
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
