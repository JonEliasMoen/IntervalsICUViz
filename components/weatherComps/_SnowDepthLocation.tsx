import ChartComponent from "@/components/components/_chatComp";
import { generateGradient } from "typescript-color-gradient";
import { mean } from "simple-statistics";
import { Text } from "@/components/Themed";
import {
  Feature,
  FeatureCollection,
  getSkiSporet,
  getSnowDepth,
  snowPlace,
} from "@/components/utils/_weatherModel";

export function averagePrep(
  data: FeatureCollection,
  lat: number,
  long: number,
) {
  let dt = data.features.filter((feature: Feature) => {
    let xy = feature.geometry.coordinates[0];
    // @ts-ignore
    let dist = Math.sqrt(Math.pow(xy[0] - long, 2) + Math.pow(xy[1] - lat, 2));
    return dist < 0.00000899 * 1000 * 2;
  });
  let dtt = dt.map((feature) => {
    return (
      feature.properties.newest_prep_days +
      feature.properties.newest_prep_hours / 24
    );
  });
  if (dtt.length > 0) {
    return [Math.min(...dtt), mean(dtt), Math.max(...dtt)].map((t) =>
      Math.round(t),
    );
  } else {
    return [null, null, null];
  }
}

export function SnowDepthLocation(props: { loc: snowPlace }) {
  const data = getSnowDepth(props.loc.x, props.loc.y);
  const depth = data?.Data[0] ?? 0;
  const name = props.loc.name;
  let x = props.loc.x;
  let y = props.loc.y;
  const colors = generateGradient(["#00FFF3", "#0200B9"], 7);
  const prepData = getSkiSporet(
    props.loc.name,
    props.loc.lat,
    props.loc.long,
    0.2,
  );
  if (prepData == undefined) {
    return <></>;
  }
  const aPret = averagePrep(prepData, props.loc.lat, props.loc.long);

  return (
    <>
      {depth > 0 && aPret[1] != 0 && <Text></Text>}
      <ChartComponent
        progress={depth}
        display={() => depth > 10}
        title={name}
        subtitle={
          aPret[0] != null
            ? `Last Prep: ${aPret[0]}/${aPret[1]}/${aPret[2]}`
            : null
        }
        indicatorTextTransform={(n) => n.toString() + " cm"}
        zones={[
          {
            startVal: 0,
            endVal: 5,
            text: "0-5cm Snow",
            color: colors[0],
          },
          {
            startVal: 5,
            endVal: 25,
            text: "5-25cm Snow",
            color: colors[1],
          },
          {
            startVal: 25,
            endVal: 50,
            text: "25-50cm Snow",
            color: colors[2],
          },
          {
            startVal: 50,
            endVal: 100,
            text: "50-100cm Snow",
            color: colors[3],
          },
          {
            startVal: 100,
            endVal: 150,
            text: "100-150cm snow",
            color: colors[4],
          },
          {
            startVal: 150,
            endVal: 200,
            text: "150-200cm snow",
            color: colors[5],
          },
          {
            startVal: 200,
            endVal: 250,
            text: "200-250cm snow",
            color: colors[6],
          },
        ]}
        transform={(x) => x / 250}
      ></ChartComponent>
    </>
  );
}
