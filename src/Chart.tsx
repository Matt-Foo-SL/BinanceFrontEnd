"use client";

import { CartesianGrid, Line, LineChart, XAxis, Label } from "recharts";
import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegendContent,
  ChartLegend,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  A: { label: "Channel A", color: "var(--chart-1)" },
  B: { label: "Channel B", color: "var(--chart-2)" },
} satisfies ChartConfig;

type EventData = {
  type: string;
  status: string;
  channel: "A" | "B";
  arrival_time_ns: number;
  event_id: number;
  readable_time: string;
  a_wins: number;
  b_wins: number;
  total: number;
};
interface ChildProps {
  setWsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setStreamRunning: React.Dispatch<React.SetStateAction<boolean>>;
}
export function LiveTradeChart({
  setWsConnected,
  setStreamRunning,
}: ChildProps) {
  const [chartData, setChartData] = useState<any[]>([
    { event_id: 0, A: 0, B: 0, total: 0 },
  ]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // websocket to my python backend
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data: EventData = JSON.parse(event.data);
      if (data.type === "stream_status") {
        if (data.status === "started") {
          console.log("Stream started");
          setStreamRunning(true);
        } else if (data.status === "stopped" || data.status === "crashed") {
          console.log("Stream stopped");
          setStreamRunning(false);
          return;
        }
      }
      const event_id = data.event_id;
      const channel = data.channel;
      console.log(channel, event_id, data.a_wins, data.b_wins);
      setChartData((prevData) => {
        const next = [...prevData];
        next.push({
          event_id: event_id,
          A: data.a_wins,
          B: data.b_wins,
          total: data.total,
        });
        //show last 50 only
        return next.slice(-50);
      });
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);
  useEffect(() => {
    console.log("chartData:", chartData);
  }, [chartData]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Number of wins</CardTitle>
          <CardDescription> Channel A vs B</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="min-h-[200px] w-full max-h-[300px]"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="total"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                hide
              >
                <Label
                  value="Event ID"
                  position="insideBottom"
                  offset={-5}
                  className="fill-foreground text-xs font-medium"
                />
              </XAxis>
              <ChartTooltip
                cursor={false}
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;

                  const data = payload[0].payload;
                  console.log(data);
                  return (
                    <div className="rounded bg-background p-2 text-sm shadow">
                      {/*<div>Time: {point.readable_time}</div>*/}
                      <div>
                        Wins A: {data.A ?? "-"}{" "}
                        {data.total > 0
                          ? `${((data.A / data.total) * 100).toFixed(1)}%`
                          : "0.0%"}
                      </div>
                      <div>
                        Wins B: {data.B ?? "-"}{" "}
                        {data.total > 0
                          ? `${((data.B / data.total) * 100).toFixed(1)}%`
                          : "0.0%"}
                      </div>
                      <div>Trade Id: {data.event_id}</div>
                    </div>
                  );
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="A"
                name="Channel (A)"
                type="monotone"
                stroke="var(--color-A)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="B"
                name="Channel (B)"
                type="monotone"
                stroke="var(--color-B)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 leading-none font-medium">
                The chart shows which channel has a higher number of wins at any
                point. Every point on the graph shows the wins for every message
                received on either channel A or B.
              </div>
              <div className="text-muted-foreground flex items-center gap-2 leading-none">
                Hover mouse over graph to see more info
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
