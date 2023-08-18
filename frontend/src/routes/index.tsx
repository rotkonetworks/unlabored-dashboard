import { createSignal, For, onCleanup } from "solid-js";
import { createWS } from "@solid-primitives/websocket";
import NodeInfo from '~/components/NodeInfo';
import { Title } from "solid-start";

export default function Home() {
  let ws;
  const [data, setData] = createSignal([]);
  const states = ["Connecting", "Connected", "Disconnecting", "Disconnected"];

  const setupWebSocket = () => {
    if (typeof window === "undefined" || !("WebSocket" in window)) {
      console.error("WebSocket is not supported in this environment.");
      return;
    }

    ws = createWS("ws://localhost:5000");

    ws.addEventListener("message", (msg) => {
      try {
        const receivedData = JSON.parse(msg.data);
        if (receivedData && receivedData.data) {
          setData(receivedData.data);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket Error:", error);
    });

    ws.addEventListener("close", () => {
      console.log("WebSocket closed. Attempting to reconnect in 5 seconds...");
      setTimeout(setupWebSocket, 5000);
    });

    onCleanup(() => {
      if (ws) {
        ws.close();
      }
    });
  };

  // Initialize WebSocket on component mount
  setupWebSocket();

  return (
    <main>
      <Title>Proxmox Dashboard</Title>
      <h1>Proxmox Node Overview</h1>
      <p>Connection: {ws && states[ws.readyState]}</p>
      <div class="flex flex-wrap">
        <For each={data()}>
          {(node) => <NodeInfo node={node} />}
        </For>
      </div>
    </main>
  );
}
