import { generateGradient } from "typescript-color-gradient";
import { ChartComponent, zone } from "@/components/components/_chatComp";
import { getHayFever, getWeather } from "@/components/utils/_weatherModel";
import { groupByDay } from "@/components/weatherComps/weatherFunc";
import { mean } from "simple-statistics";
import { Text, View } from "@/components/Themed";

export function HayfeverLocation(props: { lat: number; long: number }) {
  //const data = getHayFever(props.lat, props.long);
  /*  if (data == null) {
    return <></>;
  }*/
  return <></>;
}
