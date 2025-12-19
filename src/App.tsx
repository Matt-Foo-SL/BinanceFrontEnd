import "./App.css";
import { LiveTradeChart } from "./Chart";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [streamRunning, setStreamRunning] = useState(false);
  const [latency, setLatency] = useState("");

  const url = "http://127.0.0.1:8000";
  async function httpRequest(action: string) {
    try {
      const response = await fetch(`${url}/${action}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      if (action === "start") setStreamRunning(true);
    } catch (error) {
      if (error instanceof Error) console.error(error.message);
    }
  }
  async function getLatency() {
    try {
      const response = await fetch(url + "/latency");
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const res = await response.json();
      setLatency(res.approximate_one_way_latency.toFixed(1));
    } catch (error) {
      if (error instanceof Error) console.error(error.message);
    }
  }
  return (
    <>
      <div>
        <LiveTradeChart
          setWsConnected={setWsConnected}
          setStreamRunning={setStreamRunning}
        />
        <p className="text-left">
          Backend connection:{" "}
          {wsConnected ? (
            <span className="text-green-500">Connected</span>
          ) : (
            <span className="text-red-500">Disconnected</span>
          )}
        </p>
        <p className="text-left">
          Refresh to connect, text should change to "Connected"
        </p>
        {/* Latency */}
        <div className="flex mt-5">
          <Button variant="outline" onClick={() => getLatency()}>
            Get latency
          </Button>
        </div>
        <p className="text-left">Approximate latency: {latency}ms </p>

        <p className="text-left mt-5 ">
          Stream Status:{" "}
          {streamRunning ? (
            <span className="text-green-500">Running</span>
          ) : (
            <span className="text-red-500">Stopped</span>
          )}
        </p>
        <div className="flex gap-[10px]">
          <Button variant="outline" onClick={() => httpRequest("start")}>
            Start stream
          </Button>
          <Button variant="outline" onClick={() => httpRequest("stop")}>
            Stop
          </Button>
          <Button variant="outline" onClick={() => httpRequest("crash")}>
            Simulate stream crash and auto-reconnect
          </Button>
        </div>
      </div>
      <h2 className="text-3xl font-semibold text-left mt-5">
        My understanding of the data
      </h2>

      <ul className="list-disc list-inside text-left">
        <li>
          Aggregate trade streams gives data that is combined every 100ms. For
          example if 3 buyers bought a cryptocurrency at $2, the stream will
          return it 1 price in 1 message instead of 3.
        </li>
        <li>
          The objective of this test is to see which stream outperform the
          other. As time is crucial in arbitrage, even a millisecond delay can
          cause a loss in profit. A faster arrival of data can equate to a
          higher profit.
        </li>
        <li>
          The chart shows which channel has a higher number of wins. For every
          trade sent by binance, either A or B will arrive first. If A arrives
          first and B later, A will have recorded a win.
        </li>
        <li>
          A win is calculated once the 2 same trades have arrived from the
          server and not before. For example for trade id 123, if A has arrived
          first for tradeId 123 and A has arrived first again for tradeId 124, a
          win is only calculated once B has arrived for tradeId 123 and 124.
        </li>
        <br />
        <li>Latency is a very tricky subject</li>
        <li>
          True network latency as I understand it so far, depends on a few
          factors. Firstly, the problem states to measure one way latency from
          the exchange to receive time on my end. From my research, one way
          latency cannot be measured easily. That is because it is more of a
          physics problem than a networking one. To measure one way latency
          accurately one needs to have 2 perfectly synchronized clocks. And 2
          clocks at 2 different places always have different timings in absolute
          accuracy terms.
        </li>
        <li>
          To illustrate, for example take the binance server to be located at
          tokyo aws. To measure the time it takes for a packet to travel to
          singapore, we would need to know the exact time of the server's clock
          in tokyo and singapore. They must be synced perfectly down to
          nanoseconds or even more. But to have synchronize clocks, we need to
          know the time it takes to travel to these 2 places. And to know the
          time we need synchronized clocks. So this is an impossible problem.
        </li>
        <li>
          Interestingly enough, this is the same problem as trying to measure
          the one-way speed of light.
        </li>
        <br />
        <p>The best way to calculate latency would be as follows</p>

        <a href="https://info.support.huawei.com/info-finder/encyclopedia/en/NTP.html">
          <img src="/src/assets/latency_ss.png" alt="latency_image.png" />
        </a>
        <p>Above image by Huawei on NTP synchronization</p>
        <li>
          The one way latency problem is solved by calculating the 2 way round
          trip time (RTT) using values t1, t2, t3 and t4. But since t2 and t3 is
          not given by binance's api, I could only obtain the approximate
          latency by taking (t4-t1)/2.
        </li>
        <li>
          One could even calculate a more accurate latency by taking the median
          or mean of several RTTs/2.
        </li>
        <li>
          I have also considered various other solutions of finding more
          accurate latency, for example synchronizing my clock to NTP servers.
        </li>
        <li>
          This method would involve synchronizing my clock to an authoritative
          figure such as the NTP server or GPS systems. It is however not know
          if how perfectly synced binance's side is to NTP or the GPS systems.
          If both sides are perfectly synced to the NTP server for example, I
          would be able to calculate a more accurate one way latency.
        </li>
      </ul>
    </>
  );
}

export default App;
