from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
from twisted.internet import reactor
import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

API_ENDPOINT = os.environ.get("API_ENDPOINT")
TOKEN = os.environ.get("TOKEN")
HEADERS = {
    "Authorization": TOKEN
}

requests.packages.urllib3.disable_warnings()


class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print(f"Client connecting: {request.peer}")

    def onOpen(self):
        print("WebSocket connection open.")
        reactor.callLater(0, self.send_updates)

    def send_updates(self):
        try:
            nodes = self.fetch_json_data("/nodes")
            nodes_data = list(map(self.get_node_data, nodes))

            if self.state == WebSocketServerProtocol.STATE_OPEN:
                self.sendMessage(json.dumps(
                    {'data': nodes_data}).encode('utf-8'))
            else:
                print("WebSocket is not in an open state. Skipping sending updates.")

            reactor.callLater(1, self.send_updates)  # repeat once per second
        except Exception as e:
            print(f"Error in send_updates: {e}")
            # Send error feedback to client (optional)
            if self.state == WebSocketServerProtocol.STATE_OPEN:
                self.sendMessage(json.dumps({'error': str(e)}).encode('utf-8'))

    def onClose(self, wasClean, code, reason):
        print(f"WebSocket connection closed. Reason: {reason}")

    def fetch_json_data(self, endpoint):
        try:
            response = requests.get(
                f"{API_ENDPOINT}{endpoint}", headers=HEADERS, verify=False)
            response.raise_for_status()
            return response.json().get("data", {})
        except Exception as e:
            print(f"Error in fetch_json_data for {endpoint}: {e}")
            return {}

    def get_container_data(self, node_name, container):
        container_id = container.get("vmid")
        container_info = self.fetch_json_data(
            f"/nodes/{node_name}/lxc/{container_id}/config")
        container_status = self.fetch_json_data(
            f"/nodes/{node_name}/lxc/{container_id}/status/current")

        return {
            "id": container_id,
            "hostname": container_info.get("hostname"),
            "status": container.get("status"),
            "cpu": container_status.get("cpu", 0),
            "memory_used": int(container_status.get("mem", 0) / (1024 * 1024)),
            "memory_total": int(container_status.get("maxmem", 0) / (1024 * 1024)),
            "netin": container_status.get("netin", 0),
            "netout": container_status.get("netout", 0)
        }

    def get_node_data(self, node):
        node_name = node.get("node")
        node_status = self.fetch_json_data(
            f"/nodes/{node_name}/status")
        containers = self.fetch_json_data(

            f"/nodes/{node_name}/lxc")

        return {
            "name": node_name,
            "cpu": node_status.get('cpu', 0),
            "memory_used": int(node_status.get('mem', 0) / (1024 * 1024)),
            "memory_total": int(node_status.get('maxmem', 0) / (1024 * 1024)),
            "disk": int(node.get("disk") / (1024 * 1024 * 1024)),
            "netin": node_status.get('netin', 0),
            "netout": node_status.get('netout', 0),
            "containers": list(map(lambda container: self.get_container_data(node_name, container), containers))
        }


if __name__ == "__main__":
    try:
        factory = WebSocketServerFactory(u"ws://127.0.0.1:5000")
        factory.protocol = MyServerProtocol

        reactor.listenTCP(5000, factory)
        print(f"Server running at {factory.url}")
        reactor.run()
    except Exception as e:
        print(f"Server error: {e}")
