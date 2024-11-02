import { gradientGen, isoDateOffset } from "@/app/(tabs)/utils/utils";
import { useQuery } from "@tanstack/react-query";
import ChartComponent, { fetchToJson } from "@/components/chatComp";

interface SnowResp {
  Data: number[];
  [key: string]: any;
}
export function getSnowDepth(x: String, y: String) {
  const date = isoDateOffset(0);
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      `https://gts.nve.no/api/GridTimeSeries/${x}/${y}/${date}/${date}/sd.json`,
    );
  const { data: data } = useQuery(["snow", date], () =>
    fetchToJson<SnowResp>(url, {
      method: "GET",
    }),
  );
  return data;
}
export function SnowDepthLocation(props: {
  name: String;
  x: String;
  y: String;
}) {
  const data = getSnowDepth(props.x, props.y);
  const depth = data?.Data[0] ?? 0;
  const name = props.name;
  console.log(gradientGen([49, 135, 162], [222, 239, 245], 7));
  return (
    <ChartComponent
      progress={depth}
      zones={[
        {
          startVal: 0,
          endVal: 5,
          text: name + ": 0-5cm Snow",
          color: "rgb(0,0,0)",
        },
        {
          startVal: 5,
          endVal: 25,
          text: name + ": 5-25cm Snow",
          color: "rgb(0,0,42)",
        },
        {
          startVal: 25,
          endVal: 50,
          text: name + ": 25-50cm Snow",
          color: "rgb(0,0,84)",
        },
        {
          startVal: 50,
          endVal: 100,
          text: name + ": 50-100cm Snow",
          color: "rgb(0,0,126)",
        },
        {
          startVal: 100,
          endVal: 150,
          text: name + ": 100-150cm snow",
          color: "rgb(0,0,168)",
        },
        {
          startVal: 150,
          endVal: 200,
          text: name + ": 150-200cm snow",
          color: "rgb(0,0,210)",
        },
        {
          startVal: 200,
          endVal: 400,
          text: name + "20 0-400cm snow",
          color: "rgb(0,0,255)",
        },
      ]}
      transform={(x) => x / 400}
    ></ChartComponent>
  );
}
