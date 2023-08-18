import { createSignal, For, onCleanup, createEffect } from "solid-js";
import { createWS } from "@solid-primitives/websocket";
import NodeInfo from '~/components/NodeInfo';
import { Title } from "solid-start";



export default function Home() {
  const [wsState, setWsState] = createSignal(0);
  const [data, setData] = createSignal([]);
  const [ws, setWs] = createSignal(null);
  const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];

  const setupWebSocket = () => {
    if (typeof window === "undefined" || !("WebSocket" in window)) {
      console.error("WebSocket is not supported in this environment.");
      return;
    }

    const localWs = createWS("wss://ws.eupnea.rotko.net/");
    setWs(localWs);

    localWs.addEventListener("open", () => {
      console.log("WebSocket connection established.");
      setWsState(localWs.readyState);
    });

    localWs.addEventListener("message", (msg) => {
      try {
        const receivedData = JSON.parse(msg.data);
        if (receivedData && receivedData.data) {
          setData(receivedData.data);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    });

    localWs.addEventListener("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    localWs.addEventListener("close", () => {
      console.log("WebSocket closed. Attempting to reconnect in 5 seconds...");
      setWs(null); // Set the WebSocket signal to null on close
      setWsState(localWs.readyState);
      setTimeout(setupWebSocket, 5000);
    });
  };

  // Initialize WebSocket on component mount
  createEffect(setupWebSocket);

  onCleanup(() => {
    const currentWs = ws();
    if (currentWs) {
      currentWs.close();
    }
  });

  return (
    <main class="flex flex-col">
      <Title>Rotko Networks Dashboard</Title>
      <h1>Rotko Infrastructure Overview</h1>
      {wsState() === 1 ? (
        <div class="flex flex-wrap mx-auto">
          <For each={data()}>
            {(node) => <NodeInfo node={node} />}
          </For>
        </div>
      ) : <p text-4xl>{states[wsState()]}...</p>
      }
    </main>
  );
}
