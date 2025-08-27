import { Attribute } from "@/components/classes/interfaces";
import React from "react";
import { zone } from "@/components/components/_chatComp";
import { wellnessWrapper } from "@/components/classes/wellness/_wellnessWrapper";
import { ACR } from "@/components/classes/wellness/attributes/ACR";
import { ACRS } from "@/components/classes/wellness/attributes/ACRS";
import { findCommonIntersection, Range } from "@/components/utils/ranges";
import { Boundaries } from "@/components/utils/_otherModel";

export class SOLVE implements Attribute {
  common: Boundaries | null;

  constructor(data: wellnessWrapper, attr: (ACR | ACRS)[]) {
    const bo = [data.acwr.needed, data.acwrs.needed];
    const ranges = bo.map((b) => new Range(b.min, b.max));
    console.log(ranges);
    const co = findCommonIntersection(ranges);
    console.log(co);
    this.common = co ? { min: co.start, max: co.end } : null;
    console.log("common", this.common);
  }

  getTransformed(): number[] {
    return [];
  }

  transform(n: number): number {
    return 0;
  }

  getComponent(): React.JSX.Element {
    return <></>;
  }

  getZones(): zone[] {
    return [];
  }
}
