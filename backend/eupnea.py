from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
from twisted.internet import reactor
import requests
import os
from dotenv import load_dotenv
import json
import time
from collections import deque


class CircularBuffer:
    def __init__(self, maxlen):
        self.data = deque(maxlen=maxlen)

    def append(self, value):
        self.data.append(value)

    def get_oldest(self):
        return self.data[0] if self.data else None

    def get_newest(self):
        return self.data[-1] if self.data else None


load_dotenv()

API_ENDPOINT = os.environ.get("API_ENDPOINT")
TOKEN = os.environ.get("TOKEN")
HEADERS = {"Authorization": TOKEN}
RATES_WINDOW = 30  # calculate rates over the last 30 data points

requests.packages.urllib3.disable_warnings()

data_cache = {}
prev_data = {}


def fetch_json_data(endpoint):
    try:
        url = f"{API_ENDPOINT}{endpoint}"
        #    print(f"Fetching data from: {url}")
        response = requests.get(url, headers=HEADERS, verify=False)
        response.raise_for_status()
        data = response.json().get("data", {})
        #    print(f"Data fetched: {data}")
        return data
    except Exception as e:
        print(f"Error in fetch_json_data for {endpoint}: {e}")
        return {}


def get_container_data(node_name, container):
    container_id = container.get("vmid")
    container_info = fetch_json_data(f"/nodes/{node_name}/lxc/{container_id}/config")
    container_status = fetch_json_data(
        f"/nodes/{node_name}/lxc/{container_id}/status/current"
    )

    current_netin = container_status.get("netin", 0)
    current_netout = container_status.get("netout", 0)

    key = f"{node_name}-{container_id}"

    if key not in prev_data:
        prev_data[key] = {
            "netin": CircularBuffer(RATES_WINDOW),
            "netout": CircularBuffer(RATES_WINDOW),
            "timestamp": CircularBuffer(RATES_WINDOW),
        }

    netin_rate, netout_rate = 0, 0
    prev_netin = prev_data[key]["netin"].get_oldest()
    prev_netout = prev_data[key]["netout"].get_oldest()
    prev_timestamp = prev_data[key]["timestamp"].get_oldest()

    if (
        prev_netin is not None
        and prev_netout is not None
        and prev_timestamp is not None
    ):
        time_elapsed = time.time() - prev_timestamp
        netin_rate = calculate_rate(current_netin, prev_netin, time_elapsed)
        #        print(f"{key} netin rate: {netin_rate}")
        netout_rate = calculate_rate(current_netout, prev_netout, time_elapsed)

    prev_data[key]["netin"].append(current_netin)
    prev_data[key]["netout"].append(current_netout)
    prev_data[key]["timestamp"].append(time.time())

    return {
        "id": container_id,
        "hostname": container_info.get("hostname"),
        "status": container.get("status"),
        "cpu": container_status.get("cpu", 0),
        "memory_used": int(container_status.get("mem", 0) / (1024 * 1024)),
        "memory_total": int(container_status.get("maxmem", 0) / (1024 * 1024)),
        "netin": current_netin,
        "netout": current_netout,
        "netin_rate": netin_rate,
        "netout_rate": netout_rate,
    }


def calculate_rate(current, prev, time_elapsed):
    return (current - prev) * 8 / time_elapsed  # bps rate


def get_node_data(node):
    node_name = node.get("node")
    node_status = fetch_json_data(f"/nodes/{node_name}/status")
    containers = fetch_json_data(f"/nodes/{node_name}/lxc")
    containers = sorted(containers, key=lambda x: x.get("vmid", 0))

    return {
        "name": node_name,
        "cpu": node_status.get("cpu", 0),
        "disk": int(node.get("disk") / (1024 * 1024 * 1024)),
        "containers": list(
            map(lambda container: get_container_data(node_name, container), containers)
        ),
    }


def update_cache():
    try:
        nodes = fetch_json_data("/nodes")
        nodes = sorted(nodes, key=lambda x: x.get("node", ""))
        nodes_data = list(map(get_node_data, nodes))
        data_cache["data"] = nodes_data
        reactor.callLater(2, update_cache)  # adjust interval as needed
    except Exception as e:
        print(f"Error updating cache: {e}")


class MyServerProtocol(WebSocketServerProtocol):
    def __init__(self):
        super().__init__()
        self.is_connected = False
        self.last_sent_data = None

    def onConnect(self, request):
        print(f"Client connecting: {request.peer}")

    def onOpen(self):
        print("WebSocket connection open.")
        self.is_connected = True
        reactor.callLater(0, self.send_updates)

    def send_updates(self):
        if not self.is_connected:
            return

        try:
            if self.state == WebSocketServerProtocol.STATE_OPEN:
                # Check if data has been updated since the last send
                if data_cache != self.last_sent_data:
                    self.sendMessage(json.dumps(data_cache).encode("utf-8"))
                    self.last_sent_data = data_cache.copy()
            else:
                print("WebSocket is not in an open state. Skipping sending updates.")

            reactor.callLater(2, self.send_updates)  # update every 2 seconds
        except Exception as e:
            print(f"Error in send_updates: {e}")

    def onClose(self, wasClean, code, reason):
        print(f"WebSocket connection closed. Reason: {reason}")
        self.is_connected = False


if __name__ == "__main__":
    try:
        update_cache()
        factory = WebSocketServerFactory("ws://127.0.0.1:5000")
        factory.protocol = MyServerProtocol

        reactor.listenTCP(5000, factory)
        print(f"Server running at {factory.url}")
        reactor.run()
    except Exception as e:
        print(f"Server error: {e}")
