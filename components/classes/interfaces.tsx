import { zone } from "@/components/components/_chatComp";

export interface Attribute {
  last: number;
  transform: (n: number) => number;

  getTransformed(): number[];

  getZones(): zone[];

  getComponent(): React.JSX.Element;
}
