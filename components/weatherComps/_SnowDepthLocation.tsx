import { gradientGen, isoDateOffset } from "@/components/utils/_utils";
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
  const { data: data } = useQuery({
    queryKey: ["snow", date, x, y],
    queryFn: () =>
      fetchToJson<SnowResp>(url, {
        method: "GET",
      }),
    retry: false,
  });
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
  const colors = gradientGen([0, 255, 243], [2, 0, 185], 7).map(
    (n) => `rgb(${n[0]}, ${n[1]}, ${n[2]})`,
  );
  return (
    <ChartComponent
      progress={depth}
      display={() => depth != 0}
      indicatorTextTransform={(n) => n.toString() + " cm"}
      zones={[
        {
          startVal: 0,
          endVal: 5,
          text: name + ": 0-5cm Snow",
          color: colors[0],
        },
        {
          startVal: 5,
          endVal: 25,
          text: name + ": 5-25cm Snow",
          color: colors[1],
        },
        {
          startVal: 25,
          endVal: 50,
          text: name + ": 25-50cm Snow",
          color: colors[2],
        },
        {
          startVal: 50,
          endVal: 100,
          text: name + ": 50-100cm Snow",
          color: colors[3],
        },
        {
          startVal: 100,
          endVal: 150,
          text: name + ": 100-150cm snow",
          color: colors[4],
        },
        {
          startVal: 150,
          endVal: 200,
          text: name + ": 150-200cm snow",
          color: colors[5],
        },
        {
          startVal: 200,
          endVal: 250,
          text: name + ": 200-250cm snow",
          color: colors[6],
        },
      ]}
      transform={(x) => x / 250}
    ></ChartComponent>
  );
}
